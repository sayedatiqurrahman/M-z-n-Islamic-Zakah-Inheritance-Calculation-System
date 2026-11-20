"use client";

import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useText } from "@/components/layout/locale-provider";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  const TEXT = useText("shared.empty");
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Icon className="size-6" />
        </span>
        <div className="space-y-1">
          <p className="font-medium text-emerald-950">{title ?? TEXT.title}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{description ?? TEXT.description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
