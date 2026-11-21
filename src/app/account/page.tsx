import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to save your Zakah and inheritance records to your account and access them across devices.
        </p>
      </div>
      <AuthPanel />
    </div>
  );
}
