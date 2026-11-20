import type { CalculationStepData, UnsupportedResult } from "@/modules/fiqh/types";

export type HeirType =
  | "HUSBAND"
  | "WIFE"
  | "FATHER"
  | "MOTHER"
  | "PATERNAL_GRANDFATHER"
  | "PATERNAL_GRANDMOTHER"
  | "MATERNAL_GRANDMOTHER"
  | "SON"
  | "DAUGHTER"
  | "SONS_SON"
  | "SONS_DAUGHTER"
  | "FULL_BROTHER"
  | "FULL_SISTER"
  | "PATERNAL_BROTHER"
  | "PATERNAL_SISTER"
  | "MATERNAL_BROTHER"
  | "MATERNAL_SISTER"
  | "FULL_BROTHERS_SON"
  | "PATERNAL_BROTHERS_SON"
  | "PATERNAL_UNCLE"
  | "FULL_PATERNAL_UNCLE"
  | "OTHER_AGNATIC"
  | "DISTANT_KINDRED";

export interface HeirInput {
  type: HeirType;
  count: number;
}

export interface InheritanceCalculationInput {
  madhhab: "HANAFI";
  methodologyVersion: string;
  currency: string;
  deceasedGender: "MALE" | "FEMALE";
  dateOfDeath: string;
  grossEstate: number;
  funeralExpenses: number;
  debts: number;
  wasiyyah: number;
  otherObligations: number;
  heirConsentToWasiyyah: boolean;
  heirs: HeirInput[];
}

export interface SerializedFraction {
  numerator: string;
  denominator: string;
}

export type ShareType = "FIXED" | "RESIDUARY";
export type ExclusionKind = "NONE" | "PARTIAL" | "COMPLETE";

export interface HeirOutcome {
  type: HeirType;
  count: number;
  status: "ELIGIBLE" | "EXCLUDED";
  exclusionKind: ExclusionKind;
  excludedBy?: HeirType;
  reason: string;
  principle: string;
  referenceIds: string[];
  shareType?: ShareType;
  fraction?: SerializedFraction;
  amount?: number;
  explanation: string;
}

export type AdjustmentType = "NONE" | "AWL" | "RADD";

export interface InheritanceCalculationResult {
  supported: true;
  madhhab: "HANAFI";
  methodologyVersion: string;
  currency: string;
  grossEstate: number;
  funeralExpenses: number;
  debts: number;
  validBequests: number;
  netDistributable: number;
  adjustment: AdjustmentType;
  baseDenominator: number;
  outcomes: HeirOutcome[];
  steps: CalculationStepData[];
  notes: string[];
}

export type InheritanceEngineResult = InheritanceCalculationResult | UnsupportedResult;
