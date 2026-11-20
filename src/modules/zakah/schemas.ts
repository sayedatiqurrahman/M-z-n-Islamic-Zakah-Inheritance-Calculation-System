import { z } from "zod";

const assetCategory = z.enum([
  "CASH_HOME", "CASH_BANK", "SAVINGS", "CURRENT_ACCOUNT", "FOREIGN_CURRENCY", "DIGITAL_MONEY",
  "GOLD_JEWELRY", "GOLD_INVESTMENT", "GOLD_BARS", "GOLD_COINS",
  "SILVER_JEWELRY", "SILVER_INVESTMENT", "SILVER_BARS",
  "BUSINESS_MERCHANDISE", "BUSINESS_INVENTORY", "BUSINESS_RECEIVABLE", "BUSINESS_CASH",
  "SHARES_STOCKS", "OTHER_INVESTMENT", "OTHER_ASSET",
]);

const liabilityType = z.enum([
  "IMMEDIATE_DEBT", "BUSINESS_LIABILITY", "OTHER_DEDUCTIBLE", "LONG_TERM_LOAN", "NON_DEDUCTIBLE",
]);

const money = z.number().finite().min(0).max(1e15);
const rate = z.number().finite().min(0).max(1e6);

export const zakahAssetSchema = z.object({
  id: z.string().min(1),
  category: assetCategory,
  label: z.string().max(120).optional(),
  amount: money.optional(),
  weightGrams: money.optional(),
  purity: z.number().min(0).max(1).optional(),
  marketValue: money.optional(),
  currency: z.string().min(3).max(4),
  conversionRateToBase: rate,
});

export const zakahLiabilitySchema = z.object({
  id: z.string().min(1),
  type: liabilityType,
  label: z.string().max(120).optional(),
  amount: money,
  currency: z.string().min(3).max(4),
  conversionRateToBase: rate,
  dueNow: z.boolean(),
});

export const zakahRequestSchema = z.object({
  madhhab: z.literal("HANAFI"),
  methodologyVersion: z.string().min(1).max(64),
  currency: z.string().min(3).max(4),
  ownershipConfirmed: z.boolean(),
  growthConditionConfirmed: z.boolean(),
  assets: z.array(zakahAssetSchema).max(100),
  liabilities: z.array(zakahLiabilitySchema).max(100),
  nisab: z.object({
    method: z.enum(["GOLD", "SILVER"]),
    goldNisabGrams: money,
    silverNisabGrams: money,
    goldPricePerGram: money,
    silverPricePerGram: money,
    priceSource: z.string().max(200),
    isManual: z.boolean(),
    recordedAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
    currency: z.string().min(3).max(4),
    valuationNote: z.string().max(500).optional(),
  }),
  hawl: z.object({
    nisabFirstReachedDate: z.string().min(1),
    assessmentDate: z.string().min(1),
    previousZakahDate: z.string().min(1).optional(),
    hijriAssessmentDate: z.string().max(40).optional(),
    calendarMethod: z.enum(["TABULAR_CIVIL", "UMM_AL_QURA_APPROX"]),
    wealthRemainedAboveNisab: z.boolean(),
  }),
}).strict();

export type ZakahRequest = z.infer<typeof zakahRequestSchema>;
