import Link from "next/link";
import { Clock3, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CheckoutSuccessView({
  status,
  retryHref,
}: {
  status: "pending" | "invalid";
  retryHref?: string;
}) {
  const pending = status === "pending";
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="py-12 text-center">
        {pending ? (
          <Clock3 className="mx-auto size-12 text-primary" />
        ) : (
          <ShieldAlert className="mx-auto size-12 text-danger" />
        )}
        <h1 className="mt-5 text-2xl font-bold">
          {pending ? "Payment confirmation pending" : "Payment not confirmed"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {pending
            ? "Stripe is still confirming this payment. Retry in a moment; access will be granted only after confirmation."
            : "This checkout session could not be verified for your account. No access was granted."}
        </p>
        {pending && retryHref ? (
          <Button asChild className="mt-7">
            <Link href={retryHref}>Check payment again</Link>
          </Button>
        ) : (
          <Button asChild className="mt-7">
            <Link href="/choose-plan">Choose a plan</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
