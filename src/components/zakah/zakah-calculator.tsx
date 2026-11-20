"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Calculator, CircleAlert, Loader2, Save, Download, Wallet, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { zakahRequestSchema, type ZakahRequest } from "@/modules/zakah/schemas";
import { ZAKAH_METHODOLOGY_VERSION, ZAKAH_RECIPIENT_PURPOSES } from "@/modules/zakah/rules";
import { EVIDENCE } from "@/modules/fiqh/evidences/catalog";
import type { InKindDue, ZakahCalculationResult, ZakahAssetCategory } from "@/modules/zakah/types";
import { formatAmount, isCurrencyCode } from "@/lib/formatting";
import { CalculationSteps } from "@/components/shared/calculation-steps";
import { CurrencyCombobox } from "@/components/currency/currency-combobox";
import { LiveMetalPrices } from "@/components/prices/live-metal-prices";
import type { AppliedMetalPrices } from "@/modules/prices/types";
import { useLocale } from "@/components/layout/locale-provider";
import { ZakahChart } from "./zakah-chart";

const MONEY_CATEGORIES = [
  "CASH_HOME",
  "CASH_BANK",
  "SAVINGS",
  "CURRENT_ACCOUNT",
  "FOREIGN_CURRENCY",
  "DIGITAL_MONEY",
  "BUSINESS_CASH",
] as const;

const ASSET_CATEGORIES = [
  "CASH_HOME",
  "CASH_BANK",
  "SAVINGS",
  "CURRENT_ACCOUNT",
  "FOREIGN_CURRENCY",
  "DIGITAL_MONEY",
  "GOLD_JEWELRY",
  "GOLD_INVESTMENT",
  "GOLD_BARS",
  "GOLD_COINS",
  "SILVER_JEWELRY",
  "SILVER_INVESTMENT",
  "SILVER_BARS",
  "BUSINESS_MERCHANDISE",
  "BUSINESS_INVENTORY",
  "BUSINESS_RECEIVABLE",
  "BUSINESS_CASH",
  "LIVESTOCK_CAMEL",
  "LIVESTOCK_CATTLE",
  "LIVESTOCK_GOAT_SHEEP",
  "CROP_WHEAT",
  "CROP_BARLEY",
  "CROP_DATES",
  "CROP_GRAPES",
  "CROP_OTHER",
  "MINERALS_TREASURE",
  "SHARES_STOCKS",
  "OTHER_INVESTMENT",
  "OTHER_ASSET",
] as const;

const IN_KIND_CATEGORIES: ZakahAssetCategory[] = [
  "LIVESTOCK_CAMEL",
  "LIVESTOCK_CATTLE",
  "LIVESTOCK_GOAT_SHEEP",
  "CROP_WHEAT",
  "CROP_BARLEY",
  "CROP_DATES",
  "CROP_GRAPES",
  "CROP_OTHER",
  "MINERALS_TREASURE",
];

const CROP_CATEGORIES: ZakahAssetCategory[] = [
  "CROP_WHEAT",
  "CROP_BARLEY",
  "CROP_DATES",
  "CROP_GRAPES",
  "CROP_OTHER",
];

const LIABILITY_TYPES = [
  "IMMEDIATE_DEBT",
  "BUSINESS_LIABILITY",
  "OTHER_DEDUCTIBLE",
  "LONG_TERM_LOAN",
  "NON_DEDUCTIBLE",
] as const;

const today = new Date().toISOString().slice(0, 10);
const oneYearAgo = new Date(Date.now() - 354 * 86400000).toISOString().slice(0, 10);

const defaultValues: ZakahRequest = {
  madhhab: "HANAFI",
  methodologyVersion: ZAKAH_METHODOLOGY_VERSION,
  currency: "BDT",
  ownershipConfirmed: false,
  growthConditionConfirmed: false,
  assets: [{ id: "a1", category: "CASH_HOME", amount: 0, currency: "BDT", conversionRateToBase: 1 }],
  liabilities: [],
  nisab: {
    method: "SILVER",
    goldNisabGrams: 85,
    silverNisabGrams: 595,
    goldPricePerGram: 0,
    silverPricePerGram: 0,
    priceSource: "Manual entry",
    isManual: true,
    recordedAt: new Date().toISOString(),
    currency: "BDT",
  },
  hawl: {
    nisabFirstReachedDate: oneYearAgo,
    assessmentDate: today,
    calendarMethod: "TABULAR_CIVIL",
    wealthRemainedAboveNisab: true,
  },
};

export function ZakahCalculator() {
  const { t } = useLocale();
  const [result, setResult] = useState<ZakahCalculationResult | null>(null);
  const [lastInput, setLastInput] = useState<ZakahRequest | null>(null);
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const form = useForm<ZakahRequest>({ resolver: zodResolver(zakahRequestSchema), defaultValues });
  const { control, register, handleSubmit, watch, setValue, reset, formState } = form;
  const assets = useFieldArray({ control, name: "assets" });
  const liabilities = useFieldArray({ control, name: "liabilities" });
  const currency = watch("currency");
  const isManual = watch("nisab.isManual");

  useEffect(() => {
    const storedCurrency = window.localStorage.getItem("mizan-currency");
    if (storedCurrency && isCurrencyCode(storedCurrency)) {
      setValue("currency", storedCurrency);
      setValue("nisab.currency", storedCurrency);
    }
    const storedMethod = window.localStorage.getItem("mizan-nisab-method");
    if (storedMethod === "GOLD" || storedMethod === "SILVER") setValue("nisab.method", storedMethod);

    const raw = window.localStorage.getItem("mizan:reopen:zakah");
    if (raw) {
      window.localStorage.removeItem("mizan:reopen:zakah");
      try {
        const parsed = zakahRequestSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          reset(parsed.data);
          toast.success(t("zakah.toast.savedLoaded"));
          return;
        }
      } catch {
        // Ignore malformed local data.
      }
    }

    const nisabRaw = window.localStorage.getItem("mizan:apply-nisab");
    if (nisabRaw) {
      window.localStorage.removeItem("mizan:apply-nisab");
      try {
        const applied = JSON.parse(nisabRaw) as Partial<AppliedMetalPrices> & {
          currency?: string;
          goldPricePerGram?: number;
          silverPricePerGram?: number;
          priceSource?: string;
        };
        // Accept both the current AppliedMetalPrices handoff and the legacy
        // flattened shape, so a saved Nisab workspace is never silently lost.
        const gold = applied.gold ?? applied.goldPricePerGram;
        const silver = applied.silver ?? applied.silverPricePerGram;
        const source = applied.source ?? applied.priceSource;
        if (typeof gold === "number") setValue("nisab.goldPricePerGram", gold);
        if (typeof silver === "number") setValue("nisab.silverPricePerGram", silver);
        if (source) setValue("nisab.priceSource", source);
        if (applied.recordedAt) setValue("nisab.recordedAt", applied.recordedAt);
        if (applied.currency && isCurrencyCode(applied.currency)) setValue("currency", applied.currency);
        setValue("nisab.isManual", false);
        toast.success(t("zakah.toast.nisabApplied"));
      } catch {
        // Ignore malformed local data.
      }
    }
  }, [reset, setValue, t]);

  const applyLivePrices = useCallback(
    (prices: AppliedMetalPrices) => {
      setValue("nisab.goldPricePerGram", prices.gold);
      setValue("nisab.silverPricePerGram", prices.silver);
      setValue("nisab.priceSource", prices.source);
      setValue("nisab.recordedAt", prices.recordedAt);
      setValue("nisab.currency", currency);
      setValue("nisab.isManual", false);
      toast.success(t("zakah.toast.liveApplied"));
    },
    [currency, setValue, t],
  );

  const changeCurrency = (value: string) => {
    setValue("currency", value);
    setValue("nisab.currency", value);
    // A price per gram is only valid in the currency it was quoted in.
    setValue("nisab.goldPricePerGram", 0);
    setValue("nisab.silverPricePerGram", 0);
    setValue("nisab.priceSource", t("zakah.awaitingPrice", { code: value }));
    setValue("nisab.isManual", true);
    window.localStorage.setItem("mizan-currency", value);
    window.dispatchEvent(new CustomEvent("mizan:currency-changed", { detail: value }));
  };

  const onSubmit = async (values: ZakahRequest) => {
    setPending(true);
    setUnsupported(null);
    setResult(null);
    try {
      const response = await fetch("/api/zakah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? t("zakah.calcFailed"));
        return;
      }
      if (data.supported) {
        setResult(data as ZakahCalculationResult);
        setLastInput(values);
        toast.success(t("zakah.calcComplete"));
      } else {
        setUnsupported(data.reason);
      }
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setPending(false);
    }
  };

  const saveToHistory = async () => {
    if (!lastInput) return;
    setSaving(true);
    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "zakah", input: lastInput }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        toast.error(payload.error ?? t("zakah.unableSave"));
        return;
      }
      toast.success(t("zakah.saved"));
    } catch {
      toast.error(t("zakah.unableSave"));
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (!lastInput) return;
    setDownloading(true);
    try {
      const response = await fetch("/api/reports/zakah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: lastInput }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        toast.error(payload.error ?? t("common.reportFailed"));
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "mizan-zakah-report.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(t("common.reportDownloaded"));
    } catch {
      toast.error(t("common.reportFailed"));
    } finally {
      setDownloading(false);
    }
  };

  const primaryCategory = watch("assets.0.category") as ZakahAssetCategory | undefined;
  const primaryOptions: readonly string[] =
    primaryCategory && !MONEY_CATEGORIES.includes(primaryCategory as (typeof MONEY_CATEGORIES)[number])
      ? [primaryCategory, ...MONEY_CATEGORIES]
      : MONEY_CATEGORIES;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <LiveMetalPrices currency={currency} onApply={applyLivePrices} autoApply />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("zakah.nisabTitle")}</CardTitle>
            <CardDescription>{t("zakah.nisabDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="zakah-currency">{t("zakah.currency")}</Label>
              <CurrencyCombobox id="zakah-currency" value={currency} onChange={changeCurrency} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("zakah.nisabMethod")}</Label>
              <Select value={watch("nisab.method")} onValueChange={(v) => setValue("nisab.method", v as "GOLD" | "SILVER")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOLD">{t("zakah.goldBased")}</SelectItem>
                  <SelectItem value="SILVER">{t("zakah.silverBased")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("zakah.goldWeight")}</Label>
              <Input type="number" step="0.01" {...register("nisab.goldNisabGrams", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("zakah.silverWeight")}</Label>
              <Input type="number" step="0.01" {...register("nisab.silverNisabGrams", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("zakah.goldPrice")}</Label>
              <Input
                type="number"
                step="0.01"
                {...register("nisab.goldPricePerGram", {
                  valueAsNumber: true,
                  onChange: () => setValue("nisab.isManual", true),
                })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("zakah.silverPrice")}</Label>
              <Input
                type="number"
                step="0.01"
                {...register("nisab.silverPricePerGram", {
                  valueAsNumber: true,
                  onChange: () => setValue("nisab.isManual", true),
                })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("zakah.priceSource")}</Label>
              <Input placeholder={t("zakah.priceSourcePlaceholder")} {...register("nisab.priceSource")} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={isManual} onCheckedChange={(v) => setValue("nisab.isManual", Boolean(v))} />
              {t("zakah.manualPrices")}
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("zakah.hawlTitle")}</CardTitle>
            <CardDescription>{t("zakah.hawlDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("zakah.nisabFirst")}</Label>
              <Input type="date" {...register("hawl.nisabFirstReachedDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("zakah.assessmentDate")}</Label>
              <Input type="date" {...register("hawl.assessmentDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("zakah.previousZakah")}</Label>
              <Input type="date" {...register("hawl.previousZakahDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("zakah.calendarMethod")}</Label>
              <Select value={watch("hawl.calendarMethod")} onValueChange={(v) => setValue("hawl.calendarMethod", v as ZakahRequest["hawl"]["calendarMethod"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TABULAR_CIVIL">{t("zakah.tabularCivil")}</SelectItem>
                  <SelectItem value="UMM_AL_QURA_APPROX">{t("zakah.ummAlQura")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={watch("hawl.wealthRemainedAboveNisab")} onCheckedChange={(v) => setValue("hawl.wealthRemainedAboveNisab", Boolean(v))} />
                {t("zakah.wealthAbove")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={watch("ownershipConfirmed")} onCheckedChange={(v) => setValue("ownershipConfirmed", Boolean(v))} />
                {t("zakah.ownership")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={watch("growthConditionConfirmed")} onCheckedChange={(v) => setValue("growthConditionConfirmed", Boolean(v))} />
                {t("zakah.growth")}
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4 text-emerald-700" /> {t("zakah.moneyTitle")}
            </CardTitle>
            <CardDescription>{t("zakah.moneyDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assets.fields[0] && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
                <Label htmlFor="zakah-primary-money" className="text-sm font-semibold">
                  {t("zakah.moneyQuestion")}
                </Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="zakah-primary-money"
                    type="number"
                    step="0.01"
                    className="text-lg font-semibold"
                    {...register("assets.0.amount", { valueAsNumber: true })}
                  />
                  <Select
                    value={primaryCategory ?? "CASH_HOME"}
                    onValueChange={(v) => setValue("assets.0.category", v as ZakahRequest["assets"][number]["category"])}
                  >
                    <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {primaryOptions.map((value) => (
                        <SelectItem key={value} value={value}>{t(`zakah.asset.${value}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("zakah.moneyHint", { code: currency })}</p>
              </div>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => assets.append({ id: crypto.randomUUID(), category: "CASH_BANK", amount: 0, currency, conversionRateToBase: 1 })}
            >
              <Plus className="size-4" /> {t("zakah.addBank")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">{t("zakah.assetsTitle")}</CardTitle>
              <CardDescription>{t("zakah.assetsDesc")}</CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => assets.append({ id: crypto.randomUUID(), category: "GOLD_JEWELRY", amount: 0, currency, conversionRateToBase: 1 })}>
              <Plus className="size-4" /> {t("zakah.addAsset")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {assets.fields.length === 1 && <p className="text-sm text-muted-foreground">{t("zakah.noExtraAssets")}</p>}
            {assets.fields.slice(1).map((field, offset) => {
              const index = offset + 1;
              // eslint-disable-next-line react-hooks/incompatible-library -- RHF's watch() is required for reactive field arrays.
              const category = watch(`assets.${index}.category`) as ZakahAssetCategory;
              const isMetal = category.startsWith("GOLD") || category.startsWith("SILVER");
              const isInKind = IN_KIND_CATEGORIES.includes(category);
              const isCrop = CROP_CATEGORIES.includes(category);
              const unit = isCrop ? "kg" : "head";
              return (
                <div key={field.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Label className="text-xs">{t("zakah.category")}</Label>
                    <Select value={category} onValueChange={(v) => setValue(`assets.${index}.category`, v as ZakahRequest["assets"][number]["category"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ASSET_CATEGORIES.map((value) => (
                          <SelectItem key={value} value={value}>{t(`zakah.asset.${value}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">{t("zakah.label")}</Label>
                    <Input placeholder={t("common.optional")} {...register(`assets.${index}.label`)} />
                  </div>
                  {isMetal ? (
                    <>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">{t("zakah.weight")}</Label>
                        <Input type="number" step="0.01" {...register(`assets.${index}.weightGrams`, { valueAsNumber: true })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">{t("zakah.purity")}</Label>
                        <Input type="number" step="0.01" min="0" max="1" {...register(`assets.${index}.purity`, { valueAsNumber: true })} />
                      </div>
                    </>
                  ) : isInKind ? (
                    <>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">{t("zakah.quantity", { unit })}</Label>
                        <Input type="number" step="0.01" {...register(`assets.${index}.quantity`, { valueAsNumber: true })} />
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-xs">{t("zakah.unitValue", { code: currency })}</Label>
                        <Input type="number" step="0.01" {...register(`assets.${index}.unitValue`, { valueAsNumber: true })} />
                      </div>
                      {isCrop && (
                        <div className="sm:col-span-3">
                          <Label className="text-xs">{t("zakah.irrigation")}</Label>
                          <Select
                            value={watch(`assets.${index}.irrigation`) ?? "RAIN_FED"}
                            onValueChange={(v) => setValue(`assets.${index}.irrigation`, v as ZakahRequest["assets"][number]["irrigation"])}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RAIN_FED">{t("zakah.irrigation.RAIN_FED")}</SelectItem>
                              <SelectItem value="IRRIGATED">{t("zakah.irrigation.IRRIGATED")}</SelectItem>
                              <SelectItem value="MIXED">{t("zakah.irrigation.MIXED")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground sm:col-span-12">
                        {t(`zakah.ruleHint.${category}`)}
                      </p>
                    </>
                  ) : (
                    <div className="sm:col-span-4">
                      <Label className="text-xs">{t("zakah.value", { code: currency })}</Label>
                      <Input type="number" step="0.01" {...register(`assets.${index}.amount`, { valueAsNumber: true })} />
                    </div>
                  )}
                  <div className="flex items-end sm:col-span-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => assets.remove(index)} aria-label={t("zakah.removeAsset")}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => assets.append({ id: crypto.randomUUID(), category: "LIVESTOCK_GOAT_SHEEP", quantity: 0, currency, conversionRateToBase: 1 })}
            >
              <Sprout className="size-4" /> {t("zakah.addLivestock")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("zakah.liabilitiesTitle")}</CardTitle>
              <CardDescription>{t("zakah.liabilitiesDesc")}</CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => liabilities.append({ id: crypto.randomUUID(), type: "IMMEDIATE_DEBT", amount: 0, currency, conversionRateToBase: 1, dueNow: true })}>
              <Plus className="size-4" /> {t("zakah.addLiability")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {liabilities.fields.length === 0 && <p className="text-sm text-muted-foreground">{t("zakah.noLiabilities")}</p>}
            {liabilities.fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Label className="text-xs">{t("zakah.type")}</Label>
                  <Select value={watch(`liabilities.${index}.type`)} onValueChange={(v) => setValue(`liabilities.${index}.type`, v as ZakahRequest["liabilities"][number]["type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIABILITY_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>{t(`zakah.liability.${value}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-3">
                  <Label className="text-xs">{t("zakah.amount", { code: currency })}</Label>
                  <Input type="number" step="0.01" {...register(`liabilities.${index}.amount`, { valueAsNumber: true })} />
                </div>
                <div className="flex items-end gap-2 sm:col-span-4">
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox checked={watch(`liabilities.${index}.dueNow`)} onCheckedChange={(v) => setValue(`liabilities.${index}.dueNow`, Boolean(v))} />
                    {t("zakah.dueNow")}
                  </label>
                  <Button type="button" variant="ghost" size="icon" onClick={() => liabilities.remove(index)} aria-label={t("zakah.removeLiability")}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("zakah.recipientsTitle")}</CardTitle>
            <CardDescription>{t("zakah.recipientsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {ZAKAH_RECIPIENT_PURPOSES.map((purpose) => (
              <div
                key={purpose.id}
                className="rounded-lg border p-3"
                title={`${t("zakah.recipient.source")} — ${purpose.evidence.map((item) => item.label).join(", ")}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{t(`zakah.recipient.${purpose.id}`)}</p>
                    <p dir="rtl" className="font-heading text-sm text-emerald-800">{purpose.arabic}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{t("zakah.needsReview")}</Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t(`zakah.recipient.${purpose.id}.desc`)}
                </p>
              </div>
            ))}
            <a
              href={EVIDENCE.QURAN_ZAKAH_RECIPIENTS.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-700 hover:underline sm:col-span-2"
            >
              {t("zakah.recipient.source")}
            </a>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending} className="bg-emerald-700 hover:bg-emerald-800">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
            {pending ? t("zakah.calculating") : t("zakah.calculate")}
          </Button>
          {Object.keys(formState.errors).length > 0 && (
            <span className="text-sm text-destructive">{t("zakah.reviewInputs")}</span>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {unsupported && (
          <Alert className="border-amber-300 bg-amber-50">
            <CircleAlert className="size-4" />
            <AlertTitle>{t("zakah.requiresVerification")}</AlertTitle>
            <AlertDescription className="text-xs">{unsupported}</AlertDescription>
          </Alert>
        )}
        {!result && !unsupported && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("zakah.resultsPlaceholder")}
            </CardContent>
          </Card>
        )}
        {result && (
          <ZakahResultView
            result={result}
            onSave={() => void saveToHistory()}
            onDownload={() => void downloadPdf()}
            saving={saving}
            downloading={downloading}
          />
        )}
      </div>
    </div>
  );
}

function ZakahResultView({
  result,
  onSave,
  onDownload,
  saving,
  downloading,
}: {
  result: ZakahCalculationResult;
  onSave: () => void;
  onDownload: () => void;
  saving: boolean;
  downloading: boolean;
}) {
  const { t, locale } = useLocale();
  const included = result.classifiedAssets.filter((a) => a.included);
  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("zakah.payable")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-emerald-900">{formatAmount(result.totalPayable, result.currency, locale)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("zakah.totalPayable")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={result.nisabReached ? "default" : "secondary"}>{result.nisabReached ? t("zakah.nisabReached") : t("zakah.nisabNotReached")}</Badge>
            <Badge variant={result.hawlCompleted ? "default" : "secondary"}>{result.hawlCompleted ? t("zakah.hawlComplete") : t("zakah.hawlIncomplete")}</Badge>
            <Badge variant="outline">
              {t("zakah.nisabBadge", {
                method: result.nisabMethod === "GOLD" ? t("zakah.goldNisab") : t("zakah.silverNisab"),
              })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("zakah.summary")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label={t("zakah.totalAssets")} value={formatAmount(result.totalAssets, result.currency, locale)} />
          <Row label={t("zakah.deductible")} value={formatAmount(result.totalDeductibleLiabilities, result.currency, locale)} />
          <Row label={t("zakah.netWealth")} value={formatAmount(result.netZakahableWealth, result.currency, locale)} />
          <Row label={t("zakah.nisabValue")} value={formatAmount(result.nisabValue, result.currency, locale)} />
          <Row label={t("zakah.rate")} value="2.5%" />
          <Row label={t("zakah.payable")} value={formatAmount(result.zakahPayable, result.currency, locale)} />
          <Row label={t("zakah.inKindValue")} value={formatAmount(result.totalInKindValue, result.currency, locale)} />
        </CardContent>
      </Card>

      {included.length > 0 && <ZakahChart assets={included} currency={result.currency} />}

      {result.inKindDues.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("zakah.inKindDues")}</CardTitle>
            <CardDescription className="text-xs">{t("zakah.inKindCaveat")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.inKindDues.map((due: InKindDue) => (
              <div key={due.id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{due.label}</p>
                  <Badge variant="outline" className="text-[10px]">{t("zakah.needsReview")}</Badge>
                </div>
                <p className="mt-1">{t("zakah.quantityCol")}: {due.quantity} {due.unit} · {t("zakah.due")}: <span className="font-semibold">{due.dueDescription}</span></p>
                <p className="mt-1 text-muted-foreground">{due.explanation}</p>
                <p className="mt-1 text-muted-foreground">{due.ruleId} · {due.verification}</p>
                {due.estimatedValue !== null && (
                  <p className="mt-1 font-medium">{formatAmount(due.estimatedValue, result.currency, locale)}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("zakah.assetClassification")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("zakah.asset")}</TableHead><TableHead>{t("zakah.valueCol")}</TableHead><TableHead>{t("zakah.status")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {result.classifiedAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="text-xs">{asset.label || t(`zakah.asset.${asset.category}`)}</TableCell>
                  <TableCell className="text-xs">
                    {asset.valuationMode === "IN_KIND"
                      ? t("zakah.assetInKind")
                      : formatAmount(asset.valueInBase, result.currency, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={asset.included ? "default" : "secondary"}>
                      {asset.included ? t("zakah.included") : asset.valuationMode === "IN_KIND" ? t("zakah.inKindDues") : t("zakah.excluded")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("zakah.liabilityClassification")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("zakah.type")}</TableHead><TableHead>{t("zakah.valueCol")}</TableHead><TableHead>{t("zakah.status")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {result.classifiedLiabilities.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-xs text-muted-foreground">{t("zakah.noLiabilities")}</TableCell></TableRow>
              ) : (
                result.classifiedLiabilities.map((liability) => (
                  <TableRow key={liability.id}>
                    <TableCell className="text-xs">{liability.label || t(`zakah.liability.${liability.type}`)}</TableCell>
                    <TableCell className="text-xs">{formatAmount(liability.valueInBase, result.currency, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={liability.deductible ? "default" : "secondary"}>
                        {liability.deductible ? t("zakah.included") : t("zakah.excluded")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("zakah.explanation")}</CardTitle></CardHeader>
        <CardContent><CalculationSteps steps={result.steps} /></CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? t("zakah.saving") : t("zakah.saveHistory")}
        </Button>
        <Button variant="outline" onClick={onDownload} disabled={downloading}>
          {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {downloading ? t("zakah.preparing") : t("zakah.downloadPdf")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("common.methodologyNote", { version: result.methodologyVersion })}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-dashed pb-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
