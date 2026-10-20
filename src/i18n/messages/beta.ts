const en = {
  pageTitle: "Activate beta access",
  eyebrow: "Closed beta",
  title: "Activate your beta access",
  description:
    "MPK Academy is in a closed beta. Enter your invite code to unlock the full program — lessons, practice, and mock exams — for free during the beta.",
  codeLabel: "Invite code",
  codePlaceholder: "MPK-XXXX-XXXX",
  submit: "Activate access",
  submitting: "Activating…",
  signOut: "Sign out",
  noCode: (email: string) => `No invite code? Email ${email} to request one.`,
  noCodeWithoutContact:
    "Invite codes are shared directly with beta testers. Ask the person who invited you.",
  status: {
    redeemed: "Access activated.",
    already_active: "Your beta access is already active.",
    invalid: "This invite code is not valid. Check it and try again.",
    expired: "This invite code has expired. Ask for a new one.",
    exhausted: "This invite code has already been used.",
    beta_full:
      "The beta is full right now. Keep your code — we will open more seats soon.",
    unavailable: "We could not activate your access. Please try again.",
    required: "Enter your invite code.",
  },
  activating: "Checking your invite code…",
  registerHint:
    "MPK Academy is invite-only during the beta. Your code unlocks the full program for free.",
  results: {
    eyebrow: "Free during the beta",
    title: "Continue with the MPK Academy beta",
    guestCopy:
      "Lessons, practice, writing and speaking tasks, and mock exams are free for invited testers. Create your account with your invite code to keep this result.",
    activateCopy:
      "Enter your invite code to unlock the full program and keep building from this result.",
    createAccount: "Create my beta account",
    haveAccount: "I already have an account",
    activate: "Activate beta access",
  },
  accessUntil: (date: string) => `Beta access until ${date}`,
  planLabel: "Beta access",
};

const fr: typeof en = {
  pageTitle: "Activer l’accès bêta",
  eyebrow: "Bêta fermée",
  title: "Activez votre accès bêta",
  description:
    "MPK Academy est en bêta fermée. Saisissez votre code d’invitation pour débloquer gratuitement tout le programme — leçons, entraînement et examens blancs — pendant la bêta.",
  codeLabel: "Code d’invitation",
  codePlaceholder: "MPK-XXXX-XXXX",
  submit: "Activer l’accès",
  submitting: "Activation…",
  signOut: "Se déconnecter",
  noCode: (email: string) =>
    `Pas de code d’invitation ? Écrivez à ${email} pour en demander un.`,
  noCodeWithoutContact:
    "Les codes d’invitation sont remis directement aux testeurs. Demandez-le à la personne qui vous a invité.",
  status: {
    redeemed: "Accès activé.",
    already_active: "Votre accès bêta est déjà actif.",
    invalid: "Ce code d’invitation n’est pas valide. Vérifiez-le et réessayez.",
    expired: "Ce code d’invitation a expiré. Demandez-en un nouveau.",
    exhausted: "Ce code d’invitation a déjà été utilisé.",
    beta_full:
      "La bêta est complète pour le moment. Gardez votre code : nous ouvrirons bientôt de nouvelles places.",
    unavailable: "Nous n’avons pas pu activer votre accès. Veuillez réessayer.",
    required: "Saisissez votre code d’invitation.",
  },
  activating: "Vérification de votre code d’invitation…",
  registerHint:
    "MPK Academy est accessible sur invitation pendant la bêta. Votre code débloque gratuitement tout le programme.",
  results: {
    eyebrow: "Gratuit pendant la bêta",
    title: "Continuez avec la bêta MPK Academy",
    guestCopy:
      "Leçons, entraînement, tâches d’expression écrite et orale et examens blancs sont gratuits pour les testeurs invités. Créez votre compte avec votre code d’invitation pour conserver ce résultat.",
    activateCopy:
      "Saisissez votre code d’invitation pour débloquer tout le programme et poursuivre à partir de ce résultat.",
    createAccount: "Créer mon compte bêta",
    haveAccount: "J’ai déjà un compte",
    activate: "Activer l’accès bêta",
  },
  accessUntil: (date: string) => `Accès bêta jusqu’au ${date}`,
  planLabel: "Accès bêta",
};

export const beta = { en, fr };
