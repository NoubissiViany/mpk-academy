export const competencyIds = [
  "main_idea",
  "specific_detail",
  "inference",
  "speaker_intention",
  "vocabulary_in_context",
  "register",
  "argumentation",
  "organization",
  "connectors",
  "question_formation",
  "verb_agreement",
  "grammar_accuracy",
  "lexical_range",
  "task_completion",
  "persuasion",
  "interaction",
  "reformulation",
  "pronunciation",
  "time_expressions",
  "reading_efficiency",
] as const;
export type ContentCompetency = (typeof competencyIds)[number];
export const legacyCompetencies: Record<string, ContentCompetency> = {
  "reading-main-idea": "main_idea",
  "reading-detail": "specific_detail",
  "reading-inference": "inference",
  "listening-main-idea": "main_idea",
  "listening-detail": "specific_detail",
  "grammar-tense": "grammar_accuracy",
  "grammar-prepositions": "grammar_accuracy",
  "vocabulary-context": "vocabulary_in_context",
  connectors: "connectors",
  "time-expressions": "time_expressions",
};
export function canonicalCompetency(id: string) {
  return legacyCompetencies[id] ?? id;
}
