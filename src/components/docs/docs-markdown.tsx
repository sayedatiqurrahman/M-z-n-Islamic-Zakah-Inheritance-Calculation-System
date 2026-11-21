import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import Link from "next/link";

export function DocsMarkdown({ content }: { content: string }) {
  return (
    <div className="docs-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          h1: ({ children, ...props }) => (
            <h1
              className="mb-4 scroll-mt-24 font-heading text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="mt-10 mb-3 scroll-mt-24 border-b border-emerald-100 pb-2 font-heading text-xl font-semibold text-emerald-950 dark:border-emerald-900/50 dark:text-emerald-50"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="mt-8 mb-2 scroll-mt-24 font-heading text-lg font-semibold text-emerald-900 dark:text-emerald-100"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="mt-6 mb-2 scroll-mt-24 text-base font-semibold text-emerald-900 dark:text-emerald-100"
              {...props}
            >
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="my-4 leading-7 text-slate-700 dark:text-slate-300" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="my-4 ml-6 list-disc space-y-2 text-slate-700 dark:text-slate-300" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-4 ml-6 list-decimal space-y-2 text-slate-700 dark:text-slate-300" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-7" {...props}>
              {children}
            </li>
          ),
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith("http");
            if (isExternal) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800 dark:text-emerald-400"
                  {...props}
                >
                  {children}
                </a>
              );
            }
            return (
              <Link
                href={href ?? "#"}
                className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800 dark:text-emerald-400"
                {...props}
              >
                {children}
              </Link>
            );
          },
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-4 border-s-4 border-emerald-300 bg-emerald-50/60 py-2 ps-4 pe-3 text-slate-700 italic dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-slate-300"
              {...props}
            >
              {children}
            </blockquote>
          ),
          hr: (props) => <hr className="my-8 border-emerald-100 dark:border-emerald-900/50" {...props} />,
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-lg border border-emerald-100 dark:border-emerald-900/50">
              <table className="w-full min-w-[480px] border-collapse text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="border-b border-emerald-100 px-3 py-2 text-start font-semibold dark:border-emerald-900/50" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border-b border-emerald-50 px-3 py-2 align-top text-slate-700 dark:border-emerald-900/30 dark:text-slate-300" {...props}>
              {children}
            </td>
          ),
          tr: ({ children, ...props }) => (
            <tr className="last:[&>td]:border-b-0" {...props}>
              {children}
            </tr>
          ),
          pre: ({ children, ...props }) => (
            <pre
              className="my-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-[13px] leading-relaxed text-slate-100"
              {...props}
            >
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[0.9em] text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                {...props}
              >
                {children}
              </code>
            );
          },
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props}>
              {children}
            </strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
