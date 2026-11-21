# Testing

Mīzān includes automated unit tests for the core calculation logic and supporting utilities, along with manual checks for flows that depend on the running application, external providers, or document rendering.

## Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run test:watch
npm run build
```

- `typecheck` runs `tsc --noEmit`
- `lint` runs ESLint
- `test` runs Vitest once in a Node environment
- `build` generates the production build

## Automated test suite

Vitest is configured in `vitest.config.ts` with:

- Environment: `node`
- Test files: `tests/**/*.test.ts`
- Path alias: `@` → `src`
- Coverage targets: `src/lib/rational.ts`, `src/lib/hijri.ts`, and `src/modules/**/engine.ts`

Current test files cover:

- **`tests/rational.test.ts`** — normalisation and arithmetic for exact rationals, share-sum cases, largest-remainder apportionment, fraction parsing, and invalid denominator handling
- **`tests/zakah.test.ts`** — nisab and Hawl conditions, monetary Zakah calculation, liability deduction, valuation and refusal cases, in-kind livestock and crop schedules, recipient categories, schema/contract expectations, and nisab defaults
- **`tests/inheritance.test.ts`** — estate settlement and bequest limits, fixed shares and residuary distribution, exclusions, `ʿawl`, `radd`, distant-kindred and grandfather-with-siblings cases, refusal boundaries, taṣḥīḥ and apportionment behaviour, and munāsakha sequencing
- **`tests/i18n.test.ts`** — consistency of locale message catalogs (key coverage, non-empty values, and placeholder alignment across supported locales)

The automated suite focuses on deterministic logic. It does not require a browser, a seeded database, or live network access.

## Manual verification

Some behaviour is best verified in a running application because it depends on rendering, persistence fallbacks, external data sources, or generated documents. Useful manual checks include:

- **Zakah calculator:** asset and liability entry, validation messages and field highlighting, nisab and Hawl inputs, in-kind asset handling, result steps, and recipient display
- **Inheritance calculator:** heir entry, settlement inputs, supported and refused cases, share distribution, and explanatory steps
- **Pricing:** live quote retrieval, currency selection, PKR local-market versus international spot labelling, and fallback/manual-entry behaviour when a provider is unavailable
- **History and drafts:** save/list/detail/delete flows, local draft restoration, local history fallback when the server or database is unavailable, and reopening saved calculations
- **Reports:** PDF generation in English, Arabic, and Bangla, including text rendering, number and symbol legibility, and chart output
- **References and learning content:** display of stored references/evidence, status labels, and external source links
- **Preferences and locale:** language switching, RTL layout for Arabic, theme and currency persistence

When investigating an issue that crosses client, server, and persistence boundaries, it helps to confirm both the automated checks above and the relevant end-to-end flow in the application.
