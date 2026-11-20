import { EVIDENCE } from "@/modules/fiqh/evidences/catalog";
import { unsupported, type CalculationStepData, type UnsupportedResult } from "@/modules/fiqh/types";
import { hawlCompleted, formatHijri, gregorianToHijri } from "@/lib/hijri";
import {
  ASSET_POLICIES,
  CROP_SCHEDULES,
  LIABILITY_POLICIES,
  LIVESTOCK_SCHEDULES,
  ZAKAH_METHODOLOGY_VERSION,
  ZAKAH_RATE,
  ZAKAH_RECIPIENT_PURPOSES,
  ZAKAH_RULES,
} from "./rules";
import type {
  ClassifiedAsset,
  ClassifiedLiability,
  InKindDue,
  ZakahAssetInput,
  ZakahCalculationInput,
  ZakahCalculationResult,
} from "./types";

export type ZakahEngineResult = ZakahCalculationResult | UnsupportedResult;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function assetValue(input: ZakahCalculationInput, asset: ZakahAssetInput): number {
  const isMetal = asset.category.startsWith("GOLD") || asset.category.startsWith("SILVER");
  if (isMetal && asset.weightGrams && asset.purity !== undefined) {
    const pricePerGram =
      asset.category.startsWith("GOLD") ? input.nisab.goldPricePerGram : input.nisab.silverPricePerGram;
    return asset.weightGrams * asset.purity * pricePerGram * asset.conversionRateToBase;
  }
  const base = asset.marketValue ?? asset.amount ?? 0;
  return base * asset.conversionRateToBase;
}

type InKindComputation = { due: InKindDue } | { refusal: string };

/**
 * Resolve one asset through its in-kind schedule. Refusals are returned rather
 * than thrown so the pure engine can report the completed steps alongside them.
 */
function computeInKindDue(input: ZakahCalculationInput, asset: ZakahAssetInput): InKindComputation {
  const quantity = asset.quantity ?? 0;
  const label = asset.label ?? asset.category;

  if (asset.category in LIVESTOCK_SCHEDULES) {
    const schedule = LIVESTOCK_SCHEDULES[asset.category as keyof typeof LIVESTOCK_SCHEDULES];
    if (quantity > schedule.maxSupported) {
      return {
        refusal:
          `${label}: ${quantity} head is above the encoded classical schedule (maximum ${schedule.maxSupported}). ` +
          "This range requires scholarly verification before a due can be stated.",
      };
    }
    const nisabReached = quantity >= schedule.nisab;
    const tier = nisabReached
      ? schedule.tiers.find((item) => quantity >= item.min && (item.max === null || quantity <= item.max))
      : undefined;
    if (nisabReached && !tier) {
      return {
        refusal: `${label}: no schedule tier matches ${quantity} head. The case requires scholarly verification.`,
      };
    }
    let dueQuantity = tier?.dueQuantity ?? 0;
    if (tier?.perHeads && tier.perDueQuantity) {
      dueQuantity += Math.floor((quantity - tier.min) / tier.perHeads) * tier.perDueQuantity;
    }
    const estimatedValue =
      asset.unitValue !== undefined
        ? round(dueQuantity * asset.unitValue * asset.conversionRateToBase)
        : null;
    return {
      due: {
        id: asset.id,
        category: asset.category,
        label,
        quantity,
        unit: "head",
        nisabQuantity: schedule.nisab,
        nisabReached,
        rate: null,
        dueDescription: nisabReached ? tier!.dueDescription : "Below nisab — no zakah due",
        dueQuantity: nisabReached ? dueQuantity : 0,
        dueUnit: "head",
        estimatedValue,
        ruleId: schedule.ruleId,
        verification: schedule.verification,
        explanation: `${schedule.explanation} Nisab: ${schedule.nisab} head.`,
      },
    };
  }

  if (asset.category in CROP_SCHEDULES) {
    const schedule = CROP_SCHEDULES[asset.category as keyof typeof CROP_SCHEDULES];
    if (!asset.irrigation) {
      return {
        refusal: `${label}: the irrigation method must be supplied to select the 10% or 5% crop rate.`,
      };
    }
    const rate = schedule.rates[asset.irrigation];
    if (rate === undefined) {
      return {
        refusal:
          `${label}: mixed irrigation has no verified rate in this engine. ` +
          "Enter the rain-fed and irrigated portions as separate assets or consult a scholar.",
      };
    }
    const nisabReached = quantity >= schedule.nisabKg;
    const dueQuantity = nisabReached ? round(quantity * rate) : 0;
    const estimatedValue =
      asset.unitValue !== undefined
        ? round(dueQuantity * asset.unitValue * asset.conversionRateToBase)
        : null;
    return {
      due: {
        id: asset.id,
        category: asset.category,
        label,
        quantity,
        unit: "kg",
        nisabQuantity: schedule.nisabKg,
        nisabReached,
        rate,
        dueDescription: nisabReached
          ? `${(rate * 100).toFixed(0)}% of ${quantity} kg = ${dueQuantity.toFixed(2)} kg`
          : "Below nisab — no zakah due",
        dueQuantity,
        dueUnit: "kg",
        estimatedValue,
        ruleId: schedule.ruleId,
        verification: schedule.verification,
        explanation: `${schedule.explanation} Irrigation: ${asset.irrigation}.`,
      },
    };
  }

  return { refusal: `${label}: ${asset.category} has no encoded in-kind schedule.` };
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
      valuationMode: policy.mode ?? "MONETARY",
      quantity: asset.quantity,
    };
  });

  const unverifiedAssets = classifiedAssets.filter((asset) => {
    const policy = ASSET_POLICIES[asset.category];
    const positiveQuantity = (asset.quantity ?? 0) > 0;
    return policy.verification === "UNVERIFIED" && (asset.valueInBase > 0 || positiveQuantity);
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
      .map((a) =>
        a.valuationMode === "IN_KIND"
          ? `${a.label} assessed by in-kind schedule, not added to monetary wealth.`
          : `${a.label} excluded: ${a.reason}`,
      ),
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

  // Step 8 — final monetary obligation
  const zakahPayable = nisabReached && hawlDone ? round(netWealth * ZAKAH_RATE) : 0;
  pushStep({
    title: "Calculate the final monetary Zakah obligation",
    calculation:
      nisabReached && hawlDone
        ? `${netWealth.toFixed(2)} × ${(ZAKAH_RATE * 100).toFixed(1)}%`
        : "Conditions not satisfied → 0",
    result: `${zakahPayable.toFixed(2)} ${input.currency}`,
    fiqhPrinciple: ZAKAH_RULES["ZAK-RATE"].principle,
    reason:
      nisabReached && hawlDone
        ? "All documented conditions are satisfied."
        : "The Nisab and/or Hawl condition is not satisfied, so no monetary zakah is due.",
    evidence: ZAKAH_RULES["ZAK-RATE"].evidence,
    references: ["ZAK-RATE"],
    notes: [
      "This result is an academic calculation, not a fatwa.",
      "Methodology version: " + ZAKAH_METHODOLOGY_VERSION,
    ],
    ruleId: "ZAK-RATE",
  });

  // In-kind schedules — evaluated independently of the monetary nisab.
  const inKindDues: InKindDue[] = [];
  for (const asset of input.assets) {
    if (ASSET_POLICIES[asset.category].mode !== "IN_KIND") continue;
    if ((asset.quantity ?? 0) <= 0) continue;
    const computed = computeInKindDue(input, asset);
    if ("refusal" in computed) {
      return unsupported(computed.refusal, steps);
    }
    inKindDues.push(computed.due);
  }

  const totalInKindValue = round(
    inKindDues.reduce((sum, due) => sum + (due.estimatedValue ?? 0), 0),
  );

  if (inKindDues.length > 0) {
    pushStep({
      title: "Calculate in-kind zakah (livestock and crops)",
      calculation:
        inKindDues
          .map((due) => `${due.label}: ${due.quantity} ${due.unit} → ${due.dueDescription}`)
          .join("; ") || "0",
      result:
        `In-kind dues stated separately; estimated value ${totalInKindValue.toFixed(2)} ${input.currency}`,
      fiqhPrinciple:
        `${ZAKAH_RULES["ZAK-LIVESTOCK-SCHEDULE"].principle} ${ZAKAH_RULES["ZAK-CROP-SCHEDULE"].principle}`,
      reason:
        "Livestock and crops are assessed by their own classical schedules and nisab; 2.5% is never applied to them as if they were money.",
      evidence: [
        ...ZAKAH_RULES["ZAK-LIVESTOCK-SCHEDULE"].evidence,
        ...ZAKAH_RULES["ZAK-CROP-SCHEDULE"].evidence,
      ],
      references: [...new Set(inKindDues.map((due) => due.ruleId))],
      notes: [
        ...inKindDues.map((due) => `${due.label}: ${due.explanation}`),
        "All in-kind schedules in this engine are NEEDS_REVIEW; verify the tier against a cited source.",
        ...inKindDues
          .filter((due) => due.estimatedValue === null)
          .map((due) => `${due.label}: no unit value supplied, so only the in-kind due is stated.`),
      ],
      ruleId: "ZAK-IN-KIND-TOTAL",
    });

    pushStep({
      title: "Combine monetary and in-kind results",
      calculation: `${zakahPayable.toFixed(2)} + ${totalInKindValue.toFixed(2)}`,
      result: `Estimated total = ${round(zakahPayable + totalInKindValue).toFixed(2)} ${input.currency}`,
      fiqhPrinciple: ZAKAH_RULES["ZAK-IN-KIND-TOTAL"].principle,
      reason:
        "The sum is a reporting convenience. The in-kind dues retain their own nisab and timing and are not converted into a single legal ruling.",
      evidence: ZAKAH_RULES["ZAK-IN-KIND-TOTAL"].evidence,
      references: ["ZAK-IN-KIND-TOTAL"],
      notes: [ZAKAH_RULES["ZAK-IN-KIND-TOTAL"].note ?? ""],
      ruleId: "ZAK-IN-KIND-TOTAL",
    });
  }

  pushStep({
    title: "List the eight recipient purposes of zakah",
    calculation: `${ZAKAH_RECIPIENT_PURPOSES.length} purposes from Qur'an 9:60`,
    result: ZAKAH_RECIPIENT_PURPOSES.map((purpose) => `${purpose.arabic} (${purpose.label})`).join(", "),
    fiqhPrinciple: ZAKAH_RULES["ZAK-RECIPIENTS"].principle,
    reason: "Informational only; this calculation does not decide whether a specific recipient is eligible.",
    evidence: ZAKAH_RULES["ZAK-RECIPIENTS"].evidence,
    references: ["ZAK-RECIPIENTS"],
    notes: [
      ...ZAKAH_RECIPIENT_PURPOSES.map((purpose) => `${purpose.label}: ${purpose.explanation}`),
      "Recipient interpretations are NEEDS_REVIEW and require a scholar's ruling for actual disbursement.",
    ],
    ruleId: "ZAK-RECIPIENTS",
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
    totalInKindValue,
    totalPayable: round(zakahPayable + totalInKindValue),
    inKindDues,
    recipientPurposes: ZAKAH_RECIPIENT_PURPOSES,
    classifiedAssets,
    classifiedLiabilities,
    steps,
    notes: [
      "No contemporary gold/silver price is fabricated: prices are supplied by a declared source or manually.",
      "All verification statuses are visible in the References section.",
      "In-kind dues use NEEDS_REVIEW classical schedules with their own nisab; consult a qualified scholar.",
    ],
  };
}
