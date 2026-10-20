# MPK Academy

MPK Academy is a Next.js 16 application for French for Canadian Immigration — TEF/TCF Preparation. Its product loop is **Goal → Diagnose → Learn → Practice → Simulate → Measure → Adapt → Repeat**.

The app currently runs as a **closed beta**: invited testers get the full program for free, and pricing and checkout are hidden (see [Beta operations](docs/BETA_OPERATIONS.md)). The interface is bilingual (English and French); exam content is in French.

Supabase provides PostgreSQL persistence and email/password authentication. Learner data is protected by Row Level Security; browser clients have read-only access to their own rows and write through restricted database functions invoked by validated server actions. Stripe Checkout grants time-limited plan access only after a signed webhook or authenticated server-side reconciliation verifies payment.

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
npm run check:bundle
npm run validate:content
npx supabase db lint --local --schema public,private --fail-on error
npx supabase test db
npx supabase gen types typescript --local
PGHOST=... npm run test:db   # disposable Postgres only; refuses a Supabase database
```

For hosted changes, always run `npx supabase db push --dry-run` before `npx supabase db push`, review `npx supabase config diff`, and only then run `npx supabase config push`. The CLI is linked to the staging project; `[remotes.staging]` in `supabase/config.toml` keeps its sandbox URLs when config is pushed.

GitHub Actions (`.github/workflows/ci.yml`) runs content validation, formatting, typecheck, lint, unit tests, a build with placeholder credentials, the client-bundle check, and every migration plus the `*.assert.sql` files against Postgres 17 on each pull request and push to `main`.

## Security boundaries

- `auth.users` is the identity source; a tested trigger creates the initial profile, exam goal, progress, and skill rows.
- Every exposed learner table has RLS and explicit grants. Authenticated users can read only their own records.
- Profiles, goals, submissions, answers, scores, mistakes, and progress are written atomically through server-owned functions deriving identity from `auth.uid()`.
- Purchases and entitlements have no learner write path. Beta access is granted only by the `mpk_redeem_beta_invite` database function. The server-only service-role key is used for verified Stripe fulfillment, durable error logging, anonymous funnel counts, and the `/admin` beta tools, and is never exposed to browser code.
- Answer keys, explanations, model responses, mock items, and lesson bodies never ship in the static browser bundle. Client code imports generated summaries (`src/content/summaries.ts`); content reaches the browser through server components for entitled learners, and answers are checked by server actions. `npm run check:bundle` enforces this after a build.
- Authenticated learner data is loaded from Supabase and never persisted in browser storage. A signed-out assessment is kept in the same browser for at most seven days and claimed idempotently after authentication.
- Assessment and practice scores are recomputed from the private question bank; client-submitted scores are ignored.

## Project structure

- `src/app/actions` — validated Auth, learner, content-check, beta, and admin server actions
- `src/lib/server/content.ts` — the only module that hands answer keys to application code
- `src/i18n` — typed English/French messages; French must match the English shape at compile time
- `src/lib/supabase` — browser, server, proxy, and learner data clients
- `src/types/database.ts` — generated hosted database types
- `supabase/migrations` — schema, RLS, trigger, and restricted-function history
- `supabase/tests/database` — rollback-only pgTAP security and transaction tests
- `supabase/templates` — PKCE-ready templates for use after custom SMTP is configured
- `docs/SUPABASE_OPERATIONS.md` — deployment, Free-plan monitoring, export, pause, and upgrade runbook

Question content remains MPK-owned mock content and the displayed readiness result is an internal learning indicator, not an official TEF/TCF score or immigration outcome.

See [Beta operations](docs/BETA_OPERATIONS.md), [Supabase operations](docs/SUPABASE_OPERATIONS.md), [Stripe operations](docs/STRIPE_OPERATIONS.md), [Architecture](docs/ARCHITECTURE.md), [Domain model](docs/DOMAIN_MODEL.md), and [MVP status](docs/MVP_STATUS.md).
