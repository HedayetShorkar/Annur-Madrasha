# Previous delivery notes

Historical records consolidated without changing website code or behavior. Earlier readiness statements describe their original checkpoints; use OPERATIONS.md and the root README for the current release.


---

## ADMISSION_DATE_TIME.md

# ভর্তি ফর্মের সহজ তারিখ ও সময়

## ক্লাস শুরুর দিন — ধাপ ৩

ব্রাউজারের `date` ঘরে আলাদা করে দিন/মাস/বছর লিখতে হয় না। সম্পূর্ণ তারিখ ও বারসহ তালিকা থেকে একটি দিন বেছে নেওয়া যায়। আজ, আগামীকাল এবং পরের মাসের ১ তারিখের দ্রুত বাটন আছে। মাসের শেষ দিনে আগামীকাল ও পরের মাসের ১ একই হলে একই কাজের দ্বিতীয় বাটনটি দেখানো হয় না।

আগের অনুমোদিত সীমা রাখা হয়েছে: বাংলাদেশ সময়ের আজ থেকে চলতি মাসের শেষ দিন, অথবা পরের মাসের ১ তারিখ। পরের মাস বেছে নেওয়ার পরও তারিখের তালিকাটি লক হয় না; চলতি মাসের দিন বেছে নিলে পরিকল্পনাটিও নিজে থেকে বদলায়। চলতি মাসে আগে বেছে নেওয়া দিনটি অন্য পরিকল্পনায় গিয়ে ফিরে এলেও মনে থাকে। ভাষা বা প্যাকেজ বদলালে তারিখ মুছে যায় না। শেষ ধাপের যাচাইতেও তারিখ সহজ ভাষায় দেখা যায়।

ফির নিয়ম অপরিবর্তিত: ১–৭ তারিখে ভর্তি হলে পূর্ণ মাসের ফি; ৮ তারিখ থেকে ভর্তির দিনসহ বাকি ক্যালেন্ডার দিনের অনুপাতে। এই মাসে ভর্তির অনুমান বাংলাদেশ সময়ের আজকের তারিখ অনুযায়ী; পছন্দের শুরুর দিন পিছিয়ে দিলে ফি কমে না। পরের মাসের ১ থেকে শুরুতে পূর্ণ মাসিক ফি। প্রথম মাসের হিসাব দেখা যায়; বিস্তারিত সূত্র খুলে পড়া যায়। এটি প্রাথমিক হিসাব, প্রশাসন চূড়ান্ত বিল নির্ধারণ করবে।

## সুবিধাজনক সময় — ধাপ ৪

- শুরু ও শেষের জন্য বড়, আলাদা কার্ড; ঘণ্টা, মিনিট ও AM/PM-এর স্পষ্ট লেবেল।
- ঘণ্টা বাছলেই মিনিটে ০০ বসে; অন্য মিনিটও বেছে নেওয়া যায়।
- প্রতিটি সময়ে ১৫ মিনিট কমানো/বাড়ানোর বাটন। একই দিনের ০০:০০–২৩:৫৯ সীমা ছাড়িয়ে যায় না।
- ১২ ঘণ্টা ডিফল্ট; ২৪ ঘণ্টায় বদলালে AM/PM ঘর ও ব্যাখ্যা আড়াল হয়। সময় বদলায় না।
- ঘণ্টার আগে শুধু মিনিট দেওয়া থাকলেও ভাষা বা ফরম্যাট বদলালে সেই অসম্পূর্ণ খসড়া হারায় না।
- AM ও PM-এর ব্যাখ্যা, সকাল/বিকেল/সন্ধ্যার শর্টকাট এবং স্পষ্ট সারাংশ।
- নমনীয়/আলোচনা করে সময় নির্ধারণ, টাইমজোন এবং শিক্ষক/ব্যাচের অনুমোদনের শর্ত বজায় আছে। কোনো সময় বুকিংয়ের নিশ্চয়তা তৈরি করা হয়নি।

সাবমিশনের উপযোগী মান আগের মতোই: `preferred_start_date` / `fee-quote.startDate` = `YYYY-MM-DD`; `preferred_schedule`-এ `start`, `end` = `HH:mm`, সঙ্গে IANA টাইমজোন ও প্যাকেজের নির্ধারিত বারগুলো। ব্যক্তিগত তথ্য ব্রাউজার স্টোরেজে রাখা হয় না। ভর্তি আবেদন গ্রহণের সার্ভার এখনো সংযুক্ত হয়নি; বৈধ ফর্মও আগে জানানো নিয়মে জমা হয়নি বলে জানায়।

পরিবর্তিত সোর্স: `index.html`, `assets/css/date-time.css`, `assets/js/fee-ui.js`, `assets/js/schedule.js`, `assets/js/admission-ui.js`।

যাচাই: `tests/date-time.cjs`-এ মাস/বছর বদল, অধিবর্ষ, বাংলাদেশ দিনের সীমা, তারিখ পরিবর্তনেও ফি, ভাষা/ফরম্যাট বদলে তথ্য রাখা, ১৫ মিনিটের সীমা এবং রিসেট; বিদ্যমান fee/schedule/wizard পরীক্ষাও চালানো হয়েছে। এই পরিবেশে সরাসরি ব্রাউজারে ভিজুয়াল পরীক্ষা করা হয়নি।


---

## ADMISSION_RULES_UPDATE.md

# Approved admission copy update

Retains proposed rules 2, 5, 6, 7, 8, 9, 10 and 12; removes proposed rules 1, 3, 4 and 11 from the rules list. Adds prorated mid-month fees, next-month start option, two free pre-enrolment trial classes, and the user-provided 75% refund condition after enrolment/payment. The selected-package summary no longer displays a full first-month amount or a refund amount calculated from that full month.

This is a bilingual policy/content update. Admission remains a demo. Automated start-date billing, prorated invoices and refund execution are not implemented by this change. The payment module remains unchanged. Cancellation is stated as a separate qualifying refund condition, matching the supplied wording; no additional cancellation deadline is invented.

Validation: HTML structure, links/assets, JavaScript syntax and existing logic regression checks passed.


---

## ADMISSION_UI_UPDATE.md

# Current admission UI

The previous one-page section navigator has been replaced by a six-step wizard. See ADMISSION_WIZARD.md for current behavior, validation and verification. All controls, package pricing, prorating, Hifz and optional schedule preference features are retained. The form shows a single active section, with Next/Previous and a final review before submission.


---

## ADMISSION_WIZARD.md

# Six-step admission wizard

The admission page now shows one section at a time:
1. Student: name, gender, address, age 5–18, reading level and conditional Hifz progress.
2. Guardian: name, relationship, WhatsApp and optional email.
3. Plan, class start and first-month estimate.
4. Availability (discuss together or a chosen time window), IANA zone, 12/24-hour selection and optional notes.
5. Full admission rules and required acceptance.
6. Grouped review with edit actions, privacy consent, information confirmation and submit.

Next validates the current/prior steps before advancing. Previous preserves all values. Only visited steps can be selected from the sticky step guide; moving forward to a visited step revalidates prerequisites. Enter in an earlier step advances rather than submitting. Final submit revalidates all steps. Reset clears entries and returns to step one. State is in memory only; no student details are persisted to browser storage.

The guide indicates the active step and stays under the site header. The rules preview can be read from the introduction without unlocking later steps or checking consent automatically. A final review uses text nodes to avoid interpreting entered content as HTML.

The existing admission submission endpoint remains unconnected. A valid final submission therefore retains the form and clearly reports that it was not submitted; no mock receipt or reference is generated. This change does not deploy the site or add intake persistence.

Passed: HTML/asset/JS checks, existing package/preference tests, fee and schedule regression checks, Hifz state checks, and comprehensive wizard DOM tests. Coverage includes invalid student/guardian/date/time data, Hifz, rules/consent gates, editing/back retention, attempted step skipping, revalidation, language changes, Enter, reset and honest offline submission. Native dialog show/close behavior is stubbed in the DOM test; browser visual and real keyboard-modal QA remain unperformed.


---

## COPY_REFINEMENT.md

# Copy refinement

Rules use concise obligation wording (করতে হবে, জানাতে হবে, দিতে হবে), preserving all approved fee, trial and refund conditions. Parent/child wording is retained where it identifies the audience, such as the hero, application introduction and Hifz prompt; repetitive mentions in steps, package descriptions and scheduling have been reduced.

The hero slogan is no longer repeated in the footer. The eyebrow, admission chips and review-dialog heading have distinct copy. A check of visible Bangla strings found no exact repeated text longer than 25 characters in index.html. Short functional navigation labels, required field labels and machine-readable metadata remain consistent for usability and search. Runtime package labels necessarily repeat when showing the same selected data.

HTML/assets/JS validation, preference/package checks and Hifz state checks passed. No billing behavior changed.


---

## DEVELOPMENT_ROADMAP.md

# Development roadmap

Phase 2 source implementation is delivered; browser acceptance is still required. Phases 3–12 are not complete. Do not equate a route or mockup with a working service.

| Phase | Next deliverable | Acceptance gate |
|---|---|---|
| 2 | Browser review of this source | 320/390/768/1440px; both languages/themes; menu/keyboard/dialog/audio/form checks |
| 3 | Recorded course catalog, details and learner prototype | Clearly labeled sample courses; search/category/level filters; curriculum; no claimed purchases or protected video |
| 4 | Real auth and role foundation | Verified email, reset/logout, secure sessions; server authorization; guardian consent; no client role trust |
| 5 | Student portal connected to real enrollments | Students can access only their courses, progress and assignments |
| 6 | Guardian portal | Server verifies each child link; unrelated-child access denied |
| 7 | Teacher portal | Assigned-class/student authorization tested; attendance and feedback auditing |
| 8 | Individual tuition | Fee assignment dates, billing periods, discounts, partial payments, balances and authorized reconciliation |
| 9 | Live subscriptions | UTC instants plus IANA zone; capacity and access checks; expiry and DST tests; private meeting links |
| 10 | Payment integration | Server orders, verified amount/currency/signature, idempotency, refund ledger and audit; sandbox first |
| 11 | Admin/Super Admin | Least privilege and audited changes; role escalation and cross-account tests |
| 12 | Backend completion and operations | Versioned migrations, backups/restore rehearsal, indexes, monitoring, deployment and recovery docs |

## Dependency order
Design Phase 12's schema and server authorization BEFORE connecting Phase 4–11 interfaces. Keep the existing public design; progressively modularize rendering/data rather than replacing it with an LMS template. Use TypeScript/Node and PostgreSQL (or a reviewed managed equivalent) after choosing hosting/auth providers. No provider secrets are needed for local UI work; production integration requires configured service access.

## Data architecture to prepare
Users/profiles/roles; student/guardian links; teacher assignments; admissions; courses/modules/lessons; enrollments/progress; quizzes/attempts; assignments/submissions; attendance; student fee assignments; invoices/lines; orders/payment transactions/refunds; subscription periods and entitlements; certificates; notifications; immutable audit events.

Use server-resolved identities. Guardian links and teacher assignments are explicit records. Store money in integer minor units with currency. Invoice line items snapshot the applicable fees; recurring generation must be unique per student/billing period. Provider events need unique IDs; invoice settlement and entitlement changes occur transactionally only after independent verification. Signed media/meeting access requires current entitlement. Do not put keys, student records or meeting links into public files.

## Required owner content/configuration
Approved teacher details and audio, real course curriculum/videos, contact email/WhatsApp, approved pricing and refund/privacy policies, target hosting/auth/database, video service and sandbox gateway details. Never put credentials into this source ZIP. Live transactions require the owner's explicit authorization.

## Browser acceptance checklist
- At 320/390/768/1440px: no horizontal overflow or clipped focus; header never covers anchors.
- Keyboard: skip link, menu toggle, Explore, Escape focus restoration, teacher/review dialogs.
- Both languages and themes persist after reload; blocked localStorage does not break initialization.
- Navigate Home → Admission → Teachers; direct #/courses and #/login; back/forward.
- Each plan preselects correct form option and summary; invalid errors correspond to fields.
- Valid sample admission/review shows demo-only outcome; no network submission.
- Preview valid and invalid audio, seek, volume, single-player behavior, close dialog.
- Choose every country; confirm displayed local date/time and IANA daylight-saving behavior.
- Confirm footer and navigation entries; reduced motion; 200% zoom; screen reader labels.


---

## FAQ_UPDATE.md

# Always-visible FAQ

All six bilingual questions and answers are now semantic article cards in index.html. They are visible without JavaScript or an expand/collapse action. Desktop uses question/answer columns; mobile stacks the answer below its question. Numbered badges, readable spacing and scoped light/dark styles improve scanability. The lesson-method answer now refers to the website classroom portal rather than the retired Zoom wording; other approved conditions are preserved.

Passed: HTML/asset/JS validation, existing preference/package logic, and a no-script DOM check that all six questions and answers exist in both languages with no hidden panels or click controls. No browser visual QA was performed.


---

## FEE_CALCULATOR.md

# Admission fee estimate

Date editing was refreshed: `fee-start` is now a keyboard/mobile-accessible full-date select with quick choices; it is not a locked native date input. See [ADMISSION_DATE_TIME.md](HISTORY.md). ISO dates and the calculation rules below remain unchanged.

The form offers a start date in the remaining current month, or the first day of the next month. Dates are based on Asia/Dhaka. For prorated enrolments, calendar days are counted inclusively from the enrolment date, including non-class days. Enrolment on days 1–7 costs the full monthly fee. From day 8 the integer minor-unit formula is round(monthly_minor * remaining_days / days_in_month). This month’s estimate uses today in Asia/Dhaka as the prospective enrolment date, independently of the preferred class start date. Next-month starts cost the full monthly fee. BDT and USD estimates follow the existing displayed package prices. February/leap years and month lengths are handled automatically. Full-month starts cost the full package price.

The form and package sidebar display the estimate. Invalid or past dates block submission. The rules notice appears above the form with a jump button, and the required consent explicitly acknowledges personal reading and understanding.

This is the admission demo calculator, not a payable invoice. The existing secure payment module continues to use server-issued billing charges; it never trusts this client quote. Start-date approval, automatic issuance of prorated billing charges and refunds are not connected to the demo form. The user-facing estimate explicitly requires administration confirmation before actual billing.

Tests: tests/fees.cjs (requires jsdom), tests/schedule.cjs, tests/logic.cjs and tests/verify.py passed. No browser visual review was performed for this update.

Required student gender (boy/girl) sits beside the full name on desktop and below it on mobile. Fee boundary tests cover days 1, 2, 7 and 8 for all three package prices.


---

## HIFZ_UPDATE.md

# Hero and Hifz update

Hero and matching brand/metadata copy now read “দেশে কিংবা প্রবাসে—সবার জন্য কুরআন শিক্ষা”. The English hero reads “Quran learning for everyone, at home or abroad”.

The admission reading-level group includes Hifz. Selecting it reveals a bilingual progress textarea, required only for Hifz. Examples include juz, surahs, full memorisation or not started yet. Switching away disables the field and clears validation state while preserving the draft if switched back. This records the child’s current learning level; package offerings and fees are unchanged. Admission remains a demo with no server persistence.

HTML/asset/JS checks, existing logic checks and focused Hifz state checks passed. Browser visual QA was not performed.


---

## INSPECTION_REPORT.md

# Initial project inspection

The archive contains one static HTML document, one CSS file, one JavaScript file, an original HTML backup and four Markdown reports. There is no package manifest, build system, framework, server, database, migration, API endpoint, authentication provider or payment integration. CSS and JS were extracted in Phase 1 from a monolithic recovered source.

Homepage and admission views use hash routing. JavaScript generates teachers, prices, FAQ, review placeholders and form options. Bangla/English text is held in adjacent spans; CSS selects the active language. Admission and review forms validate locally and then display demo completion; they make no server request. Teacher audio is uploaded locally to an object URL and is not persisted. Time comparisons use Intl.DateTimeFormat and IANA zones. Google Fonts are the only observed external runtime asset dependency; logo and three portrait files were embedded WebP data.

Found omissions: mobile menu, theme switcher, Login and Courses entries, active navigation and complete footer navigation. Found concerns: partial dark styling, expensive canvas backgrounds, unhandled audio playback promises, broad validation error selectors, unsupported popularity/discount displays. These were addressed in Phase 2.

Placeholder/missing content: teacher biographies/credentials and public recitation files, FAQ policy answers, authentic reviews, contact email/WhatsApp, approved admission/refund and privacy policy. These are content requirements, not broken local file references. No new credentials, testimonials, enrollment totals or accreditation were invented.

Verified: structural asset paths, original image integrity, script syntax, preference initialization, pricing retention and winter/summer time offsets. Browser interaction and rendered appearance have NOT been verified. See TEST_RESULTS.md.


---

## LIVE_CLASS_DELIVERY.md

# Live class module delivery

## What changed

The website now links to `/live/` from navigation, the existing student-login route and footer. The classroom module offers role-scoped accounts, assigned classes, server-derived live room status, visible supervision, silent previews, interactive video lessons, microphone moderation, join locking, end/remove controls, sampled attendance and audit logs.

Source is in `live-class/`, compiled browser assets in `live/`. Setup and production hosting instructions are in `live-class/README.md`; Nginx and systemd templates are in `live-class/deploy/`. The uploaded reference files are retained byte-for-byte in `live-class/reference/`.

## Architecture decision

The uploaded code used Jitsi with teacher login and public student entry. This implementation uses LiveKit for authenticated multi-room management and server-side media controls. It uses a separate Node/SQLite classroom service, so existing Supabase payment data, accounts and secrets are not changed. Single sign-on and admission/billing-to-roster automation are not included.

The app controls class access, not device permission. Cameras and microphones begin off. A supervisor appears with a labelled identity. Silent previews have no audio renderer or publish grant; interactive supervision can publish at the supervisor's own request. Up to four previews can be open at once; the dashboard lists all assigned/authorized rooms. Capacity across real networks has not been benchmarked.

## Validation

15 tests pass using actual SQLite/Express authentication and an injected media adapter. The LiveKit SDK token test is real, but network/video moderation calls in tests are simulated. Coverage includes role isolation, CSRF origin, cookie sessions, roster access, lock behavior, end/remove failures and retry, token races, password reset invalidation, upstream-error sanitization and independent room reconciliation. Production frontend build passes. A real Node process startup check also passed: unconfigured-media health and compiled-portal/static asset serving work. Public-only staging was checked to exclude environment files, databases and server source. Existing public HTML/assets/JS, package/preference and Hifz checks pass.

No real media-server, browser camera/microphone, screen-sharing or concurrent device test has been performed. The module is not deployed. No LiveKit credentials, production origin or hosting details were provided. Deployment is therefore a required remaining step, not a completed live service.

## Operational limits

Dashboard polling: six seconds. Sampled attendance/enforcement: approximately ten seconds while the worker and media API are healthy. Locking prevents fresh student token issuance; already-issued tokens may connect before expiration. Removing/ending first persists the access restriction, then attempts media disconnection/deletion, with periodic retry. It is not instantaneous token revocation. Muting affects current microphones, with self-unmute still possible. Recording is not configured.

For production, configure the media endpoint and server-only keys in the environment, create the first administrator through the bootstrap command, and run the documented two-device acceptance checks. Never upload the full project source tree to the web server's public directory; use the provided staging script.


---

## LIVE_CLASS_ENTRY_UPDATE.md

# Live classroom entry points

The integrated `/live/` page now has a highlighted main-navigation link, a prominent hero button, and a dedicated home-page section explaining student, teacher and administrator access. Existing login-route and footer links remain. Every entry uses the same website-relative `live/` destination; the classroom API still requires the documented hosting/media configuration. The login-route metadata no longer incorrectly says the service is unavailable.

HTML/assets/JS and existing package/preference checks passed. Link checks confirmed all five entry locations point to the compiled live portal. This update changes discovery and copy, not media permissions or billing. No deployment was performed.


---

## LIVE_CLASS_PAGE_FIX.md

# Classroom page opening fix

Cause: website links targeted the `live/` directory; some local/static environments opened a directory listing. Absolute module assets in the earlier build also depended on a web server at the domain root.

All entry links now explicitly target `live/index.html`. Vite emits relative assets and an inline IIFE; portable-build.mjs changes the generated entry to a classic deferred script. This allows the designed login UI to execute when opened from disk and from a hosted subfolder. Actual media/auth still require the API and media server. A clear setup banner distinguishes local/static preview from connected login, and no local credentials are sent.

Checks passed: compiled-entry DOM execution under file and hosted-subfolder URLs, local API-call suppression, hosted login readiness, main HTML/assets/JS structure and existing package/preference logic. No visual browser or live media test was performed.


---

## PARENT_COPY_UPDATE.md

# Parent-facing copy revision

Admission rules now describe the policy in short, informative sentences rather than direct commands. All eleven approved policies remain, including the 1–7 full-month rule, prorating from day 8, two trial classes, and 75% refund condition.

Home hero, learning steps, package descriptions and actions, admission introduction/notice, schedule availability, start-date prompt, FAQs, metadata and payment heading now distinguish the guardian completing the form from the child receiving lessons. Operational controls still use concise action labels. The inclusive brand tagline is retained.

Checks passed: HTML/assets/JavaScript validation, existing preference/package logic checks, and payment production build. DOM interaction suites could not rerun because the temporary jsdom dependency was unavailable; this update changes copy only. No browser visual review performed.


---

## PARENT_REVIEWS_UPDATE.md

# Parent reviews upgrade

The homepage's **অভিভাবকদের মতামত** section now uses a balanced editorial layout: an invitation and feedback topics alongside a bordered experience journal. The green/gold brand, Quran background typography, Bangla/English language switching and light/dark preferences are retained. No fictitious testimonials, ratings, review counts or verified-customer badges have been introduced. The empty state is rendered directly in HTML, including before JavaScript loads; the old empty carousel/arrows were removed.

The redesigned dialog includes guardian name, country, an optional accessible 1–5 star rating with clear/reset, a 600-character counter, writing guidance, publication consent and an escaped draft preview. The preview can be edited or explicitly copied. Closing and reopening retains the draft in memory; refreshing clears it. No parent/child data is stored in browser storage, sent to a new service or automatically published.

**Review submission remains unconnected.** This is disclosed before writing. The online-submit button is disabled; preview/copy work independently. A programmatic submit is also guarded and cannot display fake success. Actual public reviews will require the future receiving, moderation and publication service plus real consented review data.

Changed: `index.html`, `assets/css/reviews.css`, `assets/js/reviews.js`; obsolete review handlers removed from `assets/js/app.js`. Existing admission regression checks were updated to load the independent review controller.

Verified: HTML/asset/JavaScript checks, original brand-image hashes, feedback preview/escaping/rating/copy/privacy interactions and the existing admission wizard. No actual browser visual inspection or server deployment was performed in this environment.


---

## PAYMENT_DELIVERY_REPORT.md

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


---

## PHASE1_CHANGELOG.md

# Premium Phase 1 — verified changes

- Preserved original website layout, images, audio-player implementation and all source content.
- Localized the keyboard skip-to-content link into Bengali and English.
- Added a named main landmark.
- Added accessible language-switch button text and kept it synchronized with the current language.
- Persisted explicit language preference locally, with safe fallback when storage is unavailable.
- Added color-scheme metadata for browser form controls.
- No backend, payments or course LMS claimed or added.

## Verification
See TEST_RESULTS.md for executed checks.


---

## PHASE2_CHANGELOG.md

# Phase 2 change log — 2026-10-14

## Phase 1 issues addressed
- Mobile navigation was hidden without a replacement menu: added an accessible disclosure menu, link/outside/Escape closing and breakpoint reset.
- No theme control existed: added persistent light/dark selection, safe blocked-storage fallback and early initialization; corrected light-only section and admission colors.
- Previous generic `.bad ~ .er` rule exposed unrelated errors: restricted messages to the corresponding field and added aria-invalid state.
- Audio play rejection was unhandled: added a visible playback-error message.
- Original “Most Popular” claim had no supporting evidence: replaced it with a factual curriculum label. Hid unverified reference discounts, preserving monthly plan prices and the source data.

## Public site improvements
- Preserved branding, teacher artwork and original page content structure.
- Sticky responsive header, Explore disclosure, current-link indicators, Courses and Student Login entries, admission CTA and extended footer links.
- Refined hero hierarchy, logo presentation, three-step learning introduction, spacing and restrained card styling.
- Moved four embedded WebP images to reusable local files without changing any image bytes.
- Replaced runtime canvas/background packing with a subtle CSS geometric hero motif. This removes the previous rotated-verse background treatment and repeated full-section bitmap generation; it does not claim a measured Lighthouse improvement.
- Removed automatic review rotation; retained manual controls. Reduced sample review cards from five to three; all remain explicitly labeled samples.
- Added explicit unverified teacher labels, pending-policy notice and package confirmation copy.
- Added clearly unavailable Courses/Login views, with bilingual titles/metadata. No password fields or fake authentication.

## Retained behavior
Bengali/English switching, admission demo and selection summary, teacher dialogs, audio file preview/player, all nine international clock choices, package curriculum, FAQ disclosures and review demo.

## Checkpoint
Exact original uploaded ZIP included under checkpoints/. The Phase 1 reports and original backup remain for provenance. Current verification is in TEST_RESULTS.md; Phase 1 reports describe historical work only.

## Phase 2.1 visual restoration — user feedback
- Restored the exact Phase 1 Quran-verse typography renderer and 8% RGBA opacity on its original homepage sections and footer, including font-load and resize refresh. The original hero Arabic heading remains.
- Removed Phase 2 overrides that suppressed logo breathing/glow and expanding rings. Original br/rp keyframes apply again.
- Restored the clock's rotating dotted orbit and blinking live indicator by removing the animation override.
- Refreshed the verse background when navigating back to the homepage.
- Retained the system reduced-motion accessibility setting.
- These changes supersede the earlier changelog entry about replacing the verse backgrounds.

## Phase 2.2 — text contrast
Improved FAQ hover, open and keyboard-focus colors in both themes. Added explicit foreground/background pairs for all three plan CTAs, including hover/focus and dark mode. Removed low-opacity curriculum exclusions. Preserved restored logo, typography and clock animations.

## Phase 2.3 — heading and logo refinement
Set explicit dark-green/light-gold FAQ heading colors by theme. Reduced logo breathing scale to 1.012 and halo to 16–22px at low opacity. Made two gold wave outlines clearer, staggered by three seconds, without extra glow. Reduced-motion remains respected.

## Phase 2.4 — title and header brand
Strengthened FAQ title to weight 800 and explicit deep-green/warm-gold colors. Removed the active-location underline from the header brand only; retained navigation active indicators and keyboard focus outlines. Increased both brand lines’ weight and contrast in light/dark themes.

## Phase 2.5 — inclusive public messaging
Rewrote Bangla and English hero, introduction, learning benefits, plans, global section, admission introduction, footer and FAQ wording to welcome learners in Bangladesh and abroad. Updated HTML title, metadata, JSON-LD description and runtime SEO strings. Main message: দেশে কিংবা প্রবাসে—সবার জন্য কুরআনের আলো। Existing admission age rules and guardian requirements were not changed by this copy edit.

## Phase 2.6 — default theme and FAQ heading
First visit now defaults to light mode irrespective of OS theme; an explicitly saved dark/light preference still wins. Blocked storage falls back to light. Dark-mode FAQ heading uses deep green on an explicit off-white backing for reliable contrast, replacing pale gold.

## Phase 2.7 — approved admission age
Owner confirmed admission is for ages 5–18 only; no separate adult program. Updated HTML input constraints, integer age validation, bilingual errors, eligibility note and the FAQ age answer. Other policy answers remain placeholders.

## Phase 2.8 — approved FAQ answers
Added six owner-supplied answers, polished in Bangla and English: worldwide applications; Zoom classes; ages 5–18; availability-based scheduling and batch times; administration follow-up; bKash/Nagad/Rocket fees. Removed FAQ sample-answer notice. No online payment integration or account numbers added.


---

## PUBLIC_COPY_UPDATE.md

# Public wording update

The hero's yellow action now reads “ভর্তি আবেদন” / “Apply for admission”. The live-class entry is retained. The three introduction steps now cover learning plans, scheduling and two free trial lessons; the redundant admission-data instruction is removed.

Public HTML and runtime scripts no longer contain demo/prototype labels. Placeholder review cards were replaced with an honest empty state. Admission and review mock-success paths were removed: valid forms now retain inputs and display an explicit not-submitted message while their submission endpoints remain unconnected. No false reference ID is issued. This is a wording/readiness update, not deployment or new form persistence.

Passed: HTML/assets/JS structure, preference/package logic, admission UI and submission-honesty checks, fee calculation and schedule checks. No media changes were made.


---

## RECEIPT_DESK_UPDATE.md

# ফি ও রসিদ ডেস্ক

মূল সাইটের **আরও → পেমেন্ট ও রসিদ** এবং ফুটারের লিংক এখন সরাসরি `payments/index.html` খোলে। ফোল্ডারের তালিকা দেখায় না। আপডেট করার সময় পুরোনো `payments/` ফোল্ডারটি নতুনটির সঙ্গে প্রতিস্থাপন করতে হবে।

## এখন যা করা যায়

- মাদরাসার আসল লোগো ও বাংলা/ইংরেজি নামসহ রসিদের সরাসরি প্রিভিউ।
- শিক্ষার্থী, আইডি, অভিভাবক, যোগাযোগ, বিলের মাস ও পরিশোধের তারিখ সম্পাদনা।
- মাসিক বেতন, প্রথম মাসের বেতন, ভর্তি ফি বা অন্যান্য ফি নির্বাচন।
- Basic ৳999, Standard ৳1999, Premium ৳2999; প্যাকেজ থেকে স্বয়ংক্রিয় অঙ্ক।
- প্রথম মাস: ভর্তির ১–৭ তারিখে পূর্ণ ফি; ৮ তারিখ থেকে ভর্তির দিনসহ অবশিষ্ট ক্যালেন্ডার দিন অনুযায়ী হিসাব। প্রতি টাকায় ১০০ পয়সা ধরে পূর্ণসংখ্যায় হিসাব ও শেষে রাউন্ড করা হয়।
- কারণসহ বিশেষ ফি, ছাড়, আসলে পাওয়া অর্থ, এই বিলের বাকি, বাংলায়/ইংরেজিতে টাকার অঙ্ক কথায়। এটি সম্পূর্ণ শিক্ষার্থী-লেজারের মোট বকেয়া নয়।
- নগদ অর্থ, bKash, Nagad, Rocket বা ব্যাংকে **ইতোমধ্যে পাওয়া** টাকা অফিস থেকে নথিভুক্ত করার মাধ্যম। এই নির্বাচন কোনো টাকা আদায়/ট্রান্সফার করে না।
- অ্যাডমিন যাচাইয়ের পর স্থায়ী রসিদ নম্বর, সংরক্ষিত কপি, তালিকা/অনুসন্ধান এবং Print / PDF। ব্রাউজারের প্রিন্ট ডায়ালগে Save as PDF বেছে নিতে হবে।
- ভুল রসিদ কারণসহ বাতিল করা যায়; রেকর্ড/অডিট মুছে যায় না। ইস্যুর পর অঙ্ক/পরিচয় সরাসরি বদলানো যায় না। একই MFS/ব্যাংক লেনদেনের রেফারেন্স বাতিলের পরও দ্বিতীয় রসিদে ব্যবহার করা যায় না; সংশোধনে অফিসকে মূল রেকর্ড সংরক্ষণ করে সমাধান করতে হবে।
- মোবাইল, light/dark, বাংলা/ইংরেজি। আগে প্রথমবার light mode, পরে পছন্দ মনে রাখার নিয়মই বজায় আছে।

## চালু করার জন্য

ডিস্ক থেকে `index.html` খুললেও খসড়া সম্পাদনা ও প্রিভিউ চলবে। কোনো লগইন/ব্যক্তিগত তথ্য ডিস্ক প্রিভিউ থেকে সার্ভারে পাঠানো হয় না। ব্যবহারকারীর তথ্য localStorage-এ রাখা হয় না; শুধু ভাষা/থিম পছন্দ রাখা হয়। সার্ভার ছাড়া খসড়া থেকে কোনো চূড়ান্ত রসিদ বা পরিশোধের প্রমাণ তৈরি হয় না।

চূড়ান্ত রসিদের জন্য আগে যুক্ত **`live-class/` Node সার্ভার ও অ্যাডমিন অ্যাকাউন্ট** চালু করতে হবে। একই অ্যাডমিন ইমেইল/পাসওয়ার্ড ও সেশন ব্যবহার হয়; ভিডিও সার্ভার বা Supabase সংযোগের প্রয়োজন নেই। শিক্ষক/শিক্ষার্থী রসিদ তৈরি, তালিকা পড়া বা প্রিন্টের API ব্যবহার করতে পারেন না।

1. `live-class/README.md` অনুযায়ী Node 24.19+, `.env`, `APP_ORIGIN`, `DB_PATH` ও প্রথম অ্যাডমিন কনফিগার করুন।
2. আগের SQLite ডেটাবেস ব্যাকআপ নিন। `npm start` করলে version 3-এর সংযোজনমূলক মাইগ্রেশনে রসিদের টেবিল তৈরি হবে; পুরোনো অ্যাকাউন্ট/স্থায়ী আইডি/ক্লাস অক্ষুণ্ণ থাকে।
3. একই HTTPS origin-এ প্রকাশ্য সাইট ফাইল পরিবেশন ও `/api/live/` রিভার্স প্রক্সি করুন (`live-class/deploy/nginx.conf.example`)। রসিদ পেজ `payments/index.html`।
4. **অফিস লগইন → তথ্য ও যাচাই রেফারেন্স → টাকা পাওয়ার সত্যতা যাচাইয়ের টিক → রসিদ ইস্যু → Print / PDF**। লাইভ ক্লাসের অ্যাডমিন অংশেও রসিদ ডেস্কের লিংক আছে।
5. প্রতিদিন SQLite ডেটাবেসের সঠিক ব্যাকআপ রাখুন। রসিদ সার্ভারে সেভ হয়; ব্রাউজারের খসড়া রিফ্রেশে মুছে যায়।

অ্যাডমিনকে নিজের ক্যাশবুক/প্রাপকের হিসাব/স্টেটমেন্ট দেখে টাকা পাওয়ার বিষয়টি যাচাই করতে হবে। যাচাইয়ের প্রাইভেট রেফারেন্স রসিদে ছাপা হয় না। শুধু SMS বা শিক্ষার্থীর দাবিতে চূড়ান্ত করা হয় না। এটি কর্তৃপক্ষের নথিভুক্ত অর্থপ্রাপ্তির রসিদ, কোনো MFS সেবাদাতার settlement সনদ নয়। PIN বা OTP-এর কোনো ইনপুট নেই।

## অনলাইন পেমেন্ট পরে

বর্তমান ডিফল্ট `VITE_ENABLE_ONLINE_PAYMENTS=false`। অনলাইন পেমেন্ট ট্যাবে প্রস্তুতির পেজ থাকে; কোনো নম্বর বানানো হয়নি, কোনো টাকা পাঠানোর সক্রিয় নির্দেশনা নেই। আগের Supabase মডিউল, মাইগ্রেশন, Edge Functions, যাচাই ও PDF-এর সোর্স রাখা আছে; পুরোনো React পেজ এখন `payment-module/src/GatewayPortal.tsx`।

পরে gateway চালুর আগে `payment-module/docs/DEPLOYMENT.md` অনুসরণ করে প্রকৃত কনফিগারেশন, গ্রহণকারী হিসাব, যাচাইকৃত SMS নমুনা ও সার্ভার যাচাই সম্পূর্ণ করতে হবে। Node-এর ম্যানুয়াল রসিদ ও Supabase-এর পেমেন্ট লেজার এখন আলাদা; স্বয়ংক্রিয় সিঙ্ক বা দুই ব্যবস্থার মধ্যে এক লেনদেন একবার ব্যবহার করার দাবি নেই। ভবিষ্যতে অনলাইন ব্যবস্থা চালুর **আগে** এই লেনদেনগুলো একক লেজারে স্থানান্তর/সমন্বয় করতে হবে। শুধু flag বদলানো পূর্ণ সংযুক্তি নয়।

## ডেভেলপমেন্ট

- `payment-module/`: `npm ci`, `npm run dev` (5173; Node API-তে proxy), `npm run build`। আউটপুট `payments/`।
- `live-class/`: `npm test`; UI লিংক বদলালে `npm run build`।
- `shared/receipt-core.mjs` / `.d.mts`: একই ফি/অঙ্কের নিয়ম, সার্ভারে পুনরায় যাচাই।
- `live-class/server/receipts.js`: স্কিমা, admin-only API, atomic নম্বর/ইস্যু, idempotency, uniqueness, print recheck ও void/audit।
- `tests/receipts-ui.cjs`: তৈরি করা bundle-এর file/hosted প্রিভিউ, ফি, অনুমতি, response হারিয়ে retry, প্রিন্ট ও বাতিলের পরীক্ষা; jsdom প্রয়োজন।

কোনো বাস্তব সার্ভার, MFS লেনদেন বা প্রিন্টার চালু করা হয়নি। এই পরিবেশে ব্রাউজার ভিজুয়াল/প্রকৃত Print-to-PDF পরীক্ষা করা সম্ভব হয়নি; কাঠামো, কম্পাইল করা UI-এর আচরণ ও সার্ভারের ইন্টিগ্রেশন পরীক্ষা করা হয়েছে।


---

## RECOVERY_REPORT.md

# Recovery Verification Report

## Completed
- Recovered complete document from `index.backup-phase1.html` instead of Qwen's truncated phase-2 exports.
- Extracted original CSS and application JavaScript without content modification.
- Preserved JSON-LD structured data, embedded images, site content and application markup.
- Verified that extracted CSS and JavaScript match the source backup character-for-character.
- Verified presence of home, admission, teacher, timezone, packages, FAQ, reviews, and admission form DOM IDs.
- Verified referenced local JS and CSS files exist.
- Node.js JavaScript syntax check passed (`node --check assets/js/app.js`).

## Not verified
- Automated headless browser test did not finish in this execution environment.
- Visual pixel comparisons and manual end-to-end interaction tests are pending.
- Network delivery and live deployment performance were not measured.

## Important limitations
- Existing admission and reviews are demo-only, not connected to any database.
- No working checkout, recurring payments, or protected course LMS was added.
- CSS/JS extraction alone is a maintainability improvement, not evidence of higher Lighthouse performance.


---

## RESPONSIVE_UPDATE.md

# Responsive website update — 24 October 2026

The public website, admission wizard, classroom portal and receipt desk now adapt to narrow phones, tablets, laptops and wide monitors while preserving the existing branding and approved admission policies.

## What changed

- A flexible header keeps the logo, language control, theme control and menu inside narrow screens. The compact navigation opens as a scrollable panel and still closes with Escape.
- Hero buttons, package cards, teacher cards, clock panels and feedback cards reflow according to the available width. Tablets use two columns where helpful, with a centred final card.
- The mobile admission guide uses six readable numbered controls plus the current section's title. Progress remains visible beneath the header. The lower action bar accounts for the safe area; short landscape screens use normal document flow to leave more room for fields.
- Form fields, calendar/time controls and touch controls have comfortable sizes. Long names, IDs and review text wrap within their cards. Feedback and rules dialogs stay within the viewport and can scroll.
- Classroom login, setup forms, class actions, account lists and monitoring containers fit narrow screens. The activity table has a named, keyboard-focusable horizontal scrolling region.
- The receipt editor and preview stack on tablets and phones. Preview details, totals, signature areas and office forms adapt to the available space. The receipt register is a named scrolling region. Screen refinements are scoped away from the existing A4 print layout.
- Removed a stale home-route call to the retired review carousel so the clock refresh is no longer interrupted by an undefined function.
- The GitHub packaging workflow rebuilds changed classroom/receipt sources before packaging, keeping compiled pages and the complete ZIP aligned.

## Verification

- Production builds passed for both React applications, including receipt TypeScript checking.
- All 11 existing public verification scripts passed: HTML/assets, preferences/clock/prices, admission wizard, fees, date/time controls, scheduling, Hifz, feedback, receipt UI, live access and portable classroom entry.
- Chromium browser checks passed for all six public pages at 320, 360, 390, 600, 768, 820, 1024, 1100, 1280, 1536, 1920 and 2560px iframe widths, at both 844px and 375px heights: **144 layouts**, with no document overflow or off-screen controls/headings.
- English/dark checks passed at 320, 768, 1280 and 2560px, at both heights: **48 layouts**. The classroom portal retains its existing Bangla/light presentation.
- Fictional administrator class/setup/audit pages, the student dashboard and the receipt register passed at 320, 768 and 1280px, at both heights: **30 additional layouts**. The complete browser matrix covered **222 layouts**.
- A real browser was used to progress through all six admission steps at 320px, including Hifz, a long student/guardian name, a preferred start date, specific times and switching to 24-hour format. The 375px-high check kept the progress guide below the header. No application was submitted.
- The 320px compact menu and feedback dialog were checked. The menu stayed within the 305px content viewport with a classic scrollbar; the feedback dialog's content had no internal horizontal overflow.

## Repeating the browser checks

Serve a public-only preview as described in the main README. Copy `tests/responsive-preview.html` to the preview root as `qa.html`, then open it over HTTP. The harness tests real iframe viewports and reports page overflow and off-screen controls; it does not emulate a particular physical device.

`tests/responsive-fixtures.cjs` uses jsdom to create fictional, script-free administrator/student snapshots from the compiled applications. Give it a public preview directory outside the project. These snapshots are layout fixtures; they are not real accounts or payment records and are not included in the public build or release package.

Browser verification used Chromium. Physical iOS/Android devices, camera/microphone behavior and live media connections were not exercised by these layout checks.


---

## SCHEDULE_UPDATE.md

# Admission schedule update

The latest date/time editing UI is documented in [ADMISSION_DATE_TIME.md](HISTORY.md): larger labelled time cards, exact-hour defaults, partial-entry retention across format/language changes and bounded 15-minute adjustments. A form reset now clears both canonical hidden times and incomplete clock drafts.

Basic and Standard have five class days, Saturday–Wednesday. Premium has six class days, Saturday–Thursday. Public package cards, admission package options and the summary show these fixed days. Day selection is removed from the availability form.

Time selection defaults to 12-hour with AM/PM, with an explicit 24-hour switch. The custom hour/minute controls guarantee the requested format independently of browser locale. Switching preserves complete times. Shortcuts and the live summary use the selected format. Canonical hidden times remain HH:mm, with an IANA time zone; future backend integration must validate these independently. Same-day end times must follow start times. No booking is promised, and teacher/batch availability still determines the final time.

Guardian name remains required; a required relationship selection now accompanies it, with bilingual options for father, mother, brother, sister, grandparent or other guardian.

The admission form remains a demo with no submission persistence. The payment module is unchanged.

Validation: HTML/assets/JS checks and preference/package regression checks. Run the schedule interaction checks with jsdom installed: `NODE_PATH=/path/to/node_modules node tests/schedule.cjs`. Browser visual QA has not been performed for this update.


---

## STICKY_STEPS_UPDATE.md

# Sticky admission steps

The form guide now sticks directly below the site navigation. Header and guide heights are measured responsively to prevent overlap. Section targets account for the sticky guide, and the desktop summary stays beneath it. Mobile spacing is compact.

The active section is calculated from all section positions on scroll, including scrolling back upward. A bilingual “Current section: N / 4” indicates reading/navigation position, not validation completion. The guide is hidden on demo completion and when leaving the admission route. Functional checks cover scroll position changes and existing navigation/submission behavior; no browser visual check is available.


---

## STUDENT_ACCESS_UPDATE.md

# Permanent student IDs and private administration

The administrator creates student accounts with permanent cryptographically random classroom IDs. Passwords can be generated automatically. IDs have no expiry and remain stable through password reset, class changes, deactivation and reactivation. Only assigned active students receive media tokens. Disabling an account revokes application sessions; connected media removal still follows the documented reconciliation interval/connectivity limits.

Only administrators can create accounts, list all accounts, assign students, see audits and request supervision previews. Students see only their own assigned classes. Teachers retain their own teaching/moderation controls but cannot issue IDs or access central supervision. Public landing/login copy no longer advertises supervision. Identity migration is additive and preserves existing accounts/password hashes.

Admin operation: portal login with the bootstrap email/password → ক্লাস ও অ্যাকাউন্ট → স্থায়ী ক্লাস আইডি তৈরি → copy ID/password privately → assign to class. Student login uses issued ID/password. Staff email login works in the login-ID field. No default admin password exists.

Tests: 20 backend/SQLite/SDK tests and compiled UI role-visibility/credential tests pass. Portable local/hosted page execution and public HTML checks pass. No production deployment or real-camera test has been performed. Setup is documented in live-class/README.md. All site, admission, payment and classroom source/build files are included in the single website ZIP.


---

## SUPABASE_CONNECTION.md

# Supabase connection foundation

Project: `annoor-madrasa` (`jbmxquvgrekyapcoezmh`), Mumbai region, separate from the examination-board application.

`assets/js/backend-config.js` contains only the public project URL and publishable key. Privileged keys must remain outside the public website and ZIP.

This checkpoint configures the website connection. Admission persistence, administrator provisioning, online payments and classroom-account migration are still pending. Existing honest unsubmitted-form behavior is retained. The owner deferred choosing the first administrator email.

Next: versioned admission schema with RLS, validated submission endpoint, server fee calculation, idempotency/rate limits, private administration and hosted integration tests.


---

## TEST_RESULTS.md

# Phase 2 verification — 2026-10-14

## Executed and passed
- `python tests/verify.py`: strict HTML tag nesting; 69 unique IDs; 32 navigation links resolve to known sections/routes; 7 direct local asset references exist; JavaScript image paths exist.
- Four original WebP images match SHA-256 hashes of the original backup's decoded assets. Logo and portraits were not regenerated or altered.
- `node --check` on all three application JavaScript files: syntax passed.
- `node tests/logic.cjs`: five preference initialization cases (light/dark OS defaults, saved preference, invalid values and blocked storage); all passed.
- Original IANA time calculation: Dhaka is six hours ahead of London in January 2026 and five in July 2026; both passed.
- Three inherited monthly BDT prices (999, 1999, 2999) and five-subject inclusion matrix retained.

## Not executed / limits
The permitted browser-control capability was unavailable in this environment. No browser preview server, screenshots, DOM interaction tests, visual/mobile regression, screen-reader audit or Lighthouse run was performed. Offline checks do not prove visual quality, keyboard interaction or media playback in Chrome/Edge. Use DEVELOPMENT_ROADMAP.md's browser checklist before publishing.

No backend, authentication, payment, protected course media, live meeting integration or actual form submission exists to test. These are future phases, not passing tests. Existing FAQ/profile/contact placeholders and policy approvals remain outstanding.

## Phase 2.1 restoration checks
Original typography renderer compared verbatim to Phase 1: PASS. All five decorative RGBA colors retain .08 opacity. CSS no longer overrides original logo/ring/orbit/live-indicator animations. Existing structural, asset, JavaScript syntax and logic tests rerun: PASS. Browser visual verification remains unavailable; no screenshot-based claims are made.

## Phase 2.2
Structural, JavaScript and logic regression checks rerun successfully. CTA and FAQ text foreground/background pairs were numerically checked against WCAG 4.5:1 normal-text contrast. Browser visual checks remain pending.

## Phase 2.3
JavaScript/structural/logic regression checks passed. Reviewed explicit FAQ heading specificity and separate logo halo/wave rules. Browser rendering remains unverified.

## Phase 2.4
Structural and logic checks rerun. Explicit header brand selectors override the generic active-link underline. FAQ and brand text color pairs numerically exceed 4.5:1 against their light/dark backgrounds. Browser appearance remains unverified.

## Phase 2.5
Checked active HTML/JS for obsolete expatriate-only marketing; JSON-LD parsing, HTML structure, local assets, JS syntax and existing logic checks passed. Browser text wrapping remains unverified.

## Phase 2.6
Six preference cases passed: fresh light/dark OS sessions both open light, saved dark is restored, saved light/language is restored, invalid values and blocked storage fall back to light. Existing structural and time-zone checks passed. Dark FAQ heading uses #032f22 on #f8faf9. Browser rendering remains unverified.

## Phase 2.7
Age boundaries checked against actual validation expression: 4/19/4.9/5.5 rejected; 5/18 accepted. Structural, asset, JS syntax and previous logic checks passed. Owner reported the preceding visual version working in their browser; this age edit has not received a new browser test.

## Phase 2.8
Confirmed six bilingual FAQ answer pairs and no remaining FAQ placeholder. JavaScript syntax, structural and existing logic tests passed. Content changes have not undergone a new browser test.


---

## Jitsi compatibility — 25 October 2026

Added self-hosted/JaaS signed Jitsi join adapters and an embedded classroom with visible silent supervision. Preserved existing student IDs, private role controls, receipt/admission data and LiveKit selection. Jitsi dashboard metrics and verified attendance are marked unavailable; standard iframe controls do not imply server-level moderation. Current setup and verification boundaries are in OPERATIONS.md. No real media service was activated.


## 2026-10-25 — Lessons, individual progress and manual local recording

Preserved the existing website/admissions/fees/receipts and private Jitsi/LiveKit classroom. Added searchable class/account lists, shared lesson notes/homework, role-scoped teacher-entered attendance and Qaida/Quran/Hifz reports, versioned atomic saves, audit entries and admin next-session creation with allowed active roster copying. Students see their own evaluation only. Added explicit staff-only browser recording with tab audio, an optional clearly labelled microphone mix, selected local-file output or bounded downloadable parts, a visible expiring recording notice, timer, safe stop/cancellation and honest file-error states. Files remain on the recording operator's computer; no automatic recording, uploads or course publication.

Current operations and activation limitations are in `docs/OPERATIONS.md`. The expanded Node suite passed 50 tests; compiled workflows, earlier access/Jitsi/receipt/portable checks, 60 responsive fictional layouts and synthetic native-browser encoding/playback were verified. Actual media hosting, real two-device calls, OS file-picker/device acceptance and future recorded-course uploads remain separate.
