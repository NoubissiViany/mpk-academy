const en = {
  yourAnswer: "Your answer",
  answerPlaceholder: "Votre réponse",
  options: "Answer options",
  audioPending: "Audio pending · Transcript-based exercise",
  audioPendingNote: "This exercise does not measure listening performance.",
  showTranscript: "Read what was said",
  correct: "Correct",
  notQuite: "Not quite",
  correctAnswer: (answer: string) => `Correct answer: ${answer}`,
  competency: (label: string) => `Competency · ${label}`,
  checking: "Checking…",
  instruction: "Choose an answer, then select Next to see the correction.",
  next: "Next",
  continue: "Continue",
  seeResults: "See results",
  retry: "Retry checking",
  feedbackError:
    "We couldn't check your answer. Your selection is still here. Try again.",
  correctAnswerLabel: "Correct answer",
  why: "Why",
  questionProgress: (position: number, total: number) =>
    `Question ${position} of ${total}`,
  tally: (correct: number, checked: number) =>
    `${checked} checked · ${correct} correct`,
  progress: "Questions checked",
};

const fr: typeof en = {
  yourAnswer: "Votre réponse",
  answerPlaceholder: "Votre réponse",
  options: "Choix de réponses",
  audioPending: "Audio en préparation · exercice sur transcription",
  audioPendingNote: "Cet exercice ne mesure pas la compréhension orale.",
  showTranscript: "Lire la transcription",
  correct: "Bonne réponse",
  notQuite: "Pas tout à fait",
  correctAnswer: (answer: string) => `Bonne réponse : ${answer}`,
  competency: (label: string) => `Compétence · ${label}`,
  checking: "Vérification…",
  instruction: "Choisissez une réponse, puis Suivant pour voir la correction.",
  next: "Suivant",
  continue: "Continuer",
  seeResults: "Voir les résultats",
  retry: "Réessayer la vérification",
  feedbackError:
    "Nous n’avons pas pu vérifier votre réponse. Votre choix est conservé. Réessayez.",
  correctAnswerLabel: "Bonne réponse",
  why: "Pourquoi",
  questionProgress: (position: number, total: number) =>
    `Question ${position} sur ${total}`,
  tally: (correct: number, checked: number) =>
    `${checked} vérifiée${checked > 1 ? "s" : ""} · ${correct} correcte${correct > 1 ? "s" : ""}`,
  progress: "Questions vérifiées",
};

export const assessment = { en, fr };
