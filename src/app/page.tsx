import type { Metadata } from "next";
import HomeView from "@/components/home/home-view";

export const metadata: Metadata = {
  title: "Mīzān",
  description:
    "Mīzān — an evidence-based Hanafi system for Zakah and Islamic inheritance with explained, versioned calculations.",
};

export default function HomePage() {
  return <HomeView />;
}
