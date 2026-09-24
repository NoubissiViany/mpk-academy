# Future API Integration

## Authentication

Replace `AuthRepository` and `UserRepository` with a server-backed session provider. Protect student routes and repository endpoints on the server. Never trust the mock `tier` value from browser storage.

## MPK learner backend

Expose authenticated endpoints for profile, goal, preferences, progress, attempts, mistakes, activities, recommendations, readiness evidence, and certificate eligibility. Use idempotency keys for session submission and optimistic concurrency for progress writes.

## Course and content

Implement `CourseRepository` against a versioned content API. Return normalized modules and lessons or map CMS DTOs in the adapter. Rich learner-supplied HTML is intentionally unsupported; sanitize future rich content on the server.

## Question provider

Implement an adapter that maps provider-specific question, media, and competency fields into the internal `Question` union. Active production assessments should receive a challenge DTO without `correctAnswer`; submit answers to the server for scoring. Proxy credentials and licensed media through trusted infrastructure.

## Payments

Stripe-hosted Checkout creates one-time payment sessions on the server. A signed webhook is the primary fulfillment path; the authenticated success route retrieves the session from Stripe as an idempotent fallback. Restricted database functions atomically create purchases and entitlements. Never grant access from URL parameters or client state.

## Progress and analytics

Write attempts and completed activities through the learner backend, then recalculate aggregate competencies and readiness server-side. Analytics should avoid answers and personal data, respect consent, and use stable anonymous event names.

## Environment boundaries

Only non-sensitive values may use `NEXT_PUBLIC_`. Auth secrets, provider credentials, webhook secrets, answer keys, and privileged base URLs remain server-only.
