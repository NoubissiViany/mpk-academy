import { diagnosticQuestions } from "@/data/questions";
import type { ExamId, Question } from "@/types/domain";

const tefListening: Question[] = [
  {
    id: "tef-listening-1",
    source: "mpk_mock",
    examType: "TEF",
    type: "multiple_choice",
    prompt: "Pourquoi le client appelle-t-il le service de livraison ?",
    options: [
      { id: "a", label: "Pour changer son adresse" },
      { id: "b", label: "Parce que son colis est en retard" },
      { id: "c", label: "Pour annuler sa commande" },
    ],
    correctAnswer: "b",
    explanation: "The delayed parcel is the specific reason for the call.",
    explanationFr: "Le retard du colis est la raison précise de l’appel.",
    competencies: ["listening-detail"],
    diagnosticSkill: "listening",
    difficulty: "B1",
    metadata: { audioLabel: "Audio MPK · appel au service de livraison" },
  },
  {
    id: "tef-listening-2",
    source: "mpk_mock",
    examType: "TEF",
    type: "multiple_choice",
    prompt: "Que doit faire l’auditeur avant vendredi ?",
    options: [
      { id: "a", label: "Confirmer sa présence" },
      { id: "b", label: "Payer des frais" },
      { id: "c", label: "Changer de rendez-vous" },
    ],
    correctAnswer: "a",
    explanation:
      "The message asks listeners to confirm attendance before Friday.",
    explanationFr:
      "Le message demande de confirmer sa présence avant vendredi.",
    competencies: ["listening-detail"],
    diagnosticSkill: "listening",
    difficulty: "B1",
    metadata: { audioLabel: "Audio MPK · message d’inscription" },
  },
];

export function getExamQuestionPool(
  exam: ExamId,
  skill: "reading" | "listening",
) {
  const shortName = exam === "TEF Canada" ? "TEF" : "TCF";
  return [...diagnosticQuestions, ...tefListening].filter(
    (question) =>
      question.examType === shortName && question.diagnosticSkill === skill,
  );
}
