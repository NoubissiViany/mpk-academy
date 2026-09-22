# Stripe Checkout Operations

## Products and prices

Create three one-time CAD Prices with exclusive tax behavior:

| Plan      | Amount | Vercel variable          |
| --------- | -----: | ------------------------ |
| Essential |   $119 | `STRIPE_PRICE_ESSENTIAL` |
| Complete  |   $249 | `STRIPE_PRICE_COMPLETE`  |
| Intensive |   $349 | `STRIPE_PRICE_INTENSIVE` |

Enable Stripe Tax and complete the business origin and tax-registration setup before accepting live payments. Checkout enables automatic tax and adds applicable tax to the displayed plan price.

## Deployment secrets

Set these as server-only Vercel secrets for Production and the test environment used for payment validation:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ESSENTIAL`
- `STRIPE_PRICE_COMPLETE`
- `STRIPE_PRICE_INTENSIVE`
- `SUPABASE_SERVICE_ROLE_KEY`

Set `NEXT_PUBLIC_APP_URL=https://mpk-academy.vercel.app` and retain the existing public Supabase URL and publishable key. Never expose the Stripe secret, webhook secret, or Supabase service-role key with a `NEXT_PUBLIC_` prefix.

## Webhook

Register `https://mpk-academy.vercel.app/api/stripe/webhook` for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`

The handler verifies Stripe signatures and re-reads Checkout Sessions before fulfillment. Database functions validate CAD amounts, create a single entitlement per purchase, and revoke it only after a full refund. Partial refunds retain access.

## Release check

1. Apply Supabase migrations and Auth configuration before deploying the payment code.
2. Validate registration and email confirmation on the production origin.
3. In Stripe test mode, purchase each plan, replay the success webhook, and confirm only one purchase and entitlement exist.
4. Test a partial refund and a full refund; only the full refund should revoke access.
5. Replace test Price IDs and secrets with live values, register the live webhook endpoint, deploy, and repeat a low-value live smoke test before launch.
