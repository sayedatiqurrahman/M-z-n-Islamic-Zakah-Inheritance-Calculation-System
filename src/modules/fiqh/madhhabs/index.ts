import { hanafiProvider } from "./hanafi";
import type { MadhhabKey, MadhhabProvider } from "./provider";

const providers: Record<MadhhabKey, MadhhabProvider> = {
  HANAFI: hanafiProvider,
  SHAFI: {
    key: "SHAFI", enabled: false, nameEn: "Shafi'i", nameAr: "الشافعي", nameBn: "শাফিঈ",
    zakahMethodologyVersion: "-", inheritanceMethodologyVersion: "-", getReferenceMap: () => ({}),
  },
  MALIKI: {
    key: "MALIKI", enabled: false, nameEn: "Maliki", nameAr: "المالكي", nameBn: "মালিকি",
    zakahMethodologyVersion: "-", inheritanceMethodologyVersion: "-", getReferenceMap: () => ({}),
  },
  HANBALI: {
    key: "HANBALI", enabled: false, nameEn: "Hanbali", nameAr: "الحنبلي", nameBn: "হানবালি",
    zakahMethodologyVersion: "-", inheritanceMethodologyVersion: "-", getReferenceMap: () => ({}),
  },
};

export function getProvider(key: MadhhabKey): MadhhabProvider | null {
  const provider = providers[key];
  return provider?.enabled ? provider : null;
}

export function listProviders(): MadhhabProvider[] {
  return Object.values(providers);
}

export const ENABLED_MADHHAB = hanafiProvider;
export type { MadhhabKey, MadhhabProvider };
