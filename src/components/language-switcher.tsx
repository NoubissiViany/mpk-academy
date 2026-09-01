"use client";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/domain";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { state, setLocale } = useApp();
  const router = useRouter();
  const locale = state.user?.locale ?? "en";
  const select = (next: Locale) => { setLocale(next); router.refresh(); };
  return <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1" aria-label="Application language"><Languages className="ml-1.5 size-4 text-muted-foreground" aria-hidden="true" />{(["en", "fr"] as const).map((item) => <button key={item} onClick={() => select(item)} aria-pressed={locale === item} className={cn("rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", locale === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{compact ? item : item === "en" ? "English" : "Français"}</button>)}</div>;
}
