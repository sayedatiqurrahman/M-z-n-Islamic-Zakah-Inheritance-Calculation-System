import type { Metadata } from "next";
import { SettingsPageView } from "@/components/settings/settings-page-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsPageView />;
}
