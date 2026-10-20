// Contains answer keys and model responses: never import from client code.
import "server-only";
import { diagnosticItems } from "./diagnostic/questions";
import { lessons as foundations } from "./shared/foundations";
import { lessons as tefLessons } from "./tef/learn/lessons";
import { lessons as tcfLessons } from "./tcf/learn/lessons";
import { items as tr } from "./tef/practice/reading";
import { items as tl } from "./tef/practice/listening";
import { items as tw } from "./tef/practice/writing";
import { items as ts } from "./tef/practice/speaking";
import { items as cr } from "./tcf/practice/reading";
import { items as cl } from "./tcf/practice/listening";
import { items as cw } from "./tcf/practice/writing";
import { items as cs } from "./tcf/practice/speaking";
import type { ContentItem } from "./shared/types";
import { canonicalCompetency } from "./shared/competencies";
export const practiceItems: ContentItem[] = [
  ...tr,
  ...tl,
  ...tw,
  ...ts,
  ...cr,
  ...cl,
  ...cw,
  ...cs,
];
export const lessons = [...foundations, ...tefLessons, ...tcfLessons];
export { diagnosticItems };
export function findPractice(
  exam: "TEF" | "TCF",
  skill: string,
  competency?: string | null,
) {
  return practiceItems.filter(
    (item) =>
      item.exam === exam &&
      item.skill === skill &&
      (!competency ||
        item.competencies.some((c) => c === canonicalCompetency(competency))),
  );
}
