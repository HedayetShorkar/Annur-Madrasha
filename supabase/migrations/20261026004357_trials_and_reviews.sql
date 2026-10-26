-- Additive intake and moderated feedback; existing admissions/fees stay intact.
create table public.trial_applications (
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
 reference text not null unique default ('ANT-'||upper(replace(gen_random_uuid()::text,'-',''))),
 data jsonb not null, status text not null default 'SUBMITTED' check(status in('SUBMITTED','IN_REVIEW','APPROVED','REJECTED')),
 version integer not null default 1 check(version>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index trial_applications_status_created on public.trial_applications(status,created_at desc,id);
create table public.parent_reviews (
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
 reference text not null unique default ('ANR-'||upper(replace(gen_random_uuid()::text,'-',''))),
 data jsonb not null check(data->'publish_consent'='true'::jsonb),
 status text not null default 'PENDING' check(status in('PENDING','APPROVED','REJECTED')),
 version integer not null default 1 check(version>0), published_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status='APPROVED')=(published_at is not null))
);
create index parent_reviews_status_published on public.parent_reviews(status,published_at desc,id);
create index parent_reviews_created on public.parent_reviews(created_at desc,id);
create table public.engagement_audit (
 id bigint generated always as identity primary key,
 trial_id uuid references public.trial_applications(id), review_id uuid references public.parent_reviews(id), actor uuid,
 old_status text, new_status text not null, reason text not null, created_at timestamptz not null default now(),
 check(num_nonnulls(trial_id,review_id)=1)
);
create index engagement_audit_trial on public.engagement_audit(trial_id,id);
create index engagement_audit_review on public.engagement_audit(review_id,id);
alter table public.trial_applications enable row level security;
alter table public.parent_reviews enable row level security;
alter table public.engagement_audit enable row level security;
revoke all on public.trial_applications,public.parent_reviews,public.engagement_audit from public,anon,authenticated;
grant select,insert,update on public.trial_applications,public.parent_reviews to service_role;
grant select,insert on public.engagement_audit to service_role;
grant usage,select on sequence public.engagement_audit_id_seq to service_role;
create trigger engagement_audit_immutable before update or delete on public.engagement_audit for each row execute function admission_private.protect_audit();

create function admission_private.consume_engagement_limit(p_kind text,p_ip text,p_contact text) returns void language plpgsql set search_path='' as $$
declare k text; count_n integer;
begin
 if p_kind not in('TRIAL','REVIEW') or coalesce(p_ip,'') !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_DATA';end if;
 foreach k in array array[p_kind||':ip:'||p_ip,p_kind||':contact:'||md5(coalesce(p_contact,'')),p_kind||':global'] loop
  insert into admission_private.limits values(k,date_trunc('hour',now()),1)
  on conflict(key,bucket) do update set n=admission_private.limits.n+1 returning n into count_n;
  if count_n>(case when k=p_kind||':global' then 200 else 5 end) then raise exception 'RATE_LIMITED';end if;
 end loop;
 delete from admission_private.limits where bucket<now()-interval '2 days';
end;$$;

create function public.annoor_submit_trial(p_data jsonb,p_ip text) returns jsonb language plpgsql set search_path='' as $$
declare r public.trial_applications;
begin
 if jsonb_typeof(p_data) is distinct from 'object' or coalesce(p_data->>'request_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then raise exception 'INVALID_DATA';end if;
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in('request_id','student_name','age','guardian_name','phone','level','preferred_time','consent','language')) then raise exception 'INVALID_DATA';end if;
 if coalesce(p_data->>'consent','')<>'true' or jsonb_typeof(p_data->'consent') is distinct from 'boolean' or jsonb_typeof(p_data->'age') is distinct from 'number' or coalesce(p_data->>'age','') !~ '^(5|6|7|8|9|1[0-8])$'
  or length(trim(coalesce(p_data->>'student_name',''))) not between 1 and 120
  or length(trim(coalesce(p_data->>'guardian_name',''))) not between 1 and 120
  or coalesce(p_data->>'phone','') !~ '^\+?[0-9]{7,15}$'
  or length(coalesce(p_data->>'preferred_time',''))>240
  or coalesce(p_data->>'level','') not in('New (not started yet)','Noorani Qaida','Can read the Quran','Reads with Tajweed','Hifz','To discuss')
  or coalesce(p_data->>'language','') not in('bn','en') then raise exception 'INVALID_DATA';end if;
 perform pg_advisory_xact_lock(hashtextextended('trial:'||(p_data->>'request_id'),0));
 select * into r from public.trial_applications where request_id=(p_data->>'request_id')::uuid;
 if found then
  if r.data<>p_data then raise exception 'CONFLICT';end if;
  return jsonb_build_object('reference',r.reference,'status',r.status);
 end if;
 perform admission_private.consume_engagement_limit('TRIAL',p_ip,p_data->>'phone');
 insert into public.trial_applications(request_id,data) values((p_data->>'request_id')::uuid,p_data) returning * into r;
 insert into public.engagement_audit(trial_id,new_status,reason) values(r.id,'SUBMITTED','Free trial requested');
 return jsonb_build_object('reference',r.reference,'status',r.status);
end;$$;

create function public.annoor_submit_review(p_data jsonb,p_ip text) returns jsonb language plpgsql set search_path='' as $$
declare r public.parent_reviews;
begin
 if jsonb_typeof(p_data) is distinct from 'object' or coalesce(p_data->>'request_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then raise exception 'INVALID_DATA';end if;
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in('request_id','guardian_name','country','review','rating','publish_consent','language')) then raise exception 'INVALID_DATA';end if;
 if coalesce(p_data->>'publish_consent','')<>'true' or jsonb_typeof(p_data->'publish_consent') is distinct from 'boolean'
  or length(trim(coalesce(p_data->>'guardian_name',''))) not between 1 and 80
  or length(trim(coalesce(p_data->>'country',''))) not between 1 and 60
  or length(trim(coalesce(p_data->>'review',''))) not between 10 and 600
  or coalesce(p_data->>'language','') not in('bn','en') then raise exception 'INVALID_DATA';end if;
 if p_data->>'rating' is not null and (jsonb_typeof(p_data->'rating')<>'number' or p_data->>'rating' !~ '^[1-5]$') then raise exception 'INVALID_DATA';end if;
 perform pg_advisory_xact_lock(hashtextextended('review:'||(p_data->>'request_id'),0));
 select * into r from public.parent_reviews where request_id=(p_data->>'request_id')::uuid;
 if found then
  if r.data<>p_data then raise exception 'CONFLICT';end if;
  return jsonb_build_object('reference',r.reference,'status',r.status);
 end if;
 perform admission_private.consume_engagement_limit('REVIEW',p_ip,(p_data->>'guardian_name')||':'||(p_data->>'country'));
 insert into public.parent_reviews(request_id,data) values((p_data->>'request_id')::uuid,p_data) returning * into r;
 insert into public.engagement_audit(review_id,new_status,reason) values(r.id,'PENDING','Parent feedback received with publishing consent');
 return jsonb_build_object('reference',r.reference,'status',r.status);
end;$$;

create function public.annoor_published_reviews(p_offset integer default 0) returns jsonb language plpgsql set search_path='' as $$
declare items jsonb; amount bigint;
begin
 if p_offset<0 or p_offset>10000 then raise exception 'INVALID_DATA';end if;
 select count(*) into amount from public.parent_reviews where status='APPROVED';
 select coalesce(jsonb_agg(to_jsonb(s)),'[]') into items from(
  select id,data->>'guardian_name' as name,data->>'country' as country,data->>'review' as text,data->'rating' as rating,published_at
  from public.parent_reviews where status='APPROVED' order by published_at desc,id limit 6 offset coalesce(p_offset,0)
 )s;
 return jsonb_build_object('items',items,'total',amount);
end;$$;

create function public.annoor_admin_engagement(p_actor uuid,p_kind text,p_action text,p_data jsonb) returns jsonb language plpgsql set search_path='' as $$
declare r record; items jsonb; amount bigint; target text; reason text; offs integer; filter text;
begin
 if not exists(select 1 from public.admission_admins where user_id=p_actor and active) then raise exception 'FORBIDDEN';end if;
 if p_kind not in('TRIAL','REVIEW') or jsonb_typeof(p_data) is distinct from 'object' then raise exception 'INVALID_DATA';end if;
 if p_action='list' then
  if coalesce(p_data->>'offset','0') !~ '^\d{1,5}$' then raise exception 'INVALID_DATA';end if;
  offs:=least(coalesce((p_data->>'offset')::integer,0),10000);filter:=coalesce(p_data->>'status','');
  if p_kind='TRIAL' then
   if filter not in('','SUBMITTED','IN_REVIEW','APPROVED','REJECTED') then raise exception 'INVALID_DATA';end if;
   select count(*) into amount from public.trial_applications where filter='' or status=filter;
   select coalesce(jsonb_agg(to_jsonb(s)),'[]') into items from(select id,reference,data,status,version,created_at,updated_at from public.trial_applications where filter='' or status=filter order by created_at desc,id limit 25 offset offs)s;
  else
   if filter not in('','PENDING','APPROVED','REJECTED') then raise exception 'INVALID_DATA';end if;
   select count(*) into amount from public.parent_reviews where filter='' or status=filter;
   select coalesce(jsonb_agg(to_jsonb(s)),'[]') into items from(select id,reference,data,status,version,published_at,created_at,updated_at from public.parent_reviews where filter='' or status=filter order by created_at desc,id limit 25 offset offs)s;
  end if;
  return jsonb_build_object('items',items,'total',amount);
 elsif p_action='audit' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into items from(select * from public.engagement_audit where (p_kind='TRIAL' and trial_id=(p_data->>'id')::uuid) or (p_kind='REVIEW' and review_id=(p_data->>'id')::uuid) order by id desc limit 100)s;
  return items;
 elsif p_action='decide' then
  target:=coalesce(p_data->>'status','');reason:=trim(coalesce(p_data->>'reason',''));
  if length(reason) not between 5 and 1000 or coalesce(p_data->>'expected_version','') !~ '^[1-9][0-9]{0,8}$' then raise exception 'INVALID_DATA';end if;
  if p_kind='TRIAL' then
   if target not in('IN_REVIEW','APPROVED','REJECTED') then raise exception 'INVALID_DATA';end if;
   select * into r from public.trial_applications where id=(p_data->>'id')::uuid for update;
  else
   if target not in('PENDING','APPROVED','REJECTED') then raise exception 'INVALID_DATA';end if;
   select * into r from public.parent_reviews where id=(p_data->>'id')::uuid for update;
  end if;
  if not found then raise exception 'CONFLICT';end if;
  if r.version<>(p_data->>'expected_version')::integer or r.status=target then raise exception 'CONFLICT';end if;
  if p_kind='TRIAL' then
   update public.trial_applications set status=target,version=version+1,updated_at=now() where id=r.id;
  else
   update public.parent_reviews set status=target,version=version+1,updated_at=now(),published_at=case when target='APPROVED' then now() else null end where id=r.id;
  end if;
  insert into public.engagement_audit(trial_id,review_id,actor,old_status,new_status,reason) values(case when p_kind='TRIAL' then r.id end,case when p_kind='REVIEW' then r.id end,p_actor,r.status,target,reason);
  return jsonb_build_object('status',target,'version',r.version+1);
 end if;
 raise exception 'INVALID_DATA';
end;$$;

revoke all on function admission_private.consume_engagement_limit(text,text,text),public.annoor_submit_trial(jsonb,text),public.annoor_submit_review(jsonb,text),public.annoor_published_reviews(integer),public.annoor_admin_engagement(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function admission_private.consume_engagement_limit(text,text,text),public.annoor_submit_trial(jsonb,text),public.annoor_submit_review(jsonb,text),public.annoor_published_reviews(integer),public.annoor_admin_engagement(uuid,text,text,jsonb) to service_role;
