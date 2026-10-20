import type { ProductiveTask } from "../../shared/types";
export const items: ProductiveTask[] = [
  {
    id: "tef-writing-section-a-003",
    exam: "TEF",
    skill: "writing",
    kind: "writing",
    level: "B2",
    difficulty: 3,
    competencies: [
      "task_completion",
      "organization",
      "grammar_accuracy",
      "argumentation",
    ],
    topic: "La boîte retrouvée",
    estimatedTime: 1500,
    status: "published",
    taskType: "section-a",
    title: "La boîte retrouvée",
    scenario:
      "Pendant les travaux d’une ancienne école, des ouvriers ont découvert une boîte métallique cachée derrière une armoire. À l’intérieur se trouvaient des lettres écrites par des élèves trente ans plus tôt.",
    instructions: "Rédigez la suite de cet article.",
    candidateRole: "Journaliste poursuivant le récit",
    interlocutorRole: "Lecteurs du journal",
    objectives: ["Rédigez la suite de cet article."],
    durationSeconds: 1500,
    preparationSeconds: 0,
    wordCount: {
      min: 80,
    },
    correction: {
      guidance:
        "Keep the people and situation from the opening. Plan a development and an ending, narrate in coherent past tenses, and include concrete details. Write at least 80 words; do not replace the continuation with an opinion essay.",
      rubric: [
        "Respect de la consigne et du destinataire",
        "Organisation et cohésion",
        "Développement des idées et exemples",
        "Précision lexicale et registre",
        "Grammaire, accords et orthographe",
      ],
      modelResponse:
        "La directrice a immédiatement contacté l’association des anciens élèves. Grâce à un message publié dans le journal local, plusieurs auteurs des lettres ont été retrouvés. Ils ont accepté de revenir à l’école pour rencontrer les enfants d’aujourd’hui. Lors de cette visite, chacun a lu quelques lignes de son texte et raconté ce qui avait changé dans sa vie. Les élèves ont été surpris de découvrir des préoccupations proches des leurs. À la fin de la rencontre, ils ont proposé de préparer une nouvelle boîte. Celle-ci sera ouverte dans trente ans, avec des lettres, des dessins et une photographie de la classe.",
    },
  },
  {
    id: "tef-writing-section-b-003",
    exam: "TEF",
    skill: "writing",
    kind: "writing",
    level: "B2",
    difficulty: 3,
    competencies: [
      "task_completion",
      "organization",
      "grammar_accuracy",
      "argumentation",
    ],
    topic: "Faut-il supprimer les réunions ?",
    estimatedTime: 2100,
    status: "published",
    taskType: "section-b",
    title: "Faut-il supprimer les réunions ?",
    scenario:
      "Une chronique propose de supprimer toutes les réunions au travail et de les remplacer par des messages écrits.",
    instructions:
      "Exprimez et justifiez votre point de vue dans une lettre au journal.",
    candidateRole: "Lecteur écrivant au journal",
    interlocutorRole: "Lecteurs du journal",
    objectives: [
      "Exprimez et justifiez votre point de vue dans une lettre au journal.",
    ],
    durationSeconds: 2100,
    preparationSeconds: 0,
    wordCount: {
      min: 200,
    },
    correction: {
      guidance:
        "Identify the claim you are responding to. State a position, develop two reasons with examples, acknowledge a possible objection, and close courteously. Write at least 200 words, reserving time to check organization, register, and agreements.",
      rubric: [
        "Respect de la consigne et du destinataire",
        "Organisation et cohésion",
        "Développement des idées et exemples",
        "Précision lexicale et registre",
        "Grammaire, accords et orthographe",
      ],
      modelResponse:
        "Madame, Monsieur, les réunions trop nombreuses sont une source de fatigue bien connue. Votre proposition de les remplacer par des messages écrits paraît donc séduisante. Je pense néanmoins qu’une suppression totale ferait perdre certains avantages essentiels de l’échange direct.\n\nL’écrit convient très bien pour transmettre une information simple, annoncer une échéance ou conserver la trace d’une décision. Il permet à chacun de consulter le message au moment approprié et évite d’interrompre toute une équipe. Sur ce point, je partage votre volonté de réduire les rencontres sans objectif clair.\n\nEn revanche, certaines situations exigent une discussion. Lorsqu’un projet rencontre un obstacle, les questions des uns peuvent aider les autres à préciser leur raisonnement. Un échange de quelques minutes évite parfois une longue série de messages, dont le ton peut être mal interprété. La réunion permet aussi de vérifier que chacun comprend les responsabilités qui lui sont confiées.\n\nLe véritable enjeu me semble donc être la qualité des réunions. Il faudrait annoncer leur objectif, inviter seulement les personnes concernées et terminer par des décisions explicites. Une durée limitée et un bref compte rendu faciliteraient également le suivi.\n\nPlutôt que d’opposer systématiquement oral et écrit, choisissons le moyen adapté au besoin. Une équipe efficace doit pouvoir transmettre rapidement les informations courantes et se réunir lorsque la réflexion collective apporte quelque chose. Supprimer les mauvaises réunions serait un progrès ; supprimer toutes les occasions de dialogue serait un appauvrissement.",
    },
  },
];
