"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This component synchronises state with an external system (localStorage hydration or a network fetch) on mount. The effect is one-shot initialisation, which is the documented React pattern for external stores. */

import { useEffect, useId, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { currencyLabel, currencySymbol } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/layout/locale-provider";
import type { CurrencyListResponse, CurrencyOption } from "@/modules/currencies/types";

interface CurrencyComboboxProps {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

const UNAVAILABLE = "The currency list is unavailable.";

/**
 * Module-level cache so every currency field on the page shares one network
 * request, and so switching between pages does not re-download the list.
 */
let listCache: CurrencyOption[] | null = null;
let listPromise: Promise<CurrencyOption[]> | null = null;

async function loadCurrencies(): Promise<CurrencyOption[]> {
  if (listCache) return listCache;
  if (!listPromise) {
    listPromise = fetch("/api/currencies", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? UNAVAILABLE);
        const data = payload as CurrencyListResponse;
        if (!Array.isArray(data.currencies) || data.currencies.length === 0) {
          throw new Error("The currency list is empty.");
        }
        listCache = data.currencies;
        return data.currencies;
      })
      .finally(() => {
        listPromise = null;
      });
  }
  return listPromise;
}

export function CurrencyCombobox({
  value,
  onChange,
  id,
  disabled,
  className,
  align = "start",
}: CurrencyComboboxProps) {
  const { t } = useLocale();
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Start empty so server and client render the trigger, then hydrate from
  // the module cache in the effect below.
  const [items, setItems] = useState<CurrencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (listCache) {
      setItems(listCache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadCurrencies()
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : UNAVAILABLE);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.symbol.toLowerCase().includes(term),
    );
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const selected = items.find((item) => item.code === value);
  const selectedLabel = selected?.name ?? currencyLabel(value);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filtered[activeIndex];
      if (item) choose(item.code);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors",
            "hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
              {currencySymbol(value)}
            </span>
            <span className="truncate font-medium">{value}</span>
            <span className="hidden truncate text-muted-foreground sm:inline">— {selectedLabel}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent align={align} className="w-[min(94vw,24rem)] gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("currency.placeholder")}
            aria-label={t("currency.searchLabel")}
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div
          id={listboxId}
          role="listbox"
          aria-label={t("currency.aria")}
          className="max-h-[min(60vh,20rem)] overflow-y-auto overscroll-contain p-1"
        >
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {t("currency.loading")}
            </div>
          )}

          {!loading && error && (
            <p className="px-3 py-6 text-center text-sm text-amber-700 dark:text-amber-400">
              {t("currency.unavailable")}
            </p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("currency.empty", { query })}
            </p>
          )}

          {!loading &&
            !error &&
            filtered.map((item, index) => {
              const active = item.code === value;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(item.code)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-start text-sm transition-colors",
                    index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {item.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {item.code}
                      <span className="ms-2 font-normal text-muted-foreground">{item.name}</span>
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                </button>
              );
            })}
        </div>

        {!loading && !error && (
          <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            {t("currency.count", { count: items.length })}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
