import "server-only";
import type { ProductiveTask } from "@/content/shared/types";
import {
  diagnosticWritingPrompt,
  diagnosticWritingRange,
  diagnosticWritingVersion,
} from "@/lib/domain/diagnostic-writing";

/** Independent diagnostic sample; it is not a practice-bank or exam task. */
export const diagnosticWritingTask: ProductiveTask = {
  id: diagnosticWritingVersion,
  kind: "writing",
  exam: "shared",
  skill: "writing",
  level: "B1",
  difficulty: 2,
  competencies: [],
  topic: "Une activité dans le quartier",
  estimatedTime: 10,
  status: "published",
  taskType: "diagnostic",
  title: "Échantillon écrit du diagnostic MPK",
  scenario: diagnosticWritingPrompt,
  instructions:
    "Écrivez un message de 80 à 120 mots en français, sans outil de traduction. Cet échantillon indépendant sert uniquement à fournir un retour provisoire sur votre expression écrite.",
  candidateRole: "Une personne qui raconte une activité à un ami",
  interlocutorRole: "Un ami",
  objectives: ["Raconter", "Exprimer une opinion", "Proposer et justifier"],
  durationSeconds: 600,
  preparationSeconds: 0,
  wordCount: diagnosticWritingRange,
  correction: {
    guidance:
      "Describe the activity, explain your reaction and justify a proposal.",
    guidanceFr:
      "Racontez l’activité, expliquez votre réaction et justifiez une proposition.",
    rubric: ["task", "coherence", "vocabulary", "grammar"],
  },
};
