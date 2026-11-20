import type { Metadata } from "next";
import { ZakahPageView } from "@/components/zakah/zakah-page-view";

export const metadata: Metadata = {
  title: "Zakah Calculator",
  description:
    "Hanafi Zakah calculator with asset classification, deductible liabilities, configurable Nisab and Hawl evaluation.",
};

export default function ZakahPage() {
  return <ZakahPageView />;
}
