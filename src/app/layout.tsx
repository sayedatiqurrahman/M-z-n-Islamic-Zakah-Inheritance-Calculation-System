import type { Metadata, Viewport } from "next";
import { Inter, Noto_Naskh_Arabic, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Variable names intentionally differ from the CSS theme tokens they feed.
// Reusing `--font-arabic` / `--font-bengali` here creates a circular
// `var(--x): var(--x)` definition in the generated stylesheet, which makes
// browsers fall back to the generic family and breaks Bangla/Arabic rendering.
const notoArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
  weight: ["400", "700"],
});
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  variable: "--font-hind-siliguri",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Mīzān — Islamic Zakah & Inheritance Calculation System",
    template: "%s | Mīzān",
  },
  description:
    "An academic Hanafi system for calculating Zakah and Islamic inheritance with step-by-step jurisprudential explanations, evidence and references.",
  keywords: ["Zakah", "Inheritance", "Fara'id", "Hanafi", "Fiqh", "Mizan"],
  authors: [{ name: "Sayed Atiqur Rahman" }],
  manifest: "/manifest.webmanifest",
  applicationName: "Mīzān",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mīzān",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoArabic.variable} ${hindSiliguri.variable} min-h-dvh antialiased`}
      >
        <ThemeProvider>
          <LocaleProvider>
            <TooltipProvider>
              <AppShell>{children}</AppShell>
              <Toaster richColors position="top-center" />
            </TooltipProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
