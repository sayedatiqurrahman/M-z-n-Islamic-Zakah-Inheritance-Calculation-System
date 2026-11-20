import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousId, getOrCreateAnonymousId } from "@/lib/anonymous-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  locale: z.enum(["en", "ar", "bn"]),
  currency: z.string().min(3).max(4),
  nisabMethod: z.enum(["GOLD", "SILVER"]),
});

const DEFAULTS = { locale: "en" as const, currency: "BDT", nisabMethod: "SILVER" as const };

export async function GET() {
  try {
    const anonymousId = await getAnonymousId();
    if (!anonymousId) return NextResponse.json(DEFAULTS);
    const preference = await prisma.anonymousPreference.findUnique({ where: { anonymousId } });
    if (!preference) return NextResponse.json(DEFAULTS);
    return NextResponse.json({
      locale: preference.locale,
      currency: preference.currency,
      nisabMethod: preference.nisabMethod,
    });
  } catch {
    return NextResponse.json({ error: "Unable to load settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
    }
    const anonymousId = await getOrCreateAnonymousId();
    const saved = await prisma.anonymousPreference.upsert({
      where: { anonymousId },
      update: parsed.data,
      create: { anonymousId, ...parsed.data },
    });
    return NextResponse.json({
      locale: saved.locale,
      currency: saved.currency,
      nisabMethod: saved.nisabMethod,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[settings:put]", error);
    return NextResponse.json({ error: "Unable to save settings." }, { status: 500 });
  }
}
