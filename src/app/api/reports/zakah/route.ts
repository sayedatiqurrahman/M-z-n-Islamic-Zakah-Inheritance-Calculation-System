import { NextResponse } from "next/server";
import { z } from "zod";
import { zakahRequestSchema } from "@/modules/zakah/schemas";
import { calculateZakah } from "@/modules/zakah/engine";
import { buildPdfReport } from "@/lib/pdf/report";
import { formatAmount, formatDateTime } from "@/lib/formatting";

export const runtime = "nodejs";

const bodySchema = z.object({ input: z.unknown() });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const input = zakahRequestSchema.parse(parsed.data.input);
    const result = calculateZakah(input);
    if (!result.supported) {
      return NextResponse.json({ error: result.reason, supported: false }, { status: 422 });
    }

    const pdf = await buildPdfReport({
      title: "Zakah Calculation Report",
      subtitle: "Hanafi methodology — academic calculation",
      meta: [
        { label: "Calculation date", value: formatDateTime(new Date()) },
        { label: "Assessment date", value: input.hawl.assessmentDate },
        { label: "Madhhab", value: "Hanafi" },
        { label: "Methodology version", value: result.methodologyVersion },
        { label: "Currency", value: result.currency },
        { label: "Nisab method", value: result.nisabMethod },
        { label: "Price source", value: `${input.nisab.priceSource}${input.nisab.isManual ? " (manual)" : ""}` },
        { label: "Price recorded at", value: input.nisab.recordedAt },
      ],
      sections: [
        {
          heading: "Result summary",
          rows: [
            { label: "Total zakahable assets", value: formatAmount(result.totalAssets, result.currency) },
            {
              label: "Deductible liabilities",
              value: formatAmount(result.totalDeductibleLiabilities, result.currency),
            },
            { label: "Net zakahable wealth", value: formatAmount(result.netZakahableWealth, result.currency) },
            { label: "Nisab value", value: formatAmount(result.nisabValue, result.currency) },
            { label: "Nisab reached", value: result.nisabReached ? "Yes" : "No" },
            { label: "Hawl completed", value: result.hawlCompleted ? "Yes" : "No" },
            { label: "Rate", value: "2.5%" },
            { label: "Zakah payable", value: formatAmount(result.zakahPayable, result.currency) },
          ],
        },
        {
          heading: "Asset classification",
          rows: result.classifiedAssets.map((asset) => ({
            label: asset.label,
            value: `${formatAmount(asset.valueInBase, result.currency)} — ${asset.included ? "included" : "excluded"} (${asset.ruleId ?? "no rule id"})`,
          })),
        },
        {
          heading: "Liability treatment",
          rows:
            result.classifiedLiabilities.length > 0
              ? result.classifiedLiabilities.map((liability) => ({
                  label: liability.label,
                  value: `${formatAmount(liability.valueInBase, result.currency)} — ${liability.deductible ? "deductible" : "not deductible"} (${liability.ruleId ?? "no rule id"})`,
                }))
              : [{ label: "Liabilities", value: "None entered" }],
        },
        {
          heading: "Methodology notes",
          paragraphs:
            result.notes.length > 0
              ? result.notes
              : ["This report follows the versioned Hanafi rules encoded in the application."],
        },
      ],
      steps: result.steps.map((step) => ({
        step: step.step,
        title: step.title,
        calculation: step.calculation,
        result: step.result,
        principle: step.fiqhPrinciple,
        reason: step.reason,
      })),
      disclaimer:
        "This is an academic thesis project. Calculations follow the declared Hanafi methodology and are not a fatwa. Evidence items carry explicit verification statuses; consult a qualified scholar for legal attestation.",
    });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="mizan-zakah-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[report:zakah]", error);
    return NextResponse.json({ error: "Unable to generate the report." }, { status: 500 });
  }
}
