import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getAnonymousId } from "@/lib/anonymous-session";
import { getSessionUserId } from "@/lib/auth";
import { historyCounts, listHistory, type HistorySummary } from "@/modules/history/service";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [anonymousId, userId] = await Promise.all([getAnonymousId(), getSessionUserId()]);

  let counts = { zakah: 0, inheritance: 0 };
  let recent: HistorySummary[] = [];
  let guideCount = 0;
  let failed = false;

  try {
    [counts, recent] = await Promise.all([
      historyCounts(anonymousId, userId),
      anonymousId || userId ? listHistory(anonymousId ?? "", userId) : Promise.resolve([]),
    ]);
    guideCount = await prisma.fiqhTopic.count({ where: { published: true } });
  } catch {
    failed = true;
  }

  return <DashboardView counts={counts} recent={recent} guideCount={guideCount} failed={failed} />;
}
