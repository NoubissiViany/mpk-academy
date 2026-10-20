import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLearnerSnapshotAction } from "@/app/actions/learner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMessages } from "@/i18n/server";
import { getOnboardingStage } from "@/lib/domain/onboarding";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getLearnerSnapshotAction();
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");

  if (!result.ok) {
    const copy = (await getMessages()).account.layoutError;
    return (
      <div className="container-page py-20">
        <Card className="mx-auto max-w-xl">
          <CardContent className="pt-6 text-center">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold">{copy.title}</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {copy.body}
            </p>
            <p className="mt-4 rounded-xl bg-muted px-4 py-3 font-mono text-xs">
              {copy.reference(result.reference)}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard">{copy.retry}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/login">{copy.signIn}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onboardingStage = getOnboardingStage(result.snapshot);
  if (onboardingStage === "beta_access") redirect("/beta");
  if (onboardingStage === "assessment") redirect("/diagnostic");
  if (onboardingStage === "results_checkout") redirect("/diagnostic/results");

  return <AppShell initialState={result.snapshot}>{children}</AppShell>;
}
