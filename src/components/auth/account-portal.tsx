"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Cloud,
  FileText,
  GitBranch,
  History,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Scale,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "@/components/layout/locale-provider";
import { toast } from "sonner";
import { FamilyRecordsPanel } from "./family-records-panel";
import { HistoryList } from "@/components/history/history-list";

type AuthUser = { id: string; email: string; name: string | null };
type HistoryItem = { id: string; type: "zakah" | "inheritance"; local?: boolean };

export function AccountPortal() {
  const { t } = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [meRes, histRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/history", { cache: "no-store" }).catch(() => null),
      ]);
      const me = await meRes.json().catch(() => ({}));
      setUser(me.user ?? null);
      if (histRes?.ok) {
        const h = await histRes.json().catch(() => ({}));
        setHistory(Array.isArray(h.items) ? h.items : []);
      } else {
        setHistory([]);
      }
    } catch {
      setUser(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    return {
      zakah: history.filter((i) => i.type === "zakah").length,
      inheritance: history.filter((i) => i.type === "inheritance").length,
      total: history.length,
    };
  }, [history]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "register" ? { name, email, password } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? t("common.error"));
        return;
      }
      setUser(data.user ?? null);
      setPassword("");
      window.dispatchEvent(new Event("mizan:auth-change"));
      toast.success(mode === "register" ? t("account.created") : t("account.signedIn"));
      void load();
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.dispatchEvent(new Event("mizan:auth-change"));
      toast.success(t("account.signedOut"));
    } finally {
      setSubmitting(false);
    }
  };

  const heading = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">{t("account.portalHeading")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("account.portalDescription")}</p>
      </div>
      {user && (
        <Badge variant="secondary" className="w-fit bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
          <ShieldCheck className="mr-1 size-3.5" /> {t("account.signedIn")}
        </Badge>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {heading}
        <Card><CardContent className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t("common.loading")}</CardContent></Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        {heading}
        <div className="mx-auto max-w-md">
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <UserRound className="size-6" />
              </div>
              <CardTitle className="text-xl">{mode === "register" ? t("account.create") : t("account.signIn")}</CardTitle>
              <CardDescription>{t("account.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="portal-name">{t("account.name")}</Label>
                    <Input id="portal-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="portal-email">{t("account.email")}</Label>
                  <Input id="portal-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portal-password">{t("account.password")}</Label>
                  <Input id="portal-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : 1} maxLength={200} autoComplete={mode === "register" ? "new-password" : "current-password"} />
                  {mode === "register" && <p className="text-[11px] text-muted-foreground">{t("account.passwordHint")}</p>}
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : mode === "register" ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
                  {mode === "register" ? t("account.create") : t("account.signIn")}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <button type="button" className="text-emerald-700 hover:underline" onClick={() => setMode("register")}>{t("account.create")}</button>
                ) : (
                  <button type="button" className="text-emerald-700 hover:underline" onClick={() => setMode("login")}>{t("account.signIn")}</button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {heading}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-emerald-50/60 p-1 dark:bg-emerald-500/10">
          <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="size-4" /> {t("account.tab.overview")}</TabsTrigger>
          <TabsTrigger value="family" className="gap-2"><GitBranch className="size-4" /> {t("account.tab.family")}</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><Cloud className="size-4" /> {t("account.tab.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <Card className="border-emerald-100">
              <CardHeader>
                <CardTitle className="text-base">{t("account.portal")}</CardTitle>
                <CardDescription>{t("account.signedInAs")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border bg-emerald-50/40 p-4 dark:bg-emerald-500/10">
                  <span className="flex size-11 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                    {(user.name?.trim()?.[0] || user.email[0] || "U").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-emerald-950 dark:text-emerald-50">{user.name || t("account.noName")}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("account.syncHint")}</p>
                <Button variant="outline" onClick={() => void logout()} disabled={submitting}>
                  <LogOut className="size-4" /> {t("account.signOut")}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-emerald-100">
              <CardHeader>
                <CardTitle className="text-base">{t("history.savedCalculations")}</CardTitle>
                <CardDescription>{t("account.overview.cloudRecords")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-200">{counts.total}</p></div>
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("history.zakah")}</p><p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-200">{counts.zakah}</p></div>
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("history.inheritance")}</p><p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-200">{counts.inheritance}</p></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link href="/zakah" className="block"><Card className="h-full border-emerald-100 transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Calculator className="size-5" /></span><div><p className="font-medium">{t("nav.zakah")}</p><p className="text-xs text-muted-foreground">Calculate & save</p></div></CardContent></Card></Link>
            <Link href="/inheritance" className="block"><Card className="h-full border-emerald-100 transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Scale className="size-5" /></span><div><p className="font-medium">{t("nav.inheritance")}</p><p className="text-xs text-muted-foreground">Calculate & save</p></div></CardContent></Card></Link>
            <Link href="/history" className="block"><Card className="h-full border-emerald-100 transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><History className="size-5" /></span><div><p className="font-medium">{t("nav.history")}</p><p className="text-xs text-muted-foreground">{t("history.savedCalculations")}</p></div></CardContent></Card></Link>
            <Link href="/settings" className="block"><Card className="h-full border-emerald-100 transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><FileText className="size-5" /></span><div><p className="font-medium">{t("nav.settings")}</p><p className="text-xs text-muted-foreground">{t("settings.description")}</p></div></CardContent></Card></Link>
          </div>
        </TabsContent>

        <TabsContent value="family">
          <FamilyRecordsPanel />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle className="text-base">{t("account.tab.history")}</CardTitle>
              <CardDescription>{t("account.overview.cloudRecords")}. {t("history.saveToCloud")}.</CardDescription>
            </CardHeader>
          </Card>
          <HistoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
