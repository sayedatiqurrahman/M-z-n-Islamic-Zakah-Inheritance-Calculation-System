import type { CalculationStepData } from "@/modules/fiqh/types";

export type ZakahAssetCategory =
  | "CASH_HOME"
  | "CASH_BANK"
  | "SAVINGS"
  | "CURRENT_ACCOUNT"
  | "FOREIGN_CURRENCY"
  | "DIGITAL_MONEY"
  | "GOLD_JEWELRY"
  | "GOLD_INVESTMENT"
  | "GOLD_BARS"
  | "GOLD_COINS"
  | "SILVER_JEWELRY"
  | "SILVER_INVESTMENT"
  | "SILVER_BARS"
  | "BUSINESS_MERCHANDISE"
  | "BUSINESS_INVENTORY"
  | "BUSINESS_RECEIVABLE"
  | "BUSINESS_CASH"
  | "SHARES_STOCKS"
  | "OTHER_INVESTMENT"
  | "OTHER_ASSET";

export type LiabilityType =
  | "IMMEDIATE_DEBT"
  | "BUSINESS_LIABILITY"
  | "OTHER_DEDUCTIBLE"
  | "LONG_TERM_LOAN"
  | "NON_DEDUCTIBLE";

export type NisabMethod = "GOLD" | "SILVER";

export interface ZakahAssetInput {
  id: string;
  category: ZakahAssetCategory;
  label?: string;
  /** Value in the asset's own currency (major units). For metals this may be derived from weight × purity × price. */
  amount?: number;
  weightGrams?: number;
  /** 0–1 multiplier; 24 karat = 1. */
  purity?: number;
  marketValue?: number;
  currency: string;
  /** Units of base currency per one unit of this asset currency. */
  conversionRateToBase: number;
}

export interface ZakahLiabilityInput {
  id: string;
  type: LiabilityType;
  label?: string;
  amount: number;
  currency: string;
  conversionRateToBase: number;
  /** User confirmation that the debt is due/payable now. */
  dueNow: boolean;
}

export interface NisabInput {
  method: NisabMethod;
  goldNisabGrams: number;
  silverNisabGrams: number;
  goldPricePerGram: number;
  silverPricePerGram: number;
  priceSource: string;
  isManual: boolean;
  recordedAt: string;
  currency: string;
  valuationNote?: string;
}

export interface HawlInput {
  nisabFirstReachedDate: string;
  assessmentDate: string;
  previousZakahDate?: string;
  hijriAssessmentDate?: string;
  calendarMethod: "TABULAR_CIVIL" | "UMM_AL_QURA_APPROX";
  wealthRemainedAboveNisab: boolean;
}

export interface ZakahCalculationInput {
  madhhab: "HANAFI";
  methodologyVersion: string;
  currency: string;
  ownershipConfirmed: boolean;
  growthConditionConfirmed: boolean;
  assets: ZakahAssetInput[];
  liabilities: ZakahLiabilityInput[];
  nisab: NisabInput;
  hawl: HawlInput;
}

export interface ClassifiedAsset {
  id: string;
  category: ZakahAssetCategory;
  label: string;
  valueInBase: number;
  included: boolean;
  ruleId?: string;
  reason: string;
}

export interface ClassifiedLiability {
  id: string;
  type: LiabilityType;
  label: string;
  valueInBase: number;
  deductible: boolean;
  ruleId?: string;
  reason: string;
}

export interface ZakahCalculationResult {
  supported: true;
  madhhab: "HANAFI";
  methodologyVersion: string;
  currency: string;
  totalAssets: number;
  totalDeductibleLiabilities: number;
  netZakahableWealth: number;
  nisabValue: number;
  nisabMethod: NisabMethod;
  nisabReached: boolean;
  hawlCompleted: boolean;
  rate: number;
  zakahPayable: number;
  classifiedAssets: ClassifiedAsset[];
  classifiedLiabilities: ClassifiedLiability[];
  steps: CalculationStepData[];
  notes: string[];
}
