"use client";

import { useEffect, useState } from "react";
import { Loader2, LogIn, LogOut, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLocale } from "@/components/layout/locale-provider";

type AuthUser = { id: string; email: string; name: string | null };

export function AuthPanel() {
  const { t } = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

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
      toast.success(mode === "register" ? t("account.created") : t("account.signedIn"));
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
      toast.success(t("account.signedOut"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  if (user) {
    return (
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base">{t("account.title")}</CardTitle>
          <CardDescription>{t("account.signedInAs")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-emerald-50/40 p-3 text-sm">
            <p className="font-medium text-emerald-950">{user.name || t("account.noName")}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <p className="text-xs text-muted-foreground">{t("account.syncHint")}</p>
          <Button variant="outline" onClick={() => void logout()} disabled={submitting}>
            <LogOut className="size-4" /> {t("account.signOut")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <CardTitle className="text-base">{t("account.title")}</CardTitle>
        <CardDescription>{t("account.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Button type="button" variant={mode === "login" ? "default" : "outline"} size="sm" onClick={() => setMode("login")}>
            <LogIn className="size-4" /> {t("account.signIn")}
          </Button>
          <Button type="button" variant={mode === "register" ? "default" : "outline"} size="sm" onClick={() => setMode("register")}>
            <UserPlus className="size-4" /> {t("account.create")}
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="account-name">{t("account.name")}</Label>
              <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="account-email">{t("account.email")}</Label>
            <Input id="account-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-password">{t("account.password")}</Label>
            <Input id="account-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : 1} maxLength={200} />
            {mode === "register" && <p className="text-[11px] text-muted-foreground">{t("account.passwordHint")}</p>}
          </div>
          <Button type="submit" disabled={submitting} className="bg-emerald-700 hover:bg-emerald-800">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : mode === "register" ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
            {mode === "register" ? t("account.create") : t("account.signIn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
