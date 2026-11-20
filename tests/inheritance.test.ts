import { describe, expect, it } from "vitest";
import { calculateInheritance, calculateMunasakha } from "@/modules/inheritance/engine";
import type { InheritanceCalculationInput, HeirType, MunasakhaCalculationInput } from "@/modules/inheritance/types";
import {
  INHERITANCE_METHODOLOGY_VERSION,
  INHERITANCE_SOURCE_BOOKS,
} from "@/modules/inheritance/rules";

const base: InheritanceCalculationInput = {
  madhhab: "SUNNI_MAJORITY",
  methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
  currency: "BDT",
  deceasedGender: "MALE",
  dateOfDeath: "2026-01-01",
  grossEstate: 1_200_000,
  funeralExpenses: 0,
  debts: 0,
  wasiyyah: 0,
  otherObligations: 0,
  heirConsentToWasiyyah: false,
  heirs: [],
};

function heirs(...items: [HeirType, number][]): { type: HeirType; count: number }[] {
  return items.map(([type, count]) => ({ type, count }));
}

function share(result: ReturnType<typeof calculateInheritance>, type: HeirType) {
  if (!result.supported) return null;
  return result.outcomes.find((o) => o.type === type && o.status === "ELIGIBLE");
}

function excludedBy(result: ReturnType<typeof calculateInheritance>, type: HeirType) {
  if (!result.supported) return null;
  return result.outcomes.find((o) => o.type === type && o.status === "EXCLUDED") ?? null;
}

describe("Sunni-majority inheritance engine", () => {
  it("declares the Sunni-majority basis, version and source kitabs", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["SON", 1]) });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.madhhab).toBe("SUNNI_MAJORITY");
    expect(result.methodologyBasis).toBe("SUNNI_MAJORITY");
    expect(result.methodologyVersion).toBe("sunni-majority-all-heirs-v2.0.0");
    expect(INHERITANCE_METHODOLOGY_VERSION).toBe("sunni-majority-all-heirs-v2.0.0");
    expect(result.sources).toEqual(INHERITANCE_SOURCE_BOOKS);
    expect(result.sources.map((source) => source.id)).toEqual([
      "CLASSICAL_SIRAJIYYAH",
      "CLASSICAL_HIDAYAH",
      "CLASSICAL_HINDIYYAH",
      "CLASSICAL_AL_MUGHNI",
      "CLASSICAL_AL_MAJMU",
    ]);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources.every((source) => source.verificationStatus !== undefined)).toBe(true);
  });

  it("husband with two daughters and mother applies Awl (13/12)", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "FEMALE",
      heirs: heirs(["HUSBAND", 1], ["DAUGHTER", 2], ["MOTHER", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.adjustment).toBe("AWL");
    expect(share(result, "HUSBAND")?.fraction).toEqual({ numerator: "3", denominator: "13" });
    expect(share(result, "DAUGHTER")?.fraction).toEqual({ numerator: "8", denominator: "13" });
    expect(share(result, "MOTHER")?.fraction).toEqual({ numerator: "2", denominator: "13" });
  });

  it("wife with a son takes 1/8 and son takes the residue", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["WIFE", 1], ["SON", 1]) });
    expect(share(result, "WIFE")?.fraction).toEqual({ numerator: "1", denominator: "8" });
    expect(share(result, "SON")?.fraction).toEqual({ numerator: "7", denominator: "8" });
  });

  it("father and mother only: mother 1/3, father residuary 2/3", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["FATHER", 1], ["MOTHER", 1]) });
    expect(share(result, "MOTHER")?.fraction).toEqual({ numerator: "1", denominator: "3" });
    expect(share(result, "FATHER")?.fraction).toEqual({ numerator: "2", denominator: "3" });
  });

  it("son and daughter divide as 2:1", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["SON", 1], ["DAUGHTER", 1]) });
    expect(share(result, "SON")?.fraction).toEqual({ numerator: "2", denominator: "3" });
    expect(share(result, "DAUGHTER")?.fraction).toEqual({ numerator: "1", denominator: "3" });
  });

  it("two daughters alone receive Radd and split equally", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["DAUGHTER", 2]) });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.adjustment).toBe("RADD");
    expect(share(result, "DAUGHTER")?.fraction).toEqual({ numerator: "1", denominator: "1" });
  });

  it("full brother and full sister divide as residuary 2:1", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["FULL_BROTHER", 1], ["FULL_SISTER", 1]) });
    expect(share(result, "FULL_BROTHER")?.fraction).toEqual({ numerator: "2", denominator: "3" });
    expect(share(result, "FULL_SISTER")?.fraction).toEqual({ numerator: "1", denominator: "3" });
  });

  it("son completely excludes full brother with an explanation", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["SON", 1], ["FULL_BROTHER", 1]) });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    const brother = result.outcomes.find((o) => o.type === "FULL_BROTHER");
    expect(brother?.status).toBe("EXCLUDED");
    expect(brother?.excludedBy).toBe("SON");
    expect(brother?.exclusionKind).toBe("COMPLETE");
    expect(brother?.explanation).toContain("excluded");
  });

  it("father excludes paternal grandfather and lower collaterals", () => {
    const result = calculateInheritance({
      ...base,
      heirs: heirs(["FATHER", 1], ["PATERNAL_GRANDFATHER", 1], ["FULL_BROTHER", 1]),
    });
    expect(excludedBy(result, "PATERNAL_GRANDFATHER")?.excludedBy).toBe("FATHER");
    expect(excludedBy(result, "FULL_BROTHER")?.excludedBy).toBe("FATHER");
    expect(share(result, "FATHER")?.fraction).toEqual({ numerator: "1", denominator: "1" });
  });

  it("four wives share 1/8 with a son", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["WIFE", 4], ["SON", 1]) });
    expect(share(result, "WIFE")?.fraction).toEqual({ numerator: "1", denominator: "8" });
    expect(share(result, "SON")?.fraction).toEqual({ numerator: "7", denominator: "8" });
  });

  it("applies funeral, debts and one-third bequest limit", () => {
    const result = calculateInheritance({
      ...base,
      grossEstate: 1_000_000,
      funeralExpenses: 100_000,
      debts: 200_000,
      wasiyyah: 500_000,
      heirs: heirs(["SON", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.validBequests).toBe(233333.33);
    expect(result.netDistributable).toBe(466666.67);
  });

  it("allows full bequest with heir consent", () => {
    const result = calculateInheritance({
      ...base,
      grossEstate: 1_000_000,
      wasiyyah: 400_000,
      heirConsentToWasiyyah: true,
      heirs: heirs(["SON", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.validBequests).toBe(400000);
    expect(result.netDistributable).toBe(600000);
  });

  it("distributes amounts summing exactly to the net estate", () => {
    const result = calculateInheritance({
      ...base,
      grossEstate: 1_000_001,
      heirs: heirs(["WIFE", 1], ["DAUGHTER", 1], ["FATHER", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    const total = result.outcomes
      .filter((o) => o.status === "ELIGIBLE")
      .reduce((acc, o) => acc + (o.amount ?? 0), 0);
    expect(total).toBeCloseTo(result.netDistributable, 2);
  });
});

describe("Sunni-majority extended heirs", () => {
  it("sole distant kindred takes the residue", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["DISTANT_KINDRED", 1]) });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.adjustment).toBe("NONE");
    expect(share(result, "DISTANT_KINDRED")?.fraction).toEqual({ numerator: "1", denominator: "1" });
    expect(share(result, "DISTANT_KINDRED")?.referenceIds).toContain("INH-DISTANT-KINDRED");
  });

  it("spouse and distant kindred divide the estate equally", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "FEMALE",
      heirs: heirs(["HUSBAND", 1], ["DISTANT_KINDRED", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(share(result, "HUSBAND")?.fraction).toEqual({ numerator: "1", denominator: "2" });
    expect(share(result, "DISTANT_KINDRED")?.fraction).toEqual({ numerator: "1", denominator: "2" });
  });

  it("a closer non-spouse heir excludes distant kindred before Radd is applied", () => {
    const result = calculateInheritance({
      ...base,
      heirs: heirs(["DAUGHTER", 1], ["DISTANT_KINDRED", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(excludedBy(result, "DISTANT_KINDRED")?.excludedBy).toBe("DAUGHTER");
    expect(share(result, "DAUGHTER")?.fraction).toEqual({ numerator: "1", denominator: "1" });
  });

  it("refuses more than one generic distant kindred", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["DISTANT_KINDRED", 2]) });
    expect(result.supported).toBe(false);
    if (!result.supported) expect(result.reason).toContain("logical maximum");
  });

  it("applies Zayd's sharing method when it is more favourable than one third", () => {
    const oneBrother = calculateInheritance({
      ...base,
      heirs: heirs(["PATERNAL_GRANDFATHER", 1], ["FULL_BROTHER", 1]),
    });
    expect(oneBrother.supported).toBe(true);
    if (oneBrother.supported) {
      expect(share(oneBrother, "PATERNAL_GRANDFATHER")?.fraction).toEqual({ numerator: "1", denominator: "2" });
      expect(share(oneBrother, "FULL_BROTHER")?.fraction).toEqual({ numerator: "1", denominator: "2" });
    }

    const oneSister = calculateInheritance({
      ...base,
      heirs: heirs(["PATERNAL_GRANDFATHER", 1], ["FULL_SISTER", 1]),
    });
    expect(oneSister.supported).toBe(true);
    if (oneSister.supported) {
      expect(share(oneSister, "PATERNAL_GRANDFATHER")?.fraction).toEqual({ numerator: "2", denominator: "3" });
      expect(share(oneSister, "FULL_SISTER")?.fraction).toEqual({ numerator: "1", denominator: "3" });
    }
  });

  it("gives the grandfather one third when sharing would give less", () => {
    const result = calculateInheritance({
      ...base,
      heirs: heirs(["PATERNAL_GRANDFATHER", 1], ["FULL_BROTHER", 3]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(share(result, "PATERNAL_GRANDFATHER")?.fraction).toEqual({ numerator: "1", denominator: "3" });
    expect(share(result, "FULL_BROTHER")?.fraction).toEqual({ numerator: "2", denominator: "3" });
    expect(share(result, "PATERNAL_GRANDFATHER")?.referenceIds).toContain("INH-GRANDFATHER-SIBLINGS");
  });

  it("refuses disputed grandfather cases with other quota heirs", () => {
    const withDaughter = calculateInheritance({
      ...base,
      heirs: heirs(["PATERNAL_GRANDFATHER", 1], ["DAUGHTER", 1], ["FULL_BROTHER", 1]),
    });
    expect(withDaughter.supported).toBe(false);
    if (!withDaughter.supported) expect(withDaughter.reason).toContain("scholarly verification");

    const withMother = calculateInheritance({
      ...base,
      heirs: heirs(["PATERNAL_GRANDFATHER", 1], ["MOTHER", 1], ["FULL_SISTER", 1]),
    });
    expect(withMother.supported).toBe(false);
    if (!withMother.supported) expect(withMother.reason).toContain("scholarly verification");
  });

  it("paternal grandfather excludes maternal siblings", () => {
    const result = calculateInheritance({
      ...base,
      heirs: heirs(["PATERNAL_GRANDFATHER", 1], ["MATERNAL_BROTHER", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(excludedBy(result, "MATERNAL_BROTHER")?.excludedBy).toBe("PATERNAL_GRANDFATHER");
    expect(share(result, "PATERNAL_GRANDFATHER")?.fraction).toEqual({ numerator: "1", denominator: "1" });
  });

  it("a full brother excludes paternal half-siblings", () => {
    const result = calculateInheritance({
      ...base,
      heirs: heirs(["FULL_BROTHER", 1], ["PATERNAL_SISTER", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(excludedBy(result, "PATERNAL_SISTER")?.excludedBy).toBe("FULL_BROTHER");
    expect(share(result, "FULL_BROTHER")?.fraction).toEqual({ numerator: "1", denominator: "1" });
  });

  it("one full sister completes one paternal sister at 1/6 before Radd", () => {
    const result = calculateInheritance({
      ...base,
      heirs: heirs(["FULL_SISTER", 1], ["PATERNAL_SISTER", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.adjustment).toBe("RADD");
    expect(share(result, "FULL_SISTER")?.fraction).toEqual({ numerator: "3", denominator: "4" });
    expect(share(result, "PATERNAL_SISTER")?.fraction).toEqual({ numerator: "1", denominator: "4" });
  });

  it("two full sisters exclude a paternal sister unless a paternal brother is present", () => {
    const withoutPaternalBrother = calculateInheritance({
      ...base,
      heirs: heirs(["FULL_SISTER", 2], ["PATERNAL_SISTER", 1]),
    });
    expect(excludedBy(withoutPaternalBrother, "PATERNAL_SISTER")?.excludedBy).toBe("FULL_SISTER");

    const withPaternalBrother = calculateInheritance({
      ...base,
      heirs: heirs(["FULL_SISTER", 2], ["PATERNAL_BROTHER", 1], ["PATERNAL_SISTER", 1]),
    });
    expect(excludedBy(withPaternalBrother, "PATERNAL_SISTER")).toBeNull();
  });

  it("son's son and son's daughter divide as 2:1 when no daughter exists", () => {
    const result = calculateInheritance({
      ...base,
      heirs: heirs(["SONS_SON", 1], ["SONS_DAUGHTER", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(share(result, "SONS_SON")?.fraction).toEqual({ numerator: "2", denominator: "3" });
    expect(share(result, "SONS_DAUGHTER")?.fraction).toEqual({ numerator: "1", denominator: "3" });
  });

  it("supports brothers' sons, uncles and other agnatic residuaries by rank", () => {
    const categories: HeirType[] = [
      "FULL_BROTHERS_SON",
      "PATERNAL_BROTHERS_SON",
      "FULL_PATERNAL_UNCLE",
      "PATERNAL_UNCLE",
      "OTHER_AGNATIC",
    ];
    for (const type of categories) {
      const result = calculateInheritance({ ...base, heirs: heirs([type, 1]) });
      expect(result.supported, `${type} should be supported`).toBe(true);
      if (result.supported) {
        expect(share(result, type)?.fraction).toEqual({ numerator: "1", denominator: "1" });
      }
    }

    const ranked = calculateInheritance({
      ...base,
      heirs: heirs(["FULL_BROTHER", 1], ["FULL_BROTHERS_SON", 1]),
    });
    expect(excludedBy(ranked, "FULL_BROTHERS_SON")?.excludedBy).toBe("FULL_BROTHER");
  });

  it("refuses more than one generic nephew or uncle", () => {
    for (const type of ["FULL_BROTHERS_SON", "PATERNAL_BROTHERS_SON", "FULL_PATERNAL_UNCLE", "PATERNAL_UNCLE", "OTHER_AGNATIC"] as HeirType[]) {
      const result = calculateInheritance({ ...base, heirs: heirs([type, 2]) });
      expect(result.supported, `${type} count should be refused`).toBe(false);
      if (!result.supported) expect(result.reason).toContain("logical maximum");
    }
  });
});

describe("Heir input guards", () => {
  it("refuses more than one husband", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "FEMALE",
      heirs: heirs(["HUSBAND", 2]),
    });
    expect(result.supported).toBe(false);
    if (!result.supported) expect(result.reason).toContain("maximum");
  });

  it("refuses more than four wives", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["WIFE", 5]) });
    expect(result.supported).toBe(false);
  });

  it("refuses a husband for a male deceased", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "MALE",
      heirs: heirs(["HUSBAND", 1]),
    });
    expect(result.supported).toBe(false);
    if (!result.supported) expect(result.reason).toContain("female deceased");
  });

  it("refuses a wife for a female deceased", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "FEMALE",
      heirs: heirs(["WIFE", 1]),
    });
    expect(result.supported).toBe(false);
  });

  it("refuses both a husband and a wife together", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "MALE",
      heirs: heirs(["HUSBAND", 1], ["WIFE", 1]),
    });
    expect(result.supported).toBe(false);
  });

  it("refuses two mothers", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["MOTHER", 2]) });
    expect(result.supported).toBe(false);
  });
});

describe("Tashih (corrected base) and per-individual amounts", () => {
  it("enlarges the base so a group of three daughters receives whole parts", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "FEMALE",
      heirs: heirs(["HUSBAND", 1], ["DAUGHTER", 3], ["FATHER", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.adjustment).toBe("NONE");
    expect(result.baseDenominator).toBe(36);
    const daughters = result.tashih.parts.find((p) => p.type === "DAUGHTER");
    expect(daughters?.groupParts).toBe(24);
    expect(daughters?.perIndividualParts).toBe(8);
    expect(daughters?.count).toBe(3);
  });

  it("exposes per-individual fractions and amounts for grouped heirs", () => {
    const result = calculateInheritance({
      ...base,
      grossEstate: 1_000,
      heirs: heirs(["SON", 3]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    const son = share(result, "SON");
    expect(son?.count).toBe(3);
    expect(son?.fraction).toEqual({ numerator: "1", denominator: "1" });
    expect(son?.perIndividualFraction).toEqual({ numerator: "1", denominator: "3" });
    expect(son?.amount).toBe(1000);
    expect(son?.perIndividualAmount).toBeCloseTo(333.34, 2);
    const parts = result.tashih.parts.find((p) => p.type === "SON");
    expect(parts?.groupParts).toBe(3);
    expect(parts?.perIndividualParts).toBe(1);
  });

  it("keeps group amounts summing to the net estate with uneven minor units", () => {
    const result = calculateInheritance({
      ...base,
      grossEstate: 1_000.01,
      heirs: heirs(["SON", 3]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    const son = share(result, "SON");
    expect(son?.amount).toBeCloseTo(1000.01, 2);
    expect(son?.perIndividualAmount).toBeDefined();
    expect((son?.perIndividualAmount ?? 0) * 3).toBeCloseTo(1000.01, 1);
  });
});

describe("Radd and spouse treatment", () => {
  it("excludes the spouse from Radd when another fixed-share heir exists", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "FEMALE",
      heirs: heirs(["HUSBAND", 1], ["DAUGHTER", 1]),
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.adjustment).toBe("RADD");
    expect(share(result, "HUSBAND")?.fraction).toEqual({ numerator: "1", denominator: "4" });
    expect(share(result, "DAUGHTER")?.fraction).toEqual({ numerator: "3", denominator: "4" });
  });

  it("refuses a spouse-only case because the surplus belongs to the bayt al-mal", () => {
    const result = calculateInheritance({
      ...base,
      deceasedGender: "FEMALE",
      heirs: heirs(["HUSBAND", 1]),
    });
    expect(result.supported).toBe(false);
    if (!result.supported) expect(result.reason).toContain("bayt al-mal");
  });
});

describe("Munasakha (multiple deceased)", () => {
  const person = (
    id: string,
    overrides: Partial<MunasakhaCalculationInput["deceased"][number]> = {},
  ): MunasakhaCalculationInput["deceased"][number] => ({
    id,
    deceasedGender: "MALE",
    dateOfDeath: "2026-01-01",
    grossEstate: 0,
    funeralExpenses: 0,
    debts: 0,
    wasiyyah: 0,
    otherObligations: 0,
    heirConsentToWasiyyah: false,
    heirs: [],
    ...overrides,
  });

  it("passes an inherited share into the next estate and avoids double counting", () => {
    const result = calculateMunasakha({
      madhhab: "SUNNI_MAJORITY",
      methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
      currency: "BDT",
      deceased: [
        person("a", { grossEstate: 1200, heirs: heirs(["WIFE", 1], ["SON", 1]) }),
        person("b", {
          grossEstate: 0,
          heirs: heirs(["WIFE", 1], ["SON", 1]),
          inheritsFrom: { fromId: "a", heirType: "SON" },
        }),
      ],
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.cases).toHaveLength(2);
    expect(result.cases[0]!.result.netDistributable).toBe(1200);
    expect(result.cases[1]!.inheritedAmount).toBe(1050);
    expect(result.cases[1]!.result.grossEstate).toBeCloseTo(1050, 2);
    expect(result.totalPassedThrough).toBeCloseTo(1050, 2);
    expect(result.totalNetEstate).toBeCloseTo(2250, 2);
    expect(result.totalDistributed).toBeCloseTo(1200, 2);
  });

  it("chains more than two deceased in sequence", () => {
    const result = calculateMunasakha({
      madhhab: "SUNNI_MAJORITY",
      methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
      currency: "BDT",
      deceased: [
        person("a", { grossEstate: 800, heirs: heirs(["SON", 1]) }),
        person("b", {
          heirs: heirs(["SON", 1]),
          inheritsFrom: { fromId: "a", heirType: "SON" },
        }),
        person("c", {
          heirs: heirs(["SON", 1]),
          inheritsFrom: { fromId: "b", heirType: "SON" },
        }),
      ],
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.cases).toHaveLength(3);
    expect(result.cases[1]!.inheritedAmount).toBe(800);
    expect(result.cases[2]!.inheritedAmount).toBe(800);
    expect(result.totalPassedThrough).toBe(1600);
    expect(result.totalDistributed).toBe(800);
  });

  it("refuses a link to a non-eligible heir", () => {
    const result = calculateMunasakha({
      madhhab: "SUNNI_MAJORITY",
      methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
      currency: "BDT",
      deceased: [
        person("a", { grossEstate: 1200, heirs: heirs(["SON", 1], ["FULL_BROTHER", 1]) }),
        person("b", {
          heirs: heirs(["SON", 1]),
          inheritsFrom: { fromId: "a", heirType: "FULL_BROTHER" },
        }),
      ],
    });
    expect(result.supported).toBe(false);
    if (!result.supported) expect(result.reason).toContain("not an eligible heir");
  });

  it("refuses a link that references a later deceased", () => {
    const result = calculateMunasakha({
      madhhab: "SUNNI_MAJORITY",
      methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
      currency: "BDT",
      deceased: [
        person("a", { heirs: heirs(["SON", 1]), inheritsFrom: { fromId: "b", heirType: "SON" } }),
        person("b", { heirs: heirs(["SON", 1]) }),
      ],
    });
    expect(result.supported).toBe(false);
    if (!result.supported) expect(result.reason).toContain("appear before");
  });
});
