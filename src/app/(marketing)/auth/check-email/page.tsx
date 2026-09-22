import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Confirm your email" };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="eyebrow">One more step</p>
          <h1 className="mt-3 text-3xl font-bold">Check your email.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            We sent a confirmation link{email ? ` to ${email}` : ""}. Open it in
            this browser to activate your account and securely attach any saved
            assessment.
          </p>
          <Button asChild className="mt-7 w-full" variant="secondary">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
