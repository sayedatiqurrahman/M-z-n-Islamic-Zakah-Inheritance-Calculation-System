"use client";

import { PageHeader } from "@/components/shared/page-header";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { SettingsForm } from "@/components/settings/settings-form";
import { useLocale } from "@/components/layout/locale-provider";

export function SettingsPageView() {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        description={t("settings.description")}
      />
      <SettingsForm />
      <AcademicDisclaimer />
    </div>
  );
}
