# MPK Academy

MPK Academy is a production-oriented frontend MVP for French for Canadian Immigration — TEF/TCF Preparation. Its product loop is **Goal → Diagnose → Learn → Practice → Simulate → Measure → Adapt → Repeat** and its language philosophy is **Understand in English. Learn in French. Perform in French.**

This repository contains a complete navigable frontend with realistic mock content and browser persistence. It does not claim to provide official TEF/TCF questions, scores, credentials, or immigration outcomes.

## MVP scope

- Marketing, program, pricing, diagnostic, authentication, and simulated checkout
- Student dashboard, course and lessons, practice, mistake review, exam simulation, progress, certificate, and settings
- English/French interface with configurable instructional support and French-first Exam Mode
- Deterministic diagnostic, readiness, recommendation, access-control, and certificate rules
- Mock repository adapters and versioned `localStorage` state

## Tech stack

Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn-compatible Radix primitives, Lucide, React Hook Form, Zod, Sonner, Vitest, Testing Library, and Playwright.

Requires Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Any valid login email/password works in the mock; include `free` in the email to test free-student access. Registration creates a free student. All state remains in the current browser.

## Commands

```bash
npm run dev
npm run lint
npm run test
npm run test:e2e
npm run build
```

Playwright browsers may first require `npx playwright install chromium`.

## Project structure

- `src/app` — App Router pages and route layouts
- `src/components` — shared product and shadcn-style UI primitives
- `src/features` — interactive domain experiences
- `src/lib/domain` — pure scoring, recommendation, readiness, access, and eligibility rules
- `src/repositories` — provider-independent contracts and mock adapters
- `src/data` — realistic, relational mock fixtures split by domain
- `src/i18n` and `src/config` — typed dictionaries and centralized product behavior
- `docs` — architecture and future integration boundaries

## Mock architecture and domain model

UI components work with normalized entities and never provider DTOs. Repository contracts cover authentication, users, courses, questions, progress, assessments, payment, and recommendations. The current mock adapters can be replaced independently with server/API implementations.

Questions are a discriminated union. The renderer currently supports multiple choice and fill-in-the-blank, with stable extension points for audio, reading passages, matching, and true/false. Provider response mapping belongs in a future repository adapter, not the UI.

State is stored under a versioned browser key and validated by schema version before use. This provides believable continuity only; it is not secure storage.

## Localization

Typed English and French dictionaries keep application copy out of presentation components. Locale is stored on the mock learner and in a cookie. Learning Mode can provide English support, Practice Mode reduces it, and Exam Mode always suppresses assistance during an attempt.

## Readiness and recommendations

`READINESS_ALGORITHM_VERSION = "v1"` combines diagnostic (15%), quizzes (15%), practice (25%), recent competencies (15%), simulation (25%), and completion (5%). It returns no score until a diagnostic, ten practice answers, and one simulation exist. Recommendations deterministically prioritize missing diagnosis, the weakest evidenced competency, repeated mistakes, the current lesson, then a simulation.

MPK Readiness is an internal preparation indicator, not an official score or outcome prediction.

## Production boundaries

The current frontend is not responsible for real authorization, payment verification, persistent learner records, or secure external API access. Those must be implemented server-side.

- Replace mock auth with a secure provider/session and server-enforced route authorization.
- Keep payment data out of the application; use a PCI-compliant hosted checkout and verified webhooks.
- Transform external question/content responses into internal models on a trusted server. Do not send answer keys for active secure assessments.
- Persist progress, attempts, consent, and learner records through authenticated APIs.

See [Architecture](docs/ARCHITECTURE.md), [API integration](docs/API_INTEGRATION.md), [Domain model](docs/DOMAIN_MODEL.md), and [MVP status](docs/MVP_STATUS.md).

## Best next backend step

Create the authenticated learner-state API first: session identity, user goal/preferences, progress, attempts, and entitlement. That replaces the largest shared mock boundary and enables secure question and payment integrations afterward.
