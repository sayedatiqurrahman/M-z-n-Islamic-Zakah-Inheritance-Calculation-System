import type { CalculationStepData, EvidenceReference, UnsupportedResult } from "@/modules/fiqh/types";

export type InheritanceMadhhab = "HANAFI" | "SUNNI_MAJORITY";

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
  madhhab: InheritanceMadhhab;
  methodologyVersion: string;
  currency: string;
  deceasedGender: "MALE" | "FEMALE";
  dateOfDeath: string;
  deceasedName?: string;
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
  /** Share of the whole estate held by the group (all individuals of this type). */
  fraction?: SerializedFraction;
  /** Share of the whole estate held by one individual of this type. */
  perIndividualFraction?: SerializedFraction;
  /** Group amount in the calculation currency. */
  amount?: number;
  /** Amount received by one individual of this type. */
  perIndividualAmount?: number;
  /** Number of siham (parts) in the tashih base for the group. */
  parts?: number;
  /** Number of siham for one individual in the tashih base. */
  perIndividualParts?: number;
  explanation: string;
}

export type AdjustmentType = "NONE" | "AWL" | "RADD" | "DISTANT_KINDRED";

export interface TashihPart {
  type: HeirType;
  count: number;
  /** Parts assigned to the whole group in the corrected base. */
  groupParts: number;
  /** Parts assigned to one individual. */
  perIndividualParts: number;
}

export interface TashihResult {
  /** Corrected common denominator (أصل المسألة بعد التصحيح). */
  base: number;
  parts: TashihPart[];
}

export interface InheritanceCalculationResult {
  supported: true;
  madhhab: InheritanceMadhhab;
  methodologyVersion: string;
  /** Explicit name of the Sunni-majority basis used for every supported case. */
  methodologyBasis: "SUNNI_MAJORITY";
  /** Classical kitabs behind the encoded methodology, with verification states. */
  sources: EvidenceReference[];
  currency: string;
  grossEstate: number;
  funeralExpenses: number;
  debts: number;
  validBequests: number;
  netDistributable: number;
  adjustment: AdjustmentType;
  baseDenominator: number;
  tashih: TashihResult;
  outcomes: HeirOutcome[];
  steps: CalculationStepData[];
  notes: string[];
}

export type InheritanceEngineResult = InheritanceCalculationResult | UnsupportedResult;

// ---------------------------------------------------------------------------
// Munasakha (مناسخة): a second death before the first estate is distributed.
// ---------------------------------------------------------------------------

/** Link from a later deceased to the share they inherited from an earlier one. */
export interface MunasakhaLink {
  /** Local id of the earlier deceased in the same request. */
  fromId: string;
  /** The capacity in which the later deceased inherited from the earlier one. */
  heirType: HeirType;
}

export interface MunasakhaDeceasedInput
  extends Omit<InheritanceCalculationInput, "madhhab" | "methodologyVersion" | "currency"> {
  /** Stable local identifier used by `inheritsFrom`. */
  id: string;
  inheritsFrom?: MunasakhaLink;
}

export interface MunasakhaCalculationInput {
  madhhab: InheritanceMadhhab;
  methodologyVersion: string;
  currency: string;
  deceased: MunasakhaDeceasedInput[];
}

export interface MunasakhaCaseResult {
  id: string;
  name?: string;
  /** Amount received from the earlier estate and added to this estate. */
  inheritedAmount: number;
  inheritedFrom?: {
    deceasedId: string;
    deceasedName?: string;
    heirType: HeirType;
  };
  result: InheritanceCalculationResult;
}

export interface MunasakhaCalculationResult {
  supported: true;
  madhhab: InheritanceMadhhab;
  methodologyVersion: string;
  methodologyBasis: "SUNNI_MAJORITY";
  sources: EvidenceReference[];
  currency: string;
  cases: MunasakhaCaseResult[];
  /** Total net estate of every case, including amounts inherited from earlier cases. */
  totalNetEstate: number;
  /** Amount passed from one deceased's estate into a later deceased's estate. */
  totalPassedThrough: number;
  /** Amount ultimately reaching living heirs (total net estate minus pass-through). */
  totalDistributed: number;
  steps: CalculationStepData[];
  notes: string[];
}

export type MunasakhaEngineResult = MunasakhaCalculationResult | UnsupportedResult;
