import type { Metadata } from "next";
import { InheritancePageView } from "@/components/inheritance/inheritance-page-view";

export const metadata: Metadata = {
  title: "Inheritance Calculator",
  description:
    "Hanafi Fara'id calculator with exact rational arithmetic, exclusion analysis, Awl and Radd.",
};

export default function InheritancePage() {
  return <InheritancePageView />;
}
