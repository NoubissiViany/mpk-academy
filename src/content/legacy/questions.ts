import type { MistakeCategory, Question } from "@/types/domain";

export const diagnosticQuestions: Question[] = [
  {
    id: "d1",
    source: "mpk_mock",
    examType: "general",
    type: "multiple_choice",
    prompt: "Je vis à Montréal ___ trois ans.",
    options: [
      { id: "a", label: "depuis" },
      { id: "b", label: "pendant" },
      { id: "c", label: "il y a" },
    ],
    correctAnswer: "a",
    explanation:
      "Depuis describes a situation that began in the past and continues now.",
    explanationFr:
      "Depuis exprime une situation commencée dans le passé et toujours actuelle.",
    competencies: ["time-expressions", "grammar-prepositions"],
    diagnosticSkill: "grammar",
    difficulty: "B1",
  },
  {
    id: "d2",
    source: "mpk_mock",
    examType: "TEF",
    type: "multiple_choice",
    prompt:
      "L'avis indique que le bureau fermera exceptionnellement à 15 h. Que faut-il comprendre ?",
    options: [
      { id: "a", label: "Le bureau ouvre à 15 h." },
      { id: "b", label: "Le bureau ferme plus tôt que d'habitude." },
      { id: "c", label: "Le bureau est fermé toute la journée." },
    ],
    correctAnswer: "b",
    explanation: "Exceptionnellement signals a change from the usual schedule.",
    explanationFr:
      "Exceptionnellement signale un changement par rapport à l'horaire habituel.",
    competencies: ["reading-detail"],
    diagnosticSkill: "reading",
    difficulty: "B1",
    metadata: {
      passage:
        "AVIS — Vendredi, nos bureaux fermeront exceptionnellement à 15 h.",
    },
  },
  {
    id: "d3",
    source: "mpk_mock",
    examType: "general",
    type: "multiple_choice",
    prompt: "Quel connecteur exprime une opposition ?",
    options: [
      { id: "a", label: "donc" },
      { id: "b", label: "pourtant" },
      { id: "c", label: "puisque" },
    ],
    correctAnswer: "b",
    explanation: "Pourtant introduces a contrast between two ideas.",
    explanationFr: "Pourtant introduit une opposition entre deux idées.",
    competencies: ["connectors"],
    diagnosticSkill: "sentence-structure",
    difficulty: "B1",
  },
  {
    id: "d4",
    source: "mpk_mock",
    examType: "TCF",
    type: "multiple_choice",
    prompt: "Pourquoi Léa reporte-t-elle son rendez-vous ?",
    options: [
      { id: "a", label: "Elle est malade." },
      { id: "b", label: "Son train est annulé." },
      { id: "c", label: "Elle travaille." },
    ],
    correctAnswer: "b",
    explanation:
      "The key detail is the cancelled train, not the later meeting.",
    explanationFr: "Le détail clé est l'annulation du train.",
    competencies: ["listening-detail"],
    diagnosticSkill: "listening",
    difficulty: "B1",
    metadata: { audioLabel: "Audio mock: message de Léa" },
  },
  {
    id: "d5",
    source: "mpk_mock",
    examType: "general",
    type: "fill_blank",
    prompt: "Complétez : Si j'avais le temps, je ___ davantage.",
    correctAnswer: "lirais",
    explanation:
      "An imperfect si-clause is followed by the conditional present.",
    explanationFr:
      "Une proposition en si à l'imparfait est suivie du conditionnel présent.",
    competencies: ["grammar-tense"],
    diagnosticSkill: "grammar",
    difficulty: "B2",
  },
  {
    id: "d6",
    source: "mpk_mock",
    examType: "TEF",
    type: "multiple_choice",
    prompt: "Le ton de l'auteur est principalement…",
    options: [
      { id: "a", label: "enthousiaste" },
      { id: "b", label: "réservé" },
      { id: "c", label: "furieux" },
    ],
    correctAnswer: "b",
    explanation:
      "The author acknowledges benefits but repeatedly qualifies them.",
    explanationFr: "L'auteur reconnaît les avantages, mais les nuance.",
    competencies: ["reading-inference"],
    diagnosticSkill: "reading",
    difficulty: "B2",
    metadata: {
      passage:
        "La mesure semble utile, même si ses effets restent encore difficiles à évaluer.",
    },
  },
  {
    id: "d7",
    source: "mpk_mock",
    examType: "general",
    type: "multiple_choice",
    prompt: "Dans ce contexte, « démarche » signifie…",
    options: [
      { id: "a", label: "une promenade" },
      { id: "b", label: "une procédure" },
      { id: "c", label: "une hésitation" },
    ],
    correctAnswer: "b",
    explanation:
      "In administrative French, démarche means a process or required step.",
    explanationFr:
      "Dans un contexte administratif, une démarche est une procédure.",
    competencies: ["vocabulary-context"],
    diagnosticSkill: "vocabulary",
    difficulty: "B1",
  },
  {
    id: "d8",
    source: "mpk_mock",
    examType: "TCF",
    type: "multiple_choice",
    prompt: "Quelle est l'idée principale ?",
    options: [
      { id: "a", label: "Le télétravail disparaît." },
      { id: "b", label: "Les entreprises adaptent leurs pratiques hybrides." },
      { id: "c", label: "Les employés refusent tout changement." },
    ],
    correctAnswer: "b",
    explanation:
      "The passage centers on adaptation, not disappearance or refusal.",
    explanationFr: "Le texte porte sur l'adaptation des pratiques.",
    competencies: ["reading-main-idea"],
    diagnosticSkill: "reading",
    difficulty: "B2",
    metadata: {
      passage:
        "Après plusieurs années d'expérimentation, de nombreuses entreprises précisent désormais leurs règles de travail hybride.",
    },
  },
  {
    id: "d9",
    source: "mpk_mock",
    examType: "general",
    type: "multiple_choice",
    prompt: "Elle s'est inscrite ___ cours du soir.",
    options: [
      { id: "a", label: "au" },
      { id: "b", label: "aux" },
      { id: "c", label: "des" },
    ],
    correctAnswer: "b",
    explanation: "S'inscrire à + les becomes aux.",
    explanationFr: "S'inscrire à + les devient aux.",
    competencies: ["grammar-prepositions"],
    diagnosticSkill: "grammar",
    difficulty: "A2",
  },
  {
    id: "d10",
    source: "mpk_mock",
    examType: "TCF",
    type: "multiple_choice",
    prompt: "Que recommande l'intervenant ?",
    options: [
      { id: "a", label: "D'attendre une semaine" },
      { id: "b", label: "De vérifier le dossier aujourd'hui" },
      { id: "c", label: "De refaire la demande" },
    ],
    correctAnswer: "b",
    explanation: "The speaker's main recommendation is to verify today.",
    explanationFr: "La recommandation principale est de vérifier aujourd'hui.",
    competencies: ["listening-main-idea"],
    diagnosticSkill: "listening",
    difficulty: "B1",
    metadata: { audioLabel: "Audio mock: conseil téléphonique" },
  },
  {
    id: "d11",
    source: "mpk_mock",
    examType: "general",
    type: "multiple_choice",
    prompt:
      "Dans « Veuillez joindre une copie de votre passeport », que signifie « joindre » ?",
    options: [
      { id: "a", label: "Ajouter au dossier" },
      { id: "b", label: "Traduire" },
      { id: "c", label: "Signer" },
    ],
    correctAnswer: "a",
    explanation:
      "In this context, joindre means to attach or include a document.",
    explanationFr:
      "Dans ce contexte, joindre signifie ajouter un document au dossier.",
    competencies: ["vocabulary-context"],
    diagnosticSkill: "vocabulary",
    difficulty: "A2",
  },
  {
    id: "d12",
    source: "mpk_mock",
    examType: "general",
    type: "multiple_choice",
    prompt: "Quelle phrase est correctement structurée ?",
    options: [
      { id: "a", label: "Parce qu'il pleut, donc je prends mon parapluie." },
      { id: "b", label: "Comme il pleut, je prends mon parapluie." },
      { id: "c", label: "Il pleut puisque, je prends mon parapluie." },
    ],
    correctAnswer: "b",
    explanation:
      "Comme introduces the cause, followed by the result in a complete main clause.",
    explanationFr:
      "Comme introduit la cause, suivie du résultat dans une proposition complète.",
    competencies: ["connectors"],
    diagnosticSkill: "sentence-structure",
    difficulty: "B1",
  },
  {
    id: "d13",
    source: "mpk_mock",
    examType: "TEF",
    type: "multiple_choice",
    prompt:
      "Pour trouver une information précise dans un texte long, quelle stratégie est la plus efficace ?",
    options: [
      { id: "a", label: "Lire chaque mot très lentement" },
      { id: "b", label: "Repérer les mots-clés puis vérifier leur contexte" },
      { id: "c", label: "Choisir la réponse la plus longue" },
    ],
    correctAnswer: "b",
    explanation:
      "Scanning for keywords and checking context is efficient and evidence-based.",
    explanationFr:
      "Repérer les mots-clés puis vérifier le contexte permet de trouver efficacement une information précise.",
    competencies: ["reading-detail"],
    diagnosticSkill: "exam-strategy",
    difficulty: "B1",
  },
  {
    id: "d14",
    source: "mpk_mock",
    examType: "TCF",
    type: "multiple_choice",
    prompt:
      "Pendant une écoute, vous ne comprenez pas un mot. Que devriez-vous faire ?",
    options: [
      { id: "a", label: "Arrêter d'écouter pour le traduire" },
      {
        id: "b",
        label: "Continuer et utiliser le contexte pour comprendre l'idée",
      },
      { id: "c", label: "Ignorer toutes les informations suivantes" },
    ],
    correctAnswer: "b",
    explanation:
      "Continuing to listen protects your understanding of the main idea and surrounding clues.",
    explanationFr:
      "Continuer à écouter permet de conserver l'idée principale et d'utiliser les indices du contexte.",
    competencies: ["listening-main-idea"],
    diagnosticSkill: "exam-strategy",
    difficulty: "B1",
  },
  {
    id: "d15",
    source: "mpk_mock",
    examType: "general",
    type: "multiple_choice",
    prompt:
      "Une question vous prend trop de temps pendant une épreuve chronométrée. Quelle est la meilleure approche ?",
    options: [
      { id: "a", label: "Rester sur la question jusqu'à trouver la réponse" },
      { id: "b", label: "Répondre au hasard sans lire" },
      {
        id: "c",
        label: "Choisir provisoirement, avancer, puis revenir si possible",
      },
    ],
    correctAnswer: "c",
    explanation:
      "Moving on protects time for other questions while preserving a chance to review.",
    explanationFr:
      "Avancer protège le temps disponible et permet de revenir à la question si possible.",
    competencies: ["reading-main-idea"],
    diagnosticSkill: "exam-strategy",
    difficulty: "B2",
  },
];

export const practiceQuestions = diagnosticQuestions.slice(0, 5);
export const examQuestions = diagnosticQuestions.slice(1, 9);

export const mistakeCategoryByQuestion: Record<string, MistakeCategory> = {
  d1: "Time expression",
  d2: "Missed detail",
  d3: "Vocabulary confusion",
  d4: "Missed detail",
  d5: "Verb tense",
  d6: "Incorrect inference",
  d7: "Vocabulary confusion",
  d8: "Question misunderstanding",
  d9: "Preposition",
  d10: "Missed detail",
  d11: "Vocabulary confusion",
  d12: "Grammar rule",
  d13: "Question misunderstanding",
  d14: "Missed detail",
  d15: "Question misunderstanding",
};
