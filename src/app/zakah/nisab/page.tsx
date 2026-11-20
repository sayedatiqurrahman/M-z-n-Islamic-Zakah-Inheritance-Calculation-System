import type { Metadata } from "next";
import { NisabPageView } from "@/components/nisab/nisab-page-view";

export const metadata: Metadata = {
  title: "Nisab Information",
  description:
    "Classical gold and silver Nisab weights, contemporary valuation, and a manual valuation workspace.",
};

export default function NisabPage() {
  return <NisabPageView />;
}
