# MVP Status

| Feature                           | Persistence/security                                     | Status                |
| --------------------------------- | -------------------------------------------------------- | --------------------- |
| Email/password Auth               | Supabase Auth, confirmation, recovery, SSR cookies       | Integrated            |
| Profile and exam goal             | Supabase RLS + restricted functions                      | Integrated            |
| Diagnostic                        | Atomic answers/results/progress; server-owned scoring    | Integrated            |
| Guest diagnostic handoff          | Seven-day browser record; idempotent authenticated claim | Integrated            |
| Dashboard                         | Server-loaded learner snapshot                           | Integrated            |
| Lessons                           | Supabase progress function and entitlement check         | Integrated            |
| Reading/listening practice        | Atomic sessions, answers, mistakes, and skill progress   | Integrated            |
| Writing/speaking correction       | No trusted scoring implementation                        | Coming soon           |
| Mock exam                         | Atomic assessment and server-owned scoring               | Integrated            |
| Mistake review                    | Per-user RLS and restricted status update                | Integrated            |
| Purchases/entitlements            | Server-owned tables; no browser writes                   | Secure boundary ready |
| Checkout                          | Visible plans, no payment or entitlement grant           | Coming soon           |
| Certificate                       | Existing UI; server issuance/verification still required | Deferred              |
| Storage, Realtime, Edge Functions | Not used                                                 | Deferred              |

Question definitions are still application-owned mock content. Before public exam delivery, move secure question retrieval behind a trusted server boundary so answer keys are not bundled into active client sessions.
