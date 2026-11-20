import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateZakah } from "@/modules/zakah/engine";
import { zakahRequestSchema, type ZakahRequest } from "@/modules/zakah/schemas";
import { calculateInheritance } from "@/modules/inheritance/engine";
import { inheritanceRequestSchema, type InheritanceRequest } from "@/modules/inheritance/schemas";
import { UNSUPPORTED_MESSAGE } from "@/modules/fiqh/types";

export type HistoryType = "zakah" | "inheritance";

export interface HistorySummary {
  id: string;
  type: HistoryType;
  title: string;
  createdAt: string;
  currency: string;
  summary: string;
  supported: boolean;
}

export interface HistoryDetail extends HistorySummary {
  input: unknown;
  steps: {
    step: number;
    title: string;
    calculation: string;
    result: string;
    fiqhPrinciple: string;
    reason: string;
  }[];
}

/**
 * Engine rule IDs are human-readable (e.g. ZAK-NISAB-001). Only link a step to
 * the registry when that natural key actually exists, otherwise the foreign
 * key would reject the whole saved calculation.
 */
async function resolveRuleIds(candidates: (string | null | undefined)[]): Promise<Set<string>> {
  const ids = [...new Set(candidates.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Set();
  const rows = await prisma.fiqhRule.findMany({
    where: { ruleId: { in: ids } },
    select: { ruleId: true },
  });
  return new Set(rows.map((row) => row.ruleId));
}

async function resolveMethodology(version: string) {
  const madhhab = await prisma.madhhab.findUnique({ where: { key: "HANAFI" } });
  if (!madhhab) throw new Error("Hanafi madhhab is not seeded.");
  // The engine version (e.g. hanafi-zakah-v1.0.0) is stored in the input
  // snapshot; the rule registry is attached to the active methodology record.
  const methodology =
    (await prisma.methodologyVersion.findFirst({ where: { madhhabId: madhhab.id, version } })) ??
    (await prisma.methodologyVersion.findFirst({ where: { madhhabId: madhhab.id, isActive: true } }));
  if (!methodology) throw new Error("Methodology version is not seeded.");
  return { madhhab, methodology };
}

function serializeSteps(
  steps: {
    step: number;
    title: string;
    calculation: string;
    result: string;
    fiqhPrinciple: string | null;
    reason: string | null;
  }[],
) {
  return steps.map((s) => ({
    step: s.step,
    title: s.title,
    calculation: s.calculation,
    result: s.result,
    fiqhPrinciple: s.fiqhPrinciple ?? "",
    reason: s.reason ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export async function saveZakahCalculation(anonymousId: string, raw: unknown): Promise<HistorySummary> {
  const input = zakahRequestSchema.parse(raw) as ZakahRequest;
  const { madhhab, methodology } = await resolveMethodology(input.methodologyVersion);
  const result = calculateZakah(input);
  const ruleIds = await resolveRuleIds(result.steps.map((step) => step.ruleId));

  if (!result.supported) {
    const created = await prisma.zakahCalculation.create({
      data: {
        anonymousId,
        title: `Zakah · ${input.hawl.assessmentDate}`,
        madhhabId: madhhab.id,
        versionId: methodology.id,
        currency: input.currency,
        assessmentDate: new Date(input.hawl.assessmentDate),
        nisabFirstReachedDate: input.hawl.nisabFirstReachedDate
          ? new Date(input.hawl.nisabFirstReachedDate)
          : null,
        previousZakahDate: input.hawl.previousZakahDate ? new Date(input.hawl.previousZakahDate) : null,
        hijriAssessmentDate: input.hawl.hijriAssessmentDate ?? null,
        inputSnapshot: input as unknown as Prisma.InputJsonValue,
        unsupportedReason: result.reason,
        steps: {
          create: result.steps.map((step) => ({
            ownerType: "ZAKAH",
            step: step.step,
            title: step.title,
            calculation: step.calculation,
            result: step.result,
            fiqhPrinciple: step.fiqhPrinciple,
            reason: step.reason,
            evidence: step.evidence as unknown as Prisma.InputJsonValue,
            references: step.references as unknown as Prisma.InputJsonValue,
            notes: step.notes,
            ruleId: step.ruleId && ruleIds.has(step.ruleId) ? step.ruleId : null,
          })),
        },
      },
    });
    return {
      id: created.id,
      type: "zakah",
      title: created.title ?? "Zakah calculation",
      createdAt: created.createdAt.toISOString(),
      currency: created.currency,
      summary: UNSUPPORTED_MESSAGE,
      supported: false,
    };
  }

  const assetById = new Map(input.assets.map((a) => [a.id, a]));
  const liabilityById = new Map(input.liabilities.map((l) => [l.id, l]));

  const created = await prisma.zakahCalculation.create({
    data: {
      anonymousId,
      title: `Zakah · ${input.hawl.assessmentDate}`,
      madhhabId: madhhab.id,
      versionId: methodology.id,
      currency: input.currency,
      assessmentDate: new Date(input.hawl.assessmentDate),
      nisabFirstReachedDate: input.hawl.nisabFirstReachedDate
        ? new Date(input.hawl.nisabFirstReachedDate)
        : null,
      previousZakahDate: input.hawl.previousZakahDate ? new Date(input.hawl.previousZakahDate) : null,
      hijriAssessmentDate: input.hawl.hijriAssessmentDate ?? null,
      inputSnapshot: input as unknown as Prisma.InputJsonValue,
      assets: {
        create: result.classifiedAssets.map((asset) => {
          const source = assetById.get(asset.id);
          return {
            category: asset.category,
            label: asset.label,
            amount: source?.amount ?? 0,
            weightGrams: source?.weightGrams ?? null,
            purity: source?.purity ?? null,
            marketValue: asset.valueInBase,
            currency: source?.currency ?? input.currency,
            convertedValue: asset.valueInBase,
            ruleId: asset.ruleId ?? null,
            included: asset.included,
            reason: asset.reason,
          };
        }),
      },
      liabilities: {
        create: result.classifiedLiabilities.map((liability) => {
          const source = liabilityById.get(liability.id);
          return {
            type: liability.type,
            label: liability.label,
            amount: source?.amount ?? 0,
            currency: source?.currency ?? input.currency,
            convertedValue: liability.valueInBase,
            deductible: liability.deductible,
            ruleId: liability.ruleId ?? null,
            reason: liability.reason,
          };
        }),
      },
      result: {
        create: {
          totalAssets: result.totalAssets,
          totalDeductible: result.totalDeductibleLiabilities,
          netWealth: result.netZakahableWealth,
          nisabValue: result.nisabValue,
          nisabReached: result.nisabReached,
          hawlStatus: result.hawlCompleted ? "COMPLETED" : "IN_PROGRESS",
          rate: result.rate,
          zakahPayable: result.zakahPayable,
          currency: result.currency,
        },
      },
      steps: {
        create: result.steps.map((step) => ({
          ownerType: "ZAKAH",
          step: step.step,
          title: step.title,
          calculation: step.calculation,
          result: step.result,
          fiqhPrinciple: step.fiqhPrinciple,
          reason: step.reason,
          evidence: step.evidence as unknown as Prisma.InputJsonValue,
          references: step.references as unknown as Prisma.InputJsonValue,
          notes: step.notes,
          ruleId: step.ruleId && ruleIds.has(step.ruleId) ? step.ruleId : null,
        })),
      },
    },
    include: { result: true },
  });

  return {
    id: created.id,
    type: "zakah",
    title: created.title ?? "Zakah calculation",
    createdAt: created.createdAt.toISOString(),
    currency: created.currency,
    summary: created.result
      ? `Zakah payable ${created.result.zakahPayable.toString()} ${created.currency}`
      : "Calculation saved",
    supported: true,
  };
}

export async function saveInheritanceCalculation(
  anonymousId: string,
  raw: unknown,
): Promise<HistorySummary> {
  const input = inheritanceRequestSchema.parse(raw) as InheritanceRequest;
  const { madhhab, methodology } = await resolveMethodology(input.methodologyVersion);
  const result = calculateInheritance(input);
  const ruleIds = await resolveRuleIds(result.steps.map((step) => step.ruleId));

  if (!result.supported) {
    const created = await prisma.inheritanceCase.create({
      data: {
        anonymousId,
        title: input.deceasedName ? `Inheritance · ${input.deceasedName}` : "Inheritance case",
        madhhabId: madhhab.id,
        versionId: methodology.id,
        currency: input.currency,
        inputSnapshot: input as unknown as Prisma.InputJsonValue,
        unsupportedReason: result.reason,
        deceased: {
          create: {
            name: input.deceasedName ?? null,
            gender: input.deceasedGender,
            dateOfDeath: new Date(input.dateOfDeath),
            cashAndBank: input.grossEstate,
            funeralExpenses: input.funeralExpenses,
            debts: input.debts,
            wasiyyah: input.wasiyyah,
            otherObligations: input.otherObligations,
            heirConsentToWasiyyah: input.heirConsentToWasiyyah,
            currency: input.currency,
          },
        },
        heirs: {
          create: input.heirs.map((heir) => ({ type: heir.type, count: heir.count })),
        },
        steps: {
          create: result.steps.map((step) => ({
            ownerType: "INHERITANCE",
            step: step.step,
            title: step.title,
            calculation: step.calculation,
            result: step.result,
            fiqhPrinciple: step.fiqhPrinciple,
            reason: step.reason,
            evidence: step.evidence as unknown as Prisma.InputJsonValue,
            references: step.references as unknown as Prisma.InputJsonValue,
            notes: step.notes,
            ruleId: step.ruleId && ruleIds.has(step.ruleId) ? step.ruleId : null,
          })),
        },
      },
    });
    return {
      id: created.id,
      type: "inheritance",
      title: created.title ?? "Inheritance case",
      createdAt: created.createdAt.toISOString(),
      currency: created.currency,
      summary: UNSUPPORTED_MESSAGE,
      supported: false,
    };
  }

  const eligible = result.outcomes.filter((o) => o.status === "ELIGIBLE");
  const excluded = result.outcomes.filter((o) => o.status === "EXCLUDED");

  const created = await prisma.inheritanceCase.create({
    data: {
      anonymousId,
      title: input.deceasedName ? `Inheritance · ${input.deceasedName}` : "Inheritance case",
      madhhabId: madhhab.id,
      versionId: methodology.id,
      currency: input.currency,
      inputSnapshot: input as unknown as Prisma.InputJsonValue,
      deceased: {
        create: {
          name: input.deceasedName ?? null,
          gender: input.deceasedGender,
          dateOfDeath: new Date(input.dateOfDeath),
          cashAndBank: input.grossEstate,
          funeralExpenses: input.funeralExpenses,
          debts: input.debts,
          wasiyyah: input.wasiyyah,
          otherObligations: input.otherObligations,
          heirConsentToWasiyyah: input.heirConsentToWasiyyah,
          currency: input.currency,
        },
      },
      heirs: {
        create: result.outcomes.map((outcome) => ({
          type: outcome.type,
          count: outcome.count,
          status: outcome.status,
          exclusionKind: outcome.exclusionKind,
          reason: outcome.reason,
          principle: outcome.principle,
          ruleId: outcome.referenceIds[0] ?? null,
        })),
      },
      steps: {
        create: result.steps.map((step) => ({
          ownerType: "INHERITANCE",
          step: step.step,
          title: step.title,
          calculation: step.calculation,
          result: step.result,
          fiqhPrinciple: step.fiqhPrinciple,
          reason: step.reason,
          evidence: step.evidence as unknown as Prisma.InputJsonValue,
          references: step.references as unknown as Prisma.InputJsonValue,
          notes: step.notes,
          ruleId: step.ruleId && ruleIds.has(step.ruleId) ? step.ruleId : null,
        })),
      },
    },
    include: { heirs: true },
  });

  const heirByType = new Map(created.heirs.map((heir) => [heir.type, heir.id]));

  const inheritanceResult = await prisma.inheritanceResult.create({
    data: {
      caseId: created.id,
      grossEstate: result.grossEstate,
      funeralExpenses: result.funeralExpenses,
      debts: result.debts,
      validBequests: result.validBequests,
      netDistributable: result.netDistributable,
      adjustment: result.adjustment,
      baseNumerator: 1,
      baseDenominator: result.baseDenominator,
      currency: result.currency,
    },
  });

  await prisma.inheritanceShare.createMany({
    data: eligible
      .filter((outcome) => outcome.fraction)
      .map((outcome) => {
        const heirId = heirByType.get(outcome.type);
        if (!heirId) throw new Error("Saved heir is missing.");
        const numerator = Number(outcome.fraction!.numerator);
        const denominator = Number(outcome.fraction!.denominator);
        return {
          resultId: inheritanceResult.id,
          heirId,
          shareType: outcome.shareType ?? "FIXED",
          numerator,
          denominator,
          adjustedNumerator: numerator,
          adjustedDenominator: denominator,
          amount: outcome.amount ?? 0,
          currency: result.currency,
          reasonRuleId: outcome.referenceIds[0] ?? null,
          explanation: outcome.explanation,
        };
      }),
  });

  return {
    id: created.id,
    type: "inheritance",
    title: created.title ?? "Inheritance case",
    createdAt: created.createdAt.toISOString(),
    currency: created.currency,
    summary: `${eligible.length} eligible heir(s), ${excluded.length} excluded`,
    supported: true,
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listHistory(anonymousId: string): Promise<HistorySummary[]> {
  const [zakah, inheritance] = await Promise.all([
    prisma.zakahCalculation.findMany({
      where: { anonymousId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { result: true },
    }),
    prisma.inheritanceCase.findMany({
      where: { anonymousId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { result: true, heirs: true },
    }),
  ]);

  const items: HistorySummary[] = [
    ...zakah.map((item) => ({
      id: item.id,
      type: "zakah" as const,
      title: item.title ?? "Zakah calculation",
      createdAt: item.createdAt.toISOString(),
      currency: item.currency,
      summary: item.result
        ? `Zakah payable ${item.result.zakahPayable.toString()} ${item.currency}`
        : "Calculation saved",
      supported: true,
    })),
    ...inheritance.map((item) => ({
      id: item.id,
      type: "inheritance" as const,
      title: item.title ?? "Inheritance case",
      createdAt: item.createdAt.toISOString(),
      currency: item.currency,
      summary: item.unsupportedReason
        ? UNSUPPORTED_MESSAGE
        : item.result
          ? `Net distributable ${item.result.netDistributable.toString()} ${item.currency} · ${item.heirs.length} heir categor(ies)`
          : "Case saved",
      supported: !item.unsupportedReason,
    })),
  ];

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getHistoryDetail(
  anonymousId: string,
  type: HistoryType,
  id: string,
): Promise<HistoryDetail | null> {
  if (type === "zakah") {
    const item = await prisma.zakahCalculation.findFirst({
      where: { id, anonymousId },
      include: { steps: { orderBy: { step: "asc" } } },
    });
    if (!item) return null;
    return {
      id: item.id,
      type: "zakah",
      title: item.title ?? "Zakah calculation",
      createdAt: item.createdAt.toISOString(),
      currency: item.currency,
      summary: "Saved Zakah calculation",
      supported: true,
      input: item.inputSnapshot,
      steps: serializeSteps(item.steps),
    };
  }

  const item = await prisma.inheritanceCase.findFirst({
    where: { id, anonymousId },
    include: { steps: { orderBy: { step: "asc" } } },
  });
  if (!item) return null;
  return {
    id: item.id,
    type: "inheritance",
    title: item.title ?? "Inheritance case",
    createdAt: item.createdAt.toISOString(),
    currency: item.currency,
    summary: item.unsupportedReason ? UNSUPPORTED_MESSAGE : "Saved inheritance case",
    supported: !item.unsupportedReason,
    input: item.inputSnapshot,
    steps: serializeSteps(item.steps),
  };
}

export async function deleteHistoryItem(
  anonymousId: string,
  type: HistoryType,
  id: string,
): Promise<boolean> {
  if (type === "zakah") {
    const result = await prisma.zakahCalculation.deleteMany({ where: { id, anonymousId } });
    return result.count > 0;
  }
  const result = await prisma.inheritanceCase.deleteMany({ where: { id, anonymousId } });
  return result.count > 0;
}

export async function historyCounts(anonymousId: string | null) {
  if (!anonymousId) return { zakah: 0, inheritance: 0 };
  const [zakah, inheritance] = await Promise.all([
    prisma.zakahCalculation.count({ where: { anonymousId } }),
    prisma.inheritanceCase.count({ where: { anonymousId } }),
  ]);
  return { zakah, inheritance };
}
