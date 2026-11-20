"use client";

import Link from "next/link";
import { History, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { HistoryList } from "@/components/history/history-list";
import { useLocale } from "@/components/layout/locale-provider";

export function HistoryPageView() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={t("history.title")}
        subtitle={t("history.subtitle")}
        description={t("history.description")}
      />

      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p>{t("history.notice")}</p>
      </div>

      <HistoryList />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline">
          <History className="size-4" /> {t("history.backToDashboard")}
        </Link>
        <AcademicDisclaimer compact />
      </div>
    </div>
  );
}
