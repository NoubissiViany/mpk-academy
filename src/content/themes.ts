// "Thèmes récurrents": a monthly public page of themes that keep returning in
// TEF and TCF Canada preparation, with original MPK practice prompts. Never
// copy or reconstruct real exam questions. Newest issue first.

type Bilingual = { fr: string; en: string };

export interface ThemePrompt {
  exam: "TEF" | "TCF";
  task: Bilingual;
  /** The prompt itself, in French as in the exam. */
  text: string;
}

export interface RecurringTheme {
  id: string;
  name: Bilingual;
  why: Bilingual;
  /** Useful French expressions for the theme. */
  expressions: string[];
  prompts: ThemePrompt[];
}

export interface ThemeIssue {
  /** YYYY-MM */
  month: string;
  intro: Bilingual;
  themes: RecurringTheme[];
}

const task = {
  tefWritingB: {
    fr: "TEF · Expression écrite, section B",
    en: "TEF · Writing, section B",
  },
  tefSpeakingB: {
    fr: "TEF · Expression orale, section B",
    en: "TEF · Speaking, section B",
  },
  tcfWriting3: {
    fr: "TCF · Expression écrite, tâche 3",
    en: "TCF · Writing, task 3",
  },
  tcfSpeaking2: {
    fr: "TCF · Expression orale, tâche 2",
    en: "TCF · Speaking, task 2",
  },
  tcfSpeaking3: {
    fr: "TCF · Expression orale, tâche 3",
    en: "TCF · Speaking, task 3",
  },
} satisfies Record<string, Bilingual>;

export const themeIssues: ThemeIssue[] = [
  {
    month: "2026-10",
    intro: {
      fr: "Ce mois-ci : six thèmes qui reviennent sans cesse dans la préparation au TEF Canada et au TCF Canada, avec des expressions utiles et des sujets d’entraînement rédigés par MPK. Choisissez un sujet, chronométrez-vous, puis comparez votre réponse aux conseils de la tâche.",
      en: "This month: six themes that keep coming back in TEF Canada and TCF Canada preparation, with useful French expressions and practice prompts written by MPK. Pick a prompt, time yourself, then check your answer against the task's guidance.",
    },
    themes: [
      {
        id: "teletravail",
        name: { fr: "Le télétravail", en: "Remote work" },
        why: {
          fr: "Le sujet oppose des arguments concrets (temps de trajet, isolement, équilibre de vie) : idéal pour une prise de position nuancée.",
          en: "It sets concrete arguments against each other (commuting time, isolation, work-life balance), which makes it ideal for a nuanced position.",
        },
        expressions: [
          "gagner du temps de trajet",
          "brouiller la frontière entre vie professionnelle et vie privée",
          "se sentir isolé",
          "un mode de travail hybride",
          "rester joignable en permanence",
          "garder le lien avec ses collègues",
        ],
        prompts: [
          {
            exam: "TEF",
            task: task.tefWritingB,
            text: "Un journal local affirme : « Le télétravail rend les employés plus heureux et plus efficaces. » Vous réagissez à cet article dans un courrier des lecteurs. Donnez votre opinion en au moins 200 mots, avec des arguments et des exemples.",
          },
          {
            exam: "TCF",
            task: task.tcfSpeaking3,
            text: "Selon vous, les entreprises devraient-elles laisser leurs employés choisir entre le bureau et le télétravail ? Justifiez votre réponse.",
          },
          {
            exam: "TEF",
            task: task.tefSpeakingB,
            text: "Votre collègue refuse d’essayer deux jours de télétravail par semaine : il craint de perdre le contact avec l’équipe. Vous essayez de le convaincre.",
          },
        ],
      },
      {
        id: "environnement",
        name: {
          fr: "L’environnement au quotidien",
          en: "The environment in daily life",
        },
        why: {
          fr: "Il se prête aux gestes concrets (transports, consommation, déchets) comme aux débats sur la responsabilité des citoyens et des pouvoirs publics.",
          en: "It works for concrete habits (transport, consumption, waste) as well as for debates about the responsibility of citizens and governments.",
        },
        expressions: [
          "réduire ses déchets",
          "privilégier les transports en commun",
          "acheter local",
          "les gestes du quotidien",
          "les pouvoirs publics",
          "avoir un impact réel",
        ],
        prompts: [
          {
            exam: "TCF",
            task: task.tcfWriting3,
            text: "Document 1 : « Ce sont les petits gestes de chacun qui changeront les choses. » Document 2 : « Sans décisions politiques fortes, les efforts individuels ne servent à rien. » Comparez ces deux points de vue, puis donnez votre opinion (120 à 180 mots).",
          },
          {
            exam: "TCF",
            task: task.tcfSpeaking3,
            text: "Faudrait-il interdire les voitures dans le centre des grandes villes ? Donnez votre avis avec des exemples.",
          },
          {
            exam: "TEF",
            task: task.tefSpeakingB,
            text: "Vous voulez convaincre un ami de rejoindre un jardin communautaire de votre quartier. Il pense que cela demande trop de temps.",
          },
        ],
      },
      {
        id: "ecrans",
        name: {
          fr: "Les écrans et les réseaux sociaux",
          en: "Screens and social media",
        },
        why: {
          fr: "Tout le monde a une expérience personnelle du sujet, et il oppose facilement liberté, santé et vie sociale.",
          en: "Everyone has personal experience of it, and it easily sets freedom, health and social life against each other.",
        },
        expressions: [
          "le temps passé devant les écrans",
          "les réseaux sociaux",
          "la désinformation",
          "se déconnecter",
          "fixer des limites",
          "garder un esprit critique",
        ],
        prompts: [
          {
            exam: "TEF",
            task: task.tefWritingB,
            text: "Sur un forum, quelqu’un écrit : « Il faudrait interdire les téléphones portables à l’école jusqu’à 15 ans. » Vous répondez à ce message. Donnez votre opinion en au moins 200 mots.",
          },
          {
            exam: "TCF",
            task: task.tcfSpeaking3,
            text: "Les réseaux sociaux nous rapprochent-ils vraiment des autres ? Développez votre point de vue.",
          },
          {
            exam: "TCF",
            task: task.tcfWriting3,
            text: "Document 1 : « Les écrans aident les enfants à apprendre de façon plus vivante. » Document 2 : « Les écrans empêchent les enfants de se concentrer et de jouer dehors. » Comparez ces deux opinions, puis donnez la vôtre (120 à 180 mots).",
          },
        ],
      },
      {
        id: "quartier",
        name: {
          fr: "La vie de quartier et le bénévolat",
          en: "Neighbourhood life and volunteering",
        },
        why: {
          fr: "Il touche à l’intégration et à l’entraide, deux réalités très présentes pour les nouveaux arrivants au Canada.",
          en: "It touches on integration and mutual help, two very present realities for newcomers to Canada.",
        },
        expressions: [
          "s’impliquer dans son quartier",
          "faire du bénévolat",
          "créer des liens",
          "un organisme communautaire",
          "rendre service",
          "briser l’isolement",
        ],
        prompts: [
          {
            exam: "TCF",
            task: task.tcfSpeaking2,
            text: "Vous voulez devenir bénévole dans une banque alimentaire. Votre interlocuteur en est le responsable. Posez-lui des questions sur les missions, les horaires et la formation.",
          },
          {
            exam: "TCF",
            task: task.tcfSpeaking3,
            text: "Le bénévolat devrait-il être obligatoire pour les élèves du secondaire ? Justifiez votre réponse.",
          },
          {
            exam: "TEF",
            task: task.tefSpeakingB,
            text: "Vous organisez une fête des voisins et vous voulez convaincre votre voisine d’y participer. Elle est timide et ne connaît personne.",
          },
        ],
      },
      {
        id: "apprendre",
        name: {
          fr: "Apprendre tout au long de la vie",
          en: "Lifelong learning",
        },
        why: {
          fr: "Le thème rejoint le parcours de nombreux candidats : reconversion, langues, formation à distance.",
          en: "It echoes many candidates' own path: changing careers, learning languages, studying online.",
        },
        expressions: [
          "se reconvertir",
          "suivre une formation en ligne",
          "acquérir de nouvelles compétences",
          "concilier travail et études",
          "rester motivé",
          "le marché du travail",
        ],
        prompts: [
          {
            exam: "TEF",
            task: task.tefWritingB,
            text: "Un magazine publie : « À 40 ans, il est trop tard pour changer de métier. » Vous écrivez au magazine pour réagir. Donnez votre opinion en au moins 200 mots.",
          },
          {
            exam: "TCF",
            task: task.tcfWriting3,
            text: "Document 1 : « Les cours en ligne permettent à tout le monde de se former, où qu’il soit. » Document 2 : « Sans professeur ni classe, on abandonne vite une formation. » Comparez ces deux points de vue, puis donnez votre opinion (120 à 180 mots).",
          },
          {
            exam: "TCF",
            task: task.tcfSpeaking2,
            text: "Vous voulez vous inscrire à un cours du soir de comptabilité. Votre interlocuteur travaille au centre de formation. Renseignez-vous sur le programme, le prix et les horaires.",
          },
        ],
      },
      {
        id: "logement",
        name: { fr: "Se loger en ville", en: "Housing in the city" },
        why: {
          fr: "Prix des loyers, colocation, vie en banlieue : un sujet concret où il faut peser des avantages et des inconvénients.",
          en: "Rents, flat-sharing, suburban life: a concrete subject where you have to weigh advantages and drawbacks.",
        },
        expressions: [
          "le coût du loyer",
          "vivre en colocation",
          "s’installer en banlieue",
          "le temps de trajet",
          "un logement abordable",
          "partager les tâches",
        ],
        prompts: [
          {
            exam: "TEF",
            task: task.tefSpeakingB,
            text: "Vous proposez à un ami de partager un appartement avec vous pour réduire vos dépenses. Il préfère vivre seul. Vous essayez de le convaincre.",
          },
          {
            exam: "TCF",
            task: task.tcfSpeaking3,
            text: "Vaut-il mieux habiter en centre-ville ou en banlieue quand on travaille en ville ? Développez votre opinion.",
          },
          {
            exam: "TCF",
            task: task.tcfSpeaking2,
            text: "Vous visitez un appartement à louer. Votre interlocuteur est le propriétaire. Informez-vous sur le loyer, les charges, le quartier et la date d’emménagement.",
          },
        ],
      },
    ],
  },
];
