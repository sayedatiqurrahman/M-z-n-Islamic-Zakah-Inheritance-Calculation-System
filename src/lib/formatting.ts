import { format } from "date-fns";
import type { Rational } from "./rational";
import { toNumber } from "./rational";

/** ISO 4217 currencies whose minor unit is not two digits. */
const ISO_DECIMALS: Record<string, number> = {
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0,
  PYG: 0, RWF: 0, UGX: 0, UYI: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
  CLF: 4, UYW: 4,
};

/** Codes used by the built-in forms before the online list arrives. */
export const DEFAULT_CURRENCY = "BDT";

export function isCurrencyCode(code: string | null | undefined): code is string {
  return typeof code === "string" && /^[A-Z]{3}$/.test(code);
}

/** ISO 4217 minor-unit digits for a currency code. */
export function currencyDecimals(code: string): number {
  return ISO_DECIMALS[code] ?? 2;
}

const symbolCache = new Map<string, string>();

/** Narrow symbol derived from platform `Intl` data, e.g. `৳` or `$`. */
export function currencySymbol(code: string): string {
  const cached = symbolCache.get(code);
  if (cached) return cached;

  let symbol = code;
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(1);
    const part = parts.find((item) => item.type === "currency")?.value?.trim();
    if (part) symbol = part;
  } catch {
    symbol = code;
  }

  symbolCache.set(code, symbol);
  return symbol;
}

/** English display name for a currency code, e.g. `Bangladeshi Taka`. */
export function currencyLabel(code: string): string {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code);
    return name && name !== code ? name : code;
  } catch {
    return code;
  }
}

function safeNumberFormat(code: string, value: number, locale = "en-US"): string {
  const decimals = currencyDecimals(code);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
}

/** Format a minor-unit integer as a currency string. */
export function formatMinorUnits(minorUnits: bigint | number, currency: string, locale = "en-US"): string {
  const raw = typeof minorUnits === "bigint" ? Number(minorUnits) : minorUnits;
  if (!Number.isFinite(raw)) return "—";
  return safeNumberFormat(currency, raw / 10 ** currencyDecimals(currency), locale);
}

/** Format a major-unit amount (e.g. 14731.87 BDT) for display. */
export function formatAmount(amount: number | string, currency: string, locale = "en-US"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";
  return safeNumberFormat(currency, value, locale);
}

export function formatPercent(rational: Rational): string {
  return `${(toNumber(rational) * 100).toFixed(2)}%`;
}

export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, "dd MMM yyyy, HH:mm");
}

/** Convert a currency amount to integer minor units for exact math. */
export function toMinorUnits(amount: number | string, currency: string): bigint {
  const factor = 10 ** currencyDecimals(currency);
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) throw new Error("Invalid money amount");
  return BigInt(Math.round(value * factor));
}

export function fromMinorUnits(minorUnits: bigint, currency: string): number {
  return Number(minorUnits) / 10 ** currencyDecimals(currency);
}
