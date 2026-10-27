# An-Noor — Receipt desk + future online payments

The built **`payments/index.html`** page requires the existing Node administrator session before showing any manual receipt editor or payment-management workspace. Anonymous, teacher, student and offline/file visits see a restricted notice/login only. Public menu/footer links are removed; the administrator’s classroom contains the desk link. See [current operations](../docs/OPERATIONS.md#manual-receipts-printing-and-pdf) for manual entry, administrator verification, the SQLite receipt registry, A4 printing and bilingual PDF downloads. The desk reuses the existing Node classroom administrator account; media credentials and Supabase are not required for manual receipts. Run the Node service and proxy `/api/live/` on the same HTTPS origin to issue real receipts. Students use their separate classroom **আমার রসিদ** link at `payments/index.html?view=mine` for read-only issued copies linked to their authenticated account, with fresh-authorized print/PDF. Office evidence and fee-approval reasons are excluded server-side. Selecting an existing student during issuance creates this account link; a manually typed name/code does not. Unlinked manual PDFs can be supplied privately by the administrator.

Online payment collection remains disabled (`VITE_ENABLE_ONLINE_PAYMENTS=false`). The original gateway page is preserved in `src/GatewayPortal.tsx`; the sections below describe that future Supabase subsystem. Before activating it, reconcile/migrate existing manual receipt claims into a single authoritative ledger. The two backends do not automatically synchronize claims or accounts.

## Future SMS-assisted payment submission and reconciliation

Production-oriented source implementation; **not a live or independently audited payment service**. Supports bKash, Nagad and Rocket through configured receiving accounts. An authenticated SMS relay is not an official payment verification API. Every paid status requires an authorized administrator's independent account/statement check.

## Start here

1. Read `docs/DEPLOYMENT.md` for Supabase setup, secrets, account configuration and static-site build.
2. Read `docs/SMS_CONFIGURATION.md` before enabling a relay or pattern. **No real verified provider SMS samples were supplied, so no production patterns/accounts are seeded or enabled.**
3. Read `docs/SECURITY_AND_OPERATIONS.md` for trust boundaries, review rules and incident handling.
4. `npm ci`, `npm test`, `npm run check:edge`, `npm run build`.
5. Deploy only after your own staging validation. The included build has no project URL/key; the online tab displays a coming-soon page. Only enable `VITE_ENABLE_ONLINE_PAYMENTS=true` after the full future integration, including the manual-ledger transition, is complete.

## Existing-site integration

The static site, ages 5–18, translations, Quran backgrounds, logo/clock animation, themes and FAQ remain. Only the authenticated administrator classroom links to the management desk; student classrooms link only to their own copies. The portal uses React, TypeScript and Tailwind; the future online subsystem uses Supabase. `npm run build` produces the main page and a separate fingerprinted classic-script PDF renderer in `../payments/`, then records the renderer path in the HTML. Deploy the whole built folder together. The original website/assets stay intact; the new `assets/fonts/` includes an unmodified Noto Sans Bengali font and its SIL Open Font License. The font and PDF renderer load only for export. File previews expose no draft editing; the workspace and private receipt copies require HTTP(S) with the existing authenticated Node API. Admissions have their separate deployed Supabase endpoint.

Source layout:

- `src/main.tsx`, `ReceiptDesk.tsx`, `MyReceipts.tsx`, `ReceiptPaper.tsx`: authenticated administrator workspace, isolated read-only student copies, bilingual preview and issue/print/register workflows.
- `src/receipt-export.ts`, `src/receipt-pdf.ts`, `vite.pdf.config.ts`: lazy, local PDF export from a fresh issued record. Canvas preserves Bengali shaping; PDF pages contain a high-resolution receipt image. Use browser Print/Save as PDF when selectable text is needed.
- `src/GatewayPortal.tsx`: preserved online payer and finance-admin workflows, real Supabase email/password auth, no fake login.
- `src/style.css`, `vite.config.ts`: responsive white/dark/green Tailwind styling and isolated output.
- `supabase/migrations/202610150001_payments.sql`: ledger, RLS, service-only functions, locks, audit and receipts.
- `supabase/functions/payments/`: authenticated user/admin API.
- `supabase/functions/sms-webhook/`: HMAC-authenticated relay ingestion.
- `supabase/functions/_shared/`: strict provider adapters, bounded requests, reconciliation API and PDF generation.
- `.env.example`: public browser config only.
- `supabase/.env.example`: server-only environment template.
- `scripts/relay-example.mjs`: trusted-server signing example. Not a phone app or SMS-forwarding service.
- `tests/`: actual-migration PostgreSQL/WASM integration, webhook/API authorization tests, parser/PDF tests, separate multi-session PostgreSQL race test.

## Workflow

Admin assigns a billing charge to a verified payer's Supabase user ID → payer chooses an active receiving account → server creates an immutable invoice amount/account snapshot → payer sends money using the configured instruction → submits invoice reference, sender number and transaction ID → evidence is matched on the server → admin independently checks receiving-account statement → approves/rejects → confirmed payment gets a receipt record → authenticated PDF download.

Money is integer BDT minor units, e.g. `10000` = BDT 100.00. Payer requests contain no trusted amount. Billing charges support individualized fees; one charge generates one invoice, with idempotent retry. Each new billing period needs its own unique charge reference. This is not an automatic recurring billing engine.

Statuses:

| Status | Meaning |
|---|---|
| PENDING | Submission saved; no matching credit evidence yet. |
| SMS_MATCHED | Exact evidence match, reserved atomically; NOT paid/settled. |
| REVIEW_REQUIRED | Amount/account/time/sender/conflicting evidence needs investigation. |
| CONFIRMED_PAID | Authorized admin independently checked receiving account, recorded reason/reference, and approved. |
| REJECTED | Admin rejected the attempt; claim released, audit retained. |

No frontend or webhook input can set CONFIRMED_PAID. No receipt record/PDF is generated before confirmation. PDF is intentionally English for reliable standard-font rendering; the application is Bangla/English.

## Deliberate boundaries

- Not an official MFS API; no provider settlement verification is claimed.
- No MFS PIN/OTP entry, forwarding or storage; upstream collector must filter these **before transmission**. Webhook also rejects recognized sensitive messages before event persistence.
- No payment gateway checkout, refunds, partial payments, overpayment credits or multiple-payment invoice splitting.
- Admin approval requires an exact non-quarantined match plus independent statement verification. Mismatches cannot be silently overridden; reject and resolve with the payer/finance operator.
- No live credentials, real receiving account, verified SMS format, production Supabase instance or relay were available here. No live deployment or transaction was activated.
- Payer overview shows latest 100 records; admin queue is paginated in groups of 25. Refresh loads delayed matches; no realtime subscription needed.
