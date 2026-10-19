"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { mockSummaries } from "@/content/mock-summaries";
import { mockSessionEvent } from "@/app/actions/mock-session";
import type { MockSessionPayload } from "./mock-types";
import type { Question, ProductivePracticeTask } from "@/types/domain";
// Historical unit-test/API compatibility. Current scoring is authoritative in Supabase.
export function scoreMockComprehension(
  items: (
    | { key: string; question: Question }
    | { key: string; task: ProductivePracticeTask }
  )[],
  answers: Record<string, string>,
) {
  const q = items.filter(
    (i): i is { key: string; question: Question } => "question" in i,
  );
  return Math.round(
    (100 *
      q.filter((i) => answers[i.key] === i.question.correctAnswer).length) /
      Math.max(q.length, 1),
  );
}
export function ScaledMockSession() {
  const { state } = useApp();
  const exam = state.user?.goal.exam === "TCF Canada" ? "TCF" : "TEF";
  const summary = mockSummaries.find((m) => m.exam === exam)!;
  if (!summary.ready)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold">Simulation MPK · {exam} Canada</h1>
        <p>
          Audio pending — full mock unavailable. No transcript substitution is
          permitted in a mock.
        </p>
        <p>Cette simulation d’entraînement n’est pas un examen officiel.</p>
      </div>
    );
  return <TimedSession manifestId={summary.id} />;
}
function TimedSession({ manifestId }: { manifestId: string }) {
  const { state } = useApp();
  const router = useRouter();
  const [session, setSession] = useState<MockSessionPayload | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [clock, setClock] = useState(0);
  const [audioPath, setAudioPath] = useState<string | undefined>();
  const sessionRef = useRef(session);
  const offset = useRef(0);
  const pending = useRef(false);
  const draft = useRef("");
  const key = `mpk-mock-v2:${state.user?.id}:${manifestId}`;
  const send = useCallback(
    async (
      type:
        "start" | "resume" | "answer" | "next" | "previous" | "play" | "tick",
      value?: string,
    ) => {
      if (pending.current) return false;
      pending.current = true;
      setBusy(true);
      try {
        const current = sessionRef.current;
        const id = current?.id ?? localStorage.getItem(key);
        const result = await mockSessionEvent(id, manifestId, {
          type: id && type === "start" ? "resume" : type,
          itemId: current?.item?.id,
          ...(value !== undefined ? { answer: value } : {}),
        });
        if (!result.ok) {
          setMessage(result.message);
          return false;
        }
        const next = result.data;
        offset.current = next.serverNow - Date.now();
        setClock(next.serverNow);
        setSession(next);
        sessionRef.current = next;
        setMessage("");
        localStorage.setItem(key, next.id);
        if (
          next.item?.id !== current?.item?.id ||
          type === "resume" ||
          type === "start"
        ) {
          const restored =
            next.item?.kind === "writing"
              ? (localStorage.getItem(`${key}:draft:${next.item.id}`) ??
                next.state.answers[next.item.id] ??
                "")
              : (next.state.answers[next.item?.id ?? ""] ?? "");
          draft.current = restored;
          setAnswer(restored);
        }
        if (current?.item && next.item?.id !== current.item.id)
          localStorage.removeItem(`${key}:draft:${current.item.id}`);
        if (type === "play" && next.item?.audio?.path)
          setAudioPath(next.item.audio.path);
        else if (next.item?.id !== current?.item?.id) setAudioPath(undefined);
        if (next.state.status === "completed") {
          localStorage.removeItem(key);
          router.push(`/exam/results?assessment=${next.assessmentId}`);
        }
        return true;
      } catch {
        setMessage(
          "Connection interrupted. Resume to recover the saved session.",
        );
        return false;
      } finally {
        pending.current = false;
        setBusy(false);
      }
    },
    [key, manifestId, router],
  );
  useEffect(() => {
    void send("start");
  }, [send]);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now() + offset.current;
      setClock(now);
      const current = sessionRef.current;
      if (!current || current.state.status !== "in_progress") return;
      const deadline = Math.min(
        current.state.deadline,
        current.state.taskDeadline ?? Infinity,
      );
      if (
        current.item?.kind === "writing" &&
        now < deadline &&
        draft.current !== (current.state.answers[current.item.id] ?? "")
      ) {
        void send("answer", draft.current);
      } else if (
        now >= deadline ||
        (current.item?.audio &&
          !current.item.options &&
          current.state.audioUntil !== null &&
          now >= current.state.audioUntil)
      )
        void send("tick");
    }, 500);
    return () => clearInterval(timer);
  }, [send]);
  if (!session?.item)
    return (
      <div>
        <p>{message || "Chargement de la simulation…"}</p>
        <Button onClick={() => send("resume")}>Reprendre</Button>
      </div>
    );
  const item = session.item;
  const section = session.manifest.sections[session.state.sectionIndex];
  const remaining = Math.max(
    0,
    Math.ceil(
      (Math.min(
        session.state.deadline,
        session.state.taskDeadline ?? Infinity,
      ) -
        clock) /
        1000,
    ),
  );
  const preparing =
    clock < session.state.taskStartedAt + (item.preparationSeconds ?? 0) * 1000;
  return (
    <div className="mx-auto max-w-3xl space-y-6" lang="fr">
      <h1 className="text-2xl font-bold">
        {session.manifest.exam} Canada · Simulation MPK
      </h1>
      <p>{session.manifest.disclaimer}</p>
      <p>
        {section.skill} · {session.state.itemIndex + 1}/{section.itemIds.length}{" "}
        ·{" "}
        <span role="timer">
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
        </span>{" "}
        {preparing ? "Préparation" : ""}
      </p>
      {message && (
        <div role="alert">
          <p>{message}</p>
          <Button disabled={busy} onClick={() => send("resume")}>
            Reprendre
          </Button>
        </div>
      )}
      {item.passage && (
        <blockquote className="rounded border p-5">{item.passage}</blockquote>
      )}
      {item.audio && (
        <div>
          {!session.state.consumedAudio.includes(item.id) && (
            <Button disabled={busy} onClick={() => send("play")}>
              Écouter une fois
            </Button>
          )}
          {audioPath && (
            <audio
              autoPlay
              src={audioPath}
              onError={() =>
                setMessage(
                  "Lecture interrompue. Le son ne peut pas être rejoué ; poursuivez après le temps prévu.",
                )
              }
              aria-label="Document sonore"
            />
          )}
          <p>
            Aucune répétition. Une actualisation ne réinitialise pas l’écoute.
          </p>
        </div>
      )}
      <h2 className="text-xl whitespace-pre-line">{item.prompt}</h2>
      {item.options && (
        <fieldset disabled={busy}>
          <legend className="sr-only">Réponse</legend>
          {item.options.map((o) => (
            <label key={o.id} className="my-3 block rounded border p-3">
              <input
                type="radio"
                name={item.id}
                checked={answer === o.id}
                onChange={() => {
                  setAnswer(o.id);
                  void send("answer", o.id);
                }}
              />{" "}
              {o.label}
            </label>
          ))}
        </fieldset>
      )}
      {item.kind === "writing" && (
        <>
          <p>
            {item.wordCount?.min}
            {item.wordCount?.max ? `–${item.wordCount.max}` : " minimum"} mots
          </p>
          <textarea
            aria-label="Votre réponse"
            className="min-h-64 w-full rounded border bg-background p-4"
            value={answer}
            onChange={(e) => {
              const value = e.target.value;
              draft.current = value;
              setAnswer(value);
              localStorage.setItem(`${key}:draft:${item.id}`, value);
            }}
          />
          <Button disabled={busy} onClick={() => send("answer", answer)}>
            Enregistrer la réponse
          </Button>
        </>
      )}
      {item.kind === "speaking" && (
        <>
          <p>
            Entraînement oral autonome, sans interlocuteur en direct ni
            enregistrement.
          </p>
          <Button
            disabled={busy || preparing}
            onClick={() => send("answer", "self_practice_completed")}
          >
            Marquer la réponse orale terminée
          </Button>
        </>
      )}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          disabled={
            busy ||
            section.navigation !== "free" ||
            session.state.itemIndex === 0
          }
          onClick={async () => {
            if (item.kind === "writing" && !(await send("answer", answer)))
              return;
            await send("previous");
          }}
        >
          Précédent
        </Button>
        <Button
          disabled={busy || preparing}
          onClick={async () => {
            if (item.kind === "writing" && !(await send("answer", answer)))
              return;
            await send("next");
          }}
        >
          {session.state.itemIndex === section.itemIds.length - 1
            ? "Terminer cette section"
            : "Suivant"}
        </Button>
      </div>
      <p className="text-sm">
        Les réponses écrites sont enregistrées automatiquement. Terminer une
        section la verrouille définitivement.
      </p>
    </div>
  );
}
