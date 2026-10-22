/**
 * Largest recording the app accepts. Vercel rejects request bodies over
 * 4.5 MB, and recordings are never stored, so they must fit in one request.
 */
export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

/** Requested recording bitrate: about 0.18 MB a minute of speech. */
export const RECORDING_BITS_PER_SECOND = 24_000;

/**
 * When TEF section B objections are played, in seconds after the answer
 * starts: the other person interrupts three times in the first four minutes.
 */
export const OBJECTION_TIMES = [60, 150, 240];
