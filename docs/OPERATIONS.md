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


## Jitsi live class connection

Updated 25 October 2026. Jitsi is a selectable media adapter in the existing private Node classroom service. It does not move or reset permanent student IDs, passwords, rosters, receipts or Supabase admissions. No additional npm dependency or database migration is needed. Existing environments containing only LiveKit credentials still select LiveKit automatically; set `VIDEO_PROVIDER` explicitly when switching. Finish existing calls before changing a running deployment's provider.

### Self-hosted Jitsi

In the private classroom service environment (not the public web root):

```dotenv
VIDEO_PROVIDER=jitsi
JITSI_MODE=self-hosted
JITSI_DOMAIN=meet.your-domain.example
JITSI_APP_ID=annoor
JITSI_APP_SECRET=REPLACE_WITH_A_STRONG_PRIVATE_SECRET_OF_AT_LEAST_32_BYTES
JITSI_SUBJECT=meet.jitsi
JITSI_AUDIENCE=annoor
```

`JITSI_SUBJECT` must match the actual Jitsi XMPP host: Docker commonly uses `meet.jitsi`; a package installation may use its public host. If omitted it defaults to `JITSI_DOMAIN`. The audience defaults to the app ID. The secret must match Jitsi's token verifier and must never appear in browser settings. Domain accepts a hostname (optional port) or an HTTPS origin, with no path, query, fragment or credentials.

On your Jitsi deployment, token authentication must reject missing, expired, forged and wrong-room JWTs. A random room name or hiding an invitation button is not access control. For the matching modern official Docker deployment, verify these settings against its installed version:

```dotenv
ENABLE_AUTH=1
AUTH_TYPE=jwt
JWT_APP_ID=annoor
JWT_APP_SECRET=THE_SAME_PRIVATE_SECRET_AS_THE_NODE_SERVICE
JWT_ALLOW_EMPTY=0
ENABLE_GUESTS=0
JWT_ACCEPTED_ISSUERS=annoor
JWT_ACCEPTED_AUDIENCES=annoor
ENABLE_AUTO_OWNER=0
JICOFO_ENABLE_AUTH=0
XMPP_MUC_MODULES=token_affiliation
```

The `token_affiliation` module must be available/enabled on the conference component and honor `context.user.moderator` / `context.user.affiliation`. Current upstream Jitsi ships this module; older releases may need the community module. Disable conflicting all-owner/auth-based moderator assignment. Token authentication alone does not establish teacher/student moderator isolation: test a student entering first and after the teacher reconnects. Do not activate student access until a student token remains a non-moderator. The public `meet.jit.si` service is deliberately not accepted as a self-hosted private classroom configuration.

### Jitsi as a Service (JaaS)

Alternatively configure:

```dotenv
VIDEO_PROVIDER=jitsi
JITSI_MODE=jaas
JITSI_DOMAIN=8x8.vc
JITSI_APP_ID=vpaas-magic-cookie-YOUR_APP_ID
JITSI_KEY_ID=vpaas-magic-cookie-YOUR_APP_ID/YOUR_KEY_ID
JITSI_PRIVATE_KEY_FILE=/etc/annoor/jaas-private.pem
```

Use the real AppID, full API key ID and an RSA private key of at least 2048 bits from your account setup. Register its public key with JaaS. The signer uses RS256 with exact room matching and `context.user.moderator`; recording/transcription/livestream features are not enabled by this adapter. The private key stays on the Node server. A server-secret `JITSI_PRIVATE_KEY` environment value is also supported for a secret manager, but the file option is preferred. No JaaS account was created or subscription enabled here.

### What the website does

1. Log in using the existing student ID/password or staff account. Admin-only account creation and class assignment remain unchanged.
2. A teacher or administrator opens the assigned class for joining; the server does not pretend it has created a live Jitsi room. Rooms become media conferences when participants join Jitsi.
3. The authenticated join endpoint checks active account, assigned class, current status and join lock before issuing a short room-specific JWT. It rechecks after signing. No email or student contact number is included in the media JWT.
4. Jitsi loads inside the classroom page after an explicit join. Microphone and camera start muted; normal entry keeps Jitsi's prejoin check. Admin silent previews start with audio output, microphone and camera muted, hide their toolbar and show a labelled supervisor identity. This is a UI preset, not a server-enforced read-only media grant.
5. Use Jitsi's moderator controls inside the conference to mute, kick or end the conference where supported. The website does not claim that a command was remotely acknowledged. The outside dashboard cannot mute or forcibly disconnect an arbitrary Jitsi room through the standard IFrame API.
6. Website lock/block/end controls stop issuing new credentials. A successful class-status poll closes embedded sessions when their class ends or their assignment disappears. Already issued tokens may still join before expiration; an ongoing/direct Jitsi call is not globally revoked by changing website status. Use Jitsi in-room controls for immediate conference moderation. Native end-for-everyone depends on server support.
7. All authorized class cards remain visible to administrators, with up to four visible silent previews. Since no trusted server room listing or event feed is configured, actual connection counts are unknown and new verified attendance samples are not saved in Jitsi mode. Browser events are never substituted as verified attendance. Old attendance records remain readable.

The Jitsi script is served by your configured trusted media host and executes in the website page. Allow that host in any script/frame CSP, serve both services over HTTPS, and configure Jitsi's real WebRTC/TURN/firewall settings. The classroom API still requires its private Node host and same-origin HTTPS proxy. Supabase admission configuration is untouched. Configuration readiness in `/api/live/health` is not a successful media-connectivity test.

### Verification and activation

Run `npm test` in `live-class/`, rebuild with `npm run build`, and run the root compiled-UI tests. `tests/jitsi-ui.cjs` covers SDK loading/failure/retry, token/room options, cancellation/disposal, initial device states, silent supervision, JaaS paths and access-revocation polling using a fictional SDK. These do not test real WebRTC, media-server configuration, remote moderator enforcement or capacity. The combined Node suite passed 37 tests. Chromium layout checks passed 40 fictional login/student/teacher/admin views at 320, 390, 768, 1280 and 1920px widths and 844/375px heights; the embedded media was inert test content. An expanded 390px admin roster also had no horizontal overflow. Existing compiled access, receipt and portable-entry checks passed.

Before taking real classes, configure your actual media service and test on two devices/different networks: missing/forged/wrong-room/expired tokens rejected, student stays non-moderator even when first, approved student only enters assigned classes, mic/camera/screen share and reconnect work, supervisor is visible, native mute/kick works, lock/end behavior is understood, and more than one simultaneous class works. No real Jitsi media call or production deployment was performed in this update.

Primary references: [Jitsi IFrame API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/), [commands](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe-commands/), [Docker token auth](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker/), [upstream token affiliations](https://github.com/jitsi/jitsi-meet/blob/master/resources/prosody-plugins/mod_token_affiliation.lua), [Docker Jicofo configuration](https://github.com/jitsi/docker-jitsi-meet/blob/master/jicofo/rootfs/defaults/jicofo.conf), [JaaS JWT](https://developer.8x8.com/jaas/docs/api-keys-jwt/), [JaaS IFrame](https://developer.8x8.com/jaas/docs/iframe-api-integration/).
