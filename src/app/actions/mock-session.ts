"use server";
import { z } from "zod";
import { requireUserId } from "@/lib/supabase/learner";
import { manifests, mockItems } from "@/content/mock-catalog";
import { candidateItem } from "@/content/shared/types";
import type { MockSessionPayload } from "@/features/exam/mock-types";
import { logServerError } from "@/lib/server/diagnostics";
import { signMockAudio } from "@/lib/server/mock-audio";
const eventSchema = z.object({
  type: z.enum([
    "start",
    "resume",
    "answer",
    "next",
    "previous",
    "play",
    "tick",
  ]),
  itemId: z.string().optional(),
  answer: z.string().max(30000).optional(),
});
export async function mockSessionEvent(
  sessionId: string | null,
  manifestId: string,
  event: unknown,
): Promise<
  { ok: true; data: MockSessionPayload } | { ok: false; message: string }
> {
  // Messages are French: they appear inside the French-only Exam Mode screen.
  const parsed = eventSchema.safeParse(event);
  if (
    !parsed.success ||
    (sessionId !== null && !z.string().uuid().safeParse(sessionId).success)
  )
    return { ok: false, message: "Requête de session invalide." };
  const { supabase } = await requireUserId();
  // The clip's link is signed before the play is spent, so a storage failure
  // never costs the learner their only listen.
  let signedAudio: string | undefined;
  if (parsed.data.type === "play") {
    const clip = mockItems.find((i) => i.id === parsed.data.itemId);
    if (clip?.kind === "mcq" && clip.audio?.status === "ready")
      try {
        signedAudio = await signMockAudio(
          clip.audio.path,
          clip.audio.intendedDuration,
        );
      } catch (error) {
        logServerError("Mock audio link failed", error, { itemId: clip.id });
        return {
          ok: false,
          message:
            "Le document sonore est momentanément indisponible. Réessayez dans un instant : votre écoute n’a pas été utilisée.",
        };
      }
  }
  const { data, error } = await supabase.rpc("mpk_mock_event", {
    p_session_id: sessionId,
    p_manifest_id: manifestId,
    p_event: parsed.data,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "55000"
          ? "Audio en préparation : examen blanc complet indisponible."
          : "Cette action est indisponible. Reprenez la session pour vérifier son état actuel.",
    };
  const result = data as unknown as Omit<
    MockSessionPayload,
    "manifest" | "item" | "serverNow"
  > & { audioGranted: boolean };
  const manifest = manifests.find((m) => m.id === result.manifestId);
  if (!manifest) return { ok: false, message: "Simulation inconnue." };
  const serverNow = Date.now();
  const source = mockItems.find(
    (i) =>
      i.id ===
      manifest.sections[result.state.sectionIndex]?.itemIds[
        result.state.itemIndex
      ],
  );
  const item =
    source && result.state.status !== "completed"
      ? candidateItem(source)
      : undefined;
  if (item?.audio) {
    // A signed link is sent only for a successful first play; resume never
    // enables replay, and the bucket key itself never reaches the browser.
    if (result.audioGranted && signedAudio) item.audio.path = signedAudio;
    else delete item.audio.path;
    if (
      manifest.exam === "TCF" &&
      (!result.state.consumedAudio.includes(item.id) ||
        serverNow < (result.state.audioUntil ?? Infinity))
    ) {
      item.prompt =
        "Écoutez le document sonore. La question sera présentée après l’écoute.";
      delete item.options;
    }
  }
  return { ok: true, data: { ...result, manifest, item, serverNow } };
}
