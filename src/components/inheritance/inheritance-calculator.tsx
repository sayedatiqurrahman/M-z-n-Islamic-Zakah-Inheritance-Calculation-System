"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, CircleAlert, Loader2, Minus, Plus, Save, Download } from "lucide-react";
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
import { inheritanceRequestSchema, type InheritanceRequest } from "@/modules/inheritance/schemas";
import { INHERITANCE_METHODOLOGY_VERSION } from "@/modules/inheritance/rules";
import type { HeirType, InheritanceCalculationResult } from "@/modules/inheritance/types";
import { formatAmount, isCurrencyCode } from "@/lib/formatting";
import { translate } from "@/lib/i18n";
import { CalculationSteps } from "@/components/shared/calculation-steps";
import { CurrencyCombobox } from "@/components/currency/currency-combobox";
import { useLocale } from "@/components/layout/locale-provider";
import { InheritanceChart } from "./inheritance-chart";
import { HEIR_GROUPS, heirLabel } from "./heir-catalog";
import { cn } from "@/lib/utils";

type EstateForm = Omit<InheritanceRequest, "heirs">;

const defaultValues: EstateForm = {
  madhhab: "HANAFI",
  methodologyVersion: INHERITANCE_METHODOLOGY_VERSION,
  currency: "BDT",
  deceasedGender: "MALE",
  dateOfDeath: new Date().toISOString().slice(0, 10),
  deceasedName: "",
  grossEstate: 0,
  funeralExpenses: 0,
  debts: 0,
  wasiyyah: 0,
  otherObligations: 0,
  heirConsentToWasiyyah: false,
};

export function InheritanceCalculator() {
  const { t, locale } = useLocale();
  const [counts, setCounts] = useState<Partial<Record<HeirType, number>>>({});
  const [result, setResult] = useState<InheritanceCalculationResult | null>(null);
  const [lastInput, setLastInput] = useState<InheritanceRequest | null>(null);
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const form = useForm<EstateForm>({ resolver: zodResolver(inheritanceRequestSchema.omit({ heirs: true })), defaultValues });
  const { register, handleSubmit, watch, setValue, reset } = form;
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF's watch() is required for reactive form values.
  const currency = watch("currency");

  useEffect(() => {
    const storedCurrency = window.localStorage.getItem("mizan-currency");
    if (storedCurrency && isCurrencyCode(storedCurrency)) setValue("currency", storedCurrency);

    const raw = window.localStorage.getItem("mizan:reopen:inheritance");
    if (!raw) return;
    window.localStorage.removeItem("mizan:reopen:inheritance");
    try {
      const parsed = inheritanceRequestSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        const { heirs, ...estate } = parsed.data;
        reset(estate);
        setCounts(Object.fromEntries(heirs.map((heir) => [heir.type, heir.count])));
        toast.success(t("inheritance.toast.savedLoaded"));
      }
    } catch {
      // Ignore malformed local data.
    }
  }, [reset, setValue, t]);

  const adjust = (type: HeirType, delta: number) => {
    setCounts((prev) => {
      const next = Math.max(0, Math.min(50, (prev[type] ?? 0) + delta));
      return { ...prev, [type]: next };
    });
  };

  const onSubmit = async (values: EstateForm) => {
    const heirs = Object.entries(counts)
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([type, count]) => ({ type: type as HeirType, count: count ?? 0 }));
    if (heirs.length === 0) {
      toast.error(t("inheritance.selectHeir"));
      return;
    }
    const payload = { ...values, heirs };
    const parsed = inheritanceRequestSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(t("inheritance.reviewEstate"));
      return;
    }
    setPending(true);
    setUnsupported(null);
    setResult(null);
    try {
      const response = await fetch("/api/inheritance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? t("inheritance.calcFailed"));
        return;
      }
      if (data.supported) {
        setResult(data as InheritanceCalculationResult);
        setLastInput(parsed.data);
        toast.success(t("inheritance.distributionCalculated"));
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
        body: JSON.stringify({ type: "inheritance", input: lastInput }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        toast.error(payload.error ?? t("inheritance.unableSave"));
        return;
      }
      toast.success(t("zakah.saved"));
    } catch {
      toast.error(t("inheritance.unableSave"));
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (!lastInput) return;
    setDownloading(true);
    try {
      const response = await fetch("/api/reports/inheritance", {
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
      anchor.download = "mizan-inheritance-report.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(t("common.reportDownloaded"));
    } catch {
      toast.error(t("common.reportFailed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("inheritance.deceasedTitle")}</CardTitle>
            <CardDescription>{t("inheritance.deceasedDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("inheritance.nameOptional")}</Label>
              <Input placeholder={t("inheritance.namePlaceholder")} {...register("deceasedName")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inheritance.gender")}</Label>
              <Select value={watch("deceasedGender")} onValueChange={(v) => setValue("deceasedGender", v as "MALE" | "FEMALE")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">{t("inheritance.male")}</SelectItem>
                  <SelectItem value="FEMALE">{t("inheritance.female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("inheritance.dateOfDeath")}</Label>
              <Input type="date" {...register("dateOfDeath")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inheritance-currency">{t("inheritance.currency")}</Label>
              <CurrencyCombobox
                id="inheritance-currency"
                value={currency}
                onChange={(code) => {
                  setValue("currency", code);
                  window.localStorage.setItem("mizan-currency", code);
                  window.dispatchEvent(new CustomEvent("mizan:currency-changed", { detail: code }));
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("inheritance.estateTitle")}</CardTitle>
            <CardDescription>{t("inheritance.estateDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("inheritance.grossEstate", { code: currency })}</Label>
              <Input type="number" step="0.01" {...register("grossEstate", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inheritance.funeral")}</Label>
              <Input type="number" step="0.01" {...register("funeralExpenses", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inheritance.debts")}</Label>
              <Input type="number" step="0.01" {...register("debts", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inheritance.wasiyyah")}</Label>
              <Input type="number" step="0.01" {...register("wasiyyah", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inheritance.otherObligations")}</Label>
              <Input type="number" step="0.01" {...register("otherObligations", { valueAsNumber: true })} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={watch("heirConsentToWasiyyah")} onCheckedChange={(v) => setValue("heirConsentToWasiyyah", Boolean(v))} />
              {t("inheritance.consent")}
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("inheritance.heirsTitle")}</CardTitle>
            <CardDescription>{t("inheritance.heirsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {HEIR_GROUPS.map((group) => (
              <div key={group.titleKey}>
                <h3 className="mb-2 text-sm font-semibold text-emerald-900">{t(group.titleKey)}</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.options.map((option) => {
                    const value = counts[option.type] ?? 0;
                    const name = heirLabel(option.type, locale);
                    return (
                      <div
                        key={option.type}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border p-2.5",
                          value > 0 ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{name}</p>
                          {locale !== "ar" && (
                            <p className="font-arabic text-xs text-muted-foreground" dir="rtl">
                              {translate("ar", option.labelKey)}
                            </p>
                          )}
                          {!option.supported && (
                            <span className="text-[10px] text-amber-700">{t("inheritance.requiresVerification")}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => adjust(option.type, -1)} aria-label={t("inheritance.decrease", { name })}>
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-7 text-center text-sm font-semibold">{value}</span>
                          <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => adjust(option.type, 1)} aria-label={t("inheritance.increase", { name })}>
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending} className="bg-emerald-700 hover:bg-emerald-800">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
            {pending ? t("inheritance.calculating") : t("inheritance.calculate")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("inheritance.heirsSelected", {
              count: Object.values(counts).reduce((a, b) => a + (b ?? 0), 0),
            })}
          </span>
        </div>
      </form>

      <div className="space-y-4">
        {unsupported && (
          <Alert className="border-amber-300 bg-amber-50">
            <CircleAlert className="size-4" />
            <AlertTitle>{t("inheritance.scholarlyVerification")}</AlertTitle>
            <AlertDescription className="text-xs">{unsupported}</AlertDescription>
          </Alert>
        )}
        {!result && !unsupported && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("inheritance.placeholder")}
            </CardContent>
          </Card>
        )}
        {result && (
          <InheritanceResultView
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

function InheritanceResultView({
  result,
  onSave,
  onDownload,
  saving,
  downloading,
}: {
  result: InheritanceCalculationResult;
  onSave: () => void;
  onDownload: () => void;
  saving: boolean;
  downloading: boolean;
}) {
  const { t, locale } = useLocale();
  const eligible = result.outcomes.filter((o) => o.status === "ELIGIBLE");
  const excluded = result.outcomes.filter((o) => o.status === "EXCLUDED");

  const shareLabel = (shareType?: string) =>
    shareType === "FIXED"
      ? t("inheritance.fixedShare")
      : shareType === "RESIDUARY"
        ? t("inheritance.residuary")
        : shareType ?? "";
  const exclusionLabel = (kind: string) =>
    kind === "COMPLETE"
      ? t("inheritance.complete")
      : kind === "PARTIAL"
        ? t("inheritance.partial")
        : t("common.none");
  const adjustmentLabel = (value: string) =>
    value === "AWL" ? t("inheritance.awl") : value === "RADD" ? t("inheritance.radd") : t("common.none");

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("inheritance.netDistributable")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-emerald-900">{formatAmount(result.netDistributable, result.currency, locale)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{t("inheritance.adjustment", { value: adjustmentLabel(result.adjustment) })}</Badge>
            <Badge variant="outline">{t("inheritance.baseDenominator", { value: String(result.baseDenominator) })}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("inheritance.settlement")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label={t("inheritance.grossEstateRow")} value={formatAmount(result.grossEstate, result.currency, locale)} />
          <Row label={t("inheritance.funeralRow")} value={`− ${formatAmount(result.funeralExpenses, result.currency, locale)}`} />
          <Row label={t("inheritance.debtsRow")} value={`− ${formatAmount(result.debts, result.currency, locale)}`} />
          <Row label={t("inheritance.validBequests")} value={`− ${formatAmount(result.validBequests, result.currency, locale)}`} />
          <Row label={t("inheritance.netRow")} value={formatAmount(result.netDistributable, result.currency, locale)} />
        </CardContent>
      </Card>

      {eligible.length > 0 && <InheritanceChart outcomes={eligible} currency={result.currency} />}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("inheritance.distributionTable")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("inheritance.heir")}</TableHead><TableHead>{t("inheritance.share")}</TableHead><TableHead>{t("inheritance.amount")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {eligible.map((o) => (
                <TableRow key={o.type}>
                  <TableCell className="text-xs">
                    {heirLabel(o.type, locale)}
                    {o.count > 1 && <span className="text-muted-foreground"> ×{o.count}</span>}
                    <Badge variant="outline" className="ms-2 text-[10px]">{shareLabel(o.shareType)}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{o.fraction?.numerator}/{o.fraction?.denominator}</TableCell>
                  <TableCell className="text-xs">{o.amount !== undefined ? formatAmount(o.amount, result.currency, locale) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {excluded.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("inheritance.exclusionAnalysis")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {excluded.map((o) => (
              <div key={o.type} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{heirLabel(o.type, locale)}</span>
                  <Badge variant="secondary">{exclusionLabel(o.exclusionKind)}</Badge>
                  {o.excludedBy && (
                    <span className="text-muted-foreground">
                      {t("inheritance.excludedBy", { name: heirLabel(o.excludedBy, locale) })}
                    </span>
                  )}
                </div>
                <p className="mt-1">{o.reason}</p>
                <p className="mt-1 text-muted-foreground">{t("inheritance.principle")}: {o.principle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("inheritance.explanation")}</CardTitle></CardHeader>
        <CardContent><CalculationSteps steps={result.steps} /></CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? t("inheritance.saving") : t("inheritance.saveHistory")}
        </Button>
        <Button variant="outline" onClick={onDownload} disabled={downloading}>
          {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {downloading ? t("inheritance.preparing") : t("inheritance.downloadPdf")}
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
