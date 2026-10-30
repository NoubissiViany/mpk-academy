# MVP Status

| Feature                            | Persistence/security                                      | Status     |
| ---------------------------------- | --------------------------------------------------------- | ---------- |
| Email/password Auth                | Supabase Auth, confirmation, recovery, SSR cookies        | Integrated |
| Profile and exam goal              | Supabase RLS + restricted functions                       | Integrated |
| Diagnostic                         | Atomic answers/results/progress; server-owned scoring     | Integrated |
| Guest diagnostic handoff           | Seven-day browser record; idempotent authenticated claim  | Integrated |
| Dashboard (Today, plan, readiness) | Server-loaded learner snapshot; client-side planning      | Integrated |
| Lessons                            | Three checkpoints per lesson; server-owned answer checks  | Integrated |
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
- **Waiting on content:** diagnostic v3 and its required 80–120-word writing sample are implemented and present on both hosted database schemas. Authenticated feedback is verified on staging and production. Local content now provides 25 lessons per exam with three checkpoints each, 57 TEF reading questions, 10 TCF reading questions and 10 listening questions per exam. Release of the latest reading/lesson additions and the remaining practice-bank expansion are outstanding.

## Phase 2 (AI writing feedback)

- A writing-practice text can be sent for AI feedback after the learner agrees (separate consent, recorded with the notice version). Groq reviews it; the server drops quotes that are not in the text, corrections that rewrite too much, and rewrites of text the learner did not write.
- Caps are enforced in the database: 60 essays a day in total and 2 per learner (failed reviews do not count). Essays past the cap are reviewed the next morning. Setup, monitoring, and calibration: `docs/AI_OPERATIONS.md`.
- Learners can rewrite a text and compare it with the first version, and report wrong corrections. `/admin` shows tokens, the queue, failures, and flags.
- **Not done yet:** the 40-essay calibration with a teacher (levels are uncalibrated estimates until then), while the diagnostic writing sample is implemented and authenticated provider checks pass on both environments.

## Phase 3 (AI speaking feedback)

- Learners record a spoken answer in the browser; the server transcribes it with Groq Whisper during the upload and never stores the audio. Only the transcript, pace and pause measures, and feedback are kept.
- Feedback uses `qwen/qwen3.8-27b` on its own token budget, with the same verification as writing (quotes must be in the transcript, small edits only) plus loose matching and no spelling or punctuation fixes. The page shows the transcript, pace, pauses, and "Pronunciation is not assessed."
- Caps: 1 recording per learner and 55 per day in total, and 25,000 seconds of audio a day. The allowance is checked before recording and again before transcription. A failed review can be retried from the kept transcript.
- TEF section B objections come at 1:00, 2:30 and 4:00, with generated audio. Every speaking practice task has a model answer to read and hear. Levels are uncalibrated until a teacher grades a sample.

## Phase 4 (content and audio)

Status verified **October 30, 2026 (UTC)**. **Phase 4 remains open.** Earlier production migrations and the 45-question approved merge are done; the current local lesson targets are met. Practice expansion, release of the two new content migrations and independent calibration remain.

- **Local catalog:** 301 questions/tasks, 32 unique lessons, 26 diagnostic questions and two mocks. All 258 drafts are merged, including the owner's 45 latest TEF reading decisions; earlier review history is preserved.
- **Lessons:** 18 shared plus seven exam-specific lessons give 25 available lessons per exam. All 32 have three checkpoints (96 total). Eight new bilingual shared lessons and 48 added checkpoints complete the lesson targets.
- **Quality/audio:** zero document-length or answer-length exceptions, 124 ready clips and zero pending. Both private hosted buckets have 79/79 required filenames. This reading/lesson release needs no audio regeneration.
- **Hosted databases:** staging `czbynijgpkflnntgoqgj` and production `uhbuvskmiojqjegpuuln` both have the previous 24 migrations. The new `20261030000100` and `20261030000200` content migrations remain owner-run pushes, before matching source deployment.
- **Applications/worker:** sandbox serves `2779986`; production serves main `0ae406c`. The sandbox's missing Vault worker entries were configured using its existing Vercel secret. Authenticated writing/provider and private-audio checks passed on both environments, with a full TEF mock completed on staging. Exact coverage is recorded in the audit.
- **Writing sample:** required 80–120 words, idempotent guest-to-account claim, explicit consent/provider request, four separate provisional criteria, unchanged quiz scoring, shared limits and queued consent recheck. It is not an extra practice task.
- **Remaining practice targets:** three TEF and 50 TCF reading questions; 50 listening questions per exam; six TEF/four TCF writing and six TEF/four TCF speaking tasks. Total: 153 MCQs and 20 productive tasks. No drafts currently await review.
- **Calibration:** the owner has no completed results. The blank 40-essay packet/checker is ready, but independent teacher writing ratings and separate speaking evaluation remain. Authenticated synthetic provider tests establish functionality, not score accuracy.
- **Completion check:** `npm run check:phase4` deliberately reports the remaining practice gaps. It does not establish deployment, email delivery or calibration.

Exact actions and release commands: [Phase 4 checklist](PHASE4_COMPLETION.md). Current evidence: [October 30 audit](PHASE4_AUDIT_2026-10-30.md). The [October 29 audit](PHASE4_AUDIT_2026-10-29.md) remains a historical record.
