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
