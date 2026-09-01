import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "Access unlocked", robots: { index: false } };
export default function CheckoutSuccessPage() { return <div className="container-page py-16"><Card className="mx-auto max-w-2xl"><CardContent className="py-12 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10"><CheckCircle2 className="size-7 text-primary" /></span><p className="eyebrow mt-6">Mock payment successful</p><h1 className="mt-3 text-3xl font-bold">The full program is unlocked.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">Your local demo account now has paid-student access. No real payment was processed.</p><Button asChild size="lg" className="mt-7"><Link href="/dashboard">Go to dashboard <ArrowRight className="size-4" /></Link></Button></CardContent></Card></div>; }
