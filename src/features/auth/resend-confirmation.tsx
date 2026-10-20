"use client";

import { useState } from "react";
import { toast } from "sonner";
import { resendConfirmationAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function ResendConfirmation({ email }: { email: string }) {
  const { t } = useI18n();
  const copy = t.auth.checkEmail;
  const [pending, setPending] = useState(false);

  return (
    <Button
      className="mt-7 w-full"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await resendConfirmationAction(email);
        setPending(false);
        if (result.ok) {
          toast.success(copy.resent);
          return;
        }
        toast.error(
          result.reference
            ? t.common.errorReference(result.message, result.reference)
            : result.message,
        );
      }}
      type="button"
    >
      {pending ? copy.sending : copy.resend}
    </Button>
  );
}
