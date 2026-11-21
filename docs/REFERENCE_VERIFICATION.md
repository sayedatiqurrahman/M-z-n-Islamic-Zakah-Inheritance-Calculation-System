# Reference Verification

Mīzān treats references and evidence as part of the calculation record, not as decoration. A ruling, verse, hadith, source citation, or price source should be traceable to a maintained entry, and any detail that has not been confirmed should remain marked as such.

The application does not fabricate hadith numbers, page numbers, editions, prices, or scholarly approvals. Where a specific bibliographic detail is unknown, the entry records that limitation instead of filling the gap.

## Where references are maintained

| Source | Purpose |
| --- | --- |
| `src/modules/fiqh/evidences/catalog.ts` | Curated evidence entries with labels, excerpts/translations where provided, source links, and verification statuses |
| `src/modules/zakah/rules.ts` | Zakah rule registry, policies, schedules, and linked evidence |
| `src/modules/inheritance/rules.ts` | Inheritance rule registry and recorded source books |
| `src/modules/fiqh/topic-translations.ts` | Localised explanatory content for learning topics |
| `prisma/seed.ts` | Seeds rules, references, Qur’anic/hadith evidence records, and topics into the database |
| `/references` and `GET /api/references` | Reference material exposed for review in the interface |

## Verification statuses

| Status | Meaning | Practical effect |
| --- | --- | --- |
| `VERIFIED_BY_SCHOLAR` | Reviewed and approved by a qualified scholar with traceable citation details | May be presented as verified |
| `REFERENCE_REQUIRED` | Drawn from a recognised source, but specific citation details still need confirmation | May be used where implemented, with status visible |
| `NEEDS_REVIEW` | Disputed, sensitive, or dependent on further scholarly review | Must be shown with caution; not treated as settled |
| `UNVERIFIED` | Not established as a reliable basis for the stated purpose | Must not be relied on as a settled calculation rule |

Authenticity labels for hadith material (such as ṣaḥīḥ, ḥasan, ḍa‘īf, disputed, or unverified) are recorded separately where relevant. An unverified or disputed narration must not be presented as established evidence.

## What reviewers should check

Before treating a rule or reference as settled, a reviewer should confirm:

1. **Identity of the source** — the work, collection, or institution is correctly named
2. **Specific location** — edition, volume, page, chapter, hadith number, or passage as applicable
3. **Text and translation** — wording is accurate and the translation is properly attributed
4. **Relevance** — the source actually supports the rule or explanation attached to it
5. **Status** — the recorded verification status matches the level of review completed
6. **Implementation link** — the engine rule or explanatory text that depends on the reference is consistent with it

For Qur’anic passages, the Arabic text and translation should be checked against a verified mushaf and a credited translation. For hadith, chains and grading require scholarly review before a narration is treated as authentic evidence, and links should point to the most specific relevant source location available.

## Updating references

When a reference is corrected or confirmed:

- Update the maintained source (catalog, rule registry, seed data, or topic content) as appropriate
- Keep the change specific: add the confirmed edition/page/number or link rather than broad claims
- Adjust the verification status only when the supporting review justifies it
- Re-seed or migrate data if the database-backed reference records must reflect the change
- Review any calculation steps, notes, or UI text that cite the affected reference

If a reference cannot be confirmed, it is better to keep it marked for review than to present incomplete information as certain.
