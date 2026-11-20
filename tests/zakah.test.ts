import { describe, expect, it } from "vitest";
import { calculateZakah } from "@/modules/zakah/engine";
import type { ZakahCalculationInput } from "@/modules/zakah/types";
import { ZAKAH_METHODOLOGY_VERSION } from "@/modules/zakah/rules";

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
