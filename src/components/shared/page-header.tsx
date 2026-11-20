"use client";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  description,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-emerald-950 md:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-emerald-700">{subtitle}</p>}
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
