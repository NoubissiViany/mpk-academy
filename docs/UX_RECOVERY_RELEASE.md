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

Browser tests use an isolated local server with hosted service credentials disabled. Signed-in recovery across devices and feedback states are covered by component/action tests and database assertions; an authenticated hosted-browser smoke check remains part of the deployment process after migrations are applied.
