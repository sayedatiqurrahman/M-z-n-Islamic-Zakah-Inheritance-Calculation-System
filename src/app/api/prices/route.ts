import { NextResponse } from "next/server";
import { isCurrencyCode } from "@/lib/formatting";
import { getMetalQuotes } from "@/modules/prices/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/prices?currency=BDT
 *
 * Retrieves live gold and silver prices from the backend at request time.
 * The default currency is BDT so the application can show prices as soon as a
 * user enters, without any hard-coded value.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const currency = (url.searchParams.get("currency") ?? "BDT").toUpperCase();

  if (!isCurrencyCode(currency)) {
    return NextResponse.json(
      { error: `Unsupported currency: ${currency}.` },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const data = await getMetalQuotes(currency);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[prices:get]", error);
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("No exchange rate is available")) {
      return NextResponse.json(
        { error: message, currency },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      {
        error:
          "Live metal prices are currently unavailable. Enter a price manually and record its source.",
        currency,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
