import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import { DOCS, githubDocUrl } from "@/lib/docs";

export default function DocsIndexPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <BookOpen className="size-5" />
          <span className="text-sm font-medium">Documentation</span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
          Project documentation
        </h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-300">
          Technical and methodology documentation for Mīzān, including system architecture, calculation
          rules, reference verification, data storage, testing, and pricing sources.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DOCS.map((doc) => (
          <div
            key={doc.slug}
            className="group rounded-xl border border-emerald-100 bg-white p-5 transition-colors hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-card"
          >
            <Link href={`/docs/${doc.slug}`} className="block">
              <h2 className="font-heading text-lg font-semibold text-emerald-950 group-hover:text-emerald-800 dark:text-emerald-50 dark:group-hover:text-emerald-200">
                {doc.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {doc.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Read document <ArrowRight className="size-4" />
              </span>
            </Link>
            <a
              href={githubDocUrl(doc.file)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              Source on GitHub <ExternalLink className="size-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
