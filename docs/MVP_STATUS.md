# MVP Status

| Feature                            | Persistence/security                                       | Status     |
| ---------------------------------- | ---------------------------------------------------------- | ---------- |
| Email/password Auth                | Supabase Auth, confirmation, recovery, SSR cookies         | Integrated |
| Profile and exam goal              | Supabase RLS + restricted functions                        | Integrated |
| Diagnostic                         | Atomic answers/results/progress; server-owned scoring      | Integrated |
| Guest diagnostic handoff           | Seven-day browser record; idempotent authenticated claim   | Integrated |
| Dashboard (Today, plan, readiness) | Server-loaded learner snapshot; client-side planning       | Integrated |
| Lessons                            | One checkpoint per lesson; supports additional checkpoints | Integrated |
| Reading/listening practice         | Unseen-first, weakness-weighted selection on the server    | Integrated |
| Writing AI feedback                | Queue + DB caps; server-verified Groq output; consent      | Integrated |
| Speaking AI feedback               | Transcribed in-request, audio never stored; queued review  | Integrated |
| Mock exam                          | Atomic assessment and server-owned scoring                 | Integrated |
| Mistake review (1, 3, 7 days)      | `review_items` kept by a trigger; owner-only reads         | Integrated |
| Purchases/entitlements             | Atomic Stripe fulfillment; no browser writes               | Integrated |
| Checkout                           | Stripe-hosted payment, tax, webhook, refund revocation     | Integrated |
| Closed beta access                 | Invite codes, seat limit, `/admin` tools                   | Integrated |
| Bilingual interface (EN/FR)        | Typed messages; French explanations and lesson bodies      | Integrated |
| Certificate                        | Removed until server issuance/verification exists          | Removed    |
| Private mock audio storage         | Signed URLs; one play authorized by the mock session       | Integrated |
| Realtime, Edge Functions           | Not used                                                   | Deferred   |

Answer keys, explanations, and model responses stay on the server: lessons, practice, and the diagnostic receive redacted content and are checked by server actions. `npm run check:bundle` verifies the browser bundle after each build.

## Phase 1 (learning loop) — what is live and what is waiting

- **Readiness** is the average of the reading and listening practice scores (a rolling average that moves after every session), compared with an MPK accuracy goal per target: NCLC 5 → 60%, NCLC 7 → 70%, NCLC 9+ → 85%. Bands are "at", "near" (within 10 points), or "below", with an evidence label. These are planning aids, not NCLC conversions, and every screen says so.
- **Today** combines due reviews, one practice session on the weakest skill, and one recommended lesson (about 20–30 minutes). Steps count as done from today's activity in the learner's time zone.
- **Study plan** turns the exam date from Settings into practice sessions per week (3–5 by target, plus up to 2 when far behind close to the exam) and compares them with this week.
- **Waiting on content:** diagnostic v3 is deployed to staging with 26 questions and a required 80–120-word writing sample. Its separate AI writing result requires sign-in and consent; sandbox provider setup and production deployment remain. Lessons still have one checkpoint each (the code supports 3–5 through `extraCheckpoints`). Practice has 12 TEF reading items, 10 TCF reading items and 10 listening items per exam, so learners see every item within a few sessions; selection then repeats the items seen longest ago.

## Phase 2 (AI writing feedback)

- A writing-practice text can be sent for AI feedback after the learner agrees (separate consent, recorded with the notice version). Groq reviews it; the server drops quotes that are not in the text, corrections that rewrite too much, and rewrites of text the learner did not write.
- Caps are enforced in the database: 60 essays a day in total and 2 per learner (failed reviews do not count). Essays past the cap are reviewed the next morning. Setup, monitoring, and calibration: `docs/AI_OPERATIONS.md`.
- Learners can rewrite a text and compare it with the first version, and report wrong corrections. `/admin` shows tokens, the queue, failures, and flags.
- **Not done yet:** the 40-essay calibration with a teacher (levels are uncalibrated estimates until then), while the diagnostic writing sample is implemented and deployed to staging.

## Phase 3 (AI speaking feedback)

- Learners record a spoken answer in the browser; the server transcribes it with Groq Whisper during the upload and never stores the audio. Only the transcript, pace and pause measures, and feedback are kept.
- Feedback uses `qwen/qwen3.8-27b` on its own token budget, with the same verification as writing (quotes must be in the transcript, small edits only) plus loose matching and no spelling or punctuation fixes. The page shows the transcript, pace, pauses, and "Pronunciation is not assessed."
- Caps: 1 recording per learner and 55 per day in total, and 25,000 seconds of audio a day. The allowance is checked before recording and again before transcription. A failed review can be retried from the kept transcript.
- TEF section B objections come at 1:00, 2:30 and 4:00, with generated audio. Every speaking practice task has a model answer to read and hear. Levels are uncalibrated until a teacher grades a sample.

## Phase 4 (content and audio)

Status verified **October 29, 2026**. **Phase 4 remains open.** The reviewed-content release and required writing sample are deployed to staging; production synchronization, content targets and authenticated hosted acceptance remain.

- **Published catalog:** 256 questions/tasks, 24 unique lessons, two mocks and 26 diagnostic questions. The earlier **213 drafts remain merged**, including 183 owner-authorized AI approvals, with unchanged review history. See [editorial review](CONTENT_REVIEW.md).
- **Content/audio:** zero short-document or answer-length exceptions; 124 ready clips, 45 public and 79 private. Both staging and production private buckets contain all 79 required filenames. Staging downloads previously matched local hashes; this audit checked production inventory and bucket privacy.
- **Staging:** all 24 migrations applied. The sandbox now runs `2779986`; its build and hosted guest diagnostic/writing check passed. Sandbox `GROQ_API_KEY`/`JOBS_SECRET` and staging Vault worker entries are absent and need configuration before the consented provider test.
- **Production:** configured as Supabase `uhbuvskmiojqjegpuuln`, with application AI variables and worker Vault entries present. Its database is six migrations behind and its app still serves `081b7f6`. The owner runs the database push before deploying matching source. No hosted database writes were performed by Codex in this audit.
- **Writing sample:** required 80–120 words after the quiz, preserved through guest sign-in, separate provisional result, current consent and explicit provider request, existing shared daily limits and queued consent recheck. Historical assessments remain supported. Production needs the existing writing migration before the matching app.
- **New drafts:** 45 TEF reading questions individually edited, all pending; zero mechanical flags and a valid in-memory candidate merge. Nine require the normal teacher sample after acceptance. Provider availability/rate errors stopped generation. These files do not change learner content, and the previous 183-item AI approval exception does not extend to them.
- **Remaining published-content gaps:** 48 TEF / 50 TCF reading; 50 listening per exam; six TEF / four TCF writing and six TEF / four TCF speaking tasks; eight additional available lessons per exam. Eight shared lessons could fill both gaps. Add 48 checkpoints to existing lessons and 3–5 to each new lesson. Of the 198 MCQs still to publish, 45 are drafted and 153 are not yet drafted.
- **Calibration:** a blank 40-essay packet and per-criterion agreement checker are ready; no real calibration ratings are recorded. Independent teacher writing ratings and separate speaking evaluation remain outstanding accuracy work from Phases 2–3.
- **Completion check:** `npm run check:phase4` intentionally fails until local content targets are met and drafts resolved. It does not establish hosted deployment, authentication, provider behavior or calibration.

Exact remaining quantities, commands and completion criteria: [Phase 4 checklist](PHASE4_COMPLETION.md). Dated evidence: [October 29 audit](PHASE4_AUDIT_2026-10-29.md).
