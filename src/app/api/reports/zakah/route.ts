import { NextResponse } from "next/server";
import { z } from "zod";
import { zakahRequestSchema } from "@/modules/zakah/schemas";
import { calculateZakah } from "@/modules/zakah/engine";
import { buildPdfReport } from "@/lib/pdf/report";
import { formatAmount, formatDate } from "@/lib/formatting";
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

    const input = zakahRequestSchema.parse(parsed.data.input);
    const result = calculateZakah(input);
    if (!result.supported) {
      return NextResponse.json({ error: result.reason, supported: false }, { status: 422 });
    }

    const included = result.classifiedAssets.filter((a) => a.included);
    const methodLabel = result.nisabMethod === "GOLD" ? t("report.gold") : t("report.silver");

    const chartItems = included
      .filter((a) => a.valueInBase > 0)
      .map((a) => ({
        label: a.label || t(`zakah.asset.${a.category}`),
        value: a.valueInBase,
      }));

    const inKindRows = result.inKindDues.map((due) => ({
      label: due.label,
      value: `${t("report.quantity")}: ${due.quantity} ${due.unit} — ${t("report.due")}: ${due.dueDescription}${
        due.estimatedValue !== null ? ` — ${formatAmount(due.estimatedValue, result.currency, locale)}` : ""
      }`,
    }));

    const pdf = await buildPdfReport({
      title: t("report.zakah.title"),
      subtitle: t("report.zakah.subtitle"),
      locale,
      meta: [
        { label: t("report.calculationDate"), value: formatDate(new Date(), locale) },
        { label: t("report.currency"), value: result.currency },
        { label: t("report.nisabMethod"), value: methodLabel },
        { label: t("report.nisabValue"), value: formatAmount(result.nisabValue, result.currency, locale) },
        { label: t("report.assessmentDate"), value: formatDate(input.hawl.assessmentDate, locale) },
        { label: t("report.basis"), value: result.methodologyVersion },
      ],
      chart:
        chartItems.length > 0
          ? {
              title: t("report.section.assetChart"),
              currency: result.currency,
              items: chartItems,
            }
          : undefined,
      sections: [
        {
          heading: t("report.section.summary"),
          rows: [
            { label: t("report.totalAssets"), value: formatAmount(result.totalAssets, result.currency, locale) },
            { label: t("report.deductibleLiabilities"), value: formatAmount(result.totalDeductibleLiabilities, result.currency, locale) },
            { label: t("report.netZakahableWealth"), value: formatAmount(result.netZakahableWealth, result.currency, locale) },
            { label: t("report.zakahRate"), value: "2.5%" },
            { label: t("report.zakahPayable"), value: formatAmount(result.zakahPayable, result.currency, locale) },
            { label: t("report.inKindEstimated"), value: formatAmount(result.totalInKindValue, result.currency, locale) },
            { label: t("report.totalPayable"), value: formatAmount(result.totalPayable, result.currency, locale) },
          ],
        },
        {
          heading: t("report.section.assets"),
          rows: included.map((asset) => ({
            label: asset.label || t(`zakah.asset.${asset.category}`),
            value:
              asset.valuationMode === "IN_KIND"
                ? t("zakah.assetInKind")
                : formatAmount(asset.valueInBase, result.currency, locale),
          })),
        },
        ...(inKindRows.length > 0
          ? [{ heading: t("report.section.inKind"), rows: inKindRows }]
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
      disclaimer: t("report.disclaimer.zakah"),
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="mizan-zakah-${Date.now()}.pdf"`,
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
