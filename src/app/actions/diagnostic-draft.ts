"use server";

import { z } from "zod";
import { unstable_rethrow } from "next/navigation";
import {
  diagnosticDraftSchema,
  isCompatibleDraft,
  type DiagnosticDraft,
} from "@/lib/domain/diagnostic-draft";
import { getPublicDiagnosticQuestions } from "@/lib/server/content";
import { requireUserId } from "@/lib/supabase/learner";
import type { Json } from "@/types/database";

export type DraftActionResult =
  | { ok: true; draft: DiagnosticDraft | null }
  | { ok: false; reason: "conflict" | "unavailable" | "invalid" };

function failure(error: unknown): DraftActionResult {
  unstable_rethrow(error);
  return {
    ok: false,
    reason:
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "40001"
        ? "conflict"
        : "unavailable",
  };
}

export async function getDiagnosticDraftAction(): Promise<DraftActionResult> {
  try {
    const { supabase } = await requireUserId();
    const { data, error } = await supabase.rpc("mpk_get_diagnostic_draft");
    if (error) return failure(error);
    return { ok: true, draft: data ? diagnosticDraftSchema.parse(data) : null };
  } catch (error) {
    return failure(error);
  }
}

export async function saveDiagnosticDraftAction(
  input: unknown,
  expectedUserId: string,
): Promise<DraftActionResult> {
  const parsed = diagnosticDraftSchema.safeParse(input);
  if (
    !parsed.success ||
    !isCompatibleDraft(parsed.data, getPublicDiagnosticQuestions())
  )
    return { ok: false, reason: "invalid" };
  try {
    const { supabase, userId } = await requireUserId();
    if (userId !== expectedUserId) return { ok: false, reason: "unavailable" };
    const { data, error } = await supabase.rpc("mpk_save_diagnostic_draft", {
      p_draft: parsed.data as unknown as Json,
      p_revision: parsed.data.revision,
    });
    if (error) return failure(error);
    return { ok: true, draft: diagnosticDraftSchema.parse(data) };
  } catch (error) {
    return failure(error);
  }
}

export async function discardDiagnosticDraftAction(
  id: string,
  revision: number,
  expectedUserId: string,
): Promise<DraftActionResult> {
  if (
    !z.uuid().safeParse(id).success ||
    !z.number().int().min(0).safeParse(revision).success
  )
    return { ok: false, reason: "invalid" };
  try {
    const { supabase, userId } = await requireUserId();
    if (userId !== expectedUserId) return { ok: false, reason: "unavailable" };
    const { error } = await supabase.rpc("mpk_discard_diagnostic_draft", {
      p_id: id,
      p_revision: revision,
    });
    if (error) return failure(error);
    return { ok: true, draft: null };
  } catch (error) {
    return failure(error);
  }
}
