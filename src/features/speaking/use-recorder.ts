"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_AUDIO_BYTES, RECORDING_BITS_PER_SECOND } from "@/config/speaking";

export type RecorderState =
  "idle" | "unsupported" | "denied" | "preparing" | "recording" | "recorded";

// Opus in WebM or Ogg where available (Chrome, Edge, Firefox), AAC in MP4 on
// Safari. All are accepted by the transcription service.
const preferredTypes = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm",
];

/** Records one answer; the audio never leaves the device until it is sent. */
export function useRecorder({
  maxSeconds,
  preparationSeconds = 0,
  maxBytes = MAX_AUDIO_BYTES,
}: {
  maxSeconds: number;
  preparationSeconds?: number;
  maxBytes?: number;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(preparationSeconds);
  const [recording, setRecording] = useState<{
    blob: Blob;
    url: string;
    seconds: number;
  } | null>(null);
  const [stoppedAtLimit, setStoppedAtLimit] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const begin = useCallback(
    (stream: MediaStream) => {
      const mimeType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: RECORDING_BITS_PER_SECOND,
      });
      const chunks: Blob[] = [];
      let bytes = 0;
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        chunks.push(event.data);
        bytes += event.data.size;
        // Keep a margin for the last chunk and the upload's form fields.
        if (bytes >= maxBytes * 0.95 && recorder.state === "recording") {
          setStoppedAtLimit(true);
          recorder.stop();
        }
      };
      recorder.onstop = () => {
        const seconds = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );
        const blob = new Blob(chunks, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        setRecording({ blob, url: URL.createObjectURL(blob), seconds });
        setState("recorded");
        release();
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start(1000);
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(seconds);
        if (seconds >= maxSeconds) stop();
      }, 250);
    },
    [maxBytes, maxSeconds, release, stop],
  );

  const start = useCallback(async () => {
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setState("unsupported");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch {
      setState("denied");
      return;
    }
    streamRef.current = stream;
    setStoppedAtLimit(false);
    if (preparationSeconds <= 0) return begin(stream);
    // The microphone is granted first, so preparation time is never wasted.
    setState("preparing");
    setCountdown(preparationSeconds);
    const preparedAt = Date.now();
    timerRef.current = setInterval(() => {
      const left =
        preparationSeconds - Math.floor((Date.now() - preparedAt) / 1000);
      setCountdown(Math.max(0, left));
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        begin(stream);
      }
    }, 250);
  }, [begin, preparationSeconds]);

  const reset = useCallback(() => {
    stop();
    release();
    setRecording((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setElapsed(0);
    setStoppedAtLimit(false);
    setState("idle");
  }, [release, stop]);

  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      release();
    },
    [release],
  );

  useEffect(
    () => () => {
      if (recording) URL.revokeObjectURL(recording.url);
    },
    [recording],
  );

  return {
    state,
    elapsed,
    countdown,
    recording,
    stoppedAtLimit,
    start,
    stop,
    reset,
  };
}
