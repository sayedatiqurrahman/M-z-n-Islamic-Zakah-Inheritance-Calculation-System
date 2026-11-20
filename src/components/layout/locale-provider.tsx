"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This component synchronises state with an external system (localStorage hydration or a network fetch) on mount. The effect is one-shot initialisation, which is the documented React pattern for external stores. */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  dictionaries,
  directionOf,
  pickLocalized,
  translate,
  type Locale,
  type LocalizedText,
} from "@/lib/i18n";

/** A nested view over the flat JSON catalog for one namespace. */
export interface TextNamespace {
  [key: string]: string & TextNamespace;
}

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  /** Translate a dictionary key, with optional `{name}` interpolation. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Pick the current language from a co-located `{ en, ar, bn }` object, or pass a plain string through. */
  l: (text: LocalizedText | string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function buildNamespace(locale: Locale, namespace: string): TextNamespace {
  const prefix = namespace ? `${namespace}.` : "";
  const tree: Record<string, unknown> = {};

  const insert = (source: Record<string, string>) => {
    for (const [fullKey, value] of Object.entries(source)) {
      if (!fullKey.startsWith(prefix)) continue;
      const parts = fullKey.slice(prefix.length).split(".");
      let node = tree;
      for (let i = 0; i < parts.length - 1; i += 1) {
        const next = node[parts[i]];
        if (typeof next !== "object" || next === null) node[parts[i]] = {};
        node = node[parts[i]] as Record<string, unknown>;
      }
      node[parts[parts.length - 1]] = value;
    }
  };

  // English is the fallback source of truth, then the active locale overrides it.
  insert(dictionaries.en);
  if (locale !== "en") insert(dictionaries[locale]);

  return tree as TextNamespace;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("mizan-locale") as Locale | null;
    if (stored && ["en", "ar", "bn"].includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("mizan-locale", next);
    document.documentElement.lang = next;
    document.documentElement.dir = directionOf(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: directionOf(locale),
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
      l: (text) => (typeof text === "string" ? text : pickLocalized(locale, text)),
    }),
    [locale, setLocale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = directionOf(locale);
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}

/**
 * Return every message under `namespace` as a nested object, e.g.
 * `useText("zakah")` gives `TEXT.assetsTitle` and `TEXT.asset.CASH_HOME`.
 */
export function useText(namespace: string): TextNamespace {
  const { locale } = useLocale();
  return useMemo(() => buildNamespace(locale, namespace), [locale, namespace]);
}
