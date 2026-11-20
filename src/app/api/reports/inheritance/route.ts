import { NextResponse } from "next/server";
import { z } from "zod";
import { inheritanceRequestSchema } from "@/modules/inheritance/schemas";
import { calculateInheritance } from "@/modules/inheritance/engine";
import { buildPdfReport } from "@/lib/pdf/report";
import { formatAmount, formatDate } from "@/lib/formatting";
import { heirLabel } from "@/components/inheritance/heir-catalog";
import { translate, type Locale } from "@/lib/i18n";

export const runtime = "nodejs";

const bodySchema = z.object({
  input: z.unknown(),
  locale: z.enum(["en", "ar", "bn"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const locale: Locale = parsed.data.locale ?? "en";
    const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);

    const input = inheritanceRequestSchema.parse(parsed.data.input);
    if (input.madhhab !== "SUNNI_MAJORITY") {
      return NextResponse.json(
        { error: "This version uses the Sunni-majority inheritance basis." },
        { status: 403 },
      );
    }
    const result = calculateInheritance(input);

    if (!result.supported) {
      return NextResponse.json({ error: result.reason, supported: false }, { status: 422 });
    }

    const eligible = result.outcomes.filter((o) => o.status === "ELIGIBLE");
    const excluded = result.outcomes.filter((o) => o.status === "EXCLUDED");

    const adjustmentLabel =
      result.adjustment === "AWL"
        ? t("inheritance.awl")
        : result.adjustment === "RADD"
          ? t("inheritance.radd")
          : result.adjustment === "DISTANT_KINDRED"
            ? t("inheritance.distantKindred")
            : t("common.none");

    const shareText = (o: (typeof eligible)[number]) => {
      const frac = o.perIndividualFraction ?? o.fraction;
      const fraction = frac ? `${frac.numerator}/${frac.denominator}` : t("report.none");
      const amt =
        o.perIndividualAmount !== undefined
          ? `${formatAmount(o.perIndividualAmount, result.currency, locale)} (${t("report.perIndividual")})`
          : formatAmount(o.amount ?? 0, result.currency, locale);
      const groupNote =
        o.count > 1 && o.amount !== undefined && o.perIndividualAmount !== undefined
          ? ` — ${t("report.group")}: ${formatAmount(o.amount, result.currency, locale)}`
          : "";
      return `${fraction} — ${amt}${groupNote}`;
    };

    const pdf = await buildPdfReport({
      title: t("report.inheritance.title"),
      subtitle: t("report.inheritance.subtitle"),
      locale,
      meta: [
        { label: t("report.deceased"), value: input.deceasedName || t("report.none") },
        { label: t("report.dateOfDeath"), value: formatDate(input.dateOfDeath, locale) },
        { label: t("report.currency"), value: input.currency },
        { label: t("report.grossEstate"), value: formatAmount(result.grossEstate, result.currency, locale) },
        { label: t("report.madhhab"), value: t("common.sunniMajority") },
        { label: t("report.basis"), value: result.methodologyBasis },
        { label: t("report.adjustment"), value: adjustmentLabel },
        { label: t("report.baseDenominator"), value: String(result.baseDenominator) },
      ],
      chart: {
        title: t("report.section.chart"),
        currency: result.currency,
        items: eligible
          .filter((o) => (o.amount ?? 0) > 0)
          .map((o) => ({
            label: heirLabel(o.type, locale),
            value: o.amount ?? 0,
          })),
      },
      sections: [
        {
          heading: t("report.section.settlement"),
          rows: [
            { label: t("report.grossEstate"), value: formatAmount(result.grossEstate, result.currency, locale) },
            { label: t("report.funeralExpenses"), value: formatAmount(result.funeralExpenses, result.currency, locale) },
            { label: t("report.debts"), value: formatAmount(result.debts, result.currency, locale) },
            { label: t("report.validBequests"), value: formatAmount(result.validBequests, result.currency, locale) },
            { label: t("report.netDistributable"), value: formatAmount(result.netDistributable, result.currency, locale) },
          ],
        },
        {
          heading: t("report.section.distribution"),
          rows: eligible.map((o) => ({
            label: `${heirLabel(o.type, locale)}${o.count > 1 ? ` ×${o.count}` : ""}`,
            value: shareText(o),
          })),
        },
        ...(excluded.length > 0
          ? [
              {
                heading: t("report.section.excluded"),
                rows: excluded.map((o) => ({
                  label: heirLabel(o.type, locale),
                  value: `${o.reason}${o.excludedBy ? ` ${t("report.excludedBy")}: ${heirLabel(o.excludedBy, locale)}.` : ""}`,
                })),
              },
            ]
          : []),
      ],
      steps: result.steps.map((step) => ({
        step: step.step,
        title: step.title,
        calculation: step.calculation,
        result: step.result,
        principle: step.fiqhPrinciple,
        reason: step.reason,
      })),
      disclaimer: t("report.disclaimer.inheritance"),
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="mizan-inheritance-${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate the report." },
      { status: 500 },
    );
  }
}
