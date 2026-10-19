import type {
  ExamConfiguration,
  ExamId,
  ExamSkill,
  ProductivePracticeTask,
} from "@/types/domain";

export const examSkillOrder: ExamSkill[] = [
  "reading",
  "listening",
  "writing",
  "speaking",
];

export const examSkillContent: Record<
  ExamSkill,
  {
    label: string;
    labelFr: string;
    practiceTitle: Record<"TEF" | "TCF", string>;
  }
> = {
  reading: {
    label: "Reading",
    labelFr: "Compréhension écrite",
    practiceTitle: {
      TEF: "Finding specific details",
      TCF: "Reading under progressive difficulty",
    },
  },
  listening: {
    label: "Listening",
    labelFr: "Compréhension orale",
    practiceTitle: {
      TEF: "Identifying details after one listen",
      TCF: "Following spoken situations",
    },
  },
  writing: {
    label: "Writing",
    labelFr: "Expression écrite",
    practiceTitle: {
      TEF: "Expressing and supporting an opinion",
      TCF: "Writing for a clear audience",
    },
  },
  speaking: {
    label: "Speaking",
    labelFr: "Expression orale",
    practiceTitle: {
      TEF: "Expressing an opinion to convince",
      TCF: "Giving a spontaneous point of view",
    },
  },
};

export const examConfigurations: Record<ExamId, ExamConfiguration> = {
  "TEF Canada": {
    id: "TEF Canada",
    shortName: "TEF",
    officialUrl:
      "https://www.lefrancaisdesaffaires.fr/candidat/test-evaluation-francais/tef-canada/presentation/",
    navigationRules: { listeningOneWay: true },
    officialFormat: {
      reading: "40 multiple-choice questions · 60 minutes",
      listening: "40 multiple-choice questions · 40 minutes · one-way audio",
      writing: "2 sections · continue an article, then justify an opinion",
      speaking: "2 sections · obtain information, then argue to convince",
    },
    scaledMock: {
      readingQuestions: 5,
      listeningQuestions: 5,
      writingTasks: 2,
      speakingTasks: 2,
      durationMinutes: 40,
    },
  },
  "TCF Canada": {
    id: "TCF Canada",
    shortName: "TCF",
    officialUrl:
      "https://www.france-education-international.fr/test/tcf-canada",
    navigationRules: { listeningOneWay: false },
    officialFormat: {
      reading: "39 multiple-choice questions · 60 minutes",
      listening: "39 multiple-choice questions · 35 minutes",
      writing:
        "3 tasks · message, account with comments, and compared viewpoints",
      speaking:
        "3 tasks · interview, prepared interaction, and spontaneous viewpoint",
    },
    scaledMock: {
      readingQuestions: 5,
      listeningQuestions: 5,
      writingTasks: 3,
      speakingTasks: 3,
      durationMinutes: 45,
    },
  },
};

export const examStrategyContent: Record<
  ExamId,
  Array<{ title: string; keyIdea: string; example: string }>
> = {
  "TEF Canada": [
    {
      title: "Know the TEF Canada format",
      keyIdea:
        "TEF comprehension uses 40 questions per section, while writing and speaking each contain two sections with distinct communicative goals.",
      example:
        "Section B: state a position, develop arguments, and respond to objections.",
    },
    {
      title: "Manage TEF sections",
      keyIdea:
        "Treat TEF listening as one-way performance: preview what you can, capture the purpose and details, then commit and move forward.",
      example:
        "Note who, why, when, and the requested action during the first listen.",
    },
    {
      title: "Review TEF evidence",
      keyIdea:
        "Review errors by section and communicative purpose so your next practice matches the format that produced the mistake.",
      example:
        "Separate information-seeking speaking errors from argument-and-convince errors.",
    },
  ],
  "TCF Canada": [
    {
      title: "Know the TCF Canada format",
      keyIdea:
        "TCF comprehension uses 39 questions per section, while writing and speaking each progress through three different tasks.",
      example:
        "Writing moves from a direct message to an account, then compared viewpoints and opinion.",
    },
    {
      title: "Manage progressive TCF tasks",
      keyIdea:
        "TCF tasks increase in scope. Protect enough time and attention for the later tasks while meeting every instruction in the earlier ones.",
      example:
        "Identify the audience, purpose, required details, and word range before writing.",
    },
    {
      title: "Review TCF evidence",
      keyIdea:
        "Review performance by task type so a short interaction, a prepared exchange, and a spontaneous viewpoint do not become one generic speaking score.",
      example:
        "Track whether a weakness belongs to interaction, organization, or spontaneous argument.",
    },
  ],
};

const commonWritingRubric = [
  "I answered every part of the task.",
  "My ideas follow a clear structure.",
  "I used appropriate vocabulary and connectors.",
  "I checked grammar, agreement, and register.",
];

const commonSpeakingRubric = [
  "I completed the response within the time.",
  "My ideas were clear and logically connected.",
  "I supported my answer with details or examples.",
  "I kept speaking without relying on English.",
];

export const productiveTasks: Record<ExamId, ProductivePracticeTask[]> = {
  "TEF Canada": [
    {
      id: "tef-writing-a",
      exam: "TEF Canada",
      skill: "writing",
      title: "Section A · Continue a news story",
      prompt:
        "A neighbourhood association opened a shared garden last weekend. Continue the article by describing what happened during the opening and how residents reacted.",
      guidance:
        "Write a coherent continuation in French with events, people, and a clear ending.",
      durationMinutes: 12,
      minimumWords: 80,
      rubric: commonWritingRubric,
    },
    {
      id: "tef-writing-b",
      exam: "TEF Canada",
      skill: "writing",
      title: "Section B · Defend a point of view",
      prompt:
        "A newspaper claims that all employees should return to the office full time. Write a response that states and justifies your opinion.",
      guidance:
        "Take a clear position and support it with organized arguments and examples.",
      durationMinutes: 15,
      minimumWords: 120,
      rubric: commonWritingRubric,
    },
    {
      id: "tef-speaking-a",
      exam: "TEF Canada",
      skill: "speaking",
      title: "Section A · Obtain information",
      prompt:
        "You saw an advertisement for evening French classes. Ask the school representative for the information you need before registering.",
      guidance:
        "Ask varied, relevant questions and react naturally to the imagined answers.",
      durationMinutes: 5,
      rubric: commonSpeakingRubric,
    },
    {
      id: "tef-speaking-b",
      exam: "TEF Canada",
      skill: "speaking",
      title: "Section B · Convince someone",
      prompt:
        "Convince a friend to join a local volunteering activity with you.",
      guidance:
        "Present benefits, respond to possible objections, and finish with a clear invitation.",
      durationMinutes: 8,
      rubric: commonSpeakingRubric,
    },
  ],
  "TCF Canada": [
    {
      id: "tcf-writing-1",
      exam: "TCF Canada",
      skill: "writing",
      title: "Task 1 · Write a message",
      prompt:
        "Write to a new neighbour to introduce yourself and suggest meeting this weekend.",
      guidance:
        "Write for the stated reader and include all requested information.",
      durationMinutes: 10,
      minimumWords: 60,
      rubric: commonWritingRubric,
    },
    {
      id: "tcf-writing-2",
      exam: "TCF Canada",
      skill: "writing",
      title: "Task 2 · Describe and comment",
      prompt:
        "Write a short article about a community event you attended and explain why it was useful.",
      guidance:
        "Report the experience, add comments, and organize the account for a general audience.",
      durationMinutes: 12,
      minimumWords: 100,
      rubric: commonWritingRubric,
    },
    {
      id: "tcf-writing-3",
      exam: "TCF Canada",
      skill: "writing",
      title: "Task 3 · Compare viewpoints",
      prompt:
        "Two articles disagree about whether public transport should be free. Summarize both positions and give your own opinion.",
      guidance:
        "Represent both viewpoints accurately before presenting a supported position.",
      durationMinutes: 15,
      minimumWords: 120,
      rubric: commonWritingRubric,
    },
    {
      id: "tcf-speaking-1",
      exam: "TCF Canada",
      skill: "speaking",
      title: "Task 1 · Guided interview",
      prompt:
        "Introduce yourself and describe your work, studies, interests, and plans in Canada.",
      guidance:
        "Answer naturally with connected details rather than isolated sentences.",
      durationMinutes: 2,
      rubric: commonSpeakingRubric,
    },
    {
      id: "tcf-speaking-2",
      exam: "TCF Canada",
      skill: "speaking",
      title: "Task 2 · Interaction",
      prompt:
        "You are interested in renting a room. Ask the owner questions about the location, rules, price, and services.",
      guidance:
        "Use the preparation time, then sustain a realistic information-seeking exchange.",
      durationMinutes: 4,
      rubric: commonSpeakingRubric,
    },
    {
      id: "tcf-speaking-3",
      exam: "TCF Canada",
      skill: "speaking",
      title: "Task 3 · Spontaneous viewpoint",
      prompt:
        "Should cities create more car-free areas? Present and support your opinion.",
      guidance:
        "Speak continuously, organize your position, and address advantages and disadvantages.",
      durationMinutes: 5,
      rubric: commonSpeakingRubric,
    },
  ],
};
