import type { ContentCompetency } from "@/content/shared/competencies";

const en: Record<ContentCompetency, string> = {
  main_idea: "Main ideas",
  specific_detail: "Specific details",
  inference: "Inferences",
  speaker_intention: "Speaker intention",
  vocabulary_in_context: "Vocabulary in context",
  register: "Register",
  argumentation: "Argumentation",
  organization: "Organization",
  connectors: "Connectors",
  question_formation: "Asking questions",
  verb_agreement: "Verb agreement",
  grammar_accuracy: "Grammar accuracy",
  lexical_range: "Vocabulary range",
  task_completion: "Task completion",
  persuasion: "Persuasion",
  interaction: "Interaction",
  reformulation: "Reformulation",
  pronunciation: "Pronunciation",
  time_expressions: "Time expressions",
  reading_efficiency: "Reading efficiency",
};

const fr: typeof en = {
  main_idea: "Idées principales",
  specific_detail: "Détails précis",
  inference: "Inférences",
  speaker_intention: "Intention du locuteur",
  vocabulary_in_context: "Vocabulaire en contexte",
  register: "Registre",
  argumentation: "Argumentation",
  organization: "Organisation",
  connectors: "Connecteurs",
  question_formation: "Formulation de questions",
  verb_agreement: "Accord du verbe",
  grammar_accuracy: "Exactitude grammaticale",
  lexical_range: "Étendue du vocabulaire",
  task_completion: "Réalisation de la tâche",
  persuasion: "Persuasion",
  interaction: "Interaction",
  reformulation: "Reformulation",
  pronunciation: "Prononciation",
  time_expressions: "Expressions de temps",
  reading_efficiency: "Efficacité de lecture",
};

export const competencies = { en, fr };
