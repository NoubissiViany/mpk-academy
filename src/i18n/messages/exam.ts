type ExamName = "TEF Canada" | "TCF Canada";
type Format = {
  reading: string;
  listening: string;
  writing: string;
  speaking: string;
};

const en = {
  formats: {
    "TEF Canada": {
      reading: "40 multiple-choice questions · 60 minutes",
      listening: "40 multiple-choice questions · 40 minutes · one-way audio",
      writing: "2 sections · continue an article, then justify an opinion",
      speaking: "2 sections · obtain information, then argue to convince",
    },
    "TCF Canada": {
      reading: "39 multiple-choice questions · 60 minutes",
      listening: "39 multiple-choice questions · 35 minutes",
      writing:
        "3 tasks · message, account with comments, and compared viewpoints",
      speaking:
        "3 tasks · interview, prepared interaction, and spontaneous viewpoint",
    },
  } satisfies Record<ExamName, Format>,
  overview: {
    eyebrow: "Mock Exams",
    lockedTitle: "Measure independent performance.",
    lockedDescription: "Four-skill MPK practice simulations.",
    unlock: "Unlock Mock Exams",
    title: "Mock Exams",
    description:
      "A full-length MPK practice simulation, independently authored. This is not an official examination and does not produce an official score.",
    questions: (count: number, minutes: number) =>
      `${count} questions · ${minutes} minutes`,
    tasks: (count: number, minutes: number) =>
      `${count} tasks · ${minutes} minutes`,
    mockTitle: (exam: string) => `${exam} Canada · MPK Mock 01`,
    totalMinutes: (minutes: number) => `${minutes} minutes total`,
    productiveNote:
      "Writing and speaking are rehearsal-only. Speaking is timed self-practice without a live interlocutor, recording, or AI evaluation.",
    audioPending:
      "Audio pending — the complete mock is unavailable until all original recordings are ready. Transcript exercises are available in Practice.",
    reviewFormat: "Review simulation format",
  },
  setup: {
    unavailable: "Audio pending — simulation unavailable",
  },
  session: {
    unavailableTitle: (exam: string) => `MPK simulation · ${exam} Canada`,
    unavailable:
      "Audio pending — the full mock is unavailable. A mock never substitutes transcripts for recordings.",
    notOfficial: "This practice simulation is not an official exam.",
  },
  results: {
    eyebrow: (exam: string) => `${exam} MPK practice simulation`,
    title: "Your independent performance",
    description:
      "Instructional support is available again. Use this saved practice evidence to choose what to strengthen next.",
    scoreLabel: "MPK comprehension result",
    scoreNote: (exam: string) =>
      `Independent practice simulation. This is not an official ${exam} score, immigration result, or prediction. This percentage uses Reading and Listening only. Writing and Speaking are rehearsal tasks and are not corrected or scored.`,
    skillsTitle: "Your four exam skills",
    historical: "Historical result",
    productive: (done: number, total: number) =>
      `${done}/${total} completed · not scored`,
    accuracy: (percent: number) => `${percent}% practice accuracy`,
    correctionsTitle: "Corrections and self-review",
    yourResponse: "Your response:",
    unanswered: "Unanswered",
    notCompleted: "Not completed",
    correctAnswer: "Correct answer:",
    nextEyebrow: "Recommended next",
    nextTitle: (skill: string) => `Practice ${skill.toLowerCase()}`,
    nextBody: "This is currently your weakest assessed exam skill.",
    nextCta: "Start targeted practice",
  },
};

const fr: typeof en = {
  formats: {
    "TEF Canada": {
      reading: "40 questions à choix multiple · 60 minutes",
      listening:
        "40 questions à choix multiple · 40 minutes · écoute sans retour",
      writing: "2 sections · poursuivre un article, puis justifier une opinion",
      speaking: "2 sections · obtenir des informations, puis convaincre",
    },
    "TCF Canada": {
      reading: "39 questions à choix multiple · 60 minutes",
      listening: "39 questions à choix multiple · 35 minutes",
      writing:
        "3 tâches · message, récit commenté et comparaison de points de vue",
      speaking:
        "3 tâches · entretien, interaction préparée et point de vue spontané",
    },
  },
  overview: {
    eyebrow: "Examens blancs",
    lockedTitle: "Mesurez votre performance en autonomie.",
    lockedDescription:
      "Simulations d’entraînement MPK sur les quatre compétences.",
    unlock: "Débloquer les examens blancs",
    title: "Examens blancs",
    description:
      "Une simulation d’entraînement MPK complète, conçue de façon indépendante. Ce n’est pas un examen officiel et elle ne produit aucun résultat officiel.",
    questions: (count: number, minutes: number) =>
      `${count} questions · ${minutes} minutes`,
    tasks: (count: number, minutes: number) =>
      `${count} tâches · ${minutes} minutes`,
    mockTitle: (exam: string) => `${exam} Canada · Examen blanc MPK 01`,
    totalMinutes: (minutes: number) => `${minutes} minutes au total`,
    productiveNote:
      "L’expression écrite et orale servent uniquement à la répétition. L’oral est un auto-entraînement chronométré, sans interlocuteur en direct, enregistrement ni évaluation par IA.",
    audioPending:
      "Audio en préparation — l’examen blanc complet sera disponible lorsque tous les enregistrements originaux seront prêts. Les exercices sur transcription sont disponibles dans Pratiquer.",
    reviewFormat: "Voir le format de la simulation",
  },
  setup: {
    unavailable: "Audio en préparation — simulation indisponible",
  },
  session: {
    unavailableTitle: (exam: string) => `Simulation MPK · ${exam} Canada`,
    unavailable:
      "Audio en préparation — l’examen blanc complet est indisponible. Un examen blanc ne remplace jamais les enregistrements par des transcriptions.",
    notOfficial:
      "Cette simulation d’entraînement n’est pas un examen officiel.",
  },
  results: {
    eyebrow: (exam: string) => `Simulation d’entraînement MPK · ${exam}`,
    title: "Votre performance en autonomie",
    description:
      "L’aide pédagogique est de nouveau disponible. Utilisez ces résultats pour choisir quoi renforcer ensuite.",
    scoreLabel: "Résultat MPK en compréhension",
    scoreNote: (exam: string) =>
      `Simulation d’entraînement indépendante. Ce n’est ni un résultat officiel du ${exam}, ni une décision d’immigration, ni une prédiction. Ce pourcentage porte uniquement sur la compréhension écrite et orale. L’expression écrite et orale sont des tâches de répétition, sans correction ni note.`,
    skillsTitle: "Vos quatre compétences d’examen",
    historical: "Résultat antérieur",
    productive: (done: number, total: number) =>
      `${done}/${total} terminées · non notées`,
    accuracy: (percent: number) => `${percent} % d’exactitude`,
    correctionsTitle: "Corrections et autoévaluation",
    yourResponse: "Votre réponse :",
    unanswered: "Sans réponse",
    notCompleted: "Non terminée",
    correctAnswer: "Bonne réponse :",
    nextEyebrow: "Prochaine étape recommandée",
    nextTitle: (skill: string) =>
      `S’entraîner en ${skill.charAt(0).toLowerCase()}${skill.slice(1)}`,
    nextBody: "C’est actuellement votre compétence évaluée la plus faible.",
    nextCta: "Commencer un entraînement ciblé",
  },
};

export const exam = { en, fr };
