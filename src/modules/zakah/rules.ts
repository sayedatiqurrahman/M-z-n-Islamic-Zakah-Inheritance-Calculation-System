import { EVIDENCE } from "@/modules/fiqh/evidences/catalog";
import type { EvidenceReference, RuleReference, VerificationStatus } from "@/modules/fiqh/types";
import type {
  IrrigationType,
  LiabilityType,
  ZakahAssetCategory,
  ZakahRecipientPurpose,
} from "./types";

/**
 * Versioned Hanafi zakah rule registry.
 * Each policy is explicitly flagged. Nothing here is presented as a verified
 * fatwa: `verificationStatus` must be upgraded by a qualified scholar.
 *
 * Livestock and crop schedules are the commonly cited classical Sunni/Hanafi
 * schedules. They are encoded as data with an explicit NEEDS_REVIEW status and
 * are shown to the user with their exact tier and caveat.
 */

export const ZAKAH_METHODOLOGY_VERSION = "hanafi-zakah-v1.0.0";
export const ZAKAH_RATE = 0.025;

/** Classical 5 wasq, expressed as an approximate kilogram equivalent. NEEDS_REVIEW. */
export const CROP_NISAB_KG = 653;

export interface AssetPolicy {
  ruleId: string;
  included: boolean;
  reason: string;
  note?: string;
  verification: RuleReference["verificationStatus"];
  /** In-kind categories are evaluated by schedule, not added to monetary wealth. */
  mode?: "MONETARY" | "IN_KIND";
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
  LIVESTOCK_CAMEL: {
    ruleId: "ZAK-ASSET-050",
    included: false,
    mode: "IN_KIND",
    reason: "Camels are zakahable by head-count schedule (nisab 5), assessed separately from money.",
    note: "Classical schedule encoded as data — NEEDS_REVIEW.",
    verification: "NEEDS_REVIEW",
  },
  LIVESTOCK_CATTLE: {
    ruleId: "ZAK-ASSET-051",
    included: false,
    mode: "IN_KIND",
    reason: "Cattle are zakahable by head-count schedule (nisab 30), assessed separately from money.",
    note: "Classical schedule encoded as data — NEEDS_REVIEW.",
    verification: "NEEDS_REVIEW",
  },
  LIVESTOCK_GOAT_SHEEP: {
    ruleId: "ZAK-ASSET-052",
    included: false,
    mode: "IN_KIND",
    reason: "Goats and sheep are zakahable by head-count schedule (nisab 40), assessed separately from money.",
    note: "Classical schedule encoded as data — NEEDS_REVIEW.",
    verification: "NEEDS_REVIEW",
  },
  CROP_WHEAT: {
    ruleId: "ZAK-ASSET-060",
    included: false,
    mode: "IN_KIND",
    reason: "Wheat is zakahable at harvest: 10% rain-fed, 5% irrigated, subject to the 5-wasq nisab.",
    verification: "NEEDS_REVIEW",
  },
  CROP_BARLEY: {
    ruleId: "ZAK-ASSET-061",
    included: false,
    mode: "IN_KIND",
    reason: "Barley is zakahable at harvest: 10% rain-fed, 5% irrigated, subject to the 5-wasq nisab.",
    verification: "NEEDS_REVIEW",
  },
  CROP_DATES: {
    ruleId: "ZAK-ASSET-062",
    included: false,
    mode: "IN_KIND",
    reason: "Dates are zakahable at harvest: 10% rain-fed, 5% irrigated, subject to the 5-wasq nisab.",
    verification: "NEEDS_REVIEW",
  },
  CROP_GRAPES: {
    ruleId: "ZAK-ASSET-063",
    included: false,
    mode: "IN_KIND",
    reason: "Grapes are zakahable at harvest: 10% rain-fed, 5% irrigated, subject to the 5-wasq nisab.",
    verification: "NEEDS_REVIEW",
  },
  CROP_OTHER: {
    ruleId: "ZAK-ASSET-064",
    included: false,
    reason: "Other produce requires a verified ruling on nisab and rate before inclusion.",
    verification: "UNVERIFIED",
  },
  MINERALS_TREASURE: {
    ruleId: "ZAK-ASSET-070",
    included: false,
    reason:
      "Minerals and buried treasure follow distinct rules (a fifth/khums in the classical sources) that are not encoded in this engine.",
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

// ---------------------------------------------------------------------------
// In-kind schedules
// ---------------------------------------------------------------------------

export interface LivestockTier {
  min: number;
  /** `null` means the tier continues above `min`. */
  max: number | null;
  dueDescription: string;
  dueQuantity: number;
  /** Open tier: one extra `perDueQuantity` for each `perHeads` head beyond `min`. */
  perHeads?: number;
  perDueQuantity?: number;
}

export interface LivestockSchedule {
  ruleId: string;
  nisab: number;
  unit: "head";
  /** Highest head count encoded; above this the engine refuses instead of guessing. */
  maxSupported: number;
  tiers: LivestockTier[];
  explanation: string;
  verification: VerificationStatus;
  evidence: EvidenceReference[];
}

const LIVESTOCK_EVIDENCE = [EVIDENCE.CLASSICAL_HIDAYAH, EVIDENCE.CLASSICAL_HINDIYYAH];

export const LIVESTOCK_SCHEDULES: Record<
  "LIVESTOCK_CAMEL" | "LIVESTOCK_CATTLE" | "LIVESTOCK_GOAT_SHEEP",
  LivestockSchedule
> = {
  LIVESTOCK_CAMEL: {
    ruleId: "ZAK-LIVESTOCK-CAMEL",
    nisab: 5,
    unit: "head",
    maxSupported: 150,
    explanation:
      "Classical camel schedule: 5–9 → 1 sheep/goat; 10–14 → 2; 15–19 → 3; 20–24 → 4; 25–35 → 1 one-year-old camel; 36–45 → 1 two-year-old; 46–60 → 1 three-year-old; 61–75 → 1 four-year-old; 76–90 → 2 two-year-olds; 91–105 → 2 three-year-olds; 106–120 → 2 four-year-olds; 121–129 → 3 two-year-olds; 130–144 → 3 three-year-olds; 145–150 → 3 four-year-olds.",
    verification: "NEEDS_REVIEW",
    evidence: LIVESTOCK_EVIDENCE,
    tiers: [
      { min: 5, max: 9, dueDescription: "1 sheep or goat", dueQuantity: 1 },
      { min: 10, max: 14, dueDescription: "2 sheep or goats", dueQuantity: 2 },
      { min: 15, max: 19, dueDescription: "3 sheep or goats", dueQuantity: 3 },
      { min: 20, max: 24, dueDescription: "4 sheep or goats", dueQuantity: 4 },
      { min: 25, max: 35, dueDescription: "1 one-year-old camel", dueQuantity: 1 },
      { min: 36, max: 45, dueDescription: "1 two-year-old camel", dueQuantity: 1 },
      { min: 46, max: 60, dueDescription: "1 three-year-old camel", dueQuantity: 1 },
      { min: 61, max: 75, dueDescription: "1 four-year-old camel", dueQuantity: 1 },
      { min: 76, max: 90, dueDescription: "2 two-year-old camels", dueQuantity: 2 },
      { min: 91, max: 105, dueDescription: "2 three-year-old camels", dueQuantity: 2 },
      { min: 106, max: 120, dueDescription: "2 four-year-old camels", dueQuantity: 2 },
      { min: 121, max: 129, dueDescription: "3 two-year-old camels", dueQuantity: 3 },
      { min: 130, max: 144, dueDescription: "3 three-year-old camels", dueQuantity: 3 },
      { min: 145, max: 150, dueDescription: "3 four-year-old camels", dueQuantity: 3 },
    ],
  },
  LIVESTOCK_CATTLE: {
    ruleId: "ZAK-LIVESTOCK-CATTLE",
    nisab: 30,
    unit: "head",
    maxSupported: 129,
    explanation:
      "Classical cattle schedule: 30–39 → 1 one-year-old calf; 40–59 → 1 two-year-old; 60–69 → 2 one-year-olds; 70–79 → 1 two-year-old + 1 one-year-old; 80–89 → 2 two-year-olds; 90–99 → 3 one-year-olds; 100–109 → 1 two-year-old + 2 one-year-olds; 110–119 → 2 two-year-olds + 1 one-year-old; 120–129 → 3 two-year-olds.",
    verification: "NEEDS_REVIEW",
    evidence: LIVESTOCK_EVIDENCE,
    tiers: [
      { min: 30, max: 39, dueDescription: "1 one-year-old calf", dueQuantity: 1 },
      { min: 40, max: 59, dueDescription: "1 two-year-old heifer", dueQuantity: 1 },
      { min: 60, max: 69, dueDescription: "2 one-year-old calves", dueQuantity: 2 },
      { min: 70, max: 79, dueDescription: "1 two-year-old + 1 one-year-old", dueQuantity: 2 },
      { min: 80, max: 89, dueDescription: "2 two-year-old cattle", dueQuantity: 2 },
      { min: 90, max: 99, dueDescription: "3 one-year-old calves", dueQuantity: 3 },
      { min: 100, max: 109, dueDescription: "1 two-year-old + 2 one-year-olds", dueQuantity: 3 },
      { min: 110, max: 119, dueDescription: "2 two-year-olds + 1 one-year-old", dueQuantity: 3 },
      { min: 120, max: 129, dueDescription: "3 two-year-old cattle", dueQuantity: 3 },
    ],
  },
  LIVESTOCK_GOAT_SHEEP: {
    ruleId: "ZAK-LIVESTOCK-GOAT-SHEEP",
    nisab: 40,
    unit: "head",
    maxSupported: Number.MAX_SAFE_INTEGER,
    explanation:
      "Classical goat/sheep schedule: 40–120 → 1; 121–200 → 2; 201–300 → 3; above 300 → 1 additional animal for every 100 head.",
    verification: "NEEDS_REVIEW",
    evidence: LIVESTOCK_EVIDENCE,
    tiers: [
      { min: 40, max: 120, dueDescription: "1 goat or sheep", dueQuantity: 1 },
      { min: 121, max: 200, dueDescription: "2 goats or sheep", dueQuantity: 2 },
      { min: 201, max: 300, dueDescription: "3 goats or sheep", dueQuantity: 3 },
      {
        min: 301,
        max: null,
        dueDescription: "1 goat or sheep for every 100 head above 300",
        dueQuantity: 4,
        perHeads: 100,
        perDueQuantity: 1,
      },
    ],
  },
};

export interface CropSchedule {
  ruleId: string;
  nisabKg: number;
  unit: "kg";
  /** Only these irrigation methods have an encoded rate. */
  rates: Partial<Record<IrrigationType, number>>;
  explanation: string;
  verification: VerificationStatus;
  evidence: EvidenceReference[];
}

const CROP_EVIDENCE = [EVIDENCE.CLASSICAL_HIDAYAH, EVIDENCE.CLASSICAL_BADAI];
const CROP_RATES: Partial<Record<IrrigationType, number>> = { RAIN_FED: 0.1, IRRIGATED: 0.05 };

function cropSchedule(ruleId: string, name: string): CropSchedule {
  return {
    ruleId,
    nisabKg: CROP_NISAB_KG,
    unit: "kg",
    rates: CROP_RATES,
    explanation: `Classical ${name} zakah: 10% of the harvest watered by rain, 5% of the harvest watered by irrigation, once the produce reaches the 5-wasq nisab (approximately ${CROP_NISAB_KG} kg in this model). Mixed irrigation has no encoded rate and is refused.`,
    verification: "NEEDS_REVIEW",
    evidence: CROP_EVIDENCE,
  };
}

export const CROP_SCHEDULES: Record<
  "CROP_WHEAT" | "CROP_BARLEY" | "CROP_DATES" | "CROP_GRAPES",
  CropSchedule
> = {
  CROP_WHEAT: cropSchedule("ZAK-CROP-WHEAT", "wheat"),
  CROP_BARLEY: cropSchedule("ZAK-CROP-BARLEY", "barley"),
  CROP_DATES: cropSchedule("ZAK-CROP-DATES", "dates"),
  CROP_GRAPES: cropSchedule("ZAK-CROP-GRAPES", "grapes"),
};

// ---------------------------------------------------------------------------
// Recipient purposes — Qur'an 9:60
// ---------------------------------------------------------------------------

export const ZAKAH_RECIPIENT_PURPOSES: ZakahRecipientPurpose[] = [
  {
    id: "FUQARA",
    arabic: "الفقراء",
    label: "The poor",
    explanation: "People who have no sufficient wealth or income to meet their basic needs.",
    verification: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
  },
  {
    id: "MASAKIN",
    arabic: "المساكين",
    label: "The needy",
    explanation: "People whose income falls short of their needs even though they may own something.",
    verification: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
  },
  {
    id: "AMILUN",
    arabic: "العاملون عليها",
    label: "Those employed to collect it",
    explanation: "People appointed to collect, record or administer zakah.",
    verification: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
  },
  {
    id: "MU'ALLAFAH",
    arabic: "المؤلفة قلوبهم",
    label: "Those whose hearts are to be reconciled",
    explanation: "People whose hearts are being won over, as defined in the classical sources.",
    verification: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
  },
  {
    id: "RIQAB",
    arabic: "في الرقاب",
    label: "For freeing those in bondage",
    explanation: "Freeing captives or enslaved persons, as classified in the classical sources.",
    verification: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
  },
  {
    id: "GHARIMUN",
    arabic: "الغارمون",
    label: "Those in debt",
    explanation: "People burdened by debt, whether incurred for a permissible need or to settle a dispute.",
    verification: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
  },
  {
    id: "SABILILLAH",
    arabic: "في سبيل الله",
    label: "In the cause of Allah",
    explanation: "Work carried out for the cause of Allah; its precise scope differs between jurists.",
    verification: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
  },
  {
    id: "IBN_SABIL",
    arabic: "ابن السبيل",
    label: "The stranded traveller",
    explanation: "A traveller cut off from their resources who needs help to reach their destination.",
    verification: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
  },
];

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
  "ZAK-LIVESTOCK-SCHEDULE": {
    ruleId: "ZAK-LIVESTOCK-SCHEDULE",
    title: "Livestock zakah schedules",
    principle:
      "Livestock zakah is assessed by head-count tiers (camels 5, cattle 30, goats/sheep 40), not by applying 2.5% to a market value.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: LIVESTOCK_EVIDENCE,
    note: "The exact tiers and animal ages shown in each step must be checked against a cited edition before publication.",
  },
  "ZAK-CROP-SCHEDULE": {
    ruleId: "ZAK-CROP-SCHEDULE",
    title: "Crop zakah schedules",
    principle:
      "Crops are assessed at harvest at 10% when rain-fed and 5% when irrigated, once the classical nisab is reached.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: CROP_EVIDENCE,
    note: "The kilogram equivalent of 5 wasq is an approximation and requires verification.",
  },
  "ZAK-IN-KIND-TOTAL": {
    ruleId: "ZAK-IN-KIND-TOTAL",
    title: "Monetary and in-kind totals",
    principle:
      "Monetary zakah and in-kind dues are reported separately; their sum is shown as an estimated total only when a unit value is supplied.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.CLASSICAL_HIDAYAH],
    note: "Livestock and crops have their own nisab and timing; adding them to monetary zakah is a presentation choice, not a merged ruling.",
  },
  "ZAK-RECIPIENTS": {
    ruleId: "ZAK-RECIPIENTS",
    title: "The eight recipient purposes (مصارف الزكاة)",
    principle: "Zakah is disbursed to the eight categories named in Qur'an 9:60.",
    verificationStatus: "NEEDS_REVIEW",
    evidence: [EVIDENCE.QURAN_ZAKAH_RECIPIENTS],
    note: "The list is informational; eligibility of a specific recipient requires a scholar's ruling.",
  },
};

export function zakahRuleById(id: string): RuleReference | undefined {
  return ZAKAH_RULES[id];
}
