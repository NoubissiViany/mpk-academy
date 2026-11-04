import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { PlanComparison } from "@/components/plan-comparison";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contactEmail, isBetaMode } from "@/config/product";
import { TrackFunnelStep } from "@/components/track-funnel-step";
import { SampleQuiz } from "@/features/marketing/sample-quiz";
import { getMessages } from "@/i18n/server";
import { ProductPreview } from "@/features/marketing/product-preview";
import { diagnosticTotalMinutes } from "@/lib/domain/diagnostic";
import {
  getPublicDiagnosticQuestions,
  getPublicSampleQuestions,
} from "@/lib/server/content";

export async function generateMetadata() {
  return { title: { absolute: (await getMessages()).metadata.defaultTitle } };
}

export default async function HomePage() {
  const t = await getMessages();
  const copy = t.landing;
  const diagnosticCount = getPublicDiagnosticQuestions().length;
  const beta = isBetaMode();
  const email = contactEmail();
  const faq = [...copy.faq.items, beta ? copy.faq.beta : copy.faq.paid];

  return (
    <>
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div
          className="absolute -right-32 top-10 size-96 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="container-page relative grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                {copy.hero.badge}
              </Badge>
              {beta && <Badge>{t.common.betaBadge}</Badge>}
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.06] tracking-[-.04em] sm:text-6xl">
              {copy.hero.titleStart}
              <span className="text-primary">{copy.hero.titleHighlight}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              {copy.hero.lead}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/diagnostic">
                  {copy.hero.primary} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={beta ? "#how-it-works" : "/pricing"}>
                  {beta ? copy.hero.secondary : copy.hero.secondaryPaid}
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {copy.hero.facts(
                diagnosticCount,
                diagnosticTotalMinutes(diagnosticCount),
              )}
            </p>
            {beta && (
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                {t.ux.betaAccess}
              </p>
            )}
          </div>
          <SampleQuiz questions={getPublicSampleQuestions()} />
          <TrackFunnelStep step="landing_view" />
        </div>
      </section>

      <ProductPreview />
      <section
        id="how-it-works"
        className="container-page scroll-mt-20 py-12 sm:py-16"
      >
        <h2 className="text-3xl font-bold tracking-tight">
          {t.ux.preview.journeyTitle}
        </h2>
        <ol className="mt-7 grid gap-5 md:grid-cols-3">
          {t.ux.preview.steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border bg-card p-6">
              <span className="grid size-9 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {beta ? (
        <section className="border-y bg-card py-12 sm:py-16">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <p className="eyebrow mt-5">{copy.beta.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {copy.beta.title}
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                {copy.beta.body}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">{copy.beta.cta}</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/diagnostic">{copy.hero.primary}</Link>
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                {email ? copy.beta.contact(email) : copy.beta.contactFallback}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section id="plans" className="border-y bg-card py-12 sm:py-16">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">{copy.plans.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {copy.plans.title}
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                {copy.plans.lead}
              </p>
            </div>
            <div className="mt-12">
              <PlanComparison />
            </div>
            <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-5 text-muted-foreground">
              {copy.plans.note}
            </p>
          </div>
        </section>
      )}

      <section className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow text-center">{copy.faq.eyebrow}</p>
          <h2 className="mt-3 text-center text-3xl font-bold">
            {copy.faq.title}
          </h2>
          <div className="mt-10 divide-y border-y">
            {faq.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="cursor-pointer list-none font-bold">
                  {q}
                  <span
                    className="float-right text-primary group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page">
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">
            {copy.final.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 opacity-80">
            {copy.final.body}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link href="/diagnostic">
              {copy.final.cta} <ArrowRight className="size-4" />
            </Link>
          </Button>
          {beta && (
            <p className="mx-auto mt-4 max-w-xl text-sm opacity-90">
              {t.ux.betaAccess}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
