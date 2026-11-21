"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/layout/locale-provider";

type AuthUser = { id: string; email: string; name: string | null };

export function AuthHeaderButton() {
  const { t } = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (active) setUser(data.user ?? null);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    const onAuthChange = () => void (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (active) setUser(data.user ?? null);
      } catch {}
    })();
    window.addEventListener("mizan:auth-change", onAuthChange);
    return () => {
      active = false;
      window.removeEventListener("mizan:auth-change", onAuthChange);
    };
  }, []);

  if (!loaded) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" disabled>
        <UserRound className="size-4" />
        <span className="hidden sm:inline">{t("account.signIn")}</span>
      </Button>
    );
  }

  if (user) {
    const label = user.name?.trim() || t("account.portal");
    return (
      <Button variant="outline" size="sm" className="gap-1.5" asChild>
        <Link href="/account">
          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
            {(user.name?.trim()?.[0] || user.email[0] || "U").toUpperCase()}
          </span>
          <span className="hidden max-w-24 truncate sm:inline">{label}</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" asChild>
      <Link href="/account">
        <LogIn className="size-4" />
        <span className="hidden sm:inline">{t("account.signIn")}</span>
      </Link>
    </Button>
  );
}
