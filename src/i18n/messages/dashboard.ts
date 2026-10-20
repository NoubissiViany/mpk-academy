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
  today: {
    eyebrow: "TODAY",
    title: (minutes: number) => `Today’s plan · about ${minutes} min`,
    review: (count: number, skill: string) =>
      `Review ${count} missed ${count === 1 ? "question" : "questions"} · ${skill}`,
    reviewHint: "Missed questions return after 1, 3 and 7 days.",
    practice: (skill: string) =>
      `Practise ${skill.toLowerCase()} · 10 questions`,
    practiceHint:
      "Your weakest skill, with questions you have not seen coming first.",
    practiceHintGeneral: "Questions you have not seen come first.",
    lesson: (title: string) => `Lesson · ${title}`,
    lessonHint: "Recommended from your assessment and recent mistakes.",
    minutes: (minutes: number) => `${minutes} min`,
    done: "Done",
    toDo: "To do",
    start: "Start today’s plan",
    continue: "Continue today’s plan",
    allDone: "Today’s plan is done.",
    allDoneBody:
      "Extra practice still counts, but a break also helps you remember.",
    extra: "Extra practice",
  },
  plan: {
    eyebrow: "STUDY PLAN",
    noDateTitle: "Add your exam date",
    noDateBody:
      "With a date, MPK sets a weekly practice rhythm and tells you whether you are on track.",
    setDate: "Set exam date",
    past: "Your exam date has passed. Update it in Settings if you are taking the exam again.",
    daysLeft: (days: number) =>
      days === 0
        ? "Your exam is today"
        : days === 1
          ? "1 day to your exam"
          : `${days} days to your exam`,
    rhythm: (sessions: number) => `Plan: ${sessions} practice sessions a week`,
    thisWeek: (done: number) =>
      `${done} ${done === 1 ? "session" : "sessions"} this week`,
    onTrack: "On track",
    behind: (missing: number) =>
      `Behind by ${missing} ${missing === 1 ? "session" : "sessions"}`,
    week: (hours: number, minutes: number, questions: number) =>
      `This week: ${hours}h ${minutes}m studied · ${questions} questions`,
    change: "Change date",
  },
  readiness: {
    eyebrow: "READINESS",
    title: "MPK readiness",
    accuracy: "Practice accuracy",
    goal: (goal: number, target: string) =>
      `Goal for ${target}: ${goal}% on MPK practice`,
    goalLine: (goal: number) => `Target line at ${goal}%`,
    unavailable:
      "Finish a reading or listening practice session to measure your readiness.",
    bands: {
      at: "At your target",
      near: "Near your target",
      below: "Below your target",
    },
    evidence: {
      limited: "Limited evidence so far",
      growing: "Growing evidence",
      solid: "Solid evidence",
    },
    change: (points: number) =>
      points === 0
        ? "No change since your first score"
        : `${points > 0 ? "+" : "−"}${Math.abs(points)} since your first score`,
    disclaimer: (exam: string) =>
      `An MPK estimate from reading and listening practice. It is not an official ${exam} result or NCLC level.`,
    practiceCount: (count: number) => `${count} practice questions completed.`,
  },
  skills: {
    title: "YOUR 4 EXAM SKILLS",
    notAssessed: "Not assessed yet",
    notScored: "Not scored yet",
    focus: "Focus skill",
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
  today: {
    eyebrow: "AUJOURD’HUI",
    title: (minutes: number) => `Programme du jour · environ ${minutes} min`,
    review: (count: number, skill: string) =>
      `Revoir ${count} ${count === 1 ? "question manquée" : "questions manquées"} · ${skill.toLowerCase()}`,
    reviewHint: "Les questions manquées reviennent après 1, 3 puis 7 jours.",
    practice: (skill: string) =>
      `S’entraîner en ${skill.toLowerCase()} · 10 questions`,
    practiceHint:
      "Votre compétence la plus faible, en commençant par des questions jamais vues.",
    practiceHintGeneral: "Les questions jamais vues passent en premier.",
    lesson: (title: string) => `Leçon · ${title}`,
    lessonHint: "Recommandée d’après votre évaluation et vos erreurs récentes.",
    minutes: (minutes: number) => `${minutes} min`,
    done: "Fait",
    toDo: "À faire",
    start: "Commencer le programme du jour",
    continue: "Poursuivre le programme du jour",
    allDone: "Le programme du jour est terminé.",
    allDoneBody:
      "Un entraînement de plus compte toujours, mais une pause aide aussi à retenir.",
    extra: "Entraînement supplémentaire",
  },
  plan: {
    eyebrow: "PLAN D’ÉTUDE",
    noDateTitle: "Ajoutez la date de votre examen",
    noDateBody:
      "Avec une date, MPK fixe un rythme d’entraînement hebdomadaire et vous indique si vous êtes dans les temps.",
    setDate: "Indiquer la date",
    past: "La date de votre examen est passée. Mettez-la à jour dans les Paramètres si vous le repassez.",
    daysLeft: (days: number) =>
      days === 0
        ? "Votre examen a lieu aujourd’hui"
        : days === 1
          ? "1 jour avant votre examen"
          : `${days} jours avant votre examen`,
    rhythm: (sessions: number) =>
      `Plan : ${sessions} séances d’entraînement par semaine`,
    thisWeek: (done: number) =>
      `${done} ${done <= 1 ? "séance" : "séances"} cette semaine`,
    onTrack: "Dans les temps",
    behind: (missing: number) =>
      `En retard de ${missing} ${missing === 1 ? "séance" : "séances"}`,
    week: (hours: number, minutes: number, questions: number) =>
      `Cette semaine : ${hours} h ${minutes} min d’étude · ${questions} questions`,
    change: "Modifier la date",
  },
  readiness: {
    eyebrow: "PRÉPARATION",
    title: "Préparation MPK",
    accuracy: "Exactitude à l’entraînement",
    goal: (goal: number, target: string) =>
      `Objectif pour ${target} : ${goal} % à l’entraînement MPK`,
    goalLine: (goal: number) => `Ligne d’objectif à ${goal} %`,
    unavailable:
      "Terminez une séance de compréhension écrite ou orale pour mesurer votre préparation.",
    bands: {
      at: "Objectif atteint",
      near: "Proche de l’objectif",
      below: "Sous l’objectif",
    },
    evidence: {
      limited: "Peu de données pour l’instant",
      growing: "Données en hausse",
      solid: "Données solides",
    },
    change: (points: number) =>
      points === 0
        ? "Aucun changement depuis votre premier résultat"
        : `${points > 0 ? "+" : "−"}${Math.abs(points)} depuis votre premier résultat`,
    disclaimer: (exam: string) =>
      `Une estimation MPK fondée sur l’entraînement en compréhension écrite et orale. Ce n’est ni un résultat officiel du ${exam} ni un niveau NCLC.`,
    practiceCount: (count: number) =>
      `${count} questions d’entraînement terminées.`,
  },
  skills: {
    title: "VOS 4 COMPÉTENCES D’EXAMEN",
    notAssessed: "Pas encore évaluée",
    notScored: "Pas encore notée",
    focus: "Compétence prioritaire",
    selfPractice: "Auto-entraînement chronométré avec grille",
    practice: "S’entraîner",
    practiseNow: "Auto-entraînement",
  },
};

export const dashboard = { en, fr };
