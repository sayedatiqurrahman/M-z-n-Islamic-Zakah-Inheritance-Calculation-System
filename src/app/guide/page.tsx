import type { Metadata } from "next";
import { GuideIndexView } from "@/components/fiqh/guide-index-view";

export const metadata: Metadata = {
  title: "Fiqh Learning Center",
  description: "Structured Hanafi learning content for Zakah, inheritance and jurisprudence principles.",
};

export default function GuideIndexPage() {
  return <GuideIndexView />;
}
