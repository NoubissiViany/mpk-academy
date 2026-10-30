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
    extraCheckpoints: [
      {
        prompt: "The course is over: « J’ai suivi ce cours ___ trois mois. »",
        promptFr:
          "La formation est terminée : « J’ai suivi ce cours ___ trois mois. »",
        options: ["depuis", "pendant", "il y a"],
        answer: 1,
        explanation:
          "Pendant introduces the bounded length of the completed course. Depuis would connect a starting point or duration to a continuing situation.",
        explanationFr:
          "« Pendant » introduit la durée délimitée de la formation terminée. « Depuis » relierait un point de départ ou une durée à une situation qui continue.",
      },
      {
        prompt: "Which phrase places the move two years before today?",
        promptFr:
          "Quelle phrase situe le déménagement deux ans avant aujourd’hui ?",
        options: [
          "Je déménage pendant deux ans.",
          "Je déménage depuis deux ans.",
          "J’ai déménagé il y a deux ans.",
        ],
        answer: 2,
        explanation:
          "Il y a locates a completed event in the past; it does not give the length of the move.",
        explanationFr:
          "« Il y a » situe un événement terminé dans le passé ; l’expression n’indique pas la durée du déménagement.",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt: "Which form describes a repeated childhood habit?",
        promptFr:
          "Quelle forme décrit une habitude répétée pendant l’enfance ?",
        options: [
          "Quand j’étais enfant, je jouais ici chaque mercredi.",
          "Quand j’étais enfant, je jouerai ici chaque mercredi.",
          "Quand j’étais enfant, je joue ici demain.",
        ],
        answer: 0,
        explanation:
          "The repeated past habit is expressed with the imparfait: jouais. The other versions mix incompatible time references.",
        explanationFr:
          "L’habitude répétée dans le passé s’exprime à l’imparfait : « jouais ». Les autres versions mélangent des repères temporels incompatibles.",
      },
      {
        prompt:
          "In « Nous discutions quand la lumière s’est éteinte », what is the completed event?",
        promptFr:
          "Dans « Nous discutions quand la lumière s’est éteinte », quel est l’événement ponctuel ?",
        options: [
          "La discussion en cours.",
          "L’extinction de la lumière.",
          "Une habitude de tous les soirs.",
        ],
        answer: 1,
        explanation:
          "S’est éteinte is the event presented against the ongoing discussion, expressed by discutions.",
        explanationFr:
          "« S’est éteinte » présente l’événement sur le fond de la discussion en cours, exprimée par « discutions ».",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt: "Complete: « Les participantes sont ___ à l’heure. »",
        promptFr: "Complétez : « Les participantes sont ___ à l’heure. »",
        options: ["arrivé", "arrivés", "arrivées"],
        answer: 2,
        explanation:
          "With être, arrivées agrees with the feminine plural subject les participantes.",
        explanationFr:
          "Avec « être », « arrivées » s’accorde avec le sujet féminin pluriel « les participantes ».",
      },
      {
        prompt: "Complete: « Elles ont ___ les dossiers ce matin. »",
        promptFr: "Complétez : « Elles ont ___ les dossiers ce matin. »",
        options: ["classé", "classées", "classés"],
        answer: 0,
        explanation:
          "With avoir, the object les dossiers follows the verb. The participle does not agree with the subject elles.",
        explanationFr:
          "Avec « avoir », le complément « les dossiers » est placé après le verbe. Le participe ne s’accorde pas avec le sujet « elles ».",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt:
          "Which sentence completes the reason and states its consequence?",
        promptFr:
          "Quelle phrase présente une cause et une conséquence dans une phrase complète ?",
        options: [
          "Parce que le magasin ferme tôt.",
          "Nous partons maintenant parce que le magasin ferme tôt.",
          "Le magasin parce que nous maintenant.",
        ],
        answer: 1,
        explanation:
          "Nous partons maintenant is a complete main clause; parce que introduces the reason.",
        explanationFr:
          "« Nous partons maintenant » est une proposition principale complète ; « parce que » introduit la cause.",
      },
      {
        prompt: "Which version clearly identifies who performs the action?",
        promptFr: "Quelle version indique clairement qui fait l’action ?",
        options: [
          "Après la réunion, dans le bureau.",
          "Le dossier avant demain parce que.",
          "Après la réunion, Léa enverra le dossier.",
        ],
        answer: 2,
        explanation:
          "Léa is the subject and enverra the verb. The time phrase adds information to a complete statement.",
        explanationFr:
          "« Léa » est le sujet et « enverra » le verbe. Le complément de temps apporte une précision à une phrase complète.",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt:
          "Complete the consequence: « Le bus est annulé ; ___, nous prenons le train. »",
        promptFr:
          "Complétez la conséquence : « Le bus est annulé ; ___, nous prenons le train. »",
        options: ["donc", "pourtant", "parce que"],
        answer: 0,
        explanation:
          "Taking the train follows from the cancellation, so donc introduces a consequence.",
        explanationFr:
          "Prendre le train résulte de l’annulation : « donc » introduit une conséquence.",
      },
      {
        prompt:
          "Which connector gives the reason? « Je reste chez moi ___ je suis malade. »",
        promptFr:
          "Quel connecteur donne la cause ? « Je reste chez moi ___ je suis malade. »",
        options: ["pourtant", "parce que", "donc"],
        answer: 1,
        explanation:
          "The illness explains staying at home. Parce que introduces that cause.",
        explanationFr:
          "La maladie explique le fait de rester chez soi. « Parce que » introduit cette cause.",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt:
          "In « Vous pouvez joindre la responsable à ce numéro », what does joindre mean?",
        promptFr:
          "Dans « Vous pouvez joindre la responsable à ce numéro », que signifie « joindre » ?",
        options: [
          "Ajouter une pièce au dossier.",
          "Assembler deux documents.",
          "Entrer en contact avec une personne.",
        ],
        answer: 2,
        explanation:
          "The object is a person and the sentence gives a phone number: joindre means contact.",
        explanationFr:
          "Le complément est une personne et la phrase donne un numéro : « joindre » signifie la contacter.",
      },
      {
        prompt: "In « La séance est reportée à vendredi », what has happened?",
        promptFr:
          "Dans « La séance est reportée à vendredi », qu’est-il arrivé ?",
        options: [
          "La séance aura lieu plus tard.",
          "La séance est définitivement supprimée.",
          "La séance change seulement de salle.",
        ],
        answer: 0,
        explanation:
          "The new day shows that reportée means postponed. Neither cancellation nor a room change is stated.",
        explanationFr:
          "Le nouveau jour indique que « reportée » signifie déplacée à une date ultérieure. Ni une annulation ni un changement de salle ne sont annoncés.",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt: "Choose the usual expression: « Je voudrais ___ rendez-vous. »",
        promptFr:
          "Choisissez l’expression habituelle : « Je voudrais ___ rendez-vous. »",
        options: ["déposer", "prendre", "remplir"],
        answer: 1,
        explanation:
          "Prendre rendez-vous is the usual combination. Déposer goes with une demande and remplir with un formulaire.",
        explanationFr:
          "« Prendre rendez-vous » est la combinaison habituelle. On peut « déposer une demande » et « remplir un formulaire ».",
      },
      {
        prompt: "Choose the natural request about an application.",
        promptFr: "Choisissez la demande naturelle au sujet d’une candidature.",
        options: [
          "Où puis-je prendre plein ma demande ?",
          "Où puis-je joindre un rendez-vous ?",
          "Où puis-je déposer ma demande ?",
        ],
        answer: 2,
        explanation:
          "Déposer une demande means submit an application. The other combinations do not express this action naturally.",
        explanationFr:
          "« Déposer une demande » signifie la remettre au service concerné. Les autres combinaisons n’expriment pas naturellement cette action.",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt: "Which message fits a friend you already address with tu?",
        promptFr: "Quel message convient à un ami que vous tutoyez déjà ?",
        options: [
          "Tu peux m’envoyer l’adresse ? Merci !",
          "Veuillez agréer, Monsieur, mes salutations distinguées.",
          "Madame la directrice, je sollicite une audience.",
        ],
        answer: 0,
        explanation:
          "The first keeps the familiar relationship and makes a clear request. The formal titles and closing do not fit this situation.",
        explanationFr:
          "La première proposition garde la relation familière et formule une demande claire. Les titres et la formule très formelle ne conviennent pas ici.",
      },
      {
        prompt:
          "Which version keeps vous consistently in a professional request?",
        promptFr:
          "Quelle version garde le vouvoiement dans une demande professionnelle ?",
        options: [
          "Pourriez-vous vérifier ton dossier ?",
          "Pourriez-vous vérifier votre dossier ?",
          "Peux-tu vérifier votre dossier ?",
        ],
        answer: 1,
        explanation:
          "Pourriez-vous and votre both use the same form of address. Mixing tu and vous here is inconsistent.",
        explanationFr:
          "« Pourriez-vous » et « votre » emploient la même forme d’adresse. Mélanger tutoiement et vouvoiement serait incohérent ici.",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt: "Which division preserves meaningful groups?",
        promptFr: "Quel découpage respecte les groupes de sens ?",
        options: [
          "Je voudrais / un / billet pour demain.",
          "Je / voudrais un billet / pour / demain.",
          "Je voudrais un billet / pour demain matin.",
        ],
        answer: 2,
        explanation:
          "The request and its time detail form useful groups. Separating a determiner from its noun or a preposition from its complement interrupts meaning.",
        explanationFr:
          "La demande et le complément de temps forment des groupes utiles. Séparer un déterminant de son nom ou une préposition de son complément coupe le sens.",
      },
      {
        prompt:
          "What is a useful first step when a sentence is hard to say clearly?",
        promptFr:
          "Quelle première étape aide à dire clairement une phrase difficile ?",
        options: [
          "La dire lentement par groupes de sens.",
          "Accélérer pour supprimer toutes les pauses.",
          "Faire une pause après chaque mot isolé.",
        ],
        answer: 0,
        explanation:
          "Slow practice with meaningful groups supports clarity before speed increases. Neither constant speed nor word-by-word breaks is the aim.",
        explanationFr:
          "Une pratique lente par groupes de sens favorise la clarté avant d’accélérer. Ni la vitesse constante ni les pauses après chaque mot ne sont l’objectif.",
      },
    ],
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
    extraCheckpoints: [
      {
        prompt:
          "You heard the price but not whether it includes materials. What should you ask?",
        promptFr:
          "Vous avez entendu le prix, mais pas si le matériel est compris. Que demandez-vous ?",
        options: [
          "Vous pouvez reprendre toute votre présentation ?",
          "Le matériel est-il compris dans ce prix ?",
          "Je vais changer de sujet maintenant.",
        ],
        answer: 1,
        explanation:
          "The focused question checks exactly what is missing while preserving the information already understood.",
        explanationFr:
          "La question ciblée vérifie précisément l’information manquante tout en conservant ce qui a déjà été compris.",
      },
      {
        prompt:
          "You cannot remember agrafeuse. Which description keeps the exchange going?",
        promptFr:
          "Vous ne retrouvez pas le mot « agrafeuse ». Quelle description permet de poursuivre l’échange ?",
        options: [
          "C’est impossible, je ne peux plus parler.",
          "Ce mot signifie toujours la même chose.",
          "C’est l’objet qui sert à attacher des feuilles ensemble.",
        ],
        answer: 2,
        explanation:
          "Describing the function lets the other person identify the object without ending the exchange.",
        explanationFr:
          "Décrire la fonction permet à l’autre personne de reconnaître l’objet sans interrompre l’échange.",
      },
    ],
  },
  {
    id: "shared-lesson-011",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "Replace objects without losing meaning",
    titleFr: "Remplacer les compléments sans perdre le sens",
    level: "B1",
    difficulty: 2,
    competencies: ["grammar_accuracy", "reformulation"],
    topic: "Replace objects without losing meaning",
    estimatedTime: 720,
    status: "published",
    isFree: false,
    objectives: ["Replace objects without losing meaning"],
    explanation:
      "Identify the verb and the object before choosing a pronoun. In the examples here, le, la and les replace a direct object: Je consulte le document becomes Je le consulte. With a verb such as parler à, lui replaces one person and leur replaces several people: Je parle à mes collègues becomes Je leur parle. These pronouns normally go before the conjugated verb, or before the infinitive they belong to: Je vais les appeler. Do not choose only from the gender or number of the noun: the verb’s construction matters first. Not every expression with à takes lui or leur; learn the construction with the verb. After replacing the noun, check that the reader can still identify the person or object. A pronoun with two possible referents can make a sentence less clear than repeating the noun.",
    explanationFr:
      "Repérez le verbe et son complément avant de choisir un pronom. Dans ces exemples, « le », « la » et « les » remplacent un complément direct : « Je consulte le document » devient « Je le consulte ». Avec un verbe comme « parler à », « lui » remplace une personne et « leur » plusieurs : « Je parle à mes collègues » devient « Je leur parle ». Ces pronoms se placent généralement avant le verbe conjugué, ou avant l’infinitif auquel ils se rapportent : « Je vais les appeler ». Ne choisissez pas seulement d’après le genre ou le nombre du nom : la construction du verbe compte d’abord. Toutes les expressions avec « à » ne prennent pas « lui » ou « leur » ; apprenez la construction avec le verbe. Après le remplacement, vérifiez que le lecteur peut encore identifier la personne ou l’objet. Si deux référents sont possibles, répéter le nom peut être plus clair.",
    examples: [
      "Je lis la lettre. → Je la lis.",
      "Je téléphone à mes parents. → Je leur téléphone.",
      "Je vais consulter les horaires. → Je vais les consulter.",
    ],
    guidedApplication:
      "Replace the repeated object in three short messages. Underline the verb, identify its construction, and explain what each pronoun refers to.",
    guidedApplicationFr:
      "Remplacez le complément répété dans trois messages courts. Soulignez le verbe, repérez sa construction et expliquez à quoi renvoie chaque pronom.",
    commonErrors: [
      "Choosing lui for every person, even after a verb with a direct object.",
      "Using a pronoun when its reference is unclear.",
    ],
    commonErrorsFr: [
      "Choisir « lui » pour toute personne, même avec un verbe à complément direct.",
      "Employer un pronom dont le référent est ambigu.",
    ],
    checkpoint: {
      prompt: "Replace la facture: « Je vérifie la facture. »",
      promptFr: "Remplacez « la facture » : « Je vérifie la facture. »",
      options: ["Je lui vérifie.", "Je la vérifie.", "Je leur vérifie."],
      answer: 1,
      explanation:
        "Vérifier takes a direct object here. La replaces the feminine singular noun la facture.",
      explanationFr:
        "« Vérifier » prend ici un complément direct. « La » remplace le nom féminin singulier « la facture ».",
    },
    extraCheckpoints: [
      {
        prompt: "Replace à mes voisins: « Je parle à mes voisins. »",
        promptFr: "Remplacez « à mes voisins » : « Je parle à mes voisins. »",
        options: ["Je les parle.", "Je lui parle.", "Je leur parle."],
        answer: 2,
        explanation:
          "Parler à introduces people as indirect objects. Leur refers to several people.",
        explanationFr:
          "« Parler à » introduit des personnes comme compléments indirects. « Leur » renvoie à plusieurs personnes.",
      },
      {
        prompt: "Where does les go in « Je vais appeler les responsables »?",
        promptFr:
          "Où placer « les » dans « Je vais appeler les responsables » ?",
        options: [
          "Je vais les appeler.",
          "Je les vais appeler.",
          "Je vais appeler les.",
        ],
        answer: 0,
        explanation:
          "The pronoun belongs to appeler and goes before that infinitive.",
        explanationFr:
          "Le pronom se rapporte à « appeler » et se place avant cet infinitif.",
      },
    ],
  },
  {
    id: "shared-lesson-012",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "Negation changes the message",
    titleFr: "La négation change le message",
    level: "A2",
    difficulty: 1,
    competencies: ["grammar_accuracy", "specific_detail"],
    topic: "Negation changes the message",
    estimatedTime: 720,
    status: "published",
    isFree: false,
    objectives: ["Negation changes the message"],
    explanation:
      "In careful written French, ne and pas usually surround the conjugated verb: Je ne comprends pas. Before a vowel, ne becomes n’. Other negative expressions change the meaning: ne… plus says that something has stopped; ne… jamais means never. Compare Je ne travaille pas le lundi with Je ne travaille plus le lundi: the second suggests that the schedule used to be different. Read the whole expression before choosing an answer. After a negative form of avoir, un, une and des usually become de or d’: J’ai une voiture becomes Je n’ai pas de voiture. This rule does not apply to every verb or sentence; for example, Ce n’est pas une erreur keeps une. In conversation, speakers often omit ne. Learn to understand that spoken pattern while keeping the complete negative form in formal writing.",
    explanationFr:
      "En français écrit soigné, « ne » et « pas » entourent généralement le verbe conjugué : « Je ne comprends pas ». Devant une voyelle, « ne » devient « n’ ». D’autres expressions négatives changent le sens : « ne… plus » indique qu’une situation a cessé ; « ne… jamais » signifie à aucun moment. Comparez « Je ne travaille pas le lundi » et « Je ne travaille plus le lundi » : la deuxième phrase suggère un ancien horaire différent. Lisez toute l’expression avant de choisir une réponse. Après une forme négative d’« avoir », « un », « une » et « des » deviennent généralement « de » ou « d’ » : « J’ai une voiture » devient « Je n’ai pas de voiture ». Cette règle ne concerne pas toutes les phrases : « Ce n’est pas une erreur » garde « une ». À l’oral, « ne » est souvent omis. Apprenez à comprendre cet usage tout en gardant la négation complète dans un écrit formel.",
    examples: [
      "Je ne connais pas cette rue.",
      "Il ne travaille plus ici.",
      "Nous n’avons pas de réservation.",
    ],
    guidedApplication:
      "Write one negative message about an activity you never do and another about an activity you have stopped. Explain the difference.",
    guidedApplicationFr:
      "Écrivez un message négatif sur une activité que vous ne faites jamais, puis un autre sur une activité que vous avez arrêtée. Expliquez la différence.",
    commonErrors: [
      "Treating pas, plus and jamais as identical.",
      "Removing every article after every negative verb.",
    ],
    commonErrorsFr: [
      "Traiter « pas », « plus » et « jamais » comme des mots identiques.",
      "Supprimer tout article après tout verbe négatif.",
    ],
    checkpoint: {
      prompt: "What does « Elle ne vient plus le mardi » suggest?",
      promptFr: "Que suggère « Elle ne vient plus le mardi » ?",
      options: [
        "Elle viendra tous les mardis.",
        "Elle n’est jamais venue le mardi.",
        "Elle venait le mardi, mais ce n’est plus le cas.",
      ],
      answer: 2,
      explanation: "Ne… plus indicates the end of a previous situation.",
      explanationFr: "« Ne… plus » indique la fin d’une situation antérieure.",
    },
    extraCheckpoints: [
      {
        prompt: "Complete: « Nous n’avons pas ___ voiture. »",
        promptFr: "Complétez : « Nous n’avons pas ___ voiture. »",
        options: ["de", "une", "des"],
        answer: 0,
        explanation:
          "In this negative form of avoir, une voiture becomes de voiture.",
        explanationFr:
          "Dans cette forme négative d’« avoir », « une voiture » devient « de voiture ».",
      },
      {
        prompt: "Which sentence means never?",
        promptFr: "Quelle phrase signifie « à aucun moment » ?",
        options: [
          "Je ne prends plus ce bus.",
          "Je ne prends jamais ce bus.",
          "Je ne prends pas ce bus aujourd’hui.",
        ],
        answer: 1,
        explanation:
          "Jamais expresses never; plus indicates a change and aujourd’hui limits the third statement to today.",
        explanationFr:
          "« Jamais » signifie à aucun moment ; « plus » indique un changement et « aujourd’hui » limite la troisième phrase à ce jour.",
      },
    ],
  },
  {
    id: "shared-lesson-013",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "State a condition and its consequence",
    titleFr: "Exprimer une condition et sa conséquence",
    level: "B1",
    difficulty: 2,
    competencies: ["grammar_accuracy", "argumentation"],
    topic: "State a condition and its consequence",
    estimatedTime: 720,
    status: "published",
    isFree: false,
    objectives: ["State a condition and its consequence"],
    explanation:
      "Choose the situation before choosing the tenses. For a possible future situation, use si with the present, followed by a future consequence: Si j’ai le temps, je viendrai. The future belongs in the consequence, not after si in this conditional pattern. For an imagined situation that is not presented as current reality, use si with the imparfait and the conditional in the consequence: Si j’avais plus de temps, je participerais. This contrast lets you distinguish a realistic plan from a hypothesis. Keep the subject clear when two people are involved: Si vous confirmez, nous réserverons. A condition does not assert that the event has already happened. When reading an announcement, do not turn « si le financement est accordé » into a definite promise. These patterns concern conditional si; other uses, such as an indirect question, follow different rules.",
    explanationFr:
      "Choisissez la situation avant de choisir les temps. Pour une situation future possible, employez « si » avec le présent, puis le futur pour la conséquence : « Si j’ai le temps, je viendrai ». Dans cette construction conditionnelle, le futur se place dans la conséquence, pas après « si ». Pour une situation imaginée qui n’est pas présentée comme réelle, employez l’imparfait après « si » et le conditionnel dans la conséquence : « Si j’avais plus de temps, je participerais ». Ce contraste distingue un projet possible d’une hypothèse. Gardez des sujets clairs quand deux personnes interviennent : « Si vous confirmez, nous réserverons ». Une condition n’affirme pas qu’un événement a déjà eu lieu. En lisant une annonce, ne transformez pas « si le financement est accordé » en promesse certaine. Ces constructions concernent le « si » conditionnel ; d’autres emplois, comme l’interrogation indirecte, suivent d’autres règles.",
    examples: [
      "Si le temps le permet, nous sortirons.",
      "Si j’habitais plus près, je viendrais à pied.",
      "Si vous êtes d’accord, nous commencerons demain.",
    ],
    guidedApplication:
      "Write a possible plan with si + present, then an imagined alternative with si + imparfait. Identify the condition and the consequence in each.",
    guidedApplicationFr:
      "Écrivez un projet possible avec « si » et le présent, puis une alternative imaginée avec « si » et l’imparfait. Repérez la condition et la conséquence dans chaque phrase.",
    commonErrors: [
      "Putting a future tense after conditional si.",
      "Reading a conditional proposal as an unconditional commitment.",
    ],
    commonErrorsFr: [
      "Mettre le futur après un « si » conditionnel.",
      "Lire une proposition conditionnelle comme un engagement sans condition.",
    ],
    checkpoint: {
      prompt:
        "Complete a possible future plan: « Si tu ___ demain, nous discuterons. »",
      promptFr:
        "Complétez un projet futur possible : « Si tu ___ demain, nous discuterons. »",
      options: ["viens", "viendras", "viendrais"],
      answer: 0,
      explanation:
        "Conditional si takes the present here, while discuterons expresses the future consequence.",
      explanationFr:
        "Le « si » conditionnel prend ici le présent ; « discuterons » exprime la conséquence future.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Complete the imagined situation: « Si j’avais une voiture, je ___ te chercher. »",
        promptFr:
          "Complétez l’hypothèse : « Si j’avais une voiture, je ___ te chercher. »",
        options: ["viens", "viendrais", "viendrai"],
        answer: 1,
        explanation:
          "Si + imparfait is paired here with the conditional viendrais.",
        explanationFr:
          "« Si » suivi de l’imparfait s’associe ici au conditionnel « viendrais ».",
      },
      {
        prompt:
          "« L’atelier ouvrira si le financement est accordé. » What is certain from this sentence?",
        promptFr:
          "« L’atelier ouvrira si le financement est accordé. » Qu’indique cette phrase avec certitude ?",
        options: [
          "Le financement a déjà été accordé.",
          "L’ouverture ne dépend d’aucune décision.",
          "L’ouverture dépend de l’obtention du financement.",
        ],
        answer: 2,
        explanation:
          "The sentence states a condition; it does not say that funding has already been obtained.",
        explanationFr:
          "La phrase pose une condition ; elle ne dit pas que le financement a déjà été obtenu.",
      },
    ],
  },
  {
    id: "shared-lesson-014",
    exam: "shared",
    skill: "grammar",
    kind: "lesson",
    moduleId: "grammar",
    title: "Link information with qui, que and dont",
    titleFr: "Relier les informations avec qui, que et dont",
    level: "B2",
    difficulty: 3,
    competencies: ["grammar_accuracy", "organization"],
    topic: "Link information with qui, que and dont",
    estimatedTime: 720,
    status: "published",
    isFree: false,
    objectives: ["Link information with qui, que and dont"],
    explanation:
      "A relative clause adds information about a noun without starting a separate sentence. Choose the pronoun from its role inside that clause. Qui is the subject: Le collègue qui organise la réunion. Que replaces a direct object: Le dossier que vous consultez. Dont is useful when the missing link is introduced by de: Le projet dont je parle, because parler de is the construction. Do not choose qui simply because the noun is a person: La personne que j’appelle uses que because j’ is the subject and the person is the object of appeler. Reconstruct the two original sentences if you are unsure. Place the relative clause close to the noun it describes so the reference is clear. Avoid chaining several long relative clauses when two shorter sentences would be easier to follow. Grammatical linking should improve clarity, not just make a sentence longer.",
    explanationFr:
      "Une proposition relative ajoute une information sur un nom sans commencer une nouvelle phrase. Choisissez le pronom selon son rôle dans cette proposition. « Qui » est sujet : « Le collègue qui organise la réunion ». « Que » remplace un complément direct : « Le dossier que vous consultez ». « Dont » convient quand le lien manquant est introduit par « de » : « Le projet dont je parle », puisque la construction est « parler de ». Ne choisissez pas « qui » simplement parce que le nom désigne une personne : « La personne que j’appelle » prend « que », car « j’ » est sujet et la personne est complément d’« appeler ». En cas de doute, reconstruisez les deux phrases de départ. Placez la relative près du nom qu’elle décrit pour garder un référent clair. Évitez d’enchaîner plusieurs relatives longues si deux phrases courtes seraient plus faciles à suivre. La liaison grammaticale doit améliorer la clarté, pas seulement allonger la phrase.",
    examples: [
      "Le service qui répond aux demandes est fermé.",
      "Voici le formulaire que vous devez remplir.",
      "C’est le problème dont nous avons discuté.",
    ],
    guidedApplication:
      "Combine three pairs of sentences using qui, que and dont. Reconstruct each original verb and its subject or complement to justify your choice.",
    guidedApplicationFr:
      "Combinez trois paires de phrases avec « qui », « que » et « dont ». Retrouvez le verbe de départ et son sujet ou son complément pour justifier chaque choix.",
    commonErrors: [
      "Choosing the relative pronoun only from whether the noun is a person.",
      "Using dont without a construction involving de.",
    ],
    commonErrorsFr: [
      "Choisir le pronom relatif seulement selon que le nom désigne une personne.",
      "Employer « dont » sans construction avec « de ».",
    ],
    checkpoint: {
      prompt: "Complete: « Voici la personne ___ anime l’atelier. »",
      promptFr: "Complétez : « Voici la personne ___ anime l’atelier. »",
      options: ["que", "dont", "qui"],
      answer: 2,
      explanation:
        "Qui is the subject of anime. The choice follows its role in the clause.",
      explanationFr:
        "« Qui » est sujet d’« anime ». Le choix dépend de son rôle dans la proposition.",
    },
    extraCheckpoints: [
      {
        prompt: "Complete: « La personne ___ vous appelez est absente. »",
        promptFr: "Complétez : « La personne ___ vous appelez est absente. »",
        options: ["que", "qui", "dont"],
        answer: 0,
        explanation:
          "Vous is the subject of appelez; the person is its direct object, replaced by que.",
        explanationFr:
          "« Vous » est sujet d’« appelez » ; la personne est son complément direct, remplacé par « que ».",
      },
      {
        prompt: "Complete: « Voici le sujet ___ nous parlons. »",
        promptFr: "Complétez : « Voici le sujet ___ nous parlons. »",
        options: ["que", "dont", "qui"],
        answer: 1,
        explanation:
          "The construction is parler de quelque chose, so dont replaces de ce sujet.",
        explanationFr:
          "La construction est « parler de quelque chose » : « dont » remplace donc « de ce sujet ».",
      },
    ],
  },
  {
    id: "shared-lesson-015",
    exam: "shared",
    skill: "reading",
    kind: "lesson",
    moduleId: "reading-strategies",
    title: "Paraphrase without changing the claim",
    titleFr: "Reformuler sans changer l’idée",
    level: "B2",
    difficulty: 3,
    competencies: ["reformulation", "inference", "argumentation"],
    topic: "Paraphrase without changing the claim",
    estimatedTime: 720,
    status: "published",
    isFree: false,
    objectives: ["Paraphrase without changing the claim"],
    explanation:
      "A good paraphrase preserves more than the topic. Keep the people concerned, the degree of certainty, the quantity and any conditions. « Certains participants pourraient revenir » does not mean that everyone will return. Words such as plusieurs, uniquement, peut-être and à condition de limit a claim; removing them can change the answer. First identify what the sentence actually states. Then compare each option with that meaning rather than choosing the option with the most repeated words. An option may reuse the same nouns while reversing a cause and consequence. It may also turn a reported opinion into a fact or attribute it to the wrong speaker. After selecting an answer, point to the evidence and explain what the distractors add or remove. When writing a summary, apply the same check: use your own wording, but retain the source’s limits instead of making it sound more certain.",
    explanationFr:
      "Une bonne reformulation conserve plus que le thème. Gardez les personnes concernées, le degré de certitude, la quantité et les conditions éventuelles. « Certains participants pourraient revenir » ne signifie pas que tout le monde reviendra. Des mots comme « plusieurs », « uniquement », « peut-être » et « à condition de » limitent une affirmation ; les supprimer peut changer la réponse. Repérez d’abord ce que la phrase affirme réellement. Comparez ensuite chaque proposition à ce sens, au lieu de choisir celle qui répète le plus de mots. Une réponse peut reprendre les mêmes noms tout en inversant la cause et la conséquence. Elle peut aussi transformer un avis rapporté en fait ou l’attribuer à la mauvaise personne. Après votre choix, montrez l’indice et expliquez ce que les autres réponses ajoutent ou retirent. Dans un résumé, appliquez le même contrôle : employez vos mots en conservant les limites du texte, sans le rendre plus catégorique.",
    examples: [
      "Quelques membres sont favorables. ≠ Tous les membres approuvent.",
      "L’accès est possible sur réservation. → Il faut réserver pour entrer.",
      "Selon l’autrice, ce changement serait utile. → L’autrice y voit un avantage possible.",
    ],
    guidedApplication:
      "Underline a quantity, a condition and a word expressing uncertainty in a short passage. Write a paraphrase and check that all three limits remain.",
    guidedApplicationFr:
      "Soulignez une quantité, une condition et un mot exprimant l’incertitude dans un court texte. Reformulez-le en vérifiant que ces trois limites restent présentes.",
    commonErrors: [
      "Replacing a qualified claim with an absolute statement.",
      "Selecting an answer because it repeats the topic’s vocabulary.",
    ],
    commonErrorsFr: [
      "Remplacer une affirmation nuancée par une affirmation absolue.",
      "Choisir une réponse parce qu’elle répète le vocabulaire du thème.",
    ],
    checkpoint: {
      prompt: "Paraphrase « Plusieurs employés envisagent de venir à vélo ».",
      promptFr: "Reformulez « Plusieurs employés envisagent de venir à vélo ».",
      options: [
        "Tous les employés viennent déjà à vélo.",
        "Des employés réfléchissent à utiliser le vélo.",
        "Aucun employé ne souhaite changer de transport.",
      ],
      answer: 1,
      explanation:
        "Envisagent expresses consideration, not a completed decision, and plusieurs does not mean everyone.",
      explanationFr:
        "« Envisagent » exprime une réflexion, pas une décision déjà réalisée, et « plusieurs » ne signifie pas tout le monde.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Which option preserves « L’accès est réservé aux membres inscrits »?",
        promptFr:
          "Quelle proposition conserve le sens de « L’accès est réservé aux membres inscrits » ?",
        options: [
          "Tout visiteur entre sans inscription.",
          "Seuls les visiteurs non inscrits sont acceptés.",
          "Il faut être membre inscrit pour accéder au lieu.",
        ],
        answer: 2,
        explanation:
          "Réservé aux restricts access to registered members. The condition must remain in the paraphrase.",
        explanationFr:
          "« Réservé aux » limite l’accès aux membres inscrits. Cette condition doit rester dans la reformulation.",
      },
      {
        prompt:
          "« La demande augmente parce que le prix baisse. » Which paraphrase preserves the relation?",
        promptFr:
          "« La demande augmente parce que le prix baisse. » Quelle reformulation garde la relation ?",
        options: [
          "La baisse du prix explique la hausse de la demande.",
          "La hausse du prix entraîne une baisse de la demande.",
          "La hausse de la demande explique la baisse du prix.",
        ],
        answer: 0,
        explanation:
          "The price decrease is the stated cause; reversing cause and consequence changes the claim.",
        explanationFr:
          "La baisse du prix est la cause indiquée ; inverser la cause et la conséquence change l’affirmation.",
      },
    ],
  },
  {
    id: "shared-lesson-016",
    exam: "shared",
    skill: "listening",
    kind: "lesson",
    moduleId: "listening-strategies",
    title: "Keep details linked when listening",
    titleFr: "Relier les détails pendant l’écoute",
    level: "B1",
    difficulty: 2,
    competencies: ["specific_detail", "speaker_intention", "time_expressions"],
    topic: "Keep details linked when listening",
    estimatedTime: 720,
    status: "published",
    isFree: false,
    objectives: ["Keep details linked when listening"],
    explanation:
      "A useful listening note keeps a detail attached to its meaning. A number alone is easy to confuse: write « adults 12, students 8 » rather than two unexplained prices. For a service message, track who speaks, the reason for the call, and the action requested. Mark a correction by crossing out the earlier detail instead of keeping two competing answers. Do not try to transcribe every word; a short set of labels can preserve the important relationships while you keep listening. If the message contains an exception, note which group it concerns. Before answering, check whether the question asks for the original plan, the final decision or a reason. The written examples and checkpoints in this lesson teach this analysis. They do not measure listening ability; transfer the technique to an audio practice question without reading its transcript first.",
    explanationFr:
      "Une note d’écoute utile garde chaque détail lié à son sens. Un nombre isolé se confond facilement avec un autre : notez « adultes 12, étudiants 8 » plutôt que deux prix sans explication. Dans un message de service, suivez qui parle, la raison de l’appel et l’action demandée. Marquez une correction en barrant le premier détail au lieu de garder deux réponses concurrentes. N’essayez pas de transcrire chaque mot : quelques étiquettes peuvent conserver les relations importantes pendant que vous continuez à écouter. Si le message contient une exception, notez le groupe concerné. Avant de répondre, vérifiez si la question porte sur le projet initial, la décision finale ou une raison. Les exemples écrits et les questions de cette leçon entraînent cette analyse. Ils ne mesurent pas la compréhension orale ; appliquez ensuite la technique à un exercice audio sans lire d’abord sa transcription.",
    examples: [
      "Tarif : adultes 12 $, étudiants 8 $.",
      "Prévu : mardi → finalement : jeudi.",
      "Appel : atelier → réparation prête → rappeler avant de venir.",
    ],
    guidedApplication:
      "Create three short labelled notes from a service recording, then answer without reopening the transcript. Compare afterwards and identify a relationship you missed.",
    guidedApplicationFr:
      "Prenez trois notes courtes avec des étiquettes à partir d’un message audio, puis répondez sans rouvrir la transcription. Comparez ensuite et repérez une relation oubliée.",
    commonErrors: [
      "Writing numbers without the group or event they describe.",
      "Keeping an earlier detail after the speaker corrects it.",
    ],
    commonErrorsFr: [
      "Noter des nombres sans le groupe ou l’événement concerné.",
      "Garder un premier détail après sa correction par le locuteur.",
    ],
    checkpoint: {
      prompt:
        "Written example: « Adultes : douze dollars ; étudiants : huit. » Which note preserves the groups?",
      promptFr:
        "Exemple écrit : « Adultes : douze dollars ; étudiants : huit. » Quelle note garde les groupes ?",
      options: [
        "12 / 8, sans autre indication",
        "Étudiants : 12 ; adultes : 8",
        "Adultes : 12 ; étudiants : 8",
      ],
      answer: 2,
      explanation:
        "The labelled note keeps each amount with the correct group.",
      explanationFr:
        "La note étiquetée garde chaque montant associé au bon groupe.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Written example: « Rendez-vous à neuf heures… pardon, à dix heures. » What should the final note show?",
        promptFr:
          "Exemple écrit : « Rendez-vous à neuf heures… pardon, à dix heures. » Que doit indiquer la note finale ?",
        options: [
          "10 h, après correction de 9 h.",
          "9 h, car cette heure a été donnée en premier.",
          "Deux rendez-vous distincts, à 9 h et à 10 h.",
        ],
        answer: 0,
        explanation:
          "Pardon signals correction, not an additional appointment.",
        explanationFr:
          "« Pardon » signale une correction, pas un rendez-vous supplémentaire.",
      },
      {
        prompt:
          "A question asks why the caller contacted the workshop. Which note directly helps?",
        promptFr:
          "Une question demande pourquoi la personne a appelé l’atelier. Quelle note aide directement ?",
        options: [
          "Le nombre de mots prononcés.",
          "Motif : vérifier si la réparation est terminée.",
          "La première syllabe du nom de la rue.",
        ],
        answer: 1,
        explanation:
          "A reason question needs the purpose of the call, not an unrelated detail.",
        explanationFr:
          "Une question sur la raison demande le but de l’appel, pas un détail sans lien.",
      },
    ],
  },
  {
    id: "shared-lesson-017",
    exam: "shared",
    skill: "writing",
    kind: "lesson",
    moduleId: "writing-strategies",
    title: "Build an argument with an example",
    titleFr: "Construire un argument avec un exemple",
    level: "B2",
    difficulty: 3,
    competencies: ["organization", "argumentation", "connectors"],
    topic: "Build an argument with an example",
    estimatedTime: 720,
    status: "published",
    isFree: false,
    objectives: ["Build an argument with an example"],
    explanation:
      "A developed paragraph does three connected jobs: it states a reason supporting your position, explains that reason, and illustrates it with a relevant example. An example should make the argument clearer, not replace it. If you support longer library opening hours, a worker who finishes after the current closing time can illustrate an access problem. A story about buying a new bicycle would not support that reason without an explicit link. Keep the scope of the conclusion proportionate: one personal experience can illustrate a possibility, but it does not prove that everyone has the same experience. Choose connectors according to the relationship, such as par exemple for illustration and ainsi for a consequence already explained. Before moving to the next paragraph, ask how this paragraph supports your overall position. Two clearly developed arguments are usually more useful than a long list of unexplained ideas.",
    explanationFr:
      "Un paragraphe développé remplit trois fonctions liées : il présente une raison qui soutient votre position, explique cette raison et l’illustre par un exemple pertinent. L’exemple doit éclairer l’argument, pas le remplacer. Si vous défendez des horaires de bibliothèque plus larges, le cas d’une personne qui termine son travail après la fermeture peut illustrer un problème d’accès. Un récit sur l’achat d’un vélo ne soutiendrait pas cette raison sans lien explicite. Gardez une conclusion proportionnée : une expérience personnelle peut illustrer une possibilité, mais ne prouve pas que tout le monde vit la même chose. Choisissez les connecteurs selon la relation, comme « par exemple » pour l’illustration et « ainsi » pour une conséquence déjà expliquée. Avant de passer au paragraphe suivant, demandez-vous comment celui-ci soutient votre position générale. Deux arguments clairement développés sont généralement plus utiles qu’une longue liste d’idées non expliquées.",
    examples: [
      "Des horaires plus larges faciliteraient l’accès aux salariés. Par exemple, une personne qui termine à 18 h pourrait venir après son travail.",
      "Cette expérience illustre une difficulté ; elle ne montre pas que tous les salariés ont le même horaire.",
      "L’exemple soutient la raison, et la raison soutient la position.",
    ],
    guidedApplication:
      "Write one paragraph supporting a practical proposal. Mark the reason, its explanation and the example, then remove any detail that does not support the argument.",
    guidedApplicationFr:
      "Rédigez un paragraphe pour défendre une proposition pratique. Repérez la raison, son explication et l’exemple, puis retirez les détails qui ne soutiennent pas l’argument.",
    commonErrors: [
      "Giving an example without explaining what it illustrates.",
      "Turning one personal experience into a claim about everyone.",
    ],
    commonErrorsFr: [
      "Donner un exemple sans expliquer ce qu’il illustre.",
      "Transformer une expérience personnelle en affirmation sur tout le monde.",
    ],
    checkpoint: {
      prompt: "Which example supports opening a library later for workers?",
      promptFr:
        "Quel exemple soutient une fermeture plus tardive de la bibliothèque pour les salariés ?",
      options: [
        "Une salariée finit à 18 h, après l’heure de fermeture actuelle.",
        "Un voisin a acheté un vélo rouge la semaine dernière.",
        "Le bâtiment compte trois fenêtres sur sa façade principale.",
      ],
      answer: 0,
      explanation:
        "The worker’s schedule directly illustrates why current hours prevent access.",
      explanationFr:
        "L’horaire de la salariée illustre directement pourquoi les horaires actuels empêchent l’accès.",
    },
    extraCheckpoints: [
      {
        prompt:
          "What is a proportionate conclusion from one useful personal experience?",
        promptFr:
          "Quelle conclusion reste proportionnée à une expérience personnelle utile ?",
        options: [
          "Tous les habitants ont nécessairement vécu la même chose.",
          "Cet exemple montre une possibilité, sans prouver qu’elle concerne tous les habitants.",
          "Cette expérience permet de connaître les horaires de tous les salariés.",
        ],
        answer: 1,
        explanation:
          "An individual case can illustrate an argument without establishing a universal fact.",
        explanationFr:
          "Un cas individuel peut illustrer un argument sans établir un fait universel.",
      },
      {
        prompt: "Which connector introduces a concrete illustration?",
        promptFr: "Quel connecteur introduit une illustration concrète ?",
        options: ["Pourtant", "Parce que", "Par exemple"],
        answer: 2,
        explanation:
          "Par exemple marks illustration. Pourtant marks contrast and parce que introduces a cause.",
        explanationFr:
          "« Par exemple » marque l’illustration. « Pourtant » marque l’opposition et « parce que » introduit une cause.",
      },
    ],
  },
  {
    id: "shared-lesson-018",
    exam: "shared",
    skill: "writing",
    kind: "lesson",
    moduleId: "writing-strategies",
    title: "Revise in a useful order",
    titleFr: "Relire dans un ordre utile",
    level: "B1",
    difficulty: 2,
    competencies: ["task_completion", "grammar_accuracy", "organization"],
    topic: "Revise in a useful order",
    estimatedTime: 720,
    status: "published",
    isFree: false,
    objectives: ["Revise in a useful order"],
    explanation:
      "Revision works better when each pass has a purpose. First compare your text with the task: recipient, requested information, purpose and word range. A grammatically accurate message can still miss the invitation or explanation requested. Next check the order of ideas and whether each pronoun has a clear reference. Then check forms you can reasonably control: subject–verb agreement, time references, negative expressions and consistent tu or vous. Read the whole sentence after a correction; changing one word can require another agreement change. Finish with spelling and punctuation, leaving enough time to save or submit. Do not spend all your remaining time replacing ordinary words with unfamiliar synonyms. A clear word used accurately is more useful than an ambitious word that changes the meaning. Use a model response to identify a technique you can apply, not as wording that every acceptable answer must copy.",
    explanationFr:
      "La relecture est plus efficace quand chaque passage a un objectif. Comparez d’abord votre texte à la consigne : destinataire, informations demandées, intention et nombre de mots. Un message grammaticalement correct peut encore oublier l’invitation ou l’explication attendue. Vérifiez ensuite l’ordre des idées et le référent de chaque pronom. Contrôlez alors les formes que vous pouvez maîtriser : accord sujet-verbe, repères temporels, négation et cohérence entre tutoiement et vouvoiement. Relisez toute la phrase après une correction ; changer un mot peut demander un autre accord. Terminez par l’orthographe et la ponctuation, en gardant du temps pour enregistrer ou envoyer. Ne consacrez pas tout le temps restant à remplacer des mots courants par des synonymes mal connus. Un mot clair et juste est plus utile qu’un mot recherché qui change le sens. Utilisez un modèle pour repérer une technique réutilisable, pas comme un texte à recopier pour obtenir une réponse acceptable.",
    examples: [
      "Consigne : inviter et préciser le lieu → vérifier que les deux informations sont présentes.",
      "Les collègues arrive. → Les collègues arrivent.",
      "Pourriez-vous me répondre ? Je vous remercie.",
    ],
    guidedApplication:
      "Revise a short draft in three passes: task coverage, organization, then language. Record one useful change from each pass and explain its purpose.",
    guidedApplicationFr:
      "Relisez un court brouillon en trois passages : réalisation de la tâche, organisation, puis langue. Notez une modification utile par passage et expliquez son objectif.",
    commonErrors: [
      "Correcting minor spelling while leaving a required part of the task absent.",
      "Replacing words with synonyms whose meaning is uncertain.",
    ],
    commonErrorsFr: [
      "Corriger de petits détails d’orthographe en laissant une partie de la tâche absente.",
      "Remplacer des mots par des synonymes dont le sens est incertain.",
    ],
    checkpoint: {
      prompt:
        "The task asks for a date and meeting place, but the draft gives only the date. What comes first?",
      promptFr:
        "La consigne demande une date et un lieu, mais le brouillon ne donne que la date. Que faire d’abord ?",
      options: [
        "Changer tous les adjectifs pour des mots plus rares.",
        "Ajouter une ponctuation décorative à chaque phrase.",
        "Ajouter le lieu demandé dans la consigne.",
      ],
      answer: 2,
      explanation:
        "Task coverage takes priority: a missing meeting place prevents the message from fulfilling its purpose.",
      explanationFr:
        "La réalisation de la tâche est prioritaire : l’absence du lieu empêche le message de remplir son objectif.",
    },
    extraCheckpoints: [
      {
        prompt: "Which correction resolves subject–verb agreement?",
        promptFr: "Quelle correction rétablit l’accord sujet-verbe ?",
        options: [
          "Les collègues arrivent demain.",
          "Les collègues arrive demain.",
          "Les collègues arriver demain.",
        ],
        answer: 0,
        explanation:
          "The plural subject les collègues requires arrivent in the present tense.",
        explanationFr:
          "Le sujet pluriel « les collègues » demande « arrivent » au présent.",
      },
      {
        prompt:
          "Why reread the sentence after changing its subject from il to elles?",
        promptFr:
          "Pourquoi relire la phrase après avoir remplacé « il » par « elles » ?",
        options: [
          "Le sens et les accords ne peuvent jamais changer.",
          "Le verbe et certains accords peuvent aussi devoir changer.",
          "Tous les mots doivent obligatoirement passer au féminin.",
        ],
        answer: 1,
        explanation:
          "A subject change can affect verb agreement and other dependent forms; it does not mechanically change every word.",
        explanationFr:
          "Changer le sujet peut modifier l’accord du verbe et d’autres formes liées ; cela ne change pas automatiquement tous les mots.",
      },
    ],
  },
];
