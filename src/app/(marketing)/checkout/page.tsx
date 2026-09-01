import { CheckoutView } from "@/features/checkout/checkout-view";
export const metadata = { title: "Checkout", robots: { index: false } };
export default function CheckoutPage() { return <div className="container-page py-14"><CheckoutView /></div>; }
