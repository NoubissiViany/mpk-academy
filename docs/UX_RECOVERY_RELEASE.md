# Assessment recovery and learning continuity

This release keeps the existing Vercel/Supabase hosting, invitation process and paid-mode behavior. No invitation-request links are added.

## Release order

Apply these additive migrations, in order, **before releasing the matching application**:

1. `20261104000100_diagnostic_drafts.sql`
2. `20261104000200_learning_continuity.sql`

Use the existing Supabase release process, confirm the target project, and review the migration diff before applying it. The local verification described here does not apply migrations to hosted Supabase or deploy Vercel.

The first migration creates owner-scoped draft reads and authenticated save/discard/complete functions. Clients cannot write the table directly. Each write checks the saved revision under a per-user transaction lock. Submission and matching draft cleanup commit together; retries reuse the attempt ID and return the original authoritative result. The historical diagnostic submission function remains compatible.

Unedited drafts expire after seven days. Expired rows cannot be read through RLS or the load function. Saves remove expired rows; a daily `mpk-expired-diagnostic-drafts` job removes them physically when `pg_cron` is installed. Verify this job in hosted Supabase after migration. If scheduling is managed externally, schedule `select private.purge_diagnostic_drafts()` daily with the database owner. Never grant that function to browser roles.

The second migration records `practice` versus `review` on new practice sessions. Existing sessions retain the `practice` default because older records do not distinguish the originating UI. It extends the existing beta metrics function with the number of activated testers who completed a lesson or practice after activation; no new tracking events are introduced.

## Production recovery — November 4, 2026

Production `mpk-academy` (`uhbuvskmiojqjegpuuln`, serving `mpkacademy.com`) was brought up to all 32 repository migrations through `20261104000200`. The application had reached production before eight database migrations. Its learner snapshot selected the absent `practice_sessions.mode` column, causing PostgreSQL `42809` (`WITHIN GROUP is required for ordered-set aggregate mode`). The account-draft table and functions were also absent.

The production migration history and dry run were reviewed before applying these existing migrations in order:

1. `20261030000100_content_sync.sql`
2. `20261030000200_content_sync.sql`
3. `20261102000100_writing_requirements_schema.sql`
4. `20261102000200_content_sync.sql`
5. `20261102000300_dynamic_writing.sql`
6. `20261102000400_mock_presentation.sql`
7. `20261104000100_diagnostic_drafts.sql`
8. `20261104000200_learning_continuity.sql`

The push explicitly targeted production with `--project-ref uhbuvskmiojqjegpuuln --skip-vault`; the repository's staging link was preserved. A subsequent dry run reported no pending migrations. `NOTIFY pgrst, 'reload schema'` refreshed the API schema cache. No application deployment or authentication/invitation configuration change was needed.

Production verification:

- The previously failing API selection succeeds. The draft table, owner-scoped RLS, all four public draft functions, practice-mode function, and active daily expiry-cleanup job are present.
- Before/after record counts and fingerprints match for existing profiles, assessments, assessment answers, practice sessions (excluding the newly added mode), practice answers, and lesson progress. Existing mock sessions all have a presentation snapshot.
- The rollback-only `diagnostic_drafts.assert.sql` and `learning_continuity.assert.sql` checks passed against production, including account isolation, malformed drafts, revision conflicts, expiry, successful-submission cleanup, idempotent retries, practice/review separation, and server scoring. Their synthetic fixtures were rolled back; the disposable-database harness was not used on production.
- Hosted browser checks on `mpkacademy.com` verified password sign-in, refresh recovery with stable question/option order, all 26 answers and writing recovered in a fresh mobile browser session, successful assessment submission, atomic draft cleanup, and an idempotent submission retry. Authenticated drafts were absent from browser storage.
- Focused hosted checks verified the returning-learner dashboard, a saved five-question reading practice, its direct next-lesson link, three lesson checkpoints and saved completion, and the completed daily plan after dashboard refresh. Tests used disposable, admin-confirmed accounts with temporary entitlements; no invitation codes, real learner records, emails, or AI-feedback requests were used.
- The French mobile dashboard and its saved language preference passed after switching language through the application and refreshing. No horizontal overflow was found. Temporary test accounts and their cascading test records were removed after each run.
- Final verification at 17:52:41 UTC found zero remaining smoke accounts, unchanged original learner-record fingerprints, and zero durable application errors since the schema verification at 17:44:19 UTC. Content validation and documentation formatting/diff checks also passed. The application source was unchanged, so no additional build or deployment was performed.

## Recovery behavior

- Guest drafts use a separate versioned browser key. Compatible legacy answers are migrated. Question and option order, attempt ID, intake, position, answers and writing survive navigation and reopening.
- Signed-in drafts use server actions and Supabase. They are never written to browser storage. Saves verify the expected account as well as the revision.
- Signing in with unfinished work opens recovery. When account and browser drafts coexist, the learner chooses. Replacing an account draft with the browser draft requires confirmation and retains the browser copy until the account save succeeds. Choosing the account draft leaves the browser copy intact.
- Browser writes use Web Locks where supported plus revision checks. Account writes use database locks and revision checks. Conflicts retain visible edits and require an explicit reload; failed saves can be retried. Navigating away with unsaved work triggers the browser's unload protection where supported.
- Writing saves are debounced by 400 ms and flushed on blur, submission and navigation. Restart is confirmed. An incompatible content version offers the saved writing for copying before restart.

## Dashboard data

The shared next-task calculation uses saved completed practice sessions and lesson progress for the selected exam. Review sessions, productive-skill practice, another exam and generic activity-history entries do not complete the objective practice step. Remaining time excludes completed steps. Dashboard, lesson completion and practice results share this calculation.

Writing/speaking summaries query only completion timestamps and feedback IDs/statuses for the active exam. Essay and transcript bodies are not passed to the dashboard. Capability copy considers both access and service configuration; AI requests and consent remain explicit.

## Verification

Run with Node 20.9 or later (verified locally with Node 22):

```sh
npm run typecheck
npm run lint
npm test -- --maxWorkers=4
npm run validate:content
npm run build
npm run check:bundle
npm run format:check
NEXT_PUBLIC_BETA_MODE=true npm run test:e2e
NEXT_PUBLIC_BETA_MODE=false npm run test:e2e
```

Run `npm run test:db` only against a fresh disposable PostgreSQL instance using `PGHOST`, `PGPORT`, `PGUSER` and `PGDATABASE`. The test shim must never be applied to hosted Supabase. Assertions cover draft isolation, malformed payloads, revision conflicts, expiry, completion cleanup, idempotent retries, practice modes and activation completion counts.

Verified locally on November 4, 2026:

- Full unit/component/action suite: 415 passed; the final metrics regression passed all four cases, including one additional French-language case.
- All 11 rollback-only database assertion files passed on disposable PostgreSQL 15; the final payload type guards passed the draft assertions again.
- Desktop/mobile production browser runs: 22 beta cases and 24 paid-mode cases passed. Mode-specific and desktop-inapplicable mobile-menu cases were intentionally skipped.
- Typecheck, lint, formatting, content validation, and production builds passed. Client-bundle checks found none of 1,022 protected content strings in 81 client files.
- English/French desktop/mobile visual checks found no horizontal overflow or browser errors.

The local browser tests above use an isolated server with hosted service credentials disabled. The subsequent authenticated production checks are recorded in the production recovery section. Continue to run an authenticated hosted-browser smoke check after future migrations and releases; component tests do not replace it.
