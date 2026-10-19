import { practiceItems } from "@/content/catalog";
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
      readingQuestions: 40,
      listeningQuestions: 40,
      writingTasks: 2,
      speakingTasks: 2,
      durationMinutes: 175,
    },
  },
  "TCF Canada": {
    id: "TCF Canada",
    shortName: "TCF",
    officialUrl:
      "https://www.france-education-international.fr/test/tcf-canada",
    navigationRules: { listeningOneWay: true },
    officialFormat: {
      reading: "39 multiple-choice questions · 60 minutes",
      listening: "39 multiple-choice questions · 35 minutes",
      writing:
        "3 tasks · message, account with comments, and compared viewpoints",
      speaking:
        "3 tasks · interview, prepared interaction, and spontaneous viewpoint",
    },
    scaledMock: {
      readingQuestions: 39,
      listeningQuestions: 39,
      writingTasks: 3,
      speakingTasks: 3,
      durationMinutes: 167,
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

export const productiveTasks: Record<ExamId, ProductivePracticeTask[]> =
  Object.fromEntries(
    (["TEF Canada", "TCF Canada"] as const).map((exam) => [
      exam,
      practiceItems
        .filter((i) => i.exam === (exam === "TEF Canada" ? "TEF" : "TCF"))
        .flatMap((i) =>
          i.kind === "mcq"
            ? []
            : [
                {
                  id: i.id,
                  exam,
                  skill: i.skill,
                  title: i.title,
                  prompt: i.scenario + " " + i.instructions,
                  guidance: i.correction.guidance,
                  durationMinutes: i.durationSeconds / 60,
                  minimumWords: i.wordCount?.min,
                  rubric: i.correction.rubric,
                },
              ],
        ),
    ]),
  ) as Record<ExamId, ProductivePracticeTask[]>;
