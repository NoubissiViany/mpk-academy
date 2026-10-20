"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  requestPasswordResetAction,
  updatePasswordAction,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await requestPasswordResetAction(email);
        setPending(false);
        if (!result.ok) return toast.error(result.message);
        setSent(true);
      }}
    >
      {sent ? (
        <p className="rounded-xl bg-primary/10 p-4 text-sm leading-6">
          {t.auth.forgot.sent}
        </p>
      ) : (
        <>
          <label className="block text-sm font-semibold">
            {t.auth.form.email}
            <Input
              className="mt-2"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <Button className="w-full" disabled={pending}>
            {pending ? t.auth.forgot.sending : t.auth.forgot.submit}
          </Button>
        </>
      )}
    </form>
  );
}

export function UpdatePasswordForm() {
  const router = useRouter();
  const { t } = useI18n();
  const copy = t.auth.update;
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await updatePasswordAction(password);
        setPending(false);
        if (!result.ok) return toast.error(result.message);
        toast.success(copy.updated);
        router.replace("/dashboard");
        router.refresh();
      }}
    >
      <label className="block text-sm font-semibold">
        {copy.label}
        <Input
          className="mt-2"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <p className="text-xs text-muted-foreground">{copy.hint}</p>
      <Button className="w-full" disabled={pending}>
        {pending ? copy.updating : copy.submit}
      </Button>
    </form>
  );
}
