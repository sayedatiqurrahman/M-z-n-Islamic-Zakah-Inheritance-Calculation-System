import { EVIDENCE } from "@/modules/fiqh/evidences/catalog";
import type { RuleReference } from "@/modules/fiqh/types";
import type { HeirType } from "./types";

export const INHERITANCE_METHODOLOGY_VERSION = "hanafi-inheritance-v1.0.0";

/** Heir categories not yet backed by a verified rule in this engine. */
export const UNSUPPORTED_HEIR_TYPES: HeirType[] = [
  "DISTANT_KINDRED",
  "OTHER_AGNATIC",
  "PATERNAL_UNCLE",
  "FULL_PATERNAL_UNCLE",
  "FULL_BROTHERS_SON",
  "PATERNAL_BROTHERS_SON",
];

/**
 * Logical upper bound for the number of living individuals in each category.
 * A person has one father, one mother and at most four wives; a husband is a
 * single person. These bounds stop nonsensical inputs such as two husbands.
 */
export const HEIR_MAX_COUNTS: Record<HeirType, number> = {
  HUSBAND: 1,
  WIFE: 4,
  FATHER: 1,
  MOTHER: 1,
  PATERNAL_GRANDFATHER: 1,
  PATERNAL_GRANDMOTHER: 1,
  MATERNAL_GRANDMOTHER: 1,
  SON: 20,
  DAUGHTER: 20,
  SONS_SON: 20,
  SONS_DAUGHTER: 20,
  FULL_BROTHER: 20,
  FULL_SISTER: 20,
  PATERNAL_BROTHER: 20,
  PATERNAL_SISTER: 20,
  MATERNAL_BROTHER: 20,
  MATERNAL_SISTER: 20,
  FULL_BROTHERS_SON: 20,
  PATERNAL_BROTHERS_SON: 20,
  PATERNAL_UNCLE: 20,
  FULL_PATERNAL_UNCLE: 20,
  OTHER_AGNATIC: 20,
  DISTANT_KINDRED: 20,
};

export const INHERITANCE_RULES: Record<string, RuleReference> = {
  "INH-ESTATE-SEQUENCE": {
    ruleId: "INH-ESTATE-SEQUENCE",
    title: "Estate settlement sequence",
    principle:
      "Funeral expenses, then debts, then valid bequests are applied before the remaining estate is distributed among heirs.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_INHERITANCE_SONS_DAUGHTERS, EVIDENCE.CLASSICAL_SIRAJIYYAH],
    note: "The precise priority in insufficient estates requires scholar confirmation.",
  },
  "INH-WASIYYAH-THIRD": {
    ruleId: "INH-WASIYYAH-THIRD",
    title: "Bequest limitation to one third",
    principle: "A bequest is valid up to one third of the net estate; excess requires heirs' consent after death.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.HADITH_NO_BEQUEST_TO_HEIR, EVIDENCE.CLASSICAL_HIDAYAH],
    note: "Consent timing and bequests to heirs require scholar confirmation.",
  },
  "INH-SPOUSE": {
    ruleId: "INH-SPOUSE",
    title: "Spousal fixed shares",
    principle: "Husband: 1/2 without descendants, 1/4 with them. Wife: 1/4 without descendants, 1/8 with them.",
    verificationStatus: "REFERENCE_REQUIRED",
    evidence: [EVIDENCE.QURAN_SPOUSE_SHARES],
  },
  "INH-PARENTS": {
    ruleId: "INH-PARENTS",
    title: "Parents' fixed shares",
    principle: "Mother: 1/3 or 1/6 depending on descendants and siblings. Father: 1/6 with male descendants, otherwise residuary.",
    verificationStatus: "REFERENCE_REQUIRED",
    evidence: [EVIDENCE.QURAN_PARENTS_SHARES],
  },
  "INH-CHILDREN": {
    ruleId: "INH-CHILDREN",
    title: "Children's shares",
    principle: "Daughters take fixed shares when no son exists; with a son, daughters become residuary with the male agnate.",
    verificationStatus: "REFERENCE_REQUIRED",
    evidence: [EVIDENCE.QURAN_INHERITANCE_SONS_DAUGHTERS],
  },
  "INH-GRANDCHILDREN": {
    ruleId: "INH-GRANDCHILDREN",
    title: "Son's daughters",
    principle: "Son's daughters inherit in the absence of sons, subject to partial or complete exclusion by daughters.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_SIRAJIYYAH],
  },
  "INH-SIBLINGS": {
    ruleId: "INH-SIBLINGS",
    title: "Sibling shares",
    principle: "Full, paternal and maternal siblings have distinct fixed shares and residuary roles under Hanafi rules.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_SIRAJIYYAH],
  },
  "INH-EXCLUSION-COMPLETE": {
    ruleId: "INH-EXCLUSION-COMPLETE",
    title: "Complete exclusion (حجب حرمان)",
    principle: "A nearer heir can wholly exclude a more distant heir from inheritance.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_SIRAJIYYAH],
  },
  "INH-EXCLUSION-PARTIAL": {
    ruleId: "INH-EXCLUSION-PARTIAL",
    title: "Partial exclusion (حجب نقصان)",
    principle: "A nearer heir can reduce, without removing, another heir's prescribed share.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_SIRAJIYYAH],
  },
  "INH-ASABAH": {
    ruleId: "INH-ASABAH",
    title: "Residuary heirs (العصبات)",
    principle: "Residuary heirs receive the remainder after fixed shares; male and female agnates inherit in the prescribed ratio.",
    verificationStatus: "REFERENCE_REQUIRED",
    evidence: [EVIDENCE.QURAN_INHERITANCE_SONS_DAUGHTERS],
  },
  "INH-AWL": {
    ruleId: "INH-AWL",
    title: "Awl (العول)",
    principle: "When fixed shares exceed the estate, the denominator is increased proportionally.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_AWL, EVIDENCE.CLASSICAL_SIRAJIYYAH],
  },
  "INH-RADD": {
    ruleId: "INH-RADD",
    title: "Radd (الرد)",
    principle:
      "When fixed shares are less than the estate and no residuary exists, the surplus returns to the fixed-share heirs in proportion to their shares. Under the Hanafi method the spouse does not take Radd while another fixed-share heir exists.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_SIRAJIYYAH],
    note: "If only a spouse remains, the surplus belongs to the dhawu al-arham or the bayt al-mal and is outside this engine.",
  },
  "INH-TASHIH": {
    ruleId: "INH-TASHIH",
    title: "Tashih al-mas'ala (تصحيح المسألة)",
    principle:
      "Final fractions are expressed over the least common denominator; when a group's parts are not divisible by its number of individuals, the base is multiplied by the smallest required factor so every individual receives whole parts.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_SIRAJIYYAH],
  },
  "INH-MUNASAKHA": {
    ruleId: "INH-MUNASAKHA",
    title: "Munasakha (المناسخة)",
    principle:
      "When an heir dies before the first estate is distributed, that heir's inherited share is added to their own estate and distributed among their own heirs in the second calculation.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_SIRAJIYYAH],
    note: "The engine applies the second distribution after the first and records the amount passed between the two estates.",
  },
};

export function inheritanceRuleById(id: string): RuleReference | undefined {
  return INHERITANCE_RULES[id];
}
