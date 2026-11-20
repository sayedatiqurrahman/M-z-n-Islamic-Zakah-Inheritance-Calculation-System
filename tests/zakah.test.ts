import { describe, expect, it } from "vitest";
import { calculateZakah } from "@/modules/zakah/engine";
import type { ZakahAssetCategory, ZakahCalculationInput } from "@/modules/zakah/types";
import { ZAKAH_METHODOLOGY_VERSION } from "@/modules/zakah/rules";
import { zakahRequestSchema } from "@/modules/zakah/schemas";

const base: ZakahCalculationInput = {
  madhhab: "HANAFI",
  methodologyVersion: ZAKAH_METHODOLOGY_VERSION,
  currency: "BDT",
  ownershipConfirmed: true,
  growthConditionConfirmed: true,
  assets: [],
  liabilities: [],
  nisab: {
    method: "SILVER",
    goldNisabGrams: 85,
    silverNisabGrams: 595,
    goldPricePerGram: 12000,
    silverPricePerGram: 150,
    priceSource: "manual test",
    isManual: true,
    recordedAt: "2026-01-01T00:00:00Z",
    currency: "BDT",
  },
  hawl: {
    nisabFirstReachedDate: "2025-01-01",
    assessmentDate: "2026-01-01",
    calendarMethod: "TABULAR_CIVIL",
    wealthRemainedAboveNisab: true,
  },
};

function cash(amount: number) {
  return {
    id: "cash", category: "CASH_HOME" as const, amount, currency: "BDT", conversionRateToBase: 1,
  };
}

describe("Zakah engine", () => {
  it("returns zero when wealth is below Nisab", () => {
    const result = calculateZakah({ ...base, assets: [cash(50000)] });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.nisabReached).toBe(false);
    expect(result.zakahPayable).toBe(0);
  });

  it("charges 2.5% when wealth equals Nisab", () => {
    const result = calculateZakah({ ...base, assets: [cash(89250)] });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.nisabReached).toBe(true);
    expect(result.zakahPayable).toBe(2231.25);
  });

  it("charges 2.5% above Nisab", () => {
    const result = calculateZakah({ ...base, assets: [cash(1_000_000)] });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.zakahPayable).toBe(25000);
  });

  it("deducts only eligible liabilities", () => {
    const result = calculateZakah({
      ...base,
      assets: [cash(1_000_000)],
      liabilities: [
        { id: "d1", type: "IMMEDIATE_DEBT", amount: 100000, currency: "BDT", conversionRateToBase: 1, dueNow: true },
        { id: "d2", type: "LONG_TERM_LOAN", amount: 500000, currency: "BDT", conversionRateToBase: 1, dueNow: true },
      ],
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.totalDeductibleLiabilities).toBe(100000);
    expect(result.netZakahableWealth).toBe(900000);
    expect(result.zakahPayable).toBe(22500);
  });

  it("combines cash and gold", () => {
    const result = calculateZakah({
      ...base,
      assets: [
        cash(500000),
        { id: "gold", category: "GOLD_JEWELRY", weightGrams: 100, purity: 1, currency: "BDT", conversionRateToBase: 1 },
      ],
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.totalAssets).toBe(500000 + 100 * 12000);
  });

  it("refuses unverified asset categories", () => {
    const result = calculateZakah({
      ...base,
      assets: [{ id: "s", category: "SHARES_STOCKS", amount: 100000, currency: "BDT", conversionRateToBase: 1 }],
    });
    expect(result.supported).toBe(false);
  });

  it("refuses when Hawl is not complete via wealth fluctuation", () => {
    const result = calculateZakah({
      ...base,
      assets: [cash(1_000_000)],
      hawl: { ...base.hawl, wealthRemainedAboveNisab: false },
    });
    expect(result.supported).toBe(false);
  });

  it("uses gold Nisab when selected", () => {
    const result = calculateZakah({
      ...base,
      nisab: { ...base.nisab, method: "GOLD" },
      assets: [cash(1_000_000)],
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.nisabValue).toBe(85 * 12000);
  });
});

describe("in-kind schedules", () => {
  function livestock(category: ZakahAssetCategory, quantity: number, unitValue = 0) {
    return {
      id: category,
      category,
      quantity,
      unitValue,
      currency: "BDT",
      conversionRateToBase: 1,
    } as const;
  }

  it("applies the goat/sheep tiers without treating them as money", () => {
    const result = calculateZakah({ ...base, assets: [cash(1_000_000), livestock("LIVESTOCK_GOAT_SHEEP", 250, 8000)] });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.totalAssets).toBe(1_000_000);
    expect(result.inKindDues[0].dueDescription).toBe("3 goats or sheep");
    expect(result.inKindDues[0].estimatedValue).toBe(24000);
    expect(result.totalPayable).toBe(result.zakahPayable + 24000);
  });

  it("extends the goat/sheep tier by one animal per 100 above 300", () => {
    const result = calculateZakah({ ...base, assets: [livestock("LIVESTOCK_GOAT_SHEEP", 501)] });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.inKindDues[0].dueQuantity).toBe(6);
  });

  it("uses the cattle age schedule", () => {
    const result = calculateZakah({ ...base, assets: [livestock("LIVESTOCK_CATTLE", 75)] });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.inKindDues[0].dueDescription).toBe("1 two-year-old + 1 one-year-old");
    expect(result.inKindDues[0].dueQuantity).toBe(2);
  });

  it("states no camel due below the nisab of five", () => {
    const result = calculateZakah({ ...base, assets: [livestock("LIVESTOCK_CAMEL", 4)] });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.inKindDues[0].nisabReached).toBe(false);
    expect(result.inKindDues[0].dueQuantity).toBe(0);
  });

  it("refuses camel counts above the encoded schedule", () => {
    const result = calculateZakah({ ...base, assets: [livestock("LIVESTOCK_CAMEL", 151)] });
    expect(result.supported).toBe(false);
    if (result.supported) return;
    expect(result.reason).toContain("above the encoded classical schedule");
  });

  it("applies 10% rain-fed and 5% irrigated crop rates", () => {
    const rain = calculateZakah({
      ...base,
      assets: [{ ...livestock("CROP_WHEAT", 1000, 40), irrigation: "RAIN_FED" }],
    });
    const irrigated = calculateZakah({
      ...base,
      assets: [{ ...livestock("CROP_WHEAT", 1000, 40), irrigation: "IRRIGATED" }],
    });
    expect(rain.supported && irrigated.supported).toBe(true);
    if (!rain.supported || !irrigated.supported) return;
    expect(rain.inKindDues[0].dueQuantity).toBe(100);
    expect(irrigated.inKindDues[0].dueQuantity).toBe(50);
    expect(rain.inKindDues[0].estimatedValue).toBe(4000);
  });

  it("does not charge crops below the 5-wasq nisab", () => {
    const result = calculateZakah({
      ...base,
      assets: [{ ...livestock("CROP_DATES", 600), irrigation: "RAIN_FED" }],
    });
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.inKindDues[0].dueQuantity).toBe(0);
  });

  it("refuses mixed irrigation and unencoded produce", () => {
    const mixed = calculateZakah({
      ...base,
      assets: [{ ...livestock("CROP_BARLEY", 1000), irrigation: "MIXED" }],
    });
    const other = calculateZakah({
      ...base,
      assets: [{ ...livestock("CROP_OTHER", 1000), irrigation: "RAIN_FED" }],
    });
    expect(mixed.supported).toBe(false);
    expect(other.supported).toBe(false);
  });

  it("reports all eight recipient purposes", () => {
    const result = calculateZakah(base);
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    expect(result.recipientPurposes).toHaveLength(8);
    expect(result.recipientPurposes.map((purpose) => purpose.id)).toContain("IBN_SABIL");
  });

  it("validates the extended request schema", () => {
    const parsed = zakahRequestSchema.safeParse({
      ...base,
      assets: [
        {
          id: "goats",
          category: "LIVESTOCK_GOAT_SHEEP",
          quantity: 40,
          unitValue: 5000,
          currency: "BDT",
          conversionRateToBase: 1,
        },
        {
          id: "wheat",
          category: "CROP_WHEAT",
          quantity: 700,
          irrigation: "IRRIGATED",
          currency: "BDT",
          conversionRateToBase: 1,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
