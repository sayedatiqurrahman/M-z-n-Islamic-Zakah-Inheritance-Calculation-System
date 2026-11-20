"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ReferenceTooltip } from "./reference-tooltip";
import { EVIDENCE } from "@/modules/fiqh/evidences/catalog";
import type { CalculationStepData } from "@/modules/fiqh/types";
import { useText } from "@/components/layout/locale-provider";

export function CalculationSteps({ steps }: { steps: CalculationStepData[] }) {
  const TEXT = useText("shared.steps");
  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">{TEXT.empty}</p>;
  }
  return (
    <Accordion type="single" collapsible className="w-full">
      {steps.map((step) => (
        <AccordionItem key={step.step} value={`step-${step.step}`}>
          <AccordionTrigger className="text-start hover:no-underline">
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
                {TEXT.step} {step.step}
              </Badge>
              <span className="font-medium text-emerald-950">{step.title}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2 text-sm">
            <div className="grid gap-2 rounded-lg bg-slate-50 p-3">
              <div><span className="font-semibold">{TEXT.calculation}: </span><code dir="ltr">{step.calculation}</code></div>
              <div><span className="font-semibold">{TEXT.result}: </span>{step.result}</div>
            </div>
            <div>
              <span className="font-semibold">{TEXT.principle}: </span>
              <span>{step.fiqhPrinciple}</span>
            </div>
            <div>
              <span className="font-semibold">{TEXT.reason}: </span>
              <span>{step.reason}</span>
            </div>
            {step.evidence.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{TEXT.evidence}:</span>
                {step.evidence.map((evidence) => {
                  const full = EVIDENCE[evidence.id] ?? evidence;
                  return (
                    <ReferenceTooltip key={full.id} reference={full}>
                      <Badge variant="outline" className="cursor-help">{full.label}</Badge>
                    </ReferenceTooltip>
                  );
                })}
              </div>
            )}
            {step.references.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{TEXT.rules}:</span>
                {step.references.map((ref) => (
                  <Badge key={ref} variant="outline" className="font-mono text-[10px]">{ref}</Badge>
                ))}
              </div>
            )}
            {step.notes.length > 0 && (
              <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                {step.notes.map((note, i) => <li key={i}>{note}</li>)}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
