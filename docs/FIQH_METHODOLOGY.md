# Fiqh Methodology

Mīzān applies a documented Hanafi methodology to Zakah and a declared Sunni-majority (Ahl al-Sunnah wa’l-Jamā‘ah) methodology to inheritance. The system is designed to make its basis visible: every calculation records a methodology version, rules carry verification statuses, and cases that fall outside the implemented or verifiable scope are refused rather than guessed.

This project is an academic calculation tool. Results are intended to be reproducible and inspectable, not to replace advice from a qualified scholar.

## Methodology identifiers

| Area | Identifier | Where it appears |
| --- | --- | --- |
| Zakah methodology record | `hanafi-v1.0.0` | Seeded methodology version |
| Zakah engine version | `hanafi-zakah-v1.0.0` | Requests, results, saved records |
| Inheritance methodology record | `sunni-majority-all-heirs-v2.0.0` | Seeded methodology version |
| Inheritance engine version | `sunni-majority-all-heirs-v2.0.0` | Requests, results, saved records |

Calculation endpoints require the expected methodology version for the relevant domain. Inheritance requests must also declare the Sunni-majority basis accepted by the current implementation.

## Zakah basis

Zakah calculations follow the Hanafi rules encoded in `src/modules/zakah/rules.ts` and executed by `src/modules/zakah/engine.ts`. The implementation covers monetary Zakah, selected in-kind asset schedules, nisab comparison, Hawl evaluation, deductible liabilities, and the presentation of Qur’anic recipient categories.

Asset and liability treatment is policy-driven. Each category is marked with a rule identifier, reasoning, and verification status. Categories that are not supported by a verified rule, or cases that cannot be evaluated safely from the supplied information, return an unsupported result with an explanation.

## Inheritance basis

Inheritance calculations follow the Sunni-majority implementation in `src/modules/inheritance/rules.ts` and `src/modules/inheritance/engine.ts`. The engine computes fixed shares, residuary allocation, exclusions, proportional reduction (`ʿawl`), return of surplus (`radd`), and limited distant-kindred handling according to the encoded rules. It also supports taṣḥīḥ (correction of shares into whole individual parts) and sequential munāsakha cases where the required links are provided.

The following classical works are recorded as source references for the inheritance methodology: *al-Sirājiyyah*, *al-Hidāyah*, *al-Fatāwā al-Hindiyyah*, *al-Mughnī*, and *al-Majmūʿ*. These references are part of the documented basis of the implementation and are presented with their verification status.

Ambiguous relationships, disputed configurations, and cases not faithfully represented by the current rules are refused. The system does not attempt to approximate a distribution for such cases.

## Evidence and verification

Jurisprudential evidence and explanatory material are maintained in code and in the database:

- `src/modules/fiqh/evidences/catalog.ts` — curated Qur’anic, hadith, classical, and institutional evidence entries
- `src/modules/zakah/rules.ts` and `src/modules/inheritance/rules.ts` — rule registries used by the engines
- `prisma/seed.ts` — seeded rules, references, evidence records, and learning topics
- `/references` and `GET /api/references` — reference records exposed for review in the application

Each evidence or rule entry carries a verification status so that implemented, reviewed, and pending material can be distinguished.

| Status | Meaning | Use in calculations |
| --- | --- | --- |
| `VERIFIED_BY_SCHOLAR` | Checked and approved by a qualified scholar with traceable citation details | May be used and described as verified |
| `REFERENCE_REQUIRED` | Based on a recognised source, but citation details still need confirmation | May be used where implemented, with status shown |
| `NEEDS_REVIEW` | Sensitive, disputed, or requiring further scholarly review | May be used only with clear status and caution |
| `UNVERIFIED` | Not established for use as a settled rule | Must not be treated as a reliable basis for calculation |

## Refusal policy

When the engine cannot produce a dependable result, it returns an unsupported outcome with a clear reason and the steps completed so far. Typical reasons include unsupported or unverified asset categories, missing information required by a rule, Hawl conditions that cannot be confirmed under the current logic, mixed or unencoded in-kind schedules, inheritance relationships outside the supported model, and disputed configurations that require scholarly judgement.

This refusal behaviour is intentional. A partial or approximate answer would be less reliable than an explicit statement that review is required.

## Limits and responsibility

- The application does not issue fatwas or personalised legal rulings.
- References, translations, and bibliographic details that are not fully confirmed remain marked accordingly.
- Contemporary matters such as complex investments or disputed inheritance scenarios may require direct scholarly guidance even when related categories appear in the interface.
- Any change to a rule or methodology should be accompanied by a version change and updated documentation.
