# Phase 4 completion checklist

Verified **October 29, 2026**. **Phase 4 is not complete.** Staging now runs the reviewed content and required diagnostic writing sample. Production is configured but remains six migrations behind; content-volume targets and hosted authenticated acceptance tests remain unfinished. Writing and speaking calibration are separate outstanding accuracy dependencies from Phases 2–3.

## Verified state

| Area                        | Evidence                                                                                                                      | Remaining                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Previously reviewed content | All 213 drafts merged; 183 owner-authorized AI approvals and earlier decisions preserved                                      | No repeat approval needed for this batch                                                       |
| Published source            | 256 questions/tasks, 24 unique lessons, 26 diagnostic questions, two mocks                                                    | Cohort-one expansion below                                                                     |
| Content quality/audio       | Zero short-document or answer-length exceptions; 124 ready clips, 45 public and 79 private                                    | New listening content will need its own audio                                                  |
| Staging database            | `czbynijgpkflnntgoqgj`; all 24 migrations applied, dry run reports up to date                                                 | Authenticated/provider acceptance tests                                                        |
| Staging application         | [Sandbox](https://mpk-academy-sandbox.vercel.app), release `2779986f24fc62e0c6e6b9c579c1f8df08ad0703`; October 29 build ready | AI environment/worker setup below                                                              |
| Production database         | `uhbuvskmiojqjegpuuln`; reachable and active, six pending migrations                                                          | Owner-run push before matching app deploy                                                      |
| Production application      | Main Vercel project still serves revision `081b7f6abf26d0f5e4fa8a9a7c8944bf4f004684`                                          | Deploy reviewed release after database update                                                  |
| Private mock storage        | Both buckets private, 2 MiB limit, `audio/mpeg`; 79/79 required names in each                                                 | Entitled playback verification; production bytes not independently hash-compared in this audit |
| New expansion drafts        | 45 TEF reading drafts individually edited; zero mechanical flags; all pending                                                 | Owner acceptance and nine sampled teacher reviews, then merge                                  |
| Calibration                 | Blank 40-essay packet and agreement checker prepared                                                                          | Real consented samples and independent ratings                                                 |

The staging upload was completed previously; its 79 downloaded clips matched local SHA-256 hashes. No audio upload or hosted database write was performed in this audit. The main production application was not redeployed. The CLI link remains staging. The current remote content branch was still at `c57d94f3fbff361692693ab8e3bdf559d5adfc6c` during the audit; local commits need pushing.

Staging deployment ID: `dpl_7dPFJU7LyZiAyGvcVh4SoLqWiWTP`. It was built from an immutable archive of `2779986`, with no local environment files. The hosted guest browser check passed 26 quiz questions, the mandatory 80–120-word sample, preservation through back navigation, a separate provisional writing panel and the sign-in link, with zero client errors. This was a guest-only synthetic run; it did not submit an assessment to a hosted account or send text to an AI provider.

The writing feature is already implemented. Its sample transfers after sign-in, requires current consent and an explicit feedback request, and shares writing queue limits. Its provisional criteria do not alter quiz scores or readiness. Historical assessments remain supported. See [AI operations](AI_OPERATIONS.md).

## 1. Finish staging acceptance

Do not repeat the completed database push or mock-audio upload unless a fresh check finds a difference.

1. In Vercel, select **`mpk-academy-sandbox`**, not the main project. Add a staging `GROQ_API_KEY` and `JOBS_SECRET` to its **Production environment**: the sandbox's stable URL uses that Vercel target. Both were absent on October 29. Verify Groq Zero Data Retention and model limits as described in [AI operations](AI_OPERATIONS.md#one-time-setup-per-environment).
2. In the **staging** Supabase SQL editor, create the two absent Vault entries. Use the same job secret as the sandbox Vercel project; keep the actual value out of Git and chat:

   ```sql
   select vault.create_secret('https://mpk-academy-sandbox.vercel.app/api/jobs/run', 'mpk_jobs_url');
   select vault.create_secret('<same staging JOBS_SECRET>', 'mpk_jobs_secret');
   ```

3. Redeploy the sandbox after saving its variables. Check the scheduled worker with the read-only queries in [AI operations](AI_OPERATIONS.md). No Vault entries were created by this audit.
4. With an account you control, complete these hosted checks:
   - Complete the guest diagnostic, sign in, and confirm the writing sample transfers exactly once and opens on the results page.
   - Give AI consent and request feedback. Confirm a real Groq response and all four separate provisional writing criteria. Check a failed-review retry, a deferred/capped state, and that consent withdrawal prevents queued diagnostic transmission.
   - Use an entitled test account for listening practice and a complete mock: private playback, single-play authorization, saved answers, scoring and results.
   - Check EN/FR and desktop/mobile behavior, plus recent errors in `/admin`.
   - Confirm signup and password recovery through an external inbox, with the correct callback and language. This audit sent no authentication emails.

**Done when:** these authenticated/provider scenarios pass on the deployed sandbox, with evidence recorded. Presence of credentials and passing guest tests do not establish them.

## 2. Release the existing batch to production

Production is now configured. Its Vercel public URL and Supabase credentials point to `uhbuvskmiojqjegpuuln`; `GROQ_API_KEY` and `JOBS_SECRET` are present. Production Vault contains `mpk_jobs_url` pointing to `https://mpk-academy.vercel.app/api/jobs/run` and a nonempty `mpk_jobs_secret`. Their secret values were not compared, and an actual worker/provider round trip remains unverified. Do not create a replacement production project or duplicate these existing Vault entries.

Production already has all 79 required private mock filenames. Recheck before applying migrations that open audio access:

```bash
npm run content:upload-mock-audio -- --check --env .env.production.local
npx supabase link --project-ref uhbuvskmiojqjegpuuln
cat supabase/.temp/project-ref
npx supabase db push --dry-run
```

The October 29 production dry run listed exactly:

1. `20261022000200_mock_audio_bucket.sql`
2. `20261022000300_diagnostic_size.sql`
3. `20261024000100_content_sync.sql`
4. `20261028000100_content_sync.sql`
5. `20261028000200_content_sync.sql`
6. `20261028000300_diagnostic_writing.sql`

After reviewing that target and list, **the owner runs**:

```bash
npx supabase db push
npx supabase db push --dry-run
# Restore the usual staging link afterwards:
npx supabase link --project-ref czbynijgpkflnntgoqgj
```

Then push the reviewed local branch, open/complete its PR, and merge/deploy the matching source to the **main** Vercel project `mpk-academy`. If a merge to `main` triggers deployment automatically, finish the production database step first. Pending draft files are authoring records and do not enter the published catalog just because their commit is deployed.

```bash
git push -u origin content/review-and-first-audio
```

Repeat the authenticated acceptance checks on production. Verify its Auth Site URL, redirect allow-list, SMTP delivery and scheduled worker using [Supabase operations](SUPABASE_OPERATIONS.md) and [AI operations](AI_OPERATIONS.md). The audit did not establish actual email delivery or equality of the Vercel/Vault job secrets.

The upload script's `--env` option does **not** change the CLI database link. Preserve old private objects while older deployments may use them. Keep credentials outside version control.

## 3. Finish the remaining cohort-one content

Published counts are unchanged by this audit. Diagnostic/mock questions and the diagnostic writing sample do not count toward practice-bank targets.

| Content             | TEF now | Target | TEF gap | TCF now | Target | TCF gap |
| ------------------- | ------: | -----: | ------: | ------: | -----: | ------: |
| Reading questions   |      12 |     60 |      48 |      10 |     60 |      50 |
| Listening questions |      10 |     60 |      50 |      10 |     60 |      50 |
| Writing tasks       |       4 |     10 |       6 |       6 |     10 |       4 |
| Speaking tasks      |       4 |     10 |       6 |       6 |     10 |       4 |
| Available lessons   |      17 |     25 |       8 |      17 |     25 |       8 |

This is **198 reading/listening questions and 20 productive tasks** still to publish. **45 of those questions are now prepared as pending drafts**, leaving **153 not yet drafted**. The 45 are TEF reading: 13 A2, 10 B1, 12 B2 and 10 C1. After their approved merge, TEF reading would be 57/60; three C1 questions would complete the proposed 15-per-level split.

All 45 passages, questions, options and bilingual explanations were individually reviewed and corrected. Substantive fixes include replacing duplicate documents, removing unsupported municipal/medical/legal claims, correcting contradictions and weak inferences, and rebuilding advanced questions at the required length and level. Notes explicitly identify AI editorial preparation. They remain `review: "pending"`, with no teacher decisions. The previous AI approval exception applied only to the earlier 183 drafts.

An **in-memory simulation only** validates all 45 additions: 301 catalog items, unchanged 24 lessons/two mocks, zero pending audio; the 57-item TEF reading pool's correct positions are a=15, b=17, c=13, d=12 and pass the existing balance rule. This is not an approval or a merge. The current catalog remains 256 items.

Review the saved batch:

```bash
npm run content:review
# Open http://localhost:4400; record each editorial decision.
npm run content:review -- --print
# After acceptance, generate the nine-item teacher sample:
npm run content:review -- --print --teacher
```

`content/drafts/review.html` is the printable 45-draft packet and can be regenerated. The teacher packet includes accepted items only. Keep the teacher gate for the nine sampled IDs and preserve all review notes.

Remaining authoring after these saved drafts:

| Batch         | A2 to draft | B1 to draft | B2 to draft | C1 to draft |
| ------------- | ----------: | ----------: | ----------: | ----------: |
| TEF reading   |           0 |           0 |           0 |           3 |
| TEF listening |          13 |          12 |          12 |          13 |
| TCF reading   |          13 |          12 |          12 |          13 |
| TCF listening |          13 |          12 |          12 |          13 |

The generation run stopped after Gemini availability/network errors and Groq rate limits. Saved partial output is retained; the C1 file records 10/13 generated. Rerun only the remaining counts when capacity is available, for example:

```bash
npm run content:draft -- new --exam TEF --skill reading --level C1 --count 3
npm run content:draft -- new --exam TCF --skill listening --level B2 --count 12
```

The command now saves every successful batch atomically, avoids overwriting same-minute files, records incomplete generation, and retries transient provider failures separately from schema failures. Provider output still needs editorial review; a successful request is not a quality guarantee.

Author writing/speaking tasks and lessons in their typed content files. **Eight suitable shared lessons** can fill both eight-lesson exam gaps. Add **48 checkpoints across the 24 existing lessons** to reach three each; every new lesson also needs 3–5 checkpoints. Maintain bilingual teaching text, level/competency coverage, original documents and distinct answer options.

After each approved batch:

```bash
npm run content:accept
npm run content:audio -- --dry-run
npm run content:audio
npm run content:sql
npm run validate:content
```

Release matching content, audio, SQL and source using the sequence above. The 45 reading additions need no new clips themselves; future listening and speaking additions do.

**Done when:** `npm run check:phase4` reports all local targets met, all drafts resolved and zero pending audio/debt, and the resulting content is deployed and usable. It currently exits nonzero intentionally. `validate:content` passing alone is not Phase 4 completion.

## 4. Validation evidence

The application release `2779986` previously passed **357 unit tests in 58 files**, formatting, lint, types, content/SQL validation, production build and the subsequent client-bundle protection check (**704 protected strings across 87 files**). All **24 migrations**, **seven database assertion suites** and **six diagnostic parity scenarios** passed on disposable PostgreSQL 17.11. Isolated desktop/mobile tests passed **14 beta and 16 paid-mode checks**, including public audio delivery and guest writing handoff; hosted authentication and real provider calls were outside those local tests.

This audit also passed the sandbox deployment's production build and hosted guest browser check. Draft persistence and calibration have eight new tests, including saved partial batches, preservation of existing reviews, exact agreement thresholds and rejection of incomplete calibration. Current verification totals are recorded in [the October 29 audit](PHASE4_AUDIT_2026-10-29.md).

For a future application/content release:

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

Run build and bundle checks sequentially. Run the migration/assertion/parity harness against **disposable PostgreSQL 17 only**, never a hosted project. The current audit changes tooling, pending drafts and documentation; it does not alter runtime learner code or migrations.

## 5. Complete the separate calibration dependency

1. Obtain **at least 40 consented learner essays**, across both exams and all three target bands. Keep identities, texts and consent records outside Git.
2. Have a qualified French teacher independently rate task fulfilment, coherence, vocabulary and grammar before seeing AI ratings.
3. Enter paired results into a private copy of [the blank packet](calibration/writing-ratings.template.json). Record the actual model and prompt/source revision.
4. Run the checker:

   ```bash
   npm run check:calibration -- /private/path/writing-ratings.json
   ```

5. Record aggregate methodology/results in `docs/calibration/`. Each criterion must achieve at least **60% exact and 90% within-one-level agreement**. Investigate disagreements and evaluate changes on held-out ratings.
6. Arrange a separate teacher-rated speaking sample and agree its size and acceptance criteria. Writing agreement does not validate speaking; transcript feedback does not assess pronunciation.

The [calibration guide](calibration/README.md) explains the procedure. The blank template correctly fails with zero complete samples. Synthetic tests and AI editorial draft review are not calibration evidence. Keep provisional labels until actual results justify stronger claims.
