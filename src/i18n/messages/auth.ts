const en = {
  login: {
    eyebrow: "Welcome back",
    title: "Continue your preparation.",
    description:
      "Enter your MPK Academy email and password. Your account and learning progress are stored securely.",
    confirmationError:
      "This confirmation link is invalid or has expired. Request a new confirmation email or create the account again.",
    reference: (reference: string) => `Reference: ${reference}`,
  },
  register: {
    eyebrow: "Create your account",
    title: "Start your preparation.",
    description:
      "If you already completed the free assessment in this browser, we will keep your result. You will confirm your email before signing in.",
    betaTitle: "Join the MPK Academy beta.",
    betaDescription:
      "Use the invite code you received. If you already completed the free assessment in this browser, we will keep your result. You will confirm your email before signing in.",
  },
  form: {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    locale: "Preferred explanation language",
    exam: "What are you preparing for?",
    examPlaceholder: "Select TEF or TCF",
    target: "What result are you aiming for?",
    targetNotSure: "I'm not sure",
    inviteCode: "Invite code",
    consentBefore: "I have read and accept the ",
    consentLink: "privacy notice",
    consentAfter: ".",
    loading: "Loading account…",
    submitting: "Preparing…",
    createAccount: "Create my account",
    signIn: "Sign in",
    forgotPassword: "Forgot your password?",
    haveAccount: "Already have an account?",
    newHere: "New to MPK Academy?",
    signInLink: "Sign in",
    createLink: "Create an account",
    accountReady: "Your account is ready.",
    welcomeBack: "Welcome back.",
    createFailed:
      "We could not create your account. Your assessment is still saved.",
    signInFailed: "We could not sign you in. Your assessment is still saved.",
  },
  validation: {
    email: "Enter a valid email address",
    passwordLength: "Use at least 8 characters",
    passwordLetter: "Include at least one letter",
    passwordNumber: "Include at least one number",
    firstName: "Enter your first name",
    lastName: "Enter your last name",
    exam: "Choose TEF Canada or TCF Canada to continue.",
    consent: "Accept the privacy notice to create your account.",
    inviteCode: "Enter your invite code.",
  },
  failures: {
    invalid_submission: "Check the information you entered and try again.",
    email_not_confirmed:
      "Confirm your email before signing in. Check your inbox and spam folder.",
    invalid_credentials: "The email or password is incorrect.",
    account_exists:
      "An account already exists for this email. Sign in instead.",
    rate_limited:
      "Too many email or sign-in attempts were made. Wait a few minutes and try again.",
    service_unavailable:
      "Authentication is temporarily unavailable. Please try again.",
    invalid_signup: "Check your account details and password.",
    invalid_signin: "Enter a valid email and password.",
    invalid_email: "Enter a valid email address.",
    invalid_password: "Use at least 8 characters with a letter and a number.",
    invite_invalid: "This invite code is not valid. Check it and try again.",
    invite_expired: "This invite code has expired. Ask for a new one.",
    invite_exhausted: "This invite code has already been used.",
    invite_beta_full:
      "The beta is full right now. Keep your code — we will open more seats soon.",
    invalid_plan: "Choose a valid preparation plan.",
    plan_unauthenticated: "Sign in again to choose a plan.",
    plan_unavailable:
      "We could not save your plan selection. Please try again.",
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "Reset your password.",
    description: "We will email you a secure link to choose a new password.",
    sent: "If an account exists for that address, a password-reset email is on its way.",
    submit: "Send reset link",
    sending: "Sending…",
  },
  update: {
    eyebrow: "Account recovery",
    title: "Choose a new password.",
    description: "This form is available after opening your recovery email.",
    label: "New password",
    hint: "Use at least eight characters with a letter and a number.",
    submit: "Update password",
    updating: "Updating…",
    updated: "Your password has been updated.",
  },
  checkEmail: {
    eyebrow: "One more step",
    title: "Check your email.",
    body: (email?: string) =>
      `We sent a confirmation link${email ? ` to ${email}` : ""}. Open it in this browser to activate your account. If you completed the free assessment first, using this browser keeps its saved result.`,
    resend: "Resend confirmation email",
    sending: "Sending…",
    resent: "A new confirmation email has been requested.",
    back: "Back to sign in",
  },
  complete: {
    eyebrow: "Account confirmed",
    preparing: "Preparing your learning profile…",
    failed: "We could not finish loading your account.",
  },
};

const fr: typeof en = {
  login: {
    eyebrow: "Bon retour",
    title: "Poursuivez votre préparation.",
    description:
      "Saisissez l’adresse courriel et le mot de passe de votre compte MPK Academy. Votre compte et votre progression sont stockés de façon sécurisée.",
    confirmationError:
      "Ce lien de confirmation est invalide ou a expiré. Demandez un nouveau courriel de confirmation ou créez de nouveau le compte.",
    reference: (reference: string) => `Référence : ${reference}`,
  },
  register: {
    eyebrow: "Créer votre compte",
    title: "Commencez votre préparation.",
    description:
      "Si vous avez déjà fait l’évaluation gratuite dans ce navigateur, nous conserverons votre résultat. Vous confirmerez votre adresse courriel avant de vous connecter.",
    betaTitle: "Rejoignez la bêta MPK Academy.",
    betaDescription:
      "Utilisez le code d’invitation que vous avez reçu. Si vous avez déjà fait l’évaluation gratuite dans ce navigateur, nous conserverons votre résultat. Vous confirmerez votre adresse courriel avant de vous connecter.",
  },
  form: {
    firstName: "Prénom",
    lastName: "Nom",
    email: "Courriel",
    password: "Mot de passe",
    locale: "Langue des explications",
    exam: "Quel examen préparez-vous ?",
    examPlaceholder: "Choisissez le TEF ou le TCF",
    target: "Quel résultat visez-vous ?",
    targetNotSure: "Je ne sais pas",
    inviteCode: "Code d’invitation",
    consentBefore: "J’ai lu et j’accepte l’",
    consentLink: "avis de confidentialité",
    consentAfter: ".",
    loading: "Chargement du compte…",
    submitting: "Préparation…",
    createAccount: "Créer mon compte",
    signIn: "Se connecter",
    forgotPassword: "Mot de passe oublié ?",
    haveAccount: "Vous avez déjà un compte ?",
    newHere: "Nouveau sur MPK Academy ?",
    signInLink: "Se connecter",
    createLink: "Créer un compte",
    accountReady: "Votre compte est prêt.",
    welcomeBack: "Bon retour.",
    createFailed:
      "Nous n’avons pas pu créer votre compte. Votre évaluation est toujours enregistrée.",
    signInFailed:
      "Nous n’avons pas pu vous connecter. Votre évaluation est toujours enregistrée.",
  },
  validation: {
    email: "Saisissez une adresse courriel valide",
    passwordLength: "Utilisez au moins 8 caractères",
    passwordLetter: "Ajoutez au moins une lettre",
    passwordNumber: "Ajoutez au moins un chiffre",
    firstName: "Saisissez votre prénom",
    lastName: "Saisissez votre nom",
    exam: "Choisissez le TEF Canada ou le TCF Canada pour continuer.",
    consent: "Acceptez l’avis de confidentialité pour créer votre compte.",
    inviteCode: "Saisissez votre code d’invitation.",
  },
  failures: {
    invalid_submission: "Vérifiez les renseignements saisis et réessayez.",
    email_not_confirmed:
      "Confirmez votre adresse courriel avant de vous connecter. Vérifiez votre boîte de réception et vos indésirables.",
    invalid_credentials: "L’adresse courriel ou le mot de passe est incorrect.",
    account_exists:
      "Un compte existe déjà pour cette adresse. Connectez-vous plutôt.",
    rate_limited:
      "Trop de tentatives de connexion ou d’envoi de courriels. Patientez quelques minutes et réessayez.",
    service_unavailable:
      "L’authentification est temporairement indisponible. Veuillez réessayer.",
    invalid_signup: "Vérifiez les renseignements du compte et le mot de passe.",
    invalid_signin:
      "Saisissez une adresse courriel et un mot de passe valides.",
    invalid_email: "Saisissez une adresse courriel valide.",
    invalid_password:
      "Utilisez au moins 8 caractères, dont une lettre et un chiffre.",
    invite_invalid:
      "Ce code d’invitation n’est pas valide. Vérifiez-le et réessayez.",
    invite_expired: "Ce code d’invitation a expiré. Demandez-en un nouveau.",
    invite_exhausted: "Ce code d’invitation a déjà été utilisé.",
    invite_beta_full:
      "La bêta est complète pour le moment. Gardez votre code : nous ouvrirons bientôt de nouvelles places.",
    invalid_plan: "Choisissez une formule de préparation valide.",
    plan_unauthenticated: "Reconnectez-vous pour choisir une formule.",
    plan_unavailable:
      "Nous n’avons pas pu enregistrer votre choix de formule. Veuillez réessayer.",
  },
  forgot: {
    eyebrow: "Récupération du compte",
    title: "Réinitialisez votre mot de passe.",
    description:
      "Nous vous enverrons un lien sécurisé pour choisir un nouveau mot de passe.",
    sent: "Si un compte existe pour cette adresse, un courriel de réinitialisation est en route.",
    submit: "Envoyer le lien",
    sending: "Envoi…",
  },
  update: {
    eyebrow: "Récupération du compte",
    title: "Choisissez un nouveau mot de passe.",
    description:
      "Ce formulaire est accessible après l’ouverture de votre courriel de récupération.",
    label: "Nouveau mot de passe",
    hint: "Utilisez au moins huit caractères, dont une lettre et un chiffre.",
    submit: "Mettre à jour le mot de passe",
    updating: "Mise à jour…",
    updated: "Votre mot de passe a été mis à jour.",
  },
  checkEmail: {
    eyebrow: "Encore une étape",
    title: "Vérifiez vos courriels.",
    body: (email?: string) =>
      `Nous avons envoyé un lien de confirmation${email ? ` à ${email}` : ""}. Ouvrez-le dans ce navigateur pour activer votre compte. Si vous avez d’abord fait l’évaluation gratuite, utiliser ce navigateur permet de conserver son résultat.`,
    resend: "Renvoyer le courriel de confirmation",
    sending: "Envoi…",
    resent: "Un nouveau courriel de confirmation a été demandé.",
    back: "Retour à la connexion",
  },
  complete: {
    eyebrow: "Compte confirmé",
    preparing: "Préparation de votre profil d’apprentissage…",
    failed: "Nous n’avons pas pu terminer le chargement de votre compte.",
  },
};

export const auth = { en, fr };
