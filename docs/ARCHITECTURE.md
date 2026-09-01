# Frontend Architecture

## Shape

The App Router composes mostly static/server-rendered pages around small client islands for forms, question sessions, timers, navigation, and local persistence. Marketing and student route groups provide distinct shells; the exam session bypasses student navigation for focus.

Dependencies point inward: `pages/components → feature logic → repository contracts → mock or future API adapters`.

Provider response types must not enter components. Pure domain rules live outside React and accept normalized entities.

## State

The MVP uses an application provider and versioned `localStorage` document. It hydrates from a safe seeded state and persists each state transition. Locale also uses a cookie so a future server-rendered dictionary loader can select language without client-only routing.

This is UX simulation, not security. Frontend entitlement helpers make locking consistent but cannot authorize content.

## UI and accessibility

CSS variables define semantic colors for light/dark system themes and distinct Learn, Practice, and Exam identities. Radix primitives provide accessible dialog and progress behavior. Controls use semantic elements, visible focus, labels, non-color status text, and responsive single-column session layouts.

## Extension rules

- Add fields to normalized entities before updating adapters or UI.
- Add repository implementations without changing consumers.
- Keep scoring and recommendation policies deterministic, versioned, and tested.
- Add translation keys to both typed dictionaries.
- Centralize prices, entitlements, disclaimers, navigation, and flags in configuration.
