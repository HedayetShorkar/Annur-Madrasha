const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('../payment-module/node_modules/@electric-sql/pglite');
(async()=>{const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);');
await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261024181248_admissions.sql'),'utf8'));
const migrationDir=path.join(__dirname,'../supabase/migrations');for(const name of fs.readdirSync(migrationDir).filter(n=>n.endsWith('_harden_admission_review.sql')))await db.exec(fs.readFileSync(path.join(migrationDir,name),'utf8'));
const today=(await db.query("select (now() at time zone 'Asia/Dhaka')::date::text as d")).rows[0].d;
const data={request_id:crypto.randomUUID(),student_name:'TEST',guardian_name:'TEST GUARDIAN',age:10,consent:true,plan:'Basic',start_date:today,phone:'TEST'};
const submit=async d=>(await db.query('select public.annoor_submit_admission($1::jsonb,$2) as r',[JSON.stringify(d),'test-ip'])).rows[0].r;
const a=await submit(data);assert.equal(a.status,'SUBMITTED');assert.equal((await submit(data)).reference,a.reference);assert.equal((await db.query('select count(*)::int as n from admission_audit')).rows[0].n,1);
await assert.rejects(submit({...data,student_name:'changed'}),/CONFLICT/);
await assert.rejects(submit({...data,request_id:crypto.randomUUID(),age:19}),/INVALID_DATA/);
await assert.rejects(submit({...data,request_id:crypto.randomUUID(),start_date:'2000-01-01'}),/INVALID_DATE/);
const id=(await db.query('select id from admissions')).rows[0].id,actor=crypto.randomUUID();
const decide=async(expected,status)=>(await db.query("select public.annoor_admin_admissions($1,'decide',$2::jsonb) as r",[actor,JSON.stringify({id,expected_status:expected,status,reason:'Test verification'})])).rows[0].r;
await assert.rejects(decide('SUBMITTED','APPROVED'),/FORBIDDEN/);
await db.query('insert into auth.users values($1)',[actor]);await db.query('insert into admission_admins(user_id) values($1)',[actor]);
await assert.rejects(decide(undefined,'IN_REVIEW'),/INVALID_DATA/);await assert.rejects(decide(null,'IN_REVIEW'),/INVALID_DATA/);assert.equal((await db.query('select status from admissions')).rows[0].status,'SUBMITTED');
assert.equal((await decide('SUBMITTED','IN_REVIEW')).status,'IN_REVIEW');await assert.rejects(decide('SUBMITTED','REJECTED'),/CONFLICT/);assert.equal((await decide('IN_REVIEW','APPROVED')).status,'APPROVED');await assert.rejects(decide('APPROVED','REJECTED'),/CONFLICT/);
await assert.rejects(db.exec('delete from admission_audit'),/AUDIT_IMMUTABLE/);
await db.exec('set role anon');await assert.rejects(db.exec('select * from public.admissions'),/permission denied/);await assert.rejects(db.query('select public.annoor_submit_admission($1::jsonb,$2)',[JSON.stringify(data),'x']),/permission denied/);await db.exec('reset role');
for(let i=0;i<4;i++)await submit({...data,request_id:crypto.randomUUID()});await assert.rejects(submit({...data,request_id:crypto.randomUUID()}),/RATE_LIMITED/);
const d=Number(today.slice(8)),days=new Date(Date.UTC(Number(today.slice(0,4)),Number(today.slice(5,7)),0)).getUTCDate();assert.equal(a.fee_bdt_minor,d<=7?99900:Math.round(99900*(days-d+1)/days));
await db.close();
if(process.argv.includes('--hosted')){
 const vm=require('node:vm'),context={window:{},document:{getElementById:()=>null}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/backend-config.js'),'utf8'),context);const cfg=context.window.AnNoorBackend;
 for(const [route,body,token,expected]of [['health',null,null,200],['list',{},null,401],['list',{},'fake',401],['submit',{},null,400],['submit',{request_id:crypto.randomUUID(),status:'APPROVED'},null,400]]){const r=await fetch(cfg.url+'/functions/v1/admissions/'+route,{method:body?'POST':'GET',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});assert.equal(r.status,expected,route);}
 console.log('PASS: hosted health and invalid-data/authentication denial');
}
console.log('PASS: server fees, idempotency, conflicts, age/date validation, admin isolation, review races, immutable audit, anon denial and durable rate limits');})().catch(e=>{console.error(e);process.exitCode=1;});
