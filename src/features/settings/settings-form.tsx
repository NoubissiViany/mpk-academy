"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateExamGoalAction,
  updateProfileAction,
} from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email(),
  locale: z.enum(["en", "fr"]),
  assistance: z.enum(["full", "on_request", "minimal"]),
  exam: z.enum(["TEF Canada", "TCF Canada"]),
  target: z.enum(["NCLC 5", "NCLC 7", "NCLC 9+", "I'm not sure"]),
  targetDate: z.string().optional(),
});
type Values = z.infer<typeof schema>;
const select =
  "mt-2 min-h-11 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15";
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}
export function SettingsForm() {
  const { state, replaceState } = useApp();
  const user = state.user;
  const activeExam =
    user?.goal.exam === "TCF Canada" ? "TCF Canada" : "TEF Canada";
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? "Alex",
      lastName: user?.lastName ?? "Morgan",
      email: user?.email ?? "alex@demo.mpk",
      locale: user?.locale ?? "en",
      assistance: user?.assistance ?? "full",
      exam: activeExam,
      target: user?.goal.target ?? "NCLC 7",
      targetDate: user?.goal.targetDate ?? "",
    },
  });
  useEffect(() => {
    if (user)
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        locale: user.locale,
        assistance: user.assistance,
        exam: user.goal.exam === "TCF Canada" ? "TCF Canada" : "TEF Canada",
        target: user.goal.target,
        targetDate: user.goal.targetDate ?? "",
      });
  }, [user, form]);
  const submit = async (values: Values) => {
    if (!user) return;
    const profileResult = await updateProfileAction({
      firstName: values.firstName,
      lastName: values.lastName,
      locale: values.locale,
      assistance: values.assistance,
    });
    if (!profileResult.ok) {
      toast.error(profileResult.message);
      return;
    }
    const goalResult = await updateExamGoalAction({
      exam: values.exam,
      target: values.target,
      targetDate: values.targetDate,
    });
    if (!goalResult.ok) {
      toast.error(goalResult.message);
      return;
    }
    replaceState(goalResult.snapshot);
    toast.success(`${values.exam} dashboard activated`);
  };
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-8">
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <h2 className="text-lg font-bold">Profile</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="First name">
            <Input className="mt-2" {...form.register("firstName")} />
          </Field>
          <Field label="Last name">
            <Input className="mt-2" {...form.register("lastName")} />
          </Field>
          <Field label="Email">
            <Input
              className="mt-2"
              type="email"
              readOnly
              aria-describedby="email-help"
              {...form.register("email")}
            />
            <span
              id="email-help"
              className="mt-1 block text-xs font-normal text-muted-foreground"
            >
              Email changes are managed through account security.
            </span>
          </Field>
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <h2 className="text-lg font-bold">Learning preferences</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          These choices affect instruction and correction. Exam Mode always
          remains French-first.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Instructional support language">
            <select className={select} {...form.register("locale")}>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </Field>
          <Field label="English assistance">
            <select className={select} {...form.register("assistance")}>
              <option value="full">Full support</option>
              <option value="on_request">Only when requested</option>
              <option value="minimal">Minimal support</option>
            </select>
          </Field>
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <h2 className="text-lg font-bold">Exam goal</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Switching activates that exam&apos;s independent dashboard. Your other
          exam history is preserved.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Field label="Exam">
            <select className={select} {...form.register("exam")}>
              <option>TEF Canada</option>
              <option>TCF Canada</option>
            </select>
          </Field>
          <Field label="NCLC target">
            <select className={select} {...form.register("target")}>
              <option>NCLC 5</option>
              <option>NCLC 7</option>
              <option>NCLC 9+</option>
              <option>{"I'm not sure"}</option>
            </select>
          </Field>
          <Field label="Target date (optional)">
            <Input
              className="mt-2"
              type="date"
              {...form.register("targetDate")}
            />
          </Field>
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <h2 className="text-lg font-bold">Account & privacy</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your profile and learning progress are stored securely in your
          account. Account export and deletion controls will be added before
          general availability.
        </p>
      </section>
      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
