"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This component synchronises state with an external system (localStorage hydration or a network fetch) on mount. The effect is one-shot initialisation, which is the documented React pattern for external stores. */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, FileText, History, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/formatting";
import { toast } from "sonner";
import { useLocale } from "@/components/layout/locale-provider";

interface HistoryItem {
  id: string;
  type: "zakah" | "inheritance";
  title: string;
  createdAt: string;
  currency: string;
  summary: string;
  supported: boolean;
}

interface HistoryDetail extends HistoryItem {
  input: unknown;
  steps: {
    step: number;
    title: string;
    calculation: string;
    result: string;
    fiqhPrinciple: string;
    reason: string;
  }[];
}

export function HistoryList() {
  const router = useRouter();
  const { t } = useLocale();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/history", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load history");
      const data = (await response.json()) as { items: HistoryItem[] };
      setItems(data.items);
    } catch {
      setError(t("history.unableLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const fetchDetail = useCallback(async (item: HistoryItem): Promise<HistoryDetail | null> => {
    const response = await fetch(`/api/history?type=${item.type}&id=${item.id}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as HistoryDetail;
  }, []);

  const view = async (item: HistoryItem) => {
    setBusyId(item.id);
    try {
      const data = await fetchDetail(item);
      if (!data) {
        toast.error(t("history.unableLoadCalc"));
        return;
      }
      setDetail(data);
      setDetailOpen(true);
    } finally {
      setBusyId(null);
    }
  };

  const reopen = async (item: HistoryItem) => {
    setBusyId(item.id);
    try {
      const data = await fetchDetail(item);
      if (!data) {
        toast.error(t("history.unableLoadCalc"));
        return;
      }
      window.localStorage.setItem(`mizan:reopen:${item.type}`, JSON.stringify(data.input));
      router.push(item.type === "zakah" ? "/zakah" : "/inheritance");
      toast.success(t("history.loaded"));
    } finally {
      setBusyId(null);
    }
  };

  const download = async (item: HistoryItem) => {
    setBusyId(item.id);
    try {
      const data = await fetchDetail(item);
      if (!data) {
        toast.error(t("history.unableLoadCalc"));
        return;
      }
      const response = await fetch(`/api/reports/${item.type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: data.input }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        toast.error(payload.error ?? t("common.reportFailed"));
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mizan-${item.type}-report.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(t("common.reportDownloaded"));
    } catch {
      toast.error(t("common.reportFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: HistoryItem) => {
    if (!window.confirm(t("history.deleteConfirm"))) return;
    setBusyId(item.id);
    try {
      const response = await fetch(`/api/history?type=${item.type}&id=${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error(t("common.error"));
        return;
      }
      toast.success(t("history.calculationDeleted"));
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("history.loading")}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <EmptyState
        title={t("history.unableLoad")}
        description={error}
        icon={History}
        action={<Button variant="outline" onClick={() => void load()}>{t("common.tryAgain")}</Button>}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={t("history.noSaved")}
        description={t("history.saveHint")}
        icon={History}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><a href="/zakah">{t("history.openZakah")}</a></Button>
            <Button asChild variant="outline" size="sm"><a href="/inheritance">{t("history.openInheritance")}</a></Button>
          </div>
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={`${item.type}-${item.id}`} className="border-emerald-100">
            <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-50 text-[10px] text-emerald-800">
                    {item.type === "zakah" ? t("history.zakah") : t("history.inheritance")}
                  </Badge>
                  <p className="truncate text-sm font-semibold text-emerald-950">{item.title}</p>
                  {!item.supported && (
                    <Badge variant="outline" className="border-amber-300 text-[10px] text-amber-800">
                      {t("history.requiresVerification")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.summary}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)} · {item.currency}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => void view(item)} disabled={busyId === item.id}>
                  <Eye className="size-3.5" /> {t("common.view")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void reopen(item)} disabled={busyId === item.id}>
                  <RotateCcw className="size-3.5" /> {t("history.reopen")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void download(item)} disabled={busyId === item.id}>
                  <Download className="size-3.5" /> {t("history.pdf")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => void remove(item)}
                  disabled={busyId === item.id}
                >
                  <Trash2 className="size-3.5" /> {t("common.delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl" closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4 text-emerald-700" />
              {detail?.title ?? t("history.detailTitle")}
            </DialogTitle>
            <DialogDescription>
              {detail
                ? `${detail.type === "zakah" ? t("history.zakah") : t("history.inheritance")} · ${formatDateTime(detail.createdAt)}`
                : null}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50/60 p-3 text-sm text-emerald-900">{detail.summary}</div>
              {detail.steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("history.noSteps")}</p>
              ) : (
                <ol className="space-y-3">
                  {detail.steps.map((step) => (
                    <li key={step.step} className="rounded-lg border border-emerald-100 p-3 text-sm">
                      <p className="font-semibold text-emerald-950">{t("history.step")} {step.step}: {step.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t("history.calc")}: {step.calculation}</p>
                      <p className="text-xs text-muted-foreground">{t("history.result")}: {step.result}</p>
                      <p className="mt-1 text-xs"><span className="font-medium">{t("history.principle")}:</span> {step.fiqhPrinciple}</p>
                      <p className="text-xs"><span className="font-medium">{t("history.reason")}:</span> {step.reason}</p>
                    </li>
                  ))}
                </ol>
              )}
              <p className="text-xs text-muted-foreground">
                {t("history.methodologyNote")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
