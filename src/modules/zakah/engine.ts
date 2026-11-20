import { EVIDENCE } from "@/modules/fiqh/evidences/catalog";
import { unsupported, type CalculationStepData, type UnsupportedResult } from "@/modules/fiqh/types";
import { hawlCompleted, formatHijri, gregorianToHijri } from "@/lib/hijri";
import {
  ASSET_POLICIES,
  LIABILITY_POLICIES,
  ZAKAH_METHODOLOGY_VERSION,
  ZAKAH_RATE,
  ZAKAH_RULES,
} from "./rules";
import type {
  ClassifiedAsset,
  ClassifiedLiability,
  ZakahCalculationInput,
  ZakahCalculationResult,
} from "./types";

export type ZakahEngineResult = ZakahCalculationResult | UnsupportedResult;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function assetValue(input: ZakahCalculationInput, asset: ZakahCalculationInput["assets"][number]): number {
  const isMetal = asset.category.startsWith("GOLD") || asset.category.startsWith("SILVER");
  if (isMetal && asset.weightGrams && asset.purity !== undefined) {
    const pricePerGram =
      asset.category.startsWith("GOLD") ? input.nisab.goldPricePerGram : input.nisab.silverPricePerGram;
    return asset.weightGrams * asset.purity * pricePerGram * asset.conversionRateToBase;
  }
  const base = asset.marketValue ?? asset.amount ?? 0;
  return base * asset.conversionRateToBase;
}

/**
 * Pure Hanafi zakah calculation. No I/O, no clock, no randomness.
 * All jurisprudential decisions come from `rules.ts` and are emitted as steps.
 */
export function calculateZakah(input: ZakahCalculationInput): ZakahEngineResult {
  const steps: CalculationStepData[] = [];

  const pushStep = (step: Omit<CalculationStepData, "step">) => {
    steps.push({ step: steps.length + 1, ...step });
  };

  if (!input.ownershipConfirmed) {
    return unsupported(
      "Ownership of the wealth could not be confirmed. Zakah cannot be calculated without verified ownership.",
      steps,
    );
  }

  // Step 1 — methodology
  pushStep({
    title: "Determine the selected Nisab methodology",
    calculation: `Madhhab=${input.madhhab}; version=${input.methodologyVersion}; nisabMethod=${input.nisab.method}`,
    result: `${input.nisab.method}-based Nisab under ${input.madhhab}`,
    fiqhPrinciple: ZAKAH_RULES["ZAK-NISAB-METHOD"].principle,
    reason:
      "Contemporary gold and silver valuations differ; the methodology is selected explicitly and is not claimed to be universally agreed.",
    evidence: ZAKAH_RULES["ZAK-NISAB-METHOD"].evidence,
    references: [ZAKAH_RULES["ZAK-NISAB-METHOD"].ruleId],
    notes: [
      "Classical weights and market prices are distinct inputs.",
      input.nisab.isManual
        ? "Prices were supplied manually by the user."
        : `Price source: ${input.nisab.priceSource}.`,
    ],
    ruleId: ZAKAH_RULES["ZAK-NISAB-METHOD"].ruleId,
  });

  // Step 2 — nisab value
  const nisabGrams =
    input.nisab.method === "GOLD" ? input.nisab.goldNisabGrams : input.nisab.silverNisabGrams;
  const pricePerGram =
    input.nisab.method === "GOLD" ? input.nisab.goldPricePerGram : input.nisab.silverPricePerGram;
  const nisabValue = round(nisabGrams * pricePerGram);
  pushStep({
    title: "Calculate the current Nisab value",
    calculation: `${nisabGrams} g × ${pricePerGram} ${input.currency}/g`,
    result: `${nisabValue.toFixed(2)} ${input.currency}`,
    fiqhPrinciple:
      "Classical weight thresholds are converted to a monetary value using a declared price and source.",
    reason: `The ${input.nisab.method} threshold was selected; no alternative valuation is silently substituted.`,
    evidence: [EVIDENCE.CLASSICAL_HIDAYAH, EVIDENCE.INSTITUTIONAL_AAOIFI],
    references: ["ZAK-NISAB-METHOD"],
    notes: [
      `Price recorded at ${input.nisab.recordedAt}`,
      input.nisab.valuationNote ?? "No additional valuation note supplied.",
    ],
    ruleId: "ZAK-NISAB-METHOD",
  });

  // Step 3 — asset classification
  const classifiedAssets: ClassifiedAsset[] = input.assets.map((asset) => {
    const policy = ASSET_POLICIES[asset.category];
    const value = round(assetValue(input, asset));
    return {
      id: asset.id,
      category: asset.category,
      label: asset.label ?? asset.category,
      valueInBase: value,
      included: policy.included,
      ruleId: policy.ruleId,
      reason: policy.reason,
    };
  });

  const unverifiedAssets = classifiedAssets.filter((asset) => {
    const policy = ASSET_POLICIES[asset.category];
    return policy.verification === "UNVERIFIED" && asset.valueInBase > 0;
  });
  if (unverifiedAssets.length > 0) {
    return unsupported(
      "One or more entered asset categories have no verified Hanafi rule in the current engine: " +
        unverifiedAssets.map((a) => a.category).join(", "),
      steps,
    );
  }

  const includedAssets = classifiedAssets.filter((asset) => asset.included);
  const totalAssets = round(includedAssets.reduce((sum, asset) => sum + asset.valueInBase, 0));
  pushStep({
    title: "Identify Zakahable assets",
    calculation: includedAssets.map((a) => `${a.label}=${a.valueInBase}`).join(" + ") || "0",
    result: `Total zakahable assets = ${totalAssets.toFixed(2)} ${input.currency}`,
    fiqhPrinciple: "Each asset category is classified by its own documented rule; no blanket assumption is applied.",
    reason: "Assets without a verified inclusion policy are excluded and reported separately.",
    evidence: [EVIDENCE.QURAN_ZAKAH_COMMAND, EVIDENCE.CLASSICAL_BADAI],
    references: includedAssets.map((a) => a.ruleId!).filter(Boolean),
    notes: classifiedAssets
      .filter((a) => !a.included)
      .map((a) => `${a.label} excluded: ${a.reason}`),
  });

  // Step 4 — liabilities
  const classifiedLiabilities: ClassifiedLiability[] = input.liabilities.map((liability) => {
    const policy = LIABILITY_POLICIES[liability.type];
    const value = round(liability.amount * liability.conversionRateToBase);
    const deductible = policy.deductible && liability.dueNow;
    return {
      id: liability.id,
      type: liability.type,
      label: liability.label ?? liability.type,
      valueInBase: value,
      deductible,
      ruleId: policy.ruleId,
      reason: deductible
        ? policy.reason
        : liability.dueNow
          ? policy.reason
          : "Not confirmed as immediately due; the full amount is not deducted.",
    };
  });
  const totalDeductible = round(
    classifiedLiabilities.filter((l) => l.deductible).reduce((sum, l) => sum + l.valueInBase, 0),
  );
  pushStep({
    title: "Determine eligible deductible liabilities",
    calculation:
      classifiedLiabilities
        .filter((l) => l.deductible)
        .map((l) => `${l.label}=${l.valueInBase}`)
        .join(" + ") || "0",
    result: `Deductible liabilities = ${totalDeductible.toFixed(2)} ${input.currency}`,
    fiqhPrinciple: "Only debts recognised by the selected Hanafi methodology and due now are deducted.",
    reason: "Long-term loans are not automatically deducted in full.",
    evidence: [EVIDENCE.CLASSICAL_HIDAYAH],
    references: classifiedLiabilities.filter((l) => l.deductible).map((l) => l.ruleId!).filter(Boolean),
    notes: classifiedLiabilities
      .filter((l) => !l.deductible)
      .map((l) => `${l.label} not deducted: ${l.reason}`),
  });

  // Step 5 — net wealth
  const netWealth = round(totalAssets - totalDeductible);
  pushStep({
    title: "Calculate net zakahable wealth",
    calculation: `${totalAssets.toFixed(2)} − ${totalDeductible.toFixed(2)}`,
    result: `${netWealth.toFixed(2)} ${input.currency}`,
    fiqhPrinciple: "Net zakahable wealth is the base after applying eligible deductions.",
    reason: "Only classified and verified components enter this subtraction.",
    evidence: [],
    references: [],
    notes: [],
  });

  // Step 6 — nisab condition
  const nisabReached = netWealth >= nisabValue;
  pushStep({
    title: "Evaluate the Nisab condition",
    calculation: `${netWealth.toFixed(2)} ${nisabReached ? "≥" : "<"} ${nisabValue.toFixed(2)}`,
    result: nisabReached ? "Nisab reached" : "Nisab not reached",
    fiqhPrinciple: ZAKAH_RULES["ZAK-CONDITION-NISAB"].principle,
    reason: `The ${input.nisab.method} Nisab value was used consistently.`,
    evidence: ZAKAH_RULES["ZAK-CONDITION-NISAB"].evidence,
    references: ["ZAK-CONDITION-NISAB"],
    notes: [],
    ruleId: "ZAK-CONDITION-NISAB",
  });

  // Step 7 — hawl
  const hawlDone = hawlCompleted(
    new Date(input.hawl.nisabFirstReachedDate),
    new Date(input.hawl.assessmentDate),
    input.hawl.calendarMethod,
  );
  const hijri = gregorianToHijri(new Date(input.hawl.assessmentDate), input.hawl.calendarMethod);

  if (!input.hawl.wealthRemainedAboveNisab) {
    return unsupported(
      "Wealth did not remain above Nisab throughout the year. The applicable Hanafi rule for changes in wealth during Hawl has not been verified in this engine.",
      [
        ...steps,
        {
          step: steps.length + 1,
          title: "Evaluate Hawl",
          calculation: `Calendar=${input.hawl.calendarMethod}; hijri=${formatHijri(hijri)}`,
          result: "Requires scholarly verification",
          fiqhPrinciple: ZAKAH_RULES["ZAK-CONDITION-HAWL"].principle,
          reason: "Mid-year wealth fluctuation is not covered by a verified rule.",
          evidence: ZAKAH_RULES["ZAK-CONDITION-HAWL"].evidence,
          references: ["ZAK-CONDITION-HAWL"],
          notes: [],
        },
      ],
    );
  }

  pushStep({
    title: "Evaluate Hawl",
    calculation: `From ${input.hawl.nisabFirstReachedDate} to ${input.hawl.assessmentDate} (${input.hawl.calendarMethod})`,
    result: `${hawlDone ? "One lunar year completed" : "Hawl not yet completed"} — ${formatHijri(hijri)}`,
    fiqhPrinciple: ZAKAH_RULES["ZAK-CONDITION-HAWL"].principle,
    reason: "A single collective Hawl is applied; independent Hawl cycles per asset are not assumed.",
    evidence: ZAKAH_RULES["ZAK-CONDITION-HAWL"].evidence,
    references: ["ZAK-CONDITION-HAWL"],
    notes: [
      "Tabular Hijri dates may differ by one day from sighting-based calendars.",
      input.hawl.previousZakahDate ? `Previous zakah date: ${input.hawl.previousZakahDate}` : "No previous zakah date supplied.",
    ],
    ruleId: "ZAK-CONDITION-HAWL",
  });

  if (!input.growthConditionConfirmed) {
    return unsupported(
      "Growth or growth potential could not be confirmed. The Hanafi growth condition is required before zakah is obligatory.",
      steps,
    );
  }

  // Step 8 — final obligation
  const zakahPayable = nisabReached && hawlDone ? round(netWealth * ZAKAH_RATE) : 0;
  pushStep({
    title: "Calculate the final Zakah obligation",
    calculation:
      nisabReached && hawlDone
        ? `${netWealth.toFixed(2)} × ${(ZAKAH_RATE * 100).toFixed(1)}%`
        : "Conditions not satisfied → 0",
    result: `${zakahPayable.toFixed(2)} ${input.currency}`,
    fiqhPrinciple: ZAKAH_RULES["ZAK-RATE"].principle,
    reason:
      nisabReached && hawlDone
        ? "All documented conditions are satisfied."
        : "The Nisab and/or Hawl condition is not satisfied, so no zakah is due.",
    evidence: ZAKAH_RULES["ZAK-RATE"].evidence,
    references: ["ZAK-RATE"],
    notes: [
      "This result is an academic calculation, not a fatwa.",
      "Methodology version: " + ZAKAH_METHODOLOGY_VERSION,
    ],
    ruleId: "ZAK-RATE",
  });

  return {
    supported: true,
    madhhab: "HANAFI",
    methodologyVersion: ZAKAH_METHODOLOGY_VERSION,
    currency: input.currency,
    totalAssets,
    totalDeductibleLiabilities: totalDeductible,
    netZakahableWealth: netWealth,
    nisabValue,
    nisabMethod: input.nisab.method,
    nisabReached,
    hawlCompleted: hawlDone,
    rate: ZAKAH_RATE,
    zakahPayable,
    classifiedAssets,
    classifiedLiabilities,
    steps,
    notes: [
      "No contemporary gold/silver price is fabricated: prices are supplied by a declared source or manually.",
      "All verification statuses are visible in the References section.",
    ],
  };
}
