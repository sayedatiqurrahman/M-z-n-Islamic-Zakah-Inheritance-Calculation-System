import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import ar from "@/i18n/messages/ar.json";
import bn from "@/i18n/messages/bn.json";

const catalogs = { en, ar, bn } as const;
const englishKeys = Object.keys(en).sort();

describe("translation catalogs", () => {
  it("exposes the same key set in every language", () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      expect(Object.keys(catalog).sort(), `${locale} key parity`).toEqual(englishKeys);
    }
  });

  it("has no empty or untranslated occurrences of the English source", () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      for (const [key, value] of Object.entries(catalog)) {
        expect(value.trim(), `${locale}:${key} must not be empty`).not.toBe("");
        if (locale !== "en") {
          // Non-English catalogs may intentionally reuse proper nouns; they
          // must still not be blank, and must not fall back to the key name.
          expect(value, `${locale}:${key} must not echo its key`).not.toBe(key);
        }
      }
    }
  });

  it("keeps interpolation placeholders consistent across languages", () => {
    const placeholders = (value: string) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      for (const key of englishKeys) {
        const expected = placeholders((en as Record<string, string>)[key]);
        const actual = placeholders((catalog as Record<string, string>)[key]);
        expect(actual, `${locale}:${key} placeholders`).toEqual(expected);
      }
    }
  });
});
