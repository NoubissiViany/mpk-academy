import { CheckoutSuccessView } from "@/features/checkout/checkout-success-view";
export const metadata = { title: "Access unlocked", robots: { index: false } };
export default function CheckoutSuccessPage() {
  return (
    <div className="container-page py-16">
      <CheckoutSuccessView />
    </div>
  );
}
