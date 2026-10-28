-- Compatible function-only hardening. No application, account or audit data is removed.
create or replace function public.annoor_admin_admissions(p_actor uuid,p_action text,p_data jsonb) returns jsonb language plpgsql set search_path='' as $$
declare r public.admissions; items jsonb; amount bigint; target text; reason text; offs integer;
begin
 if not exists(select 1 from public.admission_admins where user_id=p_actor and active) then raise exception 'FORBIDDEN';end if;
 if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'INVALID_DATA';end if;
 if p_action='decide' and (coalesce(p_data->>'expected_status','') not in('SUBMITTED','IN_REVIEW','APPROVED','REJECTED') or coalesce(p_data->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') then raise exception 'INVALID_DATA';end if;
 if p_action='list' then
  offs:=greatest(0,least(coalesce((p_data->>'offset')::integer,0),10000));
  select count(*) into amount from public.admissions where coalesce(p_data->>'status','')='' or status=p_data->>'status';
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into items from(select id,reference,status,data,fee_date,fee_bdt_minor,monthly_bdt_minor,created_at,updated_at from public.admissions where coalesce(p_data->>'status','')='' or status=p_data->>'status' order by created_at desc,id limit 25 offset offs)s;
  return jsonb_build_object('items',items,'total',amount);
 elsif p_action='audit' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into items from(select * from public.admission_audit where application_id=(p_data->>'id')::uuid order by id desc limit 100)s;return items;
 elsif p_action='decide' then
  target:=coalesce(p_data->>'status','');reason:=trim(p_data->>'reason');
  if target not in('IN_REVIEW','APPROVED','REJECTED') or reason is null or length(reason) not between 5 and 1000 then raise exception 'INVALID_DATA';end if;
  select * into r from public.admissions where id=(p_data->>'id')::uuid for update;
  if not found or r.status is distinct from p_data->>'expected_status' or r.status='APPROVED' or r.status=target then raise exception 'CONFLICT';end if;
  update public.admissions set status=target,updated_at=now() where id=r.id;
  insert into public.admission_audit(application_id,actor,old_status,new_status,reason) values(r.id,p_actor,r.status,target,reason);
  return jsonb_build_object('status',target);
 end if;
 raise exception 'INVALID_DATA';
end; $$;

revoke all on function public.annoor_admin_admissions(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.annoor_admin_admissions(uuid,text,jsonb) to service_role;
