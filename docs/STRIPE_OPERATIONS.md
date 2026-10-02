# Stripe Checkout Operations

MPK Academy uses Stripe-hosted Checkout for one-time CAD payments. Stripe
confirms the payment; Supabase remains the source of truth for time-limited
course access.

## Account authentication

Use browser-approved Stripe CLI authentication. Do not paste Stripe secrets in
chat, shell arguments, tickets, or committed files.

```bash
npx @stripe/cli login
stripe get /v1/account
```

Before creating resources, compare the returned account ID and business name
with the intended MPK Stripe account. Stripe CLI uses test mode by default;
append `--live` only during the production promotion step.

## Products, prices, and tax

Create a separate Product and one-time Price for every plan in both test and
live mode:

| Plan      | Customer subtotal | Target after standard fee | Access   | Environment variable     |
| --------- | ----------------: | ------------------------: | -------- | ------------------------ |
| Essential |             12286 |                     11900 | 3 months | `STRIPE_PRICE_ESSENTIAL` |
| Complete  |             25675 |                     24900 | 6 months | `STRIPE_PRICE_COMPLETE`  |
| Intensive |             35973 |                     34900 | 6 months | `STRIPE_PRICE_INTENSIVE` |

Amounts are minor CAD units. The customer subtotals include the assumed
standard Canadian domestic-card fee of 2.9% plus CAD 0.30. They are the
smallest cent values for which
`gross - round(gross * 0.029) - 30 >= target`. Confirm the account's actual
pricing before creating Prices; international cards, currency conversion,
custom pricing, refunds, and disputes can produce a different net amount.

Every Price must use:

- `currency=cad`
- `tax_behavior=exclusive`
- one-time billing (no `recurring` value)
- a stable lookup key such as `mpk_essential_cad_one_time`

Every Product must include `plan_id`, `access_months`,
`target_net_amount_minor`, `fee_percentage_bps=290`, and
`fee_fixed_amount_minor=30` metadata. Use the
Stripe tax code whose current name is **General - Electronically Supplied
Services** (`txcd_10000000` at the time of setup) only after retrieving it and
confirming that description still matches MPK's self-paced digital course:

```bash
stripe tax_codes retrieve txcd_10000000
```

Example test-mode catalog commands:

```bash
stripe post /v1/products \
  -d name="MPK Academy - Essential" \
  -d tax_code=txcd_10000000 \
  -d "metadata[plan_id]"=essential \
  -d "metadata[access_months]"=3 \
  -d "metadata[target_net_amount_minor]"=11900 \
  -d "metadata[fee_percentage_bps]"=290 \
  -d "metadata[fee_fixed_amount_minor]"=30

stripe post /v1/prices \
  -d currency=cad \
  -d unit_amount=12286 \
  -d product=prod_REPLACE_WITH_PRODUCT_ID \
  -d tax_behavior=exclusive \
  -d lookup_key=mpk_essential_cad_one_time
```

Repeat with the exact Complete and Intensive values above. Repeat the complete
catalog procedure with `--live` only after test-mode acceptance. Product and
Price IDs are different between modes.

Do not create a separate processing-fee line. The configured Price is the
customer-facing one-time plan subtotal, with applicable tax added by Stripe.

Stripe Tax must show an active business origin and the owner's legally correct
registrations before live Checkout is enabled. Stripe calculates and collects
tax only where the account has an active registration; MPK remains responsible
for registration, filing, and remittance.

## Local test configuration

Set these uncommitted values in `.env.local`:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ESSENTIAL=price_...
STRIPE_PRICE_COMPLETE=price_...
STRIPE_PRICE_INTENSIVE=price_...
```

Forward only the events used by MPK. The listener prints a temporary `whsec_`
value for `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,charge.refunded \
  --forward-to http://localhost:3000/api/stripe/webhook
```

Never expose the Stripe secret, webhook secret, or Supabase service-role key
with a `NEXT_PUBLIC_` prefix.

## Hosted sandbox

Use a dedicated Supabase staging project for both localhost and the hosted
sandbox. Apply all migrations to it and allow the localhost Auth callback URLs
plus the stable sandbox alias. Do not use production learner data for tests.

MPK's isolated test environment is:

- Supabase project: `mpk-academy-staging` (`czbynijgpkflnntgoqgj`)
- Vercel project: `mpk-academy-sandbox`
- Stable URL: `https://mpk-academy-sandbox.vercel.app`
- Stripe test webhook: `we_1ULCh1K7samCec2AkAsjWfSp`

The sandbox is a separate Vercel project. Its Production environment is still
a Stripe **test-mode** environment and must contain the staging Supabase public
URL, publishable key, and service-role key, plus:

```text
NEXT_PUBLIC_APP_URL=https://mpk-academy-sandbox.vercel.app
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_HOSTED_TEST_ENDPOINT
STRIPE_PRICE_ESSENTIAL=price_1ULCWmK7samCec2AWMNcenZP
STRIPE_PRICE_COMPLETE=price_1ULCWnK7samCec2AggvKSOnm
STRIPE_PRICE_INTENSIVE=price_1ULCWoK7samCec2Ao7cMp4AO
```

Register
`https://mpk-academy-sandbox.vercel.app/api/stripe/webhook` as a Stripe
test-mode webhook for the same three production events. The hosted endpoint
secret is not interchangeable with the secret printed by `stripe listen` for
localhost.

Test cards are valid only with test-mode keys. Never add a test-payment bypass
to the production deployment and never attempt a Stripe test card against live
keys.

When an automated browser opens Stripe Checkout, Stripe may require an AI-agent
disclosure and offer Link CLI for one-time payment details. Follow the prompt;
never bypass it or provide a real card number to automation.

## Database release

The Stripe fulfillment migration must be present before payment code is
deployed. Review pending changes before applying them:

```bash
npx supabase db push --dry-run
npx supabase db push
```

The restricted `mpk_fulfill_stripe_purchase` function validates the trusted
CAD amount and grants three or six calendar months from the verified
PaymentIntent timestamp. Replayed fulfillment is idempotent. A partial refund
retains access; a full refund revokes it.

## Production webhook and Vercel

Create the live endpoint before adding all production values to Vercel. The
endpoint creation response contains its signing secret only once.

```bash
stripe post /v1/webhook_endpoints --live \
  -d url=https://mpk-academy.vercel.app/api/stripe/webhook \
  -d "enabled_events[0]"=checkout.session.completed \
  -d "enabled_events[1]"=checkout.session.async_payment_succeeded \
  -d "enabled_events[2]"=charge.refunded \
  -d description="MPK Academy production fulfillment"
```

Authenticate and link Vercel through its browser flow, then add each value
interactively so it does not appear in shell history:

```bash
npx vercel login
npx vercel link
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add STRIPE_PRICE_ESSENTIAL production
npx vercel env add STRIPE_PRICE_COMPLETE production
npx vercel env add STRIPE_PRICE_INTENSIVE production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add NEXT_PUBLIC_APP_URL production
npx vercel --prod
```

Set `NEXT_PUBLIC_APP_URL` to `https://mpk-academy.vercel.app`. Retain the
existing public Supabase URL and publishable key.

## Acceptance and live release

1. Locally and on the hosted sandbox, complete Essential, Complete, and
   Intensive purchases with separate test learners.
2. Confirm the subtotal, calculated tax, one purchase, one entitlement, and
   exact three- or six-month `ends_at` value.
3. Cancel Checkout and retry; the retry must open a new usable Session.
4. Replay the completion event; no purchase or entitlement may be duplicated.
5. Issue a partial refund, then a full refund; only the full refund revokes
   access.
6. Promote the verified catalog, webhook, and environment values to live mode.
7. Open and inspect a live Essential Checkout Session for CAD 122.86 plus tax,
   but do not submit the payment unless a real-charge test is separately
   approved. Never use a test card in live mode.
8. Confirm Stripe reports successful webhook delivery and that application
   logs contain no credentials.

## Rotation and rollback

- Rotate a secret by creating/revealing the replacement, updating Vercel, and
  redeploying before revoking the old value.
- Price amounts and tax behavior are immutable. Create a replacement Price,
  update the matching environment variable, deploy, and archive the old Price.
- To stop new payments immediately, remove or replace `STRIPE_SECRET_KEY` in
  Vercel and redeploy. Do not delete purchase or entitlement history.
- If webhook processing regresses, roll back the application deployment while
  leaving the endpoint enabled; Stripe retries failed deliveries.
