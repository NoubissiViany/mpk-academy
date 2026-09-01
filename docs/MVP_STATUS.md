# MVP Status

| Feature | Frontend | Mock | Backend Required | Status |
|---|---:|---:|---:|---|
| Marketing and pricing | Yes | Content | Optional CMS | Complete |
| Diagnostic | Yes | Questions + scoring | Secure questions/scoring | Complete (mock) |
| Authentication | Yes | Local session | Yes | Complete (mock) |
| Dashboard | Yes | Learner evidence | Yes | Complete (mock) |
| Lessons and course | Yes | Content + progress | Content/progress API | Complete (mock) |
| Practice | Yes | Questions + attempts | Secure scoring/persistence | Complete (mock) |
| Exam simulation | Yes | Timer + questions + scoring | Secure delivery/scoring | Complete (mock) |
| Weakness tracking | Yes | Mistakes | Learner analytics API | Complete (mock) |
| Readiness | Yes | v1 deterministic rule | Server calculation | Complete (mock) |
| Recommendations | Yes | Deterministic rules | Recommendation service | Complete (mock) |
| Checkout | Yes | Outcome + entitlement | Hosted payment + webhooks | Complete (mock) |
| Certificate | Yes | Eligibility + print | Server issue/verification | Complete (mock) |
| Localization | English/French | Dictionaries | Optional translation CMS | Complete |

The frontend is not responsible for real authorization, payment verification, persistent learner records, or secure external API access. Those capabilities must be implemented server-side.
