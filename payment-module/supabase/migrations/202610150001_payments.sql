-- Server-owned ledger. No client writes; identity is verified by Edge Auth.getUser.
create schema if not exists payment_private;
revoke all on schema payment_private from public, anon, authenticated;
create type public.payment_status as enum ('PENDING','SMS_MATCHED','REVIEW_REQUIRED','CONFIRMED_PAID','REJECTED');
create type public.mfs_provider as enum ('BKASH','NAGAD','ROCKET');
create table public.payment_admins (
 user_id uuid primary key references auth.users(id), created_at timestamptz not null default now()
);
create function payment_private.is_admin(p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.payment_admins where user_id=p_actor)
$$;
create table public.receiving_accounts (
 id uuid primary key default gen_random_uuid(), provider public.mfs_provider not null,
 account_number text not null check (account_number ~ '^[0-9]{11,12}$'),
 account_label text not null check(length(account_label) between 1 and 80),
 payment_instruction_bn text not null, payment_instruction_en text not null,
 active boolean not null default false, created_at timestamptz not null default now(),
 unique(provider,account_number)
);
create table public.billing_charges (
 id uuid primary key default gen_random_uuid(), payer_id uuid not null references auth.users(id),
 description text not null check(length(description) between 1 and 160),
 billing_reference text not null check(length(billing_reference) between 1 and 80),
 amount_minor bigint not null check(amount_minor between 100 and 100000000),
 currency text not null default 'BDT' check(currency='BDT'),
 due_at timestamptz not null, active boolean not null default true,
 created_at timestamptz not null default now(), unique(payer_id,billing_reference)
);
create sequence payment_private.invoice_sequence;
create table public.payment_invoices (
 id uuid primary key default gen_random_uuid(),
 invoice_number text not null unique default ('AN-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('payment_private.invoice_sequence')::text,10,'0')),
 payer_id uuid not null references auth.users(id), charge_id uuid not null unique references public.billing_charges(id),
 receiving_account_id uuid not null references public.receiving_accounts(id),
 provider public.mfs_provider not null, receiving_number text not null,
 description text not null, amount_minor bigint not null check(amount_minor>0), currency text not null check(currency='BDT'),
 issued_at timestamptz not null default now(), payment_window_start timestamptz not null,
 payment_window_end timestamptz not null, confirmed_at timestamptz,
 check(payment_window_end>payment_window_start)
);
-- Parsed evidence only: raw SMS bodies are NEVER stored.
create table public.incoming_transactions (
 id uuid primary key default gen_random_uuid(), provider public.mfs_provider not null,
 transaction_id text not null check(transaction_id ~ '^[A-Z0-9]{5,40}$'),
 receiving_account_id uuid not null references public.receiving_accounts(id), receiving_number text not null,
 amount_minor bigint not null check(amount_minor between 1 and 100000000), currency text not null default 'BDT' check(currency='BDT'),
 paid_at timestamptz not null, sender_number text, sender_reliable boolean not null default false,
 source text not null check(source in ('SMS_ASSISTED','OFFICIAL_API')),
 evidence_hash text not null check(evidence_hash ~ '^[a-f0-9]{64}$'), pattern_id uuid,
 device_id text not null, quarantined boolean not null default false, provider_settlement_verified boolean not null default false,
 received_at timestamptz not null default now(),
 unique(provider,transaction_id), check(not sender_reliable or sender_number ~ '^01[3-9][0-9]{8}$'),
 check(source<>'SMS_ASSISTED' or not provider_settlement_verified)
);
create table public.payment_submissions (
 id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.payment_invoices(id),
 payer_id uuid not null references auth.users(id), provider public.mfs_provider not null,
 transaction_id text not null check(transaction_id ~ '^[A-Z0-9]{5,40}$'),
 sender_number text not null check(sender_number ~ '^01[3-9][0-9]{8}$'),
 status public.payment_status not null default 'PENDING',
 incoming_transaction_id uuid unique references public.incoming_transactions(id),
 match_reason text not null default 'AWAITING_EVIDENCE',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 reviewed_by uuid references auth.users(id), reviewed_at timestamptz
);
create unique index payment_active_transaction on public.payment_submissions(provider,transaction_id) where status<>'REJECTED';
create unique index payment_active_invoice on public.payment_submissions(invoice_id) where status<>'REJECTED';
create index payment_owner_invoices on public.payment_invoices(payer_id,issued_at desc);
create index payment_owner_submissions on public.payment_submissions(payer_id,created_at desc);
create table public.payment_reviews (
 id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.payment_submissions(id),
 reviewer_id uuid not null references auth.users(id), decision text not null check(decision in ('APPROVE','REJECT')),
 reason text not null check(length(reason) between 10 and 500),
 settlement_reference text check(length(settlement_reference) between 5 and 160),
 independently_checked boolean not null, created_at timestamptz not null default now(),
 check(decision<>'APPROVE' or (independently_checked and settlement_reference is not null))
);
create table public.payment_receipts (
 id uuid primary key default gen_random_uuid(), receipt_number text not null unique,
 invoice_id uuid not null unique references public.payment_invoices(id),
 submission_id uuid not null unique references public.payment_submissions(id),
 payer_id uuid not null references auth.users(id), issued_at timestamptz not null default now()
);
create table public.payment_audit_logs (
 id bigint generated always as identity primary key, actor_id uuid, action text not null,
 entity_id text not null, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create function payment_private.append_only() returns trigger language plpgsql set search_path='' as $$
 begin raise exception 'APPEND_ONLY'; end $$;
create trigger audit_append_only before update or delete on public.payment_audit_logs for each row execute function payment_private.append_only();
create trigger reviews_append_only before update or delete on public.payment_reviews for each row execute function payment_private.append_only();
create trigger receipts_append_only before update or delete on public.payment_receipts for each row execute function payment_private.append_only();
create table payment_private.sms_devices (
 id text primary key check(id ~ '^[a-zA-Z0-9_-]{3,60}$'), receiving_account_id uuid not null references public.receiving_accounts(id),
 allowed_senders text[] not null, active boolean not null default false
);
create table payment_private.sms_patterns (
 id uuid primary key default gen_random_uuid(), provider public.mfs_provider not null,
 receiving_account_id uuid not null references public.receiving_accounts(id),
 template text not null check(length(template) between 20 and 1500), timestamp_format text not null check(timestamp_format in ('ISO_OFFSET','DMY_24H_DHAKA')),
 sender_reliable boolean not null default false,
 verified_sample text not null check(length(verified_sample) between 20 and 2000 and verified_sample !~* '(\m(otp|pin|password|passcode)\M|পিন|ওটিপি|পাসওয়ার্ড|পাসওয়ার্ড)'),
 expected jsonb not null, verification_reference text not null check(length(verification_reference)>=10),
 verified_by uuid not null references public.payment_admins(user_id), verified_at timestamptz not null default now(),
 active boolean not null default false
);
create table payment_private.webhook_nonces (
 device_id text not null, nonce text not null, accepted_at timestamptz not null default now(), primary key(device_id,nonce)
);
create table payment_private.webhook_events (
 device_id text not null, event_id text not null, payload_hash text not null,
 outcome text not null, incoming_id uuid references public.incoming_transactions(id), created_at timestamptz not null default now(),
 primary key(device_id,event_id)
);
create table payment_private.rate_windows (
 subject text not null, window_at timestamptz not null, hits integer not null, primary key(subject,window_at)
);
create function public.payment_rate_limit(p_subject text,p_limit integer) returns boolean
 language plpgsql security definer set search_path='' as $$
 declare n integer; begin
 insert into payment_private.rate_windows values(p_subject,date_trunc('minute',now()),1)
 on conflict(subject,window_at) do update set hits=payment_private.rate_windows.hits+1 returning hits into n;
 return n<=p_limit; end $$;
create function payment_private.audit(p_actor uuid,p_action text,p_entity text,p_details jsonb default '{}') returns void
 language sql security definer set search_path='' as $$
 insert into public.payment_audit_logs(actor_id,action,entity_id,details) values(p_actor,p_action,p_entity,p_details)
$$;
-- Trigger changes are also captured if an operator uses the SQL console.
create function payment_private.audit_config() returns trigger language plpgsql security definer set search_path='' as $$
 begin perform payment_private.audit(auth.uid(),TG_TABLE_NAME||'_'||TG_OP,coalesce(to_jsonb(NEW)->>'id',to_jsonb(NEW)->>'user_id',to_jsonb(OLD)->>'id',to_jsonb(OLD)->>'user_id','unknown'),jsonb_build_object('table',TG_TABLE_NAME)); return coalesce(NEW,OLD); end $$;
create trigger audit_accounts after insert or update or delete on public.receiving_accounts for each row execute function payment_private.audit_config();
create trigger audit_charges after insert or update or delete on public.billing_charges for each row execute function payment_private.audit_config();
create trigger audit_admins after insert or update or delete on public.payment_admins for each row execute function payment_private.audit_config();
create trigger audit_patterns after insert or update or delete on payment_private.sms_patterns for each row execute function payment_private.audit_config();
create trigger audit_devices after insert or update or delete on payment_private.sms_devices for each row execute function payment_private.audit_config();
-- Preserve invoice receiving-account snapshot: disabling is allowed, changing the number isn't.
create function payment_private.immutable_account() returns trigger language plpgsql set search_path='' as $$
 begin if (NEW.provider,NEW.account_number) is distinct from (OLD.provider,OLD.account_number) then raise exception 'CREATE_NEW_ACCOUNT_INSTEAD'; end if; return NEW; end $$;
create trigger account_identity before update on public.receiving_accounts for each row execute function payment_private.immutable_account();

create function public.payment_create_invoice(p_actor uuid,p_charge uuid,p_account uuid) returns public.payment_invoices
 language plpgsql security definer set search_path='' as $$
 declare c public.billing_charges; a public.receiving_accounts; i public.payment_invoices;
 begin
 select * into c from public.billing_charges where id=p_charge and payer_id=p_actor for update;
 if not found or not c.active or c.due_at<=now() then raise exception 'CHARGE_UNAVAILABLE'; end if;
 select * into i from public.payment_invoices where charge_id=c.id;
 if found then return i; end if;
 select * into a from public.receiving_accounts where id=p_account and active;
 if not found then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
 insert into public.payment_invoices(payer_id,charge_id,receiving_account_id,provider,receiving_number,description,amount_minor,currency,payment_window_start,payment_window_end)
 values(p_actor,c.id,a.id,a.provider,a.account_number,c.description,c.amount_minor,c.currency,now()-interval '5 minutes',c.due_at) returning * into i;
 perform payment_private.audit(p_actor,'INVOICE_CREATED',i.id::text,jsonb_build_object('amount_minor',i.amount_minor)); return i;
 end $$;

create function payment_private.reconcile(p_submission uuid) returns public.payment_submissions
 language plpgsql security definer set search_path='' as $$
 declare s public.payment_submissions; i public.payment_invoices; t public.incoming_transactions; why text;
 begin
 select * into s from public.payment_submissions where id=p_submission;
 if not found then raise exception 'NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(s.provider::text||':'||s.transaction_id,0));
 select * into i from public.payment_invoices where id=s.invoice_id for update;
 select * into s from public.payment_submissions where id=p_submission for update;
 if s.status in ('CONFIRMED_PAID','REJECTED') then return s; end if;
 select * into t from public.incoming_transactions where provider=s.provider and transaction_id=s.transaction_id for update;
 if not found then return s; end if;
 why:=case
 when t.quarantined then 'CONFLICTING_EVIDENCE'
 when t.receiving_account_id<>i.receiving_account_id or t.receiving_number<>i.receiving_number then 'RECEIVING_ACCOUNT_MISMATCH'
 when t.amount_minor<>i.amount_minor or t.currency<>i.currency then 'AMOUNT_MISMATCH'
 when t.paid_at<i.payment_window_start or t.paid_at>i.payment_window_end or t.paid_at>now()+interval '5 minutes' then 'PAYMENT_TIME_OUTSIDE_WINDOW'
 when t.sender_reliable and t.sender_number is distinct from s.sender_number then 'SENDER_MISMATCH'
 when exists(select 1 from public.payment_submissions where incoming_transaction_id=t.id and id<>s.id) then 'TRANSACTION_ALREADY_CLAIMED'
 else 'SMS_ASSISTED_MATCH_NOT_PROVIDER_SETTLEMENT' end;
 update public.payment_submissions set status=case when why='SMS_ASSISTED_MATCH_NOT_PROVIDER_SETTLEMENT' then 'SMS_MATCHED'::public.payment_status else 'REVIEW_REQUIRED'::public.payment_status end,
 incoming_transaction_id=case when why='SMS_ASSISTED_MATCH_NOT_PROVIDER_SETTLEMENT' then t.id else null end,
 match_reason=why,updated_at=now() where id=s.id returning * into s;
 perform payment_private.audit(null,'RECONCILIATION',s.id::text,jsonb_build_object('status',s.status,'reason',why));return s;
 end $$;

create function public.payment_submit(p_actor uuid,p_invoice text,p_sender text,p_transaction text) returns public.payment_submissions
 language plpgsql security definer set search_path='' as $$
 declare i public.payment_invoices; s public.payment_submissions; tx text:=upper(trim(p_transaction));
 begin
 if p_sender !~ '^01[3-9][0-9]{8}$' or tx !~ '^[A-Z0-9]{5,40}$' then raise exception 'INVALID_INPUT'; end if;
 select * into i from public.payment_invoices where invoice_number=p_invoice and payer_id=p_actor;
 if not found then raise exception 'NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(i.provider::text||':'||tx,0));
 select * into i from public.payment_invoices where id=i.id for update;
 if i.confirmed_at is not null or now()>i.payment_window_end+interval '30 days' then raise exception 'INVOICE_CLOSED'; end if;
 select * into s from public.payment_submissions where invoice_id=i.id and status<>'REJECTED';
 if found then
  if s.transaction_id=tx and s.sender_number=p_sender then return payment_private.reconcile(s.id); end if;
  raise exception 'ACTIVE_SUBMISSION_EXISTS';
 end if;
 if exists(select 1 from public.payment_submissions where provider=i.provider and transaction_id=tx and status<>'REJECTED') then raise exception 'TRANSACTION_UNAVAILABLE'; end if;
 insert into public.payment_submissions(invoice_id,payer_id,provider,transaction_id,sender_number)
 values(i.id,p_actor,i.provider,tx,p_sender) returning * into s;
 perform payment_private.audit(p_actor,'PAYMENT_SUBMITTED',s.id::text,'{}');return payment_private.reconcile(s.id);
 end $$;

create function public.payment_admin_decide(p_actor uuid,p_submission uuid,p_decision text,p_reason text,p_reference text,p_checked boolean) returns public.payment_submissions
 language plpgsql security definer set search_path='' as $$
 declare s public.payment_submissions; i public.payment_invoices;
 begin
 if not payment_private.is_admin(p_actor) then raise exception 'FORBIDDEN'; end if;
 if p_decision not in ('APPROVE','REJECT') or length(trim(p_reason)) not between 10 and 500 then raise exception 'INVALID_INPUT'; end if;
 select * into s from public.payment_submissions where id=p_submission;
 if not found then raise exception 'NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(s.provider::text||':'||s.transaction_id,0));
 select * into i from public.payment_invoices where id=s.invoice_id for update;
 select * into s from public.payment_submissions where id=p_submission for update;
 if s.payer_id=p_actor then raise exception 'SELF_APPROVAL_FORBIDDEN'; end if;
 if s.status in ('CONFIRMED_PAID','REJECTED') then raise exception 'ALREADY_REVIEWED'; end if;
 if p_decision='APPROVE' then
  s:=payment_private.reconcile(s.id);
  if s.status<>'SMS_MATCHED' or s.incoming_transaction_id is null or p_checked is not true or coalesce(length(trim(p_reference)),0) not between 5 and 160 then raise exception 'INDEPENDENT_VERIFICATION_REQUIRED'; end if;
  if i.confirmed_at is not null then raise exception 'INVOICE_CLOSED'; end if;
  update public.payment_invoices set confirmed_at=now() where id=i.id;
  update public.payment_submissions set status='CONFIRMED_PAID',reviewed_by=p_actor,reviewed_at=now(),updated_at=now() where id=s.id returning * into s;
  insert into public.payment_receipts(receipt_number,invoice_id,submission_id,payer_id) values('RCPT-'||i.invoice_number,i.id,s.id,s.payer_id);
 else
  update public.payment_submissions set status='REJECTED',incoming_transaction_id=null,reviewed_by=p_actor,reviewed_at=now(),updated_at=now() where id=s.id returning * into s;
 end if;
 insert into public.payment_reviews(submission_id,reviewer_id,decision,reason,settlement_reference,independently_checked)
 values(s.id,p_actor,p_decision,trim(p_reason),nullif(trim(p_reference),''),p_checked);
 perform payment_private.audit(p_actor,'ADMIN_'||p_decision,s.id::text,jsonb_build_object('status',s.status));return s;
 end $$;

-- Signed transport authenticates the bridge, NOT the provider. Everything stays SMS_ASSISTED.
create function public.payment_sms_config(p_device text) returns jsonb language plpgsql security definer set search_path='' as $$
 declare d payment_private.sms_devices; a public.receiving_accounts;
 begin
 select * into d from payment_private.sms_devices where id=p_device and active;
 if not found then return null; end if;
 select * into a from public.receiving_accounts where id=d.receiving_account_id and active;
 if not found then return null; end if;
 return jsonb_build_object('device',to_jsonb(d),'account',to_jsonb(a),'patterns',coalesce((select jsonb_agg(to_jsonb(p)) from payment_private.sms_patterns p where p.active and p.provider=a.provider and p.receiving_account_id=a.id),'[]'));
 end $$;

create function public.payment_ingest_sms(p_device text,p_nonce text,p_signed_at timestamptz,p_event text,p_hash text,p_outcome text,p_credit jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
 declare d payment_private.sms_devices; a public.receiving_accounts; e payment_private.webhook_events; t public.incoming_transactions; sid uuid; n integer; tx text;
 begin
 if abs(extract(epoch from now()-p_signed_at))>300 then return jsonb_build_object('outcome','STALE_REQUEST'); end if;
 select * into d from payment_private.sms_devices where id=p_device and active;
 if not found then return jsonb_build_object('outcome','DEVICE_DISABLED'); end if;
 insert into payment_private.webhook_nonces(device_id,nonce) values(p_device,p_nonce) on conflict do nothing;
 get diagnostics n=row_count;
 if n=0 then return jsonb_build_object('outcome','REPLAY'); end if;
 -- Device/event advisory lock serializes idempotent retries with different nonces.
 perform pg_advisory_xact_lock(hashtextextended(p_device||':'||p_event,1));
 select * into e from payment_private.webhook_events where device_id=p_device and event_id=p_event;
 if found then
  if e.payload_hash<>p_hash then return jsonb_build_object('outcome','EVENT_CONFLICT'); end if;
  return jsonb_build_object('outcome','DUPLICATE_EVENT','incoming_id',e.incoming_id);
 end if;
 if p_credit is not null then
  select * into a from public.receiving_accounts where id=d.receiving_account_id and active;
  if not found or p_credit->>'provider'<>a.provider::text or p_credit->>'receiving_number'<>a.account_number or not exists(select 1 from payment_private.sms_patterns where id=(p_credit->>'pattern_id')::uuid and active and provider=a.provider and receiving_account_id=a.id) then raise exception 'INVALID_EVIDENCE'; end if;
  tx:=p_credit->>'transaction_id';
  perform pg_advisory_xact_lock(hashtextextended(a.provider::text||':'||tx,0));
  insert into public.incoming_transactions(provider,transaction_id,receiving_account_id,receiving_number,amount_minor,paid_at,sender_number,sender_reliable,source,evidence_hash,pattern_id,device_id)
  values(a.provider,tx,a.id,a.account_number,(p_credit->>'amount_minor')::bigint,(p_credit->>'paid_at')::timestamptz,p_credit->>'sender_number',coalesce((p_credit->>'sender_reliable')::boolean,false),'SMS_ASSISTED',p_hash,(p_credit->>'pattern_id')::uuid,p_device)
  on conflict(provider,transaction_id) do nothing returning * into t;
  if not found then
   select * into t from public.incoming_transactions where provider=a.provider and transaction_id=tx;
   p_outcome:=case when t.receiving_number=a.account_number and t.amount_minor=(p_credit->>'amount_minor')::bigint and t.paid_at=(p_credit->>'paid_at')::timestamptz and t.sender_number is not distinct from (p_credit->>'sender_number') then 'DUPLICATE_TRANSACTION' else 'CONFLICTING_EVIDENCE' end;
  else p_outcome:='ACCEPTED'; end if;
  if p_outcome='ACCEPTED' then
   for sid in select id from public.payment_submissions where provider=a.provider and transaction_id=tx and status in ('PENDING','REVIEW_REQUIRED') loop perform payment_private.reconcile(sid); end loop;
  elsif p_outcome='CONFLICTING_EVIDENCE' then
   update public.incoming_transactions set quarantined=true where id=t.id;
   update public.payment_submissions set status='REVIEW_REQUIRED',incoming_transaction_id=null,match_reason='CONFLICTING_EVIDENCE',updated_at=now() where provider=a.provider and transaction_id=tx and status in ('PENDING','SMS_MATCHED','REVIEW_REQUIRED');
  end if;
 end if;
 insert into payment_private.webhook_events(device_id,event_id,payload_hash,outcome,incoming_id) values(p_device,p_event,p_hash,p_outcome,t.id);
 perform payment_private.audit(null,'SMS_'||p_outcome,coalesce(t.id::text,p_event),jsonb_build_object('device_id',p_device));
 return jsonb_build_object('outcome',p_outcome,'incoming_id',t.id);
 end $$;

-- Authorization remains in SQL even if an Edge caller omits its own admin check.
create function public.payment_create_charge(p_actor uuid,p_payer uuid,p_description text,p_reference text,p_amount_minor bigint,p_due_at timestamptz) returns public.billing_charges
 language plpgsql security definer set search_path='' as $$
 declare c public.billing_charges; begin
 if not payment_private.is_admin(p_actor) then raise exception 'FORBIDDEN'; end if;
 if p_due_at<=now() or p_due_at>now()+interval '1 year' then raise exception 'INVALID_DUE_DATE'; end if;
 insert into public.billing_charges(payer_id,description,billing_reference,amount_minor,due_at) values(p_payer,trim(p_description),trim(p_reference),p_amount_minor,p_due_at) returning * into c;
 perform payment_private.audit(p_actor,'CHARGE_CREATED',c.id::text,jsonb_build_object('amount_minor',c.amount_minor));return c;
 end $$;

-- RLS: owners read their records; no client role can alter financial state or roles.
do $$ declare t text; begin
 foreach t in array array['payment_admins','receiving_accounts','billing_charges','payment_invoices','incoming_transactions','payment_submissions','payment_reviews','payment_receipts','payment_audit_logs'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from anon, authenticated',t);
  execute format('grant all on table public.%I to service_role',t);
 end loop;
 foreach t in array array['billing_charges','payment_invoices','payment_submissions','payment_receipts'] loop
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy owner_read on public.%I for select to authenticated using (payer_id = (select auth.uid()))',t);
 end loop;
end $$;
grant select on public.receiving_accounts to authenticated;
create policy active_accounts on public.receiving_accounts for select to authenticated using(active);
-- No public function accepts a user-chosen actor through the Data API.
revoke all on all functions in schema payment_private from public,anon,authenticated;
do $$ declare f record; begin
 for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'payment_%' loop
 execute format('revoke all on function %s from public, anon, authenticated',f.sig);
 execute format('grant execute on function %s to service_role',f.sig);
 end loop;
end $$;
grant usage on schema payment_private to service_role;
grant usage,select on all sequences in schema public to service_role;
-- Maintenance: retain audit/receipts; remove only expired nonce/rate metadata.
create function public.payment_prune_ephemeral() returns void language plpgsql security definer set search_path='' as $$ begin
 delete from payment_private.webhook_nonces where accepted_at<now()-interval '1 day';
 delete from payment_private.rate_windows where window_at<now()-interval '1 day';
 end $$;
revoke all on function public.payment_prune_ephemeral() from public,anon,authenticated;
grant execute on function public.payment_prune_ephemeral() to service_role;

-- Preserve sample provenance. Replace patterns with new IDs; only activation may change.
create function payment_private.immutable_pattern() returns trigger language plpgsql set search_path='' as $$
 begin if (to_jsonb(NEW)-'active') is distinct from (to_jsonb(OLD)-'active') then raise exception 'CREATE_NEW_VERIFIED_PATTERN_INSTEAD'; end if; return NEW; end $$;
revoke all on function payment_private.immutable_pattern() from public,anon,authenticated;
create trigger pattern_identity before update on payment_private.sms_patterns for each row execute function payment_private.immutable_pattern();
alter table public.incoming_transactions add constraint incoming_pattern_fk foreign key(pattern_id) references payment_private.sms_patterns(id);
