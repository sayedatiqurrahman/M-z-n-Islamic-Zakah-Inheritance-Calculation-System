import { notFound } from "next/navigation";
import { TopicDetailView } from "@/components/fiqh/topic-detail";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CATEGORY_KEYS = ["zakah", "inheritance", "principles"] as const;

export default async function TopicPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  if (!CATEGORY_KEYS.includes(category as (typeof CATEGORY_KEYS)[number])) notFound();

  let topic: Awaited<ReturnType<typeof prisma.fiqhTopic.findUnique>> = null;
  try {
    topic = await prisma.fiqhTopic.findUnique({ where: { slug } });
  } catch {
    topic = null;
  }

  if (!topic || topic.category.toLowerCase() !== category) notFound();

  return (
    <TopicDetailView
      topic={{
        slug: topic.slug,
        category: topic.category,
        titleEn: topic.titleEn,
        titleAr: topic.titleAr,
        titleBn: topic.titleBn,
        body_en: topic.body_en,
        body_ar: topic.body_ar,
        body_bn: topic.body_bn,
        definition: topic.definition,
        hanafiRuling: topic.hanafiRuling,
        practicalExample: topic.practicalExample,
        relatedScenario: topic.relatedScenario,
      }}
    />
  );
}
