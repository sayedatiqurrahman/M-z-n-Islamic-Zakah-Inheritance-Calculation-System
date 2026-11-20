import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [references, quran, hadith] = await Promise.all([
      prisma.reference.findMany({ orderBy: [{ type: "asc" }, { title: "asc" }] }),
      prisma.quranicEvidence.findMany({ orderBy: [{ surah: "asc" }, { ayahNumber: "asc" }] }),
      prisma.hadithEvidence.findMany({ orderBy: { collection: "asc" } }),
    ]);
    return NextResponse.json({ references, quran, hadith });
  } catch {
    return NextResponse.json({ error: "Unable to load references." }, { status: 500 });
  }
}
