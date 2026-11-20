"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { InheritanceCalculator } from "@/components/inheritance/inheritance-calculator";
import { useLocale } from "@/components/layout/locale-provider";

export function InheritancePageView() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={t("inheritance.title")}
        subtitle={t("inheritance.subtitle")}
        description={t("inheritance.description")}
        actions={
          <Link
            href="/guide/inheritance"
            className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-emerald-700 hover:underline"
          >
            <BookOpenCheck className="size-4" /> {t("inheritance.guideLink")}{" "}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        }
      />

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>{t("inheritance.notice")}</p>
      </div>

      <InheritanceCalculator />

      <AcademicDisclaimer />
    </div>
  );
}
