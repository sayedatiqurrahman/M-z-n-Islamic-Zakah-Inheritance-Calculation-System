"use client";

import Link from "next/link";
import { ArrowRight, Coins, Scale, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { NisabCalculator } from "@/components/nisab/nisab-calculator";
import { useLocale } from "@/components/layout/locale-provider";

const EXPLAINER_KEYS = ["what", "why", "gold", "silver", "differ", "which"] as const;

const DISCLOSURE_KEYS = [
  "goldWeight",
  "silverWeight",
  "goldPrice",
  "silverPrice",
  "goldValue",
  "silverValue",
  "methodology",
  "explanation",
  "source",
  "date",
] as const;

export function NisabPageView() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("nisab.title")}
        subtitle={t("nisab.subtitle")}
        description={t("nisab.description")}
        actions={
          <Link href="/guide/zakah/zakah-nisab" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline">
            {t("nisab.readTopic")} <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        }
      />

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>{t("nisab.notice")}</p>
      </div>

      <NisabCalculator />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EXPLAINER_KEYS.map((key) => (
          <Card key={key} className="border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t(`nisab.explainer.${key}.title`)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {t(`nisab.explainer.${key}.body`)}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="size-4 text-emerald-700" /> {t("nisab.disclosures.title")}
          </CardTitle>
          <CardDescription>{t("nisab.disclosures.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {DISCLOSURE_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2 rounded-lg border border-dashed p-2">
              <Coins className="size-3.5 text-emerald-600" />
              {t(`nisab.disclosure.${key}`)}
            </div>
          ))}
        </CardContent>
      </Card>

      <AcademicDisclaimer />
    </div>
  );
}
