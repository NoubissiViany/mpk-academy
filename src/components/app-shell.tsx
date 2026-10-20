"use client";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useApp } from "@/components/providers/app-provider";
import { LockedContent, PageHeader, Wordmark } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  accountNavigation,
  overviewNavigation,
  prepareNavigation,
  quickNavigation,
  trackNavigation,
} from "@/config/navigation";
import { hasPlanFeature, isBetaMode, planDisplayName } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { useI18n } from "@/i18n/client";
import { intlLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { requiredFeatureForPath } from "@/lib/domain/access";
import { cn } from "@/lib/utils";
import type { AppState } from "@/types/domain";

export function AppShell({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState: AppState;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, hydrated, replaceState } = useApp();
  const { t, locale } = useI18n();
  const copy = t.account.shell;
  const resolvedState = hydrated && state.user ? state : initialState;
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    replaceState(initialState);
  }, [initialState, replaceState]);
  useEffect(() => {
    if (!hydrated || resolvedState.user || loggingOut) return;
    const destination = `${pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(destination)}`);
  }, [hydrated, loggingOut, pathname, resolvedState.user, router]);

  if (!resolvedState.user)
    return (
      <div
        className="min-h-screen animate-pulse bg-muted"
        aria-label={copy.checking}
      />
    );
  const planLabel = resolvedState.planAccess
    ? isBetaMode()
      ? t.beta.planLabel
      : t.account.profile.planName(
          planDisplayName(resolvedState.planAccess.planId),
        )
    : t.account.profile.free;
  const accessUntil = resolvedState.planAccess?.accessUntil
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(resolvedState.planAccess.accessUntil))
    : null;
  type NavigationItem = {
    href: string;
    key: keyof Messages["account"]["shell"]["nav"];
    icon: LucideIcon;
  };
  const nav = (items: readonly NavigationItem[]) =>
    items
      .filter((item) => {
        const feature = requiredFeatureForPath(item.href);
        return !feature || hasPlanFeature(resolvedState.planAccess, feature);
      })
      .map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {copy.nav[item.key]}
          </Link>
        );
      });
  const group = (label: string, items: readonly NavigationItem[]) => (
    <div className="mb-5">
      <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <nav className="space-y-1" aria-label={copy.navigation(label)}>
        {nav(items)}
      </nav>
    </div>
  );
  const sidebar = (
    <>
      <div className="flex h-16 items-center justify-between">
        <Wordmark />
        <button
          className="rounded-lg p-2 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label={t.common.nav.closeMenu}
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="mt-5 flex-1 overflow-y-auto">
        {group(copy.overview, overviewNavigation)}
        {group(copy.prepare, prepareNavigation)}
        {group(copy.track, trackNavigation)}
        <div className="my-5 border-t" />
        <nav className="space-y-1" aria-label={copy.account}>
          {nav(accountNavigation)}
        </nav>
      </div>
      <LanguageSwitcher />
      <button
        className="mt-3 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
        onClick={async () => {
          setLoggingOut(true);
          await signOutAction();
          replaceState(structuredClone(defaultState));
          router.push("/");
          router.refresh();
        }}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {copy.logout}
      </button>
      <div className="mt-4 flex items-center gap-3 border-t pt-5">
        <div className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {resolvedState.user?.firstName?.[0] ?? copy.learner[0]}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {resolvedState.user?.firstName ?? copy.learner}{" "}
            {resolvedState.user?.lastName ?? ""}
          </p>
          <p className="truncate text-xs text-muted-foreground">{planLabel}</p>
          {resolvedState.planAccess && accessUntil && (
            <p className="truncate text-[11px] text-muted-foreground">
              {`${t.account.profile.accessUntil} ${accessUntil}`}
            </p>
          )}
        </div>
      </div>
    </>
  );
  const requiredFeature = requiredFeatureForPath(pathname);
  const hasRequiredFeature =
    !requiredFeature ||
    hasPlanFeature(resolvedState.planAccess, requiredFeature);
  const content = !hasRequiredFeature ? (
    <>
      <PageHeader
        eyebrow={copy.lockedEyebrow}
        title={copy.lockedTitle}
        description={copy.lockedBody}
      />
      <LockedContent />
    </>
  ) : (
    children
  );
  if (pathname === "/exam/session" && hasRequiredFeature)
    return <>{children}</>;
  const accessibleQuickNavigation = quickNavigation.filter((item) => {
    const feature = requiredFeatureForPath(item.href);
    return !feature || hasPlanFeature(resolvedState.planAccess, feature);
  });
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-card px-4 pb-5 lg:flex">
        {sidebar}
      </aside>
      {open && (
        <>
          <button
            aria-label={copy.overlay}
            className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,90vw)] flex-col bg-card px-4 pb-5 shadow-xl lg:hidden">
            {sidebar}
          </aside>
        </>
      )}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Wordmark />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-label={t.common.nav.openMenu}
        >
          <Menu />
        </Button>
      </header>
      <main className="pb-20 lg:pl-64 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 sm:py-10 lg:px-10">
          {content}
        </div>
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-card px-2 py-1.5 lg:hidden"
        style={{
          gridTemplateColumns: `repeat(${accessibleQuickNavigation.length}, minmax(0, 1fr))`,
        }}
        aria-label={copy.quick}
      >
        {accessibleQuickNavigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {copy.nav[item.key]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
