# Content pipeline: drafting, review, audio and release

All questions, lessons and tasks live in `src/content` as typed source. The database holds a copy of what scoring needs (answer keys, audio status, lesson list, mock manifests), loaded by migrations. This document covers how new content is drafted, reviewed, given audio, and released.

Nothing a language model drafts reaches learners until a person accepts it. Gemini only ever sees content prompts, never learner data.

## One-time setup

Put these in `.env.local` on the machine that makes content. They are for the scripts only: **never add them to Vercel.**

**Azure AI Speech (listening audio, free F0 tier)**

1. In the Azure portal, create a resource of type **Speech** (Azure AI services). A card is required to sign up; F0 itself charges nothing.
2. Choose pricing tier **Free F0** and a region that offers the French voices, for example `canadacentral` or `eastus`.
3. From **Keys and Endpoint**, copy a key and the region:
   ```
   AZURE_SPEECH_KEY=…
   AZURE_SPEECH_REGION=canadacentral
   ```

F0 includes 500,000 characters of neural speech a month. The current manifest contains 120 clips, including spoken model answers and objections. Use the audio dry run to see the characters needed for new or changed clips.

**Gemini (drafting, free tier)**

1. At aistudio.google.com, choose **Get API key** (you must be 18 or over).
2. Add it as `GEMINI_API_KEY=…`. The default model is `gemini-3.8-flash`; set `GEMINI_MODEL` to change it.

On the free tier Google may use what is sent to improve its products. That is acceptable for content drafts only, which is the only thing the drafting script sends.

## The rules every question must pass

`npm run validate:content` (also run in CI) checks the following:

| Rule                      | Detail                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document length per level | Reading at least 30 / 60 / 100 / 140 words at A2 / B1 / B2 / C1. Listening at least 20 / 35 / 55 / 75.                                                               |
| No answer-length cue      | In each mock section, practice skill and the diagnostic, the correct option may be the longest one no more often than chance plus one standard deviation (13 of 40). |
| Balanced answer positions | Each of a–d holds about a quarter of a pool of 20 or more.                                                                                                           |
| No near-duplicates        | No two questions (document and question) or tasks share half their wording.                                                                                          |
| Mock clips fit their time | A clip leaves at least 10 seconds to answer within its share of the listening section.                                                                               |
| French teaching text      | Every explanation, lesson body, checkpoint and task guidance has a French version.                                                                                   |

**Content debt.** When the rules were introduced, 201 of the 208 reading and listening documents were shorter than these minimums. All documents, mock exams included, were at most 40 words, even at C1. In addition, four mock sections favoured the longest option, in 15 to 19 of their 39–40 questions. These cases are recorded in `src/content/debt.json`. New content must pass, and the list can only shrink: when an item is fixed, validation asks for it to be removed. `npm run content:accept` removes it for you.

## Drafting

```bash
# New practice questions (5 per request to the model)
npm run content:draft -- new --exam TEF --skill reading --level B2 --count 10
npm run content:draft -- new --exam TCF --skill listening --level B1 --count 10 --topic "logement"

# Rewrite published questions that are in the debt list: same id, longer document, fixed options
npm run content:draft -- rewrite --prefix tef-mock-reading-b2 --count 10
```

Drafts are written to `content/drafts/<date>-<label>.json`, with the problems the automatic checks found on each one: length, longest option, voices, near-duplicates, an untranslated explanation. `--provider groq` uses `openai/gpt-oss-20b` on the app's Groq account instead. The app does not use that model, but its French is weaker; it is for testing the pipeline.

**Priorities:**

1. Merge the approved mock, diagnostic and practice drafts, then regenerate audio from the approved text. The current recordings exist; rewriting a transcript makes its clip pending again.
2. Complete diagnostic v3 and its deferred writing sample.
3. Then add new practice items toward the targets that `validate:content` prints.

## Review

Every draft goes through two checks before it reaches learners:

- **Your review**, for every draft. You read it and accept it, fix it, or reject it.
- **The teacher's review**, for every accepted mock-exam and diagnostic question, and a fixed one in five of the other accepted drafts. A qualified French teacher confirms the French, that exactly one answer is defensible, the level, and the explanations.

**Recorded batch exception, October 27, 2026:** the owner explicitly authorized Codex to proofread and approve the 183 remaining accepted drafts through the existing teacher-review gate. All 183 now have `teacher: "approved"` and remain `review: "accepted"`; 44 were corrected. Their notes identify an AI editorial review authorized by the owner, not a human teacher decision. This exception applies to this batch only. [The review report](CONTENT_REVIEW.md) records every decision and [the Phase 4 checklist](PHASE4_COMPLETION.md) describes the remaining work.

Both happen on a review page that runs on your computer:

1. Run `npm run content:review`, then open http://localhost:4400. Stop it with Ctrl+C.
2. **Your review** tab: read each question. A rewrite is shown next to the version learners see today.
   - **Accept** marks it good.
   - **Reject** drops it; the published question stays as it is.
   - **Edit text** corrects the wording, re-runs the automatic checks, and shows any remaining problem in red.
   - **Undo** reverses a decision. The note field is optional.
3. **Send the teacher their share.** `npm run content:review -- --print --teacher` writes `content/drafts/teacher-review.html`, a printable sheet with tick boxes. Send it to the teacher (or save it as a PDF). It only contains drafts you have accepted.
4. **Teacher** tab: record what the teacher decided with **Teacher approved** or **Teacher rejected**. Fix the text first with **Edit text** if they asked for a change.
5. `npm run content:accept` merges what is ready:
   - Accepted drafts that need no teacher check.
   - Drafts the teacher approved.

   A rewrite replaces its question in place; a new question is added to its exam's practice file. The step also records listening voices, shrinks the debt list, runs validation, and changes nothing if validation fails.

For many decisions at once, `npm run content:mark` does the same from the terminal. A target is a draft file, an id, or the start of ids:

```bash
npm run content:mark -- accepted 2026-10-22-rewrite-tef-mock-reading
npm run content:mark -- accepted tef-mock-listening --except tef-mock-listening-b2-004,tef-mock-listening-c1-002
npm run content:mark -- teacher-approved tef-mock tcf-mock diagnostic
```

Commit the draft files along with the content: they record what was reviewed and by whom.

## Audio

```bash
npm run content:audio -- --dry-run   # which clips would be made, and the characters used
npm run content:audio                # make new or changed clips
```

How the clips are made:

- **Format and pacing:** MP3 at 32 kbps mono, one request at a time. A2 and B1 are read slightly slower.
- **Voices:** they alternate between Canadian French (Sylvie, Jean, Antoine, Thierry) and France French, with two distinct voices in a dialogue.
- **Gender:** a speaker's gender is chosen at random unless `src/content/audio-speakers.json` fixes it. Fix it whenever the text depends on it, for example _la chroniqueuse_ or "she says". Drafts carry the speakers' genders, and accepting a draft records them.
- **Ready status:** `src/content/audio-manifest.json` records each clip against a fingerprint of its transcript. A question is "ready" only while its transcript is unchanged. Editing the transcript sends it back to pending until the clip is remade.
- **Retries and cleanup:** a completed clip is saved immediately, so rerunning after a failure makes only unfinished clips. A full run also removes obsolete generated MP3s, even if nothing needs synthesizing; legacy directories and unrelated files are preserved. `--dry-run` never cleans up files.

Where the files go:

- **Practice, diagnostic and landing-sample clips** go to `public/audio/<hash>.mp3`. Vercel serves them, cached for good, since the name changes when the content does. Commit them.
- **Mock clips** go to `.audio-cache/`, which is not committed. Upload them to the private `mock-audio` bucket of each project:
  ```bash
  npm run content:upload-mock-audio                                   # project in .env.local (staging)
  npm run content:upload-mock-audio -- --env .env.production.local
  ```
  The second file holds the production `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Delete it afterwards if you do not keep it.

During a mock exam, learners get a link signed for the clip's length plus two minutes. The link is created before the single play is spent, so a storage error does not use up their listen.

To check a bucket without uploading anything, add `--check`:

```bash
npm run content:upload-mock-audio -- --check
npm run content:upload-mock-audio -- --check --env .env.production.local
```

The check fails if any manifest file is missing. Production needs its own environment file; the staging result does not establish production readiness.

## Releasing content to the database

`npm run content:sql` compares the content with `supabase/content-lock.json`. It then writes `supabase/migrations/<timestamp>_content_sync.sql`, which upserts only the changed rows, such as new questions, new answer keys, `audio_status` changed to ready, or real clip durations. CI fails if content changed without that migration.

Release in this order:

1. Merge drafts (`content:accept`), then make the audio (`content:audio`).
2. Run `npm run content:sql`, then commit the content, audio files, manifest, lock and migration together on the release branch.
3. Check the target environment's private mock clips with `content:upload-mock-audio -- --check`; upload missing files to that environment before continuing.
4. With the target project verified, the owner reviews and pushes the migrations:
   - `npx supabase db push --dry-run`
   - `npx supabase db push`
5. Deploy the matching application source. Complete staging verification first, then repeat the bucket check, migration review/push and app deployment for production. If merging to `main` triggers production deployment, apply the production migration before that merge.

Step 3 must come before step 4. Otherwise a project's mock exam opens with clips that are missing from its bucket. A new question must not be served before its scoring row has reached that project's database.

### Eligible-content release handoff

The current branch has merged 30 of the 213 first-pass accepted drafts: 29 practice rewrites and one new TEF reading question. The other 183 have now passed the owner-authorized AI editorial review described above and are approved but unmerged. The earlier 30 were preserved. The pending teacher-review packet, generated with `npm run content:review -- --print --teacher` at `content/drafts/teacher-review.html`, is now empty; the [individual review report](CONTENT_REVIEW.md) retains all 183 decisions and correction summaries.

All 13 changed practice recordings were regenerated. The manifest still contains 120 clips (41 public, 79 private), with zero pending listening items. Content debt is now 172 short documents and four biased mock sections. `20261028000100_content_sync.sql` upserts 30 question rows without retiring any; the diagnostic stays at 20 questions.

Those counts describe the currently merged source. An in-memory merge of the 183 approved drafts validates with 256 items, 26 diagnostic questions and no recorded content debt, but would make 91 listening items pending (79 private and 12 public). That later batch needs new audio and a new additive migration before release. No catalog merge, audio generation or migration was performed during the editorial review. The current approval state means the next `content:accept` run will include these 183 drafts.

The owner runs hosted database pushes. Before releasing to either environment:

1. Confirm the selected Supabase project matches the app deployment and the audio check's project. The existing CLI link is staging; do not use it for production by accident.
2. Run the corresponding read-only bucket check above. If clips are missing, run the upload command for that same environment and check again. This is required before the earlier `20261024000100_content_sync.sql` migration, which opens both mocks by marking their audio ready.
3. Against the verified CLI link, run `npx supabase db push --dry-run`. Review every pending migration, including both content-sync migrations if the first audio release has not been applied.
4. Run `npx supabase db push` yourself, then deploy the matching application source. Repeat with the production project selected and its bucket verified. No hosted push or application deployment is part of the local content preparation.
5. Smoke-test a listening practice session and a full mock with an entitled tester. Confirm playback, scoring and the single-play restriction before inviting learners.

The production environment file is not present locally. Production storage and migration state must be verified separately; the generated migration and local checks alone are insufficient.

Verified on October 27, 2026: the staging bucket contains **79/79** manifest clips (read-only check, no uploads). The linked staging migration dry run lists **20261024000100** and **20261028000100** as pending. Neither was applied during preparation. Recheck immediately before the owner-run push.

Local validation passed: 338 unit tests; all applicable desktop/mobile browser checks in beta and paid modes; all 22 migrations, six database assertion suites and six diagnostic parity scenarios on disposable PostgreSQL 17.11. Content/SQL synchronization, formatting, lint, type checking, the production build and client-bundle protection also passed. Browser checks verified all 41 public clips were served intact. Draft comparisons confirmed exactly 30 merges and unchanged teacher decisions; historical migrations were preserved.

## Thèmes récurrents

The monthly public page `/themes` is driven by `src/content/themes.ts`. Each month adds one entry with original prompts on the themes that keep coming back. Write your own prompts. Never copy or reconstruct real exam questions, and keep the notice that these are practice prompts.
