# MVP Status

| Feature                            | Persistence/security                                      | Status     |
| ---------------------------------- | --------------------------------------------------------- | ---------- |
| Email/password Auth                | Supabase Auth, confirmation, recovery, SSR cookies        | Integrated |
| Profile and exam goal              | Supabase RLS + restricted functions                       | Integrated |
| Diagnostic                         | Atomic answers/results/progress; server-owned scoring     | Integrated |
| Guest diagnostic handoff           | Seven-day browser record; idempotent authenticated claim  | Integrated |
| Dashboard (Today, plan, readiness) | Server-loaded learner snapshot; client-side planning      | Integrated |
| Lessons                            | Several shuffled checkpoints; server-checked answers      | Integrated |
| Reading/listening practice         | Unseen-first, weakness-weighted selection on the server   | Integrated |
| Writing AI feedback                | Queue + DB caps; server-verified Groq output; consent     | Integrated |
| Speaking AI feedback               | Transcribed in-request, audio never stored; queued review | Integrated |
| Mock exam                          | Atomic assessment and server-owned scoring                | Integrated |
| Mistake review (1, 3, 7 days)      | `review_items` kept by a trigger; owner-only reads        | Integrated |
| Purchases/entitlements             | Atomic Stripe fulfillment; no browser writes              | Integrated |
| Checkout                           | Stripe-hosted payment, tax, webhook, refund revocation    | Integrated |
| Closed beta access                 | Invite codes, seat limit, `/admin` tools                  | Integrated |
| Bilingual interface (EN/FR)        | Typed messages; lesson bodies still English               | Partial    |
| Certificate                        | Removed until server issuance/verification exists         | Removed    |
| Storage, Realtime, Edge Functions  | Not used                                                  | Deferred   |

Answer keys, explanations, and model responses stay on the server: lessons, practice, and the diagnostic receive redacted content and are checked by server actions. `npm run check:bundle` verifies the browser bundle after each build.

## Phase 1 (learning loop) — what is live and what is waiting

- **Readiness** is the average of the reading and listening practice scores (a rolling average that moves after every session), compared with an MPK accuracy goal per target: NCLC 5 → 60%, NCLC 7 → 70%, NCLC 9+ → 85%. Bands are "at", "near" (within 10 points), or "below", with an evidence label. These are planning aids, not NCLC conversions, and every screen says so.
- **Today** combines due reviews, one practice session on the weakest skill, and one recommended lesson (about 20–30 minutes). Steps count as done from today's activity in the learner's time zone.
- **Study plan** turns the exam date from Settings into practice sessions per week (3–5 by target, plus up to 2 when far behind close to the exam) and compares them with this week.
- **Waiting on content (Phase 4):** diagnostic v3 (30 items with real listening audio and a writing sample), 3–5 checkpoints per lesson (the code supports `extraCheckpoints`), and French lesson bodies and explanations (`explanationFr` fields are shown as soon as they exist). With 10 reading and 10 listening items per exam, a learner sees every item within a few sessions; selection then repeats the items seen longest ago.

## Phase 2 (AI writing feedback)

- A writing-practice text can be sent for AI feedback after the learner agrees (separate consent, recorded with the notice version). Groq reviews it; the server drops quotes that are not in the text, corrections that rewrite too much, and rewrites of text the learner did not write.
- Caps are enforced in the database: 60 essays a day in total and 2 per learner (failed reviews do not count). Essays past the cap are reviewed the next morning. Setup, monitoring, and calibration: `docs/AI_OPERATIONS.md`.
- Learners can rewrite a text and compare it with the first version, and report wrong corrections. `/admin` shows tokens, the queue, failures, and flags.
- **Not done yet:** the 40-essay calibration with a teacher (levels are uncalibrated estimates until then), and the diagnostic writing sample (model C), which waits for diagnostic v3.

## Phase 3 (AI speaking feedback)

- Learners record a spoken answer in the browser; the server transcribes it with Groq Whisper during the upload and never stores the audio. Only the transcript, pace and pause measures, and feedback are kept.
- Feedback uses `qwen/qwen3.8-27b` on its own token budget, with the same verification as writing (quotes must be in the transcript, small edits only) plus loose matching and no spelling or punctuation fixes. The page shows the transcript, pace, pauses, and "Pronunciation is not assessed."
- Caps: 1 recording per learner and 55 per day in total, and 25,000 seconds of audio a day. The allowance is checked before recording and again before transcription. A failed review can be retried from the kept transcript.
- **Not done yet (need generated audio, Phase 4):** the TEF section B objections played at set times and spoken model answers. Levels are uncalibrated until a teacher grades a sample.
