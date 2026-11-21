# Zakah Calculation

The Zakah engine is implemented in `src/modules/zakah/engine.ts`, with rule definitions in `src/modules/zakah/rules.ts` and request/result contracts in `src/modules/zakah/schemas.ts` and `src/modules/zakah/types.ts`. It is a pure calculation module: prices, dates, conversion rates, and confirmation flags are supplied in the validated request.

- **Engine/methodology version:** `hanafi-zakah-v1.0.0`
- **Monetary Zakah rate:** 2.5%
- **Crop nisab reference:** 653 kg (treated as needing review)

## Request structure

A Zakah request includes:

- `madhhab` and `methodologyVersion`
- `currency`
- Ownership and growth-condition confirmations
- A list of assets (with category-specific fields such as amount, weight, purity, quantity, unit value, conversion rate, and irrigation method where applicable)
- A list of liabilities (type, amount, currency, conversion rate, and whether currently due)
- Nisab information (method, thresholds, gold/silver prices, source, and valuation notes)
- Hawl information (assessment and relevant dates, calendar method, and whether wealth remained above nisab)

Numeric fields are validated and normalised so that invalid or missing values are handled predictably by the schema and form validation.

## Asset handling

Assets are classified according to the policies in `ASSET_POLICIES`.

### Monetary assets

Monetary categories are included in net Zakahable wealth when supported by the applicable policy. These include cash and bank balances, savings, current and foreign currency holdings, eligible digital money, precious metals, and business-related monetary categories such as merchandise, inventory, receivables, and business cash.

Precious metals may be valued from weight and purity using the provided per-gram price, or from an explicit market/amount value when supplied. All included monetary values are converted to the base currency using the provided conversion rate.

### In-kind assets

Livestock and certain crops are assessed under in-kind schedules rather than the flat 2.5% monetary rate. These categories are tracked separately and are not added to monetary wealth. The engine records due quantities (heads or kilograms), schedule details, and an estimated value when a unit value is available.

Supported in-kind categories include:

- Livestock: camels, cattle, goats/sheep
- Crops: wheat, barley, dates, grapes

Livestock schedules define nisab thresholds and tiered dues, with upper limits where the schedule is fully encoded. Crop dues depend on the irrigation method: 10% for rain-fed produce and 5% for irrigated produce. Mixed irrigation and categories without an encoded schedule are refused so that the result is not based on an assumption.

Some categories (such as shares/stocks, other investments, unencoded produce, and minerals/treasure) are not currently calculated by the engine and will produce an unsupported result when they require assessment.

## Liabilities

Liabilities are evaluated against the deduction policy for their type. A liability is deducted only when the policy allows it and it is marked as currently due. Immediate debts and due business liabilities may reduce net Zakahable wealth; long-term loans and non-deductible liabilities are not fully deducted by default. Each liability outcome is recorded with a reason and rule reference.

## Nisab

The nisab threshold is calculated from the selected method:

- **Gold method:** gold nisab grams × gold price per gram
- **Silver method:** silver nisab grams × silver price per gram

Default nisab weights are **87.48 g of gold** and **612.36 g of silver**, based on 7.5 tola and 52.5 tola respectively at 11.664 g per tola. Prices and sources are provided with the request (for example, from the pricing service or a manual entry) and are recorded in the calculation context.

## Hawl

Hawl is evaluated from the supplied assessment and Hawl-related dates together with the confirmation that qualifying wealth remained above nisab for the required period. The engine uses the documented calendar handling provided in the request and records a note where sighting-based practice may differ.

If the supplied information indicates that the Hawl condition is not satisfied under the implemented rule set, the calculation is refused rather than completed with an uncertain assumption.

## Calculation steps

A supported calculation proceeds in ordered steps, which typically include:

1. **Nisab setup** — record the selected method, thresholds, and prices
2. **Asset classification** — determine whether each asset is included, excluded, or assessed in kind
3. **Liability deduction** — identify deductible liabilities and compute their total
4. **Net wealth** — subtract deductible liabilities from included monetary assets
5. **Nisab comparison** — check whether net wealth reaches the nisab threshold
6. **Hawl evaluation** — confirm that the Hawl condition is met
7. **Monetary Zakah** — apply 2.5% to net Zakahable wealth when due
8. **In-kind dues** — calculate livestock and crop dues under their schedules
9. **Totals and recipients** — present monetary and in-kind totals and list the Qur’anic recipient categories (Qur’an 9:60) as informational guidance

Each step includes a title, calculation, result, principle, reason, and related evidence or notes where applicable.

## Output

A supported result reports:

- Classified assets and liabilities
- Nisab value, nisab status, and Hawl status
- Monetary Zakah payable
- In-kind dues (including quantity, rate, and estimated value when available)
- Combined payable total for presentation
- Recipient purposes
- Ordered calculation steps and explanatory notes

Unsupported results include the reason for refusal and any steps that were completed before the calculation stopped. The engine does not invent prices, due quantities, or rulings for cases outside its verified and implemented scope.
