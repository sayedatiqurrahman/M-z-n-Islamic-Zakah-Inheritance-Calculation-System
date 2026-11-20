"use client";

import { useLocale } from "@/components/layout/locale-provider";
import Link from "next/link";
import { ArrowRight, CircleAlert, GitBranch, ShieldCheck, Sigma } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { UNSUPPORTED_MESSAGE } from "@/modules/fiqh/types";

const VERIFICATION = [
  "VERIFIED_BY_SCHOLAR",
  "REFERENCE_REQUIRED",
  "NEEDS_REVIEW",
  "UNVERIFIED",
] as const;

const PIPELINE = ["stage1", "stage2", "stage3", "stage4", "stage5"] as const;

export default function MethodologyPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t("methodology.title")} description={t("methodology.description")} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <ShieldCheck className="size-5 text-emerald-700" />
            <CardTitle className="pt-2 text-base">{t("methodology.card.versioned.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("methodology.card.versioned.body")}
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <Sigma className="size-5 text-emerald-700" />
            <CardTitle className="pt-2 text-base">{t("methodology.card.fractions.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("methodology.card.fractions.body")}
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <GitBranch className="size-5 text-emerald-700" />
            <CardTitle className="pt-2 text-base">{t("methodology.card.scope.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("methodology.card.scope.body")}
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base">{t("methodology.verification.title")}</CardTitle>
          <CardDescription>{t("methodology.verification.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {VERIFICATION.map((status) => (
            <div key={status} className="flex flex-col gap-1 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:gap-4">
              <Badge variant={status === "VERIFIED_BY_SCHOLAR" ? "default" : "secondary"} className="w-fit font-mono text-[10px]">
                {status}
              </Badge>
              <p className="text-sm text-muted-foreground">{t(`methodology.verification.${status}`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base">{t("methodology.pipeline.title")}</CardTitle>
          <CardDescription>{t("methodology.pipeline.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {PIPELINE.map((stage) => (
            <div key={stage} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-sm font-semibold text-emerald-900">{t(`methodology.pipeline.${stage}.title`)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`methodology.pipeline.${stage}.body`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-amber-950">
            <CircleAlert className="size-4" /> {t("methodology.unsupported.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-950">
          <p>{t("methodology.unsupported.body")}</p>
          <blockquote className="rounded-lg border-s-4 border-amber-400 bg-white/70 p-3 text-xs italic">
            {UNSUPPORTED_MESSAGE}
          </blockquote>
          <p className="text-xs text-amber-900">{t("methodology.unsupported.limitations")}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AcademicDisclaimer compact />
        <Link href="/references" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline">
          {t("methodology.referencesLink")} <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
