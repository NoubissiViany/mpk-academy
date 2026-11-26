import type {
  ReminderContext,
  ReminderDecision,
  ReminderMessage,
} from "./types";
import {
  emailParagraph,
  escapeHtml,
  renderEmailLayout,
} from "@/lib/email/layout";
export { escapeHtml } from "@/lib/email/layout";

export function renderReminder(
  c: ReminderContext,
  decision: ReminderDecision,
  options: {
    appUrl: string;
    unsubscribeUrl: string;
    from: string;
    deliveryId: string;
    beta: boolean;
  },
): ReminderMessage {
  const fr = c.locale === "fr";
  const update = decision.kind === "exam_update";
  // The dashboard's existing gates choose the next permitted activity. Explicit
  // setup links also work for accounts which have never finished onboarding.
  const path = update
    ? "/email-preferences"
    : options.beta && !c.hasAccess
      ? "/beta"
      : !c.hasDiagnostic
        ? "/diagnostic"
        : c.hasAccess
          ? "/dashboard"
          : "/diagnostic/results";
  const cta = update
    ? fr
      ? "Mettre à jour ma date"
      : "Update my exam date"
    : c.hasAccess && c.hasDiagnostic
      ? fr
        ? "Reprendre mes études"
        : "Continue studying"
      : fr
        ? "Continuer ma préparation"
        : "Continue my preparation";
  const subjects = fr
    ? {
        exam_update: "Votre date d’examen est-elle toujours à jour ?",
        countdown: `Votre examen approche : ${decision.daysLeft} jour${decision.daysLeft === 1 ? "" : "s"}`,
        behind: "Un petit pas vers votre objectif cette semaine",
        inactive: "Votre rappel d’étude MPK Academy",
      }
    : {
        exam_update: "Is your exam date still up to date?",
        countdown: `Your exam is ${decision.daysLeft} day${decision.daysLeft === 1 ? "" : "s"} away`,
        behind: "A small step toward your goal this week",
        inactive: "Your MPK Academy study reminder",
      };
  const body = fr
    ? {
        exam_update:
          "La date d’examen enregistrée dans votre compte est passée. Mettez-la à jour ou effacez-la. Vos rappels sont suspendus jusqu’à ce que cette date change.",
        countdown: `Votre examen est dans ${decision.daysLeft} jour${decision.daysLeft === 1 ? "" : "s"}. Une courte séance aujourd’hui peut vous aider à garder le rythme.`,
        behind: `Vous avez terminé ${decision.sessions} séance(s) d’entraînement cette semaine, sur les ${decision.target} recommandées par votre plan. Vous pouvez avancer à votre rythme avec la prochaine séance.`,
        inactive: c.hasDiagnostic
          ? "Cela fait quelques jours depuis votre dernière visite. Une courte séance peut vous aider à reprendre le rythme."
          : "Votre préparation vous attend. Revenez pour poursuivre la configuration de votre compte et découvrir votre prochaine étape.",
      }
    : {
        exam_update:
          "The exam date saved in your account has passed. Update or clear it when you’re ready. Your reminders are paused until that date changes.",
        countdown: `Your exam is in ${decision.daysLeft} day${decision.daysLeft === 1 ? "" : "s"}. A short session today can help you keep moving toward your goal.`,
        behind: `You have completed ${decision.sessions} practice session(s) this week, out of ${decision.target} recommended by your plan. Take the next session at your own pace.`,
        inactive: c.hasDiagnostic
          ? "It has been a few days since your last visit. A short session can help you get back into your study rhythm."
          : "Your preparation is waiting. Come back to continue setting up your account and find your next step.",
      };
  const greeting = fr
    ? `Bonjour${c.firstName ? ` ${c.firstName}` : ""},`
    : `Hi${c.firstName ? ` ${c.firstName}` : ""},`;
  const progress =
    decision.kind === "countdown"
      ? fr
        ? `Cette semaine : ${decision.sessions} séance(s) terminée(s), ${decision.target} recommandées.`
        : `This week: ${decision.sessions} session(s) completed, ${decision.target} recommended.`
      : "";
  const footer = fr
    ? "Vous recevez ce rappel selon votre activité et vos préférences MPK Academy. Se désabonner"
    : "You receive this reminder based on your activity and MPK Academy preferences. Unsubscribe";
  const url = new URL(path, options.appUrl).toString();
  const paragraphs = [greeting, body[decision.kind], progress].filter(Boolean);
  const titles = fr
    ? {
        exam_update: "Une nouvelle date d’examen ?",
        countdown: "Votre examen approche.",
        behind: "Votre progression cette semaine.",
        inactive: "Votre prochaine séance.",
      }
    : {
        exam_update: "A new exam date?",
        countdown: "Your exam is getting closer.",
        behind: "Your progress this week.",
        inactive: "Your next study session.",
      };
  const preferencesUrl = new URL(
    "/email-preferences",
    options.appUrl,
  ).toString();
  const html = renderEmailLayout({
    locale: c.locale,
    preheader: body[decision.kind],
    eyebrow: fr ? "Votre préparation" : "Your study plan",
    title: titles[decision.kind],
    contentHtml:
      [greeting, body[decision.kind]]
        .map((text) => emailParagraph(escapeHtml(text)))
        .join("") +
      (progress
        ? `<table role="presentation" class="email-panel" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0 0;background-color:#eef3ec;border:1px solid #d9ddd6;border-radius:8px"><tr><td class="email-copy" style="padding:18px 20px;font-size:15px;line-height:24px;color:#42534a">${escapeHtml(progress)}</td></tr></table>`
        : ""),
    action: { label: cta, url },
    footerHtml: `<p style="margin:0 0 10px">${fr ? "Ce rappel est lié à votre activité et aux préférences de votre compte MPK Academy." : "This reminder is based on your activity and MPK Academy account preferences."}</p><p style="margin:0"><a href="${escapeHtml(preferencesUrl)}" style="color:#12634f;text-decoration:underline">${fr ? "Gérer mes rappels" : "Manage reminders"}</a> &nbsp;·&nbsp; <a href="${escapeHtml(options.unsubscribeUrl)}" style="color:#12634f;text-decoration:underline">${fr ? "Me désabonner" : "Unsubscribe"}</a></p>`,
  });
  return {
    from: options.from,
    to: [c.email],
    subject: subjects[decision.kind],
    html,
    text: `${paragraphs.join("\n\n")}\n\n${cta}: ${url}\n\n${footer}: ${options.unsubscribeUrl}`,
    headers: {
      "List-Unsubscribe": `<${options.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    tags: [
      { name: "category", value: "study_reminder" },
      { name: "delivery_id", value: options.deliveryId },
    ],
  };
}
