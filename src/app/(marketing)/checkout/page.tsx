import { CheckoutView } from "@/features/checkout/checkout-view";
import { getPaidPlan } from "@/config/product";
export const metadata = { title: "Checkout", robots: { index: false } };
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const plan = getPaidPlan((await searchParams).plan);
  return (
    <div className="container-page py-14">
      <CheckoutView plan={plan} />
    </div>
  );
}
