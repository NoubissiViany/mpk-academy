import type { LearningLesson } from "../../shared/types";
export const lessons: LearningLesson[] = [
  {
    id: "tcf-lesson-001",
    exam: "TCF",
    skill: "reading",
    kind: "lesson",
    moduleId: "reading-strategies",
    title: "Read through progressive difficulty",
    titleFr: "Lire à travers une difficulté progressive",
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
    topic: "Read through progressive difficulty",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Read through progressive difficulty"],
    explanation:
      "Start with purpose and explicit details, then handle inference and argument in longer texts. Distinguish an author's position from an example or a reported view. Difficulty grows, so avoid spending all your time proving an early answer.",
    explanationFr:
      "Commencez par l’intention et les détails explicites, puis traitez l’inférence et l’argumentation dans les textes plus longs. Distinguez la position de l’auteur d’un exemple ou d’un avis rapporté. La difficulté augmente : ne passez pas tout votre temps à vérifier une réponse du début.",
    examples: [
      "Certains souhaitent fermer le parc ; l'autrice propose plutôt de mieux l'entretenir.",
    ],
    guidedApplication:
      "Identify the reported proposal and the author's own position.",
    guidedApplicationFr:
      "Repérez la proposition rapportée et la position personnelle de l’auteur.",
    commonErrors: ["Attributing every opinion in a passage to its author."],
    commonErrorsFr: [
      "Attribuer à l’auteur toutes les opinions présentes dans un texte.",
    ],
    checkpoint: {
      prompt: "What does the author favor?",
      promptFr: "Que préfère l’auteur ?",
      options: ["Better maintenance.", "Closing the park."],
      optionsFr: ["Un meilleur entretien.", "La fermeture du parc."],
      answer: 0,
      explanation:
        "Plutôt marks the author's alternative to the reported proposal.",
      explanationFr:
        "« Plutôt » introduit l’alternative de l’auteur à la proposition rapportée.",
    },
    extraCheckpoints: [
      {
        prompt:
          "« Certains défendent le tout-numérique ; je souhaite maintenir un accueil humain. » What does the author support?",
        promptFr:
          "« Certains défendent le tout-numérique ; je souhaite maintenir un accueil humain. » Que défend l’auteur ?",
        options: [
          "La suppression de tous les guichets.",
          "Le point de vue introduit par « certains ».",
          "Le maintien d’un accueil assuré par des personnes.",
        ],
        answer: 2,
        explanation:
          "Je souhaite marks the author’s own position; certains introduces a view attributed to other people.",
        explanationFr:
          "« Je souhaite » marque la position de l’auteur ; « certains » attribue un avis à d’autres personnes.",
      },
      {
        prompt:
          "You have found clear evidence for an early answer but keep rereading it. What is a useful next step?",
        promptFr:
          "Vous avez trouvé un indice clair pour une réponse du début, mais vous la relisez encore. Que faire utilement ?",
        options: [
          "Poursuivre afin de garder du temps pour les textes suivants.",
          "Consacrer tout le temps restant à cette seule réponse.",
          "Ignorer les indices et choisir une autre option au hasard.",
        ],
        answer: 0,
        explanation:
          "Once the evidence is clear, moving on preserves time for later, more demanding items.",
        explanationFr:
          "Quand l’indice est clair, poursuivre permet de garder du temps pour les questions suivantes, plus exigeantes.",
      },
    ],
  },
  {
    id: "tcf-lesson-002",
    exam: "TCF",
    skill: "listening",
    kind: "lesson",
    moduleId: "listening-strategies",
    title: "Listen beyond the first clue",
    titleFr: "Écouter au-delà du premier indice",
    level: "B1",
    difficulty: 2,
    competencies: [
      "specific_detail",
      "main_idea",
      "inference",
      "speaker_intention",
    ],
    topic: "Listen beyond the first clue",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Listen beyond the first clue"],
    explanation:
      "TCF recordings are heard once and the question follows the recording. Keep the situation, intention, and decisive details in mind. Numbers, negation, and contrasts can distinguish plausible alternatives. Transcript practice teaches analysis but does not measure listening ability.",
    explanationFr:
      "Au TCF, chaque enregistrement est entendu une seule fois et la question vient après l’écoute. Retenez la situation, l’intention et les détails décisifs. Les nombres, la négation et les oppositions permettent de distinguer des réponses plausibles. S’entraîner avec la transcription apprend à analyser, mais ne mesure pas la compréhension orale.",
    examples: ["Le billet coûte vingt dollars, mais dix pour les étudiants."],
    guidedApplication: "Retain both prices and the group attached to each.",
    guidedApplicationFr:
      "Retenez les deux prix et le groupe auquel chacun s’applique.",
    commonErrors: [
      "Remembering a number without remembering who it applies to.",
    ],
    commonErrorsFr: ["Retenir un nombre sans retenir à qui il s’applique."],
    checkpoint: {
      prompt: "What does a student pay?",
      promptFr: "Combien paie un étudiant ?",
      options: ["Ten dollars.", "Twenty dollars."],
      optionsFr: ["Dix dollars.", "Vingt dollars."],
      answer: 0,
      explanation:
        "The exception explicitly assigns the lower price to students.",
      explanationFr:
        "L’exception attribue clairement le prix réduit aux étudiants.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Written analysis: « L’entrée est gratuite pour les enfants, mais les adultes paient huit dollars. » Who pays?",
        promptFr:
          "Analyse écrite : « L’entrée est gratuite pour les enfants, mais les adultes paient huit dollars. » Qui paie ?",
        options: [
          "Les enfants uniquement.",
          "Les adultes.",
          "Tous les visiteurs sans exception.",
        ],
        answer: 1,
        explanation:
          "The price is attached to adults; children are explicitly exempt. Keep each number linked to its group.",
        explanationFr:
          "Le tarif concerne les adultes ; les enfants en sont explicitement dispensés. Reliez chaque nombre au groupe concerné.",
      },
      {
        prompt:
          "What does analysing a recording’s written transcript establish?",
        promptFr:
          "Que permet d’établir l’analyse de la transcription d’un enregistrement ?",
        options: [
          "Une mesure directe de la compréhension orale sans écouter.",
          "Une note officielle à l’épreuve de compréhension orale.",
          "La capacité à repérer des indices dans le texte lu.",
        ],
        answer: 2,
        explanation:
          "A transcript supports analysis of written evidence. It does not establish what was understood from sound alone.",
        explanationFr:
          "Une transcription permet d’analyser des indices écrits. Elle n’établit pas ce qui a été compris à partir du son seul.",
      },
    ],
  },
  {
    id: "tcf-lesson-003",
    exam: "TCF",
    skill: "writing",
    kind: "lesson",
    moduleId: "writing-techniques",
    title: "Plan the three writing tasks",
    titleFr: "Planifier les trois tâches d’écriture",
    level: "B1",
    difficulty: 2,
    competencies: [
      "organization",
      "connectors",
      "register",
      "grammar_accuracy",
      "argumentation",
    ],
    topic: "Plan the three writing tasks",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Plan the three writing tasks"],
    explanation:
      "Task 1 addresses a recipient with a message. Task 2 recounts an experience and comments on it. Task 3 compares two supplied views and gives your position. Use the required word ranges and check that every part of the task is present.",
    explanationFr:
      "La tâche 1 adresse un message à un destinataire. La tâche 2 raconte une expérience et la commente. La tâche 3 compare deux points de vue fournis et donne votre position. Respectez les nombres de mots demandés et vérifiez que chaque partie de la tâche est présente.",
    examples: [
      "Le premier texte privilégie la souplesse ; le second insiste sur la coordination. Pour ma part…",
    ],
    guidedApplication:
      "Write a comparison sentence that distinguishes both views before adding your opinion.",
    guidedApplicationFr:
      "Écrivez une phrase de comparaison qui distingue les deux points de vue avant d’ajouter votre avis.",
    commonErrors: [
      "Giving only an opinion without comparing the source viewpoints in task 3.",
    ],
    commonErrorsFr: [
      "Donner seulement son avis dans la tâche 3, sans comparer les points de vue des documents.",
    ],
    checkpoint: {
      prompt: "What is missing if task 3 contains only your opinion?",
      promptFr: "Que manque-t-il si votre tâche 3 ne contient que votre avis ?",
      options: [
        "A comparison of the two viewpoints.",
        "A list of personal contact details.",
      ],
      optionsFr: [
        "Une comparaison des deux points de vue.",
        "Une liste de vos coordonnées personnelles.",
      ],
      answer: 0,
      explanation: "The comparison is a required part of the task.",
      explanationFr: "La comparaison est une partie obligatoire de la tâche.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Which addition turns an account of an experience into a commented account for task 2?",
        promptFr:
          "Quel ajout transforme un récit d’expérience en récit commenté pour la tâche 2 ?",
        options: [
          "J’ai apprécié cet atelier, car les exercices étaient très concrets.",
          "L’atelier a commencé à neuf heures, puis nous sommes entrés.",
          "La salle contenait dix tables et vingt chaises.",
        ],
        answer: 0,
        explanation:
          "The first sentence evaluates the experience and gives a reason; the others only report events or details.",
        explanationFr:
          "La première phrase évalue l’expérience et donne une raison ; les autres rapportent seulement des événements ou des détails.",
      },
      {
        prompt:
          "Two texts disagree about remote work. Which sentence compares their views?",
        promptFr:
          "Deux textes s’opposent sur le télétravail. Quelle phrase compare leurs avis ?",
        options: [
          "Je préfère travailler chez moi et je ne présenterai pas les textes.",
          "L’un valorise la souplesse, tandis que l’autre souligne l’isolement.",
          "J’ai acheté un bureau la semaine dernière pour mon appartement.",
        ],
        answer: 1,
        explanation:
          "The sentence links both supplied positions through a contrast. A personal preference alone is not a comparison.",
        explanationFr:
          "La phrase relie les deux positions fournies par une opposition. Une préférence personnelle seule ne constitue pas une comparaison.",
      },
    ],
  },
  {
    id: "tcf-lesson-004",
    exam: "TCF",
    skill: "speaking",
    kind: "lesson",
    moduleId: "speaking-techniques",
    title: "Interact and develop a viewpoint",
    titleFr: "Interagir et développer un point de vue",
    level: "B1",
    difficulty: 2,
    competencies: [
      "interaction",
      "question_formation",
      "persuasion",
      "organization",
    ],
    topic: "Interact and develop a viewpoint",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Interact and develop a viewpoint"],
    explanation:
      "Task 1 is an unprepared personal interview. Task 2 is an information-seeking interaction with preparation. Task 3 develops an unprepared opinion continuously. Use concrete examples and a simple structure instead of memorizing a speech.",
    explanationFr:
      "La tâche 1 est un entretien personnel sans préparation. La tâche 2 est une interaction pour obtenir des informations, avec préparation. La tâche 3 demande de développer une opinion de façon continue, sans préparation. Appuyez-vous sur des exemples concrets et une structure simple plutôt que sur un discours appris par cœur.",
    examples: ["Je comprends cet avantage. Toutefois, dans mon expérience…"],
    guidedApplication:
      "Give an opinion, one reason, an example, and a brief qualification.",
    guidedApplicationFr:
      "Donnez une opinion, un argument, un exemple et une courte nuance.",
    commonErrors: [
      "Using the preparation time of task 2 as if it also applied to task 3.",
    ],
    commonErrorsFr: [
      "Croire que le temps de préparation de la tâche 2 s’applique aussi à la tâche 3.",
    ],
    checkpoint: {
      prompt: "Which task includes preparation?",
      promptFr: "Quelle tâche comprend une préparation ?",
      options: ["Task 2.", "Task 3."],
      optionsFr: ["La tâche 2.", "La tâche 3."],
      answer: 0,
      explanation: "Only task 2 includes the two-minute preparation period.",
      explanationFr: "Seule la tâche 2 comprend deux minutes de préparation.",
    },
    extraCheckpoints: [
      {
        prompt:
          "You ask about an activity and learn that beginners are welcome. Which reply develops the interaction?",
        promptFr:
          "Vous apprenez qu’une activité accepte les débutants. Quelle réponse fait avancer l’échange ?",
        options: [
          "Je vais réciter un discours sur tous mes loisirs.",
          "Je répète exactement la même question sans tenir compte de la réponse.",
          "Dans ce cas, faut-il apporter son propre matériel ?",
        ],
        answer: 2,
        explanation:
          "The follow-up uses the answer and seeks another practical condition. Interaction requires responding to what was said.",
        explanationFr:
          "La relance s’appuie sur la réponse et cherche une autre condition pratique. L’interaction demande de réagir à ce qui a été dit.",
      },
      {
        prompt: "What helps develop an unprepared opinion in task 3?",
        promptFr:
          "Qu’est-ce qui aide à développer un avis sans préparation dans la tâche 3 ?",
        options: [
          "Une position claire, une raison et un exemple concret.",
          "Un texte appris par cœur, quel que soit le sujet.",
          "Une réponse par oui ou non, sans développement.",
        ],
        answer: 0,
        explanation:
          "A simple structure supports relevant development without depending on a memorised speech.",
        explanationFr:
          "Une structure simple permet un développement pertinent sans dépendre d’un discours mémorisé.",
      },
    ],
  },
  {
    id: "tcf-lesson-005",
    exam: "TCF",
    skill: "strategy",
    kind: "lesson",
    moduleId: "exam-strategies",
    title: "Know the TCF Canada structure",
    titleFr: "Connaître la structure du TCF Canada",
    level: "B1",
    difficulty: 2,
    competencies: ["task_completion"],
    topic: "Know the TCF Canada structure",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Know the TCF Canada structure"],
    explanation:
      "TCF Canada has 39 listening questions in 35 minutes and 39 reading questions in 60 minutes. Writing has three tasks in 60 minutes. Speaking has three tasks totaling 12 minutes, including preparation. MPK reproduces this structure as an independent practice simulation.",
    explanationFr:
      "Le TCF Canada comprend 39 questions de compréhension orale en 35 minutes et 39 questions de compréhension écrite en 60 minutes. L’expression écrite comporte trois tâches en 60 minutes. L’expression orale comporte trois tâches pour un total de 12 minutes, préparation comprise. MPK reproduit cette structure dans une simulation d’entraînement indépendante.",
    examples: ["Message, récit commenté, comparaison de points de vue."],
    guidedApplication:
      "Match each writing task to its purpose and an appropriate audience.",
    guidedApplicationFr:
      "Associez chaque tâche d’écriture à son objectif et à un public adapté.",
    commonErrors: ["Reusing TEF's two-section structure for TCF."],
    commonErrorsFr: [
      "Reprendre pour le TCF la structure en deux sections du TEF.",
    ],
    checkpoint: {
      prompt: "How many writing tasks are there?",
      promptFr: "Combien y a-t-il de tâches d’expression écrite ?",
      options: ["Three.", "Two."],
      optionsFr: ["Trois.", "Deux."],
      answer: 0,
      explanation: "TCF writing has three distinct tasks.",
      explanationFr:
        "L’expression écrite du TCF comporte trois tâches distinctes.",
    },
    extraCheckpoints: [
      {
        prompt:
          "In the MPK TCF simulation, what follows the message and the commented account in writing?",
        promptFr:
          "Dans la simulation TCF de MPK, qu’est-ce qui suit le message et le récit commenté à l’écrit ?",
        options: [
          "La continuation d’un fait divers sans documents.",
          "La comparaison de deux avis, suivie d’une position personnelle.",
          "La traduction obligatoire d’un texte anglais.",
        ],
        answer: 1,
        explanation:
          "The third writing task combines comparison of supplied viewpoints and the writer’s position.",
        explanationFr:
          "La troisième tâche écrite associe une comparaison des avis fournis et la position du candidat.",
      },
      {
        prompt:
          "How are the three writing tasks timed in the MPK TCF simulation?",
        promptFr:
          "Comment les trois tâches écrites sont-elles chronométrées dans la simulation TCF de MPK ?",
        options: [
          "Chacune bénéficie d’une heure supplémentaire.",
          "La relecture commence seulement après les 60 minutes.",
          "Elles partagent une durée totale de 60 minutes.",
        ],
        answer: 2,
        explanation:
          "The 60-minute writing allowance is shared across the tasks, including planning and checking.",
        explanationFr:
          "Les 60 minutes d’expression écrite sont communes aux tâches, planification et relecture comprises.",
      },
    ],
  },
  {
    id: "tcf-lesson-006",
    exam: "TCF",
    skill: "strategy",
    kind: "lesson",
    moduleId: "exam-strategies",
    title: "Manage TCF limits",
    titleFr: "Gérer les contraintes du TCF",
    level: "B1",
    difficulty: 2,
    competencies: ["organization"],
    topic: "Manage TCF limits",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Manage TCF limits"],
    explanation:
      "Writing ranges are 60–120, 120–150, and 120–180 words. The 60-minute writing limit is shared; MPK's 20-minute practice suggestions are not official task limits. Speaking lasts 2 minutes, 5 minutes 30 including 2 preparation, then 4 minutes 30.",
    explanationFr:
      "Les nombres de mots demandés sont de 60 à 120, de 120 à 150 et de 120 à 180. Les 60 minutes d’expression écrite sont communes aux trois tâches ; les suggestions de 20 minutes de MPK ne sont pas des limites officielles. En expression orale, la tâche 1 dure 2 minutes, la tâche 2 dure 5 minutes 30 dont 2 de préparation, et la tâche 3 dure 4 minutes 30.",
    examples: ["Tâche 2 orale : préparer des questions, puis interagir."],
    guidedApplication:
      "Prepare topic headings rather than a script during the two-minute preparation.",
    guidedApplicationFr:
      "Pendant les deux minutes de préparation, notez des thèmes plutôt qu’un texte complet.",
    commonErrors: [
      "Counting the two preparation minutes on top of the 5 minutes 30.",
    ],
    commonErrorsFr: [
      "Ajouter les deux minutes de préparation aux 5 minutes 30.",
    ],
    checkpoint: {
      prompt: "How long is the interaction after preparation in task 2?",
      promptFr:
        "Combien de temps dure l’interaction après la préparation dans la tâche 2 ?",
      options: ["Three minutes thirty.", "Five minutes thirty."],
      optionsFr: ["Trois minutes trente.", "Cinq minutes trente."],
      answer: 0,
      explanation:
        "The total includes two minutes of preparation, leaving three minutes thirty.",
      explanationFr:
        "Les 5 minutes 30 comprennent deux minutes de préparation, ce qui laisse trois minutes trente d’interaction.",
    },
    extraCheckpoints: [
      {
        prompt: "A task 2 text contains 155 words. Which range applies?",
        promptFr:
          "Un texte de tâche 2 contient 155 mots. Quelle plage s’applique ?",
        options: [
          "120 à 150 mots : le texte est trop long.",
          "120 à 180 mots : le texte respecte cette tâche.",
          "60 à 120 mots : cette plage concerne toutes les tâches.",
        ],
        answer: 0,
        explanation:
          "Task 2 uses 120–150 words. The 120–180 range belongs to task 3, not task 2.",
        explanationFr:
          "La tâche 2 demande 120 à 150 mots. La plage de 120 à 180 correspond à la tâche 3, pas à la tâche 2.",
      },
      {
        prompt: "What does MPK’s suggested 20-minute practice allocation mean?",
        promptFr:
          "Que signifie la suggestion de 20 minutes par tâche proposée par MPK ?",
        options: [
          "Une limite officielle distincte imposée à chaque tâche.",
          "Un repère d’entraînement dans le temps total partagé.",
          "Du temps qui s’ajoute aux 60 minutes d’expression écrite.",
        ],
        answer: 1,
        explanation:
          "It is a planning suggestion, not a separate official task limit or extra time.",
        explanationFr:
          "C’est une suggestion d’organisation, pas une limite officielle distincte ni du temps supplémentaire.",
      },
    ],
  },
  {
    id: "tcf-lesson-007",
    exam: "TCF",
    skill: "strategy",
    kind: "lesson",
    moduleId: "exam-strategies",
    title: "Review TCF performance honestly",
    titleFr: "Analyser honnêtement ses résultats au TCF",
    level: "B1",
    difficulty: 2,
    competencies: ["task_completion"],
    topic: "Review TCF performance honestly",
    estimatedTime: 600,
    status: "published",
    isFree: false,
    objectives: ["Review TCF performance honestly"],
    explanation:
      "Review comprehension using textual or audio evidence. For writing, check the audience, task coverage, word range, and organization. For speaking, assess whether you communicated the intended message; self-review is not an official examiner score.",
    explanationFr:
      "Analysez la compréhension à partir des indices du texte ou de l’enregistrement. À l’écrit, vérifiez le destinataire, la réalisation de chaque partie de la tâche, le nombre de mots et l’organisation. À l’oral, demandez-vous si vous avez transmis le message voulu ; une auto-évaluation n’est pas une note d’examinateur officiel.",
    examples: [
      "Mon texte compare les deux avis, mais mon exemple personnel reste vague.",
    ],
    guidedApplication:
      "Choose one specific change for your next response rather than copying a model.",
    guidedApplicationFr:
      "Choisissez un changement précis pour votre prochaine production plutôt que de recopier un modèle.",
    commonErrors: [
      "Converting raw correct answers into a claimed official TCF score.",
    ],
    commonErrorsFr: [
      "Convertir un nombre de bonnes réponses en prétendu score officiel au TCF.",
    ],
    checkpoint: {
      prompt: "What can MPK report directly?",
      promptFr: "Que peut indiquer directement MPK ?",
      options: [
        "Practice accuracy on assessed items.",
        "An official TCF score from a simple percentage.",
      ],
      optionsFr: [
        "Votre taux de réussite sur les questions évaluées.",
        "Un score officiel au TCF calculé à partir d’un simple pourcentage.",
      ],
      answer: 0,
      explanation:
        "Raw practice accuracy is observable; official scoring needs a validated methodology.",
      explanationFr:
        "Le taux de réussite à l’entraînement est observable ; un score officiel demande une méthode validée.",
    },
    extraCheckpoints: [
      {
        prompt:
          "Your opinion is clear, but you do not compare the supplied views in writing task 3. What should you revise?",
        promptFr:
          "Votre avis est clair, mais vous ne comparez pas les documents de la tâche 3. Que faut-il revoir ?",
        options: [
          "Uniquement la couleur du titre.",
          "Le nombre de mots identiques au modèle.",
          "La réalisation de toutes les parties de la consigne.",
        ],
        answer: 2,
        explanation:
          "The missing comparison is a task-completion issue, even if the personal opinion is clear.",
        explanationFr:
          "L’absence de comparaison concerne la réalisation de la tâche, même si l’avis personnel est clair.",
      },
      {
        prompt: "Which self-review note points to a concrete improvement?",
        promptFr:
          "Quelle note d’auto-évaluation indique une amélioration concrète ?",
        options: [
          "Mon exemple reste vague ; je vais préciser une situation vécue.",
          "Mon résultat garantit que je réussirai l’examen officiel.",
          "Je dois reprendre exactement chaque phrase du modèle.",
        ],
        answer: 0,
        explanation:
          "The note identifies a specific weakness and an actionable revision without claiming an official result.",
        explanationFr:
          "La note repère une faiblesse précise et une révision possible, sans prétendre donner un résultat officiel.",
      },
    ],
  },
];
