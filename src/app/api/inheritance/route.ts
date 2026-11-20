import { NextResponse } from "next/server";
import { inheritanceRequestSchema, munasakhaRequestSchema } from "@/modules/inheritance/schemas";
import { calculateInheritance, calculateMunasakha } from "@/modules/inheritance/engine";
import { getProvider } from "@/modules/fiqh/madhhabs";
import { INHERITANCE_METHODOLOGY_VERSION } from "@/modules/inheritance/rules";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const isMunasakha = Boolean(body) && Array.isArray((body as { deceased?: unknown }).deceased);

    if (isMunasakha) {
      const parsed = munasakhaRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", issues: parsed.error.flatten() },
          { status: 400 },
        );
      }
      const data = parsed.data;
      const provider = getProvider(data.madhhab);
      if (!provider) {
        return NextResponse.json(
          { error: "The selected madhhab is not enabled in this version." },
          { status: 403 },
        );
      }
      if (data.methodologyVersion !== INHERITANCE_METHODOLOGY_VERSION) {
        return NextResponse.json({ error: "Unknown methodology version." }, { status: 400 });
      }
      const result = calculateMunasakha(data);
      return NextResponse.json(result, { status: 200 });
    }

    const parsed = inheritanceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const provider = getProvider(data.madhhab);
    if (!provider) {
      return NextResponse.json(
        { error: "The selected madhhab is not enabled in this version." },
        { status: 403 },
      );
    }
    if (data.methodologyVersion !== INHERITANCE_METHODOLOGY_VERSION) {
      return NextResponse.json({ error: "Unknown methodology version." }, { status: 400 });
    }
    const result = calculateInheritance(data);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unable to process the calculation." }, { status: 500 });
  }
}
