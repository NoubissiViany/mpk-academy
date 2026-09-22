# Supabase Operations

## Hosted project

- Organization: `NoubissiViany's Org` (`otnxgfnmgvxcrswbbrds`)
- Project: `mpk-academy` (`uhbuvskmiojqjegpuuln`)
- Region: Canada Central (`ca-central-1`)
- Plan at creation: Free
- Database password: GNOME Login keyring item `MPK Academy Supabase database`

The repository stores only the public project URL and publishable key in the ignored `.env.local`. Never add a secret/service-role key to this application.

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

Review every configuration diff. Set the production `site_url` and add exact production confirmation/recovery redirect URLs before deployment. The current values are intentionally localhost-only.

Custom confirmation and recovery templates are versioned under `supabase/templates`, but Supabase's default email provider does not permit template customization on this Free project. The application therefore supports the default provider's PKCE `code` callback today. Configure custom SMTP before enabling the custom templates; do not upgrade solely to bypass this during development.

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
