import {randomUUID,createHash} from 'node:crypto';
import {normalizeReceipt,dhakaToday} from '../../shared/receipt-core.mjs';
const fail=(status,code)=>{throw Object.assign(Error(code),{status});};
export function migrateReceipts(db){
 db.exec(`CREATE TABLE IF NOT EXISTS manual_receipt_sequences(year INTEGER PRIMARY KEY,last_value INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS manual_receipts(
 id TEXT PRIMARY KEY,receipt_number TEXT NOT NULL UNIQUE,request_key TEXT NOT NULL UNIQUE,request_hash TEXT NOT NULL,
 actor_id TEXT NOT NULL REFERENCES users(id),issuer_name TEXT NOT NULL,payload TEXT NOT NULL,issued_at TEXT NOT NULL,
 method TEXT NOT NULL,transaction_id TEXT,status TEXT NOT NULL DEFAULT 'ISSUED' CHECK(status IN ('ISSUED','VOID')),
 void_reason TEXT,void_at TEXT,void_actor TEXT REFERENCES users(id));
 CREATE UNIQUE INDEX IF NOT EXISTS manual_receipt_transaction ON manual_receipts(method,transaction_id) WHERE transaction_id IS NOT NULL;
 CREATE INDEX IF NOT EXISTS manual_receipt_date ON manual_receipts(issued_at DESC);
 CREATE INDEX IF NOT EXISTS manual_receipt_owner ON manual_receipts(json_extract(payload,'$.studentId'),status,issued_at DESC);
 INSERT OR IGNORE INTO schema_versions(version) VALUES(3);`);
}
const output=row=>({id:row.id,receiptNumber:row.receipt_number,issuedAt:row.issued_at,issuerName:row.issuer_name,status:row.status,source:'ADMIN_MANUAL',paymentStatus:'CONFIRMED_PAID',...JSON.parse(row.payload),voidReason:row.void_reason,voidAt:row.void_at});
// Explicit student-copy projection: never return office evidence or custom-fee reasons.
const copyFields=['id','receiptNumber','issuedAt','issuerName','status','source','paymentStatus','studentName','studentCode','guardianName','phone','feeType','packageId','billingMonth','enrollmentDate','amountMode','description','method','transactionId','paidDate','note','baseMinor','discountMinor','netMinor','receivedMinor','balanceMinor','daysBilled','daysInMonth'];
const studentCopy=row=>{const record=output(row);return Object.fromEntries(copyFields.map(key=>[key,record[key]]));};
export function receiptRoutes(app,{db,auth,admin,audit}){
 const get=id=>{const row=db.prepare('SELECT * FROM manual_receipts WHERE id=?').get(id);if(!row)fail(404,'RECEIPT_NOT_FOUND');return row;};
 const student=(req,res,next)=>{if(req.user.role!=='student')return res.status(403).json({error:'STUDENT_REQUIRED'});next();};
 const own=(req)=>{
  // Ownership comes only from the immutable account ID linked by an administrator.
  // Names, typed student codes and URL/query parameters never grant access.
  const row=db.prepare("SELECT * FROM manual_receipts WHERE id=? AND status='ISSUED' AND json_extract(payload,'$.studentId')=?").get(req.params.id,req.user.id);
  if(!row)fail(404,'RECEIPT_NOT_FOUND');return row;
 };
 app.get('/api/live/my-receipts',auth,student,(req,res)=>{
  const offset=Math.max(0,Math.min(100000,Number(req.query.offset)||0))|0;
  const where="status='ISSUED' AND json_extract(payload,'$.studentId')=?";
  const total=db.prepare('SELECT COUNT(*) n FROM manual_receipts WHERE '+where).get(req.user.id).n;
  const items=db.prepare('SELECT * FROM manual_receipts WHERE '+where+' ORDER BY issued_at DESC,id DESC LIMIT 20 OFFSET ?').all(req.user.id,offset).map(row=>{
   const r=output(row);return {id:r.id,receiptNumber:r.receiptNumber,billingMonth:r.billingMonth,paidDate:r.paidDate,receivedMinor:r.receivedMinor};
  });res.json({items,total,offset});
 });
 app.get('/api/live/my-receipts/:id',auth,student,(req,res)=>res.json(studentCopy(own(req))));
 app.post('/api/live/my-receipts/:id/print',auth,student,(req,res)=>{
  const row=own(req),format=req.body?.format??'PRINT';if(!['PRINT','PDF'].includes(format))fail(400,'INVALID_RECEIPT');
  audit(req.user.id,'MANUAL_RECEIPT_COPY_REQUESTED',null,{receiptId:row.id,format});res.json(studentCopy(row));
 });
 app.get('/api/live/receipts',auth,admin,(req,res)=>{
  const q=String(req.query.q||'').trim().slice(0,100),offset=Math.max(0,Math.min(100000,Number(req.query.offset)||0))|0;
  const pattern='%'+q.replace(/[\\%_]/g,'\\$&')+'%';
  const where="receipt_number LIKE ? ESCAPE '\\' OR json_extract(payload,'$.studentName') LIKE ? ESCAPE '\\' OR json_extract(payload,'$.studentCode') LIKE ? ESCAPE '\\'";
  const count=db.prepare('SELECT COUNT(*) n FROM manual_receipts WHERE '+where).get(pattern,pattern,pattern).n;
  const rows=db.prepare('SELECT * FROM manual_receipts WHERE '+where+' ORDER BY issued_at DESC,id DESC LIMIT 20 OFFSET ?').all(pattern,pattern,pattern,offset);
  res.json({items:rows.map(output),total:count,offset});
 });
 app.get('/api/live/receipts/:id',auth,admin,(req,res)=>res.json(output(get(req.params.id))));
 app.post('/api/live/receipts',auth,admin,(req,res)=>{
  const key=req.body.idempotencyKey;if(typeof key!=='string'||!/^[a-f0-9-]{36}$/i.test(key))fail(400,'INVALID_RECEIPT');
  const raw={...req.body};delete raw.idempotencyKey;
  // Hash normalized JSON key order, independent of object property order in retries.
  const requestHash=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.keys(raw).sort().map(k=>[k,raw[k]])))).digest('hex');
  db.exec('BEGIN IMMEDIATE');
  try{
   const prior=db.prepare('SELECT * FROM manual_receipts WHERE request_key=?').get(key);
   if(prior){if(prior.request_hash!==requestHash)fail(409,'RECEIPT_REQUEST_CHANGED');db.exec('COMMIT');return res.json(output(prior));}
   const data=normalizeReceipt(raw);
   if(data.studentId){
    const student=db.prepare("SELECT name,login_id FROM users WHERE id=? AND role='student'").get(data.studentId);
    if(!student)fail(400,'INVALID_STUDENT');data.studentName=student.name;data.studentCode=student.login_id;
   }
   const transaction=data.method==='CASH'?null:data.transactionId;
   if(transaction&&db.prepare('SELECT 1 FROM manual_receipts WHERE method=? AND transaction_id=?').get(data.method,transaction))fail(409,'TRANSACTION_ALREADY_RECEIPTED');
   const now=new Date().toISOString(),year=Number(dhakaToday().slice(0,4)),id=randomUUID();
   db.prepare('INSERT INTO manual_receipt_sequences(year,last_value) VALUES(?,1) ON CONFLICT(year) DO UPDATE SET last_value=last_value+1').run(year);
   const seq=db.prepare('SELECT last_value FROM manual_receipt_sequences WHERE year=?').get(year).last_value;
   const number='AN-R-'+year+'-'+String(seq).padStart(6,'0');
   db.prepare('INSERT INTO manual_receipts(id,receipt_number,request_key,request_hash,actor_id,issuer_name,payload,issued_at,method,transaction_id) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,number,key,requestHash,req.user.id,req.user.name,JSON.stringify(data),now,data.method,transaction);
   audit(req.user.id,'MANUAL_RECEIPT_ISSUED',null,{receiptId:id,receiptNumber:number,receivedMinor:data.receivedMinor,source:'ADMIN_MANUAL'});
   const record=output(get(id));db.exec('COMMIT');res.status(201).json(record);
  }catch(error){db.exec('ROLLBACK');throw error;}
 });
 // No update/delete endpoint: issued financial evidence is immutable.
 app.post('/api/live/receipts/:id/void',auth,admin,(req,res)=>{
  const reason=req.body.reason;if(typeof reason!=='string'||reason.trim().length<6||reason.length>240||/[\u0000-\u001f]/.test(reason))fail(400,'VOID_REASON_REQUIRED');
  db.exec('BEGIN IMMEDIATE');try{
   const row=get(req.params.id);
   if(row.status!=='VOID'){
    db.prepare("UPDATE manual_receipts SET status='VOID',void_reason=?,void_at=?,void_actor=? WHERE id=?").run(reason.trim(),new Date().toISOString(),req.user.id,row.id);
    audit(req.user.id,'MANUAL_RECEIPT_VOIDED',null,{receiptId:row.id,reason:reason.trim()});
   }
   const record=output(get(row.id));db.exec('COMMIT');res.json(record);
  }catch(error){db.exec('ROLLBACK');throw error;}
 });
 app.post('/api/live/receipts/:id/print',auth,admin,(req,res)=>{
  const row=get(req.params.id);if(row.status!=='ISSUED')fail(409,'RECEIPT_VOID');
  const format=req.body?.format??'PRINT';if(!['PRINT','PDF'].includes(format))fail(400,'INVALID_RECEIPT');
  audit(req.user.id,'MANUAL_RECEIPT_PRINT_REQUESTED',null,{receiptId:row.id,format});res.json(output(row));
 });
}
