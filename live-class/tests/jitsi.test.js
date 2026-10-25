import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,generateKeyPairSync,verify} from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import {provider} from '../server/provider.js';
import {openDb} from '../server/db.js';
import {createApp,reconcile} from '../server/app.js';
const env={VIDEO_PROVIDER:'jitsi',JITSI_DOMAIN:'meet.school.test',JITSI_APP_ID:'annoor',JITSI_APP_SECRET:'test-only-'.repeat(6)};
const c={room:'annoor-test-room',teacher_id:'teacher'},student={id:'student',role:'student',name:'Test Child'},teacher={id:'teacher',role:'teacher',name:'Test Teacher'},admin={id:'admin',role:'admin',name:'Test Supervisor'};
const decode=t=>JSON.parse(Buffer.from(t.split('.')[1],'base64url'));
test('self-hosted JWT is signed, room scoped, short lived and server identified',async()=>{
 const p=provider(env),token=await p.token(c,student),[header,body,signature]=token.split('.'),claims=decode(token);
 assert.equal(JSON.parse(Buffer.from(header,'base64url')).alg,'HS256');
 assert.equal(signature,createHmac('sha256',env.JITSI_APP_SECRET).update(header+'.'+body).digest('base64url'));
 assert.equal(claims.room,c.room);assert.equal(claims.context.room.regex,false);assert.equal(claims.context.user.id,'student');assert.equal(claims.context.user.moderator,false);assert.equal(claims.context.user.affiliation,'member');assert.equal(claims.context.user.email,undefined);
 assert.equal(claims.exp-claims.iat,60);assert.ok(claims.nbf<=claims.iat);assert.equal(claims.iss,'annoor');assert.equal(claims.aud,'annoor');assert.equal(claims.sub,'meet.school.test');assert.equal(p.capabilities.verifiedAttendance,false);
 assert.equal(p.joinInfo(c,student).roomName,c.room);assert.equal(p.joinInfo(c,student).provider,'jitsi');
});
test('only assigned teacher or admin gets moderator claims; supervision is visible',async()=>{
 const p=provider(env);for(const u of [teacher,admin])assert.equal(decode(await p.token(c,u)).context.user.moderator,true);
 assert.equal(decode(await p.token(c,{...teacher,id:'other'})).context.user.moderator,false);
 await assert.rejects(p.token(c,student,{observeOnly:true}),/ADMIN_REQUIRED/);
 const claims=decode(await p.token(c,admin,{observeOnly:true}));assert.match(claims.context.user.name,/তদারকি.*নীরব/);assert.equal(claims.context.features.recording,false);assert.equal(claims.context.user['hidden-from-recorder'],undefined);
});
test('JaaS RS256 signature, key ID and literal room use the documented contract',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048}),appId='vpaas-magic-cookie-test123';
 const p=provider({VIDEO_PROVIDER:'jitsi',JITSI_MODE:'jaas',JITSI_APP_ID:appId,JITSI_KEY_ID:appId+'/testkey',JITSI_PRIVATE_KEY:privateKey.export({type:'pkcs8',format:'pem'}).toString()});
 const token=await p.token(c,student),[h,b,s]=token.split('.'),header=JSON.parse(Buffer.from(h,'base64url')),claims=decode(token);
 assert.equal(header.alg,'RS256');assert.equal(header.kid,appId+'/testkey');assert.ok(verify('RSA-SHA256',Buffer.from(h+'.'+b),publicKey,Buffer.from(s,'base64url')));
 assert.equal(claims.iss,'chat');assert.equal(claims.aud,'jitsi');assert.equal(claims.sub,appId);assert.equal(claims.room,c.room);assert.equal(claims.context.user.moderator,'false');assert.equal(decode(await p.token(c,admin)).context.user.moderator,'true');
 assert.equal(p.joinInfo(c,student).roomName,appId+'/'+c.room);assert.equal(p.joinInfo(c,student).domain,'8x8.vc');
});
test('configuration fails closed for insecure/public domains, bad keys and unknown providers',async()=>{
 for(const host of ['http://meet.school.test','meet.school.test/path','user:pass@meet.school.test','meet.school.test?x=1','meet.jit.si'])assert.throws(()=>provider({...env,JITSI_DOMAIN:host}));
 assert.throws(()=>provider({...env,JITSI_APP_SECRET:'short'}),/TOO_SHORT/);assert.throws(()=>provider({...env,VIDEO_PROVIDER:'unknown'}),/INVALID_VIDEO_PROVIDER/);
 const p=provider({VIDEO_PROVIDER:'jitsi'});assert.equal(p.enabled,false);await assert.rejects(p.token(c,student),/VIDEO_NOT_CONFIGURED/);
 assert.equal(provider({LIVEKIT_URL:'wss://test.invalid',LIVEKIT_API_KEY:'key',LIVEKIT_API_SECRET:'test'.repeat(12)}).id,'livekit');
});
test('Jitsi never fabricates server metrics, server moderation or verified attendance',async()=>{
 const p=provider(env);await assert.rejects(p.list(),/VIDEO_CAPABILITY_UNAVAILABLE/);await assert.rejects(p.participants(c.room),/VIDEO_CAPABILITY_UNAVAILABLE/);await assert.rejects(p.mute(),/VIDEO_CAPABILITY_UNAVAILABLE/);
 const db=openDb(':memory:');await reconcile(db,p);assert.equal(db.prepare('select count(*) n from attendance').get().n,0);db.close();
});
const origin='http://localhost:5173',password='TestPassword-12345';
function setup(){const db=openDb(':memory:'),hash=bcrypt.hashSync(password,4);for(const u of [student,teacher,admin,{...student,id:'outsider'}])db.prepare('insert into users(id,name,email,password,role,login_id)values(?,?,?,?,?,?)').run(u.id,u.name,u.id+'@example.test',hash,u.role,u.role==='student'?'AN-'+u.id:null);
 db.prepare("insert into classes(id,title,teacher_id,room,scheduled,status) values('c','Quran','teacher','annoor-test-room','2026-10-25T10:00:00Z','live')").run();db.prepare("insert into roster(class_id,user_id)values('c','student')").run();
 const video=provider(env),app=createApp({db,video,origin});return {db,app,async login(id){const agent=request.agent(app),r=await agent.post('/api/live/login').set('Origin',origin).send({identifier:id==='student'||id==='outsider'?'AN-'+id:id+'@example.test',password});assert.equal(r.status,200);return agent;}};}
const post=(a,path,body={})=>a.post('/api/live'+path).set('Origin',origin).send(body);
test('Jitsi join responses retain ID/login, roster and private supervision rules',async()=>{
 const f=setup();try{const s=await f.login('student'),a=await f.login('admin'),o=await f.login('outsider');
 assert.equal((await post(request(f.app),'/classes/c/token')).status,401);assert.equal((await post(o,'/classes/c/token')).status,403);
 assert.equal((await post(s,'/classes/c/token',{observeOnly:true})).status,403);
 const r=await post(s,'/classes/c/token',{role:'admin',room:'different'});assert.equal(r.status,200);assert.equal(r.body.provider,'jitsi');assert.equal(r.body.domain,'meet.school.test');assert.equal(decode(r.body.token).context.user.moderator,false);assert.equal(decode(r.body.token).room,c.room);
 const preview=await post(a,'/classes/c/token',{observeOnly:true});assert.equal(preview.status,200);assert.match(preview.body.displayName,/নীরব/);
 const list=await a.get('/api/live/classes');assert.equal(list.body.video.id,'jitsi');assert.equal(list.body.classes[0].count,null);assert.equal(list.body.classes[0].liveNow,null);assert.equal(list.body.unavailable,false);assert.equal(list.body.video.capabilities.roomStats,false);
 assert.ok(!JSON.stringify(list.body).includes(env.JITSI_APP_SECRET));assert.ok(!JSON.stringify(f.db.prepare('select detail from audit').all()).includes(r.body.token));
 }finally{f.db.close();}
});
test('Jitsi lock, block and end deny new credentials without claiming a forced media disconnect',async()=>{
 const f=setup();try{const s=await f.login('student'),a=await f.login('admin');
 await post(a,'/classes/c/lock',{locked:true});assert.equal((await post(s,'/classes/c/token')).status,403);
 await post(a,'/classes/c/lock',{locked:false});assert.equal((await post(a,'/classes/c/mute')).status,409);
 const block=await post(a,'/classes/c/remove',{userId:'student'});assert.equal(block.status,200);assert.equal(block.body.mediaDisconnectVerified,false);assert.equal((await post(s,'/classes/c/token')).status,403);
 await post(a,'/classes/c/roster',{userId:'student'});assert.equal((await post(s,'/classes/c/token')).status,200);
 const end=await post(a,'/classes/c/end');assert.equal(end.status,200);assert.equal(end.body.mediaDisconnectVerified,false);assert.equal((await post(s,'/classes/c/token')).status,409);assert.equal(f.db.prepare('select count(*) n from attendance').get().n,0);
 }finally{f.db.close();}
});
