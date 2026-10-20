import { redirect } from "next/navigation";
import { getLearnerSnapshotAction } from "@/app/actions/learner";
import { contactEmail, isBetaMode } from "@/config/product";
import { BetaRedeemForm } from "@/features/beta/beta-redeem-form";
import { getMessages } from "@/i18n/server";
import { resolveOnboardingDestination } from "@/lib/domain/onboarding";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const t = await getMessages();
  return { title: t.metadata.beta, robots: { index: false } };
}

export default async function BetaPage() {
  if (!isBetaMode()) redirect("/dashboard");

  const result = await getLearnerSnapshotAction();
  if (!result.ok && result.reason === "unauthenticated")
    redirect(`/login?next=${encodeURIComponent("/beta")}`);
  if (result.ok) {
    const destination = resolveOnboardingDestination(result.snapshot);
    if (destination !== "/beta") redirect(destination);
  }

  // A code entered at sign-up is redeemed automatically once the email is confirmed.
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const pendingCode = data.user?.user_metadata?.beta_invite_code;

  return (
    <div className="container-page py-16">
      <BetaRedeemForm
        pendingCode={typeof pendingCode === "string" ? pendingCode : undefined}
        contactEmail={contactEmail()}
        loadError={
          result.ok
            ? undefined
            : { message: result.message, reference: result.reference }
        }
      />
    </div>
  );
}
