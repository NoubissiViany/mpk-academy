import { items as reading } from "./reading";
import { items as listening } from "./listening";
import { items as writing } from "./writing";
import { items as speaking } from "./speaking";
import type { ContentItem, MockManifest } from "../../shared/types";
export const items: ContentItem[] = [
  ...reading,
  ...listening,
  ...writing,
  ...speaking,
];
export const manifest: MockManifest = {
  id: "tcf-mock-01",
  version: "mpk-content-v2",
  exam: "TCF",
  disclaimer:
    "Simulation d'entraînement MPK indépendante. Il ne s'agit pas d'un examen officiel et aucun score officiel n'est délivré.",
  sections: [
    {
      skill: "reading",
      durationSeconds: 3600,
      itemIds: reading.map((i) => i.id),
      navigation: "free",
      taskTimers: false,
    },
    {
      skill: "listening",
      durationSeconds: 2100,
      itemIds: listening.map((i) => i.id),
      navigation: "forward",
      taskTimers: false,
    },
    {
      skill: "writing",
      durationSeconds: 3600,
      itemIds: writing.map((i) => i.id),
      navigation: "free",
      taskTimers: false,
    },
    {
      skill: "speaking",
      durationSeconds: 720,
      itemIds: speaking.map((i) => i.id),
      navigation: "forward",
      taskTimers: true,
    },
  ],
};
