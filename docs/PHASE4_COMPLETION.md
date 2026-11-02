# Phase 4 completion checklist

Verified **October 30, 2026 (UTC)**. **Phase 4 is not complete.** The earlier production migrations and the 45-question review/merge are done. The local lesson targets are now met. The remaining work is practice-bank expansion, release of the two new content migrations with matching source, final hosted acceptance, and independent writing/speaking calibration.

## 1. What is already complete

- **All 258 drafts are merged**, including the original 213 and the owner's latest 45 TEF reading approvals. There are no unresolved drafts. Earlier approval decisions and notes are preserved; the original 183-item AI review exception has not been extended.
- **Local source:** 301 questions/tasks, 32 unique lessons, 26 diagnostic questions and two mocks. Eighteen shared lessons plus seven exam-specific lessons provide **25 lessons per exam**. Every lesson has **three checkpoints** (96 in total).
- **Quality/audio:** zero short-document exceptions, zero answer-length exceptions, 124 ready clips and zero pending. Both hosted private buckets contain all 79 required filenames; no new audio is needed for the current reading/lesson changes.
- **Staging and production databases:** both have the earlier 24 migrations through `20261028000300_diagnostic_writing.sql`. Do not repeat the former six-migration production recovery instructions.
- **Applications:** staging serves the `2779986` application release; production serves main revision `0ae406c`. Both are READY in Vercel. Neither contains this new local lesson/content release yet.
- **Staging worker:** Groq/job variables are configured; the two missing Vault entries were added using the existing sandbox job secret. No hosted migrations were pushed by this audit.
- **Diagnostic writing:** the required 80–120-word sample, sign-in handoff, consent gate and separate provisional result are implemented. Real provider checks passed on **staging and production**, without changing quiz scores. A full hosted TEF mock passed on staging. Detailed evidence is in [the October 30 audit](PHASE4_AUDIT_2026-10-30.md).

## 2. Release the current content changes

The owner continues to run hosted database pushes. The two new additive migrations are:

1. `20261030000100_content_sync.sql`: the owner's 45 approved TEF reading additions.
2. `20261030000200_content_sync.sql`: eight new shared lessons. Checkpoint teaching text stays in server-side source; existing lesson IDs are preserved.

First update staging:

```bash
npm run validate:content
npm run content:upload-mock-audio -- --check
npx supabase link --project-ref czbynijgpkflnntgoqgj
cat supabase/.temp/project-ref
npx supabase db push --dry-run
# Confirm the target and the two filenames above, then:
npx supabase db push
npx supabase db push --dry-run
```

Deploy the matching committed branch to **mpk-academy-sandbox**, using its Vercel project `prj_LCJTgjqd1O6OAyQNKX0ZWVu0klRj`. The repository's current `.vercel` link is the **main** project: do not run `vercel --prod` in this checkout expecting a sandbox deployment. Use an isolated checkout linked to the sandbox, as in the previous release.

After committing and pushing the staging migrations, prepare the source without local secrets or caches:

```bash
mpk_release_dir=$(mktemp -d /tmp/mpk-sandbox-release-XXXXXX)
git archive HEAD | tar -x -C "$mpk_release_dir"
npx vercel@61.1.0 link --yes --project mpk-academy-sandbox \
  --scope team_DNJxaKqntsdBPn5jUJ983DQ8 --cwd "$mpk_release_dir"
npx vercel@61.1.0 deploy --prod --dry-run --cwd "$mpk_release_dir" \
  --scope team_DNJxaKqntsdBPn5jUJ983DQ8
# Inspect the target and file inventory, then deploy that same directory:
npx vercel@61.1.0 deploy --prod --yes --cwd "$mpk_release_dir" \
  --scope team_DNJxaKqntsdBPn5jUJ983DQ8 --meta releaseCommit="$(git rev-parse HEAD)"
```

Verify the new reading inventory and lessons, lesson completion, diagnostic writing and entitled practice/mock access on staging. Then prepare production:

```bash
npm run content:upload-mock-audio -- --check --env .env.production.local
npx supabase link --project-ref uhbuvskmiojqjegpuuln
cat supabase/.temp/project-ref
npx supabase db push --dry-run
# Confirm production and the two pending content migrations, then:
npx supabase db push
npx supabase db push --dry-run
# Restore the normal staging link:
npx supabase link --project-ref czbynijgpkflnntgoqgj
```

Push the committed branch, review/merge its PR, and deploy matching source to the main Vercel project. If merging to `main` triggers deployment automatically, finish the production database step first.

```bash
git push -u origin content/review-and-first-audio
```

The audio script's `--env` argument does not change the CLI database target. Preserve historical migrations and private audio objects while older deployments may use them. No schema, public API or approval-workflow change is needed for this release.

## 3. Finish the remaining practice content

Diagnostic and mock questions, lesson checkpoints and the diagnostic writing sample do not count toward practice targets.

| Content             | TEF now | Target | TEF gap | TCF now | Target | TCF gap |
| ------------------- | ------: | -----: | ------: | ------: | -----: | ------: |
| Reading questions   |      57 |     60 |       3 |      10 |     60 |      50 |
| Listening questions |      10 |     60 |      50 |      10 |     60 |      50 |
| Writing tasks       |       4 |     10 |       6 |       6 |     10 |       4 |
| Speaking tasks      |       4 |     10 |       6 |       6 |     10 |       4 |
| Available lessons   |      25 |     25 |       0 |      25 |     25 |       0 |

This leaves **153 MCQs and 20 productive tasks**. There is no remaining lesson/checkpoint deficit. The remaining proposed MCQ level split is:

| Batch         |  A2 |  B1 |  B2 |  C1 |
| ------------- | --: | --: | --: | --: |
| TEF reading   |   0 |   0 |   0 |   3 |
| TEF listening |  13 |  12 |  12 |  13 |
| TCF reading   |  13 |  12 |  12 |  13 |
| TCF listening |  13 |  12 |  12 |  13 |

Create and individually review the remaining questions through the existing pipeline. For example:

```bash
npm run content:draft -- new --exam TEF --skill reading --level C1 --count 3
npm run content:draft -- new --exam TCF --skill listening --level B2 --count 12
npm run content:review
npm run content:review -- --print --teacher
```

Record editorial decisions and the required teacher sample before acceptance. The former 183-item approval exception does not authorize blanket approval of future drafts. Keep each generated partial batch; provider rate limits or failures do not justify accepting unchecked content.

Author the six TEF/four TCF writing tasks and six TEF/four TCF speaking tasks in their typed practice content files, with original prompts, realistic word/time limits, bilingual guidance, rubrics and model responses. New speaking model responses and TEF objections also need audio.

After each approved batch:

```bash
npm run content:accept
npm run content:audio -- --dry-run
npm run content:audio
npm run content:sql
npm run validate:content
npm run check:phase4
```

Generate only the required new/changed clips, verify the files and transcript fingerprints, upload new private clips if any, and release matching SQL/source in the order above. `check:phase4` currently exits nonzero because the 173 practice items are missing. Content validity and target completion are separate checks.

## 4. Finish acceptance and independent calibration

Authenticated checks now cover real sign-in, guest-sample claim, consent, actual writing feedback, score separation and private mock playback on **both environments**, plus a full TEF mock on staging. See the audit for the exact scenarios. Temporary synthetic accounts were deleted. These previously missing checks are complete for the currently deployed revisions.

After deploying this content release, confirm the new lesson/checkpoint and practice inventory on both environments. Record any remaining hosted retry/deferred/capped/queued-consent scenarios without consuming a real learner's allowance or changing global limits; unit and disposable-database coverage does not replace a hosted result.

**Owner/external checks:** use an inbox you control for English and French signup/confirmation and password recovery; verify callback URLs and actual delivery/authentication headers. Synthetic admin-confirmed accounts do not test email delivery. See [Supabase operations](SUPABASE_OPERATIONS.md#4-acceptance-test).

**Calibration requires evidence that does not exist yet.** The owner confirmed there are no completed ratings. AI can prepare packets, run paired-score analysis and investigate disagreements, but cannot supply an independent teacher's judgments about its own scoring.

1. Obtain at least **40 consented learner essays**, covering both exams and all three target bands. Keep text, identities and consent records outside Git.
2. Have a qualified French teacher rate task fulfilment, coherence, vocabulary and grammar without seeing the AI ratings.
3. Enter paired ratings, actual model and prompt/source revision into a private copy of [the blank packet](calibration/writing-ratings.template.json).
4. Run `npm run check:calibration -- /private/path/writing-ratings.json`. Each criterion needs at least **60% exact and 90% within-one-level agreement**. Record aggregate results/methodology in `docs/calibration/`; investigate disagreements on held-out samples.
5. Arrange a separate teacher-rated speaking sample and agree its size/acceptance criteria. Writing agreement does not validate speaking; transcript feedback does not assess pronunciation.

The [calibration guide](calibration/README.md) contains the full procedure. Keep provisional labels until actual evidence supports stronger claims.

## 5. Completion criteria

Phase 4 can close when the practice targets above are met, all drafts are resolved, audio/debt checks are clean, matching migrations and source are deployed, and hosted acceptance is recorded. Independent writing/speaking calibration remains an explicit accuracy dependency from Phases 2–3; document its outcome separately rather than treating synthetic smoke tests as calibration.

For each final release run content/SQL validation, formatting, lint, types, the unit suite, production build followed by the bundle check, desktop/mobile beta and paid browser smoke tests, and migrations/assertions/diagnostic parity on **disposable PostgreSQL 17**. Never run the destructive disposable-database harness against a hosted project.

For browser checks on a machine where development compilation causes timeouts, use the production-server option. Build separately for each beta mode with isolated service settings; public variables are embedded at build time:

```bash
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=smoke-test-placeholder
export SUPABASE_SERVICE_ROLE_KEY='' ADMIN_EMAILS='' GROQ_API_KEY=''
export JOBS_SECRET='' STRIPE_SECRET_KEY='' STRIPE_WEBHOOK_SECRET=''
for mpk_beta_mode in true false; do
  export NEXT_PUBLIC_BETA_MODE="$mpk_beta_mode"
  npm run build && npm run check:bundle &&
    MPK_E2E_USE_BUILD=1 npm run test:e2e || break
done
```

These settings belong to the local test shell, not Vercel. The default browser command still uses an isolated development server.
