"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, LayoutDashboard, Scale, BookOpenText, UserRound } from "lucide-react";
import { useLocale } from "./locale-provider";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", labelKey: "nav.tab.dashboard", icon: LayoutDashboard },
  { href: "/zakah", labelKey: "nav.tab.zakah", icon: Calculator },
  { href: "/inheritance", labelKey: "nav.tab.inheritance", icon: Scale },
  { href: "/guide", labelKey: "nav.tab.guide", icon: BookOpenText },
  { href: "/settings", labelKey: "nav.tab.settings", icon: UserRound },
];

/**
 * App-like bottom navigation for phones. It is hidden from `lg` upwards, where
 * the permanent sidebar takes over, and respects the device safe area.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav
      aria-label={t("nav.mobile")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 backdrop-blur-md dark:border-emerald-500/20 dark:bg-card/95 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors",
                active
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute top-1 h-1 w-8 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
              <Icon className={cn("mt-1 size-5", active && "stroke-[2.4]")} />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
