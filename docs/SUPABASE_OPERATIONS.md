# Supabase Operations

## Hosted project

- Organization: `NoubissiViany's Org` (`otnxgfnmgvxcrswbbrds`)
- Staging and the usual CLI link: `mpk-academy-staging` (`czbynijgpkflnntgoqgj`), serving `mpk-academy-sandbox.vercel.app`
- Production: `mpk-academy` (`uhbuvskmiojqjegpuuln`), serving `mpkacademy.com` and `mpk-academy.vercel.app`. It is active and configured.
- November 26 study-reminder release: production has all **35** repository migrations through `20261126000200`. Preferences were initialized for 13 accounts. Sending is **enabled** after the controlled email was delivered and webhook/unsubscribe checks passed; the scheduler runs every 15 minutes and regular delivery begins at 18:00 in each learner's time zone. Budgets remain 50/day and 1,500/month. Authentication SMTP is unchanged. See [reminder rollout status](STUDY_REMINDERS.md#november-26-2026-rollout-status).
- November 11 guided-feedback release (UTC): production has all **33** repository migrations through `20261111000100`. The migration was applied before the matching application release; hosted assessment recovery, practice, lessons and dashboard checks passed with no new snapshot failures. See [the guided-feedback release record](GUIDED_FEEDBACK_RELEASE.md#production-application-and-verification). The usual CLI link remains staging.
- November 4 recovery (UTC): production has all 32 repository migrations through `20261104000200`, including the October 30 content additions, November 2 writing/presentation changes, and November 4 assessment recovery/learning continuity changes. The eight pending migrations were applied in timestamp order to restore learner snapshots. See [the production recovery record](UX_RECOVERY_RELEASE.md#production-recovery--november-4-2026). The usual CLI link remains staging; this recovery did not migrate staging.
- The October 30 audit verified all 79 required clip names in both private mock buckets. The older [Phase 4 checklist](PHASE4_COMPLETION.md#2-release-the-current-content-changes) is historical; check current migration history before planning another push.
- Database password: GNOME Login keyring item `MPK Academy Supabase database`

Free projects pause after a week without traffic. Before pointing a deployment at the database, confirm `npx supabase projects list` shows it as `ACTIVE_HEALTHY` and `supabase/.temp/project-ref` matches `NEXT_PUBLIC_SUPABASE_URL`.

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

Supabase Auth sends confirmation, sign-in code and password-reset emails through Resend SMTP from `MPK Academy <no-reply@mpkacademy.com>`. Authentication delivery stays in Supabase; the application's Resend SDK is used only for study reminders.

Never place the **authentication SMTP Resend key** in this repository, application environment variables, Vercel, documentation, screenshots, or support logs. Study reminders use a separate server-only sending key in the same Free account; see [Study reminder operations](STUDY_REMINDERS.md). Keep the SMTP credential and configuration unchanged.

### 1. Verify mpkacademy.com in Resend

Resend's free plan allows one domain, 100 emails a day, and 3,000 a month, which covers the closed beta. `mpkacademy.com` was added in Resend → Domains, and its records live in Namecheap → Domain List → `mpkacademy.com` → Advanced DNS (enter only the host part):

| Type  | Host                | Value                         |
| ----- | ------------------- | ----------------------------- |
| CNAME | `send`              | `send.forge.rmta.net`         |
| TXT   | `resend._domainkey` | the `p=…` key shown by Resend |
| TXT   | `_dmarc`            | `v=DMARC1; p=none;`           |

The `send` CNAME delegates the bounce MX and SPF to Resend's sending servers, so no MX record is added in Namecheap and **Mail Settings stays on Email Forwarding**: the root `@` MX and SPF records keep serving `@mpkacademy.com` forwarding and must not be merged with Resend's. If Resend ever shows MX and TXT records for `send` instead, adding that MX requires Namecheap's **Custom MX** mode, which removes the forwarding MX records on `@`; re-add `eforward1`–`eforward3.registrar-servers.com` (priority 10), `eforward4` (15), and `eforward5` (20) in the same save.

Check propagation without leaving the terminal, then press **Verify** in Resend:

```bash
dig +short CNAME send.mpkacademy.com
dig +short TXT resend._domainkey.mpkacademy.com
dig +short TXT _dmarc.mpkacademy.com
dig +short MX mpkacademy.com   # forwarding records still listed
```

Once DMARC reports show no legitimate failures for a few weeks, tighten it to `p=quarantine`.

### 2. Switch the Supabase sender

Only after Resend shows the domain as **Verified**, open Supabase Dashboard → Authentication → Emails → SMTP Settings and keep custom SMTP enabled with:

- Sender email: `no-reply@mpkacademy.com`
- Sender name: `MPK Academy`
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: a Resend API key with **Sending access** restricted to `mpkacademy.com`, entered only in this dashboard field

Switching the sender before verification makes every confirmation email fail. The commented `[auth.email.smtp]` block in `supabase/config.toml` documents the same values without storing the secret.

### 3. Templates and language

`supabase/templates/confirmation.html`, `recovery.html`, and `magic_link.html`, and their subjects in `supabase/config.toml`, branch on `.Data.locale` — the user metadata set at sign-up and kept in step by the profile language setting. Anything other than `fr` receives English. The magic-link/OTP body displays the actual `.Token`; confirmation and recovery retain their existing token-hash callbacks.

These templates share the reminder layout in `src/lib/email/layout.ts`. After changing the shell or authentication copy, regenerate the HTML with Node 22.18 or later:

```bash
node --experimental-strip-types scripts/email/generate-templates.mjs
```

For hosted template bodies use the [Supabase Management API](https://supabase.com/docs/guides/auth/auth-email-templates#editing-email-templates), `PATCH /v1/projects/<explicit-project-ref>/config/auth`. Include only `mailer_templates_confirmation_content`, `mailer_templates_recovery_content`, `mailer_templates_magic_link_content` and their corresponding `mailer_subjects_*` fields. Read the files as strings and serialize a JSON object; never interpolate HTML into shell commands. Verify the saved bodies exactly match the local files. The installed CLI's configuration diff reports subject changes but does not compare the HTML body files, so a clean CLI diff alone is insufficient. Preserve SMTP, OTP settings, Site URL, redirect URLs and all other authentication configuration.

On November 26 the three bilingual authentication templates were published and read back successfully, alongside the reminder redesign. Only those template/subject fields and Supabase's derived “custom contents” flags changed. The existing authentication settings and SMTP credential were preserved. The common design uses table layouts, inline fallback styles, a readable mobile OTP panel, and optional dark-mode styles; 84 browser combinations passed at 320/390/1440 pixels in both languages and themes. Actual email clients may apply their own dark-mode transformations.

The versioned target rate is 30 authentication emails per hour. Increase it only after checking provider quotas and abuse protection. Keep **Confirm email** enabled, keep the production Site URL at `https://mpk-academy.vercel.app`, and retain these redirect URLs:

- `https://mpk-academy.vercel.app/auth/confirm`
- `https://mpk-academy.vercel.app/update-password`
- the versioned localhost confirmation and password-reset URLs

### 4. Acceptance test

Register with a brand-new external inbox (Gmail and Outlook if possible) once with the interface in English and once in French. Confirm that exactly one message arrives from `MPK Academy <no-reply@mpkacademy.com>`, in the right language, outside the spam folder, with `dkim=pass`, `spf=pass`, and `dmarc=pass` under "Show original". Its link must return through `/auth/confirm` with a valid session, and a direct registration must continue to `/diagnostic`. Test the one-minute resend throttle and password recovery, then compare failures in Resend delivery logs and Supabase Auth logs.

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
