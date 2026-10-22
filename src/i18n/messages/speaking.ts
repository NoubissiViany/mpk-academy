const en = {
  record: {
    title: "Record your answer for AI feedback",
    body: "Your recording is transcribed, then deleted: MPK never stores your voice. You get the transcript, your pace and pauses, a level for each criterion, and corrections. Pronunciation is not assessed.",
    limit: "One recorded answer a day during the beta.",
    start: "Start",
    preparing: (seconds: number) =>
      `Preparation · recording starts in ${seconds} s`,
    recording: "Recording",
    stop: "Stop recording",
    again: "Record again",
    listen: "Your recording (stays on this device)",
    send: "Get AI feedback",
    sending: "Transcribing…",
    micDenied:
      "Microphone access was refused. Allow the microphone for this site in your browser settings, or practise without recording.",
    unsupported:
      "This browser cannot record audio. Practise without recording, or use a recent version of Chrome, Edge, Firefox, or Safari.",
    sizeLimit:
      "Recording stopped at the size limit. You can send what you recorded.",
    practiseWithout: "Practise without recording",
    checking: "Checking today’s recorded answers…",
  },
  errors: {
    unauthenticated: "Your session has expired. Sign in again.",
    consent_required: "Agree to AI feedback before sending your recording.",
    not_included: "Recorded AI feedback is not included in your access.",
    unavailable:
      "Recorded feedback is not available right now. Your recording was not sent.",
    daily_limit:
      "You have used today’s recorded answer. You can still practise without recording.",
    busy_today:
      "Recorded feedback is used up for today across the beta. Try again tomorrow.",
    busy: "The transcription service is busy. Wait a minute, then send the same recording again.",
    too_short:
      "We could not hear enough speech to review. Check your microphone and record again.",
    too_large: "This recording is too large to send. Record a shorter answer.",
    invalid: "This recording cannot be reviewed. Record it again.",
    not_found: "This recording was not found.",
  },
  status: {
    queuedTitle: "Your answer is in the queue",
    processingTitle: "Reviewing your answer…",
    processingBody:
      "This usually takes under a minute. You can leave this page; the feedback is saved in My recordings.",
    failedTitle: "We could not review this answer",
    failedBody:
      "The AI service did not return usable feedback after three tries. Your transcript is saved, so you can ask again without recording.",
    retry: "Try again",
  },
  feedback: {
    eyebrow: "AI SPEAKING FEEDBACK",
    title: (task: string) => `Feedback · ${task}`,
    disclaimer:
      "AI feedback for practice, from an automatic transcript. It can be wrong and is not an official TEF or TCF result.",
    transcriptTitle: "This is what we heard",
    transcriptNote:
      "Automatic transcript. Some mistakes in it may come from the transcription, not from you.",
    metricsTitle: "Pace and pauses",
    length: (minutes: number, seconds: number) =>
      `Recording: ${minutes} min ${seconds} s`,
    pace: {
      slow: (wpm: number) => `${wpm} words a minute · unhurried`,
      steady: (wpm: number) => `${wpm} words a minute · steady`,
      quick: (wpm: number) => `${wpm} words a minute · quick`,
    },
    paceTip: {
      slow: "Try to keep talking: link ideas with « et puis », « en fait », or « c’est-à-dire » instead of stopping.",
      steady: "A steady pace. Keep it up in the exam.",
      quick: "A quick pace. Make sure each idea comes across clearly.",
    },
    noPace: "Too short to measure your pace.",
    pauses: (count: number, longest: number) =>
      count === 0
        ? "No pause of 2 seconds or more."
        : `${count} ${count === 1 ? "pause" : "pauses"} of 2 seconds or more (longest: ${longest} s).`,
    pausesTip:
      "In the exam, fill short silences with « alors », « voyons » or « comment dire » rather than stopping.",
    startDelay: (seconds: number) => `You started speaking after ${seconds} s.`,
    pronunciation: "Pronunciation is not assessed.",
    youSaid: "You said",
    evidence: "From your answer",
    history: "My recordings",
  },
  history: {
    title: "My recordings",
    description:
      "Every answer you recorded for AI feedback, newest first. Only transcripts are kept, never audio.",
    empty: "You have not recorded an answer for AI feedback yet.",
    start: "Practise speaking",
    length: (minutes: number, seconds: number) => `${minutes} min ${seconds} s`,
  },
};

const fr: typeof en = {
  record: {
    title: "Enregistrez votre réponse pour une correction par IA",
    body: "Votre enregistrement est transcrit, puis supprimé : MPK ne conserve jamais votre voix. Vous obtenez la transcription, votre débit et vos pauses, un niveau pour chaque critère et des corrections. La prononciation n’est pas évaluée.",
    limit: "Une réponse enregistrée par jour pendant la bêta.",
    start: "Commencer",
    preparing: (seconds: number) =>
      `Préparation · l’enregistrement commence dans ${seconds} s`,
    recording: "Enregistrement",
    stop: "Arrêter l’enregistrement",
    again: "Recommencer",
    listen: "Votre enregistrement (reste sur cet appareil)",
    send: "Obtenir une correction par IA",
    sending: "Transcription…",
    micDenied:
      "L’accès au micro a été refusé. Autorisez le micro pour ce site dans les réglages du navigateur, ou entraînez-vous sans enregistrer.",
    unsupported:
      "Ce navigateur ne peut pas enregistrer de son. Entraînez-vous sans enregistrer, ou utilisez une version récente de Chrome, Edge, Firefox ou Safari.",
    sizeLimit:
      "L’enregistrement s’est arrêté à la taille maximale. Vous pouvez envoyer ce qui a été enregistré.",
    practiseWithout: "S’entraîner sans enregistrer",
    checking: "Vérification des réponses enregistrées du jour…",
  },
  errors: {
    unauthenticated: "Votre session a expiré. Reconnectez-vous.",
    consent_required:
      "Acceptez la correction par IA avant d’envoyer votre enregistrement.",
    not_included:
      "La correction par IA des réponses enregistrées n’est pas incluse dans votre accès.",
    unavailable:
      "La correction des réponses enregistrées n’est pas disponible pour le moment. Votre enregistrement n’a pas été envoyé.",
    daily_limit:
      "Vous avez utilisé votre réponse enregistrée du jour. Vous pouvez encore vous entraîner sans enregistrer.",
    busy_today:
      "Les corrections de réponses enregistrées sont épuisées pour aujourd’hui sur la bêta. Réessayez demain.",
    busy: "Le service de transcription est occupé. Patientez une minute, puis renvoyez le même enregistrement.",
    too_short:
      "Nous n’avons pas entendu assez de paroles pour corriger. Vérifiez votre micro et recommencez.",
    too_large:
      "Cet enregistrement est trop volumineux. Enregistrez une réponse plus courte.",
    invalid: "Cet enregistrement ne peut pas être corrigé. Recommencez.",
    not_found: "Cet enregistrement est introuvable.",
  },
  status: {
    queuedTitle: "Votre réponse est dans la file d’attente",
    processingTitle: "Correction de votre réponse…",
    processingBody:
      "Cela prend en général moins d’une minute. Vous pouvez quitter cette page : la correction sera enregistrée dans Mes enregistrements.",
    failedTitle: "Nous n’avons pas pu corriger cette réponse",
    failedBody:
      "Le service d’IA n’a pas fourni de correction utilisable après trois essais. Votre transcription est conservée : vous pouvez redemander une correction sans réenregistrer.",
    retry: "Réessayer",
  },
  feedback: {
    eyebrow: "CORRECTION ORALE PAR IA",
    title: (task: string) => `Correction · ${task}`,
    disclaimer:
      "Correction par IA pour l’entraînement, à partir d’une transcription automatique. Elle peut se tromper et ne constitue pas un résultat officiel du TEF ou du TCF.",
    transcriptTitle: "Voici ce que nous avons entendu",
    transcriptNote:
      "Transcription automatique. Certaines erreurs peuvent venir de la transcription, et non de vous.",
    metricsTitle: "Débit et pauses",
    length: (minutes: number, seconds: number) =>
      `Enregistrement : ${minutes} min ${seconds} s`,
    pace: {
      slow: (wpm: number) => `${wpm} mots par minute · débit lent`,
      steady: (wpm: number) => `${wpm} mots par minute · débit régulier`,
      quick: (wpm: number) => `${wpm} mots par minute · débit rapide`,
    },
    paceTip: {
      slow: "Essayez de continuer à parler : enchaînez avec « et puis », « en fait » ou « c’est-à-dire » plutôt que de vous arrêter.",
      steady: "Un débit régulier. Gardez-le à l’examen.",
      quick: "Un débit rapide. Assurez-vous que chaque idée reste claire.",
    },
    noPace: "Trop court pour mesurer votre débit.",
    pauses: (count: number, longest: number) =>
      count === 0
        ? "Aucune pause de 2 secondes ou plus."
        : `${count} ${count === 1 ? "pause" : "pauses"} de 2 secondes ou plus (la plus longue : ${longest} s).`,
    pausesTip:
      "À l’examen, comblez les courts silences avec « alors », « voyons » ou « comment dire » plutôt que de vous arrêter.",
    startDelay: (seconds: number) =>
      `Vous avez commencé à parler après ${seconds} s.`,
    pronunciation: "La prononciation n’est pas évaluée.",
    youSaid: "Vous avez dit",
    evidence: "Dans votre réponse",
    history: "Mes enregistrements",
  },
  history: {
    title: "Mes enregistrements",
    description:
      "Toutes les réponses enregistrées pour une correction par IA, de la plus récente à la plus ancienne. Seules les transcriptions sont conservées, jamais le son.",
    empty:
      "Vous n’avez encore enregistré aucune réponse pour une correction par IA.",
    start: "S’entraîner à l’oral",
    length: (minutes: number, seconds: number) => `${minutes} min ${seconds} s`,
  },
};

export const speaking = { en, fr };
