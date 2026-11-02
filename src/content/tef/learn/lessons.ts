import type { LearningLesson } from "../../shared/types";
export const lessons: LearningLesson[] = [
  {
    id: "tef-lesson-001",
    exam: "TEF",
    skill: "reading",
    kind: "lesson",
    moduleId: "reading-strategies",
    title: "Read for purpose and evidence",
    titleFr: "Lire pour l’intention et les indices",
    level: "B1",
    difficulty: 2,
    competencies: [
      "reading_efficiency",
      "main_idea",
      "specific_detail",
      "inference",
      "vocabulary_in_context",
      "argumentation",
    ],
    topic: "Read for purpose and evidence",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Read for purpose and evidence"],
    explanation:
      "Identify document type, sender, audience, and purpose before choosing an answer. Locate the sentence supporting your choice. For inference, combine clues without adding facts. In a timed reading section, leave a difficult item and return while that section remains open.",
    explanationFr:
      "Repérez le type de document, l’expéditeur, le public et l’intention avant de choisir une réponse. Trouvez la phrase qui justifie votre choix. Pour une inférence, combinez les indices sans ajouter de faits. Dans une section de lecture chronométrée, laissez une question difficile et revenez-y tant que la section est ouverte.",
    examples: ["Avis : la réunion est reportée, mais le lieu reste inchangé."],
    guidedApplication:
      "Explain what changes and what stays the same, then identify the evidence.",
    guidedApplicationFr:
      "Expliquez ce qui change et ce qui ne change pas, puis repérez l’indice dans le texte.",
    commonErrors: [
      "Choosing an option merely because it repeats a word from the document.",
    ],
    commonErrorsFr: [
      "Choisir une réponse simplement parce qu’elle reprend un mot du document.",
    ],
    checkpoint: {
      prompt: "What changes in the example?",
      promptFr: "Qu’est-ce qui change dans l’exemple ?",
      options: ["The meeting time or date.", "The meeting location."],
      optionsFr: [
        "L’heure ou la date de la réunion.",
        "Le lieu de la réunion.",
      ],
      answer: 0,
      explanation:
        "Reportée changes when the meeting occurs; the location is explicitly unchanged.",
      explanationFr:
        "« Reportée » change le moment de la réunion ; le texte précise que le lieu ne change pas.",
    },
    extraCheckpoints: [
      {
        prompt:
          "« Le guichet ferme à midi, mais le formulaire reste accessible en ligne. » What is supported?",
        promptFr:
          "« Le guichet ferme à midi, mais le formulaire reste accessible en ligne. » Quelle réponse est justifiée ?",
        options: [
          "On peut encore accéder au formulaire sur Internet.",
          "Toutes les démarches sont annulées à midi.",
          "Le guichet rouvrira obligatoirement dans une heure.",
        ],
        answer: 0,
        explanation:
          "The contrast preserves online access. The notice does not announce cancellation or a reopening time.",
        explanationFr:
          "L’opposition maintient l’accès en ligne. L’avis n’annonce ni annulation ni heure de réouverture.",
      },
      {
        prompt:
          "A notice asks residents to bring their keys to reception before repairs. What is its main purpose?",
        promptFr:
          "Un avis demande aux résidents de laisser leurs clés à l’accueil avant des travaux. Quelle est son intention principale ?",
        options: [
          "Raconter l’histoire du bâtiment.",
          "Demander une action aux résidents.",
          "Comparer plusieurs entreprises de travaux.",
        ],
        answer: 1,
        explanation:
          "The requested action identifies the practical purpose of this notice. A building-related word alone does not determine the answer.",
        explanationFr:
          "L’action demandée révèle l’objectif pratique de l’avis. Un mot lié au bâtiment ne suffit pas à déterminer la réponse.",
      },
    ],
  },
  {
    id: "tef-lesson-002",
    exam: "TEF",
    skill: "listening",
    kind: "lesson",
    moduleId: "listening-strategies",
    title: "Listen for intention and correction",
    titleFr: "Écouter l’intention et les corrections",
    level: "B1",
    difficulty: 2,
    competencies: [
      "speaker_intention",
      "main_idea",
      "specific_detail",
      "inference",
    ],
    topic: "Listen for intention and correction",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Listen for intention and correction"],
    explanation:
      "During one listening, track who speaks, why, and the requested action. Corrections such as finalement and plutôt can overturn an earlier detail. Preview TEF questions, then commit using the whole message rather than the first familiar word.",
    explanationFr:
      "Pendant l’unique écoute, suivez qui parle, pourquoi, et ce qu’on demande de faire. Des mots comme « finalement » ou « plutôt » peuvent annuler un détail donné plus tôt. Lisez les questions du TEF à l’avance, puis répondez à partir de tout le message, pas du premier mot familier.",
    examples: ["On avait prévu mardi ; finalement, retrouvons-nous jeudi."],
    guidedApplication:
      "Say the original plan, the corrected plan, and the signal word.",
    guidedApplicationFr:
      "Dites le plan de départ, le plan corrigé et le mot qui signale la correction.",
    commonErrors: [
      "Selecting the first date heard despite a later correction.",
    ],
    commonErrorsFr: [
      "Choisir la première date entendue malgré une correction plus loin.",
    ],
    checkpoint: {
      prompt: "Which day should the listener retain?",
      promptFr: "Quel jour l’auditeur doit-il retenir ?",
      options: ["Jeudi.", "Mardi."],
      answer: 0,
      explanation: "Finalement introduces the final decision.",
      explanationFr: "« Finalement » introduit la décision définitive.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Written analysis exercise: « Je vous avais proposé 15 h ; ce sera plutôt 16 h. » Which time is final?",
        promptFr:
          "Exercice d’analyse écrite : « Je vous avais proposé 15 h ; ce sera plutôt 16 h. » Quel horaire est définitif ?",
        options: ["15 h", "15 h 30", "16 h"],
        answer: 2,
        explanation:
          "Plutôt replaces the earlier proposal with 16 h. Reading this transcript trains analysis, not listening itself.",
        explanationFr:
          "« Plutôt » remplace la proposition initiale par 16 h. Lire cette transcription entraîne l’analyse, pas l’écoute elle-même.",
      },
      {
        prompt:
          "Written message: « Le colis est arrivé. Merci de rappeler avant de venir. » What action is requested first?",
        promptFr:
          "Message écrit : « Le colis est arrivé. Merci de rappeler avant de venir. » Quelle action est demandée en premier ?",
        options: [
          "Téléphoner au service.",
          "Venir immédiatement sans appeler.",
          "Attendre une nouvelle livraison.",
        ],
        answer: 0,
        explanation:
          "Avant de venir places the call before the visit. The parcel has already arrived.",
        explanationFr:
          "« Avant de venir » place l’appel avant la visite. Le colis est déjà arrivé.",
      },
    ],
  },
  {
    id: "tef-lesson-003",
    exam: "TEF",
    skill: "writing",
    kind: "lesson",
    moduleId: "writing-techniques",
    title: "Write a continuation and a position",
    titleFr: "Rédiger une suite et une prise de position",
    level: "B1",
    difficulty: 2,
    competencies: [
      "task_completion",
      "organization",
      "connectors",
      "register",
      "grammar_accuracy",
      "argumentation",
    ],
    topic: "Write a continuation and a position",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Write a continuation and a position"],
    explanation:
      "Section A continues a news article: preserve the situation and develop events with coherent past tenses. Section B responds with a justified position, organized arguments, examples, and a closing. Plan before writing and reserve time for editing.",
    explanationFr:
      "La section A demande de continuer un article de presse : gardez la situation et développez les événements avec des temps du passé cohérents. La section B demande une réponse argumentée : une position justifiée, des arguments organisés, des exemples et une conclusion. Faites un plan avant d’écrire et gardez du temps pour relire.",
    examples: [
      "A : Les voisins ont alors proposé leur aide. B : Cette mesure serait utile, à condition de prévoir un accompagnement.",
    ],
    guidedApplication:
      "Draft a three-event plan for A and a position plus two reasons for B.",
    guidedApplicationFr:
      "Préparez un plan en trois événements pour A, et une position avec deux arguments pour B.",
    commonErrors: [
      "Writing an opinion essay instead of continuing the article in A.",
    ],
    commonErrorsFr: [
      "Écrire un texte d’opinion au lieu de continuer l’article dans la section A.",
    ],
    checkpoint: {
      prompt: "Which opening suits a news continuation?",
      promptFr: "Quel début convient à la suite d’un article ?",
      options: [
        "Le lendemain, les bénévoles se sont réunis.",
        "À mon avis, tous les journaux devraient changer.",
      ],
      answer: 0,
      explanation:
        "The first continues events; the second changes the task into commentary.",
      explanationFr:
        "La première phrase poursuit les événements ; la seconde transforme la tâche en commentaire.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Which continuation preserves the news situation: « Un chien a été retrouvé dans un autobus »?",
        promptFr:
          "Quelle suite garde la situation de l’article : « Un chien a été retrouvé dans un autobus » ?",
        options: [
          "Je pense que les transports sont trop chers.",
          "Le conducteur l’a confié à une association locale.",
          "Cher ami, viens prendre le bus avec moi.",
        ],
        answer: 1,
        explanation:
          "The driver’s action develops the reported event. The other choices switch to an opinion or a personal invitation.",
        explanationFr:
          "L’action du conducteur développe l’événement rapporté. Les autres propositions passent à un avis général ou à une invitation personnelle.",
      },
      {
        prompt: "Which plan supports a justified position in writing B?",
        promptFr:
          "Quel plan permet de défendre une position justifiée en expression écrite B ?",
        options: [
          "Une liste d’opinions sans explication.",
          "Une suite d’événements sans lien avec le sujet.",
          "Une position, des arguments illustrés et une conclusion.",
        ],
        answer: 2,
        explanation:
          "A position needs reasons and examples, then a closing that follows from them. Listing views without support does not develop an argument.",
        explanationFr:
          "Une position demande des raisons et des exemples, puis une conclusion cohérente. Énumérer des avis sans les justifier ne développe pas une argumentation.",
      },
    ],
  },
  {
    id: "tef-lesson-004",
    exam: "TEF",
    skill: "speaking",
    kind: "lesson",
    moduleId: "speaking-techniques",
    title: "Ask, react, and persuade",
    titleFr: "Questionner, réagir et convaincre",
    level: "B1",
    difficulty: 2,
    competencies: [
      "interaction",
      "question_formation",
      "persuasion",
      "organization",
    ],
    topic: "Ask, react, and persuade",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Ask, react, and persuade"],
    explanation:
      "Section A requires information gathering: prepare question families about conditions, timing, cost, and practical details. React to replies rather than reading a list. Section B requires persuasion: connect benefits to the other person's concerns and address objections.",
    explanationFr:
      "La section A demande d’obtenir des informations : préparez des familles de questions sur les conditions, les horaires, le coût et les détails pratiques. Réagissez aux réponses au lieu de lire une liste. La section B demande de convaincre : reliez les avantages aux préoccupations de l’autre personne et répondez à ses objections.",
    examples: ["Le samedi est complet ? Avez-vous une place dimanche ?"],
    guidedApplication:
      "Role-play a follow-up after an unavailable date, then respond to a friend's concern about cost.",
    guidedApplicationFr:
      "Jouez une relance après une date indisponible, puis répondez à l’inquiétude d’un ami au sujet du coût.",
    commonErrors: ["Delivering a memorized monologue during an interaction."],
    commonErrorsFr: [
      "Réciter un monologue appris par cœur pendant une interaction.",
    ],
    checkpoint: {
      prompt: "Which reply develops the exchange?",
      promptFr: "Quelle réponse fait avancer l’échange ?",
      options: [
        "Dans ce cas, quel autre créneau proposez-vous ?",
        "Je répète ma première question sans changement.",
      ],
      answer: 0,
      explanation: "The follow-up uses the answer and seeks an alternative.",
      explanationFr:
        "La relance s’appuie sur la réponse reçue et cherche une autre possibilité.",
    },
    extraCheckpoints: [
      {
        prompt:
          "The other person says: « C’est trop cher. » Which reply addresses that objection?",
        promptFr:
          "L’autre personne dit : « C’est trop cher. » Quelle réponse traite cette objection ?",
        options: [
          "On pourrait choisir la formule moins chère et partager les frais.",
          "Le lieu est joli, donc parlons seulement du paysage.",
          "Tu dois être d’accord parce que je le veux.",
        ],
        answer: 0,
        explanation:
          "The reply responds to cost with a concrete alternative. It neither ignores the concern nor relies on pressure.",
        explanationFr:
          "La réponse traite le coût en proposant une solution concrète. Elle n’ignore pas la préoccupation et ne s’appuie pas sur la pression.",
      },
      {
        prompt:
          "Which follow-up clarifies the reply « Le matériel est fourni »?",
        promptFr:
          "Quelle relance précise la réponse « Le matériel est fourni » ?",
        options: [
          "Je vous repose la question sur le jour sans écouter.",
          "Les chaussures sont-elles comprises dans ce matériel ?",
          "Je vais réciter tous mes arguments sur le transport.",
        ],
        answer: 1,
        explanation:
          "The question builds on the reply and checks a specific condition, rather than starting an unrelated topic.",
        explanationFr:
          "La question s’appuie sur la réponse et vérifie une condition précise, au lieu de changer de sujet.",
      },
    ],
  },
  {
    id: "tef-lesson-005",
    exam: "TEF",
    skill: "strategy",
    kind: "lesson",
    moduleId: "exam-strategies",
    title: "Know the TEF Canada tasks",
    titleFr: "Connaître les épreuves du TEF Canada",
    level: "B1",
    difficulty: 2,
    competencies: ["task_completion"],
    topic: "Know the TEF Canada tasks",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Know the TEF Canada tasks"],
    explanation:
      "The MPK TEF simulation contains separate comprehension and production sections. Reading and listening each have 40 questions. Writing has two sections and speaking has two role-plays. This is practice, not an official examination.",
    explanationFr:
      "La simulation TEF de MPK comprend des sections distinctes de compréhension et de production. La compréhension écrite et la compréhension orale ont chacune 40 questions. L’expression écrite comporte deux sections et l’expression orale deux jeux de rôle. Il s’agit d’un entraînement, pas d’un examen officiel.",
    examples: [
      "Écrit A : poursuivre un article. Oral A : obtenir des renseignements.",
    ],
    guidedApplication:
      "Match each productive section to its communication goal.",
    guidedApplicationFr:
      "Associez chaque section de production à son objectif de communication.",
    commonErrors: [
      "Treating all productive tasks as the same opinion response.",
    ],
    commonErrorsFr: [
      "Traiter toutes les tâches de production comme la même réponse d’opinion.",
    ],
    checkpoint: {
      prompt: "What is the purpose of speaking A?",
      promptFr: "Quel est le but de la section A de l’expression orale ?",
      options: ["Obtain information.", "Deliver a prepared academic lecture."],
      optionsFr: [
        "Obtenir des informations.",
        "Présenter un exposé universitaire préparé.",
      ],
      answer: 0,
      explanation: "Speaking A is an information-seeking interaction.",
      explanationFr:
        "La section A de l’expression orale est une interaction pour obtenir des informations.",
    },
    extraCheckpoints: [
      {
        prompt:
          "In the MPK TEF simulation, which activity belongs to speaking B?",
        promptFr:
          "Dans la simulation TEF de MPK, quelle activité correspond à l’expression orale B ?",
        options: [
          "Compléter une phrase à trous.",
          "Recopier un article sans le modifier.",
          "Convaincre une personne en répondant à ses objections.",
        ],
        answer: 2,
        explanation:
          "Speaking B is the persuasion role-play. The other activities do not match its communicative purpose.",
        explanationFr:
          "L’expression orale B est le jeu de rôle de persuasion. Les autres activités ne correspondent pas à son objectif de communication.",
      },
      {
        prompt: "What does completing an MPK simulation provide?",
        promptFr: "Que permet d’obtenir une simulation MPK terminée ?",
        options: [
          "Un bilan d’entraînement à analyser.",
          "Un résultat officiel délivré par le centre d’examen.",
          "Une garantie de réussite à une future épreuve.",
        ],
        answer: 0,
        explanation:
          "MPK provides independent practice evidence, not an official result or a guarantee.",
        explanationFr:
          "MPK fournit des éléments d’entraînement indépendants, pas un résultat officiel ni une garantie.",
      },
    ],
  },
  {
    id: "tef-lesson-006",
    exam: "TEF",
    skill: "strategy",
    kind: "lesson",
    moduleId: "exam-strategies",
    title: "Budget TEF time",
    titleFr: "Gérer son temps au TEF",
    level: "B1",
    difficulty: 2,
    competencies: ["organization"],
    topic: "Budget TEF time",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Budget TEF time"],
    explanation:
      "Reading lasts 60 minutes and listening 40. Writing allocates 25 minutes to A and 35 to B, with minimums of 80 and 200 words. Speaking allocates 5 and 10 minutes. Use planning and checking inside the task's allowance.",
    explanationFr:
      "La compréhension écrite dure 60 minutes et la compréhension orale 40. En expression écrite, la section A dispose de 25 minutes et la section B de 35, avec des minimums de 80 et de 200 mots. En expression orale, les sections durent 5 et 10 minutes. Planifiez et relisez à l’intérieur du temps de chaque tâche.",
    examples: ["Section B : position, deux arguments illustrés, conclusion."],
    guidedApplication:
      "Divide 35 minutes into planning, drafting, and checking without treating that suggested split as an official rule.",
    guidedApplicationFr:
      "Répartissez 35 minutes entre le plan, la rédaction et la relecture, sans considérer ce découpage comme une règle officielle.",
    commonErrors: ["Spending most of writing time on the shorter first task."],
    commonErrorsFr: [
      "Passer la plus grande partie du temps d’écriture sur la première tâche, plus courte.",
    ],
    checkpoint: {
      prompt: "Which minimum applies to writing B?",
      promptFr:
        "Quel minimum s’applique à la section B de l’expression écrite ?",
      options: ["200 words.", "80 words."],
      optionsFr: ["200 mots.", "80 mots."],
      answer: 0,
      explanation:
        "The 80-word minimum belongs to A, while B requires at least 200.",
      explanationFr:
        "Le minimum de 80 mots concerne la section A ; la section B demande au moins 200 mots.",
    },
    extraCheckpoints: [
      {
        prompt: "In MPK writing A, how should the 25 minutes be used?",
        promptFr:
          "Dans l’expression écrite A de MPK, comment utiliser les 25 minutes ?",
        options: [
          "Écrire 25 minutes puis ajouter un temps de relecture.",
          "Planifier, rédiger et relire à l’intérieur des 25 minutes.",
          "Garder la planification pour la fin de l’épreuve suivante.",
        ],
        answer: 1,
        explanation:
          "Planning and checking are included in the task allowance; they do not create extra time.",
        explanationFr:
          "La planification et la relecture font partie du temps de la tâche ; elles ne donnent pas de temps supplémentaire.",
      },
      {
        prompt:
          "A writing B response contains 175 words. What does the lesson’s minimum imply?",
        promptFr:
          "Une réponse à l’écrit B contient 175 mots. Que signifie le minimum indiqué dans la leçon ?",
        options: [
          "Le texte dépasse déjà le minimum de 25 mots.",
          "Le minimum de 80 mots suffit pour cette section.",
          "Il manque au moins 25 mots de contenu pertinent.",
        ],
        answer: 2,
        explanation:
          "Writing B requires at least 200 words: 200 minus 175 is 25. Relevant development is needed rather than empty padding.",
        explanationFr:
          "L’écrit B demande au moins 200 mots : 200 moins 175 donne 25. Il faut développer un contenu pertinent, pas ajouter du remplissage.",
      },
    ],
  },
  {
    id: "tef-lesson-007",
    exam: "TEF",
    skill: "strategy",
    kind: "lesson",
    moduleId: "exam-strategies",
    title: "Review evidence after a TEF simulation",
    titleFr: "Analyser ses résultats après une simulation du TEF",
    level: "B1",
    difficulty: 2,
    competencies: ["inference"],
    topic: "Review evidence after a TEF simulation",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Review evidence after a TEF simulation"],
    explanation:
      "After completion, identify the evidence you missed and classify the competency. Compare your productive response with the rubric, not only the model wording. MPK accuracy is a practice metric and cannot be converted into an official score by simple arithmetic.",
    explanationFr:
      "Après la simulation, repérez l’indice que vous avez manqué et classez la compétence concernée. Comparez votre production à la grille d’évaluation, pas seulement à la formulation du modèle. Le taux de réussite MPK est un indicateur d’entraînement : un simple calcul ne le transforme pas en score officiel.",
    examples: [
      "Erreur : j'ai retenu le premier horaire et ignoré la correction.",
    ],
    guidedApplication:
      "Write one evidence-based lesson from an error and choose a matching practice competency.",
    guidedApplicationFr:
      "Tirez d’une erreur une leçon appuyée sur un indice précis et choisissez une compétence à travailler en conséquence.",
    commonErrors: [
      "Memorizing answer letters instead of understanding the reason.",
    ],
    commonErrorsFr: [
      "Mémoriser les lettres des réponses au lieu de comprendre la raison.",
    ],
    checkpoint: {
      prompt: "What is a useful review note?",
      promptFr: "Quelle note de révision est utile ?",
      options: [
        "I missed the corrected time after finalement.",
        "The answer is always option B.",
      ],
      optionsFr: [
        "J’ai manqué l’heure corrigée après « finalement ».",
        "La bonne réponse est toujours la B.",
      ],
      answer: 0,
      explanation: "The first identifies a transferable listening behavior.",
      explanationFr:
        "La première note décrit une stratégie d’écoute réutilisable.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Your answer was wrong because you confused the author’s view with a quoted view. What should you practise?",
        promptFr:
          "Vous avez confondu l’avis de l’auteur avec un avis cité. Que faut-il travailler ?",
        options: [
          "Repérer qui défend chaque point de vue.",
          "Mémoriser la lettre choisie dans cette question.",
          "Changer de réponse dès qu’un mot semble difficile.",
        ],
        answer: 0,
        explanation:
          "The error concerns attribution of viewpoints, a transferable reading skill. Memorising the answer letter does not address it.",
        explanationFr:
          "L’erreur porte sur l’attribution des points de vue, une compétence de lecture réutilisable. Mémoriser une lettre ne la corrige pas.",
      },
      {
        prompt:
          "Your response differs from the model but completes the task. What is the useful comparison?",
        promptFr:
          "Votre réponse diffère du modèle mais réalise la tâche. Quelle comparaison est utile ?",
        options: [
          "Compter seulement les mots identiques au modèle.",
          "Vérifier la tâche, la cohérence et les critères de la grille.",
          "Remplacer toutes vos idées par celles du modèle.",
        ],
        answer: 1,
        explanation:
          "A model is one possible response. Review the rubric and evidence in your own work instead of requiring identical wording.",
        explanationFr:
          "Le modèle est une réponse possible. Examinez les critères et les indices dans votre propre production, sans exiger les mêmes formulations.",
      },
    ],
  },
];
