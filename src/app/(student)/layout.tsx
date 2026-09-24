import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLearnerSnapshotAction } from "@/app/actions/learner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOnboardingStage } from "@/lib/domain/onboarding";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getLearnerSnapshotAction();
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");

  if (!result.ok)
    return (
      <div className="container-page py-20">
        <Card className="mx-auto max-w-xl">
          <CardContent className="pt-6 text-center">
            <p className="eyebrow">Account unavailable</p>
            <h1 className="mt-3 text-3xl font-bold">
              We could not load your learning profile.
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Your account is signed in, but its learning data is unavailable.
              Try again, and include the reference below if you contact support.
            </p>
            <p className="mt-4 rounded-xl bg-muted px-4 py-3 font-mono text-xs">
              Reference: {result.reference}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard">Try again</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/login">Return to sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  const onboardingStage = getOnboardingStage(result.snapshot);
  if (onboardingStage === "assessment") redirect("/diagnostic");
  if (onboardingStage === "results_checkout") redirect("/diagnostic/results");

  return <AppShell initialState={result.snapshot}>{children}</AppShell>;
}
