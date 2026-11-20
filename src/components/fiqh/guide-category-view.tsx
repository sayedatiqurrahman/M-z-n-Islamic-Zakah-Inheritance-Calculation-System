"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { TopicCard } from "@/components/fiqh/topic-card";
import { useLocale } from "@/components/layout/locale-provider";

export type GuideCategoryKey = "zakah" | "inheritance" | "principles";

export interface GuideTopicSummary {
  slug: string;
  category: string;
  titleEn: string;
  titleAr: string;
  titleBn: string;
  definition: string | null;
}

const SUBTITLES: Record<GuideCategoryKey, string> = {
  zakah: "guide.category.zakah.subtitle",
  inheritance: "guide.category.inheritance.subtitle",
  principles: "guide.category.principles.subtitle",
};

export function GuideCategoryView({
  category,
  topics,
  failed,
}: {
  category: GuideCategoryKey;
  topics: GuideTopicSummary[];
  failed: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/guide" className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("guide.backToCenter")}
      </Link>
      <PageHeader
        title={t(`guide.category.${category}.title`)}
        subtitle={t(SUBTITLES[category])}
        description={t(`guide.category.${category}.description`)}
      />

      {topics.length === 0 ? (
        <EmptyState
          icon={BookOpenText}
          title={failed ? t("guide.unableTopics") : t("guide.noTopics")}
          description={
            failed ? t("guide.unableTopicsDescription") : t("guide.noTopicsDescription")
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard key={topic.slug} topic={topic} basePath={`/guide/${category}`} />
          ))}
        </div>
      )}

      <AcademicDisclaimer />
    </div>
  );
}
