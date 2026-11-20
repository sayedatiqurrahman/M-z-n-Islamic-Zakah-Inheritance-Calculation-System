import { NextResponse } from "next/server";
import { z } from "zod";
import { inheritanceRequestSchema } from "@/modules/inheritance/schemas";
import { calculateInheritance } from "@/modules/inheritance/engine";
import { buildPdfReport } from "@/lib/pdf/report";
import { formatAmount, formatDateTime } from "@/lib/formatting";
import { HEIR_LABELS } from "@/components/inheritance/heir-catalog";

export const runtime = "nodejs";

const bodySchema = z.object({ input: z.unknown() });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const input = inheritanceRequestSchema.parse(parsed.data.input);
    const result = calculateInheritance(input);

    if (!result.supported) {
      return NextResponse.json({ error: result.reason, supported: false }, { status: 422 });
    }

    const eligible = result.outcomes.filter((outcome) => outcome.status === "ELIGIBLE");
    const excluded = result.outcomes.filter((outcome) => outcome.status === "EXCLUDED");

    const pdf = await buildPdfReport({
      title: "Inheritance Distribution Report",
      subtitle: "Hanafi Fara'id — academic calculation",
      meta: [
        { label: "Calculation date", value: formatDateTime(new Date()) },
        { label: "Deceased", value: input.deceasedName || "Not named" },
        { label: "Gender", value: input.deceasedGender === "MALE" ? "Male" : "Female" },
        { label: "Date of death", value: input.dateOfDeath },
        { label: "Madhhab", value: "Hanafi" },
        { label: "Methodology version", value: result.methodologyVersion },
        { label: "Currency", value: result.currency },
      ],
      sections: [
        {
          heading: "Estate settlement",
          rows: [
            { label: "Gross estate", value: formatAmount(result.grossEstate, result.currency) },
            { label: "Funeral expenses", value: formatAmount(result.funeralExpenses, result.currency) },
            { label: "Debts", value: formatAmount(result.debts, result.currency) },
            { label: "Valid bequests", value: formatAmount(result.validBequests, result.currency) },
            { label: "Net distributable", value: formatAmount(result.netDistributable, result.currency) },
            { label: "Adjustment", value: result.adjustment },
            { label: "Base denominator", value: String(result.baseDenominator) },
          ],
        },
        {
          heading: "Distribution table",
          rows: eligible.map((outcome) => ({
            label: `${HEIR_LABELS[outcome.type] ?? outcome.type}${outcome.count > 1 ? ` ×${outcome.count}` : ""} (${outcome.shareType})`,
            value: `${outcome.fraction ? `${outcome.fraction.numerator}/${outcome.fraction.denominator}` : "—"} · ${outcome.amount !== undefined ? formatAmount(outcome.amount, result.currency) : "—"}`,
          })),
        },
        {
          heading: "Exclusion analysis",
          rows:
            excluded.length > 0
              ? excluded.map((outcome) => ({
                  label: `${HEIR_LABELS[outcome.type] ?? outcome.type} (${outcome.exclusionKind})`,
                  value: `${outcome.reason} Excluded by: ${outcome.excludedBy ? (HEIR_LABELS[outcome.excludedBy] ?? outcome.excludedBy) : "n/a"}.`,
                }))
              : [{ label: "Excluded heirs", value: "None" }],
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
        "This is an academic thesis project. Distribution follows the declared Hanafi methodology and is not a fatwa. Evidence items carry explicit verification statuses; consult a qualified scholar before executing a distribution.",
    });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="mizan-inheritance-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[report:inheritance]", error);
    return NextResponse.json({ error: "Unable to generate the report." }, { status: 500 });
  }
}
