import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUserId } from "@/lib/supabase/learner";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireUserId();
  } catch {
    redirect("/login");
  }
  return <AppShell>{children}</AppShell>;
}
