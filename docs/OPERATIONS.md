# Admissions — current operations

The separate `annoor-madrasa` Supabase project (`jbmxquvgrekyapcoezmh`) stores admissions. The examination-board project is untouched.

## Using the pages

Publish only `index.html`, `assets/`, `live/`, `payments/` and `admin/` on the website's HTTPS host. Never serve the entire source repository, backups, ZIP or private server folders. No website host was deployed in this update. The existing staging script includes `admin/`.

The six-step form submits explicitly to `admissions/submit`. Opening files directly from disk preserves preview-only behavior and sends no form data. On HTTPS, a successful response displays a real application reference and the server's BDT fee estimate. Repeating the same unchanged request uses the same idempotency key. A network error never reports success. Refreshing clears unsaved form data; student data and admin tokens are not stored in localStorage.

`admin/index.html` is the private office login page. A page URL is not an access-control mechanism: every list, audit and decision request validates the current Supabase Auth user and a server-owned `admission_admins` row. Non-admin users cannot read applicants or assign themselves a role. The public navigation does not advertise supervision.

## First administrator (owner deferred email selection)

Create an email/password user through this project's Supabase Authentication dashboard, using the owner's selected email and normal email verification. Do not send passwords in chat or commit them. After email verification, an authorized database owner can provision that exact account:

```sql
insert into public.admission_admins(user_id)
select id from auth.users
where lower(email)=lower('YOUR_VERIFIED_ADMIN_EMAIL')
  and email_confirmed_at is not null
on conflict(user_id) do update set active=true;
```

No default account or password was created. The admissions office uses Supabase Auth; existing Node classroom/receipt accounts remain unchanged and are not automatically synchronized.

## Review workflow

New applications are SUBMITTED. Authorized staff can move them into IN_REVIEW, APPROVED or REJECTED with a 5–1000 character reason. Decisions lock the row and compare the expected status to reject stale changes. APPROVED is terminal in this release; changes require an explicit future correction workflow. Each decision has an append-only audit entry. Approval does not confirm a payment, issue a receipt or grant classroom access.

The list has 25 records per page and a status filter. Each record shows student/guardian details, Hifz, plan, preferred date, availability and fee. No public reference-lookup endpoint exposes personal data.

## Backend and deployment

The versioned SQL is in `supabase/migrations/`. The single dependency-free Edge Function is `supabase/functions/admissions/index.ts`; config keeps platform JWT verification off because intake is public. Admin routes independently validate the bearer JWT against Auth before calling service-only SQL functions. The service key stays only in Supabase's Edge environment. The browser has only a publishable key.

Database tables have RLS enabled and no anon/authenticated grants. Deliberate absence of user policies means deny-all; service-only handlers implement access. The security advisor may report this as INFO, not public data exposure. Ingestion applies bounded streamed JSON, strict fields, age 5–18, guardian consent, date/time validation, server-calculated fees, request uniqueness and durable per-contact/source/global hourly limits. CORS is public for the portable website; it is not authentication. Source IP limits are supplementary to contact/global caps. No PINs or OTPs are requested.

Fees preserve the existing policy: current-month estimates use the actual Dhaka submission date; days 1–7 are full price, later days include remaining calendar days. Next month's first day is full price. Actual invoicing still requires administration confirmation. Preferred schedule is not a booked slot.

Tests: `node tests/admissions.cjs` (uses the pinned payment-module PGlite dependency), `NODE_PATH=/path/to/jsdom/node_modules node tests/submission-ui.cjs` for the browser submission controller, existing form/HTML regression tests, and `node tests/admissions.cjs --hosted` for hosted endpoint authentication/error checks. Transactional hosted SQL tests roll back synthetic records. Media calls, production website hosting and owner admin-account acceptance remain separate steps.

## Repository layout

Older individual root update reports are preserved together in `docs/HISTORY.md`. Source modules, tests, deployment files and recovery archives are retained because they have distinct purposes. Git history preserves all previous file versions. Future updates replace current files and refresh the same root release ZIP.
