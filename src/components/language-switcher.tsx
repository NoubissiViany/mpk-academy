"use client";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/domain";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t, setLocale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const select = (next: Locale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };
  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1"
      role="group"
      aria-label={t.common.language.label}
      aria-busy={pending}
    >
      <Languages
        className="ml-1.5 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      {(["en", "fr"] as const).map((item) => (
        <button
          key={item}
          type="button"
          lang={item}
          onClick={() => select(item)}
          aria-pressed={locale === item}
          disabled={pending}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            locale === item
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {compact
            ? item
            : item === "en"
              ? t.common.language.english
              : t.common.language.french}
        </button>
      ))}
    </div>
  );
}
