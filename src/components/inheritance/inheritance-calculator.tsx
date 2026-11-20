"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, ChevronRight, CircleAlert, Download, Loader2, Minus, Plus, Save, UserPlus, UserMinus } from "lucide-react";
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
import { inheritanceRequestSchema, munasakhaRequestSchema, type InheritanceRequest } from "@/modules/inheritance/schemas";
import { calculateInheritance } from "@/modules/inheritance/engine";
import { HEIR_MAX_COUNTS, INHERITANCE_METHODOLOGY_VERSION } from "@/modules/inheritance/rules";
import type { HeirType, InheritanceCalculationResult, MunasakhaCalculationResult } from "@/modules/inheritance/types";
import { formatAmount, isCurrencyCode } from "@/lib/formatting";
import { CalculationSteps } from "@/components/shared/calculation-steps";
import { ReferenceTooltip } from "@/components/shared/reference-tooltip";
import { CurrencyCombobox } from "@/components/currency/currency-combobox";
import { useLocale } from "@/components/layout/locale-provider";
import { InheritanceChart } from "./inheritance-chart";
import { HEIR_GROUPS, heirLabel } from "./heir-catalog";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type EstateForm = Omit<InheritanceRequest, "heirs">;

const defaultValues: EstateForm = {
  madhhab: "SUNNI_MAJORITY",
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

interface DeceasedState {
  id: string;
  deceasedName?: string;
  deceasedGender: "MALE" | "FEMALE";
  dateOfDeath: string;
  grossEstate: number;
  funeralExpenses: number;
  debts: number;
  wasiyyah: number;
  otherObligations: number;
  heirConsentToWasiyyah: boolean;
  counts: Partial<Record<HeirType, number>>;
  inheritsFromType?: HeirType;
}

/** Heir categories whose shares are affected when a new heir of this type is added. */
const IMPACTED_BY: Partial<Record<HeirType, HeirType[]>> = {
  SON: ["FATHER", "MOTHER", "FULL_BROTHER", "FULL_SISTER", "PATERNAL_BROTHER", "PATERNAL_SISTER", "MATERNAL_BROTHER", "MATERNAL_SISTER"],
  DAUGHTER: ["SONS_DAUGHTER", "FATHER", "MOTHER"],
  SONS_SON: ["FATHER", "SON"],
  SONS_DAUGHTER: ["FATHER", "SON", "DAUGHTER"],
  FATHER: ["PATERNAL_GRANDFATHER"],
  MOTHER: ["FATHER"],
  HUSBAND: ["FATHER", "MOTHER"],
  WIFE: ["FATHER", "MOTHER"],
  FULL_BROTHER: ["FATHER", "MOTHER"],
  FULL_SISTER: ["FATHER", "MOTHER"],
  PATERNAL_BROTHER: ["FATHER", "MOTHER"],
  PATERNAL_SISTER: ["FATHER", "MOTHER"],
  MATERNAL_BROTHER: ["FATHER", "MOTHER"],
  MATERNAL_SISTER: ["FATHER", "MOTHER"],
};

export function InheritanceCalculator() {
  const { t, locale } = useLocale();
  const [mode, setMode] = useState<"SINGLE" | "MUNASAKHA">("SINGLE");
  const [counts, setCounts] = useState<Partial<Record<HeirType, number>>>({});
  const [result, setResult] = useState<InheritanceCalculationResult | null>(null);
  const [munasakhaResult, setMunasakhaResult] = useState<MunasakhaCalculationResult | null>(null);
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [lastInput, setLastInput] = useState<InheritanceRequest | null>(null);

  const [deceasedList, setDeceasedList] = useState<DeceasedState[]>([]);

  const form = useForm<EstateForm>({ resolver: zodResolver(inheritanceRequestSchema.omit({ heirs: true })), defaultValues });
  const { register, handleSubmit, watch, setValue, reset } = form;
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF's watch() is required for reactive form values.
  const currency = watch("currency");
  const deceasedGender = watch("deceasedGender") as "MALE" | "FEMALE";
  const watchedValues = useWatch({ control: form.control }) as EstateForm;

  /** Pure client-side preview used only for inline nisab labels and tooltips. */
  const buildPreview = (
    heirCounts: Partial<Record<HeirType, number>>,
    gender: "MALE" | "FEMALE",
    estate: Partial<EstateForm> = {},
  ) => {
    const heirList = Object.entries(heirCounts)
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([type, count]) => ({ type: type as HeirType, count: count ?? 0 }));
    if (heirList.length === 0) return null;
    const parsed = inheritanceRequestSchema.safeParse({
      ...watchedValues,
      ...estate,
      deceasedGender: gender,
      heirs: heirList,
    });
    if (!parsed.success) return null;
    const preview = calculateInheritance(parsed.data);
    return preview.supported ? preview : null;
  };

  const previewResult = mode === "SINGLE" ? buildPreview(counts, deceasedGender) : null;

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
        setMode("SINGLE");
        toast.success(t("inheritance.toast.savedLoaded"));
      }
    } catch {
      // Ignore malformed local data.
    }
  }, [reset, setValue, t]);

  const adjust = (type: HeirType, delta: number) => {
    const current = counts[type] ?? 0;
    const next = Math.max(0, Math.min(HEIR_MAX_COUNTS[type], current + delta));
    if (next === current) return;
    if (type === "WIFE" && next > 0 && (counts["HUSBAND"] ?? 0) > 0) {
      toast.error(t("inheritance.spouseConflict"));
      return;
    }
    if (type === "HUSBAND" && next > 0 && (counts["WIFE"] ?? 0) > 0) {
      toast.error(t("inheritance.spouseConflict"));
      return;
    }
    if (type === "HUSBAND" && next > 0 && deceasedGender === "MALE") {
      toast.error(t("inheritance.invalidSpouse"));
      return;
    }
    if (type === "WIFE" && next > 0 && deceasedGender === "FEMALE") {
      toast.error(t("inheritance.invalidSpouse"));
      return;
    }
    setCounts((prev) => ({ ...prev, [type]: next }));
  };

  const setDeceasedGender = (value: "MALE" | "FEMALE") => {
    setValue("deceasedGender", value);
    if (value === "MALE") {
      setCounts((prev) => {
        const next = { ...prev };
        delete next["HUSBAND"];
        return next;
      });
    }
    if (value === "FEMALE") {
      setCounts((prev) => {
        const next = { ...prev };
        delete next["WIFE"];
        return next;
      });
    }
  };

  const newDeceased = (index: number): DeceasedState => ({
    id: `deceased-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    deceasedGender: "MALE",
    dateOfDeath: new Date().toISOString().slice(0, 10),
    grossEstate: 0,
    funeralExpenses: 0,
    debts: 0,
    wasiyyah: 0,
    otherObligations: 0,
    heirConsentToWasiyyah: false,
    counts: {},
  });

  const addDeceased = () => {
    setDeceasedList((prev) => [...prev, newDeceased(prev.length + 1)]);
  };

  const removeDeceased = (id: string) => {
    setDeceasedList((prev) => (prev.length > 1 ? prev.filter((d) => d.id !== id) : prev));
  };

  const updateDeceased = (id: string, patch: Partial<DeceasedState>) => {
    setDeceasedList((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const adjustDeceased = (id: string, type: HeirType, delta: number, deceasedGenderFor: "MALE" | "FEMALE") => {
    setDeceasedList((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const current = d.counts[type] ?? 0;
        const next = Math.max(0, Math.min(HEIR_MAX_COUNTS[type], current + delta));
        if (next === current) return d;
        if (type === "WIFE" && next > 0 && (d.counts["HUSBAND"] ?? 0) > 0) return d;
        if (type === "HUSBAND" && next > 0 && (d.counts["WIFE"] ?? 0) > 0) return d;
        if (type === "HUSBAND" && next > 0 && deceasedGenderFor === "MALE") return d;
        if (type === "WIFE" && next > 0 && deceasedGenderFor === "FEMALE") return d;
        return { ...d, counts: { ...d.counts, [type]: next } };
      }),
    );
  };

  const onSubmit = async (values: EstateForm) => {
    if (mode === "MUNASAKHA") {
      if (deceasedList.length === 0) {
        toast.error(t("inheritance.selectHeir"));
        return;
      }
      const deceasedPayload = deceasedList.map((d, index) => ({
        id: d.id,
        deceasedName: d.deceasedName?.trim() || undefined,
        deceasedGender: d.deceasedGender,
        dateOfDeath: d.dateOfDeath,
        grossEstate: d.grossEstate,
        funeralExpenses: d.funeralExpenses,
        debts: d.debts,
        wasiyyah: d.wasiyyah,
        otherObligations: d.otherObligations,
        heirConsentToWasiyyah: d.heirConsentToWasiyyah,
        heirs: Object.entries(d.counts)
          .filter(([, count]) => (count ?? 0) > 0)
          .map(([type, count]) => ({ type: type as HeirType, count: count ?? 0 })),
        inheritsFrom:
          d.inheritsFromType && index > 0
            ? { fromId: deceasedList[index - 1]!.id, heirType: d.inheritsFromType }
            : undefined,
      }));
      const parsed = munasakhaRequestSchema.safeParse({ ...values, deceased: deceasedPayload });
      if (!parsed.success) {
        toast.error(t("inheritance.reviewEstate"));
        return;
      }
      setPending(true);
      setUnsupported(null);
      setMunasakhaResult(null);
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
          setMunasakhaResult(data);
          toast.success(t("inheritance.distributionCalculated"));
        } else {
          setUnsupported(data.reason);
        }
      } catch {
        toast.error(t("common.networkError"));
      } finally {
        setPending(false);
      }
      return;
    }

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

  const totalHeirsSelected = mode === "MUNASAKHA"
    ? deceasedList.reduce((acc, d) => acc + Object.values(d.counts).reduce((a, b) => a + (b ?? 0), 0), 0)
    : Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("inheritance.heirsTitle")}</CardTitle>
            <CardDescription>{t("inheritance.heirsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
              <div>
                <p className="text-sm font-semibold text-emerald-900">{t("inheritance.munasakhaTitle")}</p>
                <p className="text-xs text-emerald-900/80">{t("inheritance.munasakhaDesc")}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white p-1">
                <Button type="button" size="sm" variant={mode === "SINGLE" ? "default" : "ghost"} onClick={() => setMode("SINGLE")}>
                  {t("common.one")}
                </Button>
                <Button type="button" size="sm" variant={mode === "MUNASAKHA" ? "default" : "ghost"} onClick={() => setMode("MUNASAKHA")}>
                  {t("inheritance.munasakhaTitle")}
                </Button>
              </div>
            </div>

            {mode === "SINGLE" ? (
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
                      <Select value={deceasedGender} onValueChange={(v) => setDeceasedGender(v as "MALE" | "FEMALE")}>
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
                            const applicable =
                              (option.type === "HUSBAND" && deceasedGender === "FEMALE") ||
                              (option.type === "WIFE" && deceasedGender === "MALE") ||
                              (option.type !== "HUSBAND" && option.type !== "WIFE");
                            const show = applicable;
                            if (!show) return null;
                            return (
                              <HeirRow
                                key={option.type}
                                type={option.type}
                                label={name}
                                locale={locale}
                                count={value}
                                supported={option.supported}
                                deceasedGender={deceasedGender}
                                counts={counts}
                                onAdjust={adjust}
                                preview={previewResult}
                                t={t}
                              />
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
                    {t("inheritance.heirsSelected", { count: Object.values(counts).reduce((a, b) => a + (b ?? 0), 0) })}
                  </span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {deceasedList.map((deceased, index) => (
                  <Collapsible key={deceased.id} defaultOpen={index === deceasedList.length - 1}>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="group h-auto w-full justify-start px-0">
                              <ChevronRight className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                              <span className="text-sm font-semibold">
                                {t("inheritance.deceasedCase", { index: index + 1 })}
                              </span>
                              {deceased.deceasedName?.trim() ? <span className="truncate text-muted-foreground">— {deceased.deceasedName}</span> : null}
                            </Button>
                          </CollapsibleTrigger>
                          <Button type="button" size="icon" variant="outline" onClick={() => removeDeceased(deceased.id)} aria-label={t("inheritance.removeDeceased")}>
                            <UserMinus className="size-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.nameOptional")}</Label>
                            <Input value={deceased.deceasedName ?? ""} onChange={(e) => updateDeceased(deceased.id, { deceasedName: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.gender")}</Label>
                            <Select value={deceased.deceasedGender} onValueChange={(v) => updateDeceased(deceased.id, { deceasedGender: v as "MALE" | "FEMALE" })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">{t("inheritance.male")}</SelectItem>
                                <SelectItem value="FEMALE">{t("inheritance.female")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.dateOfDeath")}</Label>
                            <Input type="date" value={deceased.dateOfDeath} onChange={(e) => updateDeceased(deceased.id, { dateOfDeath: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.inheritedShare")}</Label>
                            <p className="text-sm text-muted-foreground">{t("inheritance.passThrough")}</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.grossEstate", { code: "BDT" })}</Label>
                            <Input type="number" step="0.01" value={deceased.grossEstate} onChange={(e) => updateDeceased(deceased.id, { grossEstate: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.funeral")}</Label>
                            <Input type="number" step="0.01" value={deceased.funeralExpenses} onChange={(e) => updateDeceased(deceased.id, { funeralExpenses: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.debts")}</Label>
                            <Input type="number" step="0.01" value={deceased.debts} onChange={(e) => updateDeceased(deceased.id, { debts: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.wasiyyah")}</Label>
                            <Input type="number" step="0.01" value={deceased.wasiyyah} onChange={(e) => updateDeceased(deceased.id, { wasiyyah: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t("inheritance.otherObligations")}</Label>
                            <Input type="number" step="0.01" value={deceased.otherObligations} onChange={(e) => updateDeceased(deceased.id, { otherObligations: Number(e.target.value) })} />
                          </div>
                          <label className="flex items-center gap-2 text-sm sm:col-span-2">
                            <Checkbox checked={deceased.heirConsentToWasiyyah} onCheckedChange={(v) => updateDeceased(deceased.id, { heirConsentToWasiyyah: Boolean(v) })} />
                            {t("inheritance.consent")}
                          </label>
                          {index > 0 ? (
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label>{t("inheritance.inheritedShare")}</Label>
                              <Select value={deceased.inheritsFromType ?? ""} onValueChange={(v) => updateDeceased(deceased.id, { inheritsFromType: (v || undefined) as HeirType | undefined })}>
                                <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(deceasedList[index - 1]?.counts ?? {})
                                    .filter(([, count]) => (count ?? 0) > 0)
                                    .map(([type]) => (
                                      <SelectItem key={type} value={type}>{heirLabel(type as HeirType, locale)}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : null}
                        </CardContent>
                        <CardContent className="border-t pt-4">
                          <HeirPicker
                            deceasedGender={deceased.deceasedGender}
                            counts={deceased.counts}
                            onAdjust={(type, delta) => adjustDeceased(deceased.id, type, delta, deceased.deceasedGender)}
                            preview={buildPreview(deceased.counts, deceased.deceasedGender, deceased)}
                            t={t}
                            locale={locale}
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
                <Button type="button" variant="outline" onClick={addDeceased} className="w-full">
                  <UserPlus className="size-4" /> {t("inheritance.addDeceased")}
                </Button>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={pending} className="bg-emerald-700 hover:bg-emerald-800">
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
                    {pending ? t("inheritance.calculating") : t("inheritance.calculate")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t("inheritance.heirsSelected", { count: totalHeirsSelected })}
                  </span>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {unsupported ? (
          <Alert className="border-amber-300 bg-amber-50">
            <CircleAlert className="size-4" />
            <AlertTitle>{t("inheritance.unsupportedTitle")}</AlertTitle>
            <AlertDescription className="text-xs">
              {t("inheritance.unsupportedGuidance", { reason: unsupported })}
            </AlertDescription>
          </Alert>
        ) : null}
        {!unsupported && mode === "SINGLE" && !result ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("inheritance.placeholder")}
            </CardContent>
          </Card>
        ) : null}
        {!unsupported && mode === "SINGLE" && result ? (
          <InheritanceResultView
            result={result}
            onSave={() => void saveToHistory()}
            onDownload={() => void downloadPdf()}
            saving={saving}
            downloading={downloading}
          />
        ) : null}
        {!unsupported && mode === "MUNASAKHA" && !munasakhaResult ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("inheritance.placeholder")}
            </CardContent>
          </Card>
        ) : null}
        {!unsupported && mode === "MUNASAKHA" && munasakhaResult ? (
          <div className="space-y-4">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("inheritance.munasakhaTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{t("inheritance.netDistributable")}</Badge>
                  <Badge variant="outline">{formatAmount(munasakhaResult.totalNetEstate, munasakhaResult.currency, locale)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t("inheritance.passThrough")}: {formatAmount(munasakhaResult.totalPassedThrough, munasakhaResult.currency, locale)}</p>
                <p className="text-xs text-muted-foreground">{t("inheritance.totalDistributed")}: {formatAmount(munasakhaResult.totalDistributed, munasakhaResult.currency, locale)}</p>
              </CardContent>
            </Card>
            {munasakhaResult.steps.length > 0 ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">{t("inheritance.munasakhaChain")}</CardTitle></CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {munasakhaResult.steps[munasakhaResult.steps.length - 1]!.result}
                </CardContent>
              </Card>
            ) : null}
            {munasakhaResult.cases.map((singleCase, caseIndex) => (
              <div key={singleCase.id} className="space-y-3">
                <h3 className="text-sm font-semibold text-emerald-900">
                  {t("inheritance.deceasedCase", { index: caseIndex + 1 })}
                  {singleCase.name ? ` — ${singleCase.name}` : ""}
                </h3>
                {singleCase.inheritedAmount > 0 && singleCase.inheritedFrom ? (
                  <p className="text-xs text-muted-foreground">
                    {t("inheritance.inheritedShare")}: {formatAmount(singleCase.inheritedAmount, munasakhaResult.currency, locale)}
                    {" · "}
                    {t("inheritance.inheritedAs", { name: heirLabel(singleCase.inheritedFrom.heirType, locale) })}
                  </p>
                ) : null}
                <InheritanceResultView result={singleCase.result} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">{t("inheritance.munasakhaSaveNote")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HeirPicker({
  deceasedGender,
  counts,
  onAdjust,
  preview,
  t,
  locale,
}: {
  deceasedGender: "MALE" | "FEMALE";
  counts: Partial<Record<HeirType, number>>;
  onAdjust: (type: HeirType, delta: number) => void;
  preview: InheritanceCalculationResult | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: "en" | "ar" | "bn";
}) {
  return (
    <div className="space-y-5">
      {HEIR_GROUPS.map((group) => (
        <div key={group.titleKey}>
          <h3 className="mb-2 text-sm font-semibold text-emerald-900">{t(group.titleKey)}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.options.map((option) => (
              <HeirRow
                key={option.type}
                type={option.type}
                label={heirLabel(option.type, locale)}
                locale={locale}
                count={counts[option.type] ?? 0}
                supported={option.supported}
                deceasedGender={deceasedGender}
                counts={counts}
                onAdjust={onAdjust}
                preview={preview}
                t={t}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HeirRow({
  type,
  label,
  locale,
  count,
  supported,
  deceasedGender,
  counts,
  onAdjust,
  preview,
  t,
}: {
  type: HeirType;
  label: string;
  locale: "en" | "ar" | "bn";
  count: number;
  supported: boolean;
  deceasedGender: "MALE" | "FEMALE";
  counts: Partial<Record<HeirType, number>>;
  onAdjust: (type: HeirType, delta: number) => void;
  preview: InheritanceCalculationResult | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const applicable =
    (type === "HUSBAND" && deceasedGender === "FEMALE") ||
    (type === "WIFE" && deceasedGender === "MALE") ||
    (type !== "HUSBAND" && type !== "WIFE");
  if (!applicable) {
    return null;
  }

  const affectedTypes = (IMPACTED_BY[type] ?? []).filter(
    (candidate) => candidate !== type && (counts[candidate] ?? 0) > 0,
  );
  const affectedNames = affectedTypes.length > 0
    ? affectedTypes.map((candidate) => heirLabel(candidate, locale)).join(", ")
    : t("common.none");

  const previewOutcome = preview?.outcomes.find((outcome) => outcome.type === type) ?? null;
  const fractionOf = (fraction?: { numerator: string; denominator: string }) =>
    fraction ? `${fraction.numerator}/${fraction.denominator}` : null;
  const groupShare = fractionOf(previewOutcome?.fraction);
  const individualShare = fractionOf(previewOutcome?.perIndividualFraction);
  const previewNote = previewOutcome
    ? previewOutcome.status === "EXCLUDED"
      ? t("inheritance.excludedPreview")
      : previewOutcome.status === "ELIGIBLE" && !groupShare
        ? t("inheritance.previewUnavailable")
        : null
    : t("inheritance.previewUnavailable");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center justify-between gap-2 rounded-lg border p-2.5", count > 0 ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200")}>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {label}
              {count > 0 && groupShare ? (
                <Badge variant="secondary" className="ms-1 font-mono text-[10px]">{groupShare}</Badge>
              ) : null}
            </p>
            {count > 0 && previewOutcome?.status === "EXCLUDED" ? (
              <span className="text-[10px] text-amber-700">{t("inheritance.excludedPreview")}</span>
            ) : null}
            {!supported ? <span className="text-[10px] text-amber-700">{t("inheritance.requiresVerification")}</span> : null}
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => onAdjust(type, -1)} aria-label={t("inheritance.decrease", { name: label })}>
              <Minus className="size-3" />
            </Button>
            <span className="w-7 text-center text-sm font-semibold">{count}</span>
            <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => onAdjust(type, 1)} aria-label={t("inheritance.increase", { name: label })}>
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64">
        <div className="space-y-1">
          <p className="text-xs font-semibold">{t("inheritance.nasab", { name: label })}</p>
          {groupShare ? (
            <p className="font-mono text-xs">{t("inheritance.shareGroup", { value: groupShare })}</p>
          ) : null}
          {individualShare ? (
            <p className="font-mono text-xs">{t("inheritance.shareEach", { value: individualShare })}</p>
          ) : null}
          {count > 0 && previewNote ? (
            <p className="text-xs text-amber-700">{previewNote}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">{t("inheritance.nasabImpact", { name: label, names: affectedNames })}</p>
        </div>
      </TooltipContent>
    </Tooltip>
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
  onSave?: () => void;
  onDownload?: () => void;
  saving?: boolean;
  downloading?: boolean;
}) {
  const { t, locale } = useLocale();
  const eligible = result.outcomes.filter((o) => o.status === "ELIGIBLE");
  const excluded = result.outcomes.filter((o) => o.status === "EXCLUDED");

  const shareLabel = (shareType?: string) =>
    shareType === "FIXED"
      ? t("inheritance.fixedShare")
      : shareType === "RESIDUARY"
        ? t("inheritance.residuary")
        : t("common.none");
  const exclusionLabel = (kind: string) =>
    kind === "COMPLETE"
      ? t("inheritance.complete")
      : kind === "PARTIAL"
        ? t("inheritance.partial")
        : t("common.none");
  const adjustmentLabel = (value: string) =>
    value === "AWL"
      ? t("inheritance.awl")
      : value === "RADD"
        ? t("inheritance.radd")
        : value === "DISTANT_KINDRED"
          ? t("inheritance.distantKindred")
          : t("common.none");
  const fractionLabel = (o: { fraction?: { numerator: string; denominator: string }; perIndividualFraction?: { numerator: string; denominator: string } }) =>
    o.perIndividualFraction
      ? `${o.perIndividualFraction.numerator}/${o.perIndividualFraction.denominator}`
      : o.fraction
        ? `${o.fraction.numerator}/${o.fraction.denominator}`
        : "—";
  const amountLabel = (o: { amount?: number; perIndividualAmount?: number }) =>
    o.perIndividualAmount !== undefined
      ? formatAmount(o.perIndividualAmount, result.currency, locale)
      : o.amount !== undefined
        ? formatAmount(o.amount, result.currency, locale)
        : "—";

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("inheritance.netDistributable")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-emerald-900">{formatAmount(result.netDistributable, result.currency, locale)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{t("inheritance.basisLabel", { value: result.methodologyBasis === "SUNNI_MAJORITY" ? t("common.sunniMajority") : t("common.hanafi") })}</Badge>
            <Badge variant="outline">{t("inheritance.adjustment", { value: adjustmentLabel(result.adjustment) })}</Badge>
            <Badge variant="outline">{t("inheritance.baseDenominator", { value: String(result.baseDenominator) })}</Badge>
          </div>
        </CardContent>
      </Card>

      {result.sources.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("inheritance.sourcesTitle")}</CardTitle>
            <CardDescription>{t("inheritance.sourcesDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {result.sources.map((source) => (
              <ReferenceTooltip key={source.id} reference={source}>
                <Badge variant="outline" className="cursor-help">{source.label}</Badge>
              </ReferenceTooltip>
            ))}
          </CardContent>
        </Card>
      ) : null}

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
                  <TableCell className="font-mono text-xs">{fractionLabel(o)}</TableCell>
                  <TableCell className="text-xs">{amountLabel(o)}</TableCell>
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

      {(onSave || onDownload) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {onSave && (
            <Button variant="outline" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? t("inheritance.saving") : t("inheritance.saveHistory")}
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" onClick={onDownload} disabled={downloading}>
              {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {downloading ? t("inheritance.preparing") : t("inheritance.downloadPdf")}
            </Button>
          )}
        </div>
      )}
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
