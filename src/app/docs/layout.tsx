import type { Metadata } from "next";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: "%s | Documentation | Mīzān",
  },
  description: "Technical and methodology documentation for Mīzān.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-1">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pe-2 pb-8">
          <DocsSidebar />
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-12">{children}</div>
    </div>
  );
}
