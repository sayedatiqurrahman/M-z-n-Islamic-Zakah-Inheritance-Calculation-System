import type { EvidenceReference } from "../types";

export type MadhhabKey = "HANAFI" | "SHAFI" | "MALIKI" | "HANBALI";

/**
 * Contract for a school-of-jurisprudence provider.
 * Only Hanafi is implemented in v1. Other providers are registered as
 * disabled stubs and must never silently fall back to Hanafi rules.
 */
export interface MadhhabProvider {
  key: MadhhabKey;
  enabled: boolean;
  nameEn: string;
  nameAr: string;
  nameBn: string;
  zakahMethodologyVersion: string;
  inheritanceMethodologyVersion: string;
  getReferenceMap(): Record<string, EvidenceReference[]>;
}
