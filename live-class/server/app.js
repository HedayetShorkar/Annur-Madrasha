import express from 'express';import helmet from 'helmet';import {rateLimit} from 'express-rate-limit';import bcrypt from 'bcryptjs';import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {allocateLoginId,generatePassword,normalizeLoginId} from './identities.js';
import {receiptRoutes} from './receipts.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const fail=(status,code)=>{throw Object.assign(Error(code),{status});};
const safeUser=u=>({id:u.id,name:u.name,email:u.role==='student'?(u.contact_email||null):u.email,loginId:u.role==='student'?u.login_id:null,role:u.role,active:!!u.active});
export function createApp({db,video,origin,production=false,trustProxyHops=0}){
 const app=express();if(trustProxyHops)app.set('trust proxy',trustProxyHops);app.disable('x-powered-by');app.use(helmet({contentSecurityPolicy:false}));
 app.use('/api/live',(_,res,next)=>{res.set('Cache-Control','no-store');next();});
 app.use('/api/live',(req,res,next)=>{if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.get('origin')!==origin)return res.status(403).json({error:'ORIGIN_REJECTED'});next();});
 app.use(express.json({limit:'32kb'}));
 app.use('/api/live',(req,res,next)=>{if(!['GET','HEAD','OPTIONS'].includes(req.method)&&(!req.body||typeof req.body!=='object'||Array.isArray(req.body)))return res.status(400).json({error:'INVALID_INPUT'});next();});
 app.use('/api/live',rateLimit({windowMs:60000,limit:180,standardHeaders:'draft-8',legacyHeaders:false}));
 const audit=(actor,action,c=null,detail={})=>db.prepare('INSERT INTO audit(actor,action,class_id,detail) VALUES(?,?,?,?)').run(actor,action,c,JSON.stringify(detail));
 const user=req=>{const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('live_session='))?.slice(13);if(!token)return null;return db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>? AND u.active=1').get(hash(token),Date.now());};
 const auth=(req,res,next)=>{req.user=user(req);if(!req.user)return res.status(401).json({error:'LOGIN_REQUIRED'});next();};
 const admin=(req,res,next)=>{if(req.user.role!=='admin')return res.status(403).json({error:'ADMIN_REQUIRED'});next();};
 const getClass=(req)=>{const c=db.prepare('SELECT * FROM classes WHERE id=?').get(req.params.id);if(!c)fail(404,'CLASS_NOT_FOUND');const u=req.user;if(u.role==='admin'||c.teacher_id===u.id)return c;const r=db.prepare('SELECT * FROM roster WHERE class_id=? AND user_id=?').get(c.id,u.id);if(!r||r.blocked)fail(403,'CLASS_ACCESS_DENIED');return c;};
 const manage=(req)=>{const c=getClass(req);if(req.user.role!=='admin'&&c.teacher_id!==req.user.id)fail(403,'MODERATOR_REQUIRED');return c;};
 const str=(v,max=120)=>typeof v==='string'?v.trim().slice(0,max):'';
 function addUser(input){
  const name=str(input.name),contact=str(input.email,254).toLowerCase(),role=input.role;
  if(!name||!['teacher','student'].includes(role)||contact&&!/^\S+@\S+\.\S+$/.test(contact)||role==='teacher'&&!contact)fail(400,'INVALID_USER');
  const supplied=typeof input.password==='string'&&input.password.length>0;
  const password=supplied?input.password:generatePassword();
  if(password.length<12||Buffer.byteLength(password,'utf8')>72)fail(400,'INVALID_USER');
  const id=randomUUID(),email=role==='student'?'student-'+id+'@accounts.invalid':contact;
  if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'EMAIL_EXISTS');
  const loginId=role==='student'?allocateLoginId(db):null;
  db.prepare('INSERT INTO users(id,name,email,password,role,login_id,contact_email) VALUES(?,?,?,?,?,?,?)').run(id,name,email,bcrypt.hashSync(password,12),role,loginId,role==='student'?(contact||null):null);
  return {...safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)),...(!supplied?{initialPassword:password}:{})};
 }
 const dummy=bcrypt.hashSync(randomBytes(24).toString('hex'),12);
 app.post('/api/live/login',rateLimit({windowMs:900000,limit:15}),(req,res)=>{const identifier=str(req.body.identifier??req.body.email,254),password=typeof req.body.password==='string'?req.body.password:'';const u=db.prepare("SELECT * FROM users WHERE active=1 AND ((role='student' AND login_id=? COLLATE NOCASE) OR (role IN ('admin','teacher') AND email=?))").get(normalizeLoginId(identifier),identifier.toLowerCase());if(Buffer.byteLength(password,'utf8')>72||!bcrypt.compareSync(password,u?.password||dummy)||!u)fail(401,'INVALID_CREDENTIALS');const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('INSERT INTO sessions(hash,user_id,expires) VALUES(?,?,?)').run(hash(token),u.id,Date.now()+8*3600000);res.cookie('live_session',token,{httpOnly:true,secure:production,sameSite:'strict',path:'/api/live',maxAge:8*3600000});audit(u.id,'LOGIN');res.json({user:safeUser(u)});});
 app.post('/api/live/logout',auth,(req,res)=>{const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('live_session='))?.slice(13);if(token)db.prepare('DELETE FROM sessions WHERE hash=?').run(hash(token));res.clearCookie('live_session',{path:'/api/live',httpOnly:true,secure:production,sameSite:'strict'});res.json({ok:true});});
 app.get('/api/live/me',auth,(req,res)=>res.json({user:safeUser(req.user),videoConfigured:video.enabled}));
 app.get('/api/live/users',auth,admin,(_,res)=>res.json(db.prepare('SELECT * FROM users ORDER BY name').all().map(safeUser)));
 app.post('/api/live/users',auth,admin,(req,res)=>{const u=addUser(req.body);audit(req.user.id,'USER_CREATED',null,{user:u.id,role:u.role});res.status(201).json(u);});
 app.post('/api/live/users/:id/active',auth,admin,(req,res)=>{if(typeof req.body.active!=='boolean')fail(400,'INVALID_INPUT');const u=db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);if(!u||u.role==='admin')fail(400,'PROTECTED_ACCOUNT');db.prepare('UPDATE users SET active=? WHERE id=?').run(+req.body.active,u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);audit(req.user.id,'USER_ACTIVE_CHANGED',null,{user:u.id,active:req.body.active});res.json({ok:true});});
 app.post('/api/live/password',auth,(req,res)=>{const {currentPassword,password}=req.body;if(typeof currentPassword!=='string'||typeof password!=='string'||password.length<12||Buffer.byteLength(password,'utf8')>72||!bcrypt.compareSync(currentPassword,req.user.password))fail(400,'INVALID_PASSWORD');db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(password,12),req.user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(req.user.id);audit(req.user.id,'PASSWORD_CHANGED');res.json({ok:true});});
 app.post('/api/live/users/:id/password',auth,admin,(req,res)=>{const u=db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id),password=req.body.password;if(!u||u.role==='admin'||typeof password!=='string'||password.length<12||Buffer.byteLength(password,'utf8')>72)fail(400,'INVALID_PASSWORD');db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(password,12),u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);audit(req.user.id,'PASSWORD_RESET',null,{user:u.id});res.json({ok:true});});
 app.get('/api/live/classes',auth,async(req,res)=>{
 const u=req.user;const all=db.prepare('SELECT c.*,u.name teacher FROM classes c JOIN users u ON c.teacher_id=u.id ORDER BY c.scheduled DESC').all();const rows=all.filter(c=>u.role==='admin'||c.teacher_id===u.id||db.prepare('SELECT 1 FROM roster WHERE class_id=? AND user_id=? AND blocked=0').get(c.id,u.id));
 let live=[],unavailable=false;if(video.enabled){try{live=await video.list();}catch{unavailable=true;}}
 const result=await Promise.all(rows.map(async c=>{const room=live.find(r=>r.name===c.room);let participants=[];let participantError=false;if(room&&(u.role==='admin'||c.teacher_id===u.id)){try{participants=(await video.participants(c.room)).map(p=>({id:p.identity,name:p.name,audioMuted:!(p.tracks||[]).some(t=>t.type===0&&!t.muted)}));}catch{participantError=true;}}
 return {...c,liveNow:!!room,count:room?.numParticipants||0,participants,participantError,roster:u.role==='admin'||c.teacher_id===u.id?db.prepare('SELECT u.id,u.name,r.blocked FROM roster r JOIN users u ON r.user_id=u.id WHERE r.class_id=?').all(c.id):undefined};}));res.json({classes:result,videoConfigured:video.enabled,unavailable,checkedAt:new Date().toISOString()});});
 app.post('/api/live/classes',auth,admin,(req,res)=>{const title=str(req.body.title),teacher=db.prepare("SELECT id FROM users WHERE id=? AND role='teacher' AND active=1").get(str(req.body.teacherId)),scheduled=str(req.body.scheduled);if(!title||!teacher||!scheduled||!Number.isFinite(Date.parse(scheduled)))fail(400,'INVALID_CLASS');const id=randomUUID();db.prepare('INSERT INTO classes(id,title,teacher_id,room,scheduled) VALUES(?,?,?,?,?)').run(id,title,teacher.id,'annoor-'+randomUUID(),new Date(scheduled).toISOString());audit(req.user.id,'CLASS_CREATED',id);res.status(201).json({id});});
 app.post('/api/live/classes/:id/roster',auth,admin,(req,res)=>{const c=manage(req),student=db.prepare("SELECT id FROM users WHERE id=? AND role='student' AND active=1").get(str(req.body.userId));if(!student||c.status==='ended')fail(400,'INVALID_STUDENT');db.prepare('INSERT INTO roster(class_id,user_id,blocked) VALUES(?,?,0) ON CONFLICT(class_id,user_id) DO UPDATE SET blocked=0').run(c.id,student.id);audit(req.user.id,'STUDENT_ASSIGNED',c.id,{student:student.id});res.json({ok:true});});
 app.get('/api/live/health',(_,res)=>res.json({ok:true,videoConfigured:video.enabled}));
 app.post('/api/live/classes/:id/start',auth,async(req,res)=>{const c=manage(req);if(c.status==='ended')fail(409,'CLASS_ENDED');await video.create(c.room);const changed=db.prepare("UPDATE classes SET status='live' WHERE id=? AND status<>'ended'").run(c.id);if(!changed.changes)fail(409,'CLASS_ENDED');audit(req.user.id,'CLASS_STARTED',c.id);res.json({ok:true});});
 app.post('/api/live/classes/:id/token',auth,async(req,res)=>{const c=getClass(req);if(c.status!=='live')fail(409,'CLASS_NOT_LIVE');if(c.locked&&req.user.role==='student')fail(403,'CLASS_LOCKED');if(req.body.observeOnly!==undefined&&typeof req.body.observeOnly!=='boolean')fail(400,'INVALID_INPUT');if(req.body.observeOnly&&req.user.role!=='admin')fail(403,'ADMIN_REQUIRED');const token=await video.token(c,req.user,{observeOnly:!!req.body.observeOnly});if(!user(req))fail(401,'LOGIN_REQUIRED');getClass(req);const latest=db.prepare('SELECT status,locked FROM classes WHERE id=?').get(c.id);if(latest.status!=='live'||latest.locked&&req.user.role==='student')fail(409,'CLASS_CHANGED');audit(req.user.id,req.user.role==='admin'?'SUPERVISOR_JOIN':'JOIN_TOKEN_ISSUED',c.id);res.json({token,url:video.url,title:c.title});});
 app.post('/api/live/classes/:id/lock',auth,(req,res)=>{const c=manage(req);if(typeof req.body.locked!=='boolean'||c.status==='ended')fail(400,'INVALID_INPUT');db.prepare('UPDATE classes SET locked=? WHERE id=?').run(+req.body.locked,c.id);audit(req.user.id,'JOIN_LOCK_CHANGED',c.id,{locked:req.body.locked});res.json({ok:true});});
 app.post('/api/live/classes/:id/end',auth,async(req,res)=>{const c=manage(req);db.prepare("UPDATE classes SET status='ended',locked=1 WHERE id=?").run(c.id);audit(req.user.id,'CLASS_END_REQUESTED',c.id);try{await video.end(c.room);res.json({ok:true});}catch{res.status(503).json({error:'END_CLEANUP_PENDING'});}});
 app.post('/api/live/classes/:id/mute',auth,async(req,res)=>{const c=manage(req);if(c.status!=='live')fail(409,'CLASS_NOT_LIVE');const participants=await video.participants(c.room);const ids=new Set(db.prepare('SELECT user_id FROM roster WHERE class_id=?').all(c.id).map(r=>r.user_id));let failed=0;for(const p of participants)if(ids.has(p.identity)&&(!req.body.userId||req.body.userId===p.identity)){try{await video.mute(c.room,p);}catch{failed++;}}audit(req.user.id,'MUTE_STUDENTS',c.id,{failed});res.status(failed?503:200).json(failed?{error:'PARTIAL_MUTE_FAILURE'}:{ok:true});});
 app.post('/api/live/classes/:id/remove',auth,async(req,res)=>{const c=manage(req),id=str(req.body.userId);const r=db.prepare('SELECT * FROM roster WHERE class_id=? AND user_id=?').get(c.id,id);if(!r)fail(400,'STUDENT_NOT_ASSIGNED');db.prepare('UPDATE roster SET blocked=1 WHERE class_id=? AND user_id=?').run(c.id,id);audit(req.user.id,'STUDENT_BLOCKED',c.id,{student:id});try{await video.remove(c.room,id);res.json({ok:true});}catch{res.status(503).json({error:'REMOVAL_PENDING'});}});
 app.get('/api/live/classes/:id/attendance',auth,(req,res)=>{const c=manage(req);res.json(db.prepare('SELECT a.*,u.name FROM attendance a JOIN users u ON u.id=a.user_id WHERE class_id=?').all(c.id));});
 app.get('/api/live/audit',auth,admin,(_,res)=>res.json(db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 100').all()));
 receiptRoutes(app,{db,auth,admin,audit});
 app.use((err,req,res,next)=>{if(res.headersSent)return next(err);const known=typeof err.message==='string'&&/^[A-Z][A-Z0-9_]+$/.test(err.message);const status=err.status&&err.status>=400&&err.status<500?err.status:503;res.status(status).json({error:known?err.message:status===400?'INVALID_INPUT':'SERVICE_UNAVAILABLE'});});
 return app;
}
// Reconcile from media-server state; no client heartbeat is trusted as attendance.
export async function reconcile(db,video){
 if(!video.enabled)return;
 const rooms=await video.list();let failed=0;
 for(const room of rooms){
  try{
   const c=db.prepare('SELECT * FROM classes WHERE room=?').get(room.name);if(!c)continue;
   if(c.status==='ended'){await video.end(room.name);continue;}if(c.status!=='live')continue;
   for(const p of await video.participants(room.name)){
    try{
     const u=db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(p.identity);
     const allowed=u&&(u.role==='admin'||c.teacher_id===u.id||db.prepare('SELECT 1 FROM roster WHERE class_id=? AND user_id=? AND blocked=0').get(c.id,u.id));
     if(!allowed){await video.remove(room.name,p.identity);continue;}
     const now=new Date().toISOString();db.prepare('INSERT INTO attendance(class_id,user_id,first_seen,last_seen) VALUES(?,?,?,?) ON CONFLICT(class_id,user_id) DO UPDATE SET last_seen=excluded.last_seen,samples=samples+1').run(c.id,u.id,now,now);
    }catch{failed++;}
   }
  }catch{failed++;}
 }
 if(failed)throw Error('RECONCILIATION_PARTIAL_FAILURE');
}
