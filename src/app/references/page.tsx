"use client";

import { useEffect, useState } from "react";
import { BookMarked, ExternalLink, Library, ScrollText, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AcademicDisclaimer } from "@/components/shared/academic-disclaimer";
import { useLocale } from "@/components/layout/locale-provider";

interface ReferenceItem {
  id: string;
  type: string;
  title: string;
  arabicTitle?: string | null;
  verificationStatus: string;
  author?: string | null;
  volume?: number | null;
  page?: number | null;
  explanationEn?: string | null;
  externalUrl?: string | null;
}

interface QuranEvidence {
  id: string;
  surah: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  translationSource?: string | null;
  principle?: string | null;
  verificationStatus: string;
  externalUrl?: string | null;
}

interface HadithEvidence {
  id: string;
  collection: string;
  translation: string;
  authenticity?: string | null;
  hadithNumber?: number | null;
  ruling?: string | null;
  verificationStatus: string;
  externalUrl?: string | null;
}

export default function ReferencesPage() {
  const { t } = useLocale();
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [quran, setQuran] = useState<QuranEvidence[]>([]);
  const [hadith, setHadith] = useState<HadithEvidence[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/references", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as { references?: ReferenceItem[]; quran?: QuranEvidence[]; hadith?: HadithEvidence[] };
        if (cancelled) return;
        setReferences(data.references ?? []);
        setQuran(data.quran ?? []);
        setHadith(data.hadith ?? []);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = references.reduce<Record<string, ReferenceItem[]>>((acc, reference) => {
    (acc[reference.type] ??= []).push(reference);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t("references.title")} description={t("references.description")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-100">
          <CardHeader className="pb-1"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{t("references.quranCount")}</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-950">{quran.length}</CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-1"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{t("references.hadithCount")}</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-950">{hadith.length}</CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-1"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{t("references.refCount")}</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-950">{references.length}</CardContent>
        </Card>
      </div>

      {failed && (
        <EmptyState
          icon={Library}
          title={t("references.unable.title")}
          description={t("references.unable.description")}
        />
      )}

      {!failed && (
        <>
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-emerald-950">
              <BookMarked className="size-5 text-emerald-700" /> {t("references.quranEvidence")}
            </h2>
            {quran.length === 0 ? (
              <EmptyState
                title={t("references.noQuran.title")}
                description={t("references.noQuran.description")}
              />
            ) : (
              <div className="space-y-3">
                {quran.map((verse) => (
                  <Card key={verse.id} className="border-emerald-100">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base">{verse.surah} {verse.ayahNumber}</CardTitle>
                        <StatusBadge status={verse.verificationStatus} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="font-arabic text-lg leading-loose text-emerald-950" dir="rtl" lang="ar">
                        {verse.arabicText}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-700">{verse.translation}</p>
                      {verse.translationSource && (
                        <p className="text-xs text-muted-foreground">
                          {t("references.translationSource", { source: verse.translationSource })}
                        </p>
                      )}
                      {verse.principle && (
                        <p className="rounded-lg bg-emerald-50/60 p-2 text-xs text-emerald-900">
                          <span className="font-semibold">{t("references.principle")}</span>{verse.principle}
                        </p>
                      )}
                      {verse.externalUrl && (
                        <a href={verse.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 underline">
                          {t("references.readOn")} <ExternalLink className="size-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-emerald-950">
              <ScrollText className="size-5 text-emerald-700" /> {t("references.hadithEvidence")}
            </h2>
            {hadith.length === 0 ? (
              <EmptyState
                title={t("references.noHadith.title")}
                description={t("references.noHadith.description")}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {hadith.map((item) => (
                  <Card key={item.id} className="border-emerald-100">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-sm">{item.collection}</CardTitle>
                        <StatusBadge status={item.verificationStatus} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-slate-700">{item.translation}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">{t("references.authenticity")}: {item.authenticity}</Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {t("references.number")}: {item.hadithNumber ?? t("common.verificationRequired")}
                        </Badge>
                      </div>
                      {item.ruling && <p className="text-xs text-muted-foreground">{item.ruling}</p>}
                      {item.externalUrl && (
                        <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 underline">
                          {t("references.checkOn")} <ExternalLink className="size-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-emerald-950">
              <Library className="size-5 text-emerald-700" /> {t("references.scholarly")}
            </h2>
            {references.length === 0 ? (
              <EmptyState
                title={t("references.noRefs.title")}
                description={t("references.noRefs.description")}
              />
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
                    {t(`evidence.${type}`)}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {items.map((reference) => (
                      <Card key={reference.id} className="border-emerald-100">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-sm">{reference.title}</CardTitle>
                              {reference.arabicTitle && (
                                <p className="font-arabic text-sm text-emerald-700" dir="rtl" lang="ar">
                                  {reference.arabicTitle}
                                </p>
                              )}
                            </div>
                            <StatusBadge status={reference.verificationStatus} />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs text-muted-foreground">
                          {reference.author && <p>{t("references.author")}: {reference.author}</p>}
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[10px]">{t("references.volume")}: {reference.volume ?? t("common.verificationRequired")}</Badge>
                            <Badge variant="outline" className="text-[10px]">{t("references.page")}: {reference.page ?? t("common.verificationRequired")}</Badge>
                          </div>
                          {reference.explanationEn && <p className="text-slate-600">{reference.explanationEn}</p>}
                          {reference.externalUrl && (
                            <a href={reference.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-emerald-700 underline">
                              {t("references.fullSource")} <ExternalLink className="size-3" />
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      <AcademicDisclaimer />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const verified = status === "VERIFIED_BY_SCHOLAR";
  const key = `status.${status}`;
  const label = t(key);
  return (
    <Badge variant={verified ? "default" : "outline"} className={verified ? "" : "border-amber-300 text-amber-800"}>
      {!verified && <ShieldAlert className="size-3" />}
      {label === key ? status : label}
    </Badge>
  );
}
