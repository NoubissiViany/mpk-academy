import { CheckoutView } from "@/features/checkout/checkout-view";
import { getPaidPlan, isBetaMode } from "@/config/product";
import { notFound, redirect } from "next/navigation";
export const metadata = { title: "Checkout", robots: { index: false } };
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  if (isBetaMode()) notFound();
  const plan = getPaidPlan((await searchParams).plan);
  if (!plan) redirect("/choose-plan");
  return (
    <div className="container-page py-14">
      <CheckoutView plan={plan} />
    </div>
  );
}
