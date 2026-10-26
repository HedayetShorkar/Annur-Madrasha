# An-Noor — complete website

The existing Bangla/English website, six-step admission form, permanent student IDs, private live classroom administration and payment source are included together.

## Admissions and Supabase

The six-step form submits to the deployed admissions endpoint and stores real applications with unique references and server-calculated BDT fee estimates. A separate short form accepts requests for two free trial lessons, without a fee or automatic class assignment. `admin/index.html` provides separate admission, trial and guardian-feedback queues with authorized decisions and audit history. The owner deferred selecting the first administrator email; no default admin credentials exist. See [current operations](docs/OPERATIONS.md).

Prominent live-class links appear on a browser/device after a validated successful admission submission. Other visitors see the free-trial option. The saved flag contains no applicant details and grants no access: issued student credentials and assigned-class authorization are still required. Existing students on another device can use the student-login information page.

Historical root update reports have been consolidated into [one history document](docs/HISTORY.md), keeping the website's design, source, tests and recovery archives intact.

## Mobile first and search visibility

Mobile is the default priority: the owner expects about 80% of visits from phones. This release adds thumb-friendly quick actions, keyboard/dialog-aware navigation, an expanded classroom view and a crawlable bilingual [parent guide](learn/index.html). Plan prices and class days are present in the original HTML, before JavaScript runs. Decorative backgrounds render nearby sections during idle time; the clock avoids rebuilding unchanged/offscreen text.

The compact homepage places its animated logo directly below Bismillah on phones, uses emerald/ivory/champagne surfaces, and hides the bottom shortcuts while equivalent inline actions or the main menu are visible. Package subjects and FAQ answers stay visible; teacher recitation controls are available inside each profile. At the same 390px browser frame, the Bangla/light homepage measured 12,897px before and 8,428px after (about 35% shorter). This is a layout measurement, not a load-speed result. See the current composition and verification notes in [operations](docs/OPERATIONS.md#compact-phone-homepage).

The release includes truthful search/social metadata, private-portal noindex tags, `robots.txt`, a 404 page, and a domain-specific canonical/sitemap generator. The actual public domain and Search Console are not configured yet. Read [changes, expected effects, deployment and growth priorities](docs/OPERATIONS.md#mobile-first-and-bangladesh-search-visibility). No rank, real-phone speed score or increased enrollment is claimed.

## Responsive screens

The public pages, compact navigation, six-step form, classroom portal and receipt desk adapt to phones, tablets and wide monitors. Mobile forms keep their progress visible, controls are easier to tap, and long names or IDs wrap within their cards. See [RESPONSIVE_UPDATE.md](docs/HISTORY.md) for the changes, browser checks and reusable QA tools.

## Easier admission dates and times

The start date is now chosen from a full-date list with Today/Tomorrow/Next-month shortcuts. It stays editable after selecting next month. Labelled time cards support exact-hour defaults, 12/24-hour formats, preserved partial entries and ±15-minute adjustments. Existing fee rules and approved date ranges are retained. See [ADMISSION_DATE_TIME.md](docs/HISTORY.md).

## Guardian feedback and teacher portraits

The feedback form now submits to Supabase with explicit publishing consent. Only staff-approved reviews appear in the paginated public feed: swipeable cards on phones, two cards side by side on wider screens, previous/next controls and a load-more action. Pending/rejected reviews and contact data are never exposed publicly. There are no invented testimonials; an empty feed remains honest. Preview/copy, optional rating and offline draft behavior are preserved. Teachers again use round portraits extending above the frame, with sage-colored light-mode cards to separate white clothing and caps. See [current workflows](docs/OPERATIONS.md#trial-requests-and-moderated-guardian-feedback).

## Current update: fee & receipt desk

Open the root `index.html` → **আরও → পেমেন্ট ও রসিদ**, or `payments/index.html` directly. The link opens the designed page, including when previewing extracted files, rather than a folder listing.

The branded receipt editor has student/guardian details, billing month, monthly/first-month/admission/other fees, package calculation, approved first-month proration, custom fee reasons, discount, received amount, remaining amount, method/reference, amount in words and a live preview. It supports mobile screens, Bangla/English and the existing light-default/remembered-theme behavior.

**Read [RECEIPT_DESK_UPDATE.md](docs/HISTORY.md).** A file preview can edit only an unconfirmed draft. Actual final receipts use the existing Node administrator account and server: admin verification → atomic receipt number → stored record → fresh-server print/PDF access. Issued records cannot be silently edited/deleted. A void requires a reason and retains audit/history. No real server, MFS account or media service was deployed here.

The online payment tab remains a coming-soon option. No receiving number or active transfer instruction is invented. The original Supabase gateway code remains preserved for the future; Node manual receipts and Supabase payment claims need consolidation before both are activated together.

## Admission form

Six validated steps with Previous/Next navigation, sticky progress and final review. See [ADMISSION_WIZARD.md](docs/HISTORY.md). Admissions, free-trial requests and moderated guardian feedback have deployed endpoints. Existing approved fees/rules, ages 5–18, Hifz option, package weekdays and 12/24-hour time controls are retained.

## Lessons, progress and local recording

The private classroom now includes searchable class/account lists, per-class lesson notes and homework, teacher-entered attendance and individual Qaida/Quran/Hifz progress. Students see only their own evaluation. Administrators can create the next session with the same active, allowed roster while retaining the previous lesson history.

Teachers and administrators can explicitly start/stop local screen-and-audio recording on the computer they are using. Choose the classroom browser tab and share its audio. A supported desktop browser can stream to a user-selected local file; a bounded download mode is also available. Recordings are never uploaded or automatically published as courses. See [the workflow and limits](docs/OPERATIONS.md#learning-records-and-local-recording).

## Live classes

The classroom now supports Jitsi Meet (self-hosted JWT or JaaS) inside the existing website. Student IDs and assigned-class access remain private; administrators can open visible silent previews. See [Jitsi connection instructions](docs/OPERATIONS.md#jitsi-live-class-connection). Actual media service configuration and device acceptance are still required. Existing LiveKit deployments remain selectable.


`live/index.html` opens the compiled portal. Configure the Node API and media server before using actual classes. Admins issue permanent student IDs and control enrollment; students can access only assigned classes. Public pages do not advertise supervision, and supervision/ID issuance APIs are admin-only. See [STUDENT_ACCESS_UPDATE.md](docs/HISTORY.md), [live-class/README.md](live-class/README.md), and [LIVE_CLASS_DELIVERY.md](docs/HISTORY.md).

## Future online payment source

`payment-module/` contains React/TypeScript/Tailwind source, Supabase migration/Auth/RLS, Edge Functions, provider adapters, invoice/submission/reconciliation/review and confirmed-only PDF source. Read its README and deployment/security docs. SMS matching is not official MFS settlement verification. No real receiving accounts or verified production SMS formats were supplied.

## Package layout

- `index.html`, `assets/`, `learn/`: public website, original branding and parent guide.
- `robots.txt`, `404.html`, `scripts/prepare-seo.mjs`: crawl/error handling and domain-specific SEO preparation.
- `payments/`, `live/`: built public pages; use their explicit `index.html` files.
- `payment-module/`: editable receipt/gateway UI and future Supabase backend.
- `live-class/`: private Node API, receipt registry, live classroom source, tests and deployment examples.
- `shared/`: shared receipt calculation/validation code used by both browser build and private server.
- `tests/`: public form, portability and compiled UI regressions.
- `original-backup/`, `checkpoints/`: preserved recovery material; never publish.

Publish only `index.html`, `assets/`, `learn/`, `robots.txt`, `404.html`, the generated `sitemap.xml` when configured, `live/`, `payments/` and `admin/`. `live-class/scripts/stage-public.mjs` copies the approved public files into an empty directory outside the source tree. Keep private server source (`live-class/` **and its adjacent `shared/`**), SQLite data/backups, environment values and source archives outside the public web root. The Node API is loopback-only behind the same-origin HTTPS proxy shown in its deployment example.
