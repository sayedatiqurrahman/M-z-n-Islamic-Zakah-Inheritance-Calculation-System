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
 * The application never invents a price. Quotes are fetched at request time:
 *
 *  - PKR: Pakistan local market rates (APGJSA-reported) from Hamariweb, which
 *    better reflect the bullion prices used locally for zakah.
 *  - Other currencies: international spot XAU/XAG (Gold API) converted with a
 *    USD reference exchange rate (ExchangeRate-API).
 *
 * The previous capture is read from `market_price`, and the new capture is
 * stored so the next visit can show "original vs updated". If a provider is
 * unavailable the caller receives an error and the UI falls back to manual
 * price entry.
 */

const TROY_OUNCE_GRAMS = 31.1034768;
const METAL_SYMBOL: Record<MetalKey, "XAU" | "XAG"> = { GOLD: "XAU", SILVER: "XAG" };
const GOLD_API_BASE = "https://api.gold-api.com/price";
const FX_API_URL = "https://open.er-api.com/v6/latest/USD";
const GOLD_API_SOURCE = "Gold API spot (XAU/XAG) + ExchangeRate-API";
const GOLD_API_SOURCE_URL = "https://gold-api.com/";
const PAK_GOLD_SOURCE = "Hamariweb — APGJSA market rates (Pakistan)";
const PAK_GOLD_SOURCE_URL = "https://hamariweb.com/finance/gold_rate/";
const PAK_SILVER_SOURCE_URL = "https://hamariweb.com/finance/silver_rate/";
const SNAPSHOT_MIN_INTERVAL_MS = 5 * 60 * 1000;
const SNAPSHOT_CHANGE_THRESHOLD = 0.001;
const REQUEST_TIMEOUT_MS = 12_000;

const SPOT_DISCLAIMER =
  "Indicative spot prices only. They are converted to your currency with a daily reference exchange rate and do not include local dealer premiums, making charges, taxes or purity differences. Always verify the price you actually pay or receive before calculating Zakah.";
const LOCAL_DISCLAIMER =
  "Indicative local market rates for Pakistan (as reported by APGJSA). Actual dealer prices, making charges, taxes and purity differences may vary. Always verify the price you actually pay or receive before calculating Zakah.";

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

async function fetchText(url: string, revalidateSeconds: number): Promise<string> {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,text/plain,*/*",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Price provider responded with HTTP ${response.status}.`);
  }
  return await response.text();
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error("Invalid numeric value.");
  return n;
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

function parsePakistanGoldPerGram(text: string): number {
  const tenGram = text.match(/24K\s*-\s*10\s*Gram[\s\S]{0,160}?Rs\.?\s*([\d,]+(?:\.\d+)?)/i);
  if (tenGram) return parseNumber(tenGram[1]) / 10;
  const perGram = text.match(/24K[\s\S]{0,120}?1\s*Gram[\s\S]{0,120}?Rs\.?\s*([\d,]+(?:\.\d+)?)/i);
  if (perGram) return parseNumber(perGram[1]);
  throw new Error("Pakistan gold market rate could not be parsed.");
}

function parsePakistanSilverPerGram(text: string): number {
  const perGram = text.match(/1\s*-\s*Gram[\s\S]{0,160}?Rs\.?\s*([\d,]+(?:\.\d+)?)/i);
  if (perGram) return parseNumber(perGram[1]);
  const tenGram = text.match(/10\s*-\s*Grams?[\s\S]{0,160}?Rs\.?\s*([\d,]+(?:\.\d+)?)/i);
  if (tenGram) return parseNumber(tenGram[1]) / 10;
  throw new Error("Pakistan silver market rate could not be parsed.");
}

function parsePakistanUpdatedAt(text: string): string {
  const match = text.match(/Updated[^\n\r]*PKT/i);
  if (!match) return new Date().toISOString();
  const parsed = Date.parse(match[0].replace(/^Updated\s*(on)?\s*/i, "").trim());
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

async function fetchPakistanLocalQuote(
  metal: MetalKey,
): Promise<{ pricePerGram: number; updatedAt: string }> {
  const slug = metal === "GOLD" ? "gold_rate" : "silver_rate";
  const urls = [
    `https://r.jina.ai/http://hamariweb.com/finance/${slug}/`,
    `https://hamariweb.com/finance/${slug}/`,
    `https://r.jina.ai/https://hamariweb.com/finance/${slug}/`,
  ];
  let lastError: unknown;
  for (const url of urls) {
    try {
      const text = await fetchText(url, 300);
      if (/just a moment/i.test(text) || text.length < 200) {
        throw new Error("Blocked by challenge page.");
      }
      const pricePerGram =
        metal === "GOLD" ? parsePakistanGoldPerGram(text) : parsePakistanSilverPerGram(text);
      if (!Number.isFinite(pricePerGram) || pricePerGram <= 0) {
        throw new Error("Parsed an invalid local market rate.");
      }
      return { pricePerGram, updatedAt: parsePakistanUpdatedAt(text) };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Pakistan local market rates are currently unavailable.");
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
  source: string,
  sourceUrl: string,
): Promise<void> {
  const previousAge = previous ? Date.now() - new Date(previous.recordedAt).getTime() : Number.POSITIVE_INFINITY;
  const relativeChange =
    previous && previous.pricePerGram > 0
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
        source,
        sourceUrl,
        isManual: false,
      },
    });
  } catch {
    // Price capture is best-effort; the live quote is still returned.
  }
}

async function getSpotMetalQuote(metal: MetalKey, currency: string): Promise<MetalQuote> {
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

  await recordPrice(metal, currency, pricePerGram, previous, GOLD_API_SOURCE, GOLD_API_SOURCE_URL);

  return {
    metal,
    currency,
    pricePerGram,
    pricePerOunceUsd: round(spot.pricePerOunceUsd, 2),
    usdToCurrency: round(fx.rate, 6),
    basis: "SPOT",
    basisLabel: "International spot (USD/oz) converted via USD reference rate",
    source: GOLD_API_SOURCE,
    sourceUrl: GOLD_API_SOURCE_URL,
    providerUpdatedAt: spot.updatedAt,
    fetchedAt: new Date().toISOString(),
    previous,
    change,
  };
}

async function getPakistanMetalQuote(metal: MetalKey): Promise<MetalQuote> {
  const currency = "PKR";
  const [local, previous] = await Promise.all([
    fetchPakistanLocalQuote(metal),
    readPrevious(metal, currency),
  ]);

  const pricePerGram = round(local.pricePerGram, 4);
  const change =
    previous && previous.pricePerGram > 0
      ? {
          absolute: round(pricePerGram - previous.pricePerGram, 4),
          percent: round(((pricePerGram - previous.pricePerGram) / previous.pricePerGram) * 100, 2),
        }
      : null;

  const sourceUrl = metal === "GOLD" ? PAK_GOLD_SOURCE_URL : PAK_SILVER_SOURCE_URL;
  await recordPrice(metal, currency, pricePerGram, previous, PAK_GOLD_SOURCE, sourceUrl);

  return {
    metal,
    currency,
    pricePerGram,
    pricePerOunceUsd: null,
    usdToCurrency: null,
    basis: "LOCAL_MARKET",
    basisLabel: "Pakistan local market (APGJSA-reported, 24K/pure per gram)",
    source: PAK_GOLD_SOURCE,
    sourceUrl,
    providerUpdatedAt: local.updatedAt,
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
  const useLocal = currency === "PKR";
  const settled = await Promise.allSettled(
    metals.map((metal) => (useLocal ? getPakistanMetalQuote(metal) : getSpotMetalQuote(metal, currency))),
  );

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
    disclaimer: useLocal ? LOCAL_DISCLAIMER : SPOT_DISCLAIMER,
  };
}
