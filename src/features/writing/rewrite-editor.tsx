"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared";
import { useI18n } from "@/i18n/client";
import { countWords } from "@/lib/domain/writing-checks";
import { RequestAiFeedback } from "./request-feedback";

export function RewriteEditor({
  submissionId,
  taskId,
  taskTitle,
  instructions,
  original,
}: {
  submissionId: string;
  taskId: string;
  taskTitle: string;
  instructions: string;
  original: string;
}) {
  const { t } = useI18n();
  const copy = t.writing.rewrite;
  const [text, setText] = useState(original);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={copy.title(taskTitle)}
        description={copy.description}
      />
      <p lang="fr" className="rounded-xl border bg-card p-4 text-sm leading-6">
        {instructions}
      </p>
      <label className="block font-semibold">
        {copy.label}
        <textarea
          lang="fr"
          className="mt-2 min-h-72 w-full rounded border bg-background p-4 font-normal"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        {t.writing.feedback.words(countWords(text))}
      </p>
      <RequestAiFeedback
        taskId={taskId}
        text={text}
        parentId={submissionId}
        disabled={text.trim() === original.trim()}
      />
      <Link
        href={`/writing/${submissionId}`}
        className="inline-block text-sm font-bold text-primary hover:underline"
      >
        {copy.back}
      </Link>
    </div>
  );
}
