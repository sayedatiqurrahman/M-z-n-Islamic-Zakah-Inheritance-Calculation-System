"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/layout/locale-provider";
import { getTopicTranslation } from "@/modules/fiqh/topic-translations";

export interface TopicSummary {
  slug: string;
  category: string;
  titleEn: string;
  titleAr: string;
  titleBn: string;
  definition: string | null;
}

export function TopicCard({ topic, basePath }: { topic: TopicSummary; basePath: string }) {
  const { l, t } = useLocale();
  const title = l({ en: topic.titleEn, ar: topic.titleAr, bn: topic.titleBn });
  const localizedDefinition = getTopicTranslation(topic.slug, "definition");
  const definition = localizedDefinition
    ? l(localizedDefinition)
    : topic.definition
      ? l({ en: topic.definition, ar: topic.definition, bn: topic.definition })
      : null;

  return (
    <Link href={`${basePath}/${topic.slug}`} className="group">
      <Card className="h-full border-emerald-100 transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-300 group-hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" className="bg-emerald-50 text-[10px] text-emerald-800">
              {t(`guide.badge.${topic.category.toLowerCase()}`)}
            </Badge>
            <ArrowRight className="size-4 text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
          </div>
          <CardTitle className="pt-2 text-base leading-snug">{title}</CardTitle>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-emerald-700">
            <span className="font-arabic" dir="rtl" lang="ar">{topic.titleAr}</span>
            <span lang="bn">{topic.titleBn}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {definition ?? t("guide.openTopic")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
