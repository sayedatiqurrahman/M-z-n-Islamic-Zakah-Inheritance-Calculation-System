export type MetalKey = "GOLD" | "SILVER";

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
  /** Provider spot price in USD per troy ounce, before conversion. */
  pricePerOunceUsd: number;
  /** USD → requested currency rate used for the conversion. */
  usdToCurrency: number;
  source: string;
  sourceUrl: string;
  /** Timestamp reported by the price provider for the spot quote. */
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
