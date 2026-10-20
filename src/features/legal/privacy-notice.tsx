import type { Locale } from "@/types/domain";

// Describes current behaviour only. Update this notice, and bump
// `privacyNoticeVersion`, before adding third-party analytics, AI feedback,
// or recordings. First-party funnel counts are described under "collect".

type Section = { title: string; paragraphs?: string[]; items?: string[] };
type Notice = {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
};

function notice(locale: Locale, contact: string): Notice {
  if (locale === "fr")
    return {
      title: "Avis de confidentialité",
      updated: "Dernière mise à jour : 19 octobre 2026",
      intro:
        "MPK Academy est un outil indépendant de préparation au TEF Canada et au TCF Canada, actuellement en bêta fermée. Cet avis explique quels renseignements nous recueillons, pourquoi, et comment vous pouvez les contrôler.",
      sections: [
        {
          title: "Ce que nous recueillons",
          items: [
            "Compte : prénom, nom, adresse courriel et mot de passe (le mot de passe est géré par notre fournisseur d’authentification ; nous ne le voyons jamais).",
            "Objectif : l’examen visé, l’objectif NCLC, la date visée et votre langue préférée.",
            "Apprentissage : vos réponses à l’évaluation et aux exercices, vos résultats, vos erreurs, votre progression dans les leçons et les textes que vous enregistrez en expression écrite.",
            "Bêta : le code d’invitation utilisé et la période d’accès.",
            "Technique : des témoins essentiels (session de connexion et langue) et, en cas d’erreur, une référence technique sans le contenu de vos réponses ni votre mot de passe.",
            "Statistiques de fréquentation : nous comptons combien de visiteurs atteignent quelques étapes clés (par exemple, commencer l’évaluation), sous forme de totaux quotidiens par langue qui ne vous identifient jamais. Un repère enregistré dans votre navigateur évite seulement de vous compter deux fois le même jour. Les navigateurs qui envoient le signal « Do Not Track » ou « Global Privacy Control » ne sont pas comptés.",
          ],
        },
        {
          title: "Ce que nous ne faisons pas",
          items: [
            "Nous n’enregistrons pas votre voix. L’expression orale est un auto-entraînement sans enregistrement.",
            "Nous n’utilisons pas de témoins publicitaires et ne vendons pas vos renseignements.",
            "Nous n’envoyons pas vos réponses à un service d’intelligence artificielle. Si nous ajoutons une correction par IA, nous mettrons cet avis à jour et vous demanderons votre accord avant toute utilisation.",
          ],
        },
        {
          title: "Pourquoi nous les utilisons",
          paragraphs: [
            "Pour créer et sécuriser votre compte, calculer vos résultats, recommander vos prochaines activités, vous envoyer les courriels liés au compte (confirmation, réinitialisation du mot de passe) et corriger les problèmes techniques.",
          ],
        },
        {
          title: "Où sont stockées vos données",
          paragraphs: [
            "Vos données sont stockées chez Supabase (base de données et authentification). Le site est hébergé par Vercel et les courriels du compte sont envoyés par Resend. Ces fournisseurs peuvent traiter des données à l’extérieur du Canada.",
          ],
        },
        {
          title: "Conservation",
          items: [
            "Vos données d’apprentissage sont conservées tant que votre compte existe.",
            "Les références d’erreurs techniques sont supprimées automatiquement après 30 jours.",
            "À la fin de la bêta, nous vous informerons avant toute modification de vos données ou de votre accès.",
          ],
        },
        {
          title: "Vos droits",
          paragraphs: [
            `Vous pouvez demander l’accès à vos renseignements, leur correction ou la suppression de votre compte et de vos données en écrivant à ${contact}. Nous répondons dans un délai de 30 jours.`,
          ],
        },
        {
          title: "Ce que MPK Academy n’est pas",
          paragraphs: [
            "MPK Academy n’est ni un organisme officiel du TEF ou du TCF, ni un conseiller en immigration. Nos résultats sont des indicateurs d’entraînement et ne prédisent aucun résultat officiel.",
          ],
        },
      ],
    };
  return {
    title: "Privacy notice",
    updated: "Last updated: October 19, 2026",
    intro:
      "MPK Academy is an independent TEF Canada and TCF Canada preparation tool, currently in a closed beta. This notice explains what we collect, why, and how you control it.",
    sections: [
      {
        title: "What we collect",
        items: [
          "Account: first name, last name, email address, and password (your password is handled by our authentication provider; we never see it).",
          "Goal: your target exam, NCLC target, target date, and preferred language.",
          "Learning: your assessment and practice answers, results, mistakes, lesson progress, and any writing you save in practice.",
          "Beta: the invite code you used and your access period.",
          "Technical: essential cookies (sign-in session and language) and, when something fails, a technical reference that never includes your answers or password.",
          "Usage counts: we count how many visitors reach a few key steps (for example, starting the assessment), as daily totals per language that never identify you. A marker stored in your browser only prevents counting you twice on the same day. Browsers that send Do Not Track or Global Privacy Control are not counted.",
        ],
      },
      {
        title: "What we don't do",
        items: [
          "We do not record your voice. Speaking practice is self-practice without recording.",
          "We do not use advertising cookies and we do not sell your information.",
          "We do not send your answers to an AI service. If we add AI feedback, we will update this notice and ask for your agreement before it is used.",
        ],
      },
      {
        title: "Why we use it",
        paragraphs: [
          "To create and secure your account, calculate your results, recommend your next activities, send account emails (confirmation, password reset), and fix technical problems.",
        ],
      },
      {
        title: "Where your data is stored",
        paragraphs: [
          "Your data is stored with Supabase (database and authentication). The site is hosted by Vercel, and account emails are sent by Resend. These providers may process data outside Canada.",
        ],
      },
      {
        title: "How long we keep it",
        items: [
          "Learning data is kept for as long as your account exists.",
          "Technical error references are deleted automatically after 30 days.",
          "When the beta ends, we will tell you before anything changes to your data or access.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          `You can ask to access or correct your information, or to delete your account and data, by emailing ${contact}. We reply within 30 days.`,
        ],
      },
      {
        title: "What MPK Academy is not",
        paragraphs: [
          "MPK Academy is not an official TEF or TCF organization or an immigration adviser. Our results are practice indicators and do not predict official scores.",
        ],
      },
    ],
  };
}

export function PrivacyNotice({
  locale,
  contactEmail,
}: {
  locale: Locale;
  contactEmail: string | null;
}) {
  const fallback =
    locale === "fr"
      ? "l’adresse qui vous a envoyé votre invitation"
      : "the address that sent your invite";
  const content = notice(locale, contactEmail ?? fallback);
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight">{content.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{content.updated}</p>
      <p className="mt-6 text-lg leading-8">{content.intro}</p>
      {content.sections.map((section) => (
        <section key={section.title} className="mt-9">
          <h2 className="text-xl font-bold">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
