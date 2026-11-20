export type MetalKey = "GOLD" | "SILVER";
export type QuoteBasis = "SPOT" | "LOCAL_MARKET";

/** A previously captured price point, used to show "original" vs "updated". */
export interface PricePoint {
  pricePerGram: number;
  recordedAt: string;
}

export interface PriceChange {
  absolute: number;
  percent: number;
}

export interface MetalQuote {
  metal: MetalKey;
  currency: string;
  /** Current indicative price for one gram of the metal in `currency`. */
  pricePerGram: number;
  /** Provider spot price in USD per troy ounce, before conversion (spot basis only). */
  pricePerOunceUsd: number | null;
  /** USD → requested currency rate used for the conversion (spot basis only). */
  usdToCurrency: number | null;
  /** Whether the quote is an international spot conversion or a local market rate. */
  basis: QuoteBasis;
  /** Human-readable label describing the pricing basis/source context. */
  basisLabel?: string;
  source: string;
  sourceUrl: string;
  /** Timestamp reported by the price provider for the quote. */
  providerUpdatedAt: string;
  /** Timestamp at which this backend response was assembled. */
  fetchedAt: string;
  /** Most recent price captured before this response, if any. */
  previous: PricePoint | null;
  change: PriceChange | null;
}

export interface MetalQuoteError {
  metal: MetalKey;
  message: string;
}

export interface MetalQuotesResponse {
  currency: string;
  quotes: MetalQuote[];
  errors: MetalQuoteError[];
  fetchedAt: string;
  disclaimer: string;
}

export interface AppliedMetalPrices {
  gold: number;
  silver: number;
  source: string;
  sourceUrl: string;
  recordedAt: string;
}
