"use client";

import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useText } from "@/components/layout/locale-provider";

export function AcademicDisclaimer({ compact = false }: { compact?: boolean }) {
  const TEXT = useText("shared.disclaimer");
  return (
    <Alert className="border-amber-200 bg-amber-50/70 text-amber-950">
      <CircleAlert className="size-4" />
      <AlertTitle className="text-sm font-semibold">{TEXT.title}</AlertTitle>
      {!compact && <AlertDescription className="text-xs leading-relaxed">{TEXT.body}</AlertDescription>}
    </Alert>
  );
}
