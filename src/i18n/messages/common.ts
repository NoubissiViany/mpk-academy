const en = {
  appName: "MPK Academy",
  continue: "Continue",
  start: "Start",
  back: "Back",
  previous: "Previous",
  next: "Next",
  finish: "Finish",
  save: "Save changes",
  saving: "Saving…",
  loading: "Loading…",
  tryAgain: "Try again",
  close: "Close",
  minutes: (count: number) => `${count} min`,
  errorReference: (message: string, reference: string) =>
    `${message} Reference: ${reference}`,
  disclaimer:
    "MPK Academy is independent preparation material. It is not an official TEF/TCF score, test provider, or immigration outcome.",
  language: {
    label: "Application language",
    english: "English",
    french: "Français",
  },
  nav: {
    how: "How it works",
    pricing: "Pricing",
    privacy: "Privacy",
    themes: "Recurring exam themes",
    signIn: "Sign in",
    startAssessment: "Start free assessment",
    dashboard: "Go to dashboard",
    openMenu: "Open navigation",
    closeMenu: "Close navigation",
    main: "Main navigation",
    mobile: "Mobile navigation",
  },
  footer: {
    tagline: "Understand in English. Learn in French. Perform in French.",
    clarityTitle: "Prepare with clarity",
    clarityCopy:
      "Independent practice material. MPK Academy is not an official TEF/TCF testing organization.",
    canadaTitle: "Canada-focused",
    canadaCopy:
      "Privacy-minded learning for adult immigrants and professionals.",
    rights: (year: number) => `© ${year} MPK Academy.`,
  },
  betaBadge: "Closed beta",
  errorPage: {
    eyebrow: "Something went wrong",
    title: "This page did not load as expected.",
    body: "Your saved learning progress has not been removed.",
  },
  notFoundPage: {
    title: "That page is not part of the learning plan.",
    body: "Return to your dashboard or start from the home page.",
    dashboard: "Go to dashboard",
    home: "Back to home",
  },
  actions: {
    mutation: {
      unauthenticated:
        "Your session has expired. Sign in again to save your progress.",
      invalid_submission:
        "The submitted information is invalid. Review it and try again.",
      conflict: "This update was already processed. Refresh and try again.",
      unavailable: "We could not save this update. Please try again.",
    },
    snapshot: {
      unauthenticated: "Your session has expired. Sign in again.",
      profile_unavailable:
        "Your account is signed in, but its learning profile could not be loaded.",
      service_unavailable:
        "Your learning profile is temporarily unavailable. Please try again.",
    },
    invalid: {
      savedAssessment: "The saved assessment is invalid.",
      completeQuestions: "Complete every assessment question.",
      practice: "The practice submission is invalid.",
      exam: "The exam submission is invalid.",
      lesson: "Unknown lesson.",
    },
  },
  errors: {
    unauthenticated: "Your session has expired. Sign in again to continue.",
    locked: "This content is not included in your access.",
    notFound: "This item could not be found.",
    invalid: "The submitted information is invalid. Review it and try again.",
    unavailable: "Something went wrong on our side. Please try again.",
  },
};

const fr: typeof en = {
  appName: "MPK Academy",
  continue: "Continuer",
  start: "Commencer",
  back: "Retour",
  previous: "Précédent",
  next: "Suivant",
  finish: "Terminer",
  save: "Enregistrer",
  saving: "Enregistrement…",
  loading: "Chargement…",
  tryAgain: "Réessayer",
  close: "Fermer",
  minutes: (count: number) => `${count} min`,
  errorReference: (message: string, reference: string) =>
    `${message} Référence : ${reference}`,
  disclaimer:
    "MPK Academy est un outil de préparation indépendant. Ce n’est ni un résultat officiel du TEF/TCF, ni un organisme d’examen, ni une décision d’immigration.",
  language: {
    label: "Langue de l’application",
    english: "English",
    french: "Français",
  },
  nav: {
    how: "Fonctionnement",
    pricing: "Tarifs",
    privacy: "Confidentialité",
    themes: "Thèmes récurrents",
    signIn: "Se connecter",
    startAssessment: "Évaluation gratuite",
    dashboard: "Aller au tableau de bord",
    openMenu: "Ouvrir la navigation",
    closeMenu: "Fermer la navigation",
    main: "Navigation principale",
    mobile: "Navigation mobile",
  },
  footer: {
    tagline:
      "Comprendre en anglais ou en français. Apprendre en français. Réussir en français.",
    clarityTitle: "Se préparer en toute clarté",
    clarityCopy:
      "Matériel d’entraînement indépendant. MPK Academy n’est pas un organisme officiel d’évaluation du TEF/TCF.",
    canadaTitle: "Pensé pour le Canada",
    canadaCopy:
      "Un apprentissage respectueux de la vie privée pour les adultes immigrants et les professionnels.",
    rights: (year: number) => `© ${year} MPK Academy.`,
  },
  betaBadge: "Bêta fermée",
  errorPage: {
    eyebrow: "Un problème est survenu",
    title: "Cette page ne s’est pas chargée correctement.",
    body: "Votre progression enregistrée n’a pas été supprimée.",
  },
  notFoundPage: {
    title: "Cette page ne fait pas partie du parcours.",
    body: "Revenez à votre tableau de bord ou repartez de la page d’accueil.",
    dashboard: "Aller au tableau de bord",
    home: "Retour à l’accueil",
  },
  actions: {
    mutation: {
      unauthenticated:
        "Votre session a expiré. Reconnectez-vous pour enregistrer votre progression.",
      invalid_submission:
        "Les renseignements envoyés ne sont pas valides. Vérifiez-les et réessayez.",
      conflict:
        "Cette mise à jour a déjà été traitée. Actualisez et réessayez.",
      unavailable:
        "Nous n’avons pas pu enregistrer cette mise à jour. Veuillez réessayer.",
    },
    snapshot: {
      unauthenticated: "Votre session a expiré. Reconnectez-vous.",
      profile_unavailable:
        "Vous êtes connecté, mais votre profil d’apprentissage n’a pas pu être chargé.",
      service_unavailable:
        "Votre profil d’apprentissage est temporairement indisponible. Veuillez réessayer.",
    },
    invalid: {
      savedAssessment: "L’évaluation enregistrée n’est pas valide.",
      completeQuestions: "Répondez à toutes les questions de l’évaluation.",
      practice: "L’entraînement envoyé n’est pas valide.",
      exam: "L’examen envoyé n’est pas valide.",
      lesson: "Leçon inconnue.",
    },
  },
  errors: {
    unauthenticated: "Votre session a expiré. Reconnectez-vous pour continuer.",
    locked: "Ce contenu n’est pas inclus dans votre accès.",
    notFound: "Cet élément est introuvable.",
    invalid:
      "Les renseignements envoyés ne sont pas valides. Vérifiez-les et réessayez.",
    unavailable: "Un problème est survenu de notre côté. Veuillez réessayer.",
  },
};

export const common = { en, fr };
