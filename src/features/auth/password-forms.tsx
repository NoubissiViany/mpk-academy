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

export function ForgotPasswordForm() {
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
          If an account exists for that address, a password-reset email is on
          its way.
        </p>
      ) : (
        <>
          <label className="block text-sm font-semibold">
            Email
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
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </>
      )}
    </form>
  );
}

export function UpdatePasswordForm() {
  const router = useRouter();
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
        toast.success("Your password has been updated.");
        router.replace("/dashboard");
        router.refresh();
      }}
    >
      <label className="block text-sm font-semibold">
        New password
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
      <p className="text-xs text-muted-foreground">
        Use at least eight characters with a letter and a number.
      </p>
      <Button className="w-full" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
