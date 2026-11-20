"use client";

import Link from "next/link";
import { ArrowRight, Coins, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { ZakahCalculator } from "@/components/zakah/zakah-calculator";
import { useLocale } from "@/components/layout/locale-provider";

export function ZakahPageView() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={t("zakah.title")}
        subtitle={t("zakah.subtitle")}
        description={t("zakah.description")}
        actions={
          <>
            <Link
              href="/zakah/nisab"
              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              <Coins className="size-4" /> {t("zakah.nisabLink")}
            </Link>
            <Link
              href="/guide/zakah"
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-emerald-700 hover:underline"
            >
              {t("zakah.guideLink")} <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </>
        }
      />

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>{t("zakah.priceNotice")}</p>
      </div>

      <ZakahCalculator />

      <AcademicDisclaimer />
    </div>
  );
}
