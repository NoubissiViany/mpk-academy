const en = {
  hero: {
    badge: "French for Canadian immigration",
    titleStart: "Prepare for TEF/TCF with a plan built around ",
    titleHighlight: "your weakest skill.",
    lead: "Learn with explanations in English or French, strengthen the skills holding you back, then practise in a French-first exam environment.",
    primary: "Start free assessment",
    secondary: "How it works",
    secondaryPaid: "Explore plans",
    facts: "Free · 20 questions · About 12–15 minutes · No card required",
  },
  sample: {
    eyebrow: "Try four questions",
    title: "See how MPK practice works",
    progress: (current: number, total: number) => `${current} / ${total}`,
    check: "Check answer",
    next: "Next question",
    scoreTitle: (correct: number, total: number) =>
      `${correct} of ${total} correct`,
    scoreBody:
      "Four questions can't place you. The free assessment estimates your level and finds the skill to work on first.",
    cta: "Take the free assessment",
    restart: "Try again",
    note: "Original MPK practice items · not official TEF/TCF questions",
  },
  differences: {
    eyebrow: "Why MPK is different",
    title: "Clarity while learning. Independence when it counts.",
    items: [
      {
        title: "Explanations in your language",
        copy: "Understand instructions and corrections clearly in English or French, while the exam content stays in French.",
      },
      {
        title: "A plan built from evidence",
        copy: "MPK tracks the competencies and mistake patterns behind each answer — not only a total score.",
      },
      {
        title: "Your weakest skill first",
        copy: "Your eligibility depends on every skill, so recommendations focus on the one holding you back.",
      },
    ],
  },
  skills: {
    eyebrow: "Four exam skills",
    title: "Prepare for every part of your exam",
    items: {
      reading: "Understand texts, identify details and infer meaning.",
      listening: "Follow conversations and identify key information.",
      writing: "Structure ideas and communicate clearly.",
      speaking: "Express, explain and defend ideas.",
    },
  },
  modes: {
    eyebrow: "Three deliberate modes",
    title: "Support decreases as performance becomes the goal.",
    items: [
      {
        label: "Learning Mode",
        title: "Learn with support",
        copy: "French examples, clear explanations, and guided checkpoints.",
      },
      {
        label: "Practice Mode",
        title: "Apply what you learned",
        copy: "Immediate feedback in reading and listening, guided self-review in writing and speaking.",
      },
      {
        label: "Exam Mode",
        title: "Perform independently",
        copy: "Timed, French-first simulations without hints or corrections until the end.",
      },
    ],
  },
  journey: {
    eyebrow: "How it works",
    title: "One learning journey, built around your results.",
    lead: "Move from assessment to focused learning, realistic practice, and a clear next step.",
    steps: [
      {
        title: "Assess",
        copy: "Understand where you are and identify the skills holding you back.",
      },
      {
        title: "Learn",
        copy: "Get clear explanations and targeted lessons for your weaknesses.",
      },
      {
        title: "Practise",
        copy: "Train each skill in the format of your exam, with feedback where it can be measured.",
      },
      {
        title: "Simulate",
        copy: "Rehearse under timed conditions that follow the official structure.",
      },
      {
        title: "Adapt",
        copy: "MPK uses your results and mistakes to recommend what to work on next.",
      },
    ],
  },
  beta: {
    eyebrow: "Closed beta",
    title: "Free for invited testers during the beta.",
    body: "MPK Academy is currently tested by a small group of learners. Testers get the full program at no cost and help shape it with their feedback.",
    cta: "I have an invite code",
    contact: (email: string) => `Want to join? Email ${email}.`,
    contactFallback:
      "Invite codes are shared directly with testers while seats are limited.",
  },
  plans: {
    eyebrow: "The complete program",
    title: "Choose the support that fits your goal.",
    lead: "Start with the free assessment, then continue with the plan that matches your preparation needs.",
    note: "Prices are in CAD before applicable tax. Secure one-time payment is handled by Stripe.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions before you begin",
    items: [
      {
        q: "Is MPK an official TEF/TCF provider?",
        a: "No. MPK Academy provides independent preparation material and does not administer or represent either exam.",
      },
      {
        q: "Will MPK predict my official score?",
        a: "No. MPK results are internal preparation indicators based only on your activity in the platform.",
      },
      {
        q: "Can I learn with explanations in English or French?",
        a: "Yes. The interface and explanations are available in English and French. Exam Mode remains French-first, like the real exam.",
      },
    ],
    beta: {
      q: "Is it free?",
      a: "The assessment is free for everyone. During the closed beta, invited testers also get the full program for free.",
    },
    paid: {
      q: "Is this a subscription?",
      a: "No. Paid plans are one-time purchases with time-limited access.",
    },
  },
  final: {
    title: "Find the skill holding you back.",
    body: "Take the free assessment and leave with a clear starting point.",
    cta: "Start free assessment",
  },
};

const fr: typeof en = {
  hero: {
    badge: "Le français pour l’immigration au Canada",
    titleStart: "Préparez le TEF/TCF avec un plan centré sur ",
    titleHighlight: "votre compétence la plus faible.",
    lead: "Apprenez avec des explications en français ou en anglais, renforcez les compétences qui vous freinent, puis entraînez-vous dans un environnement d’examen en français.",
    primary: "Commencer l’évaluation gratuite",
    secondary: "Fonctionnement",
    secondaryPaid: "Voir les formules",
    facts:
      "Gratuit · 20 questions · Environ 12 à 15 minutes · Sans carte bancaire",
  },
  sample: {
    eyebrow: "Essayez quatre questions",
    title: "Découvrez l’entraînement MPK",
    progress: (current: number, total: number) => `${current} / ${total}`,
    check: "Vérifier la réponse",
    next: "Question suivante",
    scoreTitle: (correct: number, total: number) =>
      `${correct} bonne${correct > 1 ? "s" : ""} réponse${correct > 1 ? "s" : ""} sur ${total}`,
    scoreBody:
      "Quatre questions ne suffisent pas pour vous situer. L’évaluation gratuite estime votre niveau et repère la compétence à travailler en premier.",
    cta: "Faire l’évaluation gratuite",
    restart: "Recommencer",
    note: "Questions d’entraînement originales MPK · ce ne sont pas des questions officielles du TEF/TCF",
  },
  differences: {
    eyebrow: "Pourquoi MPK est différent",
    title: "De la clarté pour apprendre. De l’autonomie pour réussir.",
    items: [
      {
        title: "Des explications dans votre langue",
        copy: "Comprenez les consignes et les corrections en français ou en anglais, tandis que le contenu d’examen reste en français.",
      },
      {
        title: "Un plan fondé sur vos résultats",
        copy: "MPK suit les compétences et les erreurs récurrentes derrière chaque réponse — pas seulement un score global.",
      },
      {
        title: "Votre point faible d’abord",
        copy: "Votre admissibilité dépend de chaque compétence : les recommandations ciblent celle qui vous freine.",
      },
    ],
  },
  skills: {
    eyebrow: "Quatre compétences d’examen",
    title: "Préparez chaque épreuve de votre examen",
    items: {
      reading: "Comprendre des textes, repérer les détails et déduire le sens.",
      listening:
        "Suivre des conversations et repérer les informations essentielles.",
      writing: "Structurer ses idées et communiquer clairement.",
      speaking: "Exprimer, expliquer et défendre ses idées.",
    },
  },
  modes: {
    eyebrow: "Trois modes complémentaires",
    title: "L’aide diminue à mesure que la performance devient l’objectif.",
    items: [
      {
        label: "Mode Apprentissage",
        title: "Apprendre avec du soutien",
        copy: "Des exemples en français, des explications claires et des points de contrôle guidés.",
      },
      {
        label: "Mode Entraînement",
        title: "Mettre en pratique",
        copy: "Correction immédiate en compréhension écrite et orale, autoévaluation guidée en expression écrite et orale.",
      },
      {
        label: "Mode Examen",
        title: "Réussir en autonomie",
        copy: "Des simulations chronométrées en français, sans indice ni correction avant la fin.",
      },
    ],
  },
  journey: {
    eyebrow: "Fonctionnement",
    title: "Un seul parcours, construit à partir de vos résultats.",
    lead: "Passez de l’évaluation à un apprentissage ciblé, à un entraînement réaliste et à une prochaine étape claire.",
    steps: [
      {
        title: "Évaluer",
        copy: "Situez votre niveau et repérez les compétences qui vous freinent.",
      },
      {
        title: "Apprendre",
        copy: "Des explications claires et des leçons ciblées sur vos faiblesses.",
      },
      {
        title: "S’entraîner",
        copy: "Travaillez chaque compétence au format de votre examen, avec une correction là où elle est mesurable.",
      },
      {
        title: "Simuler",
        copy: "Répétez en conditions chronométrées qui suivent la structure officielle.",
      },
      {
        title: "Ajuster",
        copy: "MPK utilise vos résultats et vos erreurs pour recommander la suite.",
      },
    ],
  },
  beta: {
    eyebrow: "Bêta fermée",
    title: "Gratuit pour les testeurs invités pendant la bêta.",
    body: "MPK Academy est actuellement testé par un petit groupe d’apprenants. Les testeurs ont accès gratuitement à tout le programme et aident à l’améliorer grâce à leurs commentaires.",
    cta: "J’ai un code d’invitation",
    contact: (email: string) => `Vous voulez participer ? Écrivez à ${email}.`,
    contactFallback:
      "Les codes d’invitation sont remis directement aux testeurs tant que les places sont limitées.",
  },
  plans: {
    eyebrow: "Le programme complet",
    title: "Choisissez l’accompagnement adapté à votre objectif.",
    lead: "Commencez par l’évaluation gratuite, puis poursuivez avec la formule qui correspond à vos besoins.",
    note: "Prix en dollars canadiens, taxes applicables en sus. Le paiement unique et sécurisé est traité par Stripe.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions avant de commencer",
    items: [
      {
        q: "MPK est-il un organisme officiel du TEF/TCF ?",
        a: "Non. MPK Academy propose du matériel de préparation indépendant et n’administre ni ne représente aucun de ces examens.",
      },
      {
        q: "MPK peut-il prédire mon résultat officiel ?",
        a: "Non. Les résultats MPK sont des indicateurs de préparation internes, fondés uniquement sur votre activité dans la plateforme.",
      },
      {
        q: "Puis-je avoir les explications en français ou en anglais ?",
        a: "Oui. L’interface et les explications sont offertes en français et en anglais. Le mode Examen reste en français, comme l’examen réel.",
      },
    ],
    beta: {
      q: "Est-ce gratuit ?",
      a: "L’évaluation est gratuite pour tous. Pendant la bêta fermée, les testeurs invités ont aussi accès gratuitement à tout le programme.",
    },
    paid: {
      q: "S’agit-il d’un abonnement ?",
      a: "Non. Les formules payantes sont des achats uniques avec un accès limité dans le temps.",
    },
  },
  final: {
    title: "Trouvez la compétence qui vous freine.",
    body: "Faites l’évaluation gratuite et repartez avec un point de départ clair.",
    cta: "Commencer l’évaluation gratuite",
  },
};

export const landing = { en, fr };
