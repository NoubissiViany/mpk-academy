import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "Sign in" };
export default function LoginPage() { return <div className="container-page py-16"><Card className="mx-auto max-w-md"><CardContent className="pt-6"><p className="eyebrow">Welcome back</p><h1 className="mt-3 text-3xl font-bold">Continue your preparation.</h1><p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">Use any valid email and an 8-character password. Add “free” to the email to test free access.</p><AuthForm mode="login" /></CardContent></Card></div>; }
