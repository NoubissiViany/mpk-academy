"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  setCheckoutIntentAction,
  signInAction,
  signUpAction,
} from "@/app/actions/auth";
import {
  claimGuestAssessmentAction,
  getLearnerSnapshotAction,
} from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isBetaMode, type OfferedPlanId } from "@/config/product";
import { useI18n } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import { resolveOnboardingDestination } from "@/lib/domain/onboarding";
import { clearAnonymousState } from "@/lib/persistence";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";

function buildSchemas(v: Messages["auth"]["validation"], beta: boolean) {
  const login = z.object({
    email: z.email(v.email),
    password: z
      .string()
      .min(8, v.passwordLength)
      .regex(/[A-Za-z]/, v.passwordLetter)
      .regex(/[0-9]/, v.passwordNumber),
  });
  const register = login.extend({
    firstName: z.string().min(2, v.firstName),
    lastName: z.string().min(2, v.lastName),
    locale: z.enum(["en", "fr"]),
    exam: z.enum(["TEF Canada", "TCF Canada"]),
    target: z.enum(["NCLC 5", "NCLC 7", "NCLC 9+", "I'm not sure"]),
    inviteCode: beta
      ? z.string().trim().min(6, v.inviteCode)
      : z.string().optional(),
    privacyConsent: z.boolean().refine(Boolean, v.consent),
  });
  return { login, register };
}
type RegisterData = z.infer<ReturnType<typeof buildSchemas>["register"]>;

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
  planId?: OfferedPlanId;
  nextPath?: string;
}) {
  const router = useRouter();
  const { state, hydrated, replaceState } = useApp();
  const { t, locale } = useI18n();
  const copy = t.auth.form;
  const beta = isBetaMode();
  const registering = mode === "register";
  const schemas = useMemo(
    () => buildSchemas(t.auth.validation, beta),
    [t, beta],
  );
  const form = useForm<RegisterData>({
    resolver: zodResolver(
      registering ? schemas.register : schemas.login,
    ) as unknown as Resolver<RegisterData>,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      locale,
      exam:
        state.diagnosticIntake?.goal === "TEF Canada" ||
        state.diagnosticIntake?.goal === "TCF Canada"
          ? state.diagnosticIntake.goal
          : "TEF Canada",
      target: state.diagnosticIntake?.target ?? "I'm not sure",
      inviteCode: "",
      privacyConsent: false,
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
      const authResult = registering
        ? await signUpAction({
            ...values,
            privacyConsent: true,
            ...(planId && !beta ? { planId } : {}),
          })
        : await signInAction({
            email: values.email,
            password: values.password,
          });
      if (!authResult.ok)
        throw new Error(
          authResult.reference
            ? t.common.errorReference(authResult.message, authResult.reference)
            : authResult.message,
        );

      if (registering && authResult.confirmationRequired) {
        router.push(
          `/auth/check-email?email=${encodeURIComponent(values.email)}`,
        );
        return;
      }

      let cloudState = null;
      if (guestSession) {
        const claimed = await claimGuestAssessmentAction(guestSession);
        if (!claimed.ok) throw new Error(claimed.message);
        cloudState = claimed.snapshot;
        await guestAssessmentRepository.clear(guestSession.id);
        clearAnonymousState();
      } else {
        const snapshotResult = await getLearnerSnapshotAction();
        if (!snapshotResult.ok)
          throw new Error(
            t.common.errorReference(
              snapshotResult.message,
              snapshotResult.reference,
            ),
          );
        cloudState = snapshotResult.snapshot;
      }

      if (!beta && !registering && planId && !cloudState.planAccess) {
        const intentResult = await setCheckoutIntentAction(planId);
        if (!intentResult.ok)
          throw new Error(
            t.common.errorReference(
              intentResult.message,
              intentResult.reference,
            ),
          );
        cloudState = {
          ...cloudState,
          checkoutIntentPlanId: intentResult.planId,
        };
      }
      replaceState(cloudState);

      toast.success(registering ? copy.accountReady : copy.welcomeBack);
      const checkoutPlanId = beta
        ? undefined
        : guestSession
          ? (cloudState.checkoutIntentPlanId ??
            planId ??
            guestSession.recommendedPlanId)
          : !registering &&
              planId &&
              cloudState.diagnosticResult &&
              !cloudState.planAccess
            ? planId
            : undefined;
      const safeNextPath =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : undefined;
      router.push(
        checkoutPlanId
          ? `/checkout?plan=${checkoutPlanId}`
          : resolveOnboardingDestination(
              cloudState,
              registering ? undefined : safeNextPath,
            ),
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : registering
            ? copy.createFailed
            : copy.signInFailed,
      );
    }
  };
  const errors = form.formState.errors;
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
      {registering && beta && (
        <Field label={copy.inviteCode} error={errors.inviteCode?.message}>
          <Input
            className="mt-2 uppercase"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={t.beta.codePlaceholder}
            {...form.register("inviteCode")}
          />
          <span className="mt-1.5 block text-xs font-normal leading-5 text-muted-foreground">
            {t.beta.registerHint}
          </span>
        </Field>
      )}
      {registering && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.firstName} error={errors.firstName?.message}>
            <Input
              className="mt-2"
              autoComplete="given-name"
              {...form.register("firstName")}
            />
          </Field>
          <Field label={copy.lastName} error={errors.lastName?.message}>
            <Input
              className="mt-2"
              autoComplete="family-name"
              {...form.register("lastName")}
            />
          </Field>
        </div>
      )}
      <Field label={copy.email} error={errors.email?.message}>
        <Input
          className="mt-2"
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
      </Field>
      <Field label={copy.password} error={errors.password?.message}>
        <Input
          className="mt-2"
          type="password"
          autoComplete={registering ? "new-password" : "current-password"}
          {...form.register("password")}
        />
      </Field>
      {registering && (
        <>
          <Field label={copy.locale}>
            <select className={selectClass} {...form.register("locale")}>
              <option value="en">{t.common.language.english}</option>
              <option value="fr">{t.common.language.french}</option>
            </select>
          </Field>
          <Field label={copy.exam}>
            <select className={selectClass} {...form.register("exam")}>
              <option value="" disabled>
                {copy.examPlaceholder}
              </option>
              <option>TEF Canada</option>
              <option>TCF Canada</option>
            </select>
            {errors.exam && (
              <span
                className="mt-1.5 block text-xs font-medium text-danger"
                role="alert"
              >
                {t.auth.validation.exam}
              </span>
            )}
          </Field>
          <Field label={copy.target}>
            <select className={selectClass} {...form.register("target")}>
              <option value="NCLC 5">NCLC 5</option>
              <option value="NCLC 7">NCLC 7</option>
              <option value="NCLC 9+">NCLC 9+</option>
              <option value="I'm not sure">{copy.targetNotSure}</option>
            </select>
          </Field>
          <div>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-primary"
                {...form.register("privacyConsent")}
              />
              <span>
                {copy.consentBefore}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-primary hover:underline"
                >
                  {copy.consentLink}
                </Link>
                {copy.consentAfter}
              </span>
            </label>
            {errors.privacyConsent && (
              <span
                className="mt-1.5 block text-xs font-medium text-danger"
                role="alert"
              >
                {errors.privacyConsent.message}
              </span>
            )}
          </div>
        </>
      )}
      <Button
        className="w-full"
        disabled={!hydrated || form.formState.isSubmitting}
      >
        {!hydrated
          ? copy.loading
          : form.formState.isSubmitting
            ? copy.submitting
            : registering
              ? copy.createAccount
              : copy.signIn}
      </Button>
      {!registering && (
        <p className="text-center text-sm">
          <Link
            className="font-semibold text-primary hover:underline"
            href="/forgot-password"
          >
            {copy.forgotPassword}
          </Link>
        </p>
      )}
      <p className="text-center text-sm text-muted-foreground">
        {registering ? copy.haveAccount : copy.newHere}{" "}
        <Link
          className="font-bold text-primary hover:underline"
          href={`${registering ? "/login" : "/register"}?${new URLSearchParams({
            ...(planId ? { plan: planId } : {}),
            ...(nextPath ? { next: nextPath } : {}),
          }).toString()}`}
        >
          {registering ? copy.signInLink : copy.createLink}
        </Link>
      </p>
    </form>
  );
}
