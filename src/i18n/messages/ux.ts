const en = {
  metrics: {
    title: "Engagement",
    activity:
      "Activity means a completed diagnostic, mock exam, practice session, or lesson; signing in alone does not count.",
    activated: "Testers activated",
    firstLearning: "Completed a first lesson or practice after activation",
    active: "Active in the last 7 days",
    returned: "Active again on day 7 or later",
    noEligible: "No tester has passed day 7 yet",
    share: (count: number, total: number, rate: string) =>
      `${count} of ${total} (${rate})`,
  },
  betaAccess:
    "The assessment is open to everyone. The full program currently requires a beta invitation.",
  stages: ["Goal", "Questions", "Writing", "Results"],
  stageLabel: "Assessment stages",
  examHelp:
    "TEF Canada and TCF Canada are different French exam formats. Choose your booked exam, or select “I'm not sure yet”.",
  targetHelp:
    "NCLC is the Canadian benchmark for French proficiency. Choose your preparation target, or “I'm not sure”. MPK practice scores are not official NCLC levels.",
  draft: {
    title: "Continue your assessment",
    account: "Saved in your account",
    browser: "Saved in this browser",
    resume: "Continue assessment",
    restart: "Start again",
    restartConfirm:
      "Start again? This clears the saved assessment drafts shown here. Completed results are kept.",
    replaceConfirm:
      "Continue the browser draft instead? This replaces the unfinished assessment in your account. Your browser copy stays until the account save succeeds.",
    reloadConfirm:
      "Load the saved version? Unsaved edits on this page will be discarded.",
    both: "You have an account draft and a browser draft. Choose which assessment to continue.",
    loading: "Loading your saved assessment…",
    saving: "Saving…",
    saved: "Progress saved",
    error:
      "Your latest changes could not be saved. Keep this page open and retry.",
    loadError:
      "We could not load your saved assessment. Retry before starting so existing work is preserved.",
    conflict:
      "This assessment changed in another tab or device. Your edits are still on this page. Review the saved version before continuing.",
    retry: "Retry saving",
    reload: "Review saved version",
    retryLoad: "Retry loading",
    incompatible:
      "The assessment content has changed. Start a new assessment; copy any writing you want to keep first.",
    retentionGuest:
      "Progress is saved in this browser for seven days after your last edit.",
    retentionAccount:
      "Progress is saved to your account for seven days after your last edit. Resume on any device.",
    savedWriting: "Your saved writing",
    question: (n: number, total: number) => `Question ${n} of ${total}`,
  },
  plan: {
    goal: "Your exam goal",
    edit: "Edit goal",
    noDate: "Exam date not set",
    next: "Your next step",
    remaining: (minutes: number) => `${minutes} min remaining`,
    practice: (skill: string, minutes: number) =>
      `Start ${skill.toLowerCase()} practice · ${minutes} min`,
    review: (skill: string, minutes: number) =>
      `Review ${skill.toLowerCase()} · ${minutes} min`,
    lesson: (minutes: number) => `Start lesson · ${minutes} min`,
    completed: "Today’s plan is complete",
    completedBody: "Your work is saved. Come back tomorrow for your next plan.",
    dashboard: "Back to dashboard",
  },
  feedback: {
    readiness: "Reading and listening readiness",
    scope: "Reading and listening only",
    lastPractice: "Last practice",
    noPractice: "No practice completed yet",
    separate:
      "Writing and speaking feedback is separate from the readiness percentage.",
    writingAi: "Timed writing with optional AI feedback",
    speakingAi: "Record your answer with optional AI feedback",
    self: "Timed self-practice with a rubric",
    empty: "No feedback requested yet",
    queued: "Feedback queued",
    processing: "Feedback in progress",
    done: "Feedback ready",
    failed: "Feedback needs attention",
    unavailable: "Feedback status is temporarily unavailable",
    view: "View feedback",
    history: "Feedback history",
    start: "Start practice",
    consent:
      "AI feedback is optional and requires your consent. It is a practice aid, not an official score.",
    speakingLimit:
      "Speaking feedback uses a transcript; pronunciation is not assessed.",
  },
  preview: {
    eyebrow: "Your preparation, made concrete",
    title: "Know what to practise next",
    example: "Example learner · sample data",
    plan: "A focused daily plan",
    planBody:
      "Review mistakes, practise a priority skill, then learn a useful strategy.",
    review: "Review listening mistakes",
    practice: "Practise listening · 10 questions",
    lesson: "Learn to identify key details",
    feedback: "Feedback you can use",
    feedbackBody:
      "See an explanation after a reading or listening answer. Eligible learners can also request writing and speaking feedback.",
    explanation:
      "Look for the time expression that connects an action to the present.",
    journeyTitle: "From your starting point to exam practice",
    steps: [
      {
        title: "Assess",
        body: "Find your starting point with questions and a short writing sample.",
      },
      {
        title: "Prepare",
        body: "Follow your daily plan: targeted lessons, practice and mistake review across four skills.",
      },
      {
        title: "Simulate and adapt",
        body: "Try a timed exam simulation, then use your results to focus your next practice.",
      },
    ],
  },
};

const fr: typeof en = {
  metrics: {
    title: "Engagement",
    activity:
      "L’activité correspond à une évaluation, une simulation, une séance d’entraînement ou une leçon terminée ; une connexion seule ne compte pas.",
    activated: "Testeurs activés",
    firstLearning: "Première leçon ou séance terminée après l’activation",
    active: "Actifs au cours des 7 derniers jours",
    returned: "De nouveau actifs à partir du 7e jour",
    noEligible: "Aucun testeur n’a encore atteint le 7e jour",
    share: (count: number, total: number, rate: string) =>
      `${count} sur ${total} (${rate})`,
  },
  betaAccess:
    "L’évaluation est ouverte à tous. Le programme complet nécessite actuellement une invitation à la bêta.",
  stages: ["Objectif", "Questions", "Écriture", "Résultats"],
  stageLabel: "Étapes de l’évaluation",
  examHelp:
    "Le TEF Canada et le TCF Canada sont deux formats d’examen de français. Choisissez votre examen réservé ou « Je ne sais pas encore ».",
  targetHelp:
    "Les NCLC sont les niveaux de compétence linguistique canadiens pour le français. Choisissez votre objectif ou « Je ne sais pas ». Les scores MPK ne sont pas des niveaux NCLC officiels.",
  draft: {
    title: "Poursuivez votre évaluation",
    account: "Enregistrée dans votre compte",
    browser: "Enregistrée dans ce navigateur",
    resume: "Poursuivre l’évaluation",
    restart: "Recommencer",
    restartConfirm:
      "Recommencer ? Les brouillons d’évaluation affichés ici seront supprimés. Les résultats terminés sont conservés.",
    replaceConfirm:
      "Poursuivre le brouillon du navigateur ? Il remplacera l’évaluation inachevée de votre compte. La copie du navigateur reste disponible jusqu’à la réussite de l’enregistrement.",
    reloadConfirm:
      "Charger la version enregistrée ? Les modifications non enregistrées sur cette page seront perdues.",
    both: "Vous avez un brouillon dans votre compte et un dans ce navigateur. Choisissez l’évaluation à poursuivre.",
    loading: "Chargement de votre évaluation enregistrée…",
    saving: "Enregistrement…",
    saved: "Progression enregistrée",
    error:
      "Vos dernières modifications n’ont pas pu être enregistrées. Gardez cette page ouverte et réessayez.",
    loadError:
      "Impossible de charger votre évaluation enregistrée. Réessayez avant de commencer afin de conserver votre travail.",
    conflict:
      "Cette évaluation a changé dans un autre onglet ou appareil. Vos modifications restent sur cette page. Consultez la version enregistrée avant de poursuivre.",
    retry: "Réessayer l’enregistrement",
    reload: "Consulter la version enregistrée",
    retryLoad: "Réessayer le chargement",
    incompatible:
      "Le contenu de l’évaluation a changé. Commencez une nouvelle évaluation ; copiez d’abord tout texte à conserver.",
    retentionGuest:
      "Votre progression est conservée dans ce navigateur pendant sept jours après votre dernière modification.",
    retentionAccount:
      "Votre progression est conservée dans votre compte pendant sept jours après votre dernière modification. Reprenez sur n’importe quel appareil.",
    savedWriting: "Votre texte enregistré",
    question: (n, total) => `Question ${n} sur ${total}`,
  },
  plan: {
    goal: "Votre objectif d’examen",
    edit: "Modifier l’objectif",
    noDate: "Date d’examen non définie",
    next: "Votre prochaine étape",
    remaining: (minutes) => `${minutes} min restantes`,
    practice: (skill, minutes) =>
      `S’entraîner en ${skill.toLowerCase()} · ${minutes} min`,
    review: (skill, minutes) =>
      `Réviser la ${skill.toLowerCase()} · ${minutes} min`,
    lesson: (minutes) => `Commencer la leçon · ${minutes} min`,
    completed: "Le programme du jour est terminé",
    completedBody:
      "Votre travail est enregistré. Revenez demain pour votre prochain programme.",
    dashboard: "Retour au tableau de bord",
  },
  feedback: {
    readiness: "Préparation en compréhension écrite et orale",
    scope: "Compréhension écrite et orale uniquement",
    lastPractice: "Dernier entraînement",
    noPractice: "Aucun entraînement terminé",
    separate:
      "Les corrections de l’écrit et de l’oral sont distinctes du pourcentage de préparation.",
    writingAi: "Écriture chronométrée avec correction IA facultative",
    speakingAi: "Enregistrez votre réponse avec correction IA facultative",
    self: "Auto-entraînement chronométré avec grille",
    empty: "Aucune correction demandée",
    queued: "Correction en attente",
    processing: "Correction en cours",
    done: "Correction disponible",
    failed: "Correction à vérifier",
    unavailable: "Le statut des corrections est temporairement indisponible",
    view: "Voir la correction",
    history: "Historique des corrections",
    start: "Commencer l’entraînement",
    consent:
      "La correction par IA est facultative et nécessite votre accord. C’est une aide à l’entraînement, pas un résultat officiel.",
    speakingLimit:
      "La correction orale utilise une transcription ; la prononciation n’est pas évaluée.",
  },
  preview: {
    eyebrow: "Votre préparation en pratique",
    title: "Sachez quoi travailler ensuite",
    example: "Exemple d’apprenant · données fictives",
    plan: "Un programme quotidien ciblé",
    planBody:
      "Révisez vos erreurs, entraînez une compétence prioritaire, puis apprenez une stratégie utile.",
    review: "Réviser les erreurs de compréhension orale",
    practice: "Compréhension orale · 10 questions",
    lesson: "Apprendre à repérer les détails clés",
    feedback: "Des corrections utiles",
    feedbackBody:
      "Consultez une explication après une réponse de compréhension écrite ou orale. Les apprenants admissibles peuvent aussi demander des corrections de l’écrit et de l’oral.",
    explanation:
      "Repérez l’expression de temps qui relie une action au présent.",
    journeyTitle: "De votre point de départ à l’entraînement à l’examen",
    steps: [
      {
        title: "Évaluez-vous",
        body: "Découvrez votre point de départ avec des questions et un court texte.",
      },
      {
        title: "Préparez-vous",
        body: "Suivez votre programme : leçons ciblées, entraînement et révision des erreurs dans les quatre compétences.",
      },
      {
        title: "Simulez et adaptez",
        body: "Essayez une simulation chronométrée, puis utilisez vos résultats pour cibler le prochain entraînement.",
      },
    ],
  },
};
export const ux = { en, fr };
