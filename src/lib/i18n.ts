import en from "@/i18n/messages/en.json";
import ar from "@/i18n/messages/ar.json";
import bn from "@/i18n/messages/bn.json";

export type Locale = "en" | "ar" | "bn";

/** A string translated into every supported language, co-located with its UI. */
export interface LocalizedText {
  en: string;
  ar: string;
  bn: string;
}

export function pickLocalized(locale: Locale, text: LocalizedText): string {
  return text[locale] ?? text.en;
}

export const LOCALES: { code: Locale; label: string; native: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
  { code: "bn", label: "Bangla", native: "বাংলা", dir: "ltr" },
];

export type Dictionary = Record<string, string>;

/**
 * The central translation catalogs. Every UI string lives in these three JSON
 * files; nothing is translated at runtime by an external service or package.
 */
export const dictionaries: Record<Locale, Dictionary> = {
  en: en as Dictionary,
  ar: ar as Dictionary,
  bn: bn as Dictionary,
};

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const template = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

/** Return every key that starts with `${namespace}.` (used by `useText`). */
export function keysInNamespace(locale: Locale, namespace: string): string[] {
  const prefix = `${namespace}.`;
  return Object.keys(dictionaries[locale]).filter((key) => key.startsWith(prefix));
}

export function directionOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
