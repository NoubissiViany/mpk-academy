# Guided question feedback — November 11, 2026

Assessment, practice, the homepage sample and lesson checkpoints now use **Next → correction → Continue**. Corrections show the learner’s answer, full correct answer and explanation in English or French. Lesson checkpoints appear sequentially beneath the lesson content. The final correction leads to writing, results or lesson completion. Timed mocks still withhold corrections until completion; productive-skill feedback retains explicit requests and consent.

## Recovery and scoring

- Diagnostic drafts retain schema version 1 with optional `checkedAnswers` and `intake.feedbackMode: "guided"`. Existing drafts keep their answers, writing, position, shuffled order, attempt ID and expiry; existing answers start unchecked.
- A first submitted answer is durably saved before any diagnostic correction is requested. Failed saves/checks preserve it and offer retry. Feedback is reconstructed on the server from checked markers after refresh or on another device; answer keys are not part of draft storage or static client bundles.
- Browser drafts move from `mpk-academy:diagnostic-draft:v1` to `mpk-academy:diagnostic-draft:v2`, retaining the original Web Lock name. Import writes the new copy before removing the matching old copy. Failed import retains the old work. This prevents older open tabs from overwriting new checked markers.
- Authenticated drafts stay in Supabase. Revision-checked ordinary saves cannot remove markers, change checked answers or reorder their question content. A confirmed browser/account choice uses the separate atomic replacement RPC, retaining browser work until replacement succeeds.
- Final scoring uses first submitted answers. Guided results carry an explicit label and explain that the live tally describes this attempt, not proficiency improvement. Retry submission IDs, required writing and atomic matching-draft cleanup are retained.
- Feedback includes text and icons alongside color, a status role, mobile scrolling, and keyboard focus on the next question. See the W3C guidance on [status messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages) and [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color).

## Release order

Production is Supabase project **`uhbuvskmiojqjegpuuln`**, serving **`mpkacademy.com`** through the existing Vercel project. The repository’s default Supabase link is staging and must not be used implicitly.

Apply `20261111000100_guided_assessment_feedback.sql` before the matching application release. It changes functions only: checked-draft validation, immutable saves, an authenticated-only replacement RPC, and guards on the historical submission path. It preserves existing learner rows and access rules.

The production preflight found all 32 preceding migrations already applied and only this migration pending. All nine inspected deployed draft/submission function bodies matched repository predecessors. Both existing account drafts passed the new validation. Owner-only reads and restricted writes were verified; aggregate counts and opaque fingerprints were captured before migration.

If the application must be rolled back, retain this additive migration. Older code can continue unmarked account drafts. Newly guided drafts must be resumed with this release or a compatible newer release: old clients cannot erase their checked markers, and old browser code cannot read the new storage key. Do not downgrade or delete saved drafts to make a rollback appear compatible.

## Validation

The fresh PostgreSQL 15 UTF8 migration run applied all 33 migrations and passed all 12 rollback-only assertion suites. New assertions cover account isolation, malformed drafts, locked answers/order, conflicting revisions, atomic replacement, expiry, writing requirements, first-answer scoring and submission retries.

- Full application suite: **461 tests in 70 files passed**. The final action-label and localized answer-display checks passed a further targeted 27 tests.
- Typecheck, lint, formatting, content validation and the beta production build passed. The client-bundle check found none of 1,022 protected content strings in 81 browser files.
- Beta browser suite against the isolated production build: **24 passed, 8 intentional mode/device skips**, covering English/French desktop/mobile recovery, old-draft migration, correction visibility/focus, a rejected network request and retry, writing storage failures, navigation and signup/access behavior.
- Desktop English and mobile French screenshots were reviewed; neither had horizontal overflow.
- Paid-mode production build and client-bundle check passed. Paid-mode browser suite: **26 passed, 6 intentional mode/device skips**. Existing prices, authenticated checkout, and guest registration handoff remain covered.

## Production migration

`20261111000100_guided_assessment_feedback.sql` was applied explicitly to `uhbuvskmiojqjegpuuln` before releasing application changes. A subsequent dry run reports no pending migrations. The API schema cache was refreshed.

The reviewed rollback-only `checked_diagnostic_feedback.assert.sql` passed against production. At **14:21:56 UTC**, all 12 table counts and fingerprints matched the preflight baseline, including both existing drafts. Synthetic database fixtures were rolled back. The repository’s staging link remains unchanged.

## Production application and verification

Vercel deployment **`dpl_6jKpKBtaAaZ5wVpDzGMbEskY9o7N`** was built successfully and promoted to [MPK Academy](https://www.mpkacademy.com) at approximately **14:34 UTC**, after the database migration and its assertions passed. The deployment URL is `https://mpk-academy-oow334xo5-noubissivianys-projects.vercel.app`. Existing hosting, invitation rules and beta configuration remain unchanged.

Authenticated browser checks on production passed all seven stages:

- Desktop sign-in, first correction, answer locking, Continue, refresh and revisiting a checked question.
- A separate mobile browser recovered the same question and option order, then restored the correction and tally in French after a language refresh.
- Writing recovered across devices; assessment submission displayed the guided label and atomically removed the submitted draft.
- Five practice corrections led to results and saved completion.
- Three sequential lesson checkpoints led to saved lesson completion.
- A timed mock advanced without displaying corrections or returning answer keys before completion.
- The dashboard loaded saved progress without browser exceptions, server errors or AI-feedback requests.

Temporary test accounts and their owned records were removed and cleanup was verified. No invitation, email or AI-feedback requests were sent. At **14:48:14 UTC**, the final production audit found **33 applied migrations**, **zero new application or learner-snapshot errors** since promotion, and **zero remaining test accounts**. All 12 learner-table counts and fingerprints still matched the preflight baseline. Owner-scoped draft reads and authenticated-only replacement remained enforced.
