# Phase 4 audit — October 29, 2026

**Conclusion: incomplete.** The owner's earlier work is present on staging, including all 24 migrations and the private audio. Production now exists and has its audio, but remains six migrations behind. Content targets and independent calibration are still short. The [completion checklist](PHASE4_COMPLETION.md) contains the current ordered actions and commands.

## Hosted evidence and actions

- Repository branch: `content/review-and-first-audio`. Application revision audited/deployed: `2779986f24fc62e0c6e6b9c579c1f8df08ad0703`.
- Read-only staging migration dry run: up to date, `czbynijgpkflnntgoqgj`.
- Read-only production dry run, from an isolated temporary CLI workdir: six pending migrations, from `20261022000200_mock_audio_bucket.sql` through `20261028000300_diagnostic_writing.sql`, as individually listed in the checklist. Repository link remains staging.
- Production REST metadata lacks the diagnostic-writing RPCs; staging exposes them, consistent with the migration history.
- Both private `mock-audio` buckets contain all 79 required manifest filenames. Bucket settings are private, `audio/mpeg`, 2 MiB maximum. No upload or object deletion was performed. Production content bytes were not independently hash-compared; staging hash verification was recorded in the preceding release work.
- Vercel environment inspection confirmed the main app uses production Supabase and the sandbox uses staging. Temporary pulled environment files were deleted; only public hostnames and presence/absence were reported. Production has Groq/job variables; sandbox lacks them.
- Read-only Vault inspection found production's main-app job URL and nonempty secret; staging has neither. Values of the job secrets were not compared and no queued jobs were invoked.
- Sandbox was still on an older September deployment. Deployed an immutable archive of `2779986` to project `mpk-academy-sandbox` (`prj_LCJTgjqd1O6OAyQNKX0ZWVu0klRj`). The dry run contained 439 files, 8,335,653 bytes and no local environment files. Vercel build completed and deployment is READY: `dpl_7dPFJU7LyZiAyGvcVh4SoLqWiWTP`.
- Stable alias: <https://mpk-academy-sandbox.vercel.app>. Unique deployment: <https://mpk-academy-sandbox-qlj7lrfkk-noubissivianys-projects.vercel.app>.
- Hosted guest Playwright check passed all 26 questions, required 80–120 words (79 disabled), sample preservation after back navigation, separate provisional writing result and sign-in link; zero client errors. Synthetic text remained in the guest browser flow. No hosted account assessment, email or learner/provider transmission was created.
- Main production deployment remains `dpl_9nDpuHuTzPSog2QNCCzBRofma8fV`, source `081b7f6abf26d0f5e4fa8a9a7c8944bf4f004684`. It was not changed. Git remote content branch was still `c57d94f3fbff361692693ab8e3bdf559d5adfc6c` when checked; no Git push was performed.

## Content preparation

The published catalog remains 256 questions/tasks, 24 lessons, 26 diagnostic questions, two mocks, 124 ready clips and zero recorded content debt. All previously merged 213 draft files and their approval history remain unchanged, as do published content, audio assets, historical SQL and the content lock.

Prepared 45 additional TEF reading drafts:

| Level | File                                   | Count |
| ----- | -------------------------------------- | ----: |
| A2    | `2026-10-29-11-38-tef-reading-a2.json` |    13 |
| B1    | `2026-10-29-11-49-tef-reading-b1.json` |    10 |
| B2    | `2026-10-29-11-53-tef-reading-b2.json` |    12 |
| C1    | `2026-10-29-12-13-tef-reading-c1.json` |    10 |

The generator encountered Gemini 503/network failures and Groq schema/rate-limit failures. The new persistence logic retained the ten completed C1 drafts out of thirteen requested; no further provider work is running. The prompts sent only original content-authoring material, not learner records.

Every saved item was read and edited. Corrections included duplicated passages, invented institutional or health/legal claims, weak distractors, contradictory questions, unsupported explanations, competency mismatches and advanced texts below the required length. All carry dated AI editorial-preparation notes. They remain **pending, with no teacher field**; nine will enter the normal teacher sample after editorial acceptance. No new approvals or merges occurred. The old 183-item exception was not extended.

`content:draft check` reports **45 checked, zero flagged**. A purely in-memory candidate merge validates **301 items, 24 lessons, two mocks and zero pending clips**. Candidate TEF reading has 57 items and correct-answer positions a=15, b=17, c=13, d=12, within existing tolerance. These counts describe a simulation, not learner-visible content. `content/drafts/review.html` contains the printable 45-draft packet and is regenerated with `npm run content:review -- --print`.

The drafting command now saves each successful batch atomically, avoids overwriting same-minute files/reviews, records partial completion, limits request duration and handles transient failures separately from schema failures. Prompts discourage same-run repetition, unsupported institutional claims and question/competency mismatches. No approval gate was changed.

## Calibration preparation

Added a strict paired-rating schema, aggregate agreement calculator, `npm run check:calibration`, seven unit tests, a 40-slot blank template and [collection instructions](calibration/README.md). It checks at least 40 complete consented/independently rated records, both exams and all three targets, unique IDs and per-criterion 60% exact/90% within-one-level agreement. It reports direction of disagreement and rejects unsupported fields rather than accepting learner text.

The untouched template fails as intended: 40 supplied, zero complete, `meetsTargets: false`. There are **no real learner ratings or completed calibration results**. The checker cannot authenticate consent or a teacher's independence. Speaking evaluation remains separate.

## Verification

- Targeted drafting, quality, calibration and CLI persistence tests: **30 passed across four files**. The first sandboxed CLI test could not spawn its Node child (`EPERM`); rerunning with local subprocess permission passed. Its provider is synthetic and makes no network requests.
- Draft validation: 45 pending, all with notes, zero mechanical flags; candidate simulation passes without mutating source.
- `check:phase4`: expected nonzero status because published targets remain short and the new drafts are unresolved. Content and SQL validation pass.
- The existing application revision had already passed 357 unit tests, local browser suites (14 beta/16 paid), build/bundle protection and disposable PostgreSQL 17 migration/assertion/parity checks. This audit additionally completed the hosted sandbox build and guest check above. Learner runtime code and migrations did not change in the audit.

Final verification passed: **365 unit tests across 60 files**, lint with zero warnings, TypeScript checking, repository formatting, content/SQL synchronization and `git diff --check`. The blank calibration template returned the expected failure (40 supplied, zero complete). New JSON drafts were also checked against the pipeline’s canonical two-space JSON formatting. Published content, audio, SQL/lock and all earlier draft files have no diff against the starting application revision.

## Completion boundary

The owner still needs to configure sandbox AI/worker settings and complete authenticated acceptance; apply the six production migrations before matching deployment; approve/review the 45 new drafts and finish the remaining 153 undrafted MCQs, 20 productive tasks, lesson gaps and checkpoints; and arrange actual independent writing/speaking calibration. The exact quantities and release order are in [the checklist](PHASE4_COMPLETION.md).
