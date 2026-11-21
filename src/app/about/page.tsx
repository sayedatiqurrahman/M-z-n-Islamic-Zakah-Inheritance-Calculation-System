"use client";

import { GraduationCap, IdCard, Landmark, Mail, School, UserRound, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { useLocale } from "@/components/layout/locale-provider";

const RESEARCHER = [
  { key: "name", value: "Sayed Atiqur Rahman", icon: UserRound },
  { key: "universityId", value: "Q233099", icon: IdCard },
  { key: "university", value: "International Islamic University Chittagong (IIUC)", icon: School },
  { key: "faculty", value: "Faculty of Shariah and Islamic Studies", icon: Landmark },
  { key: "department", value: "Qur'anic Sciences & Islamic Studies", icon: GraduationCap },
  { key: "projectType", value: null, icon: Users },
] as const;

const SUPERVISOR_ROWS = ["name", "designation", "department", "university"] as const;

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t("about.title")} description={t("about.description")} />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="text-base">{t("about.developer")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {RESEARCHER.map((item) => {
              const Icon = item.icon;
              const value = item.value ?? t("about.projectType");
              return (
                <div key={item.key} className="flex items-start gap-3 border-b border-dashed pb-3 last:border-0 last:pb-0">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t(`about.label.${item.key}`)}</p>
                    <p className="text-sm font-medium text-emerald-950">{value}</p>
                  </div>
                </div>
              );
            })}
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              {t("about.researchArea")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {t("about.supervisor.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <dl className="space-y-2">
              {SUPERVISOR_ROWS.map((key) => (
                <div key={key} className="flex items-center justify-between gap-3 border-b border-dashed pb-2 last:border-0">
                  <dt className="text-muted-foreground">{t(`about.supervisor.${key}`)}</dt>
                  <dd className="font-medium text-amber-900">{t("about.toBeAdded")}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">{t("about.departmentLine")}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base">{t("about.scholars.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("about.scholars.description")}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 sm:flex-row sm:items-start">
            <img
              src="https://portal.iiuc.ac.bd/assets/teacher/2086.jpeg"
              alt="Prof. Dr. B. M. Mofizur Rahman"
              className="size-24 rounded-xl object-cover border border-emerald-100"
              loading="lazy"
            />
            <div className="min-w-0 space-y-2">
              <div>
                <p className="text-lg font-semibold text-emerald-950">Prof. Dr. B. M. Mofizur Rahman</p>
                <p className="text-sm text-slate-700">Professor, Department of Qur&apos;anic Sciences and Islamic Studies</p>
                <p className="text-sm text-muted-foreground">International Islamic University Chittagong</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("about.scholars.contact")}</p>
                <a href="mailto:bmmofiz@yahoo.com" className="flex items-center gap-2 text-sm text-emerald-700 hover:underline">
                  <Mail className="size-4" /> bmmofiz@yahoo.com
                </a>
                <a href="mailto:drbmmofizurrahmanalazhari@gmail.com" className="flex items-center gap-2 text-sm text-emerald-700 hover:underline">
                  <Mail className="size-4" /> drbmmofizurrahmanalazhari@gmail.com
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base">{t("about.project.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>{t("about.project.p1")}</p>
          <p>{t("about.project.p2")}</p>
          <p>{t("about.project.p3")}</p>
          <p>{t("about.project.p4")}</p>
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-muted-foreground">
            {t("about.academicNote")}
          </p>
        </CardContent>
      </Card>

      <AcademicDisclaimer />
    </div>
  );
}
