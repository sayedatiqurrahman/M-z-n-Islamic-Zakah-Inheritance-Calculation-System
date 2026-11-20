import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideCategoryView, type GuideCategoryKey } from "@/components/fiqh/guide-category-view";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CATEGORIES = {
  zakah: {
    category: "ZAKAH",
    title: "Zakah Learning Guide",
    description:
      "The definition, conditions, thresholds, asset treatments, liabilities and recipients of Zakah in the Hanafi methodology.",
  },
  inheritance: {
    category: "INHERITANCE",
    title: "Inheritance Learning Guide",
    description:
      "The science of Fara'id: fixed shares, residuary heirs, exclusion, Awl, Radd and worked distribution examples.",
  },
  principles: {
    category: "PRINCIPLES",
    title: "Fiqh Principles",
    description:
      "The evidence hierarchy, the four schools of law, and the methodological constraints used by this system.",
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

function isCategory(value: string): value is CategoryKey {
  return value in CATEGORIES;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return { title: "Learning Center" };
  return { title: CATEGORIES[category].title, description: CATEGORIES[category].description };
}

export default async function GuideCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const meta = CATEGORIES[category];

  let topics: Awaited<ReturnType<typeof prisma.fiqhTopic.findMany>> = [];
  let failed = false;
  try {
    topics = await prisma.fiqhTopic.findMany({
      where: { category: meta.category, published: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    failed = true;
  }

  return (
    <GuideCategoryView
      category={category as GuideCategoryKey}
      failed={failed}
      topics={topics.map((topic) => ({
        slug: topic.slug,
        category: topic.category,
        titleEn: topic.titleEn,
        titleAr: topic.titleAr,
        titleBn: topic.titleBn,
        definition: topic.definition,
      }))}
    />
  );
}
