# Closed beta operations

The closed beta gives invited testers the full program (Complete access) for free. Pricing, plan selection, and checkout return 404, and Stripe checkout is refused server-side. Beta access is an ordinary `entitlements` row with `source = 'beta'`, so every existing database access check applies unchanged.

## Configuration

| Variable                    | Where                    | Purpose                                                                                                          |
| --------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BETA_MODE`     | Vercel, all environments | Beta is on unless this is exactly `false`. Keep it on for any Vercel Hobby deployment (non-commercial use only). |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Vercel                   | Shown for invite requests and privacy requests.                                                                  |
| `ADMIN_EMAILS`              | Vercel, server-only      | Comma-separated emails that can open `/admin`. Everyone else gets a 404.                                         |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel, server-only      | Already required for Stripe; now also used for error logging, funnel counts, and `/admin`.                       |
| Stripe keys                 | Vercel                   | Use test-mode keys during the beta.                                                                              |

## Database

Apply the three new migrations after the content v2 migrations:

- `20261019000100_beta_access.sql`: invites, seat limit, redemption, admin functions.
- `20261019000200_app_errors.sql`: durable error log (30-day retention, rate-capped).
- `20261019000300_usage_metrics.sql`: anonymous funnel totals and tester engagement for `/admin`.

Run `npx supabase db push --dry-run` first, as for every migration. The rollback-only assertions in `supabase/tests/database/beta_access.assert.sql` and `usage_metrics.assert.sql` cover redemption, the seat limit, expiry, revocation, privileges, and error retention.

## Running a cohort

1. Open `/admin` while signed in with an `ADMIN_EMAILS` address.
2. Check **Seat limit** (default 40) and **Access days** (default 90). The free plans are sized for about 40 active testers.
3. Create invites. Leave the code empty to generate one (`MPK-XXXX-XXXX`). Use one code per tester (max uses 1), or one code per channel with a higher limit and a label such as "Cohort 1 — Reddit".
4. Send the code. Testers enter it at registration; it is checked before the account is created and redeemed automatically after email confirmation. Testers who sign up without a code can enter it later at `/beta`.
5. Revoke unused codes from `/admin` when a cohort closes.

The seat limit counts testers with active beta access. Ending access early is a SQL operation for now: set the tester's beta entitlement `status` to `revoked`.

## Measuring the beta

`/admin` shows two first-party views. No third-party analytics runs on the site.

**Funnel.** Five anonymous steps are stored as daily totals per interface language, with no user id, IP address, device, or cookie:

| Step                       | Counted when                                     |
| -------------------------- | ------------------------------------------------ |
| Viewed the landing page    | The home page loads in a browser                 |
| Answered a sample question | A visitor checks a landing-page sample answer    |
| Started the diagnostic     | "Start my assessment" is clicked                 |
| Finished the diagnostic    | The diagnostic is saved, as a guest or signed in |
| Opened registration        | The registration page loads                      |

Each browser counts once per step per day (a marker in the visitor's own storage), so the numbers approximate people rather than clicks. Browsers sending Do Not Track or Global Privacy Control are not counted, and your own visits are included. "Created an account" and "Activated beta access" come from the database. Steps can happen in a different order, so the last column is reach relative to landing views, not strict conversion. Days are Toronto days.

**Engagement.** Computed from existing learning records. Activity means a completed diagnostic, mock exam, practice session, or lesson; signing in alone does not count.

- _Active in the last 7 days_: testers with any activity in the last 7 days.
- _Active again on day 7 or later_: of testers who joined at least 7 days ago, those with activity 7 or more days after joining. This is the week-one return rate used in the beta exit criteria.
- The testers table lists each tester's last activity, active days in the last 7, and completed work by type.

## Support references

Every error shown to a learner includes a reference. `/admin` lists the last 50 server errors with their reference, event, and context for 30 days. Vercel Hobby keeps runtime logs for only one hour, so this table is the durable record.

## Before inviting testers

```sh
npm run validate:content
npm run typecheck
npm run lint
npm test
npm run build && npm run check:bundle
npm run test:e2e
```

`check:bundle` fails if any answer key, explanation, model response, mock item, or lesson body appears in the browser bundle.

## Known gaps

- Lesson bodies and answer explanations are English-only until the Phase 4 content rewrite. French-interface learners see a note on each lesson. `npm run validate:content -- --require-fr` will enforce full French coverage once that content lands.
- Paid-mode screens (pricing, plan comparison, checkout) are hidden in beta and still English-only. Translate them before setting `NEXT_PUBLIC_BETA_MODE=false`.
- The privacy notice describes current behaviour. Have it reviewed, and update it before adding analytics, AI feedback, or recordings.
