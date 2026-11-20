"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This component synchronises state with an external system (localStorage hydration or a network fetch) on mount. The effect is one-shot initialisation, which is the documented React pattern for external stores. */

import { useEffect, useState } from "react";
import { Check, Loader2, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/components/layout/locale-provider";
import { CurrencyCombobox } from "@/components/currency/currency-combobox";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface Settings {
  locale: Locale;
  currency: string;
  nisabMethod: "GOLD" | "SILVER";
}

export function SettingsForm() {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<Settings>({ locale: "en", currency: "BDT", nisabMethod: "SILVER" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as Settings;
        if (!cancelled) {
          setSettings({ ...data, locale: (data.locale as Locale) ?? locale });
        }
      } catch {
        if (!cancelled) toast.error(t("settings.unableLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        toast.error(t("settings.unableSave"));
        return;
      }
      setLocale(settings.locale);
      window.localStorage.setItem("mizan-currency", settings.currency);
      window.localStorage.setItem("mizan-nisab-method", settings.nisabMethod);
      window.dispatchEvent(new CustomEvent("mizan:currency-changed", { detail: settings.currency }));
      toast.success(t("settings.saved"));
    } catch {
      toast.error(t("settings.unableSave"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="size-4 text-emerald-700" /> {t("settings.preferences")}
          </CardTitle>
          <CardDescription>{t("settings.preferencesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-theme">{t("settings.appearance")}</Label>
            {mounted ? (
              <Select value={theme ?? "system"} onValueChange={setTheme}>
                <SelectTrigger id="settings-theme"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                  <SelectItem value="system">{t("settings.system")}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("settings.language")}</Label>
            <Select
              value={settings.locale}
              onValueChange={(value) => setSettings((prev) => ({ ...prev, locale: value as Locale }))}
              disabled={loading}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCALES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>{item.native} — {item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-currency">{t("settings.defaultCurrency")}</Label>
            <CurrencyCombobox
              id="settings-currency"
              value={settings.currency}
              onChange={(value) => {
                setSettings((prev) => ({ ...prev, currency: value }));
                window.dispatchEvent(new CustomEvent("mizan:currency-changed", { detail: value }));
              }}
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("settings.defaultNisabMethod")}</Label>
            <Select
              value={settings.nisabMethod}
              onValueChange={(value) => setSettings((prev) => ({ ...prev, nisabMethod: value as "GOLD" | "SILVER" }))}
              disabled={loading}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SILVER">{t("settings.silverDefault")}</SelectItem>
                <SelectItem value="GOLD">{t("settings.goldBased")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => void save()} disabled={saving || loading} className="bg-emerald-700 hover:bg-emerald-800">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? t("settings.saving") : t("settings.save")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 bg-emerald-50/40">
        <CardHeader>
          <CardTitle className="text-base">{t("settings.whatStored")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            {t("settings.storedItem1")}
          </p>
          <p className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            {t("settings.storedItem2")}
          </p>
          <p className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            {t("settings.storedItem3")}
          </p>
          <p className="rounded-lg bg-white/70 p-2 text-xs">
            {t("settings.noTracking")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
