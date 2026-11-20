import "server-only";
import type { CurrencyListResponse, CurrencyOption } from "./types";

/**
 * World currency list, retrieved online at request time.
 *
 *  1. `@fawazahmed0/currency-api` (served by jsDelivr) supplies English
 *     currency names. It contains ~340 entries, including cryptocurrencies
 *     and obsolete codes.
 *  2. ExchangeRate-API supplies the fiat codes that actually have a live
 *     USD reference rate. Intersecting the two lists removes crypto and
 *     withdrawn currencies, so the dropdown only offers real money.
 *
 * Symbols are derived from the platform `Intl` data (never typed by hand) and
 * minor-unit digits follow ISO 4217. The result is cached in-process for a day.
 */

const NAMES_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json";
const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const SOURCE = "jsDelivr currency-api (names) + ExchangeRate-API (ISO codes)";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;

/** ISO 4217 currencies whose minor unit is not two digits. */
const ISO_DECIMALS: Record<string, number> = {
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0,
  PYG: 0, RWF: 0, UGX: 0, UYI: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
  CLF: 4, UYW: 4,
};

/** Used only when the online providers are unreachable. */
const FALLBACK: Array<[string, string]> = [
  ["BDT", "Bangladeshi Taka"],
  ["USD", "US Dollar"],
  ["EUR", "Euro"],
  ["GBP", "British Pound"],
  ["SAR", "Saudi Riyal"],
  ["AED", "Emirati Dirham"],
  ["INR", "Indian Rupee"],
  ["PKR", "Pakistani Rupee"],
  ["MYR", "Malaysian Ringgit"],
  ["IDR", "Indonesian Rupiah"],
  ["TRY", "Turkish Lira"],
  ["EGP", "Egyptian Pound"],
  ["NGN", "Nigerian Naira"],
  ["ZAR", "South African Rand"],
  ["CAD", "Canadian Dollar"],
  ["AUD", "Australian Dollar"],
  ["JPY", "Japanese Yen"],
  ["CNY", "Chinese Yuan"],
  ["SGD", "Singapore Dollar"],
  ["QAR", "Qatari Riyal"],
  ["KWD", "Kuwaiti Dinar"],
  ["BHD", "Bahraini Dinar"],
  ["OMR", "Omani Rial"],
  ["JOD", "Jordanian Dinar"],
];

/** Codes that are units of account, precious metals or test values, not money. */
const EXCLUDED = new Set([
  "CLF", "FOK", "KID", "XDR", "XXX", "XTS", "XAU", "XAG", "XPT", "XPD", "XSU", "XUA", "UYI", "UYW",
]);

let cache: { data: CurrencyListResponse; expiresAt: number } | null = null;

function decimalsFor(code: string): number {
  return ISO_DECIMALS[code] ?? 2;
}

function symbolFor(code: string): string {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(1);
    const symbol = parts.find((part) => part.type === "currency")?.value?.trim();
    return symbol && symbol !== code ? symbol : code;
  } catch {
    return code;
  }
}

function nameFallback(code: string): string {
  try {
    const display = new Intl.DisplayNames(["en"], { type: "currency" }).of(code);
    return display && display !== code ? display : code;
  } catch {
    return code;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url} responded with HTTP ${response.status}.`);
  return (await response.json()) as T;
}

function buildList(names: Record<string, string>, codes: string[], fetchedAt: string): CurrencyListResponse {
  const unique = [...new Set(codes.map((code) => code.toUpperCase()))].filter(
    (code) => /^[A-Z]{3}$/.test(code) && !EXCLUDED.has(code),
  );

  const currencies: CurrencyOption[] = unique
    .map((code) => {
      const raw = names[code.toLowerCase()];
      const name = typeof raw === "string" && raw.trim() ? raw.trim() : nameFallback(code);
      return { code, name, symbol: symbolFor(code), decimals: decimalsFor(code) };
    })
    .sort((a, b) => {
      if (a.code === "BDT") return -1;
      if (b.code === "BDT") return 1;
      return a.name.localeCompare(b.name, "en");
    });

  return { currencies, count: currencies.length, fetchedAt, source: SOURCE };
}

function fallbackList(fetchedAt: string): CurrencyListResponse {
  const currencies = FALLBACK.map(([code, name]) => ({
    code,
    name,
    symbol: symbolFor(code),
    decimals: decimalsFor(code),
  })).sort((a, b) => (a.code === "BDT" ? -1 : b.code === "BDT" ? 1 : a.name.localeCompare(b.name, "en")));
  return {
    currencies,
    count: currencies.length,
    fetchedAt,
    source: "Built-in fallback list (online providers unreachable)",
  };
}

/** Retrieve the world currency list, using a one-day in-process cache. */
export async function getCurrencies(): Promise<CurrencyListResponse> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;

  const fetchedAt = new Date().toISOString();

  try {
    const [names, rates] = await Promise.all([
      fetchJson<Record<string, string>>(NAMES_URL),
      fetchJson<{ result?: string; rates?: Record<string, number> }>(RATES_URL),
    ]);

    if (rates.result !== "success" || !rates.rates) {
      throw new Error("The exchange-rate provider returned no currency table.");
    }

    const data = buildList(names, Object.keys(rates.rates), fetchedAt);
    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch {
    // Serve a stale cache before falling back to the short built-in list.
    if (cache) return cache.data;
    const data = fallbackList(fetchedAt);
    cache = { data, expiresAt: Date.now() + 5 * 60 * 1000 };
    return data;
  }
}
