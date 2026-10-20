type Skill = "reading" | "listening" | "writing" | "speaking";

const en = {
  skills: {
    reading: "Reading",
    listening: "Listening",
    writing: "Writing",
    speaking: "Speaking",
  } satisfies Record<Skill, string>,
  frenchSkills: {
    reading: "Compréhension écrite",
    listening: "Compréhension orale",
    writing: "Expression écrite",
    speaking: "Expression orale",
  } satisfies Record<Skill, string>,
  modes: {
    learn: "Learn with support",
    practice: "Apply what you learned",
    exam: "Perform independently",
  },
  status: {
    notAssessed: "Not assessed yet",
    onTrack: "On track",
    improving: "Improving",
    needsAttention: "Needs attention",
    priority: "Priority",
  },
  select: {
    title: "Choose a skill",
    description:
      "Practice uses the prompts, question style, and navigation rules of your active exam.",
    selfPractice: "Timed self-practice",
    focusAreas: "Focus areas:",
    practise: "Practice →",
    reviewRubric: "Practise and review the rubric →",
    recommendedTitle: "Recommended weakness",
    recommendedBody: (skill: string) =>
      `Focus next on ${skill.toLowerCase()} using your current evidence.`,
    recommendedCta: "Practice recommended weakness",
    productiveNote:
      "Writing and speaking offer guided self-practice. AI evaluation and official scores are not provided yet.",
  },
  session: {
    focus: (label: string) => `Focus: ${label}`,
    progress: "Practice progress",
    empty:
      "No exercises match this competency. Choose another focus in Practice.",
    check: "Check answer",
    next: "Next question",
    results: "See results",
    saving: "Saving…",
  },
  productive: {
    title: (exam: string, skill: string) => `${exam} · ${skill} self-practice`,
    note: "MPK practice feedback only. No recording, AI evaluation, or official grading. Speaking requires you to imagine or arrange an interlocutor.",
    chooseTask: "Choose a task",
    words: (count: number) => `${count} words`,
    wordRange: (min: number, max?: number) =>
      max ? `${min}–${max} mots` : `${min} mots minimum`,
    preparation: "Preparation",
    response: "Response",
    start: "Start timed practice",
    responseLabel: "Votre réponse",
    guidance: "Planning guidance",
    finish: "Finish and review",
    reviewTitle: "Self-review · MPK practice feedback",
    modelResponse: "Original MPK model response",
    loadingModel: "Loading model response…",
    save: "Save practice completion",
  },
  results: {
    eyebrow: (exam: string) => `${exam} practice complete`,
    title: "Good work. Now use the evidence.",
    unscored:
      "Your practice completion was saved without creating a skill score.",
    scored:
      "This saved result updated your active exam profile and relevant mistake patterns.",
    sessionResult: "Session result",
    completed: "Completed",
    transcript: "Transcript-based exercise · listening not assessed",
    selfPractice: "Self-practice completed · not scored",
    correctCount: (correct: number, total: number) =>
      `${correct} of ${total} correct`,
    whatChanged: "What changed",
    completionSaved: "Practice completion saved",
    trend: (skill: string) => `Your ${skill.toLowerCase()} trend`,
    noPercentage: "No skill percentage was created",
    recency: "Recency-weighted practice evidence",
    nextTitle: "Recommended next action",
    nextBody:
      "Review any new pattern, or return to your dashboard for the clearest next step.",
    reviewMistakes: "Review mistakes",
    dashboard: "Dashboard",
  },
};

const fr: typeof en = {
  skills: {
    reading: "Compréhension écrite",
    listening: "Compréhension orale",
    writing: "Expression écrite",
    speaking: "Expression orale",
  },
  frenchSkills: {
    reading: "Compréhension écrite",
    listening: "Compréhension orale",
    writing: "Expression écrite",
    speaking: "Expression orale",
  },
  modes: {
    learn: "Apprendre avec du soutien",
    practice: "Mettre en pratique",
    exam: "Réussir en autonomie",
  },
  status: {
    notAssessed: "Pas encore évaluée",
    onTrack: "En bonne voie",
    improving: "En progression",
    needsAttention: "À surveiller",
    priority: "Priorité",
  },
  select: {
    title: "Choisissez une compétence",
    description:
      "L’entraînement reprend les consignes, le style de questions et les règles de navigation de votre examen.",
    selfPractice: "Auto-entraînement chronométré",
    focusAreas: "Points à travailler :",
    practise: "S’entraîner →",
    reviewRubric: "S’entraîner et revoir la grille →",
    recommendedTitle: "Faiblesse recommandée",
    recommendedBody: (skill: string) =>
      `Concentrez-vous ensuite sur la ${skill.toLowerCase()} à partir de vos résultats actuels.`,
    recommendedCta: "Travailler la faiblesse recommandée",
    productiveNote:
      "L’expression écrite et orale proposent un auto-entraînement guidé. L’évaluation par IA et les résultats officiels ne sont pas encore offerts.",
  },
  session: {
    focus: (label: string) => `Priorité : ${label}`,
    progress: "Progression de l’entraînement",
    empty:
      "Aucun exercice ne correspond à cette compétence. Choisissez une autre priorité dans Pratiquer.",
    check: "Vérifier la réponse",
    next: "Question suivante",
    results: "Voir les résultats",
    saving: "Enregistrement…",
  },
  productive: {
    title: (exam: string, skill: string) =>
      `${exam} · auto-entraînement en ${skill.toLowerCase()}`,
    note: "Retour d’entraînement MPK uniquement. Pas d’enregistrement, d’évaluation par IA ni de notation officielle. À l’oral, imaginez un interlocuteur ou demandez à quelqu’un de jouer ce rôle.",
    chooseTask: "Choisissez une tâche",
    words: (count: number) => `${count} mots`,
    wordRange: (min: number, max?: number) =>
      max ? `${min}–${max} mots` : `${min} mots minimum`,
    preparation: "Préparation",
    response: "Réponse",
    start: "Commencer l’entraînement chronométré",
    responseLabel: "Votre réponse",
    guidance: "Conseils de planification",
    finish: "Terminer et réviser",
    reviewTitle: "Autoévaluation · retour d’entraînement MPK",
    modelResponse: "Modèle de réponse MPK original",
    loadingModel: "Chargement du modèle de réponse…",
    save: "Enregistrer l’entraînement",
  },
  results: {
    eyebrow: (exam: string) => `Entraînement ${exam} terminé`,
    title: "Bon travail. Exploitez maintenant vos résultats.",
    unscored:
      "Votre entraînement a été enregistré sans créer de note de compétence.",
    scored:
      "Ce résultat a mis à jour votre profil d’examen et vos erreurs récurrentes.",
    sessionResult: "Résultat de la séance",
    completed: "Terminé",
    transcript: "Exercice sur transcription · compréhension orale non évaluée",
    selfPractice: "Auto-entraînement terminé · non noté",
    correctCount: (correct: number, total: number) =>
      `${correct} bonnes réponses sur ${total}`,
    whatChanged: "Ce qui a changé",
    completionSaved: "Entraînement enregistré",
    trend: (skill: string) => `Votre tendance en ${skill.toLowerCase()}`,
    noPercentage: "Aucun pourcentage de compétence n’a été créé",
    recency: "Résultats pondérés selon leur récence",
    nextTitle: "Prochaine action recommandée",
    nextBody:
      "Révisez toute nouvelle erreur récurrente, ou revenez au tableau de bord pour la prochaine étape.",
    reviewMistakes: "Réviser mes erreurs",
    dashboard: "Tableau de bord",
  },
};

export const practice = { en, fr };
