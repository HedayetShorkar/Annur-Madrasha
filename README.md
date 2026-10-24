# An-Noor — complete website

The existing Bangla/English website, six-step admission form, permanent student IDs, private live classroom administration and payment source are included together.

## Supabase connection

The separate An-Noor project has public connection settings. Admission persistence and administrator provisioning are still pending. See [SUPABASE_CONNECTION.md](SUPABASE_CONNECTION.md).

## Responsive screens

The public pages, compact navigation, six-step form, classroom portal and receipt desk adapt to phones, tablets and wide monitors. Mobile forms keep their progress visible, controls are easier to tap, and long names or IDs wrap within their cards. See [RESPONSIVE_UPDATE.md](RESPONSIVE_UPDATE.md) for the changes, browser checks and reusable QA tools.

## Easier admission dates and times

The start date is now chosen from a full-date list with Today/Tomorrow/Next-month shortcuts. It stays editable after selecting next month. Labelled time cards support exact-hour defaults, 12/24-hour formats, preserved partial entries and ±15-minute adjustments. Existing fee rules and approved date ranges are retained. See [ADMISSION_DATE_TIME.md](ADMISSION_DATE_TIME.md).

## Parent review presentation

The parent-feedback section and dialog have been redesigned with a premium journal layout, optional star rating, character count and an escaped draft preview/copy workflow. Actual submission remains unconnected and is disclosed before writing. See [PARENT_REVIEWS_UPDATE.md](PARENT_REVIEWS_UPDATE.md).

## Current update: fee & receipt desk

Open the root `index.html` → **আরও → পেমেন্ট ও রসিদ**, or `payments/index.html` directly. The link opens the designed page, including when previewing extracted files, rather than a folder listing.

The branded receipt editor has student/guardian details, billing month, monthly/first-month/admission/other fees, package calculation, approved first-month proration, custom fee reasons, discount, received amount, remaining amount, method/reference, amount in words and a live preview. It supports mobile screens, Bangla/English and the existing light-default/remembered-theme behavior.

**Read [RECEIPT_DESK_UPDATE.md](RECEIPT_DESK_UPDATE.md).** A file preview can edit only an unconfirmed draft. Actual final receipts use the existing Node administrator account and server: admin verification → atomic receipt number → stored record → fresh-server print/PDF access. Issued records cannot be silently edited/deleted. A void requires a reason and retains audit/history. No real server, MFS account or media service was deployed here.

The online payment tab remains a coming-soon option. No receiving number or active transfer instruction is invented. The original Supabase gateway code remains preserved for the future; Node manual receipts and Supabase payment claims need consolidation before both are activated together.

## Admission form

Six validated steps with Previous/Next navigation, sticky progress and final review. See [ADMISSION_WIZARD.md](ADMISSION_WIZARD.md). Intake and parent-review submissions still need their endpoints; the UI honestly reports unsubmitted forms. Existing approved fees/rules, ages 5–18, Hifz option, package weekdays and 12/24-hour time controls are retained.

## Live classes

`live/index.html` opens the compiled portal. Configure the Node API and media server before using actual classes. Admins issue permanent student IDs and control enrollment; students can access only assigned classes. Public pages do not advertise supervision, and supervision/ID issuance APIs are admin-only. See [STUDENT_ACCESS_UPDATE.md](STUDENT_ACCESS_UPDATE.md), [live-class/README.md](live-class/README.md), and [LIVE_CLASS_DELIVERY.md](LIVE_CLASS_DELIVERY.md).

## Future online payment source

`payment-module/` contains React/TypeScript/Tailwind source, Supabase migration/Auth/RLS, Edge Functions, provider adapters, invoice/submission/reconciliation/review and confirmed-only PDF source. Read its README and deployment/security docs. SMS matching is not official MFS settlement verification. No real receiving accounts or verified production SMS formats were supplied.

## Package layout

- `index.html`, `assets/`: public website and original branding.
- `payments/`, `live/`: built public pages; use their explicit `index.html` files.
- `payment-module/`: editable receipt/gateway UI and future Supabase backend.
- `live-class/`: private Node API, receipt registry, live classroom source, tests and deployment examples.
- `shared/`: shared receipt calculation/validation code used by both browser build and private server.
- `tests/`: public form, portability and compiled UI regressions.
- `original-backup/`, `checkpoints/`: preserved recovery material; never publish.

Publish only `index.html`, `assets/`, `live/` and `payments/`. `live-class/scripts/stage-public.mjs` copies only those into an empty directory outside the source tree. Keep private server source (`live-class/` **and its adjacent `shared/`**), SQLite data/backups, environment values and source archives outside the public web root. The Node API is loopback-only behind the same-origin HTTPS proxy shown in its deployment example.
