"use client";

import { useState } from "react";
import { toast } from "sonner";
import { resendConfirmationAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { withErrorReference } from "@/lib/public-error";

export function ResendConfirmation({ email }: { email: string }) {
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
          toast.success("A new confirmation email has been requested.");
          return;
        }
        toast.error(withErrorReference(result.message, result.reference));
      }}
      type="button"
    >
      {pending ? "Sending…" : "Resend confirmation email"}
    </Button>
  );
}
