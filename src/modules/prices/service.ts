import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  MetalKey,
  MetalQuote,
  MetalQuoteError,
  MetalQuotesResponse,
  PricePoint,
} from "./types";

/**
 * Live metal price retrieval.
 *
 * The application never invents a price. A request to this service asks two
 * public providers for data at that moment:
 *
 *  1. Gold API (https://gold-api.com) — spot XAU/XAG in USD per troy ounce.
 *  2. ExchangeRate-API (https://www.exchangerate-api.com) — USD → local
 *     currency reference rate.
 *
 * The quote is converted to a price per gram, the previous capture is read
 * from `market_price`, and the new capture is stored so the next visit can
 * show "original vs updated". If a provider is unavailable the caller receives
 * an error and the UI falls back to manual price entry.
 */

const TROY_OUNCE_GRAMS = 31.1034768;
const METAL_SYMBOL: Record<MetalKey, "XAU" | "XAG"> = { GOLD: "XAU", SILVER: "XAG" };
const GOLD_API_BASE = "https://api.gold-api.com/price";
const FX_API_URL = "https://open.er-api.com/v6/latest/USD";
const GOLD_API_SOURCE = "Gold API spot (XAU/XAG) + ExchangeRate-API";
const GOLD_API_SOURCE_URL = "https://gold-api.com/";
const SNAPSHOT_MIN_INTERVAL_MS = 5 * 60 * 1000;
const SNAPSHOT_CHANGE_THRESHOLD = 0.001;
const REQUEST_TIMEOUT_MS = 12_000;

const DISCLAIMER =
  "Indicative spot prices only. They are converted to your currency with a daily reference exchange rate and do not include local dealer premiums, making charges, taxes or purity differences. Always verify the price you actually pay or receive before calculating Zakah.";

function round(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function fetchJson<T>(url: string, revalidateSeconds: number): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Price provider responded with HTTP ${response.status}.`);
  }
  return (await response.json()) as T;
}

interface GoldApiResponse {
  price?: number;
  updatedAt?: string;
}

interface ExchangeRateResponse {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
}

async function fetchSpot(metal: MetalKey): Promise<{ pricePerOunceUsd: number; updatedAt: string }> {
  const data = await fetchJson<GoldApiResponse>(`${GOLD_API_BASE}/${METAL_SYMBOL[metal]}`, 60);
  if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price <= 0) {
    throw new Error("The price provider returned an invalid spot quote.");
  }
  return {
    pricePerOunceUsd: data.price,
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

async function fetchUsdRate(currency: string): Promise<{ rate: number; updatedAt: string }> {
  if (currency === "USD") {
    return { rate: 1, updatedAt: new Date().toISOString() };
  }
  const data = await fetchJson<ExchangeRateResponse>(FX_API_URL, 3600);
  const rate = data.rates?.[currency];
  if (data.result !== "success" || typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`No exchange rate is available for ${currency}.`);
  }
  return { rate, updatedAt: data.time_last_update_utc ?? new Date().toISOString() };
}

async function readPrevious(metal: MetalKey, currency: string): Promise<PricePoint | null> {
  try {
    const row = await prisma.marketPrice.findFirst({
      where: { metal, currency },
      orderBy: { recordedAt: "desc" },
    });
    if (!row) return null;
    return {
      pricePerGram: Number(row.pricePerGram),
      recordedAt: row.recordedAt.toISOString(),
    };
  } catch {
    // A missing snapshot must never break a live price response.
    return null;
  }
}

async function recordPrice(
  metal: MetalKey,
  currency: string,
  pricePerGram: number,
  previous: PricePoint | null,
): Promise<void> {
  const previousAge = previous ? Date.now() - new Date(previous.recordedAt).getTime() : Number.POSITIVE_INFINITY;
  const relativeChange = previous && previous.pricePerGram > 0
    ? Math.abs(previous.pricePerGram - pricePerGram) / previous.pricePerGram
    : Number.POSITIVE_INFINITY;

  if (previous && previousAge < SNAPSHOT_MIN_INTERVAL_MS && relativeChange < SNAPSHOT_CHANGE_THRESHOLD) {
    return;
  }

  try {
    await prisma.marketPrice.create({
      data: {
        metal,
        pricePerGram,
        currency,
        source: GOLD_API_SOURCE,
        sourceUrl: GOLD_API_SOURCE_URL,
        isManual: false,
      },
    });
  } catch {
    // Price capture is best-effort; the live quote is still returned.
  }
}

async function getMetalQuote(metal: MetalKey, currency: string): Promise<MetalQuote> {
  const [spot, fx, previous] = await Promise.all([
    fetchSpot(metal),
    fetchUsdRate(currency),
    readPrevious(metal, currency),
  ]);

  const pricePerGram = round((spot.pricePerOunceUsd / TROY_OUNCE_GRAMS) * fx.rate, 4);
  const change =
    previous && previous.pricePerGram > 0
      ? {
          absolute: round(pricePerGram - previous.pricePerGram, 4),
          percent: round(((pricePerGram - previous.pricePerGram) / previous.pricePerGram) * 100, 2),
        }
      : null;

  await recordPrice(metal, currency, pricePerGram, previous);

  return {
    metal,
    currency,
    pricePerGram,
    pricePerOunceUsd: round(spot.pricePerOunceUsd, 2),
    usdToCurrency: round(fx.rate, 6),
    source: GOLD_API_SOURCE,
    sourceUrl: GOLD_API_SOURCE_URL,
    providerUpdatedAt: spot.updatedAt,
    fetchedAt: new Date().toISOString(),
    previous,
    change,
  };
}

/**
 * Retrieve both gold and silver in the requested currency. One failed provider
 * call does not hide the other metal; the response reports partial errors.
 */
export async function getMetalQuotes(currency: string): Promise<MetalQuotesResponse> {
  const metals: MetalKey[] = ["GOLD", "SILVER"];
  const settled = await Promise.allSettled(metals.map((metal) => getMetalQuote(metal, currency)));

  const quotes: MetalQuote[] = [];
  const errors: MetalQuoteError[] = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      quotes.push(result.value);
    } else {
      errors.push({
        metal: metals[index],
        message:
          result.reason instanceof Error
            ? result.reason.message
            : "The price provider is currently unavailable.",
      });
    }
  });

  if (quotes.length === 0) {
    throw new Error(errors[0]?.message ?? "Live metal prices are currently unavailable.");
  }

  return {
    currency,
    quotes,
    errors,
    fetchedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}
