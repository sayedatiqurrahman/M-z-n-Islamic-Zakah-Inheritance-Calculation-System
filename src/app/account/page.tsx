import type { Metadata } from "next";
import { AccountPortal } from "@/components/auth/account-portal";

export const metadata: Metadata = { title: "Account Portal" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <AccountPortal />
    </div>
  );
}
