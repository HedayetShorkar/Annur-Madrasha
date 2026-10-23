# Payment module delivery report — 2026-10-15

## Inspection and scope
The existing project was a static HTML/CSS/JavaScript website with hash-based navigation, placeholder login/course pages and demo admission/review forms. No React build, auth provider, database or payment backend existed. The new payment module is isolated from that design and builds to `/payments/`. All existing CSS/JS/images compare byte-for-byte with the prior version; only two public navigation links were added. The previous ZIP is checkpointed.

## Implemented
- Bilingual React/TypeScript/Tailwind payer portal, real Supabase email/password auth and finance-admin dashboard.
- Configurable bKash/Nagad/Rocket receiving accounts; no hardcoded live number.
- Admin-assigned fees; server-generated unique invoice IDs and integer amount/account snapshots.
- Invoice reference, sender number and normalized Transaction ID submissions.
- Server-only HMAC webhook secrets, bounded request body, timestamp window, durable nonces, database rate limits and event dedupe.
- Strict account-scoped verified-sample templates; no fabricated provider SMS patterns; incoming credits separate from submissions.
- Atomic matching/claiming using provider, ID, account, amount/currency and transaction time; reliable sender check only.
- PENDING / SMS_MATCHED / REVIEW_REQUIRED / CONFIRMED_PAID / REJECTED; no automatic paid status from user data or SMS.
- Admin independent statement check, reason/reference, self-approval prohibition, approve/reject and append-only audit.
- Confirmed-only receipt records/PDF generation and authorized download.
- RLS, service-only RPC grants, protected role table, schema-qualified definer functions, safe errors and no sensitive body logging.
- Provider adapter contract and separate future official-verification interface, without pretending an official integration exists.
- Migrations, pinned dependency lockfile, public/server environment templates, relay signing example and deployment/runbook documentation.

## Executed verification
- `npm test`: **34 tests passed, 0 failed**. Actual migration and database functions exercised in PostgreSQL/WASM (PGlite), plus Web Request handlers, parser, auth-boundary and PDF tests.
- Covered duplicate/case-normalized Transaction IDs, two competing submission promises, delayed/early SMS, missing amount, incorrect receiving account, wrong amount/time, reliable/unavailable sender, nonce replay, event dedupe/conflict, conflicting-credit quarantine, authorization/RLS, direct-write denial, user isolation, no-match approval denial, independent-check requirement, duplicate approval, rejection release, append-only audit, rate limiting, forged signature, stale signed request, fake sender, unsupported format, OTP rejection, and authenticated webhook-to-ledger matching.
- Three provider adapter tests use SYNTHETIC fixtures only, not verified provider SMS samples.
- `npm run build`: TypeScript and Vite production build passed.
- `npm run check:edge`: shared Edge backend TypeScript check passed.
- `npm audit --omit=dev`: 0 reported runtime dependency vulnerabilities at execution time (not a security audit guarantee).
- Existing site's structural tests: 69 unique IDs, 34 links, local assets and JS syntax passed; original image integrity passed.
- Existing display-preference and time-zone tests passed.

## Not executed
- `npm run test:postgres`: the true two-session PostgreSQL test was **SKIPPED** without a disposable test DB URL. PGlite serializes sessions and cannot establish real multi-connection concurrency behavior. The separate runnable test is included.
- No hosted Supabase Auth/PostgREST/Edge deployment was available. Shared handlers and SQL were tested locally; real hosted integration still needs staging validation.
- No browser rendering/interaction test of the new payment portal was run. The owner's earlier browser acceptance applies to the previous public-site design, not this new module.
- No actual bKash/Nagad/Rocket notifications, real receiving account, phone relay delivery or live payment were tested.

## Inputs needed before activation
1. Approved receiving number/account label/transfer instruction for each provider.
2. Real verified incoming-credit SMS samples from those accounts, independently checked against statements. Exclude PINs/OTPs entirely.
3. Supabase staging/production project configuration, verified admin user and payer accounts.
4. Trusted credit-only source collector/relay, per-device secret and exact allowed origins.
5. Operator acceptance of the independent statement-check workflow and completion of staging/browser/multi-session tests.

The included build intentionally shows “awaiting setup.” No live deployment or transactions were activated. This module is an SMS-assisted reconciliation system, not provider-confirmed settlement verification.
