import { EVIDENCE } from "@/modules/fiqh/evidences/catalog";
import type { RuleReference } from "@/modules/fiqh/types";
import type { LiabilityType, ZakahAssetCategory } from "./types";

/**
 * Versioned Hanafi zakah rule registry.
 * Each policy is explicitly flagged. Nothing here is presented as a verified
 * fatwa: `verificationStatus` must be upgraded by a qualified scholar.
 */

export const ZAKAH_METHODOLOGY_VERSION = "hanafi-zakah-v1.0.0";
export const ZAKAH_RATE = 0.025;

export interface AssetPolicy {
  ruleId: string;
  included: boolean;
  reason: string;
  note?: string;
  verification: RuleReference["verificationStatus"];
}

export const ASSET_POLICIES: Record<ZakahAssetCategory, AssetPolicy> = {
  CASH_HOME: {
    ruleId: "ZAK-ASSET-001",
    included: true,
    reason: "Cash in one's possession is zakahable in full when other conditions are met.",
    verification: "REFERENCE_REQUIRED",
  },
  CASH_BANK: {
    ruleId: "ZAK-ASSET-002",
    included: true,
    reason: "Bank deposits are treated as money and included at their full value.",
    note: "Contemporary application — scholar review recommended.",
    verification: "REFERENCE_REQUIRED",
  },
  SAVINGS: {
    ruleId: "ZAK-ASSET-003",
    included: true,
    reason: "Savings balances are included as liquid wealth.",
    verification: "REFERENCE_REQUIRED",
  },
  CURRENT_ACCOUNT: {
    ruleId: "ZAK-ASSET-004",
    included: true,
    reason: "Current account balances are included as liquid wealth.",
    verification: "REFERENCE_REQUIRED",
  },
  FOREIGN_CURRENCY: {
    ruleId: "ZAK-ASSET-005",
    included: true,
    reason: "Foreign currency holdings are included after conversion at the valuation rate.",
    note: "The conversion rate source must be recorded.",
    verification: "REFERENCE_REQUIRED",
  },
  DIGITAL_MONEY: {
    ruleId: "ZAK-ASSET-006",
    included: true,
    reason: "Eligible digital monetary balances are treated as money.",
    note: "Contemporary application — scholar review recommended.",
    verification: "NEEDS_REVIEW",
  },
  GOLD_JEWELRY: {
    ruleId: "ZAK-ASSET-010",
    included: true,
    reason: "Gold is zakahable; the Hanafi treatment of jewelry is applied here.",
    note: "The Hanafi ruling on personal jewelry must be confirmed with a cited source.",
    verification: "NEEDS_REVIEW",
  },
  GOLD_INVESTMENT: {
    ruleId: "ZAK-ASSET-011",
    included: true,
    reason: "Investment gold is zakahable at its market value.",
    verification: "REFERENCE_REQUIRED",
  },
  GOLD_BARS: {
    ruleId: "ZAK-ASSET-012",
    included: true,
    reason: "Gold bullion is zakahable at market value.",
    verification: "REFERENCE_REQUIRED",
  },
  GOLD_COINS: {
    ruleId: "ZAK-ASSET-013",
    included: true,
    reason: "Gold coins are zakahable at market value.",
    verification: "REFERENCE_REQUIRED",
  },
  SILVER_JEWELRY: {
    ruleId: "ZAK-ASSET-020",
    included: true,
    reason: "Silver is zakahable; the Hanafi treatment of jewelry is applied here.",
    verification: "NEEDS_REVIEW",
  },
  SILVER_INVESTMENT: {
    ruleId: "ZAK-ASSET-021",
    included: true,
    reason: "Investment silver is zakahable at market value.",
    verification: "REFERENCE_REQUIRED",
  },
  SILVER_BARS: {
    ruleId: "ZAK-ASSET-022",
    included: true,
    reason: "Silver bullion is zakahable at market value.",
    verification: "REFERENCE_REQUIRED",
  },
  BUSINESS_MERCHANDISE: {
    ruleId: "ZAK-ASSET-030",
    included: true,
    reason: "Goods held for resale are zakahable at their estimated market value.",
    verification: "REFERENCE_REQUIRED",
  },
  BUSINESS_INVENTORY: {
    ruleId: "ZAK-ASSET-031",
    included: true,
    reason: "Trade inventory is zakahable at market value.",
    verification: "REFERENCE_REQUIRED",
  },
  BUSINESS_RECEIVABLE: {
    ruleId: "ZAK-ASSET-032",
    included: true,
    reason: "Receivables are included when considered collectible under the applied Hanafi policy.",
    note: "Doubtful or long-outstanding receivables require a documented policy.",
    verification: "NEEDS_REVIEW",
  },
  BUSINESS_CASH: {
    ruleId: "ZAK-ASSET-033",
    included: true,
    reason: "Business cash balances are included as liquid wealth.",
    verification: "REFERENCE_REQUIRED",
  },
  SHARES_STOCKS: {
    ruleId: "ZAK-ASSET-040",
    included: false,
    reason:
      "Shares and stocks are not treated identically to cash. This category requires a verified ruling before inclusion.",
    note: "User must acknowledge the policy; unsupported by default.",
    verification: "UNVERIFIED",
  },
  OTHER_INVESTMENT: {
    ruleId: "ZAK-ASSET-041",
    included: false,
    reason: "This modern investment type has no verified rule in the current engine.",
    verification: "UNVERIFIED",
  },
  OTHER_ASSET: {
    ruleId: "ZAK-ASSET-042",
    included: false,
    reason: "Unclassified assets require scholarly verification before inclusion.",
    verification: "UNVERIFIED",
  },
};

export interface LiabilityPolicy {
  ruleId: string;
  deductible: boolean;
  reason: string;
  verification: RuleReference["verificationStatus"];
}

export const LIABILITY_POLICIES: Record<LiabilityType, LiabilityPolicy> = {
  IMMEDIATE_DEBT: {
    ruleId: "ZAK-DEBT-001",
    deductible: true,
    reason: "Debts payable immediately are deductible under the applied Hanafi methodology.",
    verification: "REFERENCE_REQUIRED",
  },
  BUSINESS_LIABILITY: {
    ruleId: "ZAK-DEBT-002",
    deductible: true,
    reason: "Business liabilities due within the assessment period are deductible.",
    verification: "REFERENCE_REQUIRED",
  },
  OTHER_DEDUCTIBLE: {
    ruleId: "ZAK-DEBT-003",
    deductible: true,
    reason: "Other obligations recognised by the selected methodology are deductible.",
    verification: "NEEDS_REVIEW",
  },
  LONG_TERM_LOAN: {
    ruleId: "ZAK-DEBT-004",
    deductible: false,
    reason: "Long-term loans are not automatically deducted in full; only the methodology-approved portion is deductible.",
    verification: "NEEDS_REVIEW",
  },
  NON_DEDUCTIBLE: {
    ruleId: "ZAK-DEBT-005",
    deductible: false,
    reason: "This obligation is not deductible under the selected methodology.",
    verification: "REFERENCE_REQUIRED",
  },
};

export const ZAKAH_RULES: Record<string, RuleReference> = {
  "ZAK-CONDITION-OWNER": {
    ruleId: "ZAK-CONDITION-OWNER",
    title: "Ownership (ملك)",
    principle: "Zakah is obligatory only on wealth that is fully owned by the taxpayer.",
    verificationStatus: "REFERENCE_REQUIRED",
    evidence: [EVIDENCE.QURAN_ZAKAH_COMMAND],
  },
  "ZAK-CONDITION-NISAB": {
    ruleId: "ZAK-CONDITION-NISAB",
    title: "Nisab (النصاب)",
    principle: "Zakah is not obligatory until wealth reaches the applicable Nisab threshold.",
    verificationStatus: "REFERENCE_REQUIRED",
    evidence: [EVIDENCE.QURAN_ZAKAH_COMMAND, EVIDENCE.CLASSICAL_HIDAYAH],
  },
  "ZAK-CONDITION-HAWL": {
    ruleId: "ZAK-CONDITION-HAWL",
    title: "Hawl (الحول)",
    principle: "A lunar year must elapse after reaching Nisab for most zakahable assets.",
    verificationStatus: "REFERENCE_REQUIRED",
    evidence: [EVIDENCE.CLASSICAL_HIDAYAH],
  },
  "ZAK-CONDITION-GROWTH": {
    ruleId: "ZAK-CONDITION-GROWTH",
    title: "Growth or growth potential (النمو)",
    principle: "Hanafi law requires actual or potential growth in the zakahable wealth.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_BADAI],
  },
  "ZAK-RATE": {
    ruleId: "ZAK-RATE",
    title: "Zakah rate — 2.5%",
    principle: "The standard rate applied to net zakahable wealth is one fortieth (2.5%).",
    verificationStatus: "REFERENCE_REQUIRED",
    evidence: [EVIDENCE.HADITH_ZAKAH_RATE],
  },
  "ZAK-NISAB-METHOD": {
    ruleId: "ZAK-NISAB-METHOD",
    title: "Nisab valuation methodology",
    principle:
      "Classical weights (20 mithqal gold / 200 dirhams silver) are distinct from contemporary monetary valuation; the method is configurable.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_HIDAYAH, EVIDENCE.INSTITUTIONAL_AAOIFI],
  },
};

export function zakahRuleById(id: string): RuleReference | undefined {
  return ZAKAH_RULES[id];
}
