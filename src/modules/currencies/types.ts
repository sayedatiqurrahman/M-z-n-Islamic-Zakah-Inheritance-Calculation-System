/** A single selectable world currency. */
export interface CurrencyOption {
  /** ISO 4217 alphabetic code, e.g. `BDT`. */
  code: string;
  /** English display name, e.g. `Bangladeshi Taka`. */
  name: string;
  /** Narrow display symbol, e.g. `৳`. Falls back to the code. */
  symbol: string;
  /** ISO 4217 minor-unit digits, e.g. `2` for BDT, `0` for JPY. */
  decimals: number;
}

export interface CurrencyListResponse {
  currencies: CurrencyOption[];
  count: number;
  fetchedAt: string;
  /** Human-readable provenance so the UI can state where the list came from. */
  source: string;
}
