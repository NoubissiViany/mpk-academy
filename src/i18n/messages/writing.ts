const en = {
  cta: {
    title: "AI feedback on this text",
    body: "Get a level for each criterion, the corrections that matter most, and one paragraph rewritten at your target level. Usually ready in about a minute.",
    button: "Get AI feedback",
    sending: "Sending…",
    limit: "Two AI reviews a day during the beta.",
  },
  consent: {
    title: "Before your first AI review",
    points: [
      "When you ask for AI feedback, your text or recording, the task, your exam and target, and your interface language are sent to Groq, the AI provider we use. Your name and email are not sent.",
      "Recordings are transcribed by Groq and then deleted: MPK never stores your voice. We have turned on Groq’s Zero Data Retention setting, so Groq does not keep your text, audio, or transcript afterwards.",
      "MPK keeps your texts, transcripts, and their feedback in your account so you can review and compare them. You can ask us to delete them at any time.",
      "AI feedback can be wrong. Treat levels as practice estimates, not official scores, and tell us when a correction is wrong.",
    ],
    agree: "I agree to send my writing and recordings to Groq for AI feedback.",
    confirm: "Agree and continue",
    privacy: "Privacy notice",
    withdraw: "You can withdraw this agreement at any time in Settings.",
  },
  errors: {
    consent_required: "Agree to AI feedback before sending your text.",
    not_included: "AI feedback is not included in your access.",
    unavailable:
      "AI feedback is not available right now. Your text was not sent.",
    daily_limit:
      "You have used today’s AI reviews. Save your practice now and try AI feedback again tomorrow.",
    too_short: "Write at least 20 words to get AI feedback.",
    invalid: "This text cannot be reviewed. Check it and try again.",
    not_found: "This review was not found.",
  },
  status: {
    queuedTitle: "Your text is in the queue",
    ahead: (count: number) =>
      count === 0
        ? "You are next."
        : `${count} ${count === 1 ? "text is" : "texts are"} ahead of yours.`,
    eta: (minutes: number) =>
      minutes <= 1
        ? "Ready in about a minute."
        : `Ready in about ${minutes} minutes.`,
    processingTitle: "Reviewing your text…",
    processingBody:
      "This usually takes under a minute. You can leave this page; the feedback is saved in My texts.",
    deferredTitle: "Saved — feedback tomorrow morning",
    deferredBody:
      "Today’s AI reviews for the beta are used up. Your text is saved and will be reviewed first thing tomorrow.",
    failedTitle: "We could not review this text",
    failedBody:
      "The AI service did not return usable feedback after three tries. This text does not count toward your daily limit.",
    retry: "Try again",
  },
  feedback: {
    eyebrow: "AI FEEDBACK",
    title: (task: string) => `Feedback · ${task}`,
    summary: "Summary",
    targetBar: (band: string, target: string) =>
      `For ${target}, aim for about ${band} on each criterion.`,
    criteria: {
      task: "Task completion",
      coherence: "Coherence and organisation",
      vocabulary: "Vocabulary",
      grammar: "Grammar and sentence control",
    },
    relation: {
      above: "Above your target",
      at: "At your target",
      below: "Below your target",
    },
    evidence: "From your text",
    topFixes: "Fix these first",
    moreFixes: (count: number) =>
      `${count} more ${count === 1 ? "correction" : "corrections"}`,
    noFixes: "No clear errors found.",
    categories: {
      grammar: "Grammar",
      agreement: "Agreement",
      verb: "Verb form",
      spelling: "Spelling",
      vocabulary: "Vocabulary",
      register: "Register",
      punctuation: "Punctuation",
    },
    youWrote: "You wrote",
    better: "Better",
    flag: "This correction is wrong",
    flagged: "Reported — thank you",
    rewriteTitle: "One passage, rewritten at your level",
    original: "Your version",
    improved: "Improved version",
    checksTitle: "Quick checks",
    words: (count: number) => `${count} words`,
    length: {
      under: (min: number) => `Shorter than the ${min} words expected.`,
      over: (max: number) => `Longer than the ${max}-word maximum.`,
      within: "Within the expected length.",
    },
    paragraphs: (count: number) =>
      `${count} ${count === 1 ? "paragraph" : "paragraphs"}`,
    address: {
      mixed:
        "You mix “tu” and “vous”. Keep one form of address unless you are writing to several people.",
      tu: "Informal “tu” throughout.",
      vous: "Formal “vous” throughout.",
      none: "No direct form of address.",
    },
    connectors: (list: string) => `Connecting words used: ${list}.`,
    noConnectors: "No connecting words found.",
    lowVariety:
      "Use a wider range of connecting words, such as cependant, en effet, or par conséquent.",
    dropped: (count: number) =>
      `${count} AI ${count === 1 ? "suggestion was" : "suggestions were"} removed because ${count === 1 ? "it" : "they"} did not match your text.`,
    disclaimer:
      "AI feedback for practice. It can be wrong and is not an official TEF or TCF result.",
    rewriteCta: "Rewrite this text",
    history: "My texts",
    compareTitle: "Your first version and this rewrite",
    firstVersion: "First version",
    thisVersion: "This version",
  },
  history: {
    title: "My texts",
    description:
      "Your writing-practice texts, newest first. Diagnostic writing feedback remains with your assessment results.",
    empty: "You have not sent a text for AI feedback yet.",
    start: "Practise writing",
    status: {
      queued: "In the queue",
      processing: "Being reviewed",
      done: "Feedback ready",
      failed: "Not reviewed",
    },
    rewrite: "Rewrite",
  },
  rewrite: {
    title: (task: string) => `Rewrite · ${task}`,
    description:
      "Use the feedback to improve your text, then send the new version. You will see both versions side by side.",
    label: "Your rewritten text",
    submit: "Send for AI feedback",
    back: "Back to the feedback",
  },
  settings: {
    title: "AI feedback on writing and speaking",
    on: (date: string) => `You agreed to AI feedback on ${date}.`,
    off: "You have not agreed to AI feedback. You will be asked before your first review.",
    withdraw: "Withdraw agreement",
    withdrawn:
      "Agreement withdrawn. No more texts will be sent for AI feedback.",
  },
};

const fr: typeof en = {
  cta: {
    title: "Correction par IA de ce texte",
    body: "Obtenez un niveau pour chaque critère, les corrections les plus importantes et un paragraphe réécrit à votre niveau cible. Prêt en général en une minute environ.",
    button: "Obtenir une correction par IA",
    sending: "Envoi…",
    limit: "Deux corrections par IA par jour pendant la bêta.",
  },
  consent: {
    title: "Avant votre première correction par IA",
    points: [
      "Lorsque vous demandez une correction par IA, votre texte ou votre enregistrement, la tâche, votre examen et votre objectif, ainsi que la langue de l’interface sont envoyés à Groq, le fournisseur d’IA que nous utilisons. Votre nom et votre adresse courriel ne sont pas envoyés.",
      "Les enregistrements sont transcrits par Groq, puis supprimés : MPK ne conserve jamais votre voix. Nous avons activé le réglage « Zero Data Retention » de Groq : Groq ne conserve ensuite ni votre texte, ni le son, ni la transcription.",
      "MPK conserve vos textes, vos transcriptions et leurs corrections dans votre compte pour que vous puissiez les revoir et les comparer. Vous pouvez nous demander de les supprimer à tout moment.",
      "La correction par IA peut se tromper. Considérez les niveaux comme des estimations d’entraînement, pas comme des résultats officiels, et signalez-nous les corrections erronées.",
    ],
    agree:
      "J’accepte d’envoyer mes textes et mes enregistrements à Groq pour obtenir une correction par IA.",
    confirm: "Accepter et continuer",
    privacy: "Avis de confidentialité",
    withdraw:
      "Vous pouvez retirer cet accord à tout moment dans les Paramètres.",
  },
  errors: {
    consent_required:
      "Acceptez la correction par IA avant d’envoyer votre texte.",
    not_included: "La correction par IA n’est pas incluse dans votre accès.",
    unavailable:
      "La correction par IA n’est pas disponible pour le moment. Votre texte n’a pas été envoyé.",
    daily_limit:
      "Vous avez utilisé vos corrections par IA du jour. Enregistrez votre entraînement et réessayez demain.",
    too_short: "Écrivez au moins 20 mots pour obtenir une correction par IA.",
    invalid: "Ce texte ne peut pas être corrigé. Vérifiez-le et réessayez.",
    not_found: "Cette correction est introuvable.",
  },
  status: {
    queuedTitle: "Votre texte est dans la file d’attente",
    ahead: (count: number) =>
      count === 0
        ? "Vous êtes le prochain."
        : `${count} ${count === 1 ? "texte passe" : "textes passent"} avant le vôtre.`,
    eta: (minutes: number) =>
      minutes <= 1
        ? "Prêt dans une minute environ."
        : `Prêt dans environ ${minutes} minutes.`,
    processingTitle: "Correction de votre texte…",
    processingBody:
      "Cela prend en général moins d’une minute. Vous pouvez quitter cette page : la correction sera enregistrée dans Mes textes.",
    deferredTitle: "Enregistré — correction demain matin",
    deferredBody:
      "Les corrections par IA du jour sont épuisées pour la bêta. Votre texte est enregistré et sera corrigé dès demain matin.",
    failedTitle: "Nous n’avons pas pu corriger ce texte",
    failedBody:
      "Le service d’IA n’a pas fourni de correction utilisable après trois essais. Ce texte ne compte pas dans votre limite quotidienne.",
    retry: "Réessayer",
  },
  feedback: {
    eyebrow: "CORRECTION PAR IA",
    title: (task: string) => `Correction · ${task}`,
    summary: "En bref",
    targetBar: (band: string, target: string) =>
      `Pour ${target}, visez environ ${band} sur chaque critère.`,
    criteria: {
      task: "Réalisation de la tâche",
      coherence: "Cohérence et organisation",
      vocabulary: "Vocabulaire",
      grammar: "Grammaire et construction des phrases",
    },
    relation: {
      above: "Au-dessus de l’objectif",
      at: "Objectif atteint",
      below: "Sous l’objectif",
    },
    evidence: "Dans votre texte",
    topFixes: "À corriger en premier",
    moreFixes: (count: number) =>
      `${count} ${count === 1 ? "autre correction" : "autres corrections"}`,
    noFixes: "Aucune erreur nette relevée.",
    categories: {
      grammar: "Grammaire",
      agreement: "Accord",
      verb: "Forme verbale",
      spelling: "Orthographe",
      vocabulary: "Vocabulaire",
      register: "Registre",
      punctuation: "Ponctuation",
    },
    youWrote: "Vous avez écrit",
    better: "Mieux",
    flag: "Cette correction est fausse",
    flagged: "Signalé — merci",
    rewriteTitle: "Un passage réécrit à votre niveau",
    original: "Votre version",
    improved: "Version améliorée",
    checksTitle: "Vérifications rapides",
    words: (count: number) => `${count} mots`,
    length: {
      under: (min: number) => `Plus court que les ${min} mots attendus.`,
      over: (max: number) => `Plus long que le maximum de ${max} mots.`,
      within: "Longueur attendue respectée.",
    },
    paragraphs: (count: number) =>
      `${count} ${count === 1 ? "paragraphe" : "paragraphes"}`,
    address: {
      mixed:
        "Vous mélangez « tu » et « vous ». Gardez une seule forme d’adresse, sauf si vous écrivez à plusieurs personnes.",
      tu: "Tutoiement tout au long du texte.",
      vous: "Vouvoiement tout au long du texte.",
      none: "Aucune forme d’adresse directe.",
    },
    connectors: (list: string) => `Mots de liaison utilisés : ${list}.`,
    noConnectors: "Aucun mot de liaison relevé.",
    lowVariety:
      "Variez davantage les mots de liaison : cependant, en effet, par conséquent…",
    dropped: (count: number) =>
      `${count} ${count === 1 ? "suggestion de l’IA a été retirée" : "suggestions de l’IA ont été retirées"}, car ${count === 1 ? "elle ne correspondait" : "elles ne correspondaient"} pas à votre texte.`,
    disclaimer:
      "Correction par IA pour l’entraînement. Elle peut se tromper et ne constitue pas un résultat officiel du TEF ou du TCF.",
    rewriteCta: "Réécrire ce texte",
    history: "Mes textes",
    compareTitle: "Votre première version et cette réécriture",
    firstVersion: "Première version",
    thisVersion: "Cette version",
  },
  history: {
    title: "Mes textes",
    description:
      "Vos textes d’entraînement, du plus récent au plus ancien. Le retour écrit du diagnostic reste accessible avec les résultats de votre évaluation.",
    empty: "Vous n’avez encore envoyé aucun texte pour une correction par IA.",
    start: "S’entraîner à l’écrit",
    status: {
      queued: "En file d’attente",
      processing: "En cours de correction",
      done: "Correction prête",
      failed: "Non corrigé",
    },
    rewrite: "Réécrire",
  },
  rewrite: {
    title: (task: string) => `Réécriture · ${task}`,
    description:
      "Servez-vous de la correction pour améliorer votre texte, puis envoyez la nouvelle version. Vous verrez les deux versions côte à côte.",
    label: "Votre texte réécrit",
    submit: "Envoyer pour une correction par IA",
    back: "Retour à la correction",
  },
  settings: {
    title: "Correction par IA de l’écrit et de l’oral",
    on: (date: string) => `Vous avez accepté la correction par IA le ${date}.`,
    off: "Vous n’avez pas accepté la correction par IA. La question vous sera posée avant votre première correction.",
    withdraw: "Retirer mon accord",
    withdrawn:
      "Accord retiré. Plus aucun texte ne sera envoyé pour une correction par IA.",
  },
};

export const writing = { en, fr };
