"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BookOpenText,
  Calculator,
  Coins,
  History,
  Info,
  Landmark,
  Library,
  Scale,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { useLocale } from "@/components/layout/locale-provider";
import { formatDateTime } from "@/lib/formatting";
import type { HistorySummary } from "@/modules/history/service";

const MODULES = [
  { href: "/zakah", icon: Calculator, key: "zakah" },
  { href: "/inheritance", icon: Scale, key: "inheritance" },
  { href: "/guide/zakah", icon: BookOpenText, key: "zakahGuide" },
  { href: "/guide/inheritance", icon: BookOpenCheck, key: "inheritanceGuide" },
  { href: "/zakah/nisab", icon: Coins, key: "nisab" },
  { href: "/guide/principles", icon: Landmark, key: "principles" },
  { href: "/references", icon: Library, key: "references" },
  { href: "/about", icon: Info, key: "about" },
] as const;

export function DashboardView({
  counts,
  recent,
  guideCount,
  failed,
}: {
  counts: { zakah: number; inheritance: number };
  recent: HistorySummary[];
  guideCount: number;
  failed: boolean;
}) {
  const { t } = useLocale();
  const recentItems = recent.slice(0, 5);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr] lg:gap-6">
      <PageHeader
        className="order-1 mb-0 lg:col-span-2"
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        description={t("dashboard.description")}
        actions={
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
            {t("common.methodologyBadge")}
          </Badge>
        }
      />

      {/* Quick start is the first block on mobile and moves beside recent
          calculations on desktop, with app-sized touch targets. */}
      <Card className="order-2 self-start border-emerald-100 lg:order-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("dashboard.quick.title")}</CardTitle>
          <CardDescription>{t("dashboard.quick.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Link
            href="/zakah"
            className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-card p-3 text-sm font-medium transition-colors hover:bg-emerald-50 active:scale-[0.99] dark:hover:bg-emerald-500/10"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <Calculator className="size-5" />
              </span>
              {t("dashboard.quick.zakah")}
            </span>
            <ArrowRight className="size-4 shrink-0 text-emerald-600 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
          <Link
            href="/inheritance"
            className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-card p-3 text-sm font-medium transition-colors hover:bg-emerald-50 active:scale-[0.99] dark:hover:bg-emerald-500/10"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <Scale className="size-5" />
              </span>
              {t("dashboard.quick.inheritance")}
            </span>
            <ArrowRight className="size-4 shrink-0 text-emerald-600 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
          <Link
            href="/guide"
            className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-card p-3 text-sm font-medium transition-colors hover:bg-emerald-50 active:scale-[0.99] dark:hover:bg-emerald-500/10"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <BookOpenText className="size-5" />
              </span>
              {t("dashboard.quick.guide")}
            </span>
            <ArrowRight className="size-4 shrink-0 text-emerald-600 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </CardContent>
      </Card>

      <div className="order-3 grid grid-cols-2 gap-3 sm:gap-4 lg:order-2 lg:col-span-2 xl:grid-cols-4">
        <StatCard title={t("dashboard.stat.zakah")} value={counts.zakah} icon={Calculator} description={t("dashboard.stat.saved")} href="/history" />
        <StatCard title={t("dashboard.stat.inheritance")} value={counts.inheritance} icon={Scale} description={t("dashboard.stat.saved")} href="/history" />
        <StatCard title={t("dashboard.stat.recent")} value={recent.length} icon={History} description={t("dashboard.stat.mostRecent")} href="/history" />
        <StatCard title={t("dashboard.stat.guides")} value={guideCount} icon={BookOpenText} description={t("dashboard.stat.published")} href="/guide" />
      </div>

      {failed && (
        <div className="order-5 lg:col-span-2">
          <EmptyState title={t("dashboard.db.title")} description={t("dashboard.db.description")} />
        </div>
      )}

      <Card className="order-4 border-emerald-100 lg:order-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{t("dashboard.recent.title")}</CardTitle>
            <CardDescription>{t("dashboard.recent.description")}</CardDescription>
          </div>
          <Link href="/history" className="text-sm font-medium text-emerald-700 hover:underline">
            {t("common.viewAll")}
          </Link>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <EmptyState
              title={t("dashboard.recent.noneTitle")}
              description={t("dashboard.recent.noneDescription")}
              icon={History}
              action={
                <div className="flex gap-2">
                  <Link href="/zakah" className="text-sm font-medium text-emerald-700 hover:underline">
                    {t("history.zakah")}
                  </Link>
                  <Link href="/inheritance" className="text-sm font-medium text-emerald-700 hover:underline">
                    {t("history.inheritance")}
                  </Link>
                </div>
              }
            />
          ) : (
            <ul className="divide-y">
              {recentItems.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-emerald-50 text-[10px] text-emerald-800">
                        {item.type === "zakah" ? t("history.zakah") : t("history.inheritance")}
                      </Badge>
                      <p className="truncate text-sm font-medium">{item.title}</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.summary}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section className="order-6 space-y-3 lg:col-span-2">
        <h2 className="font-heading text-lg font-bold text-emerald-950">{t("dashboard.allModules")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="group">
                <Card className="h-full border-emerald-100 transition-all group-hover:border-emerald-300 group-hover:shadow-md">
                  <CardHeader className="pb-2">
                    <Icon className="size-5 text-emerald-700" />
                    <CardTitle className="pt-2 text-sm">{t(`dashboard.module.${module.key}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs leading-relaxed text-muted-foreground">
                    {t(`dashboard.module.${module.key}.description`)}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="order-7 lg:col-span-2">
        <AcademicDisclaimer />
      </div>
    </div>
  );
}
