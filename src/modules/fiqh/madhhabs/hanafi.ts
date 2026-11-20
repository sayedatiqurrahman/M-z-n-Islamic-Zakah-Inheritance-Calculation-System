import { EVIDENCE } from "../evidences/catalog";
import type { EvidenceReference } from "../types";
import { INHERITANCE_METHODOLOGY_VERSION, INHERITANCE_RULES } from "@/modules/inheritance/rules";
import { ZAKAH_METHODOLOGY_VERSION, ZAKAH_RULES } from "@/modules/zakah/rules";
import type { MadhhabProvider } from "./provider";

export const hanafiProvider: MadhhabProvider = {
  key: "HANAFI",
  enabled: true,
  nameEn: "Hanafi",
  nameAr: "الحنفي",
  nameBn: "হানাফি",
  zakahMethodologyVersion: ZAKAH_METHODOLOGY_VERSION,
  inheritanceMethodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
  getReferenceMap(): Record<string, EvidenceReference[]> {
    return {
      ...Object.fromEntries(
        Object.entries(ZAKAH_RULES).map(([id, rule]) => [id, rule.evidence]),
      ),
      ...Object.fromEntries(
        Object.entries(INHERITANCE_RULES).map(([id, rule]) => [id, rule.evidence]),
      ),
      "PORTAL_QURANPEDIA": [EVIDENCE.PORTAL_QURANPEDIA],
    };
  },
};
