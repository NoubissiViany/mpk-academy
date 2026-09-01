"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockAuthRepository } from "@/repositories/mock";

const loginSchema = z.object({ email: z.email("Enter a valid email address"), password: z.string().min(8, "Use at least 8 characters") });
const registerSchema = loginSchema.extend({ firstName: z.string().min(2, "Enter your first name"), lastName: z.string().min(2, "Enter your last name"), locale: z.enum(["en", "fr"]), exam: z.enum(["TEF Canada", "TCF Canada", "Not sure yet"]) });
type RegisterData = z.infer<typeof registerSchema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold">{label}{children}{error && <span className="mt-1.5 block text-xs font-medium text-danger" role="alert">{error}</span>}</label>; }
const selectClass = "mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const { updateUser } = useApp(); const registering = mode === "register";
  const form = useForm<RegisterData>({ resolver: zodResolver(registerSchema), defaultValues: { firstName: "Demo", lastName: "Student", email: "", password: "", locale: "en", exam: "TEF Canada" } });
  const submit = async (values: RegisterData) => {
    const user = registering ? await mockAuthRepository.register({ firstName: values.firstName, lastName: values.lastName, email: values.email, password: values.password, locale: values.locale, assistance: "full", goal: { exam: values.exam, target: "B2" } }) : await mockAuthRepository.login(values.email, values.password);
    updateUser(user); toast.success(registering ? "Your learning plan is ready." : "Welcome back."); router.push("/dashboard");
  };
  return <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>{registering && <div className="grid gap-4 sm:grid-cols-2"><Field label="First name" error={form.formState.errors.firstName?.message}><Input className="mt-2" autoComplete="given-name" {...form.register("firstName")} /></Field><Field label="Last name" error={form.formState.errors.lastName?.message}><Input className="mt-2" autoComplete="family-name" {...form.register("lastName")} /></Field></div>}<Field label="Email" error={form.formState.errors.email?.message}><Input className="mt-2" type="email" autoComplete="email" {...form.register("email")} /></Field><Field label="Password" error={form.formState.errors.password?.message}><Input className="mt-2" type="password" autoComplete={registering ? "new-password" : "current-password"} {...form.register("password")} /></Field>{registering && <><Field label="Preferred instructional language"><select className={selectClass} {...form.register("locale")}><option value="en">English</option><option value="fr">Français</option></select></Field><Field label="What are you preparing for?"><select className={selectClass} {...form.register("exam")}><option>TEF Canada</option><option>TCF Canada</option><option>Not sure yet</option></select></Field></>}<Button className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Preparing…" : registering ? "Create my learning plan" : "Sign in"}</Button><p className="text-center text-sm text-muted-foreground">{registering ? "Already have an account?" : "New to MPK Academy?"} <Link className="font-bold text-primary hover:underline" href={registering ? "/login" : "/register"}>{registering ? "Sign in" : "Create an account"}</Link></p></form>;
}
