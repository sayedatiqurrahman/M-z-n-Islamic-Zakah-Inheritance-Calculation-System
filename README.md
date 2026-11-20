# MĪZĀN — Islamic Zakah & Inheritance Calculation System

MĪZĀN (ميزان, "the balance") is an academic, evidence-based Hanafi system for
calculating Zakah and distributing an Islamic inheritance. It explains every
result with its calculation, fiqh principle, reason, evidence and rule
identifier — and it refuses ambiguous cases instead of guessing.

The application is anonymous by default: the calculators, learning center,
history and PDF reports work without an account. Saved calculations are
isolated by an opaque, HTTP-only browser cookie.

> **Academic disclaimer.** This is a thesis project, not a fatwa. Every rule
> carries an explicit verification status and must be reviewed by a qualified
> scholar before being relied upon for legal attestation.

---

## Features

- **Zakah calculator** — starts with money, then classifies cash, bank balances,
  gold, silver, business assets and liabilities; compares net wealth with a
  configurable gold or silver Nisab; evaluates Hawl using a Hijri calendar;
  applies 2.5% only when every documented condition is satisfied. Livestock and
  crops use separately labelled classical in-kind schedules, and the eight
  recipient purposes from Qur'an 9:60 are shown with their sources.
- **Inheritance calculator** — Hanafi fixed shares (`aṣḥāb al-furūḍ`),
  residuary heirs (`ʿaṣabah`), complete/partial exclusion (`ḥajb`), `ʿAwl`,
  `Radd` and `Tashih` corrected bases, with exact BigInt rational arithmetic
  and no floating-point share math. Logical heir caps reject impossible inputs
  (two husbands, five wives, two mothers), and grouped heirs show both group
  and per-individual amounts.
- **Munasakha (مناسخة)** — chain multiple deceased in death order; an heir's
  inherited share passes into their own estate before redistribution. Cases are
  collapsible, the pass-through amount is labelled, and totals separate the
  amount that passes between estates from the amount reaching living heirs.
- **Nisab workspace** — classical weights, live metal valuation and a manual
  valuation mode with a recorded source.
- **Live gold and silver prices** — retrieved by the backend at request time,
  never hard-coded, with original vs updated comparison. The Zakah calculator
  auto-applies each successful quote pair to its Nisab inputs; the Nisab
  workspace can hand prices to it as well.
- **162 world currencies** — searchable dropdown, names fetched online, BDT as
  default, ISO 4217 minor units.
- **Learning center** — 28 structured topics across Zakah, inheritance and
  jurisprudence principles.
- **Calculation history** — view, reopen, delete and export saved work as PDF.
  Saving and PDF export currently accept single-deceased calculations;
  multi-deceased (Munasakha) results are shown for review with a localized
  notice. See `docs/INHERITANCE_CALCULATION.md`.
- **Three languages** — English (default, Poppins), Arabic (RTL, Noto Naskh
  Arabic) and Bangla (Hind Siliguri across the whole app). No runtime i18n
  package: every string lives in one central JSON catalog per language.
- **Dark mode, mobile-first app shell, PWA manifest.**

## Technology

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.4.6 (App Router, Turbopack) |
| Language | TypeScript 5, strict mode |
| UI | React 19.3, Tailwind CSS v4, shadcn/ui, Lucide, Recharts |
| Forms | React Hook Form + Zod 4 |
| Database | PostgreSQL (Neon), Prisma 7.10.1 with `@prisma/adapter-pg` |
| PDF | `pdf-lib` |
| Tests | Vitest 5 |
| Theme | `next-themes` |

## Requirements

- Node.js 22 or newer
- A PostgreSQL 15+ database (Neon works out of the box)
- npm 10+

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure the environment
cp .env.example .env        # then edit DATABASE_URL

# 3. Generate the Prisma client and apply migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Seed madhhabs, methodology version, rules, references and 28 topics
npm run prisma:seed

# 5. Start development
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. For Neon use `?sslmode=require`. |

No API keys are required: live prices use public endpoints (see
[`docs/PRICE_SOURCES.md`](docs/PRICE_SOURCES.md)).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Start the production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run prisma:generate` | Generate the Prisma client into `src/generated/prisma` |
| `npm run prisma:migrate` | Apply committed migrations (`prisma migrate deploy`) |
| `npm run prisma:seed` | Seed rules, references, methodology and learning topics |

## Internationalisation

There is **no translation library**. Each language is a single flat JSON file:

```
src/i18n/messages/en.json   # source of truth
src/i18n/messages/ar.json
src/i18n/messages/bn.json
```

`src/lib/i18n.ts` imports the catalogs, provides `translate(locale, key, vars)`
and falls back to English for a missing key. `src/components/layout/locale-provider.tsx`
exposes `useLocale()` (`t`, `l`, `locale`, `dir`, `setLocale`) and
`useText(namespace)`. The selected locale is stored in `localStorage` under
`mizan-locale` and applied to `<html lang dir data-locale>`.

Adding a string means adding the same key to all three files. The suite in
`tests/i18n.test.ts` enforces key parity, non-empty values and consistent
interpolation placeholders.

Engine-generated explanatory text (calculation steps, refusal reasons) is
intentionally English so that stored calculations remain reproducible and
auditable. All interface chrome and page content are translated.

## Docker

```bash
# Build and run
docker compose up --build -d

# Apply migrations from the host (the runtime image contains no Prisma CLI)
# DATABASE_URL must point to the same database.
npm run prisma:migrate
npm run prisma:seed

# Logs
docker compose logs -f app
```

The image is a multi-stage Node 22 Alpine build using Next.js `output:
"standalone"` and a non-root `nextjs` user. Migrations are deliberately not run
inside the container: run them once per deployment before starting the new
image.

## Project structure

```
prisma/
  schema.prisma              Database schema and enums
  migrations/                Committed SQL migrations
  seed.ts                    Rules, references, methodology, 28 topics
src/
  app/                       App Router pages and API route handlers
  components/                UI (calculators, history, prices, layout, shadcn/ui)
  i18n/messages/             en.json, ar.json, bn.json
  lib/                       rational.ts, formatting.ts, hijri.ts, i18n.ts, pdf/
  modules/
    fiqh/                    Madhhab provider, rules, evidence catalog
    zakah/                   Zakah schemas, rules and pure engine
    inheritance/             Inheritance schemas, rules and pure engine
    prices/                  Backend metal price retrieval and snapshots
    currencies/              Online world currency catalog
    history/                 Anonymous history persistence
tests/                       Vitest suites
docs/                        Methodology and architecture documentation
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layers, request flow, i18n, security
- [`docs/FIQH_METHODOLOGY.md`](docs/FIQH_METHODOLOGY.md) — madhhab handling, versioning, refusal policy
- [`docs/ZAKAH_CALCULATION.md`](docs/ZAKAH_CALCULATION.md) — asset policy, steps, formulas
- [`docs/INHERITANCE_CALCULATION.md`](docs/INHERITANCE_CALCULATION.md) — shares, exclusion, `ʿAwl`, `Radd`, rounding
- [`docs/REFERENCE_VERIFICATION.md`](docs/REFERENCE_VERIFICATION.md) — evidence statuses and verification workflow
- [`docs/DATABASE.md`](docs/DATABASE.md) — models, relations, migrations, anonymous sessions
- [`docs/TESTING.md`](docs/TESTING.md) — automated tests and manual verification checklist
- [`docs/PRICE_SOURCES.md`](docs/PRICE_SOURCES.md) — live price and currency data sources

## License and attribution

Academic thesis project. The application name, methodology version
(`hanafi-v1.0.0`) and every rule identifier are recorded with saved
calculations so results remain reproducible.
