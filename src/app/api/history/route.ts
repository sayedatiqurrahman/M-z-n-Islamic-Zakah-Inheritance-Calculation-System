import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAnonymousId } from "@/lib/anonymous-session";
import { getSessionUserId } from "@/lib/auth";
import {
  deleteHistoryItem,
  getHistoryDetail,
  listHistory,
  saveInheritanceCalculation,
  saveZakahCalculation,
  type HistoryType,
} from "@/modules/history/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const saveSchema = z.object({
  type: z.enum(["zakah", "inheritance"]),
  input: z.unknown(),
});

export async function GET(request: Request) {
  try {
    const anonymousId = await getOrCreateAnonymousId();
    const userId = await getSessionUserId();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type");

    if (id && (type === "zakah" || type === "inheritance")) {
      const detail = await getHistoryDetail(anonymousId, type, id, userId);
      if (!detail) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json(detail);
    }

    const items = await listHistory(anonymousId, userId);
    return NextResponse.json({ items });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[history:get]", error);
    return NextResponse.json({ error: "Unable to load history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    const anonymousId = await getOrCreateAnonymousId();
    const userId = await getSessionUserId();
    const summary =
      parsed.data.type === "zakah"
        ? await saveZakahCalculation(anonymousId, parsed.data.input, userId)
        : await saveInheritanceCalculation(anonymousId, parsed.data.input, userId);
    return NextResponse.json(summary, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "The calculation input failed validation.", issues: error.flatten() },
        { status: 400 },
      );
    }
    if (process.env.NODE_ENV !== "production") console.error("[history:post]", error);
    return NextResponse.json({ error: "Unable to save the calculation." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type") as HistoryType | null;
    if (!id || (type !== "zakah" && type !== "inheritance")) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const anonymousId = await getOrCreateAnonymousId();
    const userId = await getSessionUserId();
    const removed = await deleteHistoryItem(anonymousId, type, id, userId);
    if (!removed) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete the calculation." }, { status: 500 });
  }
}
