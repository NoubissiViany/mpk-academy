import { diagnosticItems } from "@/content/diagnostic/questions";
import { practiceItems } from "@/content/catalog";
import { toQuestion } from "@/content/adapters";
import type { MCQ } from "@/content/shared/types";
export { mistakeCategoryByQuestion } from "@/content/legacy/questions";
export const diagnosticQuestions = diagnosticItems.map(toQuestion);
export const practiceQuestions = practiceItems
  .filter((i): i is MCQ => i.kind === "mcq")
  .map(toQuestion);
// Legacy route compatibility; full mock content is loaded only on the server.
export const examQuestions = practiceQuestions;
