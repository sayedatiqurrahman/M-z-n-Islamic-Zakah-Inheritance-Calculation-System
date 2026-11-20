import type { Metadata } from "next";
import { GuideIndexView } from "@/components/fiqh/guide-index-view";

export const metadata: Metadata = {
  title: "Fiqh Learning Center",
  description: "Structured Hanafi Zakah and Sunni-majority inheritance learning content with jurisprudence principles.",
};

export default function GuideIndexPage() {
  return <GuideIndexView />;
}
