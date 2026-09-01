"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Wordmark } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";
import { getDictionary } from "@/i18n/dictionaries";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { state } = useApp();
  const dictionary = getDictionary(state.user?.locale ?? "en");
  const links = [{ href: "/program", label: dictionary.nav.program }, { href: "/#how-it-works", label: dictionary.nav.how }, { href: "/pricing", label: dictionary.nav.pricing }];
  return <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl"><div className="container-page flex h-16 items-center justify-between"><Wordmark /><nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">{links.map((link) => <Link key={link.href} href={link.href} className="text-sm font-semibold text-muted-foreground hover:text-foreground">{link.label}</Link>)}</nav><div className="hidden items-center gap-3 lg:flex"><LanguageSwitcher compact /><Button asChild variant="ghost"><Link href="/login">{dictionary.nav.signIn}</Link></Button><Button asChild><Link href="/diagnostic">{dictionary.nav.diagnostic}</Link></Button></div><button className="rounded-lg p-2 lg:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>{open && <nav className="container-page flex flex-col gap-2 border-t py-4 lg:hidden" aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-muted">{link.label}</Link>)}<div className="my-2"><LanguageSwitcher /></div><Button asChild variant="secondary"><Link href="/login">{dictionary.nav.signIn}</Link></Button><Button asChild><Link href="/diagnostic">{dictionary.nav.diagnostic}</Link></Button></nav>}</header>;
}
