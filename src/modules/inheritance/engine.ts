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
import { UNSUPPORTED_MESSAGE, unsupported, type CalculationStepData } from "@/modules/fiqh/types";
import {
  HEIR_MAX_COUNTS,
  INHERITANCE_METHODOLOGY_VERSION,
  INHERITANCE_RULES,
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
 * Conservative Hanafi inheritance engine.
 *
 * Only combinations backed by a documented rule are computed. Any ambiguous
 * or unimplemented configuration returns the mandated "requires scholarly
 * verification" result rather than a guessed distribution. The final fractions
 * are normalised with Tashih (تصحيح المسألة) so per-individual shares are whole.
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
      `${UNSUPPORTED_MESSAGE} (Unsupported heir categories: ${unsupportedPresent.map((h) => h.type).join(", ")})`,
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
    "FULL_BROTHER", "FULL_SISTER", "PATERNAL_BROTHER", "PATERNAL_SISTER",
    "MATERNAL_BROTHER", "MATERNAL_SISTER",
  ];
  const siblingCount = siblingTypes.reduce((acc, t) => acc + count(t), 0);
  if (has("PATERNAL_GRANDFATHER") && siblingCount > 0) {
    return unsupported(
      "Grandfather together with siblings requires the verified Hanafi grandfather-and-siblings rule, which is not yet implemented.",
      steps,
    );
  }
  if (has("FATHER") && siblingCount > 0) {
    return unsupported(
      "Father together with siblings requires scholarly verification in the current engine.",
      steps,
    );
  }
  if (has("SONS_SON") && has("SONS_DAUGHTER")) {
    return unsupported("Son's son together with son's daughter requires scholarly verification.", steps);
  }
  const hasFull = has("FULL_BROTHER") || has("FULL_SISTER");
  const hasPaternal = has("PATERNAL_BROTHER") || has("PATERNAL_SISTER");
  const hasMaternal = has("MATERNAL_BROTHER") || has("MATERNAL_SISTER");
  if ((hasFull && hasPaternal) || (hasMaternal && (hasFull || hasPaternal))) {
    return unsupported(
      "Mixed sibling categories (full/paternal/maternal together) require scholarly verification.",
      steps,
    );
  }

  const hasSon = has("SON");
  const hasSonsSon = has("SONS_SON");
  const maleDescendant = hasSon || hasSonsSon;
  const descendantExists = maleDescendant || has("DAUGHTER") || has("SONS_DAUGHTER");

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
    if (has(type)) {
      excluded.push({ type, count: count(type), kind, excludedBy, reason, ruleId });
    }
  };

  // Complete exclusions (father is never excluded by descendants)
  exclude("PATERNAL_GRANDFATHER", "COMPLETE", "FATHER", "The father excludes the paternal grandfather.", "INH-EXCLUSION-COMPLETE");
  exclude("PATERNAL_GRANDMOTHER", "COMPLETE", "FATHER", "The father excludes the paternal grandmother.", "INH-EXCLUSION-COMPLETE");
  for (const gm of ["PATERNAL_GRANDMOTHER", "MATERNAL_GRANDMOTHER"] as HeirType[]) {
    if (has("MOTHER")) {
      exclude(gm, "COMPLETE", "MOTHER", "The mother excludes the grandmother.", "INH-EXCLUSION-COMPLETE");
    }
  }
  exclude("SONS_DAUGHTER", "COMPLETE", "SON", "A son completely excludes the son's daughter.", "INH-EXCLUSION-COMPLETE");
  if (count("DAUGHTER") >= 2) {
    exclude("SONS_DAUGHTER", "COMPLETE", "DAUGHTER", "Two daughters completely exclude the son's daughter.", "INH-EXCLUSION-COMPLETE");
  }
  exclude("SONS_SON", "COMPLETE", "SON", "A son completely excludes the son's son.", "INH-EXCLUSION-COMPLETE");
  for (const sibling of siblingTypes) {
    if (hasSon || hasSonsSon) {
      exclude(sibling, "COMPLETE", hasSon ? "SON" : "SONS_SON", "A male descendant excludes siblings.", "INH-EXCLUSION-COMPLETE");
    }
  }
  for (const maternal of ["MATERNAL_BROTHER", "MATERNAL_SISTER"] as HeirType[]) {
    if (descendantExists || has("FATHER")) {
      exclude(maternal, "COMPLETE", has("FATHER") ? "FATHER" : "SON", "A descendant or the father excludes maternal siblings.", "INH-EXCLUSION-COMPLETE");
    }
  }
  if (count("DAUGHTER") >= 2) {
    for (const sister of ["FULL_SISTER", "PATERNAL_SISTER"] as HeirType[]) {
      exclude(sister, "COMPLETE", "DAUGHTER", "Two daughters exclude sisters in this configuration.", "INH-EXCLUSION-COMPLETE");
    }
  }

  // Deduplicate exclusions
  const exclusionMap = new Map<string, ExcludedHeir>();
  for (const e of excluded) exclusionMap.set(e.type, e);
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
    } else {
      allocated.push({ type: "PATERNAL_GRANDFATHER", count: 1, fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-ASABAH", reason: "with no male descendant the grandfather inherits as residuary" });
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
      allocated.push({ type: "DAUGHTER", count: count("DAUGHTER"), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-ASABAH", reason: "daughters become residuary with a male descendant" });
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
    } else if (d === 0) {
      addFixed("SONS_DAUGHTER", rational(count("SONS_DAUGHTER") === 1 ? 1 : 2, count("SONS_DAUGHTER") === 1 ? 2 : 3),
        "FIXED", "INH-GRANDCHILDREN", "son's daughters inherit when no son or daughter excludes them");
    }
  }
  if (has("SON")) {
    allocated.push({ type: "SON", count: count("SON"), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-ASABAH", reason: "sons are residuary heirs" });
  }
  if (has("SONS_SON")) {
    allocated.push({ type: "SONS_SON", count: count("SONS_SON"), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-ASABAH", reason: "son's sons are residuary heirs in the absence of sons" });
  }

  // Siblings
  const addResiduarySibling = (type: HeirType, weight: number, reason: string) => {
    if (has(type) && !isExcluded(type)) {
      allocated.push({ type, count: count(type), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-SIBLINGS", reason, residuaryWeight: weight });
    }
  };

  if (hasFull) {
    if (has("FULL_BROTHER")) {
      addResiduarySibling("FULL_BROTHER", 2, "full brothers are residuary heirs");
      addResiduarySibling("FULL_SISTER", 1, "full sisters become residuary alongside a full brother");
    } else if (has("FULL_SISTER") && !isExcluded("FULL_SISTER")) {
      if (count("DAUGHTER") === 1) {
        allocated.push({ type: "FULL_SISTER", count: count("FULL_SISTER"), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-SIBLINGS", reason: "a full sister is residuary with one daughter (عصبة مع الغير)" });
      } else {
        allocated.push({ type: "FULL_SISTER", count: count("FULL_SISTER"), fraction: rational(count("FULL_SISTER") === 1 ? 1 : 2, count("FULL_SISTER") === 1 ? 2 : 3), shareType: "FIXED", ruleId: "INH-SIBLINGS", reason: "full sisters take 1/2 or 2/3 with no male sibling" });
      }
    }
  } else if (hasPaternal) {
    if (has("PATERNAL_BROTHER")) {
      addResiduarySibling("PATERNAL_BROTHER", 2, "paternal brothers are residuary heirs");
      addResiduarySibling("PATERNAL_SISTER", 1, "paternal sisters become residuary alongside a paternal brother");
    } else if (has("PATERNAL_SISTER") && !isExcluded("PATERNAL_SISTER")) {
      if (count("DAUGHTER") === 1) {
        allocated.push({ type: "PATERNAL_SISTER", count: count("PATERNAL_SISTER"), fraction: RATIONAL_ZERO, shareType: "RESIDUARY", ruleId: "INH-SIBLINGS", reason: "a paternal sister is residuary with one daughter" });
      } else {
        allocated.push({ type: "PATERNAL_SISTER", count: count("PATERNAL_SISTER"), fraction: rational(count("PATERNAL_SISTER") === 1 ? 1 : 2, count("PATERNAL_SISTER") === 1 ? 2 : 3), shareType: "FIXED", ruleId: "INH-SIBLINGS", reason: "paternal sisters take 1/2 or 2/3" });
      }
    }
  } else if (hasMaternal) {
    const maternalTotal = count("MATERNAL_BROTHER") + count("MATERNAL_SISTER");
    const maternalFraction = rational(1, maternalTotal === 1 ? 6 : 3);
    const maternalReason = "maternal siblings share 1/6 (one) or 1/3 (two or more)";
    const representative: HeirType = has("MATERNAL_BROTHER") ? "MATERNAL_BROTHER" : "MATERNAL_SISTER";
    if (!isExcluded(representative)) {
      allocated.push({ type: representative, count: maternalTotal, fraction: maternalFraction, shareType: "FIXED", ruleId: "INH-SIBLINGS", reason: maternalReason });
    }
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
    evidence: INHERITANCE_RULES["INH-SPOUSE"].evidence,
    references: ["INH-SPOUSE", "INH-PARENTS", "INH-CHILDREN"],
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

  // ---- Fixed shares -----------------------------------------------------
  const fixedHeirs = allocated.filter((a) => a.shareType === "FIXED");
  const residuaryHeirs = allocated.filter((a) => a.shareType === "RESIDUARY");
  const fixedTotal = sum(fixedHeirs.map((a) => a.fraction));

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
    const weights = residuaryHeirs.map((heir) => {
      const weight = heir.type === "SON" || heir.type === "SONS_SON" || heir.type === "FULL_BROTHER" || heir.type === "PATERNAL_BROTHER" ? 2 : 1;
      return rational(BigInt(weight * heir.count));
    });
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
      reason: "The 2:1 ratio is applied only inside the agnatic residuary group after fixed shares.",
      evidence: INHERITANCE_RULES["INH-ASABAH"].evidence,
      references: ["INH-ASABAH"],
      notes: residuaryHeirs.map((a) => a.reason),
    });
  } else if (fixedLessThanOne) {
    // Radd: the surplus returns to the non-spouse fixed-share heirs. Under the
    // Hanafi method a spouse does not take Radd while another fixed-share heir
    // exists. If only a spouse remains, the surplus belongs to the dhawu
    // al-arham or bayt al-mal, which this engine does not model.
    const raddRecipients = fixedHeirs.filter((heir) => heir.type !== "HUSBAND" && heir.type !== "WIFE");
    if (raddRecipients.length === 0) {
      return unsupported(
        "The surplus after the spouse's fixed share belongs to the dhawu al-arham or the bayt al-mal. This case is not currently supported by the verified Hanafi rules engine.",
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
      notes: ["Under the Hanafi method the spouse does not take Radd while another fixed-share heir exists."],
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
      principle: rule?.principle ?? "Hanafi inheritance rule",
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
      principle: rule?.principle ?? "Hanafi exclusion rule",
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
    madhhab: "HANAFI",
    methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
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
      "Unsupported configurations return an explicit refusal instead of a distribution.",
      "All evidence items carry a verification status; none are presented as verified fatwa.",
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
    madhhab: "HANAFI",
    methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
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
