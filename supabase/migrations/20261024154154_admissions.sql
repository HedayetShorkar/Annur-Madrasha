create table public.admission_admins(user_id uuid primary key references auth.users(id),active boolean not null default true);
create table public.admissions(id uuid primary key default gen_random_uuid(),request_id uuid unique not null,reference text unique not null default ('ANN-'||upper(replace(gen_random_uuid()::text,'-',''))),data jsonb not null,status text not null default 'SUBMITTED' check(status in('SUBMITTED','IN_REVIEW','APPROVED','REJECTED')),fee_date date not null,fee_bdt_minor integer not null check(fee_bdt_minor>0),monthly_bdt_minor integer not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index admissions_status_created on public.admissions(status,created_at desc);
create table public.admission_audit(id bigint generated always as identity primary key,application_id uuid not null references public.admissions(id),actor uuid,old_status text,new_status text not null,reason text not null,created_at timestamptz not null default now());
create index admission_audit_application on public.admission_audit(application_id,created_at);
create schema admission_private;
revoke all on schema admission_private from public,anon,authenticated;
grant usage on schema admission_private to service_role;
create table admission_private.limits(key text not null,bucket timestamptz not null,n integer not null,primary key(key,bucket));
alter table admission_private.limits enable row level security;
grant all on admission_private.limits to service_role;
alter table public.admission_admins enable row level security;
alter table public.admissions enable row level security;
alter table public.admission_audit enable row level security;
revoke all on public.admission_admins,public.admissions,public.admission_audit from anon,authenticated;
grant all on public.admission_admins,public.admissions,public.admission_audit to service_role;
grant usage,select on sequence public.admission_audit_id_seq to service_role;
create function public.annoor_submit_admission(p_data jsonb,p_ip text) returns jsonb language plpgsql set search_path='' as $$
declare r public.admissions; d date; first_next date; start_d date; monthly integer; amount integer; days integer; day integer; count_n integer; k text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_data->>'request_id',0));
 select * into r from public.admissions where request_id=(p_data->>'request_id')::uuid;
 if found then
  if r.data<>p_data then raise exception 'CONFLICT';end if;
  return jsonb_build_object('reference',r.reference,'status',r.status,'fee_bdt_minor',r.fee_bdt_minor,'fee_date',r.fee_date);
 end if;
 if p_data->>'consent'<>'true' or jsonb_typeof(p_data->'age')<>'number' or (p_data->>'age')::integer not between 5 and 18 or length(p_data->>'student_name') not between 1 and 120 or length(p_data->>'guardian_name') not between 1 and 120 then raise exception 'INVALID_DATA';end if;
 monthly:=case p_data->>'plan' when 'Basic' then 99900 when 'Standard' then 199900 when 'Premium' then 299900 else null end;
 if monthly is null then raise exception 'INVALID_DATA';end if;
 d:=(clock_timestamp() at time zone 'Asia/Dhaka')::date;first_next:=(date_trunc('month',d)+interval '1 month')::date;start_d:=(p_data->>'start_date')::date;
 if start_d<d or start_d>first_next then raise exception 'INVALID_DATE';end if;
 if start_d=first_next then d:=first_next;end if;
 days:=extract(day from (date_trunc('month',d)+interval '1 month - 1 day'));day:=extract(day from d);
 amount:=case when day<=7 then monthly else round(monthly::numeric*(days-day+1)/days)::integer end;
 -- Durable per-source, per-contact and global limits. No raw IP is stored.
 foreach k in array array['ip:'||p_ip,'phone:'||md5(p_data->>'phone'),'global'] loop
  insert into admission_private.limits values(k,date_trunc('hour',now()),1) on conflict(key,bucket) do update set n=admission_private.limits.n+1 returning n into count_n;
  if count_n>(case when k='global' then 200 else 5 end) then raise exception 'RATE_LIMITED';end if;
 end loop;
 delete from admission_private.limits where bucket<now()-interval '2 days';
 insert into public.admissions(request_id,data,fee_date,fee_bdt_minor,monthly_bdt_minor) values((p_data->>'request_id')::uuid,p_data,d,amount,monthly) returning * into r;
 insert into public.admission_audit(application_id,new_status,reason) values(r.id,'SUBMITTED','Application received');
 return jsonb_build_object('reference',r.reference,'status',r.status,'fee_bdt_minor',r.fee_bdt_minor,'fee_date',r.fee_date);
end; $$;
create function public.annoor_admin_admissions(p_actor uuid,p_action text,p_data jsonb) returns jsonb language plpgsql set search_path='' as $$
declare r public.admissions; items jsonb; amount bigint; target text; reason text; offs integer;
begin
 if not exists(select 1 from public.admission_admins where user_id=p_actor and active) then raise exception 'FORBIDDEN';end if;
 if p_action='list' then
  offs:=greatest(0,least(coalesce((p_data->>'offset')::integer,0),10000));
  select count(*) into amount from public.admissions where coalesce(p_data->>'status','')='' or status=p_data->>'status';
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into items from(select id,reference,status,data,fee_date,fee_bdt_minor,monthly_bdt_minor,created_at,updated_at from public.admissions where coalesce(p_data->>'status','')='' or status=p_data->>'status' order by created_at desc,id limit 25 offset offs)s;
  return jsonb_build_object('items',items,'total',amount);
 elsif p_action='audit' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into items from(select * from public.admission_audit where application_id=(p_data->>'id')::uuid order by id desc limit 100)s;return items;
 elsif p_action='decide' then
  target:=p_data->>'status';reason:=trim(p_data->>'reason');
  if target not in('IN_REVIEW','APPROVED','REJECTED') or reason is null or length(reason) not between 5 and 1000 then raise exception 'INVALID_DATA';end if;
  select * into r from public.admissions where id=(p_data->>'id')::uuid for update;
  if not found or r.status<>p_data->>'expected_status' or r.status='APPROVED' or r.status=target then raise exception 'CONFLICT';end if;
  update public.admissions set status=target,updated_at=now() where id=r.id;
  insert into public.admission_audit(application_id,actor,old_status,new_status,reason) values(r.id,p_actor,r.status,target,reason);
  return jsonb_build_object('status',target);
 end if;
 raise exception 'INVALID_DATA';
end; $$;
create function admission_private.protect_audit() returns trigger language plpgsql set search_path='' as $$begin raise exception 'AUDIT_IMMUTABLE';end;$$;
create trigger admission_audit_immutable before update or delete on public.admission_audit for each row execute function admission_private.protect_audit();
revoke all on function public.annoor_submit_admission(jsonb,text),public.annoor_admin_admissions(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.annoor_submit_admission(jsonb,text),public.annoor_admin_admissions(uuid,text,jsonb) to service_role;
revoke all on function admission_private.protect_audit() from public,anon,authenticated;
