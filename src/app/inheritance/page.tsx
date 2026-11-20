import type { Metadata } from "next";
import { InheritancePageView } from "@/components/inheritance/inheritance-page-view";

export const metadata: Metadata = {
  title: "Inheritance Calculator",
  description:
    "Sunni-majority Fara'id calculator for all catalogued heirs with exact rational arithmetic, source kitabs, exclusion analysis, Awl, Radd and Tashih.",
};

export default function InheritancePage() {
  return <InheritancePageView />;
}
