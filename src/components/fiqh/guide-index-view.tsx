"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, BookOpenText, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { useLocale } from "@/components/layout/locale-provider";

const SECTIONS = [
  { href: "/guide/zakah", icon: BookOpenText, key: "zakah", arabic: "تعلّم الزكاة" },
  { href: "/guide/inheritance", icon: BookOpenCheck, key: "inheritance", arabic: "تعلّم المواريث" },
  { href: "/guide/principles", icon: Landmark, key: "principles", arabic: "المبادئ الفقهية" },
] as const;

export function GuideIndexView() {
  const { t, locale } = useLocale();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={t("guide.title")}
        subtitle={t("guide.subtitle")}
        description={t("guide.description")}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full border-emerald-100 transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-300 group-hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon className="size-5" />
                    </span>
                    <ArrowRight className="size-4 text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
                  </div>
                  <CardTitle className="pt-2 text-base">{t(`guide.section.${section.key}.title`)}</CardTitle>
                  {locale === "ar" && (
                    <p className="font-arabic text-xs text-emerald-700" dir="rtl" lang="ar">{section.arabic}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`guide.section.${section.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base">{t("guide.howTo.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t("guide.howTo.p1")}</p>
          <p>{t("guide.howTo.p2")}</p>
        </CardContent>
      </Card>

      <AcademicDisclaimer />
    </div>
  );
}
