export type VerificationStatus =
  | "UNVERIFIED"
  | "REFERENCE_REQUIRED"
  | "VERIFIED_BY_SCHOLAR"
  | "NEEDS_REVIEW";

export type EvidenceType = "QURAN" | "HADITH" | "CLASSICAL" | "CONTEMPORARY" | "INSTITUTIONAL";

export type AuthenticityStatus = "SAHIH" | "HASAN" | "DAIF" | "DISPUTED" | "UNVERIFIED";

/** Compact reference shown in a tooltip. Full details live in the references DB / trusted external source. */
export interface EvidenceReference {
  id: string;
  type: EvidenceType;
  label: string;
  labelAr?: string;
  excerpt?: string;
  author?: string;
  translation?: string;
  authenticity?: AuthenticityStatus;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  note?: string;
}

export interface RuleReference {
  ruleId: string;
  title: string;
  principle: string;
  verificationStatus: VerificationStatus;
  sourceUrl?: string;
  evidence: EvidenceReference[];
  note?: string;
}

export interface CalculationStepData {
  step: number;
  title: string;
  calculation: string;
  result: string;
  fiqhPrinciple: string;
  reason: string;
  evidence: EvidenceReference[];
  references: string[];
  notes: string[];
  ruleId?: string;
}

export interface UnsupportedResult {
  supported: false;
  reason: string;
  steps: CalculationStepData[];
}

export const UNSUPPORTED_MESSAGE =
  "Calculation requires scholarly verification. This case is not currently supported by the verified Hanafi rules engine.";

export function unsupported(reason?: string, steps: CalculationStepData[] = []): UnsupportedResult {
  return { supported: false, reason: reason ?? UNSUPPORTED_MESSAGE, steps };
}
