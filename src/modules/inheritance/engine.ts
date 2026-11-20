import {
  add,
  apportion,
  div,
  mul,
  rational,
  RATIONAL_ONE,
  RATIONAL_ZERO,
  sub,
  sum,
  toString as fractionToString,
  type Rational,
} from "@/lib/rational";
import { fromMinorUnits, toMinorUnits } from "@/lib/formatting";
import { unsupported, type CalculationStepData } from "@/modules/fiqh/types";
import {
  HEIR_MAX_COUNTS,
  INHERITANCE_METHODOLOGY_VERSION,
  INHERITANCE_RULES,
  INHERITANCE_SOURCE_BOOKS,
  UNSUPPORTED_HEIR_TYPES,
} from "./rules";
import type {
  AdjustmentType,
  ExclusionKind,
  HeirOutcome,
  HeirType,
  InheritanceCalculationInput,
  InheritanceCalculationResult,
  InheritanceEngineResult,
  MunasakhaCalculationInput,
  MunasakhaCaseResult,
  MunasakhaEngineResult,
  SerializedFraction,
  ShareType,
  TashihPart,
  TashihResult,
} from "./types";

interface AllocatedHeir {
  type: HeirType;
  count: number;
  fraction: Rational;
  shareType: ShareType;
  ruleId: string;
  reason: string;
  /** Relative weight of one individual inside a residuary group (2:1 agnatic ratio). */
  residuaryWeight?: number;
}

interface ExcludedHeir {
  type: HeirType;
  count: number;
  kind: ExclusionKind;
  excludedBy?: HeirType;
  reason: string;
  ruleId: string;
}

/** Lower-ranked agnatic residuaries are excluded by the first present rank. */
const AGNATIC_RANKS: HeirType[][] = [
  ["SON", "SONS_SON"],
  ["FATHER"],
  ["PATERNAL_GRANDFATHER"],
  ["FULL_BROTHER"],
  ["PATERNAL_BROTHER"],
  ["FULL_BROTHERS_SON"],
  ["PATERNAL_BROTHERS_SON"],
  ["FULL_PATERNAL_UNCLE"],
  ["PATERNAL_UNCLE"],
  ["OTHER_AGNATIC"],
];

const MATERNAL_SIBLINGS: HeirType[] = ["MATERNAL_BROTHER", "MATERNAL_SISTER"];
const FULL_SIBLINGS: HeirType[] = ["FULL_BROTHER", "FULL_SISTER"];
const PATERNAL_SIBLINGS: HeirType[] = ["PATERNAL_BROTHER", "PATERNAL_SISTER"];

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x === 0n ? 1n : x;
}

function lcm(a: bigint, b: bigint): bigint {
  return (a / gcd(a, b)) * b;
}

function commonDenominator(values: readonly Rational[]): bigint {
  return values.reduce((acc, value) => lcm(acc, value.d), 1n);
}

function serializeFraction(value: Rational): SerializedFraction {
  return { numerator: value.n.toString(), denominator: value.d.toString() };
}

/** Split a group amount into per-individual amounts, keeping the total exact. */
function splitEvenly(totalMinor: bigint, count: number): bigint[] {
  const n = BigInt(count);
  const base = totalMinor / n;
  const remainder = totalMinor - base * n;
  return Array.from({ length: count }, (_, index) => (BigInt(index) < remainder ? base + 1n : base));
}

function gcdBig(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x === 0n ? 1n : x;
}

/**
 * Sunni-majority (Ahl al-Sunnah wa'l-Jamā'ah) inheritance engine.
 *
 * The operational sequence is fixed shares → agnatic residuaries → Radd →
 * distant kindred → public treasury. Combinations that cannot be represented
 * faithfully by the catalogued categories are refused rather than guessed.
 * Final fractions are normalised with Tashih (تصحيح المسألة).
 */
export function calculateInheritance(input: InheritanceCalculationInput): InheritanceEngineResult {
  const steps: CalculationStepData[] = [];
  const pushStep = (step: Omit<CalculationStepData, "step">) => {
    steps.push({ step: steps.length + 1, ...step });
  };

  const counts = new Map<HeirType, number>();
  for (const heir of input.heirs) {
    if (!Number.isInteger(heir.count) || heir.count < 0) {
      return unsupported("Invalid heir count supplied.", steps);
    }
    if (heir.count > HEIR_MAX_COUNTS[heir.type]) {
      return unsupported(
        `The number of ${heir.type} entered exceeds the logical maximum of ${HEIR_MAX_COUNTS[heir.type]}.`,
        steps,
      );
    }
    if (heir.count > 0) counts.set(heir.type, (counts.get(heir.type) ?? 0) + heir.count);
  }
  const count = (type: HeirType) => counts.get(type) ?? 0;
  const has = (type: HeirType) => count(type) > 0;

  // ---- Guard rails: unsupported configurations -------------------------
  const unsupportedPresent = input.heirs.filter(
    (h) => h.count > 0 && UNSUPPORTED_HEIR_TYPES.includes(h.type),
  );
  if (unsupportedPresent.length > 0) {
    return unsupported(
      `Unsupported heir categories: ${unsupportedPresent.map((h) => h.type).join(", ")}.`,
      steps,
    );
  }
  if (has("HUSBAND") && has("WIFE")) {
    return unsupported("A deceased person cannot leave both a husband and a wife.", steps);
  }
  if (has("HUSBAND") && input.deceasedGender !== "FEMALE") {
    return unsupported("A husband can only be an heir of a female deceased.", steps);
  }
  if (has("WIFE") && input.deceasedGender !== "MALE") {
    return unsupported("A wife can only be an heir of a male deceased.", steps);
  }
  if (count("HUSBAND") > 1 || count("WIFE") > 4) {
    return unsupported("Invalid number of spouses (maximum one husband or four wives).", steps);
  }
  if (input.heirs.every((h) => h.count === 0)) {
    return unsupported("No heirs were supplied.", steps);
  }

  const siblingTypes: HeirType[] = [
    ...FULL_SIBLINGS, ...PATERNAL_SIBLINGS, ...MATERNAL_SIBLINGS,
  ];
  const siblingCount = siblingTypes.reduce((acc, t) => acc + count(t), 0);
  const fullSiblingCount = count("FULL_BROTHER") + count("FULL_SISTER");
  const paternalSiblingCount = count("PATERNAL_BROTHER") + count("PATERNAL_SISTER");
  const hasSon = has("SON");
  const hasSonsSon = has("SONS_SON");
  const maleDescendant = hasSon || hasSonsSon;
  const descendantExists = maleDescendant || has("DAUGHTER") || has("SONS_DAUGHTER");
  const grandfatherWithSiblings =
    has("PATERNAL_GRANDFATHER") && fullSiblingCount + paternalSiblingCount > 0 &&
    !has("FATHER") && !maleDescendant;

  // Zayd ibn Thabit's majority method: with no other quota heir the grandfather
  // takes the better of sharing with the siblings as a brother and one third.
  const grandfatherBrothers = count("FULL_BROTHER") + count("PATERNAL_BROTHER");
  const grandfatherSisters = count("FULL_SISTER") + count("PATERNAL_SISTER");
  const grandfatherSharingShare = rational(
    2,
    2 + 2 * grandfatherBrothers + grandfatherSisters,
  );
  const grandfatherUsesSharing =
    grandfatherSharingShare.n * 3n >= grandfatherSharingShare.d;
  const grandfatherTakesThird = grandfatherWithSiblings && !grandfatherUsesSharing;

  // The majority method with other quota heirs (spouse, mother, descendants)
  // or mixed full/paternal sibling classes is disputed. Maternal siblings are
  // excluded by the grandfather in every Sunni school.
  if (grandfatherWithSiblings) {
    const otherQuotaHeir = (
      ["HUSBAND", "WIFE", "MOTHER", "PATERNAL_GRANDMOTHER", "MATERNAL_GRANDMOTHER",
        "DAUGHTER", "SONS_DAUGHTER"] as HeirType[]
    ).some(has);
    if (otherQuotaHeir || (fullSiblingCount > 0 && paternalSiblingCount > 0)) {
      return unsupported(
        "Grandfather with siblings together with other quota heirs, or with mixed full and paternal sibling classes, requires scholarly verification.",
        steps,
      );
    }
  }

  if (has("DAUGHTER") && has("SONS_SON") && has("SONS_DAUGHTER")) {
    return unsupported(
      "A daughter together with a son's son and a son's daughter requires scholarly verification.",
      steps,
    );
  }

  pushStep({
    title: "Adopt the Sunni-majority inheritance sequence",
    calculation: "fixed shares → agnatic residuaries → Radd → distant kindred → bayt al-mal",
    result: "Ahl al-Sunnah wa'l-Jamā'ah working basis applied",
    fiqhPrinciple: INHERITANCE_RULES["INH-SUNNI-BASIS"].principle,
    reason:
      "Quota heirs are allocated first. Residuaries take the remainder, then Radd, then distant kindred. School-specific differences are retained as notes.",
    evidence: INHERITANCE_RULES["INH-SUNNI-BASIS"].evidence,
    references: ["INH-SUNNI-BASIS", "INH-RESIDUARY-ORDER"],
    notes: [INHERITANCE_RULES["INH-SUNNI-BASIS"].note ?? ""],
    ruleId: "INH-SUNNI-BASIS",
  });

  // ---- Step 1: estate settlement ---------------------------------------
  const grossMinor = toMinorUnits(input.grossEstate, input.currency);
  const funeralMinor = toMinorUnits(input.funeralExpenses, input.currency);
  const debtsMinor = toMinorUnits(input.debts, input.currency);
  const obligationsMinor = toMinorUnits(input.otherObligations, input.currency);
  const wasiyyahMinor = toMinorUnits(input.wasiyyah, input.currency);

  const afterFixed = grossMinor - funeralMinor - debtsMinor - obligationsMinor;
  const baseForBequest = afterFixed > 0n ? afterFixed : 0n;
  const oneThird = baseForBequest / 3n;
  const validBequestsMinor = input.heirConsentToWasiyyah
    ? (wasiyyahMinor > baseForBequest ? baseForBequest : wasiyyahMinor)
    : (wasiyyahMinor > oneThird ? oneThird : wasiyyahMinor);
  const netMinor = afterFixed - validBequestsMinor;

  pushStep({
    title: "Apply the estate settlement sequence",
    calculation: `${grossMinor} − ${funeralMinor} − ${debtsMinor} − ${obligationsMinor} − ${validBequestsMinor} (minor units)`,
    result: `Net distributable estate = ${fromMinorUnits(netMinor, input.currency).toFixed(2)} ${input.currency}`,
    fiqhPrinciple: INHERITANCE_RULES["INH-ESTATE-SEQUENCE"].principle,
    reason:
      "Funeral expenses and debts are applied before bequests; the one-third limit is enforced unless heir consent is confirmed.",
    evidence: INHERITANCE_RULES["INH-ESTATE-SEQUENCE"].evidence,
    references: ["INH-ESTATE-SEQUENCE", "INH-WASIYYAH-THIRD"],
    notes: [
      `Bequest entered: ${fromMinorUnits(wasiyyahMinor, input.currency)}; valid after rule: ${fromMinorUnits(validBequestsMinor, input.currency)}.`,
      "Bequest validity, heir consent timing and priority require scholar confirmation.",
    ],
    ruleId: "INH-ESTATE-SEQUENCE",
  });

  if (netMinor <= 0n) {
    return unsupported(
      "The net distributable estate is zero or negative after expenses, debts and bequests.",
      steps,
    );
  }

  // ---- Eligibility & exclusion -----------------------------------------
  const allocated: AllocatedHeir[] = [];
  const excluded: ExcludedHeir[] = [];

  const exclude = (
    type: HeirType,
    kind: ExclusionKind,
    excludedBy: HeirType | undefined,
    reason: string,
    ruleId: string,
  ) => {
    // An exclusion can only be recorded when the causing heir is actually present.
    if (has(type) && (!excludedBy || has(excludedBy))) {
      excluded.push({ type, count: count(type), kind, excludedBy, reason, ruleId });
    }
  };

  const excludeMany = (
    types: readonly HeirType[],
    kind: ExclusionKind,
    excludedBy: HeirType,
    reason: string,
    ruleId: string,
  ) => {
    for (const type of types) exclude(type, kind, excludedBy, reason, ruleId);
  };

  // Complete exclusions (father is never excluded by descendants)
  exclude("PATERNAL_GRANDFATHER", "COMPLETE", "FATHER", "The father excludes the paternal grandfather.", "INH-EXCLUSION-COMPLETE");
  exclude("PATERNAL_GRANDMOTHER", "COMPLETE", "FATHER", "The father excludes the paternal grandmother.", "INH-EXCLUSION-COMPLETE");
  excludeMany(
    ["PATERNAL_GRANDMOTHER", "MATERNAL_GRANDMOTHER"],
    "COMPLETE",
    "MOTHER",
    "The mother excludes the grandmother.",
    "INH-EXCLUSION-COMPLETE",
  );

  exclude("SONS_DAUGHTER", "COMPLETE", "SON", "A son completely excludes the son's daughter.", "INH-EXCLUSION-COMPLETE");
  if (count("DAUGHTER") >= 2) {
    exclude("SONS_DAUGHTER", "COMPLETE", "DAUGHTER", "Two daughters completely exclude the son's daughter.", "INH-EXCLUSION-COMPLETE");
  }
  exclude("SONS_SON", "COMPLETE", "SON", "A son completely excludes the son's son.", "INH-EXCLUSION-COMPLETE");

  if (maleDescendant) {
    const descendant: HeirType = hasSon ? "SON" : "SONS_SON";
    excludeMany(
      [...siblingTypes, ...AGNATIC_RANKS.slice(3).flat()],
      "COMPLETE",
      descendant,
      "A male descendant excludes siblings and more distant agnatic relatives.",
      "INH-EXCLUSION-COMPLETE",
    );
  }
  if (descendantExists || has("FATHER") || has("PATERNAL_GRANDFATHER")) {
    excludeMany(
      MATERNAL_SIBLINGS,
      "COMPLETE",
      has("FATHER")
        ? "FATHER"
        : has("PATERNAL_GRANDFATHER")
          ? "PATERNAL_GRANDFATHER"
          : hasSon
            ? "SON"
            : hasSonsSon
              ? "SONS_SON"
              : "SONS_DAUGHTER",
      "A descendant, the father or the paternal grandfather excludes maternal siblings.",
      "INH-EXCLUSION-COMPLETE",
    );
  }
  if (count("DAUGHTER") >= 2) {
    excludeMany(
      ["FULL_SISTER", "PATERNAL_SISTER"],
      "COMPLETE",
      "DAUGHTER",
      "Two daughters exclude sisters in this configuration.",
      "INH-EXCLUSION-COMPLETE",
    );
  }
  if (has("FULL_BROTHER")) {
    excludeMany(
      PATERNAL_SIBLINGS,
      "COMPLETE",
      "FULL_BROTHER",
      "A full brother completely excludes paternal half-siblings.",
      "INH-EXCLUSION-COMPLETE",
    );
  }
  if (count("FULL_SISTER") >= 2 && !has("PATERNAL_BROTHER")) {
    exclude(
      "PATERNAL_SISTER",
      "COMPLETE",
      "FULL_SISTER",
      "Two or more full sisters exclude the paternal half-sister unless a paternal half-brother is present.",
      "INH-EXCLUSION-COMPLETE",
    );
  }
  if (count("DAUGHTER") === 1 && has("FULL_SISTER") && !has("FULL_BROTHER")) {
    excludeMany(
      PATERNAL_SIBLINGS,
      "COMPLETE",
      "FULL_SISTER",
      "A full sister who is residuary with one daughter excludes paternal half-siblings.",
      "INH-EXCLUSION-COMPLETE",
    );
  }

  // A father excludes all lower collaterals; a grandfather normally excludes
  // them too, but Sunni-majority rules let brothers inherit alongside him.
  if (has("FATHER")) {
    excludeMany(
      [...AGNATIC_RANKS.slice(2).flat(), ...MATERNAL_SIBLINGS],
      "COMPLETE",
      "FATHER",
      "The father excludes more distant agnatic and maternal relatives.",
      "INH-RESIDUARY-ORDER",
    );
  }
  if (has("PATERNAL_GRANDFATHER")) {
    const lower = grandfatherWithSiblings ? AGNATIC_RANKS.slice(5).flat() : AGNATIC_RANKS.slice(3).flat();
    excludeMany(
      lower,
      "COMPLETE",
      "PATERNAL_GRANDFATHER",
      grandfatherWithSiblings
        ? "Brothers inherit with the grandfather, but more distant agnates do not."
        : "The paternal grandfather excludes more distant agnatic relatives.",
      "INH-RESIDUARY-ORDER",
    );
  }

  // Within the collateral agnates, the first present rank excludes lower ranks.
  for (let rankIndex = 3; rankIndex < AGNATIC_RANKS.length; rankIndex += 1) {
    const present = AGNATIC_RANKS[rankIndex]!.find(has);
    if (!present) continue;
    excludeMany(
      AGNATIC_RANKS.slice(rankIndex + 1).flat(),
      "COMPLETE",
      present,
      "A nearer agnatic residuary excludes a more distant one.",
      "INH-RESIDUARY-ORDER",
    );
  }

  const closerThanDistantKindred = input.heirs.find(
    (heir) => heir.count > 0 && heir.type !== "DISTANT_KINDRED" && heir.type !== "HUSBAND" && heir.type !== "WIFE",
  );
  if (has("DISTANT_KINDRED") && closerThanDistantKindred) {
    exclude(
      "DISTANT_KINDRED",
      "COMPLETE",
      closerThanDistantKindred.type,
      "A closer heir, or the return of the surplus to quota heirs, excludes distant kindred.",
      "INH-DISTANT-KINDRED",
    );
  }

  // Deduplicate exclusions, keeping the first recorded cause (the nearest heir).
  const exclusionMap = new Map<string, ExcludedHeir>();
  for (const e of excluded) {
    if (!exclusionMap.has(e.type)) exclusionMap.set(e.type, e);
  }
  const excludedFinal = Array.from(exclusionMap.values());
  const isExcluded = (type: HeirType) => exclusionMap.has(type);

  // ---- Fixed shares -----------------------------------------------------
  const addFixed = (type: HeirType, fraction: Rational, shareType: ShareType, ruleId: string, reason: string) => {
    if (!has(type) || isExcluded(type)) return;
    allocated.push({ type, count: count(type), fraction, shareType, ruleId, reason });
  };

  if (has("HUSBAND")) {
    addFixed("HUSBAND", rational(1, descendantExists ? 4 : 2), "FIXED", "INH-SPOUSE",
      `the husband takes ${descendantExists ? "1/4" : "1/2"} ${descendantExists ? "with" : "without"} descendants`);
  }
  if (has("WIFE")) {
    addFixed("WIFE", rational(1, descendantExists ? 8 : 4), "FIXED", "INH-SPOUSE",
      `wives share ${descendantExists ? "1/8" : "1/4"} ${descendantExists ? "with" : "without"} descendants`);
  }
  if (has("FATHER")) {
    if (maleDescendant) {
      addFixed("FATHER", rational(1, 6), "FIXED", "INH-PARENTS", "a male descendant reduces the father to 1/6");
    } else {
      allocated.push({ type: "FATHER", count: 1, fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-ASABAH", reason: "with no male descendant the father inherits as residuary" });
    }
  }
  if (has("MOTHER")) {
    const reduced = descendantExists || siblingCount >= 2;
    addFixed("MOTHER", rational(1, reduced ? 6 : 3), "FIXED", "INH-PARENTS",
      reduced ? "descendants or two or more siblings reduce the mother to 1/6" : "no reducing cause exists, so the mother takes 1/3");
  }
  if (has("PATERNAL_GRANDFATHER") && !isExcluded("PATERNAL_GRANDFATHER")) {
    if (maleDescendant) {
      addFixed("PATERNAL_GRANDFATHER", rational(1, 6), "FIXED", "INH-PARENTS", "a male descendant reduces the grandfather to 1/6");
    } else if (grandfatherTakesThird) {
      addFixed("PATERNAL_GRANDFATHER", rational(1, 3), "FIXED", "INH-GRANDFATHER-SIBLINGS",
        "sharing as a brother gives less than one third, so the Sunni-majority rule gives the grandfather one third");
    } else if (grandfatherWithSiblings) {
      allocated.push({
        type: "PATERNAL_GRANDFATHER",
        count: 1,
        fraction: RATIONAL_ZERO,
        shareType: "RESIDUARY",
        ruleId: "INH-GRANDFATHER-SIBLINGS",
        reason: "sharing with the siblings as a brother is more favourable than one third",
        residuaryWeight: 2,
      });
    } else {
      allocated.push({
        type: "PATERNAL_GRANDFATHER",
        count: 1,
        fraction: RATIONAL_ZERO,
        shareType: "RESIDUARY",
        ruleId: "INH-ASABAH",
        reason: "with no male descendant the grandfather inherits as residuary",
        residuaryWeight: 2,
      });
    }
  }

  const grandmothers: HeirType[] = ["PATERNAL_GRANDMOTHER", "MATERNAL_GRANDMOTHER"];
  const eligibleGrandmothers = grandmothers.filter((g) => has(g) && !isExcluded(g));
  if (eligibleGrandmothers.length > 0) {
    allocated.push({
      type: eligibleGrandmothers[0],
      count: eligibleGrandmothers.length,
      fraction: rational(1, 6),
      shareType: "FIXED",
      ruleId: "INH-PARENTS",
      reason: "eligible grandmothers share 1/6 equally",
    });
  }

  if (has("DAUGHTER")) {
    if (maleDescendant) {
      allocated.push({ type: "DAUGHTER", count: count("DAUGHTER"), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-ASABAH", reason: "daughters become residuary with a male descendant", residuaryWeight: 1 });
    } else {
      addFixed("DAUGHTER", rational(count("DAUGHTER") === 1 ? 1 : 2, count("DAUGHTER") === 1 ? 2 : 3),
        "FIXED", "INH-CHILDREN",
        count("DAUGHTER") === 1 ? "a single daughter with no son takes 1/2" : "two or more daughters with no son share 2/3");
    }
  }
  if (has("SONS_DAUGHTER") && !isExcluded("SONS_DAUGHTER")) {
    const d = count("DAUGHTER");
    if (d === 1) {
      addFixed("SONS_DAUGHTER", rational(1, 6), "FIXED", "INH-GRANDCHILDREN", "one daughter reduces the son's daughter to a complementary 1/6");
    } else if (d === 0 && hasSonsSon) {
      allocated.push({
        type: "SONS_DAUGHTER",
        count: count("SONS_DAUGHTER"),
        fraction: RATIONAL_ZERO,
        shareType: "RESIDUARY",
        ruleId: "INH-ASABAH",
        reason: "a son's daughter is residuary alongside a son's son at half his weight",
        residuaryWeight: 1,
      });
    } else if (d === 0) {
      addFixed("SONS_DAUGHTER", rational(count("SONS_DAUGHTER") === 1 ? 1 : 2, count("SONS_DAUGHTER") === 1 ? 2 : 3),
        "FIXED", "INH-GRANDCHILDREN", "son's daughters inherit when no son or daughter excludes them");
    }
  }
  if (has("SON") && !isExcluded("SON")) {
    allocated.push({ type: "SON", count: count("SON"), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-ASABAH", reason: "sons are residuary heirs", residuaryWeight: 2 });
  }
  if (has("SONS_SON") && !isExcluded("SONS_SON")) {
    allocated.push({ type: "SONS_SON", count: count("SONS_SON"), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-ASABAH", reason: "son's sons are residuary heirs in the absence of sons", residuaryWeight: 2 });
  }

  // Siblings and lower agnates
  const addResiduary = (type: HeirType, weight: number, reason: string, ruleId = "INH-ASABAH") => {
    if (has(type) && !isExcluded(type)) {
      allocated.push({
        type,
        count: count(type),
        fraction: RATIONAL_ZERO,
        shareType: "RESIDUARY",
        ruleId,
        reason,
        residuaryWeight: weight,
      });
    }
  };
  const addFixedSister = (type: HeirType, fraction: Rational, reason: string) => {
    if (!has(type) || isExcluded(type)) return;
    allocated.push({ type, count: count(type), fraction, shareType: "FIXED", ruleId: "INH-SIBLINGS", reason });
  };
  const sisterShare = (type: HeirType) =>
    rational(count(type) === 1 ? 1 : 2, count(type) === 1 ? 2 : 3);

  const hasMaternal = MATERNAL_SIBLINGS.some(has);
  const fullSisterEligible = has("FULL_SISTER") && !isExcluded("FULL_SISTER");
  const paternalSisterEligible = has("PATERNAL_SISTER") && !isExcluded("PATERNAL_SISTER");
  const sisterResiduaryWithDaughter = count("DAUGHTER") === 1 && !hasSonsSon;
  const sisterResiduaryWithGrandfather = grandfatherWithSiblings;
  const grandfatherSisterReason = grandfatherUsesSharing
    ? "a sister shares with the grandfather as a brother by muqasama"
    : "the grandfather takes one third and the sister inherits the residue";

  if (has("FULL_BROTHER")) {
    addResiduary("FULL_BROTHER", 2, "full brothers are residuary heirs", "INH-SIBLINGS");
    if (fullSisterEligible) {
      addResiduary("FULL_SISTER", 1, "full sisters become residuary alongside a full brother", "INH-SIBLINGS");
    }
  } else if (has("PATERNAL_BROTHER")) {
    addResiduary("PATERNAL_BROTHER", 2, "paternal brothers are residuary heirs", "INH-SIBLINGS");
    if (paternalSisterEligible) {
      addResiduary("PATERNAL_SISTER", 1, "paternal sisters become residuary alongside a paternal brother", "INH-SIBLINGS");
    }
    if (fullSisterEligible) {
      addFixedSister("FULL_SISTER", sisterShare("FULL_SISTER"), "full sisters keep their fixed share when a paternal brother is residuary");
    }
  } else {
    if (fullSisterEligible) {
      if (sisterResiduaryWithGrandfather) {
        addResiduary("FULL_SISTER", 1, grandfatherSisterReason, "INH-GRANDFATHER-SIBLINGS");
      } else if (sisterResiduaryWithDaughter) {
        addResiduary("FULL_SISTER", 1, "a full sister is residuary with one daughter (عصبة مع الغير)", "INH-SIBLINGS");
      } else {
        addFixedSister("FULL_SISTER", sisterShare("FULL_SISTER"), "full sisters take 1/2 or 2/3 with no male sibling");
      }
    }
    if (paternalSisterEligible && count("FULL_SISTER") === 0) {
      if (sisterResiduaryWithGrandfather) {
        addResiduary("PATERNAL_SISTER", 1, grandfatherSisterReason, "INH-GRANDFATHER-SIBLINGS");
      } else if (sisterResiduaryWithDaughter) {
        addResiduary("PATERNAL_SISTER", 1, "a paternal sister is residuary with one daughter", "INH-SIBLINGS");
      } else {
        addFixedSister("PATERNAL_SISTER", sisterShare("PATERNAL_SISTER"), "paternal sisters take 1/2 or 2/3 when no full sister exists");
      }
    } else if (paternalSisterEligible && count("FULL_SISTER") === 1 && !sisterResiduaryWithDaughter) {
      addFixedSister("PATERNAL_SISTER", rational(1, 6), "one paternal sister completes one full sister's 1/2 to 2/3");
    }
  }

  if (hasMaternal) {
    const maternalTotal = count("MATERNAL_BROTHER") + count("MATERNAL_SISTER");
    const maternalFraction = rational(1, maternalTotal === 1 ? 6 : 3);
    const maternalReason = "maternal siblings share 1/6 (one) or 1/3 (two or more)";
    const representative: HeirType = has("MATERNAL_BROTHER") ? "MATERNAL_BROTHER" : "MATERNAL_SISTER";
    if (!isExcluded(representative)) {
      allocated.push({ type: representative, count: maternalTotal, fraction: maternalFraction, shareType: "FIXED", ruleId: "INH-SIBLINGS", reason: maternalReason });
    }
  }

  for (let rankIndex = 5; rankIndex < AGNATIC_RANKS.length; rankIndex += 1) {
    for (const type of AGNATIC_RANKS[rankIndex]!) {
      addResiduary(type, 2, "a more distant agnatic relative inherits the residue", "INH-RESIDUARY-ORDER");
    }
  }

  // ---- Fixed shares & residue candidates --------------------------------
  const fixedHeirs = allocated.filter((a) => a.shareType === "FIXED");
  const residuaryHeirs = allocated.filter((a) => a.shareType === "RESIDUARY");
  const fixedTotal = sum(fixedHeirs.map((a) => a.fraction));
  const raddRecipients = fixedHeirs.filter((heir) => heir.type !== "HUSBAND" && heir.type !== "WIFE");

  // A sole distant kindred is not excluded by a closer heir. It may only take
  // the residue after quota return and agnatic residuaries have been considered.
  if (
    has("DISTANT_KINDRED") &&
    !isExcluded("DISTANT_KINDRED") &&
    residuaryHeirs.length === 0 &&
    raddRecipients.length === 0 &&
    fixedTotal.n < fixedTotal.d
  ) {
    const distantHeir: AllocatedHeir = {
      type: "DISTANT_KINDRED",
      count: 1,
      fraction: RATIONAL_ZERO,
      shareType: "RESIDUARY",
      ruleId: "INH-DISTANT-KINDRED",
      reason: "distant kindred inherit the residue when no quota return or agnatic residuary remains",
      residuaryWeight: 2,
    };
    allocated.push(distantHeir);
    residuaryHeirs.push(distantHeir);
  }

  if (allocated.length === 0) {
    return unsupported("No eligible heir remains after applying exclusion rules.", steps);
  }
  pushStep({
    title: "Determine eligible heirs",
    calculation: allocated.map((a) => `${a.type}×${a.count}`).join(", "),
    result: `${allocated.length} eligible heir group(s)`,
    fiqhPrinciple: "Eligibility is determined by causes of inheritance before shares are assigned.",
    reason: "Only heirs passing the exclusion analysis enter share calculation.",
    evidence: INHERITANCE_RULES["INH-SUNNI-BASIS"].evidence,
    references: ["INH-SUNNI-BASIS", "INH-RESIDUARY-ORDER", "INH-DISTANT-KINDRED"],
    notes: [],
  });

  const genuineExclusions = excludedFinal.filter((e) => e.kind !== "NONE");
  pushStep({
    title: "Analyse exclusions (الحجب)",
    calculation: genuineExclusions.map((e) => `${e.type}×${e.count}`).join(", ") || "none",
    result: `${genuineExclusions.length} excluded group(s)`,
    fiqhPrinciple: INHERITANCE_RULES["INH-EXCLUSION-COMPLETE"].principle,
    reason: "Each exclusion is emitted by a verified rule with the causing heir recorded.",
    evidence: INHERITANCE_RULES["INH-EXCLUSION-COMPLETE"].evidence,
    references: ["INH-EXCLUSION-COMPLETE", "INH-EXCLUSION-PARTIAL"],
    notes: genuineExclusions.map((e) => `${e.type}: ${e.reason}`),
  });

  if (grandfatherTakesThird && fixedTotal.n > fixedTotal.d) {
    return unsupported(
      "The grandfather-with-brothers case also exceeds the estate through other fixed shares; this disputed adjustment requires scholarly verification.",
      steps,
    );
  }

  pushStep({
    title: "Determine fixed shares (أصحاب الفروض)",
    calculation: fixedHeirs.map((a) => `${a.type}=${fractionToString(a.fraction)}`).join(", ") || "none",
    result: `Sum of fixed shares = ${fractionToString(fixedTotal)}`,
    fiqhPrinciple: "Fixed shares are assigned from the complete family structure, never from arbitrary percentages.",
    reason: "Each share follows its documented rule and exclusion status.",
    evidence: INHERITANCE_RULES["INH-SPOUSE"].evidence,
    references: fixedHeirs.map((a) => a.ruleId),
    notes: fixedHeirs.map((a) => a.reason),
  });

  // ---- Residue, ʿAwl and Radd ------------------------------------------
  let adjustment: AdjustmentType = "NONE";
  const finalFractions = new Map<AllocatedHeir, Rational>();
  const fixedGreaterThanOne = fixedTotal.n > fixedTotal.d;
  const fixedLessThanOne = fixedTotal.n < fixedTotal.d;

  if (fixedGreaterThanOne) {
    // ʿAwl: the fixed shares exceed the estate.
    adjustment = "AWL";
    fixedHeirs.forEach((heir) => {
      finalFractions.set(heir, mul(heir.fraction, div(RATIONAL_ONE, fixedTotal)));
    });
    residuaryHeirs.forEach((heir) => finalFractions.set(heir, RATIONAL_ZERO));
    pushStep({
      title: "Apply ʿAwl (العول)",
      calculation: `Shares sum to ${fractionToString(fixedTotal)} > 1; denominators are increased proportionally`,
      result: "All fixed shares are proportionally reduced to the estate",
      fiqhPrinciple: INHERITANCE_RULES["INH-AWL"].principle,
      reason: "Fixed shares exceed the estate, so denominators are increased proportionally.",
      evidence: INHERITANCE_RULES["INH-AWL"].evidence,
      references: ["INH-AWL"],
      notes: ["Residuary heirs receive no residue in an ʿAwl case."],
    });
  } else if (residuaryHeirs.length > 0) {
    const residue = sub(RATIONAL_ONE, fixedTotal);
    const weights = residuaryHeirs.map((heir) =>
      rational(BigInt((heir.residuaryWeight ?? 2) * heir.count)),
    );
    const weightSum = sum(weights);
    residuaryHeirs.forEach((heir, index) => {
      finalFractions.set(heir, mul(residue, div(weights[index], weightSum)));
    });
    fixedHeirs.forEach((heir) => finalFractions.set(heir, heir.fraction));
    pushStep({
      title: "Calculate the residuary distribution (العصبات)",
      calculation: `1 − ${fractionToString(fixedTotal)} = ${fractionToString(residue)}`,
      result: `Residue ${fractionToString(residue)} distributed among ${residuaryHeirs.length} residuary group(s)`,
      fiqhPrinciple: INHERITANCE_RULES["INH-ASABAH"].principle,
      reason: "The 2:1 ratio is applied inside the agnatic residuary group after fixed shares; nearer ranks exclude more distant ones.",
      evidence: [...INHERITANCE_RULES["INH-ASABAH"].evidence, ...INHERITANCE_RULES["INH-RESIDUARY-ORDER"].evidence],
      references: ["INH-ASABAH", "INH-RESIDUARY-ORDER"],
      notes: residuaryHeirs.map((a) => a.reason),
    });
  } else if (fixedLessThanOne) {
    // Radd: the surplus returns to the non-spouse fixed-share heirs. A spouse
    // alone leaves a residue for distant kindred or the bayt al-mal; without a
    // named distant kindred that case is refused rather than guessed.
    if (raddRecipients.length === 0) {
      return unsupported(
        "The surplus after the spouse's fixed share belongs to the dhawu al-arham or the bayt al-mal. Add the specific distant kindred or consult a scholar.",
        steps,
      );
    }
    adjustment = "RADD";
    const surplus = sub(RATIONAL_ONE, fixedTotal);
    const recipientTotal = sum(raddRecipients.map((h) => h.fraction));
    fixedHeirs.forEach((heir) => {
      if (heir.type === "HUSBAND" || heir.type === "WIFE") {
        finalFractions.set(heir, heir.fraction);
      } else {
        finalFractions.set(heir, add(heir.fraction, mul(surplus, div(heir.fraction, recipientTotal))));
      }
    });
    pushStep({
      title: "Apply Radd (الرد)",
      calculation: `1 − ${fractionToString(fixedTotal)} = ${fractionToString(surplus)} returned proportionally`,
      result: "Surplus returned to the non-spouse fixed-share heirs",
      fiqhPrinciple: INHERITANCE_RULES["INH-RADD"].principle,
      reason: "Shares are less than the estate and there is no residuary heir.",
      evidence: INHERITANCE_RULES["INH-RADD"].evidence,
      references: ["INH-RADD"],
      notes: ["In the encoded Sunni-majority method the spouse does not take Radd while another fixed-share heir exists."],
    });
  } else {
    fixedHeirs.forEach((heir) => finalFractions.set(heir, heir.fraction));
    residuaryHeirs.forEach((heir) => finalFractions.set(heir, RATIONAL_ZERO));
  }

  const allFractions = Array.from(finalFractions.values());
  const finalTotal = sum(allFractions);
  if (finalTotal.n !== finalTotal.d) {
    return unsupported(
      `Internal verification failed: final shares sum to ${fractionToString(finalTotal)} instead of 1.`,
      steps,
    );
  }

  // ---- Tashih (تصحيح المسألة) ------------------------------------------
  const positiveEntries = Array.from(finalFractions.entries()).filter(([, fraction]) => fraction.n > 0n);
  let tashihBase = commonDenominator(positiveEntries.map(([, fraction]) => fraction));
  for (const [heir, fraction] of positiveEntries) {
    const groupParts = fraction.n * (tashihBase / fraction.d);
    const countBig = BigInt(heir.count);
    if (groupParts % countBig !== 0n) {
      tashihBase *= countBig / gcdBig(groupParts, countBig);
    }
  }
  if (tashihBase > BigInt(Number.MAX_SAFE_INTEGER)) {
    return unsupported("The corrected denominator (tashih) exceeds the supported numeric range.", steps);
  }
  const tashihParts: TashihPart[] = positiveEntries.map(([heir, fraction]) => {
    const groupParts = fraction.n * (tashihBase / fraction.d);
    const partsPerIndividual = groupParts / BigInt(heir.count);
    return {
      type: heir.type,
      count: heir.count,
      groupParts: Number(groupParts),
      perIndividualParts: Number(partsPerIndividual),
    };
  });
  const tashih: TashihResult = { base: Number(tashihBase), parts: tashihParts };
  pushStep({
    title: "Apply Tashih al-mas'ala (تصحيح المسألة)",
    calculation: `LCM of denominators = ${tashih.base}; per-individual parts = ${tashihParts.map((p) => `${p.type}:${p.perIndividualParts}`).join(", ")}`,
    result: `Corrected base = ${tashih.base}`,
    fiqhPrinciple: INHERITANCE_RULES["INH-TASHIH"].principle,
    reason: "The base is enlarged until every individual's share is a whole number of parts.",
    evidence: INHERITANCE_RULES["INH-TASHIH"].evidence,
    references: ["INH-TASHIH"],
    notes: tashihParts.map((p) => `${p.type}: ${p.groupParts} part(s), ${p.perIndividualParts} per individual.`),
  });

  // ---- Step 6: final amounts -------------------------------------------
  const allocations = Array.from(finalFractions.entries());
  const amounts = apportion(
    allocations.map(([, fraction]) => fraction),
    netMinor,
  );
  const amountByHeir = new Map<AllocatedHeir, bigint>();
  allocations.forEach(([heir], index) => amountByHeir.set(heir, amounts[index]));

  const outcomes: HeirOutcome[] = [];

  for (const heir of allocated) {
    const fraction = finalFractions.get(heir)!;
    const rule = INHERITANCE_RULES[heir.ruleId];
    const groupMinor = amountByHeir.get(heir) ?? 0n;
    const individualMinor = splitEvenly(groupMinor, heir.count)[0];
    const perIndividualFraction = div(fraction, rational(heir.count));
    const parts = tashihParts.find((p) => p.type === heir.type);
    outcomes.push({
      type: heir.type,
      count: heir.count,
      status: "ELIGIBLE",
      exclusionKind: "NONE",
      reason: heir.reason,
      principle: rule?.principle ?? "Sunni-majority inheritance rule",
      referenceIds: [heir.ruleId],
      shareType: heir.shareType,
      fraction: serializeFraction(fraction),
      perIndividualFraction: serializeFraction(perIndividualFraction),
      amount: fromMinorUnits(groupMinor, input.currency),
      perIndividualAmount: fromMinorUnits(individualMinor, input.currency),
      parts: parts?.groupParts ?? 0,
      perIndividualParts: parts?.perIndividualParts ?? 0,
      explanation: `${heir.type} (${heir.count}) receives ${fractionToString(fraction)} of the net estate (${fractionToString(perIndividualFraction)} each): ${heir.reason}.`,
    });
  }

  for (const e of genuineExclusions) {
    const rule = INHERITANCE_RULES[e.ruleId];
    outcomes.push({
      type: e.type,
      count: e.count,
      status: "EXCLUDED",
      exclusionKind: e.kind,
      excludedBy: e.excludedBy,
      reason: e.reason,
      principle: rule?.principle ?? "Sunni-majority exclusion rule",
      referenceIds: [e.ruleId],
      explanation: `${e.type} (${e.count}) is ${e.kind === "COMPLETE" ? "completely" : "partially"} excluded${e.excludedBy ? ` by ${e.excludedBy}` : ""}: ${e.reason}.`,
    });
  }

  pushStep({
    title: "Final distribution",
    calculation: outcomes
      .filter((o) => o.status === "ELIGIBLE")
      .map((o) => `${o.type}=${o.fraction?.numerator}/${o.fraction?.denominator}`)
      .join(", "),
    result: `Total distributed = ${fromMinorUnits(amounts.reduce((a, b) => a + b, 0n), input.currency).toFixed(2)} ${input.currency}`,
    fiqhPrinciple: "Every heir's share is derived from rules and verified to sum exactly to the net estate.",
    reason: "Currency rounding is applied once, with largest-remainder reconciliation; per-individual shares use the tashih parts.",
    evidence: INHERITANCE_RULES["INH-AWL"].evidence,
    references: ["INH-AWL", "INH-RADD", "INH-ASABAH", "INH-TASHIH"],
    notes: [
      "This is an academic calculation, not a fatwa.",
      "When a group has several individuals, any indivisible minor unit is assigned to the first individual.",
    ],
  });

  const result: InheritanceCalculationResult = {
    supported: true,
    madhhab: input.madhhab,
    methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
    methodologyBasis: "SUNNI_MAJORITY",
    sources: INHERITANCE_SOURCE_BOOKS,
    currency: input.currency,
    grossEstate: input.grossEstate,
    funeralExpenses: input.funeralExpenses,
    debts: input.debts,
    validBequests: fromMinorUnits(validBequestsMinor, input.currency),
    netDistributable: fromMinorUnits(netMinor, input.currency),
    adjustment,
    baseDenominator: tashih.base,
    tashih,
    outcomes,
    steps,
    notes: [
      "This result follows the Sunni-majority sequence of quota heirs, residuaries, Radd and distant kindred.",
      "Exact editions, page references and school differences are listed with verification statuses in the source kitabs.",
      "All evidence items carry a verification status; none are presented as a verified fatwa.",
    ],
  };

  return result;
}

/**
 * Munasakha (المناسخة): process a sequence of deaths where an heir of an
 * earlier deceased dies before that estate is distributed. The earlier case's
 * inherited share is added to the later deceased's estate and redistributed
 * among the later deceased's own heirs.
 */
export function calculateMunasakha(input: MunasakhaCalculationInput): MunasakhaEngineResult {
  const steps: CalculationStepData[] = [];
  const pushStep = (step: Omit<CalculationStepData, "step">) => {
    steps.push({ step: steps.length + 1, ...step });
  };

  if (input.deceased.length === 0) {
    return unsupported("At least one deceased person is required.", steps);
  }
  if (input.deceased.length > 10) {
    return unsupported("A maximum of ten deceased persons can be processed in one Munasakha case.", steps);
  }
  const ids = new Set<string>();
  for (const person of input.deceased) {
    if (ids.has(person.id)) {
      return unsupported("Each deceased person must have a unique identifier.", steps);
    }
    ids.add(person.id);
  }

  const caseResults: MunasakhaCaseResult[] = [];
  let totalPassedThrough = 0;

  for (let index = 0; index < input.deceased.length; index += 1) {
    const person = input.deceased[index];
    const label = person.deceasedName?.trim() || `Deceased ${index + 1}`;
    let inheritedAmount = 0;
    let inheritedFrom: MunasakhaCaseResult["inheritedFrom"];

    if (person.inheritsFrom) {
      const sourceIndex = caseResults.findIndex((c) => c.id === person.inheritsFrom!.fromId);
      if (sourceIndex === -1) {
        return unsupported(
          `${label}: the linked earlier deceased must appear before this person in the list.`,
          steps,
        );
      }
      const source = caseResults[sourceIndex];
      const sourceOutcome = source.result.outcomes.find(
        (o) => o.type === person.inheritsFrom!.heirType && o.status === "ELIGIBLE",
      );
      if (!sourceOutcome || sourceOutcome.perIndividualAmount === undefined) {
        return unsupported(
          `${label}: the linked heir (${person.inheritsFrom.heirType}) is not an eligible heir in the case of ${source.name?.trim() || `Deceased ${sourceIndex + 1}`}. Add that heir to the earlier case or remove the link.`,
          steps,
        );
      }
      inheritedAmount = sourceOutcome.perIndividualAmount;
      totalPassedThrough += inheritedAmount;
      inheritedFrom = {
        deceasedId: source.id,
        deceasedName: source.name,
        heirType: person.inheritsFrom.heirType,
      };
    }

    const caseResult = calculateInheritance({
      madhhab: input.madhhab,
      methodologyVersion: input.methodologyVersion,
      currency: input.currency,
      deceasedGender: person.deceasedGender,
      dateOfDeath: person.dateOfDeath,
      deceasedName: person.deceasedName,
      grossEstate: (person.grossEstate ?? 0) + inheritedAmount,
      funeralExpenses: person.funeralExpenses ?? 0,
      debts: person.debts ?? 0,
      wasiyyah: person.wasiyyah ?? 0,
      otherObligations: person.otherObligations ?? 0,
      heirConsentToWasiyyah: person.heirConsentToWasiyyah,
      heirs: person.heirs ?? [],
    });
    if (!caseResult.supported) {
      return unsupported(`${label}: ${caseResult.reason}`, steps);
    }

    caseResults.push({
      id: person.id,
      name: person.deceasedName,
      inheritedAmount,
      inheritedFrom,
      result: caseResult,
    });

    for (const step of caseResult.steps) {
      pushStep({
        title: `[${label}] ${step.title}`,
        calculation: step.calculation,
        result: step.result,
        fiqhPrinciple: step.fiqhPrinciple,
        reason: step.reason,
        evidence: step.evidence,
        references: step.references,
        notes: step.notes,
        ruleId: step.ruleId,
      });
    }
  }

  const totalNetEstate = caseResults.reduce((acc, c) => acc + c.result.netDistributable, 0);
  const totalDistributed = totalNetEstate - totalPassedThrough;

  pushStep({
    title: "Munasakha summary (المناسخة)",
    calculation: caseResults
      .map((c, index) => `case ${index + 1}: net ${c.result.netDistributable} ${input.currency}`)
      .join("; "),
    result: `Passed to later estates: ${totalPassedThrough.toFixed(2)} ${input.currency}; ultimately distributed: ${totalDistributed.toFixed(2)} ${input.currency}`,
    fiqhPrinciple: INHERITANCE_RULES["INH-MUNASAKHA"].principle,
    reason:
      "Each later estate receives the share inherited from the earlier deceased before its own settlement and distribution.",
    evidence: INHERITANCE_RULES["INH-MUNASAKHA"].evidence,
    references: ["INH-MUNASAKHA", "INH-TASHIH"],
    notes: [
      "The order of the deceased list is the order of death.",
      "A linked heir must be one of the eligible heirs of the earlier case.",
    ],
    ruleId: "INH-MUNASAKHA",
  });

  return {
    supported: true,
    madhhab: input.madhhab,
    methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
    methodologyBasis: "SUNNI_MAJORITY",
    sources: INHERITANCE_SOURCE_BOOKS,
    currency: input.currency,
    cases: caseResults,
    totalNetEstate,
    totalPassedThrough,
    totalDistributed,
    steps,
    notes: [
      "Munasakha is applied sequentially: the later deceased's estate includes the share inherited from the earlier deceased.",
      "Amounts passed from one estate to another are not counted twice in the final total.",
      "This is an academic calculation, not a fatwa.",
    ],
  };
}
