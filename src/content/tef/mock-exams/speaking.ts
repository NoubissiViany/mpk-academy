import type { ProductiveTask } from "../../shared/types";
export const items: ProductiveTask[] = [
  {
    id: "tef-speaking-section-a-003",
    exam: "TEF",
    skill: "speaking",
    kind: "speaking",
    level: "B2",
    difficulty: 3,
    competencies: [
      "question_formation",
      "interaction",
      "task_completion",
      "register",
      "grammar_accuracy",
    ],
    topic: "Un abonnement à une ferme",
    estimatedTime: 300,
    status: "published",
    taskType: "section-a",
    title: "Un abonnement à une ferme",
    scenario:
      "Vous envisagez de recevoir un panier de légumes chaque semaine. Votre interlocuteur représente une ferme locale. Informez-vous sur le contenu, les points de retrait, les absences et le paiement.",
    instructions: "Posez des questions précises et réagissez aux réponses.",
    candidateRole: "Personne cherchant des renseignements avant de choisir",
    interlocutorRole: "Représentant de la ferme locale",
    objectives: ["Posez des questions précises et réagissez aux réponses."],
    durationSeconds: 300,
    preparationSeconds: 0,
    correction: {
      guidance:
        "Open politely, ask about conditions, timing, costs, and practical arrangements, then follow up on replies. Vary your question forms rather than reading a fixed list. Use the five minutes to obtain information, not to persuade.",
      guidanceFr:
        "Commencez poliment, posez des questions sur les conditions, les horaires, les coûts et l’organisation pratique, puis rebondissez sur les réponses. Variez la forme de vos questions au lieu de lire une liste toute prête. Les cinq minutes servent à obtenir des informations, pas à convaincre.",
      rubric: [
        "Réalisation des objectifs de communication",
        "Interaction et adaptation au rôle",
        "Organisation et développement des arguments",
        "Intelligibilité et fluidité",
        "Précision grammaticale et richesse lexicale",
      ],
    },
  },
  {
    id: "tef-speaking-section-b-003",
    exam: "TEF",
    skill: "speaking",
    kind: "speaking",
    level: "B2",
    difficulty: 3,
    competencies: [
      "persuasion",
      "argumentation",
      "interaction",
      "organization",
      "task_completion",
    ],
    topic: "Un atelier de réparation",
    estimatedTime: 600,
    status: "published",
    taskType: "section-b",
    title: "Un atelier de réparation",
    scenario:
      "Vous souhaitez convaincre un proche d’apporter son petit appareil en panne à un atelier associatif plutôt que d’en acheter immédiatement un neuf. Il doute de l’utilité de cette démarche.",
    instructions:
      "Présentez la proposition et cherchez à convaincre votre interlocuteur en répondant à ses objections.",
    candidateRole: "Personne proposant une activité à un proche",
    interlocutorRole: "Proche sceptique sur la réparation",
    objectives: [
      "Présentez la proposition et cherchez à convaincre votre interlocuteur en répondant à ses objections.",
    ],
    durationSeconds: 600,
    preparationSeconds: 0,
    correction: {
      guidance:
        "Present the proposal and connect its benefits to this person’s concerns. Prepare two arguments with examples and respond to the stated objections. Invite the other person to react; persuasion remains an exchange, not an uninterrupted ten-minute speech.",
      guidanceFr:
        "Présentez la proposition et reliez ses avantages aux préoccupations de cette personne. Préparez deux arguments avec des exemples et répondez aux objections annoncées. Laissez l’autre personne réagir : convaincre reste un échange, pas un discours de dix minutes sans interruption.",
      rubric: [
        "Réalisation des objectifs de communication",
        "Interaction et adaptation au rôle",
        "Organisation et développement des arguments",
        "Intelligibilité et fluidité",
        "Précision grammaticale et richesse lexicale",
      ],
    },
  },
];
