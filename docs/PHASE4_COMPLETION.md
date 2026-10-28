# Phase 4 completion checklist

Status as of October 27, 2026. The [editorial review](CONTENT_REVIEW.md) approved all 183 remaining drafts under the owner's authorization: 44 corrected and 139 unchanged. The notes identify the reviewer as AI. No further teacher approval is required by the recorded gate for this batch; this does not establish calibrated difficulty or AI scoring accuracy.

The review is complete. The following implementation and release work remains. This checklist uses the repository's **cohort-one targets**; cohort-two expansion is subsequent work.

## 1. Merge the approved batch and finish diagnostic v3

- [ ] Run `npm run content:accept` on the release branch. All 183 reviewed drafts now qualify: 176 rewrites and seven new questions. Preserve the 30 earlier merges and all historical IDs.
- [ ] Confirm 213 total merged drafts, a 256-item catalog, 24 unique lessons, 26 diagnostic questions, and 12 TEF reading practice questions. The reviewed-candidate simulation passes with zero short-document debt and zero recorded answer-length bias exceptions.
- [ ] Verify the 26-question diagnostic flow, listening availability, result counts, guest registration handoff, authenticated submission and server/guest scoring parity. Existing grammar and vocabulary items remain part of the diagnostic.

**Done when:** the approved text is in the catalog, validation passes and the expanded diagnostic works throughout the learner flow. This review alone has not changed the current 249-item catalog or 20-question diagnostic.

## 2. Generate audio and synchronize scoring data

```bash
npm run content:audio -- --dry-run
npm run content:audio
npm run content:sql
npm run validate:content
```

- [ ] Review the inventory before synthesis. The current candidate merge predicts **91 clips**: 79 mock recordings, eight diagnostic recordings and four practice recordings. This includes 87 replacements and four new clips; the expected manifest grows from 120 to 124 clips, with 45 public and 79 private.
- [ ] Generate every clip from the final transcript. Verify files, voice assignments, playback and measured durations. In particular, actual mock recordings must leave the required answer time; the review checks estimated timing only.
- [ ] Require zero pending clips. If Azure fails, retain accurate pending status and rerun for unfinished clips; do not label the release ready prematurely.
- [ ] Generate a new additive content-sync migration after audio is complete, refresh summaries and the lock, and preserve both existing pending migrations and all historical migrations.

**Done when:** transcript fingerprints, audio files, source summaries, scoring SQL and the content lock agree, with no pending recordings.

## 3. Release to staging, then production

The owner runs hosted database pushes. The CLI is currently linked to staging. Production configuration was not available during the earlier preparation and must be supplied and verified separately.

```bash
# Staging, using .env.local
npm run content:upload-mock-audio -- --check
npm run content:upload-mock-audio
npm run content:upload-mock-audio -- --check

# Production, using its own credentials
npm run content:upload-mock-audio -- --check --env .env.production.local
npm run content:upload-mock-audio -- --env .env.production.local
npm run content:upload-mock-audio -- --check --env .env.production.local

# Owner runs these separately against each verified project link
npx supabase db push --dry-run
npx supabase db push
```

After regeneration, the first bucket check may report missing files; upload them and require the second check to pass. The previous staging result of 79/79 verified the **old** mock filenames. All 79 rewritten mock recordings need their newly referenced files checked in each target bucket. Keep old objects while an older app deployment may still use them. Production credentials stay outside version control.

- [ ] Verify the target project before every upload or database push. Complete staging deployment and verification before repeating for production.
- [ ] Verify the private bucket **before applying audio-ready migrations**. The earlier staging dry run listed `20261024000100` and `20261028000100` as pending; a later merge adds another content migration. Rerun the inventory immediately before pushing rather than relying on this historical result.
- [ ] Apply reviewed migrations before deploying the corresponding application source. If merging to `main` automatically deploys production, complete the production database step first.
- [ ] Run content/SQL checks, formatting, lint, types, unit tests, then the production build and client-bundle check sequentially. Run isolated desktop/mobile browser tests in beta and paid modes, and PostgreSQL 17 migration assertions plus diagnostic parity.
- [ ] With an entitled tester, verify practice listening, a full mock, private playback, single-play authorization, scoring and results. These hosted checks require the target environment, unlike isolated guest smoke tests.

**Done when:** both environments serve the matching content/audio and score it correctly. No upload, hosted push or deployment was performed as part of this editorial review.

## 4. Implement the diagnostic writing sample

The status documents defer a **model C writing sample** until diagnostic v3. They do not specify its complete prompt, timing or assessment flow.

- [ ] Define the prompt, expected length/time, optionality, feedback eligibility, and how the sample contributes to the provisional diagnostic result.
- [ ] Implement the sample with the existing consent, server-owned submission and AI-feedback limits. Define guest-to-account handoff and pending/failed-feedback behavior explicitly.
- [ ] Validate EN/FR instructions, accessible input, persistence, permissions, quota handling and feedback recovery before deployment.

**Owner input needed:** agree the learner-facing writing-sample specification. Its implementation is a separate feature task, not completed by merging the 16 diagnostic drafts.

## 5. Reach the cohort-one content targets

The quantities below assume all currently approved drafts are merged. They count **practice** content; mock and diagnostic items do not fill these targets.

| Content             | TEF after merge | TEF target | TEF remaining | TCF after merge | TCF target | TCF remaining |
| ------------------- | --------------: | ---------: | ------------: | --------------: | ---------: | ------------: |
| Reading questions   |              12 |         60 |            48 |              10 |         60 |            50 |
| Listening questions |              10 |         60 |            50 |              10 |         60 |            50 |
| Writing tasks       |               4 |         10 |             6 |               6 |         10 |             4 |
| Speaking tasks      |               4 |         10 |             6 |               6 |         10 |             4 |
| Available lessons   |              17 |         25 |             8 |              17 |         25 |             8 |

- [ ] Add the remaining questions and tasks, with original documents, suitable level/competency coverage, bilingual teaching text and required audio.
- [ ] Bring every lesson to **3–5 checkpoints**; existing lessons currently have one. Shared lessons can count toward both exams, so the two lesson gaps are not necessarily 16 distinct new lessons.
- [ ] Review each new batch under the normal content policy, validate it and release matching audio and scoring data. The owner-authorized AI approval of these 183 drafts is a recorded batch exception, not a silent change to future review requirements.

**Done when:** validation reports all cohort-one targets reached, checkpoint coverage is complete, and the added content has been released successfully.

## 6. Complete the separate AI-calibration dependency

Content approval does not calibrate AI feedback. This is outstanding work from Phases 2–3 that should remain visible alongside the Phase 4 checklist.

- [ ] With learner permission, collect 40 writing samples across both exams and all targets. Have a qualified teacher grade task fulfilment, coherence, vocabulary and grammar without seeing AI levels.
- [ ] Report exact agreement and agreement within one level. The existing operations target is at least 60% exact and 90% within one level for each criterion; store aggregate results and findings, not identifiable learner work, in the repository.
- [ ] Arrange a separate teacher-rated speaking sample and define its sample size and acceptance criteria before claiming calibrated speaking levels. Do not treat transcript feedback as a pronunciation assessment.
- [ ] Adjust prompts or thresholds where disagreement is systematic, then evaluate again and retain provisional labels until calibration supports stronger claims.

See [AI operations](AI_OPERATIONS.md#calibration-before-trusting-the-levels) for the existing calibration procedure.

## What the owner needs to do next

1. Schedule the approved-content merge/audio/release task; the reviewed batch has no remaining approval blockers.
2. Supply and verify production environment configuration, then personally review and run each hosted database push at the appropriate release step.
3. Agree the diagnostic writing-sample specification and schedule the remaining content expansion.
4. Arrange consented learner samples and independent teacher ratings for calibration.

Finishing this draft review clears the review queue. Phase 4 itself remains open until its content, diagnostic writing feature and deployment milestones above are complete; calibration remains a separate accuracy dependency.
