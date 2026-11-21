# Price Sources

Mīzān retrieves metal prices from the server at request time and records the source and basis of each quote. The application does not embed fixed gold or silver prices, and calculation inputs can still be completed manually when a live quote is unavailable.

Implementation: `src/modules/prices/service.ts`, `src/modules/prices/types.ts`, `src/app/api/prices/route.ts`

## Pricing basis by currency

| Currency context | Basis | Source | Notes |
| --- | --- | --- | --- |
| `PKR` | `LOCAL_MARKET` | Hamariweb pages reporting APGJSA market rates (gold and silver) | Intended to reflect local bullion pricing used in Pakistan; labelled separately from international spot |
| Other supported currencies | `SPOT` | Gold API spot prices for XAU/XAG plus ExchangeRate-API USD reference rates | Spot prices converted to the requested currency and presented as indicative |

Source endpoints used by the service:

- Gold (PKR local market): `https://hamariweb.com/finance/gold_rate/`
- Silver (PKR local market): `https://hamariweb.com/finance/silver_rate/`
- Gold spot: `https://api.gold-api.com/price/XAU`
- Silver spot: `https://api.gold-api.com/price/XAG`
- USD exchange rates: `https://open.er-api.com/v6/latest/USD`

## Conversion and parsing

- **Spot quotes:** XAU/XAG spot prices are provided in USD per troy ounce and converted to per-gram values (`31.1034768 g` per troy ounce), then converted to the target currency using the USD reference rate.
- **PKR local quotes:** the service parses published per-gram (or per-10-gram, normalised to per gram) rates for 24K gold and silver from the provider pages and records the provider update time when it can be determined.
- **Precision:** returned per-gram values are rounded for display and storage consistency.

## Caching and snapshots

- External fetches use request timeouts and short revalidation windows appropriate to the provider (spot and FX responses are cached briefly; PKR market pages are revalidated on a short interval).
- The prices API responds with `Cache-Control: no-store`.
- When possible, the service reads the previous `MarketPrice` record and stores a new snapshot in the database. Snapshot writes are throttled (minimum interval and minimum relative change thresholds) and treated as best-effort so that a storage issue does not prevent a live quote response.
- Responses may include the previous captured value and the change from that value.

## Response fields and disclaimers

Each metal quote includes, where applicable:

- Metal and currency
- Per-gram price
- Pricing basis and basis label (`LOCAL_MARKET` or `SPOT`)
- Source name and source URL
- Provider update time and fetch time
- Previous snapshot and price change information
- Spot-only fields such as USD/oz price and USD-to-currency rate

Disclaimers differ by basis:

- **Local market (PKR):** rates are indicative APGJSA-reported market values; actual dealer prices, charges, taxes, and purity differences may vary
- **International spot:** prices are indicative spot values converted with a reference exchange rate and do not include local premiums, making charges, taxes, or purity differences

Users should confirm the price they actually pay or receive before relying on a calculated Zakah amount.

## Currency data

Currency options are provided by `src/modules/currencies/service.ts` and `GET /api/currencies`.

- Currency names and live rate coverage are derived from external currency data sources
- The service intersects available currencies with those that have live USD reference rates and excludes non-fiat/test/metal-like codes not intended for selection
- Display symbols and decimal precision are derived from locale/currency metadata with sensible overrides
- Results are cached in memory and the API returns cache headers suitable for reuse
- If upstream providers are unavailable, the service falls back to a built-in currency list

## Manual and recorded prices

Zakah inputs can carry a manually entered or otherwise recorded nisab price and source. This allows calculations and reports to proceed when live pricing is unavailable or when a user needs to record a specific verified price for their context. Manual values are treated as user- or operator-supplied data and should be accompanied by an appropriate source note.
