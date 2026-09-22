import { PlanComparison } from "@/components/plan-comparison";
import { paidPlans } from "@/config/product";

export const metadata = {
  title: "Choose your plan",
  robots: { index: false },
};

export default function ChoosePlanPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Choose your preparation plan</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Select the support that fits your goal.
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          After payment, you will complete your assessment so MPK Academy can
          prepare your starting point.
        </p>
      </div>
      <div className="mt-12">
        <PlanComparison plans={paidPlans} />
      </div>
      <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-5 text-muted-foreground">
        Approximate prices in CAD. This frontend MVP simulates payment and does
        not collect card details.
      </p>
    </div>
  );
}
