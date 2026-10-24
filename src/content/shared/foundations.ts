import type { LearningLesson } from "./types";
export const lessons: LearningLesson[] = [
  {
    id: "shared-lesson-001",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "Time and duration",
    titleFr: "Le temps et la durée",
    level: "B1",
    difficulty: 2,
    competencies: ["time_expressions"],
    topic: "Time and duration",
    estimatedTime: 600,
    status: "published",
    isFree: true,
    objectives: ["Time and duration"],
    explanation:
      "Use depuis for an action continuing now, pendant for a bounded duration, and il y a to locate a past event. Ask whether the situation still holds before choosing.",
    explanationFr:
      "Employez « depuis » pour une action qui continue aujourd’hui, « pendant » pour une durée délimitée et « il y a » pour situer un événement passé. Avant de choisir, demandez-vous si la situation est toujours vraie.",
    examples: [
      "J'habite ici depuis deux ans. J'ai étudié pendant six mois. Je suis arrivé il y a deux ans.",
    ],
    guidedApplication:
      "Describe where you live now and a completed course using different time expressions.",
    guidedApplicationFr:
      "Décrivez où vous habitez aujourd’hui et une formation que vous avez terminée, avec des expressions de temps différentes.",
    commonErrors: [
      "Using depuis with a completed duration without considering the meaning.",
    ],
    commonErrorsFr: [
      "Employer « depuis » avec une durée terminée, sans réfléchir au sens.",
    ],
    checkpoint: {
      prompt: "Elle travaille toujours ici. Elle y travaille ___ janvier.",
      options: ["depuis", "pendant"],
      answer: 0,
      explanation:
        "Depuis connects a starting point to a situation that continues.",
      explanationFr:
        "« Depuis » relie un point de départ à une situation qui continue.",
    },
  },
  {
    id: "shared-lesson-002",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "Past events and background",
    titleFr: "Événements passés et arrière-plan",
    level: "B1",
    difficulty: 2,
    competencies: ["grammar_accuracy"],
    topic: "Past events and background",
    estimatedTime: 600,
    status: "published",
    isFree: true,
    objectives: ["Past events and background"],
    explanation:
      "The imparfait sets a scene or describes a repeated habit. The passé composé presents a completed event. Their contrast helps a reader follow a narrative.",
    explanationFr:
      "L’imparfait plante le décor ou décrit une habitude répétée. Le passé composé présente un événement terminé. Ce contraste aide le lecteur à suivre un récit.",
    examples: ["Il pleuvait quand le téléphone a sonné."],
    guidedApplication:
      "Write two background details, then one event that interrupts them.",
    guidedApplicationFr:
      "Écrivez deux détails de décor, puis un événement qui les interrompt.",
    commonErrors: [
      "Putting every verb in the same past tense regardless of its role.",
    ],
    commonErrorsFr: [
      "Mettre tous les verbes au même temps du passé, quel que soit leur rôle.",
    ],
    checkpoint: {
      prompt: "Which sentence separates background from event?",
      promptFr: "Quelle phrase distingue le décor de l’événement ?",
      options: [
        "Je préparais le repas quand elle est arrivée.",
        "Je prépare le repas quand elle arrivait hier.",
      ],
      answer: 0,
      explanation:
        "The ongoing preparation provides the background to an arrival.",
      explanationFr: "La préparation en cours forme le décor de l’arrivée.",
    },
  },
  {
    id: "shared-lesson-003",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "Agreement that carries meaning",
    titleFr: "Des accords qui portent le sens",
    level: "B1",
    difficulty: 2,
    competencies: ["verb_agreement"],
    topic: "Agreement that carries meaning",
    estimatedTime: 600,
    status: "published",
    isFree: true,
    objectives: ["Agreement that carries meaning"],
    explanation:
      "Find the subject before conjugating. With être, the past participle agrees with the subject. With avoir, look for a direct object placed before the verb.",
    explanationFr:
      "Trouvez le sujet avant de conjuguer. Avec être, le participe passé s’accorde avec le sujet. Avec avoir, cherchez un complément d’objet direct placé avant le verbe.",
    examples: ["Elles sont parties. Les lettres que j'ai reçues sont ici."],
    guidedApplication:
      "Underline the subject and the preceding object in the examples, then explain each ending.",
    guidedApplicationFr:
      "Soulignez le sujet et le complément placé avant le verbe dans les exemples, puis expliquez chaque terminaison.",
    commonErrors: [
      "Agreeing an avoir participle with the subject automatically.",
    ],
    commonErrorsFr: [
      "Accorder automatiquement avec le sujet un participe passé employé avec avoir.",
    ],
    checkpoint: {
      prompt: "Les photos que nous avons ___ sont nettes.",
      options: ["prises", "pris"],
      answer: 0,
      explanation:
        "Photos is a feminine plural direct object placed before avons prises.",
      explanationFr:
        "« Les photos » est un complément d’objet direct féminin pluriel placé avant « avons prises ».",
    },
  },
  {
    id: "shared-lesson-004",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "Building clear sentences",
    titleFr: "Construire des phrases claires",
    level: "B1",
    difficulty: 2,
    competencies: ["organization"],
    topic: "Building clear sentences",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Building clear sentences"],
    explanation:
      "Build around a subject and a verb, then add time, place, and a reason. A subordinate clause needs a main clause to complete its meaning.",
    explanationFr:
      "Construisez la phrase autour d’un sujet et d’un verbe, puis ajoutez le temps, le lieu et la cause. Une subordonnée a besoin d’une proposition principale pour avoir un sens complet.",
    examples: ["Comme le bus était en retard, nous avons marché."],
    guidedApplication:
      "Turn a fragment beginning with parce que into a complete sentence.",
    guidedApplicationFr:
      "Transformez un fragment qui commence par « parce que » en phrase complète.",
    commonErrors: ["Leaving a reason clause without a main statement."],
    commonErrorsFr: [
      "Laisser une subordonnée de cause sans proposition principale.",
    ],
    checkpoint: {
      prompt: "Which version is complete?",
      promptFr: "Quelle version est complète ?",
      options: [
        "Comme il pleuvait, nous sommes rentrés.",
        "Parce que le dernier autobus.",
      ],
      answer: 0,
      explanation:
        "The first contains both a reason clause and a complete main clause.",
      explanationFr:
        "La première contient à la fois une subordonnée de cause et une proposition principale complète.",
    },
  },
  {
    id: "shared-lesson-005",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "Connecting ideas accurately",
    titleFr: "Relier ses idées avec précision",
    level: "B1",
    difficulty: 2,
    competencies: ["connectors"],
    topic: "Connecting ideas accurately",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Connecting ideas accurately"],
    explanation:
      "Choose the relationship before the connector: parce que gives a cause, donc a consequence, pourtant a contrast. A sophisticated connector cannot repair a missing logical link.",
    explanationFr:
      "Choisissez la relation logique avant le connecteur : « parce que » donne une cause, « donc » une conséquence, « pourtant » une opposition. Un connecteur recherché ne remplace pas un lien logique absent.",
    examples: ["Le trajet est long ; pourtant, il préfère marcher."],
    guidedApplication:
      "Write a cause, a consequence, and a contrast about the same journey.",
    guidedApplicationFr:
      "Écrivez une cause, une conséquence et une opposition à propos d’un même trajet.",
    commonErrors: ["Using donc when the second idea contradicts the first."],
    commonErrorsFr: [
      "Employer « donc » quand la seconde idée contredit la première.",
    ],
    checkpoint: {
      prompt: "Il était fatigué ; ___, il a terminé le travail.",
      options: ["pourtant", "donc"],
      answer: 0,
      explanation: "Finishing despite fatigue is a contrast.",
      explanationFr:
        "Terminer le travail malgré la fatigue exprime une opposition.",
    },
  },
  {
    id: "shared-lesson-006",
    exam: "shared",
    skill: "vocabulary",
    kind: "lesson",
    moduleId: "vocabulary",
    title: "Learning words in context",
    titleFr: "Apprendre les mots en contexte",
    level: "B1",
    difficulty: 2,
    competencies: ["vocabulary_in_context"],
    topic: "Learning words in context",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Learning words in context"],
    explanation:
      "Read the surrounding action and participants before translating a word. Administrative joindre often means attach, while joindre une personne means contact someone.",
    explanationFr:
      "Lisez l’action et les personnes concernées avant de traduire un mot. Dans un contexte administratif, « joindre » signifie souvent ajouter un document ; « joindre une personne » signifie la contacter.",
    examples: ["Veuillez joindre une facture. Vous pouvez me joindre demain."],
    guidedApplication:
      "Write one sentence for each meaning of joindre and identify its object.",
    guidedApplicationFr:
      "Écrivez une phrase pour chaque sens de « joindre » et repérez son complément.",
    commonErrors: [
      "Assuming a word has the same translation in every context.",
    ],
    commonErrorsFr: [
      "Croire qu’un mot a la même traduction dans tous les contextes.",
    ],
    checkpoint: {
      prompt: "Joindre un justificatif means…",
      promptFr: "« Joindre un justificatif » signifie…",
      options: [
        "Attach a supporting document.",
        "Call the person named on it.",
      ],
      optionsFr: [
        "Ajouter un document qui prouve une information.",
        "Téléphoner à la personne nommée sur le document.",
      ],
      answer: 0,
      explanation: "The object is a document, so the meaning is attach.",
      explanationFr:
        "Le complément est un document : « joindre » veut donc dire l’ajouter au dossier.",
    },
  },
  {
    id: "shared-lesson-007",
    exam: "shared",
    skill: "vocabulary",
    kind: "lesson",
    moduleId: "vocabulary",
    title: "Everyday service vocabulary",
    titleFr: "Le vocabulaire des services du quotidien",
    level: "B1",
    difficulty: 2,
    competencies: ["lexical_range"],
    topic: "Everyday service vocabulary",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Everyday service vocabulary"],
    explanation:
      "Learn useful combinations rather than isolated nouns: prendre rendez-vous, remplir un formulaire, déposer une demande. Notice the verb that goes with the noun.",
    explanationFr:
      "Apprenez des combinaisons utiles plutôt que des noms isolés : prendre rendez-vous, remplir un formulaire, déposer une demande. Remarquez le verbe qui accompagne le nom.",
    examples: ["Je souhaite prendre rendez-vous pour déposer ma demande."],
    guidedApplication: "Prepare three useful sentences for a service counter.",
    guidedApplicationFr: "Préparez trois phrases utiles pour un guichet.",
    commonErrors: ["Translating word combinations literally from English."],
    commonErrorsFr: [
      "Traduire mot à mot des combinaisons de l’anglais ou d’une autre langue.",
    ],
    checkpoint: {
      prompt: "Which combination is natural?",
      promptFr: "Quelle combinaison est naturelle ?",
      options: ["Remplir un formulaire.", "Faire plein un formulaire."],
      answer: 0,
      explanation: "Remplir is the standard verb for completing a form.",
      explanationFr:
        "« Remplir » est le verbe habituel pour compléter un formulaire.",
    },
  },
  {
    id: "shared-lesson-008",
    exam: "shared",
    skill: "vocabulary",
    kind: "lesson",
    moduleId: "vocabulary",
    title: "Choosing a register",
    titleFr: "Choisir le bon registre",
    level: "B1",
    difficulty: 2,
    competencies: ["register"],
    topic: "Choosing a register",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Choosing a register"],
    explanation:
      "Adapt pronouns, requests, and closings to the relationship. Vous and a conditional request are useful with an unfamiliar professional; tu suits an established informal relationship.",
    explanationFr:
      "Adaptez les pronoms, les demandes et les formules de fin à la relation. Le vouvoiement et une demande au conditionnel conviennent avec un professionnel qu’on ne connaît pas ; le tutoiement convient à une relation familière déjà établie.",
    examples: ["Pourriez-vous préciser le délai ? Tu peux me rappeler ?"],
    guidedApplication:
      "Rewrite a friendly request as a short professional email.",
    guidedApplicationFr:
      "Réécrivez une demande amicale sous la forme d’un court courriel professionnel.",
    commonErrors: [
      "Mixing tu with a formal salutation to an unknown recipient.",
    ],
    commonErrorsFr: [
      "Mélanger le tutoiement et une formule d’appel soutenue pour un destinataire inconnu.",
    ],
    checkpoint: {
      prompt: "Which request suits an unfamiliar receptionist?",
      promptFr:
        "Quelle demande convient à une réceptionniste que vous ne connaissez pas ?",
      options: [
        "Pourriez-vous vérifier mon rendez-vous ?",
        "Vérifie mon rendez-vous, toi !",
      ],
      answer: 0,
      explanation:
        "The conditional with vous is a courteous professional request.",
      explanationFr:
        "Le conditionnel avec « vous » forme une demande professionnelle courtoise.",
    },
  },
  {
    id: "shared-lesson-009",
    exam: "shared",
    skill: "pronunciation",
    kind: "lesson",
    moduleId: "pronunciation",
    title: "Rhythm and intelligibility",
    titleFr: "Rythme et intelligibilité",
    level: "B1",
    difficulty: 2,
    competencies: ["pronunciation"],
    topic: "Rhythm and intelligibility",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Rhythm and intelligibility"],
    explanation:
      "Group words by meaning and pause between groups, not after every word. French rhythm often gives prominence to the end of a group. Practice slowly before increasing speed.",
    explanationFr:
      "Regroupez les mots selon le sens et faites une pause entre les groupes, pas après chaque mot. En français, l’accent tombe souvent sur la fin du groupe. Entraînez-vous lentement avant d’accélérer.",
    examples: ["Demain matin / je voudrais visiter le quartier / avec vous."],
    guidedApplication:
      "Read the example aloud three times, keeping the groups intact and breathing at the slashes.",
    guidedApplicationFr:
      "Lisez l’exemple à voix haute trois fois, en gardant les groupes entiers et en respirant aux barres obliques.",
    commonErrors: [
      "Trying to speak fast while breaking every phrase into isolated words.",
    ],
    commonErrorsFr: [
      "Vouloir parler vite tout en découpant chaque phrase en mots isolés.",
    ],
    checkpoint: {
      prompt: "Where is a useful pause?",
      promptFr: "Où une pause est-elle utile ?",
      options: [
        "Après le déjeuner / nous partirons.",
        "Après le / déjeuner nous partirons.",
      ],
      answer: 0,
      explanation: "The time phrase forms a meaningful group.",
      explanationFr: "« Après le déjeuner » forme un groupe de sens.",
    },
  },
  {
    id: "shared-lesson-010",
    exam: "shared",
    skill: "pronunciation",
    kind: "lesson",
    moduleId: "pronunciation",
    title: "Repairing a conversation",
    titleFr: "Rattraper une conversation",
    level: "B1",
    difficulty: 2,
    competencies: ["reformulation"],
    topic: "Repairing a conversation",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Repairing a conversation"],
    explanation:
      "When you miss a detail, ask a focused clarification. When a word is missing, describe its function. This keeps the exchange in French and shows interaction skills.",
    explanationFr:
      "Quand vous manquez un détail, demandez une précision ciblée. Quand un mot vous manque, décrivez sa fonction. L’échange continue ainsi en français et montre vos compétences d’interaction.",
    examples: ["Quand vous dites bientôt, vous pensez à cette semaine ?"],
    guidedApplication:
      "Explain an object without naming it, then ask someone to clarify a date.",
    guidedApplicationFr:
      "Expliquez un objet sans le nommer, puis demandez à quelqu’un de préciser une date.",
    commonErrors: [
      "Switching languages immediately or pretending to understand.",
    ],
    commonErrorsFr: [
      "Changer tout de suite de langue ou faire semblant d’avoir compris.",
    ],
    checkpoint: {
      prompt: "Which response checks the uncertain detail?",
      promptFr: "Quelle réponse vérifie le détail incertain ?",
      options: [
        "Vous avez dit mardi ou jeudi ?",
        "Oui, tout est clair, même si je n'ai pas compris.",
      ],
      answer: 0,
      explanation: "A focused alternative checks the actual uncertainty.",
      explanationFr:
        "Proposer deux possibilités précises vérifie exactement ce qui n’est pas clair.",
    },
  },
];
