/**
 * Largest recording the app accepts. Vercel rejects request bodies over
 * 4.5 MB, and recordings are never stored, so they must fit in one request.
 */
export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

/** Requested recording bitrate: about 0.18 MB a minute of speech. */
export const RECORDING_BITS_PER_SECOND = 24_000;
