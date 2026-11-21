# Database

Mīzān uses PostgreSQL with Prisma for persistent data. The schema is defined in `prisma/schema.prisma`, migrations are stored in `prisma/migrations/`, and the generated Prisma client is emitted to `src/generated/prisma`.

## Configuration

- **ORM:** Prisma 7 with the PostgreSQL adapter (`@prisma/adapter-pg`)
- **Runtime client:** `src/lib/prisma.ts` creates a singleton Prisma client using `DATABASE_URL`
- **Seed script:** `prisma/seed.ts` populates madhhabs, methodology versions, fiqh rules, references, evidence, topics, and default nisab configuration
- **Prisma config:** `prisma.config.ts` points to the schema, migrations directory, and seed command

## Design goals

- **Reproducibility:** saved calculations keep their input snapshot, methodology/version context, and ordered steps
- **Auditability:** rules, references, evidence, and verification statuses are stored as structured records
- **Anonymous use:** records can be associated with an opaque anonymous session identifier without requiring a user account
- **Extensibility:** the schema includes support for multiple madhhabs, versioned methodologies, and optional user accounts

## Core areas of the schema

### Jurisprudence and methodology

- **`Madhhab`** — supported schools/bases and whether they are enabled
- **`MethodologyVersion`** — versioned methodology records per madhhab, including the active version
- **`FiqhRule`** — stable rule records with domain, verification/implementation status, notes, and links to evidence and steps
- **`FiqhExplanation` / `FiqhTopic`** — explanatory and learning content
- **`Reference`, `QuranicEvidence`, `HadithEvidence`** — stored reference material and evidence entries
- **`NisabConfiguration`** — configurable nisab weights and rationale per methodology version

### Pricing

- **`MarketPrice`** — captured metal price snapshots (metal, currency, per-gram price, source, source URL, manual flag, timestamps)

These snapshots support comparisons between previously captured and newly retrieved prices. Live quote retrieval can still succeed if snapshot writes fail.

### Preferences and sessions

- **`User` / `UserProfile`** — account-related records (available for future authenticated use)
- **`AnonymousPreference`** — locale, currency, and nisab-method preferences keyed by anonymous session identifier

The application also uses an HTTP-only anonymous session cookie to resolve the current anonymous identifier for history and settings operations.

### Zakah records

- **`ZakahCalculation`** — saved calculation metadata, input snapshot, methodology/version, dates, currency, optional unsupported reason
- **`ZakahAsset`** — classified asset rows with category, values, inclusion status, and rule/reason
- **`ZakahLiability`** — liability rows with type, deductibility, values, and rule/reason
- **`ZakahResult`** — summary totals, nisab/Hawl status, rate, and payable amount
- **`CalculationStep`** — ordered explanation steps linked by owner type

### Inheritance records

- **`InheritanceCase`** — saved case metadata, input snapshot, methodology/version, currency, optional unsupported reason
- **`DeceasedPerson`** — deceased details and estate settlement inputs
- **`Heir`** — heir type/count/status, exclusion details, and reasoning
- **`InheritanceResult`** — distributable totals, adjustment type, and base denominator
- **`InheritanceShare`** — per-heir share data and final amounts
- **`CalculationStep`** — ordered explanation steps linked by owner type

## Important enums and relationships

The schema includes enums for madhhab keys, verification and implementation statuses, evidence types, asset and liability categories, heir types/statuses, share and adjustment types, Hawl status, locales, and other domain-specific values.

Notable relationships:

- A `Madhhab` has many `MethodologyVersion`, `FiqhRule`, and calculation records
- A `MethodologyVersion` groups rules, nisab configurations, and calculations
- `CalculationStep.ruleId` refers to the human-readable `FiqhRule.ruleId` natural key when a matching rule exists
- Zakah and inheritance calculations can belong to a user or to an anonymous session identifier

## Migrations

Migration history in `prisma/migrations/` records schema evolution, including the initial schema, anonymous/session-related history support, calculation-step rule linkage by natural key, additional Zakah in-kind asset categories, and the Sunni-majority inheritance basis.

## Notes on local and server history

Server-side history is stored in the database and scoped by anonymous session (or user, where applicable). The client also maintains local browser history and drafts as a resilience measure when server persistence is unavailable; those local records are not database rows unless they are later saved through the API.
