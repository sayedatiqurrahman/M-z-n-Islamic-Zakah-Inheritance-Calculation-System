import { z } from "zod";

const assetCategory = z.enum([
  "CASH_HOME", "CASH_BANK", "SAVINGS", "CURRENT_ACCOUNT", "FOREIGN_CURRENCY", "DIGITAL_MONEY",
  "GOLD_JEWELRY", "GOLD_INVESTMENT", "GOLD_BARS", "GOLD_COINS",
  "SILVER_JEWELRY", "SILVER_INVESTMENT", "SILVER_BARS",
  "BUSINESS_MERCHANDISE", "BUSINESS_INVENTORY", "BUSINESS_RECEIVABLE", "BUSINESS_CASH",
  "SHARES_STOCKS", "OTHER_INVESTMENT", "OTHER_ASSET",
  "LIVESTOCK_CAMEL", "LIVESTOCK_CATTLE", "LIVESTOCK_GOAT_SHEEP",
  "CROP_WHEAT", "CROP_BARLEY", "CROP_DATES", "CROP_GRAPES", "CROP_OTHER",
  "MINERALS_TREASURE",
]);

const liabilityType = z.enum([
  "IMMEDIATE_DEBT", "BUSINESS_LIABILITY", "OTHER_DEDUCTIBLE", "LONG_TERM_LOAN", "NON_DEDUCTIBLE",
]);

const money = z.number().finite().min(0).max(1e15);
const rate = z.number().finite().min(0).max(1e6);

function optionalNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "number" && !Number.isFinite(v)) return undefined;
    return v;
  }, schema.optional());
}

function requiredNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "number" && !Number.isFinite(v)) return undefined;
    return v;
  }, schema);
}

const optionalMoney = optionalNumber(money);
const optionalPurity = optionalNumber(z.number().min(0).max(1));
const requiredMoney = requiredNumber(money);
const requiredRate = requiredNumber(rate);

export const zakahAssetSchema = z.object({
  id: z.string().min(1),
  category: assetCategory,
  label: z.string().max(120).optional(),
  amount: optionalMoney,
  weightGrams: optionalMoney,
  purity: optionalPurity,
  marketValue: optionalMoney,
  currency: z.string().min(3).max(4),
  conversionRateToBase: requiredRate,
  quantity: optionalMoney,
  unitValue: optionalMoney,
  irrigation: z.enum(["RAIN_FED", "IRRIGATED", "MIXED"]).optional(),
});

export const zakahLiabilitySchema = z.object({
  id: z.string().min(1),
  type: liabilityType,
  label: z.string().max(120).optional(),
  amount: requiredMoney,
  currency: z.string().min(3).max(4),
  conversionRateToBase: requiredRate,
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
    goldNisabGrams: requiredMoney,
    silverNisabGrams: requiredMoney,
    goldPricePerGram: requiredMoney,
    silverPricePerGram: requiredMoney,
    priceSource: z.string().max(200),
    isManual: z.boolean(),
    recordedAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
    currency: z.string().min(3).max(4),
    valuationNote: z.string().max(500).optional(),
  }),
  hawl: z.object({
    nisabFirstReachedDate: z.string().min(1),
    assessmentDate: z.string().min(1),
    previousZakahDate: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().min(1).optional(),
    ),
    hijriAssessmentDate: z.string().max(40).optional(),
    calendarMethod: z.enum(["TABULAR_CIVIL", "UMM_AL_QURA_APPROX"]),
    wealthRemainedAboveNisab: z.boolean(),
  }),
}).strict();

export type ZakahRequest = z.infer<typeof zakahRequestSchema>;
