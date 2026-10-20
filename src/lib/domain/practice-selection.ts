import { shuffle } from "@/lib/utils";

// Chooses which practice items a session shows. Pure and deterministic for a
// given `random`, so it can run on the server with full items and be tested
// without content: it only reads ids and competencies.

export interface SelectableItem {
  id: string;
  competencies: readonly string[];
}

/** One past answer to a practice item, newest first or in any order. */
export interface PracticeAnswerRecord {
  questionId: string;
  correct: boolean;
  answeredAt: string;
}

interface ItemHistory {
  timesSeen: number;
  lastSeenAt: string;
  lastCorrect: boolean;
}

export function summarizeHistory(answers: PracticeAnswerRecord[]) {
  const history = new Map<string, ItemHistory>();
  for (const answer of answers) {
    const previous = history.get(answer.questionId);
    const newer = !previous || answer.answeredAt > previous.lastSeenAt;
    history.set(answer.questionId, {
      timesSeen: (previous?.timesSeen ?? 0) + 1,
      lastSeenAt: newer ? answer.answeredAt : previous.lastSeenAt,
      lastCorrect: newer ? answer.correct : previous.lastCorrect,
    });
  }
  return history;
}

/**
 * How much each competency needs work, from 0 (always right) to 1 (always
 * wrong). One imaginary right and one wrong answer keep a single miss from
 * dominating; competencies without answers sit at 0.5.
 */
export function competencyWeakness<T extends SelectableItem>(
  items: T[],
  answers: PracticeAnswerRecord[],
) {
  const competencies = new Map(
    items.map((item) => [item.id, item.competencies]),
  );
  const totals = new Map<string, { attempts: number; wrong: number }>();
  for (const answer of answers)
    for (const competency of competencies.get(answer.questionId) ?? []) {
      const total = totals.get(competency) ?? { attempts: 0, wrong: 0 };
      totals.set(competency, {
        attempts: total.attempts + 1,
        wrong: total.wrong + (answer.correct ? 0 : 1),
      });
    }
  return new Map(
    [...totals].map(([competency, { attempts, wrong }]) => [
      competency,
      (wrong + 1) / (attempts + 2),
    ]),
  );
}

/** Weighted sample without replacement (Efraimidis–Spirakis). */
function weightedSample<T>(
  items: T[],
  count: number,
  weight: (item: T) => number,
  random: () => number,
) {
  return items
    .map((item) => ({
      item,
      key: Math.pow(Math.max(random(), Number.EPSILON), 1 / weight(item)),
    }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map(({ item }) => item);
}

export interface PracticeSelection<T> {
  items: T[];
  /** Ids in `items` that are due spaced reviews. */
  reviewIds: string[];
}

/**
 * Due reviews take up to `reviewShare` of the session (all of it in review
 * mode). The rest are unseen items, favouring weak competencies, then items
 * seen longest ago, answered-correctly ones before recent misses that are not
 * due yet. A focus narrows every tier to that competency when it has items.
 */
export function selectPracticeItems<T extends SelectableItem>({
  items,
  count,
  answers = [],
  dueIds = [],
  focus = null,
  reviewOnly = false,
  reviewShare = 0.4,
  random = Math.random,
}: {
  items: T[];
  count: number;
  answers?: PracticeAnswerRecord[];
  /** Due review ids, most overdue first. */
  dueIds?: string[];
  focus?: string | null;
  reviewOnly?: boolean;
  reviewShare?: number;
  random?: () => number;
}): PracticeSelection<T> {
  const focused = focus
    ? items.filter((item) => item.competencies.includes(focus))
    : [];
  const pool = focused.length ? focused : items;
  const byId = new Map(pool.map((item) => [item.id, item]));

  const dueItems = dueIds.flatMap((id) => byId.get(id) ?? []);
  const reviewSlots = reviewOnly
    ? count
    : Math.min(dueItems.length, Math.ceil(count * reviewShare));
  const reviews = dueItems.slice(0, reviewSlots);
  if (reviewOnly)
    return {
      items: shuffle(reviews, random),
      reviewIds: reviews.map((item) => item.id),
    };

  const chosen = new Set(reviews.map((item) => item.id));
  const history = summarizeHistory(answers);
  const weakness = competencyWeakness(items, answers);
  const remaining = pool.filter((item) => !chosen.has(item.id));
  const unseen = remaining.filter((item) => !history.has(item.id));
  const seen = remaining
    .filter((item) => history.has(item.id))
    .sort((a, b) => {
      const left = history.get(a.id)!;
      const right = history.get(b.id)!;
      return (
        Number(right.lastCorrect) - Number(left.lastCorrect) ||
        left.lastSeenAt.localeCompare(right.lastSeenAt)
      );
    });

  const need = Math.max(0, count - reviews.length);
  // Weight 1 (always right) to 3 (always wrong); unknown competencies count 2.
  const fresh = weightedSample(
    unseen,
    need,
    (item) => {
      const scores = item.competencies.map(
        (competency) => weakness.get(competency) ?? 0.5,
      );
      return 1 + 2 * (scores.length ? Math.max(...scores) : 0.5);
    },
    random,
  );
  const repeats = seen.slice(0, need - fresh.length);
  return {
    items: shuffle([...reviews, ...fresh, ...repeats], random),
    reviewIds: reviews.map((item) => item.id),
  };
}
