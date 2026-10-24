const en = {
  step: (step: number) => `Step ${step} of 3`,
  activityLabel: "Assessment completed",
  activityDetail: (level: string) => `${level} estimated level`,
  intake: {
    goals: {
      "TEF Canada": "Prepare for TEF Canada",
      "TCF Canada": "Prepare for TCF Canada",
      "Not sure yet": "I'm not sure yet",
    },
    targets: {
      "NCLC 5": "NCLC 5",
      "NCLC 7": "NCLC 7",
      "NCLC 9+": "NCLC 9+",
      "I'm not sure": "I'm not sure",
    },
    experience: {
      "I'm just starting": "I'm just starting",
      "I know some French": "I know some French",
      "I can communicate in French": "I can communicate in French",
      "I'm already comfortable in French": "I'm already comfortable in French",
      "I'm not sure": "I'm not sure",
    },
  },
  intro: {
    eyebrow: "Free French assessment",
    title: "Check your French level",
    lead: "Find out where you are today and what you should focus on next.",
    body: "This quick assessment helps MPK Academy understand your strengths and weaknesses.",
    facts: (questions: number, minutes: number) => [
      `About ${minutes} minutes`,
      `${questions} questions · updated MPK assessment`,
      "Free",
      "No payment required",
    ],
    receiveTitle: "You'll receive",
    receive: [
      "Your estimated French level",
      "Your strongest skills",
      "Skills that need improvement",
      "A recommended starting point",
    ],
    goalTitle: "First, tell us about your goal",
    goalBody:
      "Your answers personalize your next steps, not your assessment score.",
    goalLegend: "What's your goal?",
    targetLegend: "What result are you aiming for?",
    experienceLegend: "How would you describe your French today?",
    start: "Start my assessment",
    loading: "Loading assessment",
  },
  question: {
    progress: (current: number, total: number) =>
      `Question ${current} of ${total}`,
    minutesLeft: (minutes: number) => `About ${minutes} min left`,
    progressLabel: (current: number, total: number) =>
      `Assessment progress: ${current} of ${total}`,
    reassurance:
      "Don't worry if you're unsure. Choose the answer that seems best.",
    competency: (label: string) => `Competency · ${label}`,
    finish: "Finish assessment",
    finishing: "Saving assessment…",
    disclaimer:
      "Independent MPK practice content · not official TEF/TCF questions",
  },
  toasts: {
    updated:
      "The assessment has been updated. Start the new version; saved historical results remain available.",
    sessionExpiredUnsaved:
      "Your session expired, and we could not preserve the assessment. Keep this page open and try again.",
    sessionExpiredSaved:
      "Your session expired. Your assessment is saved on this device — sign in to continue.",
    saveFailed: "We could not save your assessment. Please try again.",
  },
  skills: {
    grammar: {
      label: "Grammar",
      strength: "You apply common French grammar patterns accurately.",
      priority: "Grammar patterns are making some answers less reliable.",
    },
    vocabulary: {
      label: "Vocabulary",
      strength: "You understand common words and expressions well.",
      priority:
        "Unfamiliar words and expressions are limiting your understanding.",
    },
    reading: {
      label: "Reading",
      strength:
        "You identify important ideas and details in written French well.",
      priority:
        "You had more difficulty finding meaning and details in written French.",
    },
    listening: {
      label: "Listening",
      strength: "You identify spoken ideas and details in French well.",
      priority:
        "You had more difficulty identifying specific information in spoken French.",
    },
    "sentence-structure": {
      label: "Sentence structure",
      strength: "You connect and organize ideas in French sentences well.",
      priority:
        "Sentence order and connectors are making some ideas harder to express clearly.",
    },
    "exam-strategy": {
      label: "Exam strategy",
      strength:
        "You choose effective strategies when time or uncertainty creates pressure.",
      priority:
        "A more deliberate approach to timing, context, and distractors will help your performance.",
    },
  },
  levels: {
    A2: {
      descriptor: "Elementary French",
      summary:
        "You're building a good foundation, but a few skills are limiting your progress.",
    },
    B1: {
      descriptor: "Intermediate French",
      summary:
        "You can handle familiar French, and focused practice will make your communication more reliable.",
    },
    B2: {
      descriptor: "Upper-intermediate French",
      summary:
        "You have a strong working level of French, with a few skills to sharpen for exam performance.",
    },
    C1: {
      descriptor: "Advanced French",
      summary:
        "You understand complex French well and can now focus on precision, speed, and exam technique.",
    },
  },
  results: {
    loading: "Loading assessment results",
    emptyTitle: "No assessment result yet",
    emptyBody:
      "Complete the French assessment to see your estimated level and starting skill profile.",
    emptyCta: "Start my assessment",
    eyebrow: "Assessment complete",
    title: "Your French Assessment",
    levelLabel: "Provisional MPK level",
    targetTitle: (target: string) => `Compared with your ${target} target`,
    referenceTitle: "Compared with NCLC 7, a common target",
    estimatedLevel: (level: string) => `Estimated level ${level} (provisional)`,
    intakeSummary: (goal?: string, target?: string, experience?: string) =>
      `This starting point is personalized for someone ${
        goal ? `preparing for ${goal}` : "exploring their French goals"
      }${target ? ` and aiming for ${target}` : ""}.${
        experience
          ? ` You described your French today as “${experience.toLowerCase()}.”`
          : ""
      }`,
    skillsTitle: "Your skills",
    reading: "Reading",
    foundation: "Language foundation",
    listening: "Listening",
    listeningPending: "Listening — Not assessed yet (audio pending)",
    writingPending: "Writing — Not assessed yet",
    speakingPending: "Speaking — Not assessed yet",
    basedOn: (count: number | string) =>
      `Provisional MPK estimate based on ${count} assessed items. Transcript exercises do not measure listening. This is not a certified CEFR level, NCLC result, or official TEF/TCF score.`,
    historical: "historical",
    strengthTitle: "Your strength",
    priorityTitle: "Your priority",
    startHere: "We recommend starting here.",
    dashboard: "Go to dashboard",
    recommended: "Recommended for you",
    selected: "Your selected plan",
    selectedDiffers: (plan: string) =>
      `You selected ${plan} before your assessment. Your selection remains ready for checkout.`,
    basis: (target: string, plan: string) =>
      `For a ${target} goal, we recommend ${plan}.`,
    basisSame: (target: string) =>
      `For a ${target} goal, this plan gives you the right level of support for your next step.`,
    currentGoal: "current",
    continueWith: (plan: string) => `Continue with ${plan}`,
    compare: "Compare all plans",
    planLabel: (kind: string, plan: string) => `${kind} plan: ${plan}`,
    disclaimer:
      "This MPK Academy estimate is a learning indicator, not an official TEF/TCF score.",
  },
};

const fr: typeof en = {
  step: (step: number) => `Étape ${step} sur 3`,
  activityLabel: "Évaluation terminée",
  activityDetail: (level: string) => `Niveau estimé ${level}`,
  intake: {
    goals: {
      "TEF Canada": "Préparer le TEF Canada",
      "TCF Canada": "Préparer le TCF Canada",
      "Not sure yet": "Je ne sais pas encore",
    },
    targets: {
      "NCLC 5": "NCLC 5",
      "NCLC 7": "NCLC 7",
      "NCLC 9+": "NCLC 9+",
      "I'm not sure": "Je ne sais pas",
    },
    experience: {
      "I'm just starting": "Je débute",
      "I know some French": "Je connais un peu le français",
      "I can communicate in French": "Je peux communiquer en français",
      "I'm already comfortable in French": "Je suis déjà à l’aise en français",
      "I'm not sure": "Je ne sais pas",
    },
  },
  intro: {
    eyebrow: "Évaluation de français gratuite",
    title: "Évaluez votre niveau de français",
    lead: "Découvrez où vous en êtes aujourd’hui et sur quoi vous concentrer ensuite.",
    body: "Cette courte évaluation aide MPK Academy à comprendre vos forces et vos faiblesses.",
    facts: (questions: number, minutes: number) => [
      `Environ ${minutes} minutes`,
      `${questions} questions · évaluation MPK mise à jour`,
      "Gratuite",
      "Aucun paiement requis",
    ],
    receiveTitle: "Vous recevrez",
    receive: [
      "Votre niveau de français estimé",
      "Vos compétences les plus solides",
      "Les compétences à améliorer",
      "Un point de départ recommandé",
    ],
    goalTitle: "Parlez-nous d’abord de votre objectif",
    goalBody:
      "Vos réponses personnalisent vos prochaines étapes, pas votre résultat.",
    goalLegend: "Quel est votre objectif ?",
    targetLegend: "Quel résultat visez-vous ?",
    experienceLegend: "Comment décririez-vous votre français aujourd’hui ?",
    start: "Commencer l’évaluation",
    loading: "Chargement de l’évaluation",
  },
  question: {
    progress: (current: number, total: number) =>
      `Question ${current} sur ${total}`,
    minutesLeft: (minutes: number) => `Environ ${minutes} min restantes`,
    progressLabel: (current: number, total: number) =>
      `Progression de l’évaluation : ${current} sur ${total}`,
    reassurance:
      "Pas d’inquiétude si vous hésitez. Choisissez la réponse qui vous semble la meilleure.",
    competency: (label: string) => `Compétence · ${label}`,
    finish: "Terminer l’évaluation",
    finishing: "Enregistrement de l’évaluation…",
    disclaimer:
      "Contenu d’entraînement MPK indépendant · ce ne sont pas des questions officielles du TEF/TCF",
  },
  toasts: {
    updated:
      "L’évaluation a été mise à jour. Commencez la nouvelle version ; vos résultats précédents restent disponibles.",
    sessionExpiredUnsaved:
      "Votre session a expiré et nous n’avons pas pu conserver l’évaluation. Gardez cette page ouverte et réessayez.",
    sessionExpiredSaved:
      "Votre session a expiré. Votre évaluation est enregistrée sur cet appareil : connectez-vous pour continuer.",
    saveFailed:
      "Nous n’avons pas pu enregistrer votre évaluation. Veuillez réessayer.",
  },
  skills: {
    grammar: {
      label: "Grammaire",
      strength:
        "Vous appliquez correctement les structures grammaticales courantes.",
      priority:
        "Certaines structures grammaticales rendent vos réponses moins sûres.",
    },
    vocabulary: {
      label: "Vocabulaire",
      strength: "Vous comprenez bien les mots et expressions courants.",
      priority:
        "Des mots et des expressions peu familiers limitent votre compréhension.",
    },
    reading: {
      label: "Compréhension écrite",
      strength:
        "Vous repérez bien les idées importantes et les détails d’un texte en français.",
      priority:
        "Vous avez eu plus de difficulté à saisir le sens et les détails d’un texte en français.",
    },
    listening: {
      label: "Compréhension orale",
      strength:
        "Vous repérez bien les idées et les détails à l’oral en français.",
      priority:
        "Vous avez eu plus de difficulté à repérer des informations précises à l’oral.",
    },
    "sentence-structure": {
      label: "Construction de phrases",
      strength:
        "Vous reliez et organisez bien vos idées dans des phrases en français.",
      priority:
        "L’ordre des mots et les connecteurs rendent certaines idées plus difficiles à exprimer clairement.",
    },
    "exam-strategy": {
      label: "Stratégie d’examen",
      strength:
        "Vous choisissez des stratégies efficaces sous la pression du temps ou du doute.",
      priority:
        "Une approche plus réfléchie du temps, du contexte et des distracteurs améliorera vos résultats.",
    },
  },
  levels: {
    A2: {
      descriptor: "Français élémentaire",
      summary:
        "Vous construisez de bonnes bases, mais quelques compétences freinent votre progression.",
    },
    B1: {
      descriptor: "Français intermédiaire",
      summary:
        "Vous vous débrouillez en français familier ; un entraînement ciblé rendra votre communication plus fiable.",
    },
    B2: {
      descriptor: "Français intermédiaire avancé",
      summary:
        "Vous avez un bon niveau de français fonctionnel, avec quelques compétences à affiner pour l’examen.",
    },
    C1: {
      descriptor: "Français avancé",
      summary:
        "Vous comprenez bien le français complexe et pouvez maintenant travailler la précision, la rapidité et la technique d’examen.",
    },
  },
  results: {
    loading: "Chargement des résultats",
    emptyTitle: "Pas encore de résultat",
    emptyBody:
      "Faites l’évaluation de français pour voir votre niveau estimé et votre profil de départ.",
    emptyCta: "Commencer l’évaluation",
    eyebrow: "Évaluation terminée",
    title: "Votre évaluation de français",
    levelLabel: "Niveau MPK provisoire",
    targetTitle: (target: string) => `Par rapport à votre objectif ${target}`,
    referenceTitle: "Par rapport au NCLC 7, un objectif courant",
    estimatedLevel: (level: string) => `Niveau estimé ${level} (provisoire)`,
    intakeSummary: (goal?: string, target?: string, experience?: string) =>
      `Ce point de départ est personnalisé pour une personne ${
        goal
          ? `qui prépare le ${goal}`
          : "qui explore ses objectifs en français"
      }${target ? ` et vise le ${target}` : ""}.${
        experience
          ? ` Vous avez décrit votre français ainsi : « ${experience.charAt(0).toLowerCase()}${experience.slice(1)} ».`
          : ""
      }`,
    skillsTitle: "Vos compétences",
    reading: "Compréhension écrite",
    foundation: "Bases de la langue",
    listening: "Compréhension orale",
    listeningPending:
      "Compréhension orale — pas encore évaluée (audio en préparation)",
    writingPending: "Expression écrite — pas encore évaluée",
    speakingPending: "Expression orale — pas encore évaluée",
    basedOn: (count: number | string) =>
      `Estimation MPK provisoire fondée sur ${count} questions évaluées. Les exercices sur transcription ne mesurent pas la compréhension orale. Il ne s’agit ni d’un niveau CECR certifié, ni d’un résultat NCLC, ni d’un résultat officiel du TEF/TCF.`,
    historical: "les",
    strengthTitle: "Votre force",
    priorityTitle: "Votre priorité",
    startHere: "Nous vous recommandons de commencer ici.",
    dashboard: "Aller au tableau de bord",
    recommended: "Recommandée pour vous",
    selected: "La formule choisie",
    selectedDiffers: (plan: string) =>
      `Vous avez choisi la formule ${plan} avant votre évaluation. Votre choix reste prêt pour le paiement.`,
    basis: (target: string, plan: string) =>
      `Pour un objectif ${target}, nous recommandons la formule ${plan}.`,
    basisSame: (target: string) =>
      `Pour un objectif ${target}, cette formule vous offre le bon niveau d’accompagnement pour la suite.`,
    currentGoal: "actuel",
    continueWith: (plan: string) => `Continuer avec ${plan}`,
    compare: "Comparer les formules",
    planLabel: (kind: string, plan: string) => `${kind} : ${plan}`,
    disclaimer:
      "Cette estimation de MPK Academy est un indicateur d’apprentissage, pas un résultat officiel du TEF/TCF.",
  },
};

export const diagnostic = { en, fr };
