import { PlanComparison } from "@/components/plan-comparison";

export const metadata = {
  title: "Pricing",
  description: "Flexible one-time pricing for MPK Academy.",
};

export default function PricingPage() {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Plans for every goal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Start free. Continue with a plan built for your target.
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Take the assessment first and MPK will recommend a plan based on the
          result you are working toward. Every paid option is a one-time
          purchase.
        </p>
      </div>
      <div className="mt-12">
        <PlanComparison />
      </div>
      <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-5 text-muted-foreground">
        Prices are in CAD before applicable tax. Secure one-time payment is
        handled by Stripe. MPK Academy does not guarantee an exam score or
        immigration outcome.
      </p>
    </div>
  );
}
