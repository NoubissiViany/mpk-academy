"use client";

import { useState } from "react";
import { getModelResponseAction } from "@/app/actions/content";
import { transcriptTurns } from "@/content/shared/audio";
import { useI18n } from "@/i18n/client";

/**
 * A task's model answer, fetched only when the learner opens it after
 * answering; speaking answers can be heard as well as read.
 */
export function ModelAnswer({ taskId }: { taskId: string }) {
  const { t } = useI18n();
  const copy = t.practice.productive;
  const [model, setModel] = useState<{ text: string; audio?: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (model || loading) return;
    setLoading(true);
    const result = await getModelResponseAction(taskId);
    setLoading(false);
    if (result.ok)
      setModel({ text: result.modelResponse, audio: result.audio });
  };
  const turns = model ? transcriptTurns(model.text) : [];
  return (
    <details
      onToggle={(event) => {
        if (event.currentTarget.open) void load();
      }}
    >
      <summary className="cursor-pointer font-semibold">
        {copy.modelResponse}
      </summary>
      {loading && <p className="mt-4">{copy.loadingModel}</p>}
      {model?.audio && (
        <label className="mt-4 block text-sm font-semibold">
          {copy.modelAudio}
          <audio className="mt-2 w-full" controls src={model.audio} />
        </label>
      )}
      {model && (
        <div lang="fr" className="mt-4 space-y-2 leading-7">
          {turns.length > 1 ? (
            turns.map((turn, index) => (
              <p key={index}>
                <span className="font-semibold">{turn.speaker} :</span>{" "}
                {turn.text}
              </p>
            ))
          ) : (
            <p className="whitespace-pre-line">{model.text}</p>
          )}
        </div>
      )}
    </details>
  );
}
