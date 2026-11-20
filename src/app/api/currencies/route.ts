import { NextResponse } from "next/server";
import { getCurrencies } from "@/modules/currencies/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/currencies
 *
 * Returns every ISO 4217 currency that has a live reference rate, with names
 * fetched online. BDT is placed first because it is the application default.
 */
export async function GET() {
  try {
    const data = await getCurrencies();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[currencies:get]", error);
    return NextResponse.json(
      { error: "The currency list is currently unavailable." },
      { status: 502 },
    );
  }
}
