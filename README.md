# MPK Academy

MPK Academy is a Next.js 16 application for French for Canadian Immigration — TEF/TCF Preparation. Its product loop is **Goal → Diagnose → Learn → Practice → Simulate → Measure → Adapt → Repeat**.

Supabase provides PostgreSQL persistence and email/password authentication. Learner data is protected by Row Level Security; browser clients have read-only access to their own rows and write through restricted database functions invoked by validated server actions. Paid checkout is intentionally unavailable and cannot grant an entitlement.

## Local setup

Node.js 20.9 or newer, npm, and Docker are required.

```bash
npm install
cp .env.example .env.local
npx supabase start
npx supabase db reset
npm run dev
```

Add the local values printed by `supabase status` to `.env.local`. Open `http://localhost:3000`; confirmation and recovery emails are available in local Mailpit at `http://localhost:54324`.

## Commands

```bash
npm run dev
npm run lint
npm run test
npm run test:e2e
npm run build
npx supabase db lint --local --schema public,private --fail-on error
npx supabase test db
npx supabase gen types typescript --local
```

For hosted changes, always run `npx supabase db push --dry-run` before `npx supabase db push`, review `npx supabase config diff`, and only then run `npx supabase config push`.

## Security boundaries

- `auth.users` is the identity source; a tested trigger creates the initial profile, exam goal, progress, and skill rows.
- Every exposed learner table has RLS and explicit grants. Authenticated users can read only their own records.
- Profiles, goals, submissions, answers, scores, mistakes, and progress are written atomically through server-owned functions deriving identity from `auth.uid()`.
- Purchases and entitlements have no learner write path. No service-role key is present in the application.
- Authenticated learner data is loaded from Supabase and never persisted in browser storage. A signed-out assessment is kept in the same browser for at most seven days and claimed idempotently after authentication.
- Assessment and practice scores are recomputed from the private question bank; client-submitted scores are ignored.

## Project structure

- `src/app/actions` — validated Auth and learner server actions
- `src/lib/supabase` — browser, server, proxy, and learner data clients
- `src/types/database.ts` — generated hosted database types
- `supabase/migrations` — schema, RLS, trigger, and restricted-function history
- `supabase/tests/database` — rollback-only pgTAP security and transaction tests
- `supabase/templates` — PKCE-ready templates for use after custom SMTP is configured
- `docs/SUPABASE_OPERATIONS.md` — deployment, Free-plan monitoring, export, pause, and upgrade runbook

Question content remains MPK-owned mock content and the displayed readiness result is an internal learning indicator, not an official TEF/TCF score or immigration outcome.

See [Supabase operations](docs/SUPABASE_OPERATIONS.md), [Architecture](docs/ARCHITECTURE.md), [Domain model](docs/DOMAIN_MODEL.md), and [MVP status](docs/MVP_STATUS.md).
