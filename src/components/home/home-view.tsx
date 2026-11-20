"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BookOpenText,
  Calculator,
  Coins,
  GitCompareArrows,
  Landmark,
  Library,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { useLocale } from "@/components/layout/locale-provider";

const MODULES = [
  { href: "/zakah", icon: Calculator, key: "zakah", arabic: "نظام حساب الزكاة" },
  { href: "/inheritance", icon: Scale, key: "inheritance", arabic: "نظام حساب المواريث" },
  { href: "/zakah/nisab", icon: Coins, key: "nisab", arabic: "النصاب" },
  { href: "/guide/zakah", icon: BookOpenText, key: "zakahGuide", arabic: "دليل الزكاة" },
  { href: "/guide/inheritance", icon: BookOpenCheck, key: "inheritanceGuide", arabic: "دليل المواريث" },
  { href: "/guide/principles", icon: Landmark, key: "principles", arabic: "المبادئ الفقهية" },
] as const;

const PRINCIPLES = [
  { icon: ShieldCheck, key: "noFabrication" },
  { icon: GitCompareArrows, key: "exactArithmetic" },
  { icon: Sparkles, key: "explained" },
] as const;

const EXPLAINED_STEPS = ["step1", "step2", "step3", "step4", "step5"] as const;

export default function HomeView() {
  const { t, locale } = useLocale();
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="islamic-pattern overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-white p-6 dark:border-emerald-500/20 dark:from-card dark:via-emerald-500/10 dark:to-card md:p-10">
        <div className="max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">{t("common.hanafiVersion")}</Badge>
            <Badge variant="outline" className="border-emerald-200 bg-white/70 text-emerald-800">
              {t("home.badge.academic")}
            </Badge>
            <span className="text-sm font-medium text-emerald-800">
              {t("app.tagline")}
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-emerald-950 md:text-5xl">
            {t("home.hero.titleLine1")}
            <br />
            {t("home.hero.titleLine2")}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            {t("home.hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
              <Link href="/zakah">
                <Calculator className="size-4" /> {t("home.cta.zakah")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald-200 text-emerald-800">
              <Link href="/inheritance">
                <Scale className="size-4" /> {t("home.cta.inheritance")}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-emerald-800">
              <Link href="/guide/zakah">
                {t("home.cta.guide")} <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((principle) => {
          const Icon = principle.icon;
          return (
            <Card key={principle.key} className="border-emerald-100">
              <CardHeader className="pb-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="pt-2 text-base">{t(`home.principle.${principle.key}.title`)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {t(`home.principle.${principle.key}.body`)}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-bold text-emerald-950 md:text-2xl">
              {t("home.modules.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.modules.subtitle")}
            </p>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
            {t("home.modules.openDashboard")}
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="group">
                <Card className="h-full border-emerald-100 transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-300 group-hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Icon className="size-5" />
                      </span>
                      <ArrowRight className="size-4 text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
                    </div>
                    <CardTitle className="pt-2 text-base">{t(`home.module.${module.key}.title`)}</CardTitle>
                    {locale === "ar" && (
                      <p className="font-arabic text-xs text-emerald-700" dir="rtl" lang="ar">
                        {module.arabic}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {t(`home.module.${module.key}.description`)}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="text-base">{t("home.explained.title")}</CardTitle>
            <CardDescription>
              {t("home.explained.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {EXPLAINED_STEPS.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{t(`home.explained.${step}`)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="border-emerald-100 bg-emerald-950 text-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Library className="size-4" /> {t("home.references.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-emerald-100/90">
              <p>{t("home.references.body")}</p>
              <Link href="/references" className="inline-flex items-center gap-1 font-medium text-white hover:underline">
                {t("home.references.link")} <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </CardContent>
          </Card>
          <AcademicDisclaimer compact />
        </div>
      </section>
    </div>
  );
}
