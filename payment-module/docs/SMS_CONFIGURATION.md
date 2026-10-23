# SMS adapter configuration — verified samples required

## Trust model

A correct HMAC proves that your trusted relay server sent the request. A sender label such as a provider's displayed name is NOT cryptographic proof of provider origin. Phone compromise, SIM/relay compromise, spoofed sender labels or SMS inaccuracies remain possible. An SMS match only reserves supporting evidence. Admin must verify the actual receiving-account credit independently before confirming paid.

No real provider samples were supplied. All messages under `tests/` use an explicitly synthetic `TEST CREDIT ...` format; they are NOT bKash/Nagad/Rocket formats and must NEVER be installed in production.

## Source/relay contract

Configure a source/collector for the specific receiving SIM/account. It must filter only approved incoming-credit notifications and reject PINs, OTPs, passwords, unrelated texts and outgoing debit notifications BEFORE forwarding. This project supplies a trusted-server signing example, not a mobile app or access to a user's phone. Do not collect all SMS messages. Do not put the HMAC key into the browser or an untrusted mobile frontend.

The trusted relay receives only credit notifications over its own authenticated channel, binds them to the configured device ID, and signs the following exact bytes:

```text
UNIX_SECONDS + "\n" + NONCE + "\n" + DEVICE_ID + "\n" + RAW_JSON_BODY
```

HMAC-SHA256 signature is lowercase hex. Headers: `x-device-id`, `x-request-timestamp` (10-digit seconds), `x-request-nonce` (16–100 letters/digits/hyphen/underscore), `x-signature`. JSON body accepts exactly `event_id`, `sender_label`, `body`. `event_id` must be stable across retries. Body is capped at 8 KiB; SMS text at 2,000 characters. Requests outside ±5 minutes fail. For retry after a delivery error, reuse event ID/body but use a fresh timestamp, nonce and signature. Reusing a nonce returns 409. Reusing event ID with changed contents returns 409. Consistent duplicates do not create a second transaction.

Run `node --import tsx scripts/relay-example.mjs` on a trusted server with `SMS_WEBHOOK_URL`, `SMS_DEVICE_ID`, `SMS_DEVICE_SECRET` and `SMS_PATTERN_CONFIG_PATH` in private environment variables. The private JSON configuration contains `provider`, `account_number`, `allowed_senders` and the same verified `patterns` array as the server. The example refuses to forward any message that does not parse as a verified credit. Install this module’s dependencies on the relay server; do not publish the config file. Pipe JSON through stdin; do not place raw SMS or secrets into shell arguments. Logs should contain only event outcomes, never request bodies or secrets.

## Verify a provider pattern

1. Obtain genuine incoming-credit messages from YOUR receiving account, with account-owner permission. Inspect them locally and exclude any sensitive/non-credit message. Use controlled transfers and verify independently against the receiving account/statement.
2. Record the provider, receiving account, exact sender label, amount, transaction ID and transaction timestamp. Record sender number only when the SMS actually supplies a complete reliable number. Do not infer masked digits.
3. Create a literal, anchored template. Supported tokens:

| Token | Meaning |
|---|---|
| `{amount}` | Positive ASCII amount, optional 1–2 decimal places; no guessed separators. |
| `{trx}` | 5–40 ASCII alphanumeric transaction ID, normalized uppercase. |
| `{account}` | Explicit 11–12 digit receiving number; optional if a dedicated device binding identifies it. |
| `{sender}` | Full Bangladesh mobile number, optionally +88/88. Optional; never invent one. |
| `{received_at}` | Transaction timestamp in one explicitly configured format. Required. |

Amount, transaction ID and timestamp tokens are required. Each token may appear only once. All surrounding text must match exactly; no untrusted regex execution, wildcards, substring matches or greedy fallback. Unsupported formats fail closed. If your verified provider message has comma-separated amounts, masked sender fields, two-digit years, missing timestamps or other layouts, extend the adapter deliberately with tests before enabling it; do not guess an interpretation.

Timestamp formats implemented: `ISO_OFFSET` (`YYYY-MM-DDTHH:mm:ssZ` or explicit `+06:00`), and `DMY_24H_DHAKA` (`DD/MM/YYYY HH:mm:ss`, Bangladesh time). These are parser capabilities, not assertions about provider formats. Calendar validity is checked. If timestamp or amount is missing, no credit is stored. Do not substitute webhook arrival time for transaction time.

4. Insert the pattern with `active=false`, its real verified sample, the expected normalized fields, verifier user ID and a non-secret verification reference. The verifier must already be a finance admin. Samples are scoped to the receiving account. Keep curated samples restricted to server-side configuration; they may contain payer phone data.
5. Add the sample to a private local fixture suite and test positive and negative cases. The runtime also parses its configured verified sample and compares ALL five expected keys: `transaction_id`, `receiving_number`, `amount_minor`, `paid_at` (UTC ISO milliseconds), `sender_number` (explicit null if unavailable).
6. Only mark `sender_reliable=true` for a complete, genuinely reliable sender number. The database compares it only then. False means “not compared,” not “matches.”
7. Activate the verified pattern and bound device after staging validation; activate the receiving account last. Ambiguous multi-pattern matches fail closed.

Raw incoming SMS bodies are not persisted. Parsed credit fields, an event SHA-256 hash and outcome are stored. Unrecognized messages create only hash/outcome metadata, no incoming transaction. Recognized sensitive messages are rejected before even event/hash persistence. Your upstream relay must prevent them arriving in the first place. A changed parser does not reprocess historic raw bodies because none are retained; a controlled, audited re-ingestion uses a new event ID and still cannot confirm paid automatically.

## Provider adapters and future official APIs

`ProviderAdapter` defines provider identity, evidence type and parsing contract. Separate bKash/Nagad/Rocket instances use their own verified patterns. An official API adapter must authenticate responses/callbacks and verify amount/currency/receiving account/reference independently. Never mark SMS_ASSISTED evidence as OFFICIAL_API or provider-settlement-verified. The database enforces `provider_settlement_verified=false` for SMS evidence. Official API enablement is future work and requires its own verification pipeline, tests and credentials; no stub claims to verify a provider today.
