"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Scale, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "@/components/navigation/nav-items";
import { LivePriceTicker } from "@/components/prices/live-price-ticker";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { LOCALES } from "@/lib/i18n";
import { useLocale } from "./locale-provider";
import { cn } from "@/lib/utils";

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="flex flex-col gap-1" aria-label={t("nav.main")}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-muted-foreground dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const current = LOCALES.find((l) => l.code === locale)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <span className="font-semibold">{current.native}</span>
          <ChevronDown className="size-3.5" />
          <span className="sr-only">{t("common.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((item) => (
          <DropdownMenuItem key={item.code} onClick={() => setLocale(item.code)}>
            <span className="flex-1">{item.native}</span>
            {locale === item.code && <Check className="size-4 text-emerald-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="flex min-h-dvh bg-[#f8faf9] dark:bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-emerald-100 bg-white px-4 py-6 dark:border-emerald-500/15 dark:bg-card lg:flex lg:flex-col">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Scale className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-bold text-emerald-900 dark:text-emerald-200">{t("app.name")}</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavigationLinks />
        </div>
        <div className="mt-4 space-y-2 border-t border-emerald-100 pt-4 dark:border-emerald-500/15">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">{t("common.methodology")}</span>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
              {t("common.methodologyBadge")}
            </Badge>
          </div>
          <p className="px-2 text-[10px] leading-relaxed text-muted-foreground">
            {t("app.version")}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-emerald-100 bg-white/90 px-4 backdrop-blur dark:border-emerald-500/15 dark:bg-background/90 md:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("nav.open")}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0" closeLabel={t("common.close")}>
                <SheetHeader className="border-b border-emerald-100 px-6 py-5 dark:border-emerald-500/15">
                  <SheetTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                    <Scale className="size-5" /> {t("app.name")}
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <NavigationLinks onNavigate={() => document.querySelector("[data-state=open]")?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))} />
                  <div className="mt-4 border-t border-emerald-100 pt-4 dark:border-emerald-500/15">
                    <LivePriceTicker className="flex" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Scale className="size-4" />
              </span>
              <span className="font-bold text-emerald-900 dark:text-emerald-200">{t("app.name")}</span>
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">{t("app.subtitle")}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <LivePriceTicker />
            <Badge variant="outline" className="hidden sm:inline-flex">{t("common.methodologyBadge")}</Badge>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pt-6 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
