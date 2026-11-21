import type { TocHeading } from "@/lib/docs-config";

export function DocsToc({ headings }: { headings: TocHeading[] }) {
  if (headings.length === 0) return null;
  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 font-semibold text-emerald-950 dark:text-emerald-50">On this page</p>
      <ul className="space-y-1.5 border-s border-emerald-100 ps-3 dark:border-emerald-900/50">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingInlineStart: `${(h.depth - 2) * 10}px` }}>
            <a
              href={`#${h.id}`}
              className="block leading-snug text-slate-600 transition-colors hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
