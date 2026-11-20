"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This component synchronises state with an external system (localStorage hydration or a network fetch) on mount. The effect is one-shot initialisation, which is the documented React pattern for external stores. */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount, formatDateTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/layout/locale-provider";
import type { AppliedMetalPrices, MetalQuote, MetalQuotesResponse } from "@/modules/prices/types";

interface LiveMetalPricesProps {
  currency: string;
  onApply?: (prices: AppliedMetalPrices) => void;
  /** Apply each successfully fetched quote pair to the caller automatically. */
  autoApply?: boolean;
  className?: string;
}

function MetalCard({ quote }: { quote: MetalQuote }) {
  const { t } = useLocale();
  const isGold = quote.metal === "GOLD";
  const up = quote.change ? quote.change.absolute > 0 : false;
  const flat = quote.change ? Math.abs(quote.change.percent) < 0.0001 : false;

  const metalLabel = isGold ? t("prices.gold") : t("prices.silver");

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {metalLabel}
          </p>
          <p className="font-heading text-xl font-bold text-emerald-950">
            {formatAmount(quote.pricePerGram, quote.currency)}
            <span className="ms-1 text-xs font-normal text-muted-foreground">{t("prices.perGramLabel")}</span>
          </p>
        </div>
        <Badge variant="secondary" className="bg-emerald-50 text-[10px] text-emerald-800">
          {t("prices.updated")}
        </Badge>
      </div>

      {quote.change && !flat ? (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
            up ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800",
          )}
        >
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {up ? "+" : ""}
          {formatAmount(quote.change.absolute, quote.currency)} ({up ? "+" : ""}
          {quote.change.percent.toFixed(2)}%)
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {quote.previous ? t("prices.noChange") : t("prices.firstCapture")}
        </p>
      )}

      <div className="mt-3 space-y-1 border-t border-dashed pt-2 text-[11px] text-muted-foreground">
        <p>
          <span className="font-medium text-slate-600">{t("prices.original")}</span>{" "}
          {quote.previous
            ? `${formatAmount(quote.previous.pricePerGram, quote.currency)} · ${formatDateTime(quote.previous.recordedAt)}`
            : t("prices.noPrevious")}
        </p>
        <p>
          <span className="font-medium text-slate-600">{t("prices.providerTime")}</span>{" "}
          {formatDateTime(quote.providerUpdatedAt)}
        </p>
        <p>
          <span className="font-medium text-slate-600">{t("prices.spot")}</span>{" "}
          ${quote.pricePerOunceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })} · 1 USD ={" "}
          {quote.usdToCurrency.toLocaleString("en-US", { maximumFractionDigits: 4 })} {quote.currency}
        </p>
        <a
          href={quote.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
        >
          {quote.source} <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

export function LiveMetalPrices({ currency, onApply, autoApply = false, className }: LiveMetalPricesProps) {
  const { t } = useLocale();
  const [data, setData] = useState<MetalQuotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onApplyRef = useRef(onApply);
  const lastAutoAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    onApplyRef.current = onApply;
  }, [onApply]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // A new currency means a new quote pair; allow auto-apply again.
    lastAutoAppliedRef.current = null;
    try {
      const response = await fetch(`/api/prices?currency=${encodeURIComponent(currency)}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? t("prices.unavailable"));
      }
      setData(payload as MetalQuotesResponse);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : t("prices.unavailable"));
    } finally {
      setLoading(false);
    }
  }, [currency, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const gold = data?.quotes.find((quote) => quote.metal === "GOLD");
  const silver = data?.quotes.find((quote) => quote.metal === "SILVER");
  const canApply = Boolean(onApply && gold && silver);

  useEffect(() => {
    if (!autoApply || !gold || !silver) return;
    const signature = `${gold.fetchedAt}|${silver.fetchedAt}|${gold.pricePerGram}|${silver.pricePerGram}|${currency}`;
    if (lastAutoAppliedRef.current === signature) return;
    lastAutoAppliedRef.current = signature;
    onApplyRef.current?.({
      gold: gold.pricePerGram,
      silver: silver.pricePerGram,
      source: `${gold.source} — ${t("prices.retrievedAt", { date: formatDateTime(gold.fetchedAt) })}`,
      sourceUrl: gold.sourceUrl,
      recordedAt: gold.fetchedAt,
    });
  }, [autoApply, currency, gold, silver, t]);

  return (
    <Card className={cn("border-emerald-100", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-emerald-700" /> {t("prices.title")}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("prices.subtitle", { currency })}
          </p>
          {autoApply && data && (
            <p className="mt-1 text-[11px] font-medium text-emerald-700">
              {t("prices.autoApplied")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 text-emerald-800">
            {currency}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            {t("prices.refresh")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading && !data && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <div key={index} className="h-40 animate-pulse rounded-xl bg-emerald-50/60" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">{t("prices.errorHint")}</p>
              <p>{error}</p>
              <p>{t("prices.errorBody")}</p>
            </div>
          </div>
        )}

        {data && (
          <div className="grid gap-3 sm:grid-cols-2">
            {gold && <MetalCard quote={gold} />}
            {silver && <MetalCard quote={silver} />}
          </div>
        )}

        {data?.errors.map((item) => (
          <p key={item.metal} className="text-xs text-amber-800">
            {item.metal === "GOLD" ? t("prices.gold") : t("prices.silver")}: {item.message}
          </p>
        ))}

        {data && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="max-w-xl text-[11px] leading-relaxed text-muted-foreground">
              {data.disclaimer}
            </p>
            {onApply && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                disabled={!canApply}
                onClick={() => {
                  if (!gold || !silver || !onApply) return;
                  onApply({
                    gold: gold.pricePerGram,
                    silver: silver.pricePerGram,
                    source: `${gold.source} — ${t("prices.retrievedAt", { date: formatDateTime(gold.fetchedAt) })}`,
                    sourceUrl: gold.sourceUrl,
                    recordedAt: gold.fetchedAt,
                  });
                }}
              >
                {t("prices.apply")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
