-- TEMPLATE ONLY. Replace placeholders privately in a trusted SQL console.
-- No receiving numbers, production samples or credentials are supplied.
-- 1. After creating/verifying the operator in Supabase Auth:
insert into public.payment_admins(user_id) values ('ADMIN_AUTH_UUID'::uuid);

-- 2. Repeat for BKASH, NAGAD, ROCKET as needed. Account identity is immutable.
insert into public.receiving_accounts(provider,account_number,account_label,payment_instruction_bn,payment_instruction_en,active)
values ('BKASH','REPLACE_REAL_RECEIVING_NUMBER','Approved account name',
 'এই হিসাবের জন্য অনুমোদিত সঠিক পদ্ধতি লিখুন।',
 'Replace with the exact approved transfer instruction for this account.',false)
returning id;

-- 3. Bind a receiving SIM/account to a trusted relay ID. HMAC key is NOT in SQL.
insert into payment_private.sms_devices(id,receiving_account_id,allowed_senders,active)
values ('receiving-relay-01','RECEIVING_ACCOUNT_UUID'::uuid,ARRAY['ACTUAL_VERIFIED_SENDER_LABEL'],false);

-- 4. Use a REAL verified incoming-credit sample, never tests/fixtures.ts.
insert into payment_private.sms_patterns(provider,receiving_account_id,template,timestamp_format,
 sender_reliable,verified_sample,expected,verification_reference,verified_by,active)
values ('BKASH','RECEIVING_ACCOUNT_UUID'::uuid,
 'REPLACE_WITH_EXACT_VERIFIED_LITERAL_TEMPLATE_AND_TOKENS','ISO_OFFSET',false,
 'REPLACE_WITH_REAL_VERIFIED_CREDIT_SAMPLE_WITHOUT_PIN_OR_OTP',
 '{"transaction_id":"REPLACE","receiving_number":"REPLACE","amount_minor":10000,"paid_at":"REPLACE_UTC_ISO","sender_number":null}'::jsonb,
 'REPLACE_WITH_PRIVATE_STATEMENT_CHECK_REFERENCE','ADMIN_AUTH_UUID'::uuid,false)
returning id;

-- 5. After verification tests and approved staging review, enable in this order:
-- update payment_private.sms_patterns set active=true where id='VERIFIED_PATTERN_UUID';
-- update payment_private.sms_devices set active=true where id='receiving-relay-01';
-- update public.receiving_accounts set active=true where id='RECEIVING_ACCOUNT_UUID';
-- To suspend new invoice issuance and relay processing, set account/device active=false.
-- Do not remove old account rows referenced by invoices. Create a new account for a changed number.
