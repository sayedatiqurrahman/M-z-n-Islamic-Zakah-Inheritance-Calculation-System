"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This component synchronises state with an external system (localStorage hydration or a network fetch) on mount. The effect is one-shot initialisation, which is the documented React pattern for external stores. */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDateTime, isCurrencyCode } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/layout/locale-provider";
import type { MetalQuotesResponse } from "@/modules/prices/types";

/**
 * Compact price strip in the application header. It runs on entry (default
 * BDT), so the user sees a backend-retrieved price without opening a
 * calculator, and it re-fetches whenever the currency changes.
 */
export function LivePriceTicker({ className }: { className?: string }) {
  const { t } = useLocale();
  const [currency, setCurrency] = useState("BDT");
  const [data, setData] = useState<MetalQuotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("mizan-currency");
    if (stored && isCurrencyCode(stored)) setCurrency(stored);

    const onCurrencyChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail && isCurrencyCode(detail)) setCurrency(detail);
    };
    window.addEventListener("mizan:currency-changed", onCurrencyChange);
    return () => window.removeEventListener("mizan:currency-changed", onCurrencyChange);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/prices?currency=${encodeURIComponent(currency)}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("unavailable");
      const payload = (await response.json()) as MetalQuotesResponse;
      setData(payload);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const gold = data?.quotes.find((quote) => quote.metal === "GOLD");
  const silver = data?.quotes.find((quote) => quote.metal === "SILVER");

  return (
    <div
      className={cn(
        "hidden items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-2.5 py-1.5 text-xs lg:flex",
        className,
      )}
      aria-live="polite"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{t("prices.live")}</span>

      {loading && !data && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> {t("prices.loading")} {currency}…
        </span>
      )}

      {failed && !data && (
        <Link href="/zakah/nisab" className="flex items-center gap-1 text-amber-800 hover:underline">
          <CircleAlert className="size-3" /> {t("prices.unavailableShort")}
        </Link>
      )}

      {gold && (
        <Link
          href="/zakah/nisab"
          title={`${gold.source} · ${formatDateTime(gold.providerUpdatedAt)}`}
          className="flex items-center gap-1 text-emerald-900 hover:underline"
        >
          <span className="text-muted-foreground">{t("prices.gold")}</span>
          <span className="font-semibold">{formatAmount(gold.pricePerGram, gold.currency)}</span>
          <span className="text-muted-foreground">{t("prices.perGramShort")}</span>
        </Link>
      )}

      {silver && (
        <>
          <span className="text-emerald-200">|</span>
          <Link
            href="/zakah/nisab"
            title={`${silver.source} · ${formatDateTime(silver.providerUpdatedAt)}`}
            className="flex items-center gap-1 text-emerald-900 hover:underline"
          >
            <span className="text-muted-foreground">{t("prices.silver")}</span>
            <span className="font-semibold">{formatAmount(silver.pricePerGram, silver.currency)}</span>
            <span className="text-muted-foreground">{t("prices.perGramShort")}</span>
          </Link>
        </>
      )}

      {data && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 text-emerald-700"
          onClick={() => void load()}
          disabled={loading}
          aria-label={t("prices.refreshLive")}
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
        </Button>
      )}
    </div>
  );
}
