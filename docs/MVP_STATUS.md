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
| Bilingual interface (EN/FR)        | Typed messages; French explanations and lesson bodies     | Integrated |
| Certificate                        | Removed until server issuance/verification exists         | Removed    |
| Private mock audio storage         | Signed URLs; one play authorized by the mock session      | Integrated |
| Realtime, Edge Functions           | Not used                                                  | Deferred   |

Answer keys, explanations, and model responses stay on the server: lessons, practice, and the diagnostic receive redacted content and are checked by server actions. `npm run check:bundle` verifies the browser bundle after each build.

## Phase 1 (learning loop) — what is live and what is waiting

- **Readiness** is the average of the reading and listening practice scores (a rolling average that moves after every session), compared with an MPK accuracy goal per target: NCLC 5 → 60%, NCLC 7 → 70%, NCLC 9+ → 85%. Bands are "at", "near" (within 10 points), or "below", with an evidence label. These are planning aids, not NCLC conversions, and every screen says so.
- **Today** combines due reviews, one practice session on the weakest skill, and one recommended lesson (about 20–30 minutes). Steps count as done from today's activity in the learner's time zone.
- **Study plan** turns the exam date from Settings into practice sessions per week (3–5 by target, plus up to 2 when far behind close to the exam) and compares them with this week.
- **Waiting on content:** diagnostic v3 is merged locally with 26 questions and a required 80–120-word writing sample. Its separate AI writing result is available after sign-in and consent; the new migrations and application still need deployment. Lessons still have one checkpoint each (the code supports 3–5 through `extraCheckpoints`). Practice has 12 TEF reading items, 10 TCF reading items and 10 listening items per exam, so learners see every item within a few sessions; selection then repeats the items seen longest ago.

## Phase 2 (AI writing feedback)

- A writing-practice text can be sent for AI feedback after the learner agrees (separate consent, recorded with the notice version). Groq reviews it; the server drops quotes that are not in the text, corrections that rewrite too much, and rewrites of text the learner did not write.
- Caps are enforced in the database: 60 essays a day in total and 2 per learner (failed reviews do not count). Essays past the cap are reviewed the next morning. Setup, monitoring, and calibration: `docs/AI_OPERATIONS.md`.
- Learners can rewrite a text and compare it with the first version, and report wrong corrections. `/admin` shows tokens, the queue, failures, and flags.
- **Not done yet:** the 40-essay calibration with a teacher (levels are uncalibrated estimates until then), while the diagnostic writing sample is now implemented locally and awaits deployment.

## Phase 3 (AI speaking feedback)

- Learners record a spoken answer in the browser; the server transcribes it with Groq Whisper during the upload and never stores the audio. Only the transcript, pace and pause measures, and feedback are kept.
- Feedback uses `qwen/qwen3.8-27b` on its own token budget, with the same verification as writing (quotes must be in the transcript, small edits only) plus loose matching and no spelling or punctuation fixes. The page shows the transcript, pace, pauses, and "Pronunciation is not assessed."
- Caps: 1 recording per learner and 55 per day in total, and 25,000 seconds of audio a day. The allowance is checked before recording and again before transcription. A failed review can be retried from the kept transcript.
- TEF section B objections come at 1:00, 2:30 and 4:00, with generated audio. Every speaking practice task has a model answer to read and hear. Levels are uncalibrated until a teacher grades a sample.

## Phase 4 (content and audio)

Status verified October 28, 2026. **Phase 4 remains open.** The approved-content batch and required writing feature are prepared locally; content-volume targets and hosted release verification remain.

- **Catalog:** 256 questions/tasks, 24 unique lessons, two mock exams and 26 diagnostic questions. All **213 drafts are merged**, including the 183 owner-authorized AI approvals. Review notes and approval decisions are unchanged. See [editorial review](CONTENT_REVIEW.md).
- **Content debt:** zero short-document exceptions and zero answer-length-bias exceptions. Validation still enforces minimum document lengths, distinct documents, balanced answer positions, bilingual explanations and mock timing.
- **Audio:** 124 generated clips, 45 public and 79 private, with zero pending clips. The latest batch generated/regenerated 91 recordings. All files exist locally and their recorded durations agree with Azure's fixed-rate MP3 output. The 79 new private files were uploaded to the owner-confirmed staging project and verified 79/79; old objects were preserved.
- **SQL:** `20261028000200_content_sync.sql` synchronizes the 183 reviewed content changes. Staging has applied the earlier `20261024000100` and `20261028000100` migrations, but this new content migration remains pending.
- **Required writing sample:** after the quiz, learners write 80–120 words in French (suggested ten minutes, no automatic timeout). The sample is saved with the assessment; guests transfer it on sign-in. AI feedback requires explicit consent and a deliberate request after sign-in. Diagnostic feedback is available without a paid practice subscription and shares the existing per-user and global writing limits. The worker rechecks consent before sending a queued diagnostic sample. The separate provisional writing result never changes the quiz score or readiness. Historical assessments and guest sessions without a sample remain readable/claimable.
- **Writing migration:** `20261028000300_diagnostic_writing.sql` adds validated submission and feedback RPCs using existing assessment and writing tables. No hosted database push was performed by Codex. Apply the migrations before deploying the matching application.
- **Still required:** 48 TEF / 50 TCF reading questions; 50 listening questions per exam; six TEF / four TCF writing tasks; six TEF / four TCF speaking tasks; eight additional available lessons per exam; and 3–5 checkpoints per lesson (all 24 existing lessons currently have one).
- **Readiness command:** `npm run check:phase4` validates content/SQL and exits nonzero while the local content targets remain unmet. A successful content validator alone does not mean Phase 4 is complete. Hosted deployment and calibration require separate evidence.
- **Hosted release:** owner-run database pushes, matching application deployment, entitled listening/mock tests, and a real consented writing-feedback round trip are still required. The owner confirmed that production is not configured; bootstrap instructions are in the checklist below.

Exact commands, remaining quantities and completion criteria: [Phase 4 checklist](PHASE4_COMPLETION.md). The 40-essay and separate speaking calibration remain outstanding accuracy work from Phases 2–3.
