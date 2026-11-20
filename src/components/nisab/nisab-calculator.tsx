"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LiveMetalPrices } from "@/components/prices/live-metal-prices";
import { CurrencyCombobox } from "@/components/currency/currency-combobox";
import { formatAmount, formatDateTime } from "@/lib/formatting";
import { useLocale } from "@/components/layout/locale-provider";
import type { AppliedMetalPrices } from "@/modules/prices/types";

type Method = "GOLD" | "SILVER";

export function NisabCalculator() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [currency, setCurrency] = useState("BDT");
  const [method, setMethod] = useState<Method>("SILVER");
  const [goldGrams, setGoldGrams] = useState(85);
  const [silverGrams, setSilverGrams] = useState(595);
  const [goldPrice, setGoldPrice] = useState(0);
  const [silverPrice, setSilverPrice] = useState(0);
  const [source, setSource] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString());

  const goldValue = useMemo(() => goldGrams * goldPrice, [goldGrams, goldPrice]);
  const silverValue = useMemo(() => silverGrams * silverPrice, [silverGrams, silverPrice]);
  const selectedValue = method === "GOLD" ? goldValue : silverValue;
  const selectedPrice = method === "GOLD" ? goldPrice : silverPrice;
  const selectedWeight = method === "GOLD" ? goldGrams : silverGrams;

  const applyLivePrices = (prices: AppliedMetalPrices) => {
    setGoldPrice(prices.gold);
    setSilverPrice(prices.silver);
    setSource(prices.source);
    setRecordedAt(prices.recordedAt);
  };

  const changeCurrency = (value: string) => {
    setCurrency(value);
    window.localStorage.setItem("mizan-currency", value);
    window.dispatchEvent(new CustomEvent("mizan:currency-changed", { detail: value }));
  };

  const sendToCalculator = () => {
    window.localStorage.setItem(
      "mizan:apply-nisab",
      JSON.stringify({
        gold: goldPrice,
        silver: silverPrice,
        source,
        sourceUrl: "",
        recordedAt,
        currency,
      } satisfies AppliedMetalPrices & { currency: string }),
    );
    router.push("/zakah");
  };

  return (
    <div className="space-y-4">
      <LiveMetalPrices currency={currency} onApply={applyLivePrices} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="text-base">{t("nisab.workspace.title")}</CardTitle>
            <CardDescription>{t("nisab.workspace.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nisab-currency">{t("nisab.currency")}</Label>
              <CurrencyCombobox id="nisab-currency" value={currency} onChange={changeCurrency} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("nisab.method")}</Label>
              <Select value={method} onValueChange={(value) => setMethod(value as Method)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOLD">{t("nisab.goldBased")}</SelectItem>
                  <SelectItem value="SILVER">{t("nisab.silverBased")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("nisab.goldWeight")}</Label>
              <Input type="number" step="0.01" value={goldGrams} onChange={(e) => setGoldGrams(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("nisab.goldPrice", { code: currency })}</Label>
              <Input
                type="number"
                step="0.01"
                value={goldPrice}
                onChange={(e) => {
                  setGoldPrice(Number(e.target.value));
                  setSource(t("common.manualEntry"));
                  setRecordedAt(new Date().toISOString());
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("nisab.silverWeight")}</Label>
              <Input type="number" step="0.01" value={silverGrams} onChange={(e) => setSilverGrams(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("nisab.silverPrice", { code: currency })}</Label>
              <Input
                type="number"
                step="0.01"
                value={silverPrice}
                onChange={(e) => {
                  setSilverPrice(Number(e.target.value));
                  setSource(t("common.manualEntry"));
                  setRecordedAt(new Date().toISOString());
                }}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("nisab.source")}</Label>
              <Input
                placeholder={t("nisab.sourcePlaceholder")}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <p className="flex items-start gap-2 text-xs text-muted-foreground sm:col-span-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {t("nisab.note")}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("nisab.selectedValue")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold text-emerald-900">
                {selectedPrice > 0 ? formatAmount(selectedValue, currency, locale) : t("nisab.enterPrice")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {t("nisab.methodBadge", { method: method === "GOLD" ? t("nisab.gold") : t("nisab.silver") })}
                </Badge>
                <Badge variant="secondary">{selectedWeight} g</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedWeight} g × {selectedPrice || "—"} {currency}/g
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-100">
            <CardHeader className="pb-2"><CardTitle className="text-base">{t("nisab.bothThresholds")}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">{t("nisab.gold")} ({goldGrams} g)</span>
                <span className="font-medium">{goldPrice > 0 ? formatAmount(goldValue, currency, locale) : "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">{t("nisab.silver")} ({silverGrams} g)</span>
                <span className="font-medium">{silverPrice > 0 ? formatAmount(silverValue, currency, locale) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("nisab.source")}</span>
                <span className="max-w-[60%] truncate text-end font-medium">{source || t("common.notSupplied")}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("nisab.recorded")}: {formatDateTime(recordedAt)}
              </p>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={sendToCalculator}>
            <Calculator className="size-4" /> {t("nisab.useValues")}
          </Button>
        </div>
      </div>
    </div>
  );
}
