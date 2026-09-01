import type { Locale } from "@/types/domain";

const en = {
  nav: { program: "Program", how: "How it works", pricing: "Pricing", signIn: "Sign in", diagnostic: "Start free diagnostic", logout: "Log out" },
  common: { continue: "Continue", start: "Start", previous: "Previous", next: "Next", finish: "Finish", review: "Review", minutes: "min", locked: "Full program", save: "Save changes" },
  mode: { learn: "Learn with support", practice: "Apply what you learned", exam: "Perform independently" },
  dashboard: { greeting: "Good morning", eyebrow: "Your preparation today", recommended: "Recommended next action", readiness: "MPK Readiness", progress: "Course progress", skills: "Competency snapshot", weaknesses: "Top weaknesses", recent: "Recent activity", continueLearning: "Continue learning" },
  states: { noData: "Not enough data yet", loading: "Preparing your learning plan…", error: "Something did not load as expected.", empty: "Nothing to review yet." },
};

const fr: typeof en = {
  nav: { program: "Programme", how: "Fonctionnement", pricing: "Tarifs", signIn: "Se connecter", diagnostic: "Diagnostic gratuit", logout: "Se déconnecter" },
  common: { continue: "Continuer", start: "Commencer", previous: "Précédent", next: "Suivant", finish: "Terminer", review: "Réviser", minutes: "min", locked: "Programme complet", save: "Enregistrer" },
  mode: { learn: "Apprendre avec du soutien", practice: "Mettre en pratique", exam: "Réussir en autonomie" },
  dashboard: { greeting: "Bonjour", eyebrow: "Votre préparation aujourd’hui", recommended: "Prochaine action recommandée", readiness: "Préparation MPK", progress: "Progression du cours", skills: "Aperçu des compétences", weaknesses: "Principales faiblesses", recent: "Activité récente", continueLearning: "Continuer à apprendre" },
  states: { noData: "Pas encore assez de données", loading: "Préparation de votre plan…", error: "Un élément ne s’est pas chargé correctement.", empty: "Rien à réviser pour le moment." },
};

export const dictionaries = { en, fr };
export type Dictionary = typeof en;
export const getDictionary = (locale: Locale) => dictionaries[locale] ?? dictionaries.en;
