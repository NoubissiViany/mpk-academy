# MVP Status

| Feature                            | Persistence/security                                     | Status      |
| ---------------------------------- | -------------------------------------------------------- | ----------- |
| Email/password Auth                | Supabase Auth, confirmation, recovery, SSR cookies       | Integrated  |
| Profile and exam goal              | Supabase RLS + restricted functions                      | Integrated  |
| Diagnostic                         | Atomic answers/results/progress; server-owned scoring    | Integrated  |
| Guest diagnostic handoff           | Seven-day browser record; idempotent authenticated claim | Integrated  |
| Dashboard (Today, plan, readiness) | Server-loaded learner snapshot; client-side planning     | Integrated  |
| Lessons                            | Several shuffled checkpoints; server-checked answers     | Integrated  |
| Reading/listening practice         | Unseen-first, weakness-weighted selection on the server  | Integrated  |
| Writing/speaking correction        | No trusted scoring implementation                        | Coming soon |
| Mock exam                          | Atomic assessment and server-owned scoring               | Integrated  |
| Mistake review (1, 3, 7 days)      | `review_items` kept by a trigger; owner-only reads       | Integrated  |
| Purchases/entitlements             | Atomic Stripe fulfillment; no browser writes             | Integrated  |
| Checkout                           | Stripe-hosted payment, tax, webhook, refund revocation   | Integrated  |
| Closed beta access                 | Invite codes, seat limit, `/admin` tools                 | Integrated  |
| Bilingual interface (EN/FR)        | Typed messages; lesson bodies still English              | Partial     |
| Certificate                        | Removed until server issuance/verification exists        | Removed     |
| Storage, Realtime, Edge Functions  | Not used                                                 | Deferred    |

Answer keys, explanations, and model responses stay on the server: lessons, practice, and the diagnostic receive redacted content and are checked by server actions. `npm run check:bundle` verifies the browser bundle after each build.

## Phase 1 (learning loop) — what is live and what is waiting

- **Readiness** is the average of the reading and listening practice scores (a rolling average that moves after every session), compared with an MPK accuracy goal per target: NCLC 5 → 60%, NCLC 7 → 70%, NCLC 9+ → 85%. Bands are "at", "near" (within 10 points), or "below", with an evidence label. These are planning aids, not NCLC conversions, and every screen says so.
- **Today** combines due reviews, one practice session on the weakest skill, and one recommended lesson (about 20–30 minutes). Steps count as done from today's activity in the learner's time zone.
- **Study plan** turns the exam date from Settings into practice sessions per week (3–5 by target, plus up to 2 when far behind close to the exam) and compares them with this week.
- **Waiting on content (Phase 4):** diagnostic v3 (30 items with real listening audio and a writing sample), 3–5 checkpoints per lesson (the code supports `extraCheckpoints`), and French lesson bodies and explanations (`explanationFr` fields are shown as soon as they exist). With 10 reading and 10 listening items per exam, a learner sees every item within a few sessions; selection then repeats the items seen longest ago.
