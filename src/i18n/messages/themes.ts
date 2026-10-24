const en = {
  title: "Recurring themes for TEF and TCF Canada",
  metaDescription:
    "Themes that keep returning in TEF Canada and TCF Canada preparation, with useful French expressions and original practice prompts. Updated every month.",
  eyebrow: (month: string) => `Recurring themes · ${month}`,
  notice:
    "These prompts are written by MPK for practice. They are not real exam questions, and nothing here comes from an official exam.",
  why: "Why it comes back",
  expressions: "Useful expressions",
  prompts: "Practice prompts",
  ctaTitle: "Want feedback on your answer?",
  ctaBody:
    "MPK reviews your written and spoken answers with AI feedback against your NCLC target. Start with the free French assessment.",
  ctaPrimary: "Take the free assessment",
  ctaSecondary: "Create an account",
  otherLanguage: "Lire en français",
  previous: "Earlier months",
};

const fr: typeof en = {
  title: "Thèmes récurrents du TEF et du TCF Canada",
  metaDescription:
    "Les thèmes qui reviennent dans la préparation au TEF Canada et au TCF Canada, avec des expressions utiles et des sujets d’entraînement originaux. Mis à jour chaque mois.",
  eyebrow: (month: string) => `Thèmes récurrents · ${month}`,
  notice:
    "Ces sujets sont rédigés par MPK pour l’entraînement. Ce ne sont pas de vrais sujets d’examen, et rien ici ne provient d’un examen officiel.",
  why: "Pourquoi il revient",
  expressions: "Expressions utiles",
  prompts: "Sujets d’entraînement",
  ctaTitle: "Envie d’un retour sur votre réponse ?",
  ctaBody:
    "MPK commente vos productions écrites et orales avec un retour par IA, par rapport à votre objectif NCLC. Commencez par l’évaluation de français gratuite.",
  ctaPrimary: "Faire l’évaluation gratuite",
  ctaSecondary: "Créer un compte",
  otherLanguage: "Read in English",
  previous: "Mois précédents",
};

export const themes = { en, fr };
