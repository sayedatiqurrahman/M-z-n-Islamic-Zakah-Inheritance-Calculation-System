"use client";

import { ExternalLink, BadgeCheck, CircleAlert } from "lucide-react";
import type { EvidenceReference } from "@/modules/fiqh/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useLocale, useText } from "@/components/layout/locale-provider";

export function ReferenceTooltip({ reference, children }: { reference: EvidenceReference; children: React.ReactNode }) {
  const { t } = useLocale();
  const TEXT = useText("shared.refTooltip");
  const statusKey = `status.${reference.verificationStatus}`;
  const status = t(statusKey);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm text-left" dir="ltr">
          <div className="space-y-2 p-1">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{reference.label}</span>
              {reference.type && <Badge variant="outline">{reference.type}</Badge>}
            </div>
            {reference.excerpt && (
              <p className="text-xs leading-relaxed" dir="rtl" lang="ar">
                {reference.excerpt}
              </p>
            )}
            {reference.translation && <p className="text-xs leading-relaxed">{reference.translation}</p>}
            {reference.author && <p className="text-xs text-muted-foreground">{TEXT.author}: {reference.author}</p>}
            {reference.authenticity && (
              <p className="text-xs text-muted-foreground">{TEXT.authenticity}: {reference.authenticity}</p>
            )}
            <div className="flex items-center gap-1 text-xs">
              {reference.verificationStatus === "VERIFIED_BY_SCHOLAR" ? (
                <BadgeCheck className="size-3 text-emerald-600" />
              ) : (
                <CircleAlert className="size-3 text-amber-600" />
              )}
              <span>{status === statusKey ? reference.verificationStatus : status}</span>
            </div>
            {reference.note && <p className="text-xs italic text-muted-foreground">{reference.note}</p>}
            {reference.sourceUrl && (
              <a
                href={reference.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 underline"
              >
                {TEXT.source} <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
