"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

export function AdminSubmitButton({
  pendingLabel,
  children,
  disabled,
  ...props
}: ButtonProps & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending && (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      )}
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function CopyInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
      toast.error("Could not copy the code. Select it and copy it manually.");
    }
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Copy invitation code ${code}`}
        title="Copy invitation code"
        onClick={copy}
      >
        {copied ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
      </Button>
      <span role="status" className="font-sans text-xs">
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}
