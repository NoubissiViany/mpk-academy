import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <main className="container-page py-24 text-center"><p className="eyebrow">404</p><h1 className="mt-3 text-4xl font-bold">That page is not part of the learning plan.</h1><p className="mt-4 text-muted-foreground">Return to your dashboard or explore the public program.</p><Button asChild className="mt-7"><Link href="/dashboard">Go to dashboard</Link></Button></main>; }
