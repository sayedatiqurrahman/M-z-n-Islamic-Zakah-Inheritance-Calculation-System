import { describe, expect, it } from "vitest";
import { calculateInheritance, calculateMunasakha } from "@/modules/inheritance/engine";
import type { InheritanceCalculationInput, HeirType, MunasakhaCalculationInput } from "@/modules/inheritance/types";
import { INHERITANCE_METHODOLOGY_VERSION } from "@/modules/inheritance/rules";

const base: InheritanceCalculationInput = {
  madhhab: "HANAFI",
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

describe("Hanafi inheritance engine", () => {
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

  it("father excludes paternal grandfather", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["FATHER", 1], ["PATERNAL_GRANDFATHER", 1]) });
    const grandfather = result.supported ? result.outcomes.find((o) => o.type === "PATERNAL_GRANDFATHER") : null;
    expect(grandfather?.status).toBe("EXCLUDED");
    expect(grandfather?.excludedBy).toBe("FATHER");
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

  it("refuses distant kindred", () => {
    const result = calculateInheritance({ ...base, heirs: heirs(["DISTANT_KINDRED", 1]) });
    expect(result.supported).toBe(false);
    if (!result.supported) expect(result.reason).toContain("scholarly verification");
  });

  it("refuses grandfather with siblings", () => {
    const result = calculateInheritance({
      ...base,
      heirs: heirs(["PATERNAL_GRANDFATHER", 1], ["FULL_BROTHER", 1]),
    });
    expect(result.supported).toBe(false);
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

describe("Hanafi heir input guards", () => {
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
      madhhab: "HANAFI",
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
      madhhab: "HANAFI",
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
      madhhab: "HANAFI",
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
      madhhab: "HANAFI",
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
