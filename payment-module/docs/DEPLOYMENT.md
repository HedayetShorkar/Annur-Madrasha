# Deployment — staging first

For the **current manual receipt desk**, use `../../RECEIPT_DESK_UPDATE.md` and the existing Node administrator service. The Supabase setup below is for the future online subsystem. Do not enable the online build flag before consolidating manual claims into the payment ledger; these stores currently do not synchronize.

## 1. Supabase and authentication

Use a dedicated staging Supabase project first. Install the Supabase CLI on your workstation. From `payment-module/`:

```sh
npm ci
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Do not point test/bootstrap SQL at production. The migration expects Supabase's existing `auth.users`, `auth.uid()`, `anon`, `authenticated` and `service_role` roles. It creates no default administrator and does not modify existing site data.

Enable email/password authentication and email confirmations. Configure your SMTP provider, Site URL and allowed redirect URL `https://YOUR_DOMAIN/payments/index.html`. Set appropriate auth signup limits, password policy (UI minimum 12 characters), and anti-abuse protections. Payer accounts belong to responsible adults/guardians; student admission ages remain 5–18 in the existing site. Never grant roles using editable `user_metadata`.

Create/verify the finance operator's Auth account, then bootstrap the first finance admin in the trusted SQL console:

```sql
insert into public.payment_admins(user_id)
values ('REPLACE_WITH_VERIFIED_ADMIN_USER_UUID'::uuid);
```

The literal placeholder is intentionally not a runnable UUID. All future admin grants/removals must be controlled through the SQL console and are audited. Admins cannot approve their own payments.

## 2. Receiving accounts and SMS configuration

Use `docs/provisioning.example.sql` as a template, filling only real approved account details. Choose the correct provider-specific transfer instruction for your actual receiving account; the software does not guess whether a transfer should be Send Money or Merchant Payment.

Keep accounts/devices/patterns disabled until sample verification and end-to-end staging tests succeed. Add actual verified incoming-credit SMS samples and expected fields as described in `SMS_CONFIGURATION.md`. There are NO production SMS presets.

## 3. Edge functions and secrets

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Edge runtime. They are never exposed in React. Copy `supabase/.env.example` to a private, ignored local file and set:

- `ALLOWED_ORIGINS`: exact HTTPS origins, comma separated (no wildcard).
- `SMS_DEVICE_SECRETS`: JSON map of device/relay ID to a strong unique random secret. Generate 32 random bytes or more, e.g. with `openssl rand -hex 32`. Keep identical keys only on the trusted relay server and Edge secret store.

Do not paste secrets into source, chat, logs, URLs or `VITE_` variables. Configure the secret values via your secure environment or Supabase secret management. With the private env file:

```sh
supabase secrets set --env-file supabase/.env
supabase functions deploy payments
supabase functions deploy sms-webhook
```

Both functions set `verify_jwt=false` deliberately. `payments` independently validates every bearer JWT with `auth.getUser()` and requires confirmed email. `sms-webhook` accepts only signed relay requests. The flag does NOT make either endpoint an unauthenticated business operation. The checked-in import map pins the same Supabase package version as the tested application.

Enable platform/WAF request-size, request-rate and denial-of-service controls in front of the webhook as an additional perimeter. App limits are database-backed: 60 signed SMS requests/device/minute and 30 authenticated API requests/payer/minute. Invalid signatures cannot write ledger records. Do not log request bodies in the gateway/relay/Edge logging configuration.

## 4. Browser build and existing site

Copy `.env.example` to `.env.local`. Supply ONLY:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
```

The public publishable/anon key is intended for browser use; RLS protects the data. The build rejects privileged VITE_ variable names and keys other than a publishable key or an anon-role JWT. Never use the service-role key here.

```sh
npm run build
```

Output is the existing site's `payments/` directory. Deploy the website root (existing `index.html`, `assets/`, new `payments/`) to your HTTPS static host. For local source review, serve the website root with a static HTTP server. Retain `/payments/` as the app path; if deploying below a subdirectory, adjust Vite `base` and links together.

The delivered prebuilt output is intentionally unconfigured and cannot accept real payments. Rebuild after setting public environment variables. Do NOT deploy `payment-module/`, backups/checkpoints, `.env*`, `node_modules/`, tests or privileged source as public static assets. Deploy only the public website files; keep complete source ZIP private.

Recommended response headers for the payments path: `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'` via CSP. Test a CSP such as `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://YOUR_PROJECT.supabase.co; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`. Configure at your host; don't apply it blindly to the legacy site's inline scripts/styles/fonts.

## 5. Operator smoke test

1. Sign up/verify a payer and log in. Confirm no other user's invoices are visible.
2. Give the payer's displayed Auth user ID to the finance admin. Admin assigns a charge and due date.
3. Payer creates an invoice; confirm server amount and locked receiving number.
4. Use controlled staging evidence, never fabricated production credits. Test missing/fake/wrong/duplicate/delayed events.
5. Submit transaction details. SMS match must remain SMS_MATCHED, not paid.
6. Independently check the receiving account statement. Admin records a non-secret reference and reason; approve. Verify exactly one receipt and download the PDF.
7. Check denial cases: user cannot approve, admin cannot approve self, no-match or conflict cannot approve, unconfirmed invoice cannot download a receipt.
8. Run the multi-session test described below and inspect RLS/grants. Obtain user acceptance for the new module before live activation.

## 6. Tests

```sh
npm test
npm run check:edge
npm run build
```

`npm test` runs the actual PostgreSQL migration and functions using PGlite (PostgreSQL in WASM), plus parser, webhook, auth-boundary and PDF tests. PGlite serializes sessions; it does not prove real multi-connection race behavior.

For the separate two-session concurrency test, provision an EMPTY disposable PostgreSQL database and set `PAYMENT_TEST_DATABASE_URL` privately. Set `ALLOW_DISPOSABLE_PAYMENT_DB=yes`, then run:

```sh
npm run test:postgres
```

This test refuses an existing payment schema and creates its own fixtures; it does not drop data. A suitable test DB owner is required to create test roles/schema. The test is skipped without a connection string. Separately run `supabase functions serve --env-file supabase/.env` against local/staging Supabase and repeat the browser/HTTP smoke tests: Auth/PostgREST/Edge hosting are not emulated by PGlite.

## 7. Maintenance

Schedule `select public.payment_prune_ephemeral();` hourly using your trusted database scheduler. It removes rate-window metadata and request nonces older than one day; signed requests already expire after five minutes. Financial events/receipt/audit records are retained. Rotate relay keys, disable lost devices immediately, back up the database and rehearse restoration. No live service was deployed by this deliverable.
