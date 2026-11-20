import { NextResponse } from "next/server";
import { zakahRequestSchema } from "@/modules/zakah/schemas";
import { calculateZakah } from "@/modules/zakah/engine";
import { getProvider } from "@/modules/fiqh/madhhabs";
import { ZAKAH_METHODOLOGY_VERSION } from "@/modules/zakah/rules";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = zakahRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const provider = getProvider(parsed.data.madhhab);
    if (!provider) {
      return NextResponse.json(
        { error: "The selected madhhab is not enabled in this version." },
        { status: 403 },
      );
    }
    if (parsed.data.methodologyVersion !== ZAKAH_METHODOLOGY_VERSION) {
      return NextResponse.json(
        { error: "Unknown methodology version." },
        { status: 400 },
      );
    }
    const result = calculateZakah(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[zakah:calculate]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: "Unable to process the calculation.",
        ...(isDev ? { details: message } : {}),
      },
      { status: 500 },
    );
  }
}
