# Dynamic writing and presentation release

Writing uses the authored `wordCount.min`; the diagnostic uses `diagnosticWritingRange`. Ordinary task maxima remain guidance. Existing diagnostic word/character limits and AI/practice character limits remain enforced. Unknown or invalid ranges fail validation instead of falling back to a shared minimum.

Expired short writing practice is stored as an `abandoned` practice session, with its text retained and no completion/progress credit or AI request. Mock completion records `incompleteWritingIds`, keeps comprehension scoring, and retains available saved answers. Draft saving and free navigation remain available before irreversible submission.

New mocks store their manifest and option order in `private.mock_sessions.presentation`. The schema migration snapshots existing sessions with their original order. Grading always uses original question/choice IDs. Other attempts keep presentation order in component state. The existing question bank is reused, so overlap between learners remains possible.

## Migration order

Apply these before deploying the app:

1. `20261102000100_writing_requirements_schema.sql`
2. `20261102000200_content_sync.sql`
3. `20261102000300_dynamic_writing.sql`
4. `20261102000400_mock_presentation.sql`

All four were applied to **mpk-academy-staging** (`czbynijgpkflnntgoqgj`) on November 2, 2026. Production has not been migrated or deployed by this change. Verify the target project before any production push; the repository's normal Supabase link is staging.

The database regressions under `supabase/tests/database/` cover minimum boundaries, whitespace, AI character limits, rewrites, incomplete saves, idempotency, permissions, legacy mock order, saved shuffles, free navigation, timeout completion, audio rules, and comprehension scoring. Run `npm run test:db` only against an empty disposable database with the documented PG variables. Its shim is never suitable for hosted Supabase. The assertion files themselves use rollback-only fixtures.

## Verification

- Unit/component/action suite: 389 tests passed.
- Content validation: 301 existing questions/tasks, 32 lessons, 26 diagnostic questions; generated database content matches.
- Typecheck, lint, and production build passed.
- Staging database assertions passed for writing requirements, diagnostic limits, and mock presentation/compatibility.
- Desktop/mobile browser suite: 14 passed; 6 paid-mode cases skipped because beta mode is enabled.
- Staging learner smoke passed: diagnostic limits, task minimum, English/French writing guidance, and saved mock question/option/answer order after refresh. The temporary learner and its cascading test records were removed.
- Sandbox deployment: <https://mpk-academy-sandbox.vercel.app>.
