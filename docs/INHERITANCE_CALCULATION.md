# Inheritance Calculation

The inheritance engine is implemented in `src/modules/inheritance/engine.ts`, with rules in `src/modules/inheritance/rules.ts`, exact rational arithmetic in `src/lib/rational.ts`, and request/result contracts in `src/modules/inheritance/schemas.ts` and `src/modules/inheritance/types.ts`.

- **Engine/methodology version:** `sunni-majority-all-heirs-v2.0.0`
- **Methodology basis:** Sunni-majority (Ahl al-Sunnah wa’l-Jamā‘ah)
- **Arithmetic:** `bigint` rationals for share calculations and minor-unit apportionment for currency amounts

The engine covers the heir categories and case patterns encoded in the current rule set. Where a relationship or configuration cannot be represented faithfully, the calculation is refused with a request for scholarly verification.

## Request structure

A standard inheritance request includes:

- `madhhab` and `methodologyVersion` (Sunni-majority basis)
- `currency`
- Deceased details (name, gender, date of death)
- Estate components: gross estate, funeral expenses, debts, bequest (`waṣiyyah`), and other obligations
- Heir consent to a bequest in favour of heirs, where applicable
- A list of heirs with type and count

The implementation also supports munāsakha requests for linked sequential deaths, allowing an eligible heir’s entitlement from an earlier case to be carried into a later case when the required link is provided.

## Estate settlement

Before distribution, the engine applies the settlement sequence recorded in the calculation steps:

1. Start from the gross estate
2. Deduct funeral expenses
3. Deduct debts
4. Deduct the valid portion of any bequest

A bequest is limited to one third of the estate remaining after funeral expenses and debts unless heir consent is explicitly provided. The net distributable estate must be greater than zero for a supported distribution.

## Heir eligibility and exclusion

The engine validates the supplied heirs (including count limits, spouse consistency, and basic structural constraints) and determines eligibility based on the encoded exclusion rules.

- **Complete exclusion (ḥajb ḥirmān):** an heir is fully excluded by a closer or blocking heir
- **Partial exclusion (ḥajb nuqṣān):** an heir remains eligible but receives a reduced share

Exclusions are reported with the causing heir, rule identifier, and explanation. Outcomes distinguish eligible heirs from excluded heirs and preserve the reason for each status.

## Share allocation

Share calculation follows the Sunni-majority sequence implemented in the engine:

1. **Fixed shares (aṣḥāb al-furūḍ):** allocate Qur’anic shares to eligible fixed-share heirs
2. **Residuary allocation (ʿaṣabah):** distribute any remainder to eligible residuary heirs according to the encoded priority and ratios (including 2:1 where applicable within the agnatic residuary group)
3. **Adjustment:** apply `ʿawl`, `radd`, or distant-kindred handling when the case requires it

### ʿAwl

If the sum of fixed shares exceeds the whole estate, the shares are reduced proportionally by increasing the common denominator. The adjustment and resulting fractions are recorded in the output.

### Radd

If fixed shares leave a surplus and no residuary heir is entitled to it, the surplus is returned proportionally to eligible non-spouse quota heirs under the encoded method. Spouse-only surplus cases are refused unless they fall within the supported distant-kindred handling.

### Distant kindred

Distant kindred are considered only in the limited circumstances supported by the current implementation (for example, where no closer eligible heirs take the residue). Cases that require finer relationship distinctions than the supplied input can represent are refused.

### Grandfather with siblings

The engine applies the encoded Zayd ibn Thābit method for supported grandfather-with-siblings configurations. Combinations that are disputed or not safely represented by the current logic are refused and marked for scholarly review.

## Taṣḥīḥ and currency apportionment

After the fractional entitlements are determined, the engine performs taṣḥīḥ to express shares in whole individual parts where necessary. Final monetary amounts are derived by converting the net distributable estate to minor units and apportioning them using a largest-remainder method, so that the distributed total matches the distributable estate exactly.

Each eligible heir or group receives fractional information, individual/group amounts as applicable, and part counts in the final distribution.

## Munāsakha

For sequential deaths, the engine processes cases in order and validates that each linked source case appears before the dependent case. The inherited amount from an eligible heir in an earlier distribution can be added to the later estate and redistributed according to the same calculation rules. Aggregated steps and totals are returned for the full sequence.

## Output

A supported result includes:

- Estate settlement figures and net distributable amount
- Eligible and excluded heir outcomes with reasons and rule references
- Share types, fractions, and adjustment details
- Taṣḥīḥ base and individual/group parts
- Final amounts in the selected currency
- Ordered calculation steps, notes, and source references

Unsupported results include a clear reason and the steps produced before refusal. The engine does not distribute an estate when the governing rule for the case is outside the implemented and verifiable scope.
