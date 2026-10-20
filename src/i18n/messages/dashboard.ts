const en = {
  loading: "Loading dashboard",
  eyebrow: "Dashboard",
  welcome: (name: string) => `Welcome, ${name}`,
  welcomeBack: (name: string) => `Welcome back, ${name}`,
  learner: "Learner",
  description:
    "Your exam, current progress, and clearest next step in one place.",
  free: {
    description:
      "Your free account includes the assessment and a basic weakness profile.",
    assessment: "Assessment",
    level: (level: string) => `Your estimated level is ${level}`,
    establish: "Establish your starting point",
    priority: (skill: string) =>
      `${skill} is the main weakness identified by your latest assessment.`,
    noResult:
      "Complete the assessment to identify your current level, strengths, and priority weakness.",
    viewResults: "View assessment results",
    start: "Start assessment",
    compare: "Compare paid plans",
  },
  chooseExam: {
    eyebrow: "Choose your preparation",
    title: "Which Canadian French exam are you preparing for?",
    description:
      "TEF Canada and TCF Canada assess the same four language abilities through different formats. Your choice creates a separate dashboard that you can switch later in Settings.",
    prepare: (exam: string) => `Prepare for ${exam}`,
  },
  next: {
    eyebrow: "RECOMMENDED NEXT",
    startWith: (skill: string) => `Start with ${skill.toLowerCase()}`,
    priority: (skill: string) =>
      `${skill} is the priority identified by your latest diagnostic result.`,
    continueTitle: "Continue your guided lessons",
    continueBody:
      "Build your French foundations and continue through the available skill lessons.",
    start: "Start recommended activity",
    continue: "Continue learning",
  },
  week: {
    title: "THIS WEEK",
    sessions: "practice sessions",
    studied: "studied",
    duration: (hours: number, minutes: number) => `${hours}h ${minutes}m`,
    reviewed: "questions reviewed",
    readiness: "readiness",
    completion: "course complete",
  },
  exam: {
    eyebrow: "MY EXAM",
    target: (target: string) => `Target: ${target}`,
    readiness: "Diagnostic readiness",
    accuracy: "Practice accuracy",
    readinessUnavailable: "Diagnostic readiness not available yet",
    readinessLabel: (value: number) => `Diagnostic readiness ${value}%`,
    accuracyLabel: (value: number) => `Practice accuracy ${value}%`,
    completeAssessment: "Complete your assessment to establish readiness.",
    provisional: (exam: string) =>
      `This provisional result comes from your latest diagnostic. It is not an official ${exam}, NCLC, or immigration score.`,
    practiceCount: (count: number) => `${count} practice questions completed.`,
  },
  skills: {
    title: "YOUR 4 EXAM SKILLS",
    notAssessed: "Not assessed yet",
    selfPractice: "Timed self-practice with a rubric",
    practice: "Practice",
    practiseNow: "Self-practice",
  },
};

const fr: typeof en = {
  loading: "Chargement du tableau de bord",
  eyebrow: "Tableau de bord",
  welcome: (name: string) => `Bienvenue, ${name}`,
  welcomeBack: (name: string) => `Bon retour, ${name}`,
  learner: "apprenant",
  description:
    "Votre examen, votre progression et votre prochaine étape, au même endroit.",
  free: {
    description:
      "Votre compte gratuit comprend l’évaluation et un profil de base de vos faiblesses.",
    assessment: "Évaluation",
    level: (level: string) => `Votre niveau estimé est ${level}`,
    establish: "Établissez votre point de départ",
    priority: (skill: string) =>
      `${skill} : c’est la principale faiblesse relevée par votre dernière évaluation.`,
    noResult:
      "Faites l’évaluation pour connaître votre niveau actuel, vos forces et votre faiblesse prioritaire.",
    viewResults: "Voir les résultats de l’évaluation",
    start: "Commencer l’évaluation",
    compare: "Comparer les formules payantes",
  },
  chooseExam: {
    eyebrow: "Choisissez votre préparation",
    title: "Quel examen de français préparez-vous pour le Canada ?",
    description:
      "Le TEF Canada et le TCF Canada évaluent les quatre mêmes compétences avec des formats différents. Votre choix crée un tableau de bord distinct, modifiable plus tard dans les Paramètres.",
    prepare: (exam: string) => `Préparer le ${exam}`,
  },
  next: {
    eyebrow: "PROCHAINE ÉTAPE RECOMMANDÉE",
    startWith: (skill: string) => `Commencez par : ${skill.toLowerCase()}`,
    priority: (skill: string) =>
      `${skill} : c’est la priorité relevée par votre dernier diagnostic.`,
    continueTitle: "Poursuivez vos leçons guidées",
    continueBody:
      "Consolidez vos bases en français et poursuivez les leçons de chaque compétence.",
    start: "Commencer l’activité recommandée",
    continue: "Continuer à apprendre",
  },
  week: {
    title: "CETTE SEMAINE",
    sessions: "séances d’entraînement",
    studied: "d’étude",
    duration: (hours: number, minutes: number) => `${hours} h ${minutes} min`,
    reviewed: "questions révisées",
    readiness: "préparation",
    completion: "du cours terminé",
  },
  exam: {
    eyebrow: "MON EXAMEN",
    target: (target: string) => `Objectif : ${target}`,
    readiness: "Préparation selon le diagnostic",
    accuracy: "Exactitude à l’entraînement",
    readinessUnavailable: "Préparation pas encore disponible",
    readinessLabel: (value: number) =>
      `Préparation selon le diagnostic : ${value} %`,
    accuracyLabel: (value: number) =>
      `Exactitude à l’entraînement : ${value} %`,
    completeAssessment:
      "Faites votre évaluation pour établir votre niveau de préparation.",
    provisional: (exam: string) =>
      `Ce résultat provisoire provient de votre dernier diagnostic. Ce n’est pas un résultat officiel du ${exam}, un niveau NCLC ni une décision d’immigration.`,
    practiceCount: (count: number) =>
      `${count} questions d’entraînement terminées.`,
  },
  skills: {
    title: "VOS 4 COMPÉTENCES D’EXAMEN",
    notAssessed: "Pas encore évaluée",
    selfPractice: "Auto-entraînement chronométré avec grille",
    practice: "S’entraîner",
    practiseNow: "Auto-entraînement",
  },
};

export const dashboard = { en, fr };
