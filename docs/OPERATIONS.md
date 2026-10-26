# An-Noor — current operations

The separate `annoor-madrasa` Supabase project (`jbmxquvgrekyapcoezmh`) stores admissions, free-trial requests and moderated guardian feedback. The examination-board project is untouched.

## Using the pages

Publish only `index.html`, `assets/`, `learn/`, `robots.txt`, `404.html`, the generated `sitemap.xml` when configured, `live/`, `payments/` and `admin/` on the website's HTTPS host. Never serve the entire source repository, backups, ZIP or private server folders. No website host was deployed in this update. The existing staging script includes `admin/`.

The six-step form submits explicitly to `admissions/submit`. Opening files directly from disk preserves preview-only behavior and sends no form data. On HTTPS, a successful response displays a real application reference and the server's BDT fee estimate. Repeating the same unchanged request uses the same idempotency key. A network error never reports success. Refreshing clears unsaved form data; student data and admin tokens are not stored in localStorage.

`admin/index.html` is the private office login page. A page URL is not an access-control mechanism: every list, audit and decision request validates the current Supabase Auth user and a server-owned `admission_admins` row. Non-admin users cannot read applicants or assign themselves a role. The public navigation does not advertise supervision.

### Admission-device live-class links

The hero, navigation, contextual phone shortcuts, classroom section and footer show their prominent class-entry links only after this browser receives a validated successful admission response. New visitors see the free-trial entry instead. A successful response must contain a valid `ANN-` reference, known status and positive server fee. Failures and malformed responses do not set the hint. A trial request or guardian review never enables it.

The only saved value is `annoor-admission-submitted-v1=1`; no applicant name, phone, reference or form contents are persisted in browser storage. This is a display preference, not proof of enrollment or an access token. Clearing site storage, using private browsing or another browser/device removes the preference. When storage is blocked, the current page updates after success but later visits cannot remember it. Storage changes synchronize across open tabs. Existing students on another device can reach the existing student-login information page and use their issued credentials without submitting a new application. The private classroom still enforces active student IDs, passwords and assigned classes on the server.

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

## Trial requests and moderated guardian feedback

Updated 26 October 2026. The existing compact classroom section now offers visitors two free introductory lessons and opens a short trial dialog. It collects student name, age (5–18), guardian name, international contact number, Quran level, optional preferred time/country/timezone and consent. Staff confirm a suitable class subject to teacher/batch availability. A successful request generates an `ANT-` reference; it does not create a fee, invoice, student account, seat reservation or class assignment. Entries remain after an unsuccessful request, and unchanged retries use the same in-memory request ID. Changing only the page language preserves both the retry ID and original request language. No online payment is added.

The guardian-feedback dialog retains preview/copy, character count and optional rating. On a connected online website it submits with explicit publication consent and returns an `ANR-` reference. Public cards are fetched separately and contain only approved feedback. Submission does not immediately display a card. File/unconfigured previews disclose that nothing is submitted and preserve the draft workflow. Public messages never contain private contact details or a request reference; record text is rendered with `textContent` rather than HTML.

The feed loads near the section, six approved records at a time, with a visible loaded/total count, previous/next controls, swipe/scroll-snap on phones, two cards on screens wider than 1100px, load-more and retry/empty states. Long reviews scroll inside their cards. Pagination tracks consumed server rows and deduplicates rendered IDs. The production database contained no approved reviews at verification time; no fictional testimonials were seeded. Feedback withdrawal removes a record from subsequent feed requests; already-open pages show their fetched copy until refreshed.

The office has three separate queues: **ভর্তি আবেদন / ফ্রি ট্রায়াল / অভিভাবক মতামত**. Admission behavior and fee estimates remain unchanged. Trials support SUBMITTED/IN_REVIEW/APPROVED/REJECTED, while reviews support PENDING/APPROVED/REJECTED. Review approval publishes; rejection withdraws publication. Every trial/review decision requires a reason, locks the record and compares its integer version, preventing concurrent or stale decisions, including a return to an earlier status. Each submission and decision has an immutable audit entry. List responses from a previously selected queue cannot replace the current queue after a late network response.

The owner still needs to select/provision the first office administrator as described above. No default Supabase administrator, password, invitation or classroom account was created. Approval of a trial or review never grants live-class access or confirms payment.

### Database and endpoint deployment

`20261026004357_trials_and_reviews.sql` is the actual hosted migration version. It adds `trial_applications`, `parent_reviews`, `engagement_audit` and service-only ingestion, approved-feed and office RPCs. All three tables have RLS and no anonymous/authenticated table grants or policies. Private RPC execution is also denied to these roles. The public feed RPC returns only `id`, `name`, `country`, `text`, `rating` and `published_at` for APPROVED records. It never exposes the stored JSON payload.

The existing admissions migration was renamed to `20261024181248_admissions.sql` to match its already-applied hosted version. Its SQL bytes were checked against the hosted migration and remain unchanged. This is migration-history alignment, not a second execution of the old schema.

The existing `admissions` Edge Function is deployed ACTIVE at version 3. Its health payload is version 2 and lists admissions, free trials and moderated reviews. Existing `submit/list/decide/audit` routes remain. New routes are public `trial-submit`, `review-submit`, `published-reviews`, and authenticated `trial-list/decide/audit` and `review-list/decide/audit`. The project URL and publishable key already in browser configuration are sufficient; no new frontend secret or runtime dependency is required. Privileged credentials remain in the Edge environment.

Server checks include streamed 16KB JSON limits, exact field allowlists, validated consent/ages/ratings, honeypots, request UUID uniqueness and idempotent immutable retries, durable source/contact limits (5 per hour) and per-kind global limits (200 per hour). Source IP is HMAC-derived on the server and contact keys are hashed; raw IPs are not stored. Admin requests require a real confirmed non-anonymous Auth user plus an active server-owned administrator role. Errors return safe codes without SQL or private payloads. Service RPCs use invoker security with an empty search path. The expected security-advisor INFO for server-only RLS tables without user policies remains default-deny; no permissive policy was added to silence it.

Verification: `node tests/engagement.cjs` exercises the real PostgreSQL engine through PGlite, including validation, conflicting retries, default-deny privileges/RLS, private pending records, public-field projection, version races, withdrawal, immutable audit and durable limits. `node tests/engagement-edge.cjs` tests the actual TypeScript handler's public/admin boundaries, HMAC source, safe responses and body limits. `NODE_PATH=/path/to/jsdom/node_modules node tests/engagement-ui.cjs` checks device hints, trial retries/language, safe public cards, pending-not-published behavior and office moderation/logout. `node tests/engagement-hosted.cjs` checks deployed health, public feed, invalid input and forged/anonymous admin denial without inserting submissions. A separate hosted SQL transaction exercised valid ingestion, retry, approval/projection and withdrawal, then rolled back all synthetic rows; zero test records remained. First-owner admin login and physical-phone acceptance remain separate.

Native Chromium checked 288 public layouts: visitor/applicant hero, trial section/dialog, multiple-review feed/dialog, offline feedback and teachers across the four priority phone widths (320/360/390/412px), two heights (844/375px), both languages and themes, plus selected 768/1280px cases. All passed document/control overflow, conditional-entry and round/protruding-portrait checks. The office's 24 inert admission/trial/review phone snapshots initially found overflowing long references on narrow trial/review cards; text wrapping fixed this and all 24 office cases passed their focused recheck. Direct phone-frame interaction verified invalid age/absent consent rejection, retained entries and retry after a simulated network failure, review Next/load-more (6 to 8 cards), visitor menu visibility and the applicant hero. No real record or login was submitted through the browser. Fixture reviews are explicitly fictional and excluded from source/public staging and the ZIP.

This browser check also found missing `crypto.randomUUID` on HTTP preview origins. The shared request-ID helper now uses browser cryptographic random bytes for RFC 4122 version-4 IDs when that method is unavailable; it never uses `Math.random`. If no cryptographic RNG is available, forms show a safe browser-update message, preserve entries and make no request. Both compatibility paths have regression coverage. Production pages should still use HTTPS.

Teacher portraits restore the original 72px circular frames, original cutout positioning and protruding heads. Light-mode cards use a sage gradient (`#c4dccc` to `#a7c8b5`) with stronger secondary text. Original image bytes, hero palette/animation, fees, schedules, admission wizard and private classroom/receipt service remain intact. These checks are browser-frame verification, not physical Android/iPhone, on-screen-keyboard, media-service or whole-site accessibility acceptance.

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

Use the real AppID, full API key ID and an RSA private key of at least 2048 bits from your account setup. Register its public key with JaaS. The signer uses RS256 with exact room matching and `context.user.moderator`; provider/cloud recording, transcription and livestream features are not enabled by this adapter. Local browser recording below is independent of those provider claims. The private key stays on the Node server. A server-secret `JITSI_PRIVATE_KEY` environment value is also supported for a secret manager, but the file option is preferred. No JaaS account was created or subscription enabled here.

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

Run `npm test` in `live-class/`, rebuild with `npm run build`, and run the root compiled-UI tests. `tests/jitsi-ui.cjs` covers SDK loading/failure/retry, token/room options, cancellation/disposal, initial device states, silent supervision, JaaS paths and access-revocation polling using a fictional SDK. These do not test real WebRTC, media-server configuration, remote moderator enforcement or capacity. The original Jitsi delivery passed 37 Node tests; the expanded current suite is described below. Chromium layout checks passed 40 fictional login/student/teacher/admin views at 320, 390, 768, 1280 and 1920px widths and 844/375px heights; the embedded media was inert test content. An expanded 390px admin roster also had no horizontal overflow. Existing compiled access, receipt and portable-entry checks passed.

Before taking real classes, configure your actual media service and test on two devices/different networks: missing/forged/wrong-room/expired tokens rejected, student stays non-moderator even when first, approved student only enters assigned classes, mic/camera/screen share and reconnect work, supervisor is visible, native mute/kick works, lock/end behavior is understood, and more than one simultaneous class works. No real Jitsi media call or production deployment was performed in this update.

Primary references: [Jitsi IFrame API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/), [commands](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe-commands/), [Docker token auth](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker/), [upstream token affiliations](https://github.com/jitsi/jitsi-meet/blob/master/resources/prosody-plugins/mod_token_affiliation.lua), [Docker Jicofo configuration](https://github.com/jitsi/docker-jitsi-meet/blob/master/jicofo/rootfs/defaults/jicofo.conf), [JaaS JWT](https://developer.8x8.com/jaas/docs/api-keys-jwt/), [JaaS IFrame](https://developer.8x8.com/jaas/docs/iframe-api-integration/).


## Learning records and local recording

Updated 25 October 2026. This extends the existing Node classroom service and keeps the homepage, admission form, Supabase office, original student IDs, receipt ledger and selected Jitsi/LiveKit adapter. No additional dependency, paid provider, hosting deployment or cloud recording service is enabled.

### Classroom management

- Search classes by title/teacher and filter scheduled, entry-open or ended sessions. Administrators can search the existing account list by name, permanent ID or email.
- **পড়াশোনা ও অগ্রগতি** contains class topics, shared lesson notes, homework and individual reading reports. Only the assigned teacher/admin edits. Students read shared lesson content plus only their own report; roster peers and their feedback are never returned to a student's report request.
- Reports include staff-entered present/absent/excused/unmarked attendance, Qaida/Quran/Hifz stage, covered material, homework state and feedback. This is `STAFF_RECORDED`, not provider-verified presence, completion proof or a calculated learning score. It does not write to the existing sampled `attendance` table.
- Writes validate bounded fields, reject unexpected keys, compare an expected version inside `BEGIN IMMEDIATE` and audit IDs/versions without copying private feedback into audit details. A stale write returns `409 LEARNING_CHANGED`; refresh and compare before saving again. Inputs remain in place after a conflict until the user deliberately refreshes.
- Admin **same batch / next class** creates a scheduled session with a fresh private room and copies only active, unblocked students. It leaves prior lessons, reports and sampled attendance in their original session. It is not a recurring scheduler or an admission-approval-to-enrollment integration.
- Existing students can use their credentials with their guardian to read their own reports; a separate guardian login/delivery system is not implemented. Supabase admissions and classroom/receipt authentication remain separate.

### Manual local recording

1. Use an updated desktop Chrome or Edge browser on the real HTTPS classroom domain. Feature detection shows an explanatory fallback when screen capture, recording or audio mixing is unsupported. Mobile/tablet/browser capabilities vary; this is not a universal mobile recording promise.
2. Join the relevant class as its assigned teacher or admin. Public pages, students and silent-preview cards have no recorder control. The server independently rejects a student's or unrelated teacher's recording-notice requests.
3. Prefer **ফাইলের জায়গা বাছুন** for a long class. It requests a save-file handle in one user gesture. **রেকর্ডিং শুরু** is a separate gesture because browsers also require user activation for screen capture. Choosing a place does not start capture. Use a new file name; selecting an existing file invokes the browser's overwrite flow.
4. In the browser picker choose the classroom tab and enable **Share tab audio**. Capture audio must be present; silent video-only input is refused. The own-voice checkbox additionally requests microphone audio and mixes it with the selected tab through Web Audio. It is clearly independent of the Jitsi/LiveKit mute switch, so the operator's voice can be recorded while their conference microphone is muted. Uncheck it when that is not wanted. A requested microphone failure stops setup rather than omitting it silently.
5. After device permission and a successful staff-authorized notice, MediaRecorder starts with a supported WebM/VP8+Opus format, falling back to WebM/MP4 only when supported. Nothing starts on page load, login, joining or reconnecting. The visible tab layout is recorded, not individual remote camera tracks or all concurrent classrooms at once. Prefer the class view while recording; the compact sticky bar keeps stop/timer controls accessible.
6. Direct-file mode writes ordered chunks to the chosen local handle and claims success only after the writer closes. Browser writes typically commit from a temporary file only at close. Stop and wait for completion. A reload, crash, power loss or disk failure can lose an unfinished recording; the app warns on navigation while active. It cannot guarantee crash recovery. Write/close failure is never reported as success. Slow disk queues stop capture rather than growing without a bound.
7. Download mode retains a bounded recording in memory and stops at 20 minutes or about 256 MiB, including a possible final chunk. Use the download link before closing, refreshing or starting another recording. It never stores chunks, credentials, files or paths in localStorage/IndexedDB. Starting another part or dismissing an undownloaded result requires an explicit acknowledgement. Logout waits for capture to stop and asks for the pending download first.
8. Stop, browser **Stop sharing**, classroom exit/end/access loss, capture-track ending, recording error or recording-notice failure stops capture and closes acquired tracks/audio contexts. API calls time out after 15 seconds. Browser permission dialogs themselves cannot be dismissed programmatically; cancellation prevents a late permission result from starting a recording. Page-hide cleanup is best effort; the normal Stop button is required for reliable finalization.

The file is saved on **the computer that starts recording**. A teacher's local recording is not automatically copied onto the owner's PC. For an owner-PC copy, join and record on that PC. There is no remote desktop write, file upload, student playback library or automatic course publication. The separate recorded-course section remains for a future upload workflow.

### Recording notices and access

The application stores only staff identity, class, a random recording ID, notice expiry and audit events. It never receives video/audio blobs, filenames, paths, file handles or local URLs. Notices describe browser-reported staff intent, not cryptographic proof that encoding or saving succeeded. On start, students in the website see a recording notice on normal class polling (normally within six seconds). The classroom pre-notice also explains that authorized staff may record. Direct Jitsi users outside this website do not receive this application banner.

Notice start/heartbeat requires an active staff session, assigned class and live class status, with normal origin checks and API rate limits. A lease expires after 45 seconds; the browser refreshes every 15 seconds, stops on failed refresh and locally checks expiry every second. Duplicate start is idempotent for the same live notice; expired/stopped IDs cannot be revived. The app does not try to prevent recording by operating-system tools.

### API and additive schema

All routes use the existing `/api/live` session and origin middleware:

- `GET /classes/:id/learning`: shared lesson and role-filtered reports.
- `POST /classes/:id/lesson`: assigned staff, `{version,topic,summary,homework}`.
- `POST /classes/:id/reports/:studentId`: assigned staff, `{version,attendance,stage,covered,homeworkStatus,feedback}`.
- `POST /classes/:id/copy`: admin only, `{scheduled}` as an ISO timestamp. UI entry uses the device's local time and converts to UTC.
- `POST /classes/:id/recording`: assigned staff, `{action: start|heartbeat|stop, recordingId: UUIDv4}`. No media upload endpoint exists.

`openDb` adds schema version 3 and three separate tables: `class_lessons`, `student_lesson_reports`, `local_recording_notices`. Back up the existing database using the documented SQLite procedure before updating the service. Startup migration preserves existing accounts/assignments/receipts. Include the new tables in private backups and institution-approved retention. The service remains a single API process; use shared durable storage/rate limiting before horizontal scaling.

### Verification and activation limits

`npm test` in `live-class` covers actual SQLite/HTTP role isolation, atomic conflicting edits, private student reports, next-session roster copying, notice authorization/expiry/idempotency, absence of fabricated attendance, and dependency-injected recorder lifecycle/errors/ordered writes/cancellation. `NODE_PATH=/path/to/jsdom/node_modules node tests/learning-ui.cjs` tests the compiled React workflow, student read-only view, explicit staff-only recording, file/download modes, class-exit stop, permission cancellation and heartbeat failure. Existing Jitsi/access/receipt/portable and public-page tests remain applicable.

The current Node suite passes 50 tests. Chromium layout QA passed 60 fictional views: teacher/student/admin learning, recording ready/active and admin classes, at widths 320/390/768/1280/1920 and heights 844/375. Native Chromium MediaRecorder/Web Audio encoding and decoded playback were checked with synthetic canvas/audio streams (640×360) in download mode and a direct-writer test double. No camera, microphone, real classroom, real destination-file permission or provider call was used in those synthetic tests.

Before real use, deploy/restart the Node service with a database backup, configure the actual private Jitsi/LiveKit host, and test two devices on different networks. On the intended operator PC verify tab-audio selection, optional own microphone, visible student notice, a complete saved local file that plays with both voices, long-class disk behavior, stop/leave/reconnect, and school/guardian recording policy. Those real-provider/OS/device acceptance checks and production hosting remain outstanding. The future prerecorded-course upload system remains separate.

Primary browser references: [screen capture](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia), [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), [save-file picker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker), [writable-file finalization](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable), [Chrome File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).


## Mobile first and Bangladesh search visibility

Updated 25 October 2026. The owner estimates about 80% of visitors use phones; this is a product priority, not a measured analytics result. Future releases must check the phone flows first and describe what changed, why it should help and what was actually verified. The existing ages, fees, days, six admission steps, light-default/remembered-theme behavior, branding, private access, Supabase admissions and local-computer recording are retained.

### এই আপডেট ও তার প্রভাব

| পরিবর্তন | প্রত্যাশিত সুবিধা | এখন পর্যন্ত যাচাই |
| --- | --- | --- |
| ফোনের নিচে প্যাকেজ, ভর্তি ও লাইভ ক্লাসের দ্রুত বাটন | প্রয়োজনীয় কাজ কম স্ক্রলেই পাওয়া যাবে | ভর্তি রুট, ডায়ালগ ও কিবোর্ডের অবস্থায় সঠিকভাবে আড়াল হয়; নিরাপদ নিচের জায়গা রাখা আছে |
| বড় ক্লাসরুম দৃশ্য ও সহজে বের হওয়ার নিয়ন্ত্রণ | ছোট পর্দায় ক্লাসের জন্য বেশি জায়গা | দৃশ্য বদলাতে Jitsi iframe নতুন করে সংযোগ করে না; শিক্ষক/শিক্ষার্থী পেজ ও ছোট landscape মাপে পরীক্ষা হয়েছে |
| কাছাকাছি সেকশনের পটভূমি আলাদা করে তৈরি | ফোনে শুরুর অপ্রয়োজনীয় প্রসেসিং ও বড় bitmap কমবে | 390×844 Chromium পরীক্ষায় আগের initial canvas export 16টি, নতুন 1টি; এটি পুরো পেজের গতি বা ব্যাটারির ফল নয় |
| ঘড়ির অপরিবর্তিত/অদৃশ্য লেখা নতুন করে না বসানো | অপ্রয়োজনীয় DOM ও সময় হিসাবের কাজ কমবে | একই মিনিটে পুনরায় tick-এ লেখা অপরিবর্তিত; দৃশ্যমান হলে সময় হালনাগাদ হয়; clock animation থাকে |
| HTML-এ প্যাকেজের দাম ও ক্লাসের দিন | JavaScript চালুর আগেই ব্যবহারকারী ও crawler মূল তথ্য পাবে | তিন প্যাকেজ, অনুমোদিত দাম, বিষয় ও সপ্তাহের দিন source HTML-এ আছে এবং পরীক্ষায় মিলেছে |
| বাংলা–ইংরেজি অভিভাবক সহায়িকা | ফোনে প্রস্তুতি, স্তর, ফি ও আবেদন বুঝতে সুবিধা | Light/dark ও দুই ভাষায় ফোনের মাপ যাচাই হয়েছে; মূল পেজ থেকে crawlable link আছে |
| পরিষ্কার title/description ও প্রতিষ্ঠানভিত্তিক structured data | সার্চ ইঞ্জিনকে আসল সেবা ও বয়সসীমা বুঝতে সাহায্য করবে | ভুয়া rating, অজানা যোগাযোগ/স্বীকৃতি বা ranking দাবি যোগ হয়নি; ফল এখনো মাপা যায়নি |
| Domain-specific canonical, social URL ও sitemap প্রস্তুতি | লাইভ ডোমেইনে সঠিক public URL খুঁজতে সাহায্য করবে | বাস্তব ডোমেইন এখনো দেওয়া হয়নি; staging generator পরীক্ষা হয়েছে, production-এ সক্রিয় হয়নি |
| Noindex, সঠিক 404 ও compression/cache-এর উদাহরণ | ব্যক্তিগত পোর্টালকে search landing page করা এড়ানো ও পুনরায় পেজ খোলার খরচ কমানো | Source/build-এ private meta আছে; আসল Nginx/Google ফল যাচাই বাকি |

The decorative typography remains at 8% opacity. On phones, bitmap density is capped at device scale 1 instead of up to 2, with bounded placement attempts and ornaments; nearby sections render one at a time during idle periods. A completed section is reused at the same dimensions. Width changes can refresh visible backgrounds; keyboard-only height changes do not repaint the entire page. Hidden/offscreen decorations pause relevant CSS animation. Content, forms and the six-step controller remain independent of the idle decoration queue.

### Compact phone homepage

Updated 25 October 2026 after the mobile/search foundation. The mobile hero now has Bismillah, the original animated logo, its caption and the main copy in that visual and document order. Desktop keeps a two-column composition below Bismillah. Logo breathing/waves, the 8% ayah typography and the live clock animation are retained.

| পরিবর্তন | ব্যবহারকারীর সুবিধা |
| --- | --- |
| বিসমিল্লাহর ঠিক নিচে অ্যানিমেটেড লোগো | ফোনে পেজের পরিচিতি সঠিক ক্রমে দেখা যায় |
| একই গন্তব্যের বাটন দৃশ্যমান থাকলে নিচের পুরো দ্রুত-বার সাময়িক আড়াল | একই সময়ে একই কাজের বাটন পেজ ও ডকে দুবার দেখা এড়ায়; ফাঁকা জায়গা স্থির রাখায় কনটেন্ট লাফায় না |
| ফোনে পূর্ণ উচ্চতার মেনু; মেনু/ডায়ালগ/কিবোর্ডে ডক আড়াল | পেছনের বাটন ঢেকে যায়; মেনু বন্ধ করলে স্বাভাবিক স্ক্রল ফিরে আসে |
| সংক্ষিপ্ত feature, package, teacher, clock, FAQ, review ও footer বিন্যাস | একই তথ্য পড়তে কম স্ক্রল লাগে |
| প্যাকেজ অনুযায়ী আলাদা আবেদন-বাটনের নাম | Basic, Standard ও Premium-এর আবেদন আলাদা বোঝা যায় |
| তিলাওয়াতের player ও স্থানীয় audio preview সংশ্লিষ্ট শিক্ষক-প্রোফাইলে | হোমপেজে একই ধরনের audio controls বারবার থাকে না; প্রোফাইল খুললে আগের সুবিধাগুলো পাওয়া যায় |
| এমেরাল্ড, আইভরি ও হালকা সোনালি | কালচে বড় অংশ কমে; light/dark-এ পাঠযোগ্য রং থাকে |

No package subjects, approved prices/days/duration, institutional explanation, class-access conditions, teacher identities, time-zone choices, FAQ answers, review workflow or admission policy were removed. The six FAQ answers are still open without a click, and all five subject rows remain in every package card. Teacher biographies/methodology/recitation and the local unsaved audio preview remain inside the existing profile dialog. No photo/logo bytes were modified. The palette is a deliberate updated combination informed by the owner's Phase 1 preference; the old Phase 1 code was not restored over current features.

At the same native Chromium 390×844 frame (375px content area with its desktop scrollbar), Bangla/light homepage document height measured **12,897px → 8,428px**, a **34.65% reduction**. All content remained accessible. This measures layout length only, not network speed, Core Web Vitals, ranking or a physical phone. Height varies with language, fonts and viewport.

This composition was checked in **208 native Chromium layouts**: homepage 64 (8 frame widths × 2 heights × 2 languages × 2 themes), guide 32, six active admission-section snapshots 96, and teacher profile 16. Frame widths included 320/360/390/412px phones, 600/768px, and 1280/1920px desktop as applicable; the actual content width was also checked. No document/control horizontal overflow was found. The phone hero order was verified on the visible homepage, and the six FAQ answers remain visibly expanded. Admission snapshots use fictional local presentation state, without submitting an application or contacting a real backend. Physical Android/iPhone, native keyboards and actual media calls remain outside these checks.

`tests/mobile-seo.cjs` now also verifies inline-action/dock suppression, menu open/brand-close scroll-lock cleanup, and access to teacher audio through the profile. Existing admission/date/time/schedule/review/submission checks and `tests/verify.py` passed for this update. No classroom/receipt backend or compiled application code changed; their previously verified behavior remains separate from this presentation update. This release updates source and the complete ZIP; it does not configure production hosting or enable a media/payment service.

#### Portrait and feedback contrast refinement

The follow-up completed on 26 October 2026 places each teacher's complete cutout inside a 72×104px emerald frame with `object-fit: contain`. The white cap and clothing now stay over a colored panel rather than extending above a small circle onto the white card. Original photo bytes, identities and profile actions are retained. The hero uses a slightly deeper, restrained emerald gradient; its mobile order and animations are unchanged.

Feedback headings now have explicitly scoped theme colors that override the old `#reviews h2` white-text rule. Body copy, notes, labels and the empty-state board use stronger light/dark colors; the published-feedback label is at least 10px. Both the stylesheet's legacy gradient and the deferred canvas renderer's hardcoded dark review gradient were removed. The renderer now supplies only the transparent 8% gold ayah layer for this section, so scrolling or lazy painting cannot replace its theme-owned base color.

Native Chromium passed **144 targeted checks**: hero/teachers/reviews × six frame widths (320/360/390/412/768/1280px) × two heights (844/375px) × Bangla/English × light/dark. There was no document/control horizontal overflow, all three portrait images were contained, the visible phone hero kept its order, and the review section had no restored gradient. Ten sampled feedback text styles had a minimum computed contrast of **6.69:1** against their solid surfaces. This is a scoped computed-color check; it is not a whole-site accessibility certification or physical-phone test. The faint decorative bitmap was visually checked separately. The existing mobile/decorative and feedback workflow tests passed, including a regression test that delayed review painting never inserts a base gradient. Structural checks confirmed the four original artwork hashes remain unchanged. No admission, fee, access, receipt or backend logic changed.

### Activate on the actual domain

The actual public origin, official contact details and first admission-admin email are still owner inputs. Do not substitute the GitHub repository URL, Supabase API host, internal preview or the separate examination-board institution/domain. No external production website, paid service, Search Console property or analytics account was created in this update.

From the repository root, with an empty staging destination outside the source checkout:

```sh
node live-class/scripts/stage-public.mjs /srv/annoor/public-next
node scripts/prepare-seo.mjs /srv/annoor/public-next https://YOUR_REAL_DOMAIN
```

Replace `YOUR_REAL_DOMAIN` with the institution's real domain. The generator requires an HTTPS origin without a path/query/fragment/credentials; it refuses placeholder/invalid hosts, source-tree output and symlink escapes. It writes only public staging files. It adds root-home and `/learn/` canonical/social URLs, resolves structured-data identities and logo to that origin, creates a sitemap with exactly those two public pages, and adds its absolute URL to robots.txt. There are no guessed URLs or fake last-modified dates in the source package. Re-running with the same domain is deterministic. Run it again whenever preparing the real deployment, then deploy that staged output.

`learn/index.html` is a genuine reader guide, not a collection of location/keyword doorway pages. The recorded-course catalogue remains unpublished. Language switching uses the same URL; separate language URLs and hreflang are not fabricated. The source metadata has no AggregateRating/review schema, unsupported credentials, physical address or instructor qualifications.

The updated Nginx example includes gzip, revalidation of unhashed assets, long caching for fingerprinted portal bundles, private-portal X-Robots-Tag and a real-status 404 page. Canonical URL metadata is written by the staging generator. Run `nginx -t` on the actual host before reloading; this environment has not validated a running Nginx/TLS deployment. Noindex and robots rules are not authentication; server authorization remains essential. Do not block private HTML from crawling in robots while expecting a crawler to read its noindex meta. Publish only the staged files, never private source/backups/databases.

After the real domain is reachable on HTTPS: verify ownership in Search Console, submit its sitemap, inspect the homepage and guide URLs, check canonical selection and inspect real mobile usability/Core Web Vitals. These ownership and live-domain steps have not been completed. No Google verification code or account credential was guessed or requested in chat.

### Grow the institution with evidence

| Priority | Work and intended effect | Owner input / measurement |
| --- | --- | --- |
| Live foundation | Stable public domain, real Jitsi/Node service, real phones and reliable admission follow-up | Domain/hosting choice and first admin identity; successful student/guardian journeys on actual Android/iPhone and different networks |
| Verified trust | Publish confirmed teacher bios/qualifications, authorized samples, official contact details and clear practical policies | Institution-approved facts and materials; track real parent questions and resolved concerns |
| Helpful Bangla content | Build useful parent/learner guidance from actual teaching experience, with a clear purpose for each page | Teacher-reviewed topics; Search Console Bangladesh queries, impressions, clicks and useful page discovery |
| Teaching outcomes | Use lesson/homework/progress records consistently and review attendance/follow-up | Real class data and consent before any public student story; compare retention and report completion |
| Search and application funnel | Check which useful pages bring appropriate applications and where phone users struggle | Compare Search Console data and server-confirmed application totals over comparable periods; exclude staff/test traffic |
| Ongoing quality | Maintain mobile checks, fresh accurate content, backups and service reliability | Compare phone errors, successful joins, completed applications and support response times after each substantive release |

Initial search topics can naturally cover online Quran learning, Qaida/Tajweed, suitable age, class preparation and fees in Bangladesh; do not create thin duplicate pages for every city or guarantee being the "best". Staff expertise, real teaching quality, prompt parent communication and consistent useful content are business work as well as website work. No outreach, social posting, paid advertising, purchased links or fake testimonials were performed.

Measurement goals for the live service are LCP around 2.5s or better, INP under 200ms and CLS under 0.1 for actual mobile users, using field data when enough exists. These are targets from Google guidance, not scores achieved here. Search position and admission growth cannot be established from a code update or narrow-browser test. New analytics/marketing trackers are not enabled; no form data or student IDs are sent to an analytics service. A future aggregate funnel should count server-confirmed submissions/joins separately from button clicks and exclude student contact details.

### Checks and limits

- `NODE_PATH=/path/to/jsdom/node_modules node tests/mobile-seo.cjs`: static plan parity, truthful metadata, staged-domain generation, invalid-domain rejection, idempotency, private-file exclusion/symlink rejection, one-section idle decoration, keyboard resize avoidance, minute-cached/offscreen clock and mobile bar/dialog/keyboard behavior.
- The existing admission/date/time/schedule/review/submission, class access/learning/Jitsi, receipt and portable-entry checks passed. The compiled Jitsi test also verifies expand/restore keeps the same meeting instance. Both portal builds passed; existing bundle-size advisories remain.
- Native Chromium checked 208 public layouts (8 page types × 13 widths × 2 heights), 182 verified staff/learning/classroom/receipt/office snapshots (13 views × 7 widths × 2 heights), 40 additional active admission-step phone layouts and 32 bilingual/light-dark guide layouts: 462 checks, with no document/control horizontal overflow. Phone priorities included 320, 360, 390 and 412px. Actual six-step input/edit/rules/review was exercised with fictional data, without submitting to a real service. Staff snapshots are inert fictional data and are not packaged/published as website content.
- Native canvas-count comparison used the preserved previous homepage and the current one at 390×844. It measures initial decorative export calls only; it is not a Core Web Vitals, mobile CPU, network or battery benchmark.
- This is browser/DOM QA, not physical Android/iOS, virtual-keyboard, 4G, long-session media capacity or production Google validation. Local class recording still needs a supported computer. No phone-recording support, ranking gain, uptime guarantee or enrollment increase is claimed.

References: [Google mobile-first indexing](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing), [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals), [helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
