"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import type { PublicProductiveTask } from "@/content/shared/types";
import { useI18n } from "@/i18n/client";
import { intlLocale } from "@/i18n/config";

type Objection = NonNullable<PublicProductiveTask["objections"]>[number];

export interface RaisedObjection {
  index: number;
  /** Seconds into the answer. */
  at: number;
  /** Its audio started, so the recording may contain it. */
  played: boolean;
}

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * TEF section B: the other person objects at set times while the learner
 * answers. Each objection plays once (or shows as text if its audio is not
 * ready) and stays on screen.
 */
export function Objections({
  objections,
  elapsed,
  active,
  onRaised,
}: {
  objections: Objection[];
  elapsed: number;
  active: boolean;
  onRaised?: (raised: RaisedObjection) => void;
}) {
  const { t, locale } = useI18n();
  const copy = t.speaking.objections;
  const raised = useRef(new Set<number>());
  const onRaisedRef = useRef(onRaised);
  useEffect(() => {
    onRaisedRef.current = onRaised;
  }, [onRaised]);

  useEffect(() => {
    if (!active) {
      raised.current.clear();
      return;
    }
    objections.forEach((objection, index) => {
      if (elapsed < objection.at || raised.current.has(index)) return;
      raised.current.add(index);
      let played = false;
      if (objection.audio) {
        played = true;
        void new Audio(objection.audio).play().catch(() => undefined);
      }
      onRaisedRef.current?.({ index, at: elapsed, played });
    });
  }, [active, elapsed, objections]);

  if (!active)
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        {copy.hint(
          new Intl.ListFormat(intlLocale(locale), {
            type: "conjunction",
          }).format(objections.map((objection) => clock(objection.at))),
        )}
      </p>
    );
  const due = objections.filter((objection) => elapsed >= objection.at);
  if (!due.length) return null;
  return (
    <ol className="space-y-2" aria-live="assertive">
      {due.map((objection, index) => (
        <li
          key={objection.at}
          className={
            index === due.length - 1
              ? "rounded-xl border border-accent/40 bg-accent/10 p-4"
              : "rounded-xl border p-4 text-muted-foreground"
          }
        >
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em]">
            <MessageCircle className="size-4" aria-hidden="true" />
            {copy.says}
          </p>
          <p lang="fr" className="mt-1 leading-7">
            « {objection.text} »
          </p>
        </li>
      ))}
    </ol>
  );
}
