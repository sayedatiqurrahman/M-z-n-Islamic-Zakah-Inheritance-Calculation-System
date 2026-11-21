import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, Menu } from "lucide-react";
import { DOCS, extractToc, getDocBySlug, getDocContent, githubDocUrl } from "@/lib/docs";
import { DocsMarkdown } from "@/components/docs/docs-markdown";
import { DocsToc } from "@/components/docs/docs-toc";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.description,
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) notFound();

  const result = await getDocContent(doc.file);
  if (!result) notFound();

  const toc = extractToc(result.content);
  const index = DOCS.findIndex((d) => d.slug === doc.slug);
  const prev = index > 0 ? DOCS[index - 1] : null;
  const next = index < DOCS.length - 1 ? DOCS[index + 1] : null;

  return (
    <div className="flex gap-8">
      <article className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Menu className="size-4" /> Docs
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto p-4">
              <SheetHeader className="mb-2 px-0">
                <SheetTitle>Documentation</SheetTitle>
              </SheetHeader>
              <DocsSidebar />
            </SheetContent>
          </Sheet>
          <a
            href={githubDocUrl(doc.file)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            View source <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="mb-6 hidden items-center justify-end lg:flex">
          <a
            href={githubDocUrl(doc.file)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            View on GitHub <ExternalLink className="size-3" />
          </a>
        </div>

        <DocsMarkdown content={result.content} />

        <hr className="my-10 border-emerald-100 dark:border-emerald-900/50" />

        <div className="grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/docs/${prev.slug}`}
              className="group rounded-lg border border-emerald-100 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-emerald-900/50 dark:hover:bg-emerald-950/20"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeft className="size-3" /> Previous
              </span>
              <span className="mt-1 block font-medium text-emerald-950 group-hover:text-emerald-800 dark:text-emerald-50">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/docs/${next.slug}`}
              className="group rounded-lg border border-emerald-100 p-4 text-end transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-emerald-900/50 dark:hover:bg-emerald-950/20"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                Next <ArrowRight className="size-3" />
              </span>
              <span className="mt-1 block font-medium text-emerald-950 group-hover:text-emerald-800 dark:text-emerald-50">
                {next.title}
              </span>
            </Link>
          ) : null}
        </div>
      </article>

      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8">
          <DocsToc headings={toc} />
          <p className="mt-6 border-t border-emerald-100 pt-3 text-xs text-muted-foreground dark:border-emerald-900/50">
            Loaded from local documentation files.
          </p>
        </div>
      </aside>
    </div>
  );
}
