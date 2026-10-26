// Real PostgreSQL-engine tests; all data is synthetic and stays local.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('../payment-module/node_modules/@electric-sql/pglite');
(async()=>{
 const dir=path.join(__dirname,'../supabase/migrations'),migration=process.argv[2]||path.join(dir,fs.readdirSync(dir).find(n=>n.endsWith('_trials_and_reviews.sql'))||'MISSING');
 const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);');
 await db.exec(fs.readFileSync(path.join(dir,'20261024181248_admissions.sql'),'utf8'));await db.exec(fs.readFileSync(migration,'utf8'));
 const ip='a'.repeat(64),actor=crypto.randomUUID(),other=crypto.randomUUID();await db.query('insert into auth.users values($1)',[actor]);await db.query('insert into admission_admins(user_id) values($1)',[actor]);
 const trial=()=>({request_id:crypto.randomUUID(),student_name:'Fictional student',age:10,guardian_name:'Fictional guardian',phone:'+8801700000000',level:'To discuss',preferred_time:'Discuss a suitable time',consent:true,language:'bn'});
 const review=(i=0)=>({request_id:crypto.randomUUID(),guardian_name:'Fictional guardian '+i,country:'Test country',review:'Synthetic review for integration testing only. Never publish this fixture.',rating:i===0?null:5,publish_consent:true,language:'bn'});
 const submit=async(kind,data,source=ip)=>(await db.query('select public.annoor_submit_'+kind+'($1::jsonb,$2) as r',[JSON.stringify(data),source])).rows[0].r;
 const publicReviews=async(offset=0)=>(await db.query('select public.annoor_published_reviews($1) as r',[offset])).rows[0].r;
 const admin=async(kind,action,data,user=actor)=>(await db.query('select public.annoor_admin_engagement($1,$2,$3,$4::jsonb) as r',[user,kind,action,JSON.stringify(data)])).rows[0].r;
 const td=trial(),t=await submit('trial',td);assert.match(t.reference,/^ANT-[A-F0-9]{32}$/);assert.equal(t.status,'SUBMITTED');assert.equal((await submit('trial',td)).reference,t.reference);
 assert.equal((await db.query('select count(*)::int as n from engagement_audit')).rows[0].n,1);await assert.rejects(submit('trial',{...td,student_name:'Changed'}),/CONFLICT/);
 for(const age of [4,19,5.5])await assert.rejects(submit('trial',{...trial(),age}),/INVALID_DATA/);
 await assert.rejects(submit('trial',{...trial(),consent:false}),/INVALID_DATA/);await assert.rejects(submit('trial',{...trial(),status:'APPROVED'}),/INVALID_DATA/);
 assert.equal((await db.query('select count(*)::int as n from admissions')).rows[0].n,0);
 const data=review(),received=await submit('review',data);assert.equal(received.status,'PENDING');assert.match(received.reference,/^ANR-[A-F0-9]{32}$/);assert.equal((await submit('review',data)).reference,received.reference);assert.equal((await publicReviews()).total,0);
 for(const invalid of [{publish_consent:false},{rating:6},{review:'short'},{status:'APPROVED'}])await assert.rejects(submit('review',{...review(),...invalid}),/INVALID_DATA/);
 await assert.rejects(admin('REVIEW','list',{},other),/FORBIDDEN/);
 const row=(await admin('REVIEW','list',{})).items[0];
 const races=await Promise.allSettled([admin('REVIEW','decide',{id:row.id,status:'APPROVED',expected_version:1,reason:'Synthetic approval'}),admin('REVIEW','decide',{id:row.id,status:'REJECTED',expected_version:1,reason:'Stale synthetic decision'})]);
 assert.equal(races.filter(x=>x.status==='fulfilled').length,1);assert.match(races.find(x=>x.status==='rejected').reason.message,/CONFLICT/);assert.equal((await publicReviews()).total,1);
 const published=(await publicReviews()).items[0];assert.deepEqual(Object.keys(published).sort(),['country','id','name','published_at','rating','text']);assert.equal(published.text,data.review);assert.equal(published.rating,null);
 await assert.rejects(admin('REVIEW','decide',{id:row.id,status:'REJECTED',expected_version:2,reason:'x'}),/INVALID_DATA/);
 await admin('REVIEW','decide',{id:row.id,status:'REJECTED',expected_version:2,reason:'Synthetic withdrawal'});assert.equal((await publicReviews()).total,0);assert.equal((await submit('review',data)).status,'REJECTED');assert.equal((await admin('REVIEW','audit',{id:row.id})).length,3);
 await assert.rejects(db.exec('delete from engagement_audit'),/AUDIT_IMMUTABLE/);await assert.rejects(db.exec("update engagement_audit set reason='changed'"),/AUDIT_IMMUTABLE/);
 for(let i=1;i<=7;i++){await submit('review',review(i),i.toString(16).repeat(64));const r=(await admin('REVIEW','list',{status:'PENDING'})).items[0];await admin('REVIEW','decide',{id:r.id,status:'APPROVED',expected_version:1,reason:'Synthetic moderation'});}
 const first=await publicReviews(),second=await publicReviews(6);assert.equal(first.total,7);assert.equal(first.items.length,6);assert.equal(second.items.length,1);assert.equal(new Set([...first.items,...second.items].map(x=>x.id)).size,7);await assert.rejects(publicReviews(-1),/INVALID_DATA/);
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);for(const table of ['trial_applications','parent_reviews','engagement_audit'])await assert.rejects(db.exec('select * from public.'+table),/permission denied/);await assert.rejects(publicReviews(),/permission denied/);await assert.rejects(submit('trial',trial()),/permission denied/);await db.exec('reset role');}
 // Even an accidental table SELECT grant does not bypass default-deny RLS.
 await db.exec('grant select on public.parent_reviews to anon;set role anon');assert.equal((await db.query('select count(*)::int as n from parent_reviews')).rows[0].n,0);await db.exec('reset role;revoke select on public.parent_reviews from anon');
 await db.exec('delete from admission_private.limits');for(let i=0;i<5;i++)await submit('trial',trial());await assert.rejects(submit('trial',trial()),/RATE_LIMITED/);
 await db.exec('delete from admission_private.limits');for(let i=0;i<5;i++)await submit('trial',trial(),(i+16).toString(16).repeat(32));await assert.rejects(submit('trial',trial(),'b'.repeat(64)),/RATE_LIMITED/);
 const trialRow=(await admin('TRIAL','list',{})).items[0];await admin('TRIAL','decide',{id:trialRow.id,status:'APPROVED',expected_version:1,reason:'Trial may be arranged'});await assert.rejects(admin('TRIAL','decide',{id:trialRow.id,status:'REJECTED',expected_version:1,reason:'Stale update'}),/CONFLICT/);
 await db.query('update admission_admins set active=false where user_id=$1',[actor]);await assert.rejects(admin('REVIEW','list',{}),/FORBIDDEN/);
 await db.close();console.log('PASS: trial/review validation and idempotency, no fee side effects, consent, default-deny RLS/privileges, moderated public whitelist and pagination, atomic version races/withdrawal, immutable audit and durable IP/contact limits.');
})().catch(e=>{console.error(e);process.exitCode=1;});
