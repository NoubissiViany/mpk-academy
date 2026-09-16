"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaidPlanId } from "@/config/product";
import {
  attachAssessmentToExistingState,
  createRegisteredLearnerState,
} from "@/lib/domain/onboarding";
import {
  clearAnonymousState,
  loadUserState,
  saveState,
} from "@/lib/persistence";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import { LocalAuthError, localAuthRepository } from "@/repositories/local-auth";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});
const registerSchema = loginSchema.extend({
  firstName: z.string().min(2, "Enter your first name"),
  lastName: z.string().min(2, "Enter your last name"),
  locale: z.enum(["en", "fr"]),
  exam: z.enum(["TEF Canada", "TCF Canada"]),
  target: z.enum(["NCLC 5", "NCLC 7", "NCLC 9+", "I'm not sure"]),
});
type RegisterData = z.infer<typeof registerSchema>;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
      {error && (
        <span
          className="mt-1.5 block text-xs font-medium text-danger"
          role="alert"
        >
          {error}
        </span>
      )}
    </label>
  );
}
const selectClass =
  "mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export function AuthForm({
  mode,
  planId,
  nextPath,
}: {
  mode: "login" | "register";
  planId?: PaidPlanId;
  nextPath?: string;
}) {
  const router = useRouter();
  const { state, hydrated, setState } = useApp();
  const registering = mode === "register";
  const form = useForm<RegisterData>({
    resolver: zodResolver(
      registering ? registerSchema : loginSchema,
    ) as unknown as Resolver<RegisterData>,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      locale: "en",
      exam:
        state.diagnosticIntake?.goal === "TEF Canada" ||
        state.diagnosticIntake?.goal === "TCF Canada"
          ? state.diagnosticIntake.goal
          : "TEF Canada",
      target: state.diagnosticIntake?.target ?? "I'm not sure",
    },
  });
  useEffect(() => {
    if (registering && hydrated && state.diagnosticIntake) {
      if (
        state.diagnosticIntake.goal === "TEF Canada" ||
        state.diagnosticIntake.goal === "TCF Canada"
      )
        form.setValue("exam", state.diagnosticIntake.goal);
      form.setValue("target", state.diagnosticIntake.target);
    }
  }, [form, hydrated, registering, state.diagnosticIntake]);
  const submit = async (values: RegisterData) => {
    try {
      const guestSession = await guestAssessmentRepository.getActive();
      const user = registering
        ? await localAuthRepository.register({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            locale: values.locale,
            assistance: "full",
            goal: { exam: values.exam, target: values.target },
          })
        : await localAuthRepository.login(values.email, values.password);
      const claimedSession = guestSession
        ? await guestAssessmentRepository.claim(guestSession.id, user.id)
        : null;
      const storedState = registering ? null : loadUserState(user.id);
      const restoredUser = storedState?.user ?? user;
      const nextState = registering
        ? createRegisteredLearnerState(user, claimedSession)
        : attachAssessmentToExistingState(
            storedState ?? createRegisteredLearnerState(restoredUser, null),
            restoredUser,
            claimedSession,
          );

      saveState(nextState);
      setState(nextState);
      if (claimedSession) {
        await guestAssessmentRepository.clear(claimedSession.id);
        clearAnonymousState();
      }

      toast.success(
        registering ? "Your learning plan is ready." : "Welcome back.",
      );
      const checkoutPlanId =
        planId ??
        guestSession?.recommendedPlanId ??
        (registering ? "complete" : undefined);
      router.push(
        checkoutPlanId
          ? `/checkout?plan=${checkoutPlanId}`
          : nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
            ? nextPath
            : "/dashboard",
      );
    } catch (error) {
      toast.error(
        error instanceof LocalAuthError
          ? error.message
          : registering
            ? "We could not create your account. Your assessment is still saved."
            : "We could not sign you in. Your assessment is still saved.",
      );
    }
  };
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
      {registering && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            error={form.formState.errors.firstName?.message}
          >
            <Input
              className="mt-2"
              autoComplete="given-name"
              {...form.register("firstName")}
            />
          </Field>
          <Field
            label="Last name"
            error={form.formState.errors.lastName?.message}
          >
            <Input
              className="mt-2"
              autoComplete="family-name"
              {...form.register("lastName")}
            />
          </Field>
        </div>
      )}
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input
          className="mt-2"
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message}>
        <Input
          className="mt-2"
          type="password"
          autoComplete={registering ? "new-password" : "current-password"}
          {...form.register("password")}
        />
      </Field>
      {registering && (
        <>
          <Field label="Preferred instructional language">
            <select className={selectClass} {...form.register("locale")}>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </Field>
          <Field label="What are you preparing for?">
            <select className={selectClass} {...form.register("exam")}>
              <option value="" disabled>
                Select TEF or TCF
              </option>
              <option>TEF Canada</option>
              <option>TCF Canada</option>
            </select>
            {form.formState.errors.exam && (
              <span
                className="mt-1.5 block text-xs font-medium text-danger"
                role="alert"
              >
                Choose TEF Canada or TCF Canada to continue.
              </span>
            )}
          </Field>
          <Field label="What result are you aiming for?">
            <select className={selectClass} {...form.register("target")}>
              <option>NCLC 5</option>
              <option>NCLC 7</option>
              <option>NCLC 9+</option>
              <option>{"I'm not sure"}</option>
            </select>
          </Field>
        </>
      )}
      <Button
        className="w-full"
        disabled={!hydrated || form.formState.isSubmitting}
      >
        {!hydrated
          ? "Loading account…"
          : form.formState.isSubmitting
            ? "Preparing…"
            : registering
              ? "Create my learning plan"
              : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {registering ? "Already have an account?" : "New to MPK Academy?"}{" "}
        <Link
          className="font-bold text-primary hover:underline"
          href={`${registering ? "/login" : "/register"}?${new URLSearchParams({
            ...(planId ? { plan: planId } : {}),
            ...(nextPath ? { next: nextPath } : {}),
          }).toString()}`}
        >
          {registering ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
