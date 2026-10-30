# Phase 4 audit — October 30, 2026 (UTC)

**Conclusion: incomplete.** The previous production synchronization and 45-question approval/merge are done. This audit completes the local lesson/checkpoint targets, configures the missing staging worker entries, and verifies authenticated staging behavior with actual provider/private-audio requests. Practice expansion and independent calibration remain. See [the completion checklist](PHASE4_COMPLETION.md) for release commands and quantities.

## Content and preservation

- Starting HEAD: `102da6a64d6d0f9921dcb1db51713fe5238d8ea2`, branch `content/review-and-first-audio`.
- On arrival, the owner had merged 45 TEF reading drafts, supplied the nine required teacher approvals, and generated summaries/lock and `20261030000100_content_sync.sql`. Those changes were preserved. Text and historical notes match the starting draft records exactly; this audit does not infer who performed the supplied approvals.
- All **258 drafts** are merged. None of the earlier 213 draft records changed. The old 183-item AI review exception was not extended.
- Added eight bilingual shared lessons (`shared-lesson-011`–`018`) and 48 checkpoints across the original 24 lessons. Topics: object pronouns, negation, conditions, relative pronouns, faithful paraphrase, linked listening notes, argument development and revision order.
- New teaching material was authored and editorially reviewed by AI under the owner's request to complete available Phase 4 work. No independent human teacher review is claimed. The listening lesson distinguishes written checkpoint reasoning from measured listening ability.
- Compared every original lesson field, ID, primary checkpoint and access flag with HEAD: all preserved. Each original lesson receives exactly two additional checkpoints; each new lesson has three.
- Local catalog: **301 questions/tasks, 32 unique lessons, 26 diagnostic questions, two mocks**. Eighteen shared plus seven exam-specific lessons provide **25 lessons per exam**. All 32 have three checkpoints: **96 total**.
- Generated additive `20261030000200_content_sync.sql`: eight lesson rows, none retired. The owner's earlier migration and all historical migrations remain unchanged. No API, schema, entitlement or approval-gate change.
- Zero unresolved drafts, pending clips, short-document exceptions or answer-length exceptions. Audio dry run: **124 clips, zero to make, zero synthesis characters**. Audio assets and fingerprints are unchanged.
- Remaining practice gaps: **153 MCQs** (three TEF reading, 50 TCF reading, 50 listening per exam) and **20 productive tasks** (six TEF/four TCF each for writing and speaking).

## Hosted state and changes

- Staging `czbynijgpkflnntgoqgj` and production `uhbuvskmiojqjegpuuln` both have the earlier 24 migrations through `20261028000300_diagnostic_writing.sql`.
- Fresh read-only dry runs for both list exactly `20261030000100_content_sync.sql` and `20261030000200_content_sync.sql`. Production used an isolated temporary CLI directory. The repository remains linked to staging. **No hosted migrations were pushed.**
- Both `mock-audio` buckets were confirmed private, with a 2 MiB limit and `audio/mpeg` restriction, and contain **79/79 required filenames**. No audio was uploaded or deleted. This inventory check is not a new production byte-for-byte hash verification.
- Sandbox: READY `dpl_9kRXss5HMoHerGhRKe95npTQ6tmx`, application source `2779986f24fc62e0c6e6b9c579c1f8df08ad0703`, <https://mpk-academy-sandbox.vercel.app>.
- Main: READY `dpl_5YkRcYScLBwMizGmseWq93uCd6yW`, source `0ae406c8f65e8a6407207ba7ac57b5f2737af512`, <https://mpk-academy.vercel.app>.
- The owner had configured sandbox Groq/job variables. This audit added the two missing staging Vault entries from the existing Vercel job secret, in a transaction that refuses conflicting existing values. Verification returned the sandbox `/api/jobs/run` URL, a secret of at least 32 characters, and active `mpk-writing-feedback` cron every minute. Secret values were never printed; temporary secret files were deleted.
- Production worker configuration was unchanged. No app deployment or Git push was made. The new content needs owner-run migrations before matching app deployment.

## Authenticated staging acceptance

The full staging run began at 01:37 UTC and completed at 01:56 UTC. Used temporary admin-confirmed `example.invalid` accounts and original synthetic French text. No confirmation/recovery emails or real learner texts were sent. Test accounts and cascading learner records were deleted.

Passed against the deployed sandbox:

1. Complete all 26 diagnostic questions and the writing sample, then sign in through the UI. The exact sample transfers to exactly one assessment, including after reload.
2. The server rejects missing consent (`42501`). Explicit UI consent/request produces real Groq feedback with model `openai/gpt-oss-120b` and all four criteria: task, coherence, vocabulary and grammar.
3. A repeated request returns the same submission. Diagnostic quiz and per-skill scores remain unchanged.
4. A temporary entitlement enables listening practice, and its audio loads.
5. Complete a TEF mock: 40 reading answers, **40 private listening clips**, two writing tasks and two self-practised speaking tasks. Real server audio deadlines were observed; no clock bypass.
6. Reload cannot replay a spent clip; a direct second-play RPC is rejected (`22023`). The completed assessment contains **84 answers** and reaches its results page.
7. Consent withdrawal prevents feedback retry (`42501`). Zero client errors recorded.

These checks establish integration for the tested cases, not calibration, human speaking performance, email delivery or a full hosted TCF mock. Retry/deferred/cap and queued-consent behavior have unit/database coverage; not every failure state was injected into the live service.

## Authenticated production acceptance

The production run completed at 04:23 UTC. The same guest diagnostic/sign-in and real writing-feedback checks passed on production: exact-once sample claim, missing/withdrawn consent rejection, all four provider criteria, idempotent request/reload, unchanged quiz scores and zero client errors. Entitled listening-practice audio and the first private TEF mock clip loaded; reload could not replay that clip. The temporary production account and cascading learner records were deleted. A complete production mock was not run.

Initial test setup rejected a masked service-key export. Vercel metadata confirmed that the key is marked `sensitive`; the test then used the already verified local production admin credential solely for temporary-account setup and assertions. The deployed application's own credentials remained unchanged, and its actual feedback/audio requests passed. No production configuration repair was needed. An environment-export timeout and an automatic-review timeout were recovered by retry; neither left an account behind.

## Local validation

- **365 unit tests passed in 60 files.** Fixed two catalog-dependent expectations: teacher sampling uses a fixed ID set instead of a growing catalog; mistake detail expects the newly relevant listening lesson and link. No gate/recommendation behavior changed.
- Lint (zero warnings), TypeScript, repository formatting, content/SQL validation and `git diff --check` passed. The additional Playwright configuration also passed lint and both production builds.
- Production build passed, then bundle protection passed: **1,022 protected strings across 87 files**. Protection covers both languages and every checkpoint. An injected extra-checkpoint explanation was rejected; the probe was removed and the clean check passed again.
- Official PostgreSQL **17.11** packages were hash-verified and extracted under `/tmp`, without system installation. A disposable server applied **26 migrations**, passed **seven assertion suites** and **six diagnostic parity scenarios**, then shut down.
- The first development-server browser runs hit compilation/navigation timeouts under local memory pressure (the Next development process reached about 1.7 GiB). Added opt-in `MPK_E2E_USE_BUILD=1` to test the built application with the same isolated environment; the default development workflow is unchanged. This does not relax test assertions or timeouts.
- Desktop/mobile browser smoke tests against separately built beta and paid applications: **14 beta + 16 paid passed**. Coverage includes guest writing handoff, EN/FR, entitlement routing and byte-for-byte public audio delivery. Original assertion/time limits were retained. Both builds passed their subsequent bundle checks; all URLs were loopback and service credentials were cleared.
- `check:phase4` correctly fails for the 173 missing practice items. Lesson/checkpoint gaps are zero; content/SQL validity passes.

## Calibration and completion boundary

The owner confirmed that no completed calibration ratings or authenticated reports existed. Authenticated staging and production evidence now exists; independent calibration does not. The blank 40-essay packet/checker is ready and correctly fails with zero completed samples. Obtain consented essays and independent qualified-teacher ratings, and arrange a separate speaking evaluation. Synthetic texts and AI editorial review cannot replace that evidence.

Remaining work: author/review/release the missing practice content; push the two prepared migrations and deploy matching source; verify external-inbox authentication; obtain independent calibration. Exact counts and commands are in [the checklist](PHASE4_COMPLETION.md).
