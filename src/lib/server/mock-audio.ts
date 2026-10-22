import "server-only";

import { MOCK_AUDIO_BUCKET } from "@/content/shared/audio";
import { createAdminClient } from "@/lib/supabase/admin";

/** Time beyond the clip's length for a slow start or a short stall. */
const LINK_SLACK_SECONDS = 120;

/**
 * A link to one clip in the private mock bucket that stops working shortly
 * after the clip would have finished playing.
 */
export async function signMockAudio(path: string, seconds: number) {
  const { data, error } = await createAdminClient()
    .storage.from(MOCK_AUDIO_BUCKET)
    .createSignedUrl(path, Math.ceil(seconds) + LINK_SLACK_SECONDS);
  if (error || !data?.signedUrl) throw error ?? new Error("No signed URL");
  return data.signedUrl;
}
