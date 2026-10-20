# MVP Status

| Feature                           | Persistence/security                                     | Status      |
| --------------------------------- | -------------------------------------------------------- | ----------- |
| Email/password Auth               | Supabase Auth, confirmation, recovery, SSR cookies       | Integrated  |
| Profile and exam goal             | Supabase RLS + restricted functions                      | Integrated  |
| Diagnostic                        | Atomic answers/results/progress; server-owned scoring    | Integrated  |
| Guest diagnostic handoff          | Seven-day browser record; idempotent authenticated claim | Integrated  |
| Dashboard                         | Server-loaded learner snapshot                           | Integrated  |
| Lessons                           | Supabase progress function and entitlement check         | Integrated  |
| Reading/listening practice        | Atomic sessions, answers, mistakes, and skill progress   | Integrated  |
| Writing/speaking correction       | No trusted scoring implementation                        | Coming soon |
| Mock exam                         | Atomic assessment and server-owned scoring               | Integrated  |
| Mistake review                    | Per-user RLS and restricted status update                | Integrated  |
| Purchases/entitlements            | Atomic Stripe fulfillment; no browser writes             | Integrated  |
| Checkout                          | Stripe-hosted payment, tax, webhook, refund revocation   | Integrated  |
| Closed beta access                | Invite codes, seat limit, `/admin` tools                 | Integrated  |
| Bilingual interface (EN/FR)       | Typed messages; lesson bodies still English              | Partial     |
| Certificate                       | Removed until server issuance/verification exists        | Removed     |
| Storage, Realtime, Edge Functions | Not used                                                 | Deferred    |

Answer keys, explanations, and model responses stay on the server: lessons, practice, and the diagnostic receive redacted content and are checked by server actions. `npm run check:bundle` verifies the browser bundle after each build.
