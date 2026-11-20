"use client";

import Link from "next/link";
import { BookOpenText, CircleAlert, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { PageHeader } from "@/components/shared/page-header";
import { useLocale } from "@/components/layout/locale-provider";
import { getTopicTranslation } from "@/modules/fiqh/topic-translations";

export interface TopicDetail {
  slug: string;
  category: string;
  titleEn: string;
  titleAr: string;
  titleBn: string;
  body_en: string;
  body_ar: string | null;
  body_bn: string | null;
  definition: string | null;
  hanafiRuling: string | null;
  practicalExample: string | null;
  relatedScenario: string | null;
}

const CATEGORY_META: Record<
  string,
  { badgeKey: string; calculatorHref: string; calculatorKey: string }
> = {
  ZAKAH: {
    badgeKey: "guide.badge.zakah",
    calculatorHref: "/zakah",
    calculatorKey: "home.cta.zakah",
  },
  INHERITANCE: {
    badgeKey: "guide.badge.inheritance",
    calculatorHref: "/inheritance",
    calculatorKey: "home.cta.inheritance",
  },
  PRINCIPLES: {
    badgeKey: "guide.badge.principles",
    calculatorHref: "/methodology",
    calculatorKey: "topic.readMethodology",
  },
};

export function TopicDetailView({ topic }: { topic: TopicDetail }) {
  const { l, t, locale } = useLocale();
  const meta = CATEGORY_META[topic.category] ?? CATEGORY_META.ZAKAH;

  const title = l({ en: topic.titleEn, ar: topic.titleAr, bn: topic.titleBn });
  const localizedDefinition = getTopicTranslation(topic.slug, "definition");
  const definition = localizedDefinition
    ? l(localizedDefinition)
    : topic.definition
      ? l({ en: topic.definition, ar: topic.definition, bn: topic.definition })
      : undefined;
  const body = getTopicTranslation(topic.slug, "body");
  const bodyText = body
    ? l({ en: body.en, ar: body.ar, bn: body.bn })
    : topic.body_en
      ? l({ en: topic.body_en, ar: topic.body_en, bn: topic.body_en })
      : undefined;
  const ruling = getTopicTranslation(topic.slug, "ruling");
  const rulingText = ruling
    ? l({ en: ruling.en, ar: ruling.ar, bn: ruling.bn })
    : topic.hanafiRuling
      ? l({ en: topic.hanafiRuling, ar: topic.hanafiRuling, bn: topic.hanafiRuling })
      : undefined;
  const example = getTopicTranslation(topic.slug, "example");
  const exampleText = example
    ? l({ en: example.en, ar: example.ar, bn: example.bn })
    : topic.practicalExample
      ? l({ en: topic.practicalExample, ar: topic.practicalExample, bn: topic.practicalExample })
      : undefined;
  const scenario = getTopicTranslation(topic.slug, "scenario");
  const scenarioText = scenario
    ? l({ en: scenario.en, ar: scenario.ar, bn: scenario.bn })
    : topic.relatedScenario
      ? l({ en: topic.relatedScenario, ar: topic.relatedScenario, bn: topic.relatedScenario })
      : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={title}
        description={definition}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={meta.calculatorHref}>{t(meta.calculatorKey)}</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">{t(meta.badgeKey)}</Badge>
        <Badge variant="outline" className="border-amber-300 text-amber-800">
          <CircleAlert className="size-3" /> {t("common.verificationRequired")}
        </Badge>
      </div>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpenText className="size-4 text-emerald-700" /> {t("topic.explanation")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-slate-700">
          {bodyText && <p>{bodyText}</p>}
          {locale === "ar" && topic.body_ar && (
            <div className="rounded-lg bg-emerald-50/50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">{t("topic.arabic")}</p>
              <p className="font-arabic text-base leading-loose" dir="rtl" lang="ar">{topic.body_ar}</p>
            </div>
          )}
          {locale === "bn" && topic.body_bn && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{t("topic.bangla")}</p>
              <p className="font-bengali text-sm leading-relaxed" lang="bn">{topic.body_bn}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {rulingText && (
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("topic.ruling")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-slate-700">
            {rulingText}
          </CardContent>
        </Card>
      )}

      {(exampleText || scenarioText) && (
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("topic.application")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {exampleText && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{t("topic.example")}</p>
                <p className="mt-1 text-slate-700">{exampleText}</p>
              </div>
            )}
            {scenarioText && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{t("topic.scenario")}</p>
                  <p className="mt-1 text-slate-700">{scenarioText}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-amber-200 bg-amber-50/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-950">{t("topic.academicNotice")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs leading-relaxed text-amber-900">
          <p>{t("topic.academicNoticeBody")}</p>
          <a href="https://www.quranpedia.net/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline">
            {t("topic.consult")} <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>

      <AcademicDisclaimer />
    </div>
  );
}
