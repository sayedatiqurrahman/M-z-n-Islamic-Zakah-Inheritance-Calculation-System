import type { HeirType } from "@/modules/inheritance/types";
import { translate, type Locale } from "@/lib/i18n";

export interface HeirOption {
  type: HeirType;
  /** Catalog key under `heirs.*`, e.g. `heirs.SON`. */
  labelKey: string;
  supported: boolean;
}

export interface HeirGroup {
  /** Catalog key under `heirs.group.*`. */
  titleKey: string;
  options: HeirOption[];
}

function option(type: HeirType, supported: boolean): HeirOption {
  return { type, labelKey: `heirs.${type}`, supported };
}

export const HEIR_GROUPS: HeirGroup[] = [
  {
    titleKey: "heirs.group.spouse",
    options: [option("HUSBAND", true), option("WIFE", true)],
  },
  {
    titleKey: "heirs.group.parents",
    options: [
      option("FATHER", true),
      option("MOTHER", true),
      option("PATERNAL_GRANDFATHER", true),
      option("PATERNAL_GRANDMOTHER", true),
      option("MATERNAL_GRANDMOTHER", true),
    ],
  },
  {
    titleKey: "heirs.group.children",
    options: [
      option("SON", true),
      option("DAUGHTER", true),
      option("SONS_SON", true),
      option("SONS_DAUGHTER", true),
    ],
  },
  {
    titleKey: "heirs.group.siblings",
    options: [
      option("FULL_BROTHER", true),
      option("FULL_SISTER", true),
      option("PATERNAL_BROTHER", true),
      option("PATERNAL_SISTER", true),
      option("MATERNAL_BROTHER", true),
      option("MATERNAL_SISTER", true),
    ],
  },
  {
    titleKey: "heirs.group.other",
    options: [
      option("FULL_BROTHERS_SON", false),
      option("PATERNAL_BROTHERS_SON", false),
      option("FULL_PATERNAL_UNCLE", false),
      option("PATERNAL_UNCLE", false),
      option("OTHER_AGNATIC", false),
      option("DISTANT_KINDRED", false),
    ],
  },
];

/** English heir labels, used by server-generated PDF reports. */
export const HEIR_LABELS: Record<HeirType, string> = Object.fromEntries(
  HEIR_GROUPS.flatMap((g) => g.options.map((o) => [o.type, translate("en", o.labelKey)])),
) as Record<HeirType, string>;

export function heirLabel(type: HeirType, locale: Locale): string {
  return translate(locale, `heirs.${type}`);
}
