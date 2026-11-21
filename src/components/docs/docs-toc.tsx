"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/docs-config";
import { cn } from "@/lib/utils";

export function DocsToc({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (headingElements.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }

        if (visible.size > 0) {
          // Pick the first heading in TOC order that is currently visible
          const firstVisible = headings.find((h) => visible.has(h.id));
          if (firstVisible) setActiveId(firstVisible.id);
          return;
        }

        // Fallback: pick the last heading above the viewport top
        const above = headings
          .map((h) => ({ id: h.id, top: document.getElementById(h.id)?.getBoundingClientRect().top ?? Infinity }))
          .filter((h) => h.top < 120);
        if (above.length > 0) setActiveId(above[above.length - 1]!.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] },
    );

    headingElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 font-semibold text-emerald-950 dark:text-emerald-50">On this page</p>
      <ul className="space-y-1 border-s border-emerald-100 dark:border-emerald-900/50">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id} style={{ paddingInlineStart: `${(h.depth - 2) * 10}px` }}>
              <a
                href={`#${h.id}`}
                onClick={() => setActiveId(h.id)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "-ms-px block border-s-2 py-0.5 ps-3 leading-snug transition-colors",
                  active
                    ? "border-emerald-600 font-medium text-emerald-800 dark:border-emerald-400 dark:text-emerald-300"
                    : "border-transparent text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400",
                )}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
