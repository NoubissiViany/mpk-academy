"use client";

import { writing } from "@/i18n/messages/writing";
import { useI18n } from "@/i18n/client";
import {
  countWords,
  validWritingRange,
  type WritingRange,
} from "@/lib/domain/writing-checks";

export function WritingLength({
  text,
  range,
  enforceMaximum = false,
  french = false,
  id,
}: {
  text: string;
  range?: WritingRange;
  enforceMaximum?: boolean;
  french?: boolean;
  id?: string;
}) {
  const { t } = useI18n();
  const words = countWords(text);
  // Exam Mode stays French independently of the interface language.
  const copy = french ? writing.fr.length : t.writing.length;
  return (
    <p
      id={id}
      role="status"
      aria-live="polite"
      className="text-sm text-muted-foreground"
    >
      {validWritingRange(range) ? (
        <>
          {copy.count(words)} · {copy.range(range.min, range.max)}.{" "}
          {words < range.min
            ? copy.remaining(range.min - words, range.min)
            : enforceMaximum && range.max !== undefined && words > range.max
              ? copy.over(range.max)
              : copy.ready}
        </>
      ) : (
        copy.unavailable
      )}
    </p>
  );
}
