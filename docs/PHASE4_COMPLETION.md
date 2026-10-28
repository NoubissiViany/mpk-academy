# Phase 4 completion checklist

Verified October 28, 2026. **Phase 4 is not complete.** The reviewed-content merge, audio generation and required diagnostic writing feature are prepared locally. Content expansion and release verification remain. AI calibration is a separate outstanding accuracy dependency from Phases 2–3.

## What is now done

- [x] All **213 drafts merged**, including the 183 owner-authorized AI editorial approvals. The earlier 30 and every review note/decision were preserved.
- [x] **256 catalog items, 24 unique lessons, 26 diagnostic questions**, and 12 TEF reading practice questions.
- [x] Zero short-document exceptions and zero answer-length-bias exceptions.
- [x] **124 generated clips: 45 public and 79 private**, with zero pending. The latest batch changed 91 recordings (87 replacements and four additions). Local files and fixed-rate MP3 durations were checked; mock sections retain adequate answer time.
- [x] Source scoring data agrees with `20261028000200_content_sync.sql` and the content lock. Historical migrations are preserved.
- [x] The owner-confirmed staging bucket contains **79/79 new mock filenames** after the authorized upload. All downloaded files match local SHA-256 hashes, and the bucket is private. Old objects were preserved.
- [x] The required **80–120-word writing sample** is implemented after the quiz, with EN/FR instructions, a live word count and no automatic timeout (ten minutes suggested).
- [x] Samples save with the assessment and transfer from guest storage after sign-in. Current AI consent and an explicit request are required before provider review. The provisional writing result is separate from quiz scores and readiness.
- [x] Diagnostic feedback shares the existing per-user/global writing limits, supports idempotent requests and failed-review retries, and rechecks consent before provider transmission. Paid practice entitlements are unchanged.

The historical [editorial review](CONTENT_REVIEW.md) remains the record of individual content decisions. These checkmarks describe local implementation and the specific staging storage check, not a production launch.

## 1. Release the prepared batch

The owner runs hosted database pushes. The CLI is linked to **staging**, project `czbynijgpkflnntgoqgj`. Do not use that link for production by accident.

Staging's earlier migrations `20261024000100` and `20261028000100` are applied. The new release contains:

| Migration                               | Purpose                                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| `20261028000200_content_sync.sql`       | The 183 merged drafts and their ready audio references               |
| `20261028000300_diagnostic_writing.sql` | Required sample validation and owner-scoped diagnostic feedback RPCs |

On staging, after reviewing the final branch:

```bash
npm run content:upload-mock-audio -- --check
npx supabase db push --dry-run
# Owner runs this after reviewing the target and pending migrations:
npx supabase db push
```

Then deploy the matching application revision to staging. Verify:

- [ ] Complete the 26-question diagnostic as a guest. Confirm the finish button requires 80–120 words, the sample survives back navigation, and the quiz result remains separate.
- [ ] Register/sign in and confirm the sample transfers and the writing result opens. Existing historical guest assessments must still transfer.
- [ ] Give AI consent and request feedback. Confirm actual Groq processing and the four provisional criteria. Test a daily-cap/deferred state and a failed-review retry. Consent withdrawal must prevent a queued diagnostic sample from reaching the provider.
- [ ] With an entitled tester, complete listening practice and a mock. Check private playback, single-play authorization, answer saving, scoring and results.
- [ ] Verify EN/FR UI, desktop/mobile behavior and no sensitive errors in `/admin`.

**Production is not configured**, as confirmed by the owner on October 28. Bootstrap it before repeating the release checks:

1. Create or explicitly designate a production Supabase project. The paused, unused project mentioned in [Supabase operations](SUPABASE_OPERATIONS.md) is not a verified production target.
2. Put that project's URL and service-role key in the ignored `.env.production.local` file. Configure the deployment's public URL, Supabase URL/publishable key, server-only service-role key, `GROQ_API_KEY`, `JOBS_SECRET`, admin and contact settings from `.env.example`. Keep beta mode enabled for the closed beta. Azure/Gemini content-tool keys stay local.
3. In production's Storage dashboard, create a **private** `mock-audio` bucket allowing `audio/mpeg`, with a 2 MiB file limit and no public access policy. The historical bucket migration is idempotent. Creating this bucket first allows audio to be present before the later migrations mark clips ready.
4. Upload and verify production's own 79 files:

```bash
npm run content:upload-mock-audio -- --check --env .env.production.local
# If the check reports missing files:
npm run content:upload-mock-audio -- --env .env.production.local
npm run content:upload-mock-audio -- --check --env .env.production.local
```

5. Link the CLI to the confirmed production reference with `npx supabase link --project-ref <production-project-ref>`, check the reference in `supabase/.temp/project-ref`, then review `npx supabase db push --dry-run` before running the owner-managed push. A fresh production database needs **all historical migrations**, not just staging's two pending migrations.
6. Configure production Auth URLs, confirmation/recovery templates and SMTP using [Supabase operations](SUPABASE_OPERATIONS.md). Set production's worker URL and secret in Vault using [AI operations](AI_OPERATIONS.md), and verify the scheduled job. Deploy the matching app and run the same hosted acceptance checks, including external-inbox signup and password recovery.

The upload command's `--env` argument **does not change the Supabase CLI link**. Keep credentials outside version control. Apply migrations before deploying matching source. If merging a PR to `main` automatically deploys production, complete production's database step first. Keep old private objects while older app deployments may reference them.

**Done when:** both deployments use matching content/audio/SQL, all hosted scenarios above pass, and the release revision is committed and deployed. Local tests cannot establish hosted user-session or provider behavior.

## 2. Finish the remaining cohort-one content

These are current practice counts. Diagnostic and mock questions do not fill practice targets. The required diagnostic writing sample is also separate from the writing-practice task count.

| Content             | TEF now | Target | TEF remaining | TCF now | Target | TCF remaining |
| ------------------- | ------: | -----: | ------------: | ------: | -----: | ------------: |
| Reading questions   |      12 |     60 |            48 |      10 |     60 |            50 |
| Listening questions |      10 |     60 |            50 |      10 |     60 |            50 |
| Writing tasks       |       4 |     10 |             6 |       6 |     10 |             4 |
| Speaking tasks      |       4 |     10 |             6 |       6 |     10 |             4 |
| Available lessons   |      17 |     25 |             8 |      17 |     25 |             8 |

This is **198 additional reading/listening questions and 20 productive tasks**. Shared lessons can count toward both exam gaps, so eight suitable shared lessons could fill both; the two lesson gaps are not necessarily 16 distinct lessons.

Every existing lesson currently has one checkpoint. Add at least **48 checkpoints across the 24 existing lessons** to reach three each. New lessons also need 3–5 checkpoints. Maintain original documents, distinct distractors, appropriate competency/level coverage, bilingual teaching text and listening audio.

A balanced authoring split would bring each practice skill to 15 questions at each of A2/B1/B2/C1. This is a suggested distribution, not a new exam-scoring rule:

| Batch         | A2 to add | B1 to add | B2 to add | C1 to add |
| ------------- | --------: | --------: | --------: | --------: |
| TEF reading   |        13 |        10 |        12 |        13 |
| TEF listening |        13 |        12 |        12 |        13 |
| TCF reading   |        13 |        12 |        12 |        13 |
| TCF listening |        13 |        12 |        12 |        13 |

Use the existing pipeline in reviewable batches, varying topics and competencies. For example:

```bash
npm run content:draft -- new --exam TEF --skill reading --level A2 --count 13
npm run content:draft -- new --exam TEF --skill reading --level B1 --count 10
npm run content:draft -- new --exam TCF --skill listening --level B2 --count 12
npm run content:review
npm run content:review -- --print --teacher
```

Complete the other rows/levels using the table. The drafting CLI handles reading/listening questions; writing/speaking tasks and lessons/checkpoints are authored in their typed content files. New batches need their normal editorial and sampled teacher review. The owner's AI approval exception applied to the previous 183 drafts only; it is not blanket approval for new material.

After each approved batch:

```bash
npm run content:accept
npm run content:audio -- --dry-run
npm run content:audio
npm run content:sql
npm run validate:content
```

Then release matching audio, SQL and application source using the sequence above.

**Done when:** `npm run check:phase4` reports all local content targets met, and the content is deployed and usable. This command intentionally exits nonzero while targets are short, even though `validate:content` passes. A green result is a local content check, not proof of deployment or calibrated scoring.

## 3. Validation before release

Local verification on October 28 passed content/SQL synchronization, formatting, lint, type checking, **357 unit tests across 58 files**, the production build, and the subsequent client-bundle check (**704 protected strings across 87 files**). All **24 migrations**, **seven database assertion suites** and **six diagnostic parity scenarios** passed on disposable PostgreSQL 17.11. A final staging dry run listed exactly `20261028000200_content_sync.sql` and `20261028000300_diagnostic_writing.sql`; neither was pushed.

The isolated desktop/mobile browser suites passed **14 beta-mode checks and 16 paid-mode checks**. Each run skipped only the other mode's scenarios. They covered the required writing sample and guest handoff, EN/FR UI, access boundaries, paid-plan navigation, and byte-for-byte delivery of all 45 public audio files. They did not exercise hosted sign-in, a real AI provider, or entitled private-mock playback; those remain in the hosted acceptance checklist.

```bash
npm run validate:content
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run check:bundle
npm run test:e2e
NEXT_PUBLIC_BETA_MODE=false npm run test:e2e
```

Run build and bundle checks sequentially. Browser tests use isolated local configuration without hosted credentials and webpack, matching the production bundler; Turbopack's cold startup exceeded the local smoke-server timeout. Apply all migrations and database assertions to **disposable PostgreSQL 17**, then run the six diagnostic parity scenarios; never run `scripts/db/test-migrations.sh` against a hosted project.

The new SQL assertions cover missing/short/long samples, prompt version, historical guest compatibility, quiz-score preservation, ownership, current consent, idempotency, retries and daily budgets. Local AI tests use synthetic text and mocked responses; the hosted checklist still requires a real consented feedback round trip.

## 4. Finish the separate calibration dependency

- [ ] Obtain consent for 40 learner essays across both exams and target levels.
- [ ] Have a qualified teacher independently grade task fulfilment, coherence, vocabulary and grammar without seeing AI ratings.
- [ ] Calculate agreement per criterion: the existing target is at least 60% exact and 90% within one level. Record aggregate results and adjustments in `docs/calibration/`, without identifiable learner work.
- [ ] Arrange a separate teacher-rated speaking sample and define its size/acceptance criteria. Transcript feedback does not assess pronunciation.
- [ ] Re-evaluate systematic disagreements and retain provisional labels until evidence supports stronger claims. A brief diagnostic sample is not a calibrated official exam score.

See [AI operations](AI_OPERATIONS.md#calibration-before-trusting-the-levels).

## What the owner needs to do

1. Review and run the two pending staging migrations, deploy the matching branch, and perform the hosted checks.
2. Configure production using the bootstrap sequence above; upload/check its private audio, push all reviewed migrations, deploy and verify.
3. Complete the remaining 198 questions, 20 tasks, lesson gaps and checkpoints through the authoring/review pipeline; arrange the required review of new batches.
4. Arrange consented calibration samples and independent teacher ratings.

The content merge and writing-sample implementation are no longer the open development tasks. Phase 4 remains open because its content-volume and hosted-release milestones are unfinished.
