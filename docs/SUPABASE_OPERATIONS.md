# Supabase Operations

## Hosted project

- Organization: `NoubissiViany's Org` (`otnxgfnmgvxcrswbbrds`)
- Project: `mpk-academy` (`uhbuvskmiojqjegpuuln`)
- Region: Canada Central (`ca-central-1`)
- Plan at creation: Free
- Database password: GNOME Login keyring item `MPK Academy Supabase database`

The browser receives only the public project URL and publishable key. Stripe fulfillment also requires a service-role key in server-only deployment secrets; never commit it, prefix it with `NEXT_PUBLIC_`, or import the admin client into browser code.

## Safe change workflow

```bash
npx supabase db lint --local --schema public,private --fail-on error
npx supabase test db
npx supabase db push --dry-run
npx supabase db push
npx supabase config diff
npx supabase config push
npx supabase gen types typescript --linked
```

Review every configuration diff. The versioned production `site_url` is `https://mpk-academy.vercel.app`; its confirmation and recovery paths are allow-listed alongside local development callbacks.

Custom confirmation and recovery templates are versioned under `supabase/templates`, but Supabase's default email provider does not deliver production mail to arbitrary learner addresses. The application supports the default provider's PKCE `code` callback for development, but custom SMTP is required before a production signup test.

## Production authentication email

In Supabase Dashboard → Authentication → Email/SMTP, enable custom SMTP and provide the host, port, username, password, sender address, and sender name supplied by the selected transactional-email provider. The sender domain must have passing SPF and DKIM records; add DMARC before launch. Use a sender such as `auth@mpk-academy.ca`, not a personal mailbox.

The versioned target rate is 30 authentication emails per hour. Increase it only after checking provider quotas and abuse protection. Keep **Confirm email** enabled, keep the production Site URL at `https://mpk-academy.vercel.app`, and retain these redirect URLs:

- `https://mpk-academy.vercel.app/auth/confirm`
- `https://mpk-academy.vercel.app/update-password`
- the versioned localhost confirmation and password-reset URLs

After saving SMTP settings, test with a brand-new external address. Confirm one message arrives, its link returns through `/auth/confirm`, and the browser receives a valid session. Auth failures are logged without email addresses, passwords, or tokens and include the same correlation reference shown in the UI.

The commented `[auth.email.smtp]` block in `supabase/config.toml` documents the CLI equivalent. Do not enable it until `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_ADMIN_EMAIL` are available in the secure deployment environment.

## Free-plan monitoring and upgrade thresholds

Check Organization Billing and each project's Usage page monthly. The starting Free allowances are 500 MB database size, 50,000 monthly active users, and 5 GB egress, with up to two active projects. Treat 70% sustained usage in any metered category as the planning threshold and 85% as the upgrade/export threshold.

Free projects can pause after inactivity and do not provide the paid automatic-backup guarantees. Before a launch, campaign, demo, or exam cohort:

1. Open the project dashboard at least one business day beforehand and confirm it is active.
2. Run the hosted schema lint and a sign-in/read smoke test.
3. Confirm Auth email delivery and rate limits.
4. Review database size, egress, and monthly active users.

Upgrade the existing organization—not the schema—when predictable uptime, automatic backups, larger quotas, custom email requirements, or production support justify it.

## Exports and recovery

Create regular logical exports while on Free, especially before migrations:

```bash
npx supabase db dump --linked --file mpk-schema.sql
npx supabase db dump --linked --data-only --use-copy --file mpk-data.sql
```

Store exports encrypted outside the repository and test restoration in a separate local database. Never commit dumps containing learner data. The migration directory is the source of truth for schema reconstruction; exports cover recovery of learner records.
