# MPK content v2 implementation

The new source of truth is typed, original MPK content in `src/content/`. No official sample questions, commercial exercises, generated production audio, or official score conversions are included.

## Seed inventory

| Dataset      | Reading | Listening | Writing | Speaking | Grammar | Vocabulary |   Total |
| ------------ | ------: | --------: | ------: | -------: | ------: | ---------: | ------: |
| Diagnostic   |       6 |         4 |       0 |        0 |       6 |          4 |      20 |
| TEF practice |      10 |        10 |       4 |        4 |       0 |          0 |      28 |
| TCF practice |      10 |        10 |       6 |        6 |       0 |          0 |      32 |
| TEF mock 01  |      40 |        40 |       2 |        2 |       0 |          0 |      84 |
| TCF mock 01  |      39 |        39 |       3 |        3 |       0 |          0 |      84 |
| Total        |     105 |       103 |      15 |       15 |       6 |          4 | **248** |

There are **24 teaching lessons**: 10 shared foundations and seven per exam. Each active exam offers 17 applicable lessons. Every lesson includes explanation, French examples, guided application, common errors, and an interactive checkpoint. Practice items and mock items have distinct IDs; the diagnostic is separate from both.

The diagnostic has four A2, six B1, six B2, and four C1 items, ordered progressively. Its target is 12–15 minutes. With all four diagnostic audio assets pending, 16 items contribute to the provisional estimate. The four transcript answers remain available but do not contribute to listening, overall accuracy, or competency evidence. Language foundation is the weighted accuracy over six grammar/sentence-construction and four vocabulary items. Unassessed skills use null, never a fabricated zero or percentage. The legacy thresholds remain provisional MPK heuristics, not validated CEFR certification.

## Mock formats and availability

| Section   | TEF Canada                                          | TCF Canada                                           |
| --------- | --------------------------------------------------- | ---------------------------------------------------- |
| Reading   | 40 MCQs / 60 minutes                                | 39 MCQs / 60 minutes                                 |
| Listening | 40 MCQs / 40 minutes                                | 39 MCQs / 35 minutes                                 |
| Writing   | A: 25 minutes, ≥80 words; B: 35 minutes, ≥200 words | 60 minutes shared; 60–120, 120–150, 120–180 words    |
| Speaking  | A: 5 minutes; B: 10 minutes                         | 2 minutes; 5:30 including 2-minute preparation; 4:30 |
| Total     | 175 minutes                                         | 167 minutes                                          |

Format references only: [CCI TEF Canada](https://www.lefrancaisdesaffaires.fr/candidat/test-evaluation-francais/tef-canada/presentation/) and [France Éducation international TCF Canada](https://www.france-education-international.fr/test/tcf-canada). No sample subjects were used to author the content.

Both full mocks are deliberately unavailable while audio is pending. The database rejects attempts to bypass this gate or submit a mock outside the timed-session API. The implemented engine uses server deadlines, task/section transitions, locked completed sections, reading navigation, one-way listening, and one-play audio grants. TCF questions appear after listening. Session IDs and unsent writing drafts survive refresh locally; authoritative answers, positions, consumed audio, and deadlines persist in the private database session. Offline elapsed time does not restart timers. Corrections and models are projected separately from active candidate payloads and rendered only for completed, owned assessments.

Writing is saved for rubric/model self-review. Speaking is timed self-practice without a live interlocutor, recording, upload, or AI evaluation. Productive completion is never converted to a score. TCF's 20-minute writing practice timers are suggestions, not official per-task limits; the mock uses the shared 60-minute deadline.

## Audio inventory and future work

**103 original audio assets remain required:** four diagnostic, 20 practice, and 79 mock recordings. Every listening item has an original French transcript, speaker metadata, intended duration, stable asset ID, and `pending` status with no playable path. `npm run validate:content` prints the full pending-ID inventory. Assets use `<question-id>-audio` identifiers.

Transcript exercises are visibly labelled and may produce reviewable, labelled mistakes, but do not update listening percentages. Mock sessions never substitute transcripts for recordings. A one-second synthetic WAV tone under `src/test/audio/` and test-only ready metadata exercise the one-play policy. The tone is not a French listening asset and is never served as production content.

Deferred by the agreed scope: recording production, microphone capture/upload, AI feedback, live speaking interaction, and a second mock per exam. Once recordings exist, verify actual duration and browser playback, update their readiness through a new forward migration, regenerate the public summaries, and rerun audio/session checks before enabling mocks.

## Persistence and release

Apply the four `20261002` migrations in order alongside the application release. They add derived private grading metadata, manifests, session storage, evidence modes, null unassessed results, strict submissions, and timed mock transitions. **No linked or production Supabase database was modified.**

TypeScript remains the authoring source. `npm run content:sql` generates the initial private catalog migration and a public summary containing no questions or corrections. `npm run validate:content` detects drift between those generated artifacts and the source. Never overwrite a migration that has already shipped: future published-content or audio changes require a new forward migration. Do not repurpose published IDs for different questions or answers.

Historical question IDs, answer keys, lesson completions, attempts, and stored results are preserved. Old lessons have archived routes; current completion is calculated against the active exam's 17 lessons. Guest assessment storage is versioned to v2, and outdated unfinished assessments restart with an explanation. Existing auth, entitlement, checkout, pricing, and navigation flows remain in place. The browser checkout test's stale $249 expectation was updated to the already-existing $256.75 price; product prices were not changed.

## Validation

Verified: **152 Vitest tests across 33 files**, **eight Playwright checks across desktop and mobile**, content validation/SQL drift checks, and isolated database assertions. Type checking, lint, and the production build also passed. The only unavailable suite is pgTAP, described below.

- Content validation covers IDs, fields/enums, competency references, four distinct MCQ options, answer-key membership, document/audio metadata, word ranges and model lengths, speaking/preparation timings, manifest counts/references, and practice/mock separation.
- Unit/component checks cover diagnostic evidence exclusion, ready-audio inclusion, candidate redaction, one-play grants, TCF question release, automatic writing saves, session restoration, expiry, and UI integration.
- Rollback-only PostgreSQL assertions cover six guest/server scoring-parity scenarios (perfect, all-wrong, alternating, grammar-priority, mixed audio, and all audio ready), idempotency, malformed/foreign submissions, unscored productive work, transcript mistakes, pending-audio gates, entitlement/RLS boundaries, navigation, deadline recovery, full mock answer sets, and historical IDs.
- All migrations were applied successfully to an isolated PostgreSQL 15 database under `/tmp`, with a minimal test-only Supabase auth schema. The linked project was not used.
- The existing pgTAP suite was updated for the 20-question bank, but its execution is blocked locally because the PostgreSQL installation lacks the `pgtap` extension. The standalone assertions run without that dependency.

Verification commands use Node 22.18.0; the shell's default Node 18 is below the application's declared minimum.

```sh
npm run validate:content
npm run typecheck
npm run lint
npm test -- --maxWorkers=2
npm run test:e2e
npm run build
# Disposable migrated PostgreSQL only:
psql -v ON_ERROR_STOP=1 -f supabase/tests/database/content_v2.assert.sql
```

## Files changed

See [the complete created/modified file inventory](content-v2-files.md). The main changes are the typed content bank and validation scripts, lesson/practice/diagnostic/mock UI, scoring and snapshot adapters, four forward migrations, and regression tests. No authentication or payment implementation was changed.
