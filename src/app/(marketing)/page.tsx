import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Brain,
  Headphones,
  Languages,
  Mic2,
  PenLine,
  ShieldCheck,
  Target,
} from "lucide-react";
import { PlanComparison } from "@/components/plan-comparison";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const differences = [
  {
    icon: Languages,
    title: "English support, precisely when useful",
    copy: "Understand instructions and corrections clearly, then gradually reduce support as your confidence grows.",
  },
  {
    icon: Brain,
    title: "A plan built from evidence",
    copy: "MPK tracks the competencies and mistake patterns behind each answer—not only a total score.",
  },
  {
    icon: Target,
    title: "Always know what to do next",
    copy: "Recommendations connect your recent performance to one focused lesson, practice set, or simulation.",
  },
];
const examSkills = [
  {
    icon: BookOpen,
    title: "Reading",
    copy: "Understand texts, identify details and infer meaning.",
  },
  {
    icon: Headphones,
    title: "Listening",
    copy: "Follow conversations and identify key information.",
  },
  {
    icon: PenLine,
    title: "Writing",
    copy: "Structure ideas and communicate clearly.",
  },
  {
    icon: Mic2,
    title: "Speaking",
    copy: "Express, explain and defend ideas.",
  },
];
const modes = [
  {
    icon: BookOpenCheck,
    label: "Learning Mode",
    title: "Learn with support",
    copy: "French examples, clear explanations, vocabulary, and guided checkpoints.",
  },
  {
    icon: Target,
    label: "Practice Mode",
    title: "Apply what you learned",
    copy: "Focused questions, immediate feedback, and mistake-aware review.",
  },
  {
    icon: ShieldCheck,
    label: "Exam Mode",
    title: "Perform independently",
    copy: "Timed, French-first simulations without hints or in-attempt correction.",
  },
];
const learningJourney = [
  {
    title: "Assess",
    copy: "Understand where you are and identify the skills holding you back.",
  },
  {
    title: "Learn",
    copy: "Get clear explanations and targeted lessons for your weaknesses.",
  },
  {
    title: "Practice",
    copy: "Train Reading, Listening, Writing and Speaking with immediate feedback.",
  },
  {
    title: "Simulate",
    copy: "Practice under realistic TEF/TCF conditions without learning assistance.",
  },
  {
    title: "Adapt",
    copy: "MPK uses your results to recommend what you should work on next.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute -right-32 top-10 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="container-page relative grid items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <Badge className="border-primary/20 bg-primary/10 text-primary">
              French for Canadian immigration
            </Badge>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.04] tracking-[-.045em] sm:text-6xl">
              Prepare for TEF/TCF with a plan built around{" "}
              <span className="text-primary">your weaknesses.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Learn French with English explanations when you need them,
              strengthen the skills holding you back, then transition into an
              authentic French-first exam environment.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/diagnostic">
                  Start free assessment <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/pricing">Explore plans</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free · 15 questions · About 10 minutes · No card required
            </p>
          </div>
          <Card className="relative overflow-hidden border-primary/15 bg-card/90 p-2">
            <div className="rounded-xl bg-ink p-6 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/60">
                Your next best action
              </p>
              <span className="mt-6 grid size-12 place-items-center rounded-full bg-white/10">
                <Headphones />
              </span>
              <h2 className="mt-5 text-2xl font-bold">
                Practice listening for detail
              </h2>
              <p className="mt-3 leading-7 text-white/70">
                You missed 5 of your last 8 questions involving specific
                details.
              </p>
              <div className="mt-7 rounded-xl bg-white/10 p-4">
                <div className="flex justify-between text-sm">
                  <span>MPK Readiness</span>
                  <strong>72%</strong>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[72%] rounded-full bg-[#74dab8]" />
                </div>
                <p className="mt-3 text-xs text-white/55">
                  Preparation indicator · not an official TEF/TCF score
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
      <section className="container-page py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Why MPK is different</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Clarity while learning. Independence when it counts.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {differences.map(({ icon: Icon, title, copy }) => (
            <Card key={title}>
              <CardContent className="pt-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {copy}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="border-y bg-card py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Four exam skills</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Prepare for every part of your exam
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {examSkills.map(({ icon: Icon, title, copy }) => (
              <Card key={title}>
                <CardContent className="flex gap-4 pt-6 sm:gap-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {copy}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-ink py-24 text-white">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#74dab8]">
              Three deliberate modes
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Support decreases as performance becomes the goal.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {modes.map(({ icon: Icon, label, title, copy }, index) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[.05] p-6"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-6 text-[#74dab8]" />
                  <span className="text-xs text-white/45">0{index + 1}</span>
                </div>
                <p className="mt-8 text-xs font-bold uppercase tracking-wider text-white/50">
                  {label}
                </p>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="how-it-works" className="container-page py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One learning journey, built around your results.
          </h2>
          <p className="mt-5 leading-7 text-muted-foreground">
            Move from assessment to focused learning, realistic practice, and a
            clear next step.
          </p>
        </div>
        <ol className="mx-auto mt-12 max-w-3xl">
          {learningJourney.map(({ title, copy }, index) => (
            <li key={title}>
              <article className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-[3rem_1fr] sm:items-center sm:p-6">
                <span className="grid size-12 place-items-center rounded-full bg-primary text-lg font-black text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{copy}</p>
                </div>
              </article>
              {index < learningJourney.length - 1 && (
                <div
                  className="flex h-14 items-center justify-center text-primary"
                  aria-hidden="true"
                >
                  <ArrowDown className="size-6" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
      <section id="plans" className="border-y bg-card py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The complete program</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Choose the support that fits your goal.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Start with the free assessment, then continue with the plan that
              matches your preparation needs.
            </p>
          </div>
          <div className="mt-12">
            <PlanComparison />
          </div>
          <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-5 text-muted-foreground">
            Prices are in CAD before applicable tax. Secure one-time payment is
            handled by Stripe.
          </p>
        </div>
      </section>
      <section className="container-page py-24">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow text-center">FAQ</p>
          <h2 className="mt-3 text-center text-3xl font-bold">
            Questions before you begin
          </h2>
          <div className="mt-10 divide-y border-y">
            {[
              [
                "Is MPK an official TEF/TCF provider?",
                "No. MPK Academy provides independent preparation material and does not administer or represent either exam.",
              ],
              [
                "Will MPK predict my official score?",
                "No. MPK Readiness is an internal preparation indicator based only on your activity in the platform.",
              ],
              [
                "Can I learn with explanations in English?",
                "Yes. Navigation and instructional support can be English or French. Exam Mode remains French-first.",
              ],
              [
                "Is this a subscription?",
                "No. Essential, Complete, and Intensive are presented as one-time purchases in this MVP.",
              ],
            ].map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="cursor-pointer list-none font-bold">
                  {q}
                  <span className="float-right text-primary group-open:rotate-45">
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
            Find the skill holding you back.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 opacity-80">
            Take the free assessment and leave with a clear starting
            point—whether or not you join the full program.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link href="/diagnostic">
              Start free assessment <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
