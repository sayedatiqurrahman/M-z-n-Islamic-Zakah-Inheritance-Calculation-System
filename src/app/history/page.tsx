import type { Metadata } from "next";
import { HistoryPageView } from "@/components/history/history-page-view";

export const metadata: Metadata = { title: "Calculation History" };

export default function HistoryPage() {
  return <HistoryPageView />;
}
