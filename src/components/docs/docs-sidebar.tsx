"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { DOCS } from "@/lib/docs-config";
import { cn } from "@/lib/utils";

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation" className="space-y-1">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-400/80">
        Documentation
      </p>
      {DOCS.map((doc) => {
        const href = `/docs/${doc.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={doc.slug}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-emerald-50 font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                : "text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-900 dark:text-slate-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-100",
            )}
          >
            <FileText className="mt-0.5 size-4 shrink-0 opacity-70" />
            <span>
              <span className="block leading-snug">{doc.title}</span>
              <span className="mt-0.5 block text-xs font-normal leading-snug text-muted-foreground">
                {doc.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
