import {
  LayoutDashboard,
  Calculator,
  Scale,
  BookOpenText,
  BookOpenCheck,
  Coins,
  Landmark,
  Library,
  History,
  UserRound,
  Info,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/zakah", labelKey: "nav.zakah", icon: Calculator },
  { href: "/inheritance", labelKey: "nav.inheritance", icon: Scale },
  { href: "/guide/zakah", labelKey: "nav.zakahGuide", icon: BookOpenText },
  { href: "/guide/inheritance", labelKey: "nav.inheritanceGuide", icon: BookOpenCheck },
  { href: "/zakah/nisab", labelKey: "nav.nisab", icon: Coins },
  { href: "/guide/principles", labelKey: "nav.fiqh", icon: Landmark },
  { href: "/references", labelKey: "nav.references", icon: Library },
  { href: "/history", labelKey: "nav.history", icon: History },
  { href: "/account", labelKey: "nav.account", icon: UserRound },
  { href: "/about", labelKey: "nav.about", icon: Info },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];
