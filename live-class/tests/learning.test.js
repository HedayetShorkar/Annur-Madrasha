import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import {openDb} from '../server/db.js';
import {createApp} from '../server/app.js';
const origin='http://localhost:5173',password='TestPassword-12345';
const post=(agent,path,body={})=>agent.post('/api/live'+path).set('Origin',origin).send(body);
function fixture(){
 const db=openDb(':memory:'),hash=bcrypt.hashSync(password,4);
 for(const [id,role]of [['admin','admin'],['teacher','teacher'],['other','teacher'],['student','student'],['sibling','student'],['stranger','student']])db.prepare('INSERT INTO users(id,name,email,password,role,login_id) VALUES(?,?,?,?,?,?)').run(id,id,id+'@example.test',hash,role,role==='student'?'AN-'+id:null);
 db.prepare("INSERT INTO classes(id,title,teacher_id,room,scheduled,status) VALUES('c','Quran','teacher','room-c','2026-10-25T12:00:00Z','live')").run();
 for(const id of ['student','sibling'])db.prepare("INSERT INTO roster(class_id,user_id) VALUES('c',?)").run(id);
 const video={id:'jitsi',enabled:true,capabilities:{roomStats:false,serverModeration:false,verifiedAttendance:false}},app=createApp({db,video,origin});
 return {db,app,async login(id){const agent=request.agent(app);assert.equal((await post(agent,'/login',{identifier:['student','sibling','stranger'].includes(id)?'AN-'+id:id+'@example.test',password})).status,200);return agent;}};
}
const lesson={version:0,topic:'মাখরাজ',summary:'আজকের পাঠ',homework:'অনুশীলন'};
const report={version:0,attendance:'present',stage:'hifz',covered:'সূরা ফাতিহা',homeworkStatus:'practicing',feedback:'নিজস্ব মূল্যায়ন'};
test('lessons and progress are private to assigned roles; students read only their own report',async()=>{
 const f=fixture();try{
  const t=await f.login('teacher'),s=await f.login('student'),o=await f.login('other'),x=await f.login('stranger');
  assert.equal((await post(t,'/classes/c/lesson',lesson)).status,200);
  assert.equal((await post(t,'/classes/c/reports/student',report)).status,200);
  await post(t,'/classes/c/reports/sibling',{...report,feedback:'Other child private feedback'});
  const r=await s.get('/api/live/classes/c/learning');assert.equal(r.status,200);assert.equal(r.body.canEdit,false);assert.equal(r.body.lesson.homework,lesson.homework);assert.equal(r.body.reports.length,1);assert.equal(r.body.reports[0].id,'student');assert.equal(r.body.attendanceSource,'STAFF_RECORDED');assert.ok(!JSON.stringify(r.body).includes('Other child private feedback'));
  for(const agent of [o,x])assert.equal((await agent.get('/api/live/classes/c/learning')).status,403);
  assert.equal((await post(s,'/classes/c/lesson',lesson)).status,403);assert.equal((await post(s,'/classes/c/reports/student',report)).status,403);
  assert.equal((await request(f.app).get('/api/live/classes/c/learning')).status,401);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM attendance').get().n,0);
 }finally{f.db.close();}
});
test('simultaneous lesson/report updates conflict instead of overwriting; validation and audits are bounded',async()=>{
 const f=fixture();try{
  const t=await f.login('teacher'),a=await f.login('admin');
  const results=await Promise.all([post(t,'/classes/c/lesson',lesson),post(a,'/classes/c/lesson',{...lesson,topic:'Second writer'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal((await post(t,'/classes/c/lesson',{...lesson,version:1,summary:'a'.repeat(4001)})).status,400);
  assert.equal((await post(t,'/classes/c/lesson',{...lesson,version:1,role:'admin'})).status,400);
  const reports=await Promise.all([post(t,'/classes/c/reports/student',report),post(a,'/classes/c/reports/student',report)]);assert.deepEqual(reports.map(r=>r.status).sort(),[200,409]);
  assert.equal((await post(t,'/classes/c/reports/stranger',report)).status,403);assert.equal((await post(t,'/classes/c/reports/student',{...report,version:1,attendance:'server_verified'})).status,400);
  assert.ok(!JSON.stringify(f.db.prepare('SELECT detail FROM audit').all()).includes(report.feedback));
 }finally{f.db.close();}
});
test('next class copies only allowed active students into a fresh room without moving old progress',async()=>{
 const f=fixture();try{
  const a=await f.login('admin'),t=await f.login('teacher');
  await post(t,'/classes/c/reports/student',report);f.db.prepare("UPDATE roster SET blocked=1 WHERE user_id='sibling'").run();
  assert.equal((await post(t,'/classes/c/copy',{scheduled:'2026-10-26T12:00:00Z'})).status,403);
  const r=await post(a,'/classes/c/copy',{scheduled:'2026-10-26T12:00:00Z'});assert.equal(r.status,201);
  const next=f.db.prepare('SELECT * FROM classes WHERE id=?').get(r.body.id);assert.equal(next.status,'scheduled');assert.notEqual(next.room,'room-c');assert.equal(next.teacher_id,'teacher');
  assert.deepEqual(f.db.prepare('SELECT user_id FROM roster WHERE class_id=?').all(next.id).map(r=>r.user_id),['student']);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM student_lesson_reports WHERE class_id=?').get(next.id).n,0);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM student_lesson_reports WHERE class_id='c'").get().n,1);
 }finally{f.db.close();}
});
test('local recording notices require assigned staff, expire, are idempotent and never imply provider attendance',async()=>{
 const f=fixture(),id='11111111-1111-4111-8111-111111111111';try{
  const a=await f.login('admin'),t=await f.login('teacher'),s=await f.login('student'),o=await f.login('other');
  for(const agent of [s,o])assert.equal((await post(agent,'/classes/c/recording',{action:'start',recordingId:id})).status,403);
  assert.equal((await post(t,'/classes/c/recording',{action:'start',recordingId:id,filename:'/private/path.webm'})).status,400);
  for(let i=0;i<2;i++)assert.equal((await post(t,'/classes/c/recording',{action:'start',recordingId:id})).status,200);
  const rows=await s.get('/api/live/classes');assert.equal(rows.body.classes[0].recordings.length,1);assert.equal(rows.body.classes[0].recordings[0].name,'teacher');assert.equal(rows.body.classes[0].count,null);
  assert.equal((await post(a,'/classes/c/recording',{action:'heartbeat',recordingId:id})).status,403);
  assert.equal((await post(t,'/classes/c/recording',{action:'heartbeat',recordingId:id})).status,200);
  f.db.prepare('UPDATE local_recording_notices SET expires=0').run();assert.equal((await s.get('/api/live/classes')).body.classes[0].recordings.length,0);
  assert.equal((await post(t,'/classes/c/recording',{action:'heartbeat',recordingId:id})).status,409);assert.equal((await post(t,'/classes/c/recording',{action:'start',recordingId:id})).status,409);
  assert.equal((await post(t,'/classes/c/recording',{action:'stop',recordingId:id})).status,200);
  assert.equal(f.db.prepare("SELECT COUNT(*) n FROM audit WHERE action='LOCAL_RECORDING_NOTICE_STARTED'").get().n,1);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM attendance').get().n,0);
 }finally{f.db.close();}
});
test('ending a class, disabling staff or blocking students removes notices/access without deleting reports',async()=>{
 const f=fixture(),id='22222222-2222-4222-8222-222222222222';try{
  const t=await f.login('teacher'),s=await f.login('student');await post(t,'/classes/c/reports/student',report);await post(t,'/classes/c/recording',{action:'start',recordingId:id});
  f.db.prepare("UPDATE users SET active=0 WHERE id='teacher'").run();assert.equal((await s.get('/api/live/classes')).body.classes[0].recordings.length,0);
  f.db.prepare("UPDATE users SET active=1 WHERE id='teacher'").run();f.db.prepare("UPDATE classes SET status='ended' WHERE id='c'").run();assert.equal((await s.get('/api/live/classes')).body.classes[0].recordings.length,0);
  assert.equal((await post(t,'/classes/c/recording',{action:'heartbeat',recordingId:id})).status,409);
  assert.equal((await post(t,'/classes/c/recording',{action:'stop',recordingId:id})).status,200);
  f.db.prepare("UPDATE roster SET blocked=1 WHERE user_id='student'").run();assert.equal((await s.get('/api/live/classes/c/learning')).status,403);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM student_lesson_reports').get().n,1);
 }finally{f.db.close();}
});
