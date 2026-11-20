import { describe, expect, it } from "vitest";
import { calculateInheritance } from "@/modules/inheritance/engine";
import type { InheritanceCalculationInput, HeirType } from "@/modules/inheritance/types";
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
