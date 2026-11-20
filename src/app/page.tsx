import type { Metadata } from "next";
import HomeView from "@/components/home/home-view";

export const metadata: Metadata = {
  title: "Mīzān",
  description:
    "Mīzān — evidence-based Hanafi Zakah and Sunni-majority inheritance calculations with explained, versioned results.",
};

export default function HomePage() {
  return <HomeView />;
}
