# Frontend Architecture

## Shape

The App Router composes mostly static/server-rendered pages around small client islands for forms, question sessions, timers, navigation, and local persistence. Marketing and student route groups provide distinct shells; the exam session bypasses student navigation for focus.

Dependencies point inward: `pages/components → feature logic → repository contracts → mock or future API adapters`.

Provider response types must not enter components. Pure domain rules live outside React and accept normalized entities.

## State

Signed-in learner state is loaded from Supabase on the server (deduplicated per request with React `cache`) and seeded into the application provider. Anonymous visitors keep only a guest assessment in `localStorage`; the provider skips the server snapshot entirely when no Supabase session cookie exists.

Practice pools are chosen on the server (`src/lib/domain/practice-selection.ts`) from the learner's own `practice_answers` and due `review_items`: due reviews take up to 40% of a session, then unseen items weighted toward weak competencies, then items seen longest ago. The review queue is maintained by a database trigger on `practice_answers`, so no client code can move an item through the 1-, 3-, and 7-day steps. Signed-out visitors to learner areas are redirected to `/login?next=…` by the proxy before any page renders.

Frontend entitlement helpers make locking consistent but cannot authorize content. Content is authorized on the server: pages send lesson bodies, practice pools, and tasks only to entitled learners, and answers are checked by server actions.

## Internationalization

The `mpk_locale` cookie (falling back to `Accept-Language`) selects English or French. The root layout resolves it on the server for `<html lang>` and passes it to the provider; signed-in learners' profile locale overrides it and is written back to the cookie. Messages live in `src/i18n/messages/*`, one namespace per file with English and French side by side; French is typed as the English shape, so a missing translation fails the build. Exam Mode screens are French-only by design.

## UI and accessibility

CSS variables define semantic colors for light/dark system themes and distinct Learn, Practice, and Exam identities. Radix primitives provide accessible dialog and progress behavior. Controls use semantic elements, visible focus, labels, non-color status text, and responsive single-column session layouts.

## Extension rules

- Add fields to normalized entities before updating adapters or UI.
- Add repository implementations without changing consumers.
- Keep scoring and recommendation policies deterministic, versioned, and tested.
- Add translation keys to both typed dictionaries.
- Centralize prices, entitlements, disclaimers, navigation, and flags in configuration.
