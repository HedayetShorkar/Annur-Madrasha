import {randomUUID} from 'node:crypto';

const fail=(status,code)=>{throw Object.assign(Error(code),{status});};
const text=(value,max)=>typeof value==='string'&&value.length<=max?value.trim():fail(400,'INVALID_INPUT');
function fields(body,allowed){if(Object.keys(body).some(key=>!allowed.includes(key)))fail(400,'INVALID_INPUT');}
function version(value){if(!Number.isSafeInteger(value)||value<0)fail(400,'INVALID_INPUT');return value;}
function atomic(db,work){db.exec('BEGIN IMMEDIATE');try{const value=work();db.exec('COMMIT');return value;}catch(error){db.exec('ROLLBACK');throw error;}}

export function migrateLearning(db){
 db.exec(`
 CREATE TABLE IF NOT EXISTS class_lessons(
  class_id TEXT PRIMARY KEY REFERENCES classes(id),topic TEXT NOT NULL,summary TEXT NOT NULL,homework TEXT NOT NULL,
  version INTEGER NOT NULL,updated_by TEXT NOT NULL REFERENCES users(id),updated_at TEXT NOT NULL
 );
 CREATE TABLE IF NOT EXISTS student_lesson_reports(
  class_id TEXT NOT NULL REFERENCES classes(id),user_id TEXT NOT NULL REFERENCES users(id),
  attendance TEXT NOT NULL CHECK(attendance IN ('unmarked','present','absent','excused')),
  stage TEXT NOT NULL CHECK(stage IN ('qaida','quran','hifz')),
  covered TEXT NOT NULL,homework_status TEXT NOT NULL CHECK(homework_status IN ('not_started','practicing','completed')),
  feedback TEXT NOT NULL,version INTEGER NOT NULL,recorded_by TEXT NOT NULL REFERENCES users(id),updated_at TEXT NOT NULL,
  PRIMARY KEY(class_id,user_id)
 );
 CREATE TABLE IF NOT EXISTS local_recording_notices(
  id TEXT PRIMARY KEY,class_id TEXT NOT NULL REFERENCES classes(id),actor TEXT NOT NULL REFERENCES users(id),
  expires INTEGER NOT NULL,ended_at TEXT
 );
 CREATE INDEX IF NOT EXISTS recording_notice_class ON local_recording_notices(class_id,expires) WHERE ended_at IS NULL;
 INSERT OR IGNORE INTO schema_versions(version) VALUES(3);
 `);
}

// Browser recording notices describe staff intent, never verified media/attendance.
export function recordingNotices(db,classId){
 return db.prepare(`SELECT n.id,u.name,n.expires FROM local_recording_notices n JOIN users u ON u.id=n.actor
  JOIN classes c ON c.id=n.class_id WHERE n.class_id=? AND n.ended_at IS NULL AND n.expires>? AND u.active=1
  AND c.status='live' AND (u.role='admin' OR c.teacher_id=u.id)`).all(classId,Date.now());
}

export function learningRoutes(app,{db,auth,admin,getClass,manage,audit}){
 app.get('/api/live/classes/:id/learning',auth,(req,res)=>{
  const c=getClass(req),staff=req.user.role==='admin'||c.teacher_id===req.user.id;
  const lesson=db.prepare('SELECT * FROM class_lessons WHERE class_id=?').get(c.id)||{version:0,topic:'',summary:'',homework:''};
  const rows=db.prepare(`SELECT u.id,u.name,r.blocked,p.attendance,p.stage,p.covered,p.homework_status,p.feedback,
   COALESCE(p.version,0) version,p.updated_at,editor.name recorded_by_name
   FROM roster r JOIN users u ON u.id=r.user_id LEFT JOIN student_lesson_reports p ON p.class_id=r.class_id AND p.user_id=r.user_id
   LEFT JOIN users editor ON editor.id=p.recorded_by WHERE r.class_id=? ${staff?'':'AND r.user_id=?' } ORDER BY u.name`)
   .all(...(staff?[c.id]:[c.id,req.user.id]));
  res.json({lesson,reports:rows,canEdit:staff,attendanceSource:'STAFF_RECORDED'});
 });
 app.post('/api/live/classes/:id/lesson',auth,(req,res)=>{
  const c=manage(req);fields(req.body,['version','topic','summary','homework']);const expected=version(req.body.version);
  const values=[text(req.body.topic,160),text(req.body.summary,4000),text(req.body.homework,3000)];
  const result=atomic(db,()=>{
   const old=db.prepare('SELECT version FROM class_lessons WHERE class_id=?').get(c.id);
   if((old?.version||0)!==expected)fail(409,'LEARNING_CHANGED');
   const at=new Date().toISOString();
   db.prepare(`INSERT INTO class_lessons(class_id,topic,summary,homework,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(class_id) DO UPDATE SET topic=excluded.topic,summary=excluded.summary,homework=excluded.homework,
    version=excluded.version,updated_by=excluded.updated_by,updated_at=excluded.updated_at`).run(c.id,...values,expected+1,req.user.id,at);
   audit(req.user.id,'LESSON_UPDATED',c.id,{version:expected+1});return {ok:true,version:expected+1};
  });res.json(result);
 });
 app.post('/api/live/classes/:id/reports/:studentId',auth,(req,res)=>{
  const c=manage(req);fields(req.body,['version','attendance','stage','covered','homeworkStatus','feedback']);
  const student=db.prepare("SELECT u.id FROM roster r JOIN users u ON u.id=r.user_id WHERE r.class_id=? AND r.user_id=? AND u.role='student'").get(c.id,req.params.studentId);
  if(!student)fail(403,'CLASS_ACCESS_DENIED');const expected=version(req.body.version);
  const {attendance,stage,homeworkStatus}=req.body;
  if(!['unmarked','present','absent','excused'].includes(attendance)||!['qaida','quran','hifz'].includes(stage)||!['not_started','practicing','completed'].includes(homeworkStatus))fail(400,'INVALID_INPUT');
  const covered=text(req.body.covered,1000),feedback=text(req.body.feedback,2000);
  const result=atomic(db,()=>{
   const old=db.prepare('SELECT version FROM student_lesson_reports WHERE class_id=? AND user_id=?').get(c.id,student.id);
   if((old?.version||0)!==expected)fail(409,'LEARNING_CHANGED');
   db.prepare(`INSERT INTO student_lesson_reports(class_id,user_id,attendance,stage,covered,homework_status,feedback,version,recorded_by,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(class_id,user_id) DO UPDATE SET attendance=excluded.attendance,stage=excluded.stage,
    covered=excluded.covered,homework_status=excluded.homework_status,feedback=excluded.feedback,version=excluded.version,
    recorded_by=excluded.recorded_by,updated_at=excluded.updated_at`).run(c.id,student.id,attendance,stage,covered,homeworkStatus,feedback,expected+1,req.user.id,new Date().toISOString());
   audit(req.user.id,'STUDENT_LEARNING_UPDATED',c.id,{student:student.id,version:expected+1,source:'STAFF_RECORDED'});return {ok:true,version:expected+1};
  });res.json(result);
 });
 app.post('/api/live/classes/:id/copy',auth,admin,(req,res)=>{
  const c=manage(req);fields(req.body,['scheduled']);
  if(typeof req.body.scheduled!=='string'||req.body.scheduled.length>40||!Number.isFinite(Date.parse(req.body.scheduled)))fail(400,'INVALID_CLASS');
  if(!db.prepare("SELECT 1 FROM users WHERE id=? AND active=1 AND role='teacher'").get(c.teacher_id))fail(400,'INVALID_CLASS');
  const result=atomic(db,()=>{
   const id=randomUUID();db.prepare('INSERT INTO classes(id,title,teacher_id,room,scheduled) VALUES(?,?,?,?,?)').run(id,c.title,c.teacher_id,'annoor-'+randomUUID(),new Date(req.body.scheduled).toISOString());
   db.prepare(`INSERT INTO roster(class_id,user_id) SELECT ?,r.user_id FROM roster r JOIN users u ON u.id=r.user_id WHERE r.class_id=? AND r.blocked=0 AND u.active=1 AND u.role='student'`).run(id,c.id);
   audit(req.user.id,'NEXT_CLASS_CREATED',id,{previous:c.id});return {id};
  });res.status(201).json(result);
 });
 app.post('/api/live/classes/:id/recording',auth,(req,res)=>{
  const c=manage(req);fields(req.body,['action','recordingId']);const {action,recordingId}=req.body;
  if(!['start','heartbeat','stop'].includes(action)||typeof recordingId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recordingId))fail(400,'INVALID_INPUT');
  const result=atomic(db,()=>{
   const old=db.prepare('SELECT * FROM local_recording_notices WHERE id=?').get(recordingId),now=Date.now();
   if(old&&(old.actor!==req.user.id||old.class_id!==c.id))fail(403,'CLASS_ACCESS_DENIED');
   if(action==='stop'){
    if(old&&!old.ended_at){db.prepare('UPDATE local_recording_notices SET ended_at=? WHERE id=?').run(new Date().toISOString(),recordingId);audit(req.user.id,'LOCAL_RECORDING_NOTICE_STOPPED',c.id,{recordingId});}
    return {ok:true};
   }
   if(c.status!=='live')fail(409,'CLASS_NOT_LIVE');
   if(action==='heartbeat'&&(!old||old.ended_at||old.expires<=now))fail(409,'RECORDING_NOTICE_EXPIRED');
   if(action==='start'&&old&&(old.ended_at||old.expires<=now))fail(409,'RECORDING_NOTICE_EXPIRED');
   const expires=now+45000;
   if(!old){
    db.prepare('UPDATE local_recording_notices SET ended_at=? WHERE class_id=? AND actor=? AND ended_at IS NULL').run(new Date().toISOString(),c.id,req.user.id);
    db.prepare('INSERT INTO local_recording_notices(id,class_id,actor,expires) VALUES(?,?,?,?)').run(recordingId,c.id,req.user.id,expires);
    audit(req.user.id,'LOCAL_RECORDING_NOTICE_STARTED',c.id,{recordingId,source:'BROWSER_REPORTED'});
   }else db.prepare('UPDATE local_recording_notices SET expires=? WHERE id=?').run(expires,recordingId);
   return {ok:true,expires};
  });res.json(result);
 });
}
