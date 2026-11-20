import type { CalculationStepData, EvidenceReference, VerificationStatus } from "@/modules/fiqh/types";

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
  | "OTHER_ASSET"
  | "LIVESTOCK_CAMEL"
  | "LIVESTOCK_CATTLE"
  | "LIVESTOCK_GOAT_SHEEP"
  | "CROP_WHEAT"
  | "CROP_BARLEY"
  | "CROP_DATES"
  | "CROP_GRAPES"
  | "CROP_OTHER"
  | "MINERALS_TREASURE";

export type LiabilityType =
  | "IMMEDIATE_DEBT"
  | "BUSINESS_LIABILITY"
  | "OTHER_DEDUCTIBLE"
  | "LONG_TERM_LOAN"
  | "NON_DEDUCTIBLE";

export type NisabMethod = "GOLD" | "SILVER";

/** Irrigation method for crop zakah. `MIXED` deliberately has no encoded rate. */
export type IrrigationType = "RAIN_FED" | "IRRIGATED" | "MIXED";

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
  /** Head count for livestock, kilograms for crops. Used only by in-kind schedules. */
  quantity?: number;
  /** Estimated local value of one head/kilogram, used only to express an in-kind due in money. */
  unitValue?: number;
  /** Crop irrigation method; selects the classical 10% / 5% rate. */
  irrigation?: IrrigationType;
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
  /** In-kind categories are classified separately and never enter monetary wealth. */
  valuationMode: "MONETARY" | "IN_KIND";
  /** Head count / kilograms as entered, retained for the result view. */
  quantity?: number;
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

/** One in-kind zakah obligation derived from a classical schedule. */
export interface InKindDue {
  id: string;
  category: ZakahAssetCategory;
  label: string;
  quantity: number;
  unit: "head" | "kg";
  nisabQuantity: number;
  nisabReached: boolean;
  /** Crop rate (0.05 / 0.10); null for schedule-based livestock. */
  rate: number | null;
  /** Human-readable schedule outcome, e.g. "1 one-year-old calf". */
  dueDescription: string;
  /** Count of animals or kilograms due; null only when not calculable. */
  dueQuantity: number | null;
  dueUnit: "head" | "kg";
  /** Money estimate, null when no unit value was supplied. */
  estimatedValue: number | null;
  ruleId: string;
  verification: VerificationStatus;
  explanation: string;
}

/** One of the eight recipient purposes of zakah in Qur'an 9:60. */
export interface ZakahRecipientPurpose {
  id: string;
  arabic: string;
  label: string;
  explanation: string;
  verification: VerificationStatus;
  evidence: EvidenceReference[];
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
  /** Monetary zakah (2.5% of net wealth). */
  zakahPayable: number;
  /** Sum of the money estimates of all in-kind dues (0 when no unit values supplied). */
  totalInKindValue: number;
  /** Monetary zakah plus the estimated value of in-kind dues. */
  totalPayable: number;
  inKindDues: InKindDue[];
  recipientPurposes: ZakahRecipientPurpose[];
  classifiedAssets: ClassifiedAsset[];
  classifiedLiabilities: ClassifiedLiability[];
  steps: CalculationStepData[];
  notes: string[];
}
