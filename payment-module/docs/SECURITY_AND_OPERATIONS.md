# Security and operations

## Boundaries and authorization

- Browser has only a Supabase public key and its user's Auth token. No service key or webhook key is compiled into the UI.
- Edge validates every payer token through Auth.getUser; client role/actor/amount/status fields are rejected.
- Finance admins live in a protected server-owned table, not editable Auth metadata. SQL approval/charge functions recheck the role. Self-approval is blocked.
- Authenticated users have SELECT only on their own charges, invoices, submissions and receipts. Incoming evidence, admin roles, review notes and audit logs are not directly readable by them. Active receiving accounts are readable after sign-in. Anonymous users have no table access.
- All financial mutations go through service-only database functions. Explicit function EXECUTE grants prevent forged actor IDs through the public RPC endpoint. Private helpers have a fixed empty search_path and schema-qualified references.
- SMS device/pattern/event/nonce/rate tables live in a non-exposed private schema with no anon/authenticated schema access. Do not add `payment_private` to exposed schemas.
- Edge responses use safe error codes and no-store headers; no raw SQL/errors, tokens or SMS bodies are logged by application code. Review your hosting log settings too.

## Atomic matching and claiming

Provider + normalized transaction ID is unique in the incoming ledger and among non-rejected submissions. A unique incoming-transaction foreign key reserves it for a single submission. One active submission per invoice and one invoice per charge prevent duplicate fulfillment. A confirmed claim is never released. Rejection releases only the unconfirmed claim while preserving the rejected attempt and audit/review record.

Submission, ingestion and review serialize by a transaction-scoped advisory lock for provider/ID, then row locks. Approval updates invoice, submission, receipt and review/audit atomically. Invoice amounts and receiving numbers are snapshotted on creation; client-provided amounts are ignored because they are not accepted by the API. Currency is BDT only.

Matching requires exact provider, normalized transaction ID, configured receiving account ID/number, integer amount/currency and paid timestamp within the invoice window (five-minute issue-time tolerance through due time). Future timestamps beyond five minutes are disallowed. Complete sender numbers are compared only when a verified pattern marks them reliable. Delayed SMS is reconciled on arrival against pending submissions; early SMS is reconciled when a submission arrives. The event arrival timestamp is never substituted for paid_at.

Conflicting repeat evidence quarantines the incoming transaction and sends unconfirmed claims to REVIEW_REQUIRED. Rechecking cannot clear quarantine. An already-confirmed invoice is not silently reversed; the conflict is audit-logged and must be investigated as a financial incident. Do not “fix” it by editing audit records or changing claimed transaction IDs.

## Review policy

SMS_MATCHED is NOT proof of settlement. Admin must access the receiving MFS account or its statement independently, compare provider/reference/account/amount/time, then record a reason, non-secret statement-check reference and explicit confirmation. Only then may the database mark CONFIRMED_PAID. The software cannot prove that an administrator told the truth; restrict this privilege to trusted finance operators and review their audit trail.

REVIEW_REQUIRED or missing evidence cannot be force-approved through this UI. Incorrect accounts, wrong amounts, unsupported formats, split payments, overpayment and expired invoice cases need operator resolution. Do not ask payers to send a second payment automatically. Reject mistaken submissions with a reason and resolve the discrepancy with the payer; new charge/invoice arrangements may be needed. There is no hidden override or refund API.

## SMS secrets and replay

Each relay has an independent server-held HMAC secret. Payload, device ID, nonce and request time are authenticated. Five-minute time window plus durable unique nonces stops replay; durable event IDs and globally unique provider/transaction IDs stop double ingestion. Database-backed counters survive Edge restarts. For network errors, retry with the same event ID/body and a new nonce/signature; don't change event contents. Clock sync is required on relay servers.

Disable a compromised device immediately, rotate its secret, investigate its incoming transactions and pause affected approvals. Sender labels alone are not authentication. PIN/OTP messages must be discarded at the collector before forwarding; the webhook rejects recognized sensitive messages without storing their bodies/hashes. Templates/samples must be curated credit-only data.

## Receipt and retention

Receipt record is inserted in the same transaction as approval; invoice and submission both must be confirmed before PDF generation. Downloads require the payer's identity or a finance-admin role. No public PDF bucket or guessable public receipt URL is created. PDF rendering is on demand; only the stable receipt record is stored. Audit/review/receipt rows reject UPDATE and DELETE, including through service-role operations. A database owner can still change schema; protect the owner account and backups.

Prune only expired rate windows/nonces using the supplied function. Financial event and audit retention should be decided by the institution; this module does not silently delete them. Set a documented restricted retention period for curated SMS samples and phone evidence, plus a backup/restore and access-removal process. Do not publish backups or test fixtures as website assets.

## Remaining deployment verification

The local suite exercises real PostgreSQL functions/RLS in a WASM runtime and HTTP handlers with database integration. It does not exercise Supabase's hosted Auth, PostgREST serialization, Edge deployment, network delivery, provider messages or the browser. Run staging smoke tests and true multi-session PostgreSQL races before activation. Real verified samples, receiving accounts, credentials and relay hardware/services are owner inputs; none were fabricated here.
