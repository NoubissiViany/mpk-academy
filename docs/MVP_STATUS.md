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
| Storage, Realtime, Edge Functions  | Not used                                                  | Deferred   |

Answer keys, explanations, and model responses stay on the server: lessons, practice, and the diagnostic receive redacted content and are checked by server actions. `npm run check:bundle` verifies the browser bundle after each build.

## Phase 1 (learning loop) — what is live and what is waiting

- **Readiness** is the average of the reading and listening practice scores (a rolling average that moves after every session), compared with an MPK accuracy goal per target: NCLC 5 → 60%, NCLC 7 → 70%, NCLC 9+ → 85%. Bands are "at", "near" (within 10 points), or "below", with an evidence label. These are planning aids, not NCLC conversions, and every screen says so.
- **Today** combines due reviews, one practice session on the weakest skill, and one recommended lesson (about 20–30 minutes). Steps count as done from today's activity in the learner's time zone.
- **Study plan** turns the exam date from Settings into practice sessions per week (3–5 by target, plus up to 2 when far behind close to the exam) and compares them with this week.
- **Waiting on content:** diagnostic v3 is drafted (26 questions, pending review, see Phase 4). Lessons still have one checkpoint each (the code supports 3–5 through `extraCheckpoints`). With 10 reading and 10 listening items per exam, a learner sees every item within a few sessions; selection then repeats the items seen longest ago.

## Phase 2 (AI writing feedback)

- A writing-practice text can be sent for AI feedback after the learner agrees (separate consent, recorded with the notice version). Groq reviews it; the server drops quotes that are not in the text, corrections that rewrite too much, and rewrites of text the learner did not write.
- Caps are enforced in the database: 60 essays a day in total and 2 per learner (failed reviews do not count). Essays past the cap are reviewed the next morning. Setup, monitoring, and calibration: `docs/AI_OPERATIONS.md`.
- Learners can rewrite a text and compare it with the first version, and report wrong corrections. `/admin` shows tokens, the queue, failures, and flags.
- **Not done yet:** the 40-essay calibration with a teacher (levels are uncalibrated estimates until then), and the diagnostic writing sample (model C), which waits for diagnostic v3.

## Phase 3 (AI speaking feedback)

- Learners record a spoken answer in the browser; the server transcribes it with Groq Whisper during the upload and never stores the audio. Only the transcript, pace and pause measures, and feedback are kept.
- Feedback uses `qwen/qwen3.8-27b` on its own token budget, with the same verification as writing (quotes must be in the transcript, small edits only) plus loose matching and no spelling or punctuation fixes. The page shows the transcript, pace, pauses, and "Pronunciation is not assessed."
- Caps: 1 recording per learner and 55 per day in total, and 25,000 seconds of audio a day. The allowance is checked before recording and again before transcription. A failed review can be retried from the kept transcript.
- TEF section B objections now come at 1:00, 2:30 and 4:00, and every speaking task has a model answer to read and, once its clip is made, to hear (Phase 4). Levels are uncalibrated until a teacher grades a sample.

## Phase 4 (content and audio)

- **Content reaches the database through migrations.** `npm run content:sql` compares the content with `supabase/content-lock.json` and writes a migration upserting only what changed; CI fails if the two disagree. The diagnostic's size now follows the content (it was fixed at 20).
- **Item-writing rules** in `validate:content`: document length per level, no longest-option cue, balanced answer positions, no near-duplicates, mock clips that leave time to answer, French teaching text everywhere. Existing problems are listed in `src/content/debt.json`, which can only shrink: it starts at 201 short documents (every document was at most 40 words, even at C1) and four mock sections where the longest option was too often right.
- **French text** for all 218 explanations, 24 lesson bodies (with French prompts where checkpoints were English) and task guidance. The mistakes notebook shows explanations in the learner's language.
- **Audio pipeline:**
  - `npm run content:audio` makes clips with Azure Speech F0 (MP3 32 kbps mono, Canadian and France French voices).
  - Practice clips are served from `public/audio`.
  - Mock clips go to a private `mock-audio` bucket (`npm run content:upload-mock-audio`), and the mock signs a link before spending the single play.
  - 120 clips are defined (about 26,000 characters, 5% of a month's free quota); none are generated yet.
- **Drafting pipeline:**
  - `npm run content:draft` uses Gemini's free tier.
  - `npm run content:review` produces a printable sheet, plus the teacher's share of the drafts.
  - `npm run content:accept` merges drafts, but only after the teacher has approved every mock and diagnostic question and one in five of the others.
- **Drafts waiting for review (211):**
  - diagnostic v3: 26 questions (10 rewrites, 6 new, plus the 10 existing grammar and vocabulary questions);
  - full-length rewrites of all 158 mock questions;
  - rewrites of the 37 short practice questions.

  Accepting them all empties the debt list.

- **Also live:** the monthly public page `/themes/fr` and `/themes/en` (October 2026), a sitemap, a listening question in the landing sample, spoken model answers, and TEF section B objections (above).
- **Not done yet:**
  - Volume toward the cohort targets: 60 reading and 60 listening practice questions per exam (10 each today), 25 lessons per exam with 3–5 checkpoints (17 today), and 10 writing and 10 speaking prompts per exam (4–6 today). The drafting pipeline produces practice questions; lessons and prompts are still written by hand.
  - The diagnostic writing sample (model C).
  - Generating the audio (needs the Azure key).
  - The teacher's review.

  Full process: `docs/CONTENT_PIPELINE.md`.
