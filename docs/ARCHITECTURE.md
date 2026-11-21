# Architecture

Mīzān is a single Next.js application that brings together three parts: deterministic calculation engines, a small HTTP layer around those engines, and a localised interface for entering data, reviewing results, and keeping records.

The main design choice is to keep jurisprudential and mathematical logic in plain TypeScript modules. Route handlers validate requests and return responses, the database stores snapshots and references, and the client handles language, drafts, and history display. The same engine logic is used when a result is calculated on demand, saved, reopened, or rendered into a report.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling and UI:** Tailwind CSS 4, Radix UI primitives, shared UI components in `src/components/ui`
- **Forms and validation:** React Hook Form with Zod schemas
- **Data:** PostgreSQL with Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`)
- **Reports:** `pdf-lib` with `@pdf-lib/fontkit` for locale-aware PDF generation
- **Tests:** Vitest (`node` environment)

## Directory overview

```text
src/
  app/
    layout.tsx                     Root layout, fonts, providers, metadata
    page.tsx                       Home
    dashboard/ zakah/ inheritance/ Main calculator and overview pages
    guide/ references/ history/    Learning, references, and saved records
    settings/ about/ methodology/  Preferences and project information
    api/
      zakah/ inheritance/          Calculation endpoints
      prices/ currencies/          Live pricing and currency data
      history/ settings/           Saved records and preferences
      references/                  Reference data for the UI
      reports/zakah/               PDF report generation
      reports/inheritance/
  components/                      Page views, forms, layout, shared UI
  i18n/messages/                   English, Arabic, and Bangla catalogs
  lib/                             Formatting, i18n helpers, Prisma, sessions,
                                   local persistence, PDF builder
  modules/
    zakah/                         Zakah schema, rules, and engine
    inheritance/                   Inheritance schema, rules, and engine
    fiqh/                          Evidence, topics, madhhab/provider helpers
    prices/ currencies/            External price and currency retrieval
    history/                       Save/list/detail/delete service
prisma/
  schema.prisma                    Data model
  seed.ts                          Seed data for methodologies, rules, references
  migrations/                      Schema history
public/fonts/pdf/                  Bundled fonts used by the PDF builder
tests/                             Unit tests for engines and utilities
```

## Application shell

`src/app/layout.tsx` defines the document shell, metadata, and font variables. The interface uses Poppins for Latin text, Hind Siliguri for Bangla, and Noto Naskh Arabic for Arabic content. Client-side providers are composed in the layout:

- **Theme provider** — light/dark/system theme persisted with the key `mizan-theme`
- **Locale provider** — active language (`en`, `ar`, `bn`), text direction, and translation helpers
- **Tooltip provider** — shared tooltip behavior
- **App shell** — navigation, header controls, language switcher, theme toggle, and live price ticker

Language choice is stored in `localStorage` under `mizan-locale` and applied to the document (`lang`, `dir`, and locale data attribute). Translation catalogs live in `src/i18n/messages/{en,ar,bn}.json` and are loaded statically; missing keys fall back to English.

## Calculation flow

### Zakah

1. The client builds a request that matches `zakahRequestSchema`.
2. `POST /api/zakah` validates the payload, checks that the requested Hanafi provider is enabled, and confirms the methodology version.
3. `calculateZakah` classifies assets and liabilities, evaluates nisab and Hawl, applies the relevant monetary and in-kind rules, and returns either a supported result with ordered steps or an unsupported result with a reason.
4. The response can be shown in the UI, saved to history, or used to generate a PDF.

### Inheritance

1. The client builds a request that matches `inheritanceRequestSchema` (or the munasakha schema for linked sequential cases).
2. `POST /api/inheritance` validates the payload, requires the `SUNNI_MAJORITY` basis, and confirms the methodology version.
3. `calculateInheritance` settles the estate, determines eligibility and exclusions, allocates shares, applies adjustments where required (`ʿawl`, `radd`, or distant kindred handling), performs taṣḥīḥ, and apportions the distributable amount.
4. The result is returned with step-by-step explanations, or refused when the case cannot be represented faithfully by the implemented rules.

Both engines are deterministic. They do not read from the database, call external services, or depend on the current clock except where date values are supplied as input.

## API layer

Route handlers live under `src/app/api` and run in the Node.js runtime.

| Route | Purpose |
| --- | --- |
| `POST /api/zakah` | Validate and calculate a Zakah request |
| `POST /api/inheritance` | Validate and calculate an inheritance (or munasakha) request |
| `GET /api/prices` | Retrieve live gold and silver quotes for a currency |
| `GET /api/currencies` | Retrieve supported currencies and display metadata |
| `GET/POST/DELETE /api/history` | List, save, read, or remove calculation records |
| `GET/PUT /api/settings` | Read and update anonymous preferences |
| `GET /api/references` | Read Qur’anic, hadith, and scholarly reference records |
| `POST /api/reports/zakah` | Generate a Zakah PDF report |
| `POST /api/reports/inheritance` | Generate an inheritance PDF report |

Calculation and report endpoints enforce request validation and methodology checks. Unsupported calculations are not turned into fabricated results; report generation for unsupported cases is rejected.

## Persistence and history

### Anonymous sessions

The server uses an opaque anonymous session cookie (`mizan_sid`) for preferences and saved history when no user account is involved. Cookie handling is implemented in `src/lib/anonymous-session.ts`.

### Database-backed records

`src/modules/history/service.ts` stores calculation snapshots, result summaries, and ordered steps in PostgreSQL through Prisma. Saved records keep the input used for the calculation together with the methodology/version context so that results can be reviewed later.

### Local persistence

To keep the calculators usable when the database or history API is unavailable, the client also maintains browser-side state in `src/lib/local-history.ts`:

- Calculation history (`mizan:history:v1`)
- Zakah and inheritance drafts (`mizan:draft:zakah:v1`, `mizan:draft:inheritance:v1`)
- Local settings (`mizan:settings:v1`, alongside `mizan-currency` and `mizan-nisab-method`)

Local records use stable local identifiers, can be reopened or exported, and are merged with server-backed history when available. Save and delete actions treat the server as best-effort when a local copy exists.

## Pricing and currencies

Pricing logic lives in `src/modules/prices`. For Pakistan Rupees (`PKR`), the service retrieves APGJSA-reported local bullion rates and labels them as local market data. For other currencies, it retrieves international spot prices for gold and silver and converts them using a USD reference exchange rate. Quotes include source details, basis labels, timestamps, and the previous captured value when available.

Snapshot records may be written to the `market_price` table to support change comparisons, but live quote responses are still returned if snapshot storage fails. Currency metadata is served from `src/modules/currencies` with cached responses and a fallback list when upstream providers are unreachable.

## PDF reports

`src/lib/pdf/report.ts` builds locale-aware PDF reports for Zakah and inheritance results. The builder:

- Uses bundled fonts from `public/fonts/pdf/` with remote fallbacks when needed
- Shapes complex scripts with `fontkit` and draws glyph outlines through `pdf-lib`
- Normalises Bengali numerals for consistent display and routes digits/symbols to the Latin font where appropriate
- Includes summary sections, distribution charts, and the full ordered calculation steps
- Preserves the `Mīzān` brand name in report headers

Report routes receive the calculation input and locale, recompute the result, and return a generated PDF attachment.

## Internationalisation

Supported locales are English (`en`), Arabic (`ar`, RTL), and Bangla (`bn`). UI strings come from JSON message catalogs, while some fiqh learning content is provided through structured topic translations. Dates and amounts are formatted with locale-aware helpers in `src/lib/formatting.ts`.

## Security and integrity notes

- Requests are validated with Zod before calculation or persistence.
- Methodology identifiers are checked explicitly; inheritance requests must use the declared Sunni-majority basis.
- External prices are fetched and labelled by basis/source; the application does not fabricate prices or references.
- Anonymous session identifiers are opaque values stored in an HTTP-only cookie.
- Calculation results include verification-sensitive status information and refusal messages where a case cannot be computed responsibly.
