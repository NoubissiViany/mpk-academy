"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="container-page py-20 text-center"><p className="eyebrow">Something went wrong</p><h1 className="mt-3 text-3xl font-bold">This page did not load as expected.</h1><p className="mt-3 text-muted-foreground">Your locally saved learning progress has not been removed.</p><Button className="mt-7" onClick={reset}>Try again</Button></main>; }
