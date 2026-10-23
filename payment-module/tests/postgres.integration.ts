/** True multi-session race test. Run only on a disposable PostgreSQL test database. */
import {test} from 'node:test';import assert from 'node:assert/strict';import {Pool} from 'pg';import fs from 'node:fs';
const connectionString=process.env.PAYMENT_TEST_DATABASE_URL;
test('PostgreSQL: two independent sessions cannot claim the same transaction', {skip:!connectionString},async()=>{
 if(process.env.ALLOW_DISPOSABLE_PAYMENT_DB!=='yes')throw Error('Set ALLOW_DISPOSABLE_PAYMENT_DB=yes for an EMPTY disposable database. Never use production.');
 const pool=new Pool({connectionString,max:4});
 try{
  const exists=await pool.query("select to_regclass('public.payment_invoices') as existing");if(exists.rows[0].existing)throw Error('Use a fresh disposable database; this test does not delete existing data.');
  await pool.query(`do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls;end if;end$$;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon,service_role;`);
  await pool.query(fs.readFileSync(new URL('../supabase/migrations/202610150001_payments.sql',import.meta.url),'utf8'));
  const actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333';
  await pool.query('insert into auth.users values($1),($2),($3)',[actor,other,admin]);await pool.query('insert into payment_admins(user_id) values($1)',[admin]);
  const account=(await pool.query("insert into receiving_accounts(provider,account_number,account_label,payment_instruction_bn,payment_instruction_en,active) values('BKASH','01700000000','TEST','TEST','TEST',true) returning id")).rows[0].id;
  const invoices=[];
  for(const payer of [actor,other]){const c=(await pool.query("select (payment_create_charge($1,$2,'Test','race',10000,now()+interval '1 day')).id as id",[admin,payer])).rows[0].id;invoices.push((await pool.query('select (payment_create_invoice($1,$2,$3)).invoice_number as n',[payer,c,account])).rows[0].n);}
  const a=await pool.connect(),b=await pool.connect();try{
   const outcomes=await Promise.allSettled([a.query("select payment_submit($1,$2,'01800000000','RACE0001')",[actor,invoices[0]]),b.query("select payment_submit($1,$2,'01800000000','RACE0001')",[other,invoices[1]])]);
   assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);
   assert.equal((await pool.query("select count(*)::int as n from payment_submissions where transaction_id='RACE0001' and status<>'REJECTED'")).rows[0].n,1);
  }finally{a.release();b.release();}
 }finally{await pool.end();}
});
