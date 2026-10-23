import { type SupabaseClient } from '@supabase/supabase-js';
import { exactKeys, phone, SafeError, sensitiveSMS, text, trx } from './domain.ts';
import { failure, json, limitedBody } from './http.ts';
import { receiptPDF } from './receipt.ts';
export function paymentsHandler(db:SupabaseClient, allowedOrigins:string[]){
 return async(req:Request):Promise<Response>=>{
  const origin=req.headers.get('origin')??'';
  const cors:Record<string,string>=allowedOrigins.includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}:{};
  try{
   if(origin&&!allowedOrigins.includes(origin))throw new SafeError('ORIGIN_NOT_ALLOWED',403);
   if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
   if(req.method!=='POST')throw new SafeError('METHOD_NOT_ALLOWED',405);
   const jwt=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
   if(!jwt)throw new SafeError('UNAUTHORIZED',401);
   const {data:{user},error:authError}=await db.auth.getUser(jwt);
   if(authError||!user||!user.email_confirmed_at)throw new SafeError('UNAUTHORIZED',401);
   const actor=user.id;
   const rpc=async(name:string,args:Record<string,unknown>)=>{
    const {data,error}=await db.rpc(name,args);
    if(error){
     const known=['CHARGE_UNAVAILABLE','ACCOUNT_UNAVAILABLE','NOT_FOUND','INVALID_INPUT','INVOICE_CLOSED','ACTIVE_SUBMISSION_EXISTS','TRANSACTION_UNAVAILABLE','FORBIDDEN','SELF_APPROVAL_FORBIDDEN','ALREADY_REVIEWED','INDEPENDENT_VERIFICATION_REQUIRED','INVALID_DUE_DATE'];
     throw new SafeError(known.includes(error.message)?error.message:'REQUEST_CONFLICT',error.message==='FORBIDDEN'?403:409);
    }return Array.isArray(data)?data[0]:data;
   };
   if(!await rpc('payment_rate_limit',{p_subject:'payer:'+actor,p_limit:30}))throw new SafeError('RATE_LIMITED',429);
   const raw=await limitedBody(req);let body:unknown;try{body=JSON.parse(raw);}catch{throw new SafeError('INVALID_JSON');}
   if(!body||typeof body!=='object'||Array.isArray(body))throw new SafeError('INVALID_INPUT');
   const b=body as Record<string,unknown>;const action=text(b.action,1,30);
   const check=async<T>(query:PromiseLike<{data:T,error:unknown}>):Promise<T>=>{const r=await query;if(r.error)throw new SafeError('REQUEST_FAILED',500);return r.data;};
   const requireAdmin=async()=>{const a=await check(db.from('payment_admins').select('user_id').eq('user_id',actor).maybeSingle());if(!a)throw new SafeError('FORBIDDEN',403);};
   if(action==='overview'){
    exactKeys(b,['action']);
    const [accounts,charges,invoices,submissions,receipts,admin]=await Promise.all([
     check(db.from('receiving_accounts').select('*').eq('active',true).order('provider')),
     check(db.from('billing_charges').select('*').eq('payer_id',actor).eq('active',true).order('created_at',{ascending:false}).limit(100)),
     check(db.from('payment_invoices').select('*').eq('payer_id',actor).order('issued_at',{ascending:false}).limit(100)),
     check(db.from('payment_submissions').select('*').eq('payer_id',actor).order('created_at',{ascending:false}).limit(100)),
     check(db.from('payment_receipts').select('*').eq('payer_id',actor).order('issued_at',{ascending:false}).limit(100)),
     check(db.from('payment_admins').select('user_id').eq('user_id',actor).maybeSingle())
    ]);return json({accounts,charges,invoices,submissions,receipts,is_admin:!!admin},200,cors);
   }
   if(action==='invoice'){
    exactKeys(b,['action','charge_id','account_id']);
    return json(await rpc('payment_create_invoice',{p_actor:actor,p_charge:text(b.charge_id,36,36),p_account:text(b.account_id,36,36)}),200,cors);
   }
   if(action==='submit'){
    exactKeys(b,['action','invoice_number','sender_number','transaction_id']);
    return json(await rpc('payment_submit',{p_actor:actor,p_invoice:text(b.invoice_number,10,40),p_sender:phone(b.sender_number),p_transaction:trx(b.transaction_id)}),200,cors);
   }
   if(action==='admin-list'){
    exactKeys(b,['action'],['offset']);await requireAdmin();const offset=Number(b.offset??0);
    if(!Number.isInteger(offset)||offset<0||offset>100000)throw new SafeError('INVALID_INPUT');
    const items=await check(db.from('payment_submissions').select('*, payment_invoices(*)').order('created_at',{ascending:false}).range(offset,offset+24));
    return json({items},200,cors);
   }
   if(action==='admin-evidence'){
    exactKeys(b,['action','submission_id']);await requireAdmin();
    const s=await check(db.from('payment_submissions').select('*,payment_invoices(*)').eq('id',text(b.submission_id,36,36)).single());
    if(!s)throw new SafeError('NOT_FOUND',404);
    const [incoming,reviews,audit]=await Promise.all([
     check(db.from('incoming_transactions').select('*').eq('provider',s.provider).eq('transaction_id',s.transaction_id)),
     check(db.from('payment_reviews').select('*').eq('submission_id',s.id).order('created_at')),
     check(db.from('payment_audit_logs').select('*').in('entity_id',[s.id,s.invoice_id]).order('created_at').limit(100))
    ]);return json({submission:s,incoming,reviews,audit},200,cors);
   }
   if(action==='admin-decide'){
    exactKeys(b,['action','submission_id','decision','reason','settlement_reference','independently_checked']);await requireAdmin();
    if(typeof b.independently_checked!=='boolean'||!['APPROVE','REJECT'].includes(String(b.decision)))throw new SafeError('INVALID_INPUT');
    const reason=text(b.reason,10,500),reference=typeof b.settlement_reference==='string'?b.settlement_reference.trim():'';
    // Do not collect PIN/OTP in free-form admin notes either.
    if(sensitiveSMS(reason+' '+reference))throw new SafeError('SENSITIVE_DATA_NOT_ALLOWED');
    return json(await rpc('payment_admin_decide',{p_actor:actor,p_submission:text(b.submission_id,36,36),p_decision:b.decision,p_reason:reason,p_reference:reference,p_checked:b.independently_checked}),200,cors);
   }
   if(action==='admin-charge'){
    exactKeys(b,['action','payer_id','description','billing_reference','amount_minor','due_at']);await requireAdmin();
    if(!Number.isSafeInteger(b.amount_minor)||Number(b.amount_minor)<100||Number(b.amount_minor)>100000000)throw new SafeError('INVALID_AMOUNT');
    if(sensitiveSMS(String(b.description)+' '+String(b.billing_reference)))throw new SafeError('SENSITIVE_DATA_NOT_ALLOWED');
    return json(await rpc('payment_create_charge',{p_actor:actor,p_payer:text(b.payer_id,36,36),p_description:text(b.description,1,160),p_reference:text(b.billing_reference,1,80),p_amount_minor:b.amount_minor,p_due_at:text(b.due_at,20,35)}),200,cors);
   }
   if(action==='receipt'){
    exactKeys(b,['action','receipt_id']);
    const receipt=await check(db.from('payment_receipts').select('*').eq('id',text(b.receipt_id,36,36)).maybeSingle());
    if(!receipt)throw new SafeError('NOT_FOUND',404);
    if(receipt.payer_id!==actor)await requireAdmin();
    const invoice=await check(db.from('payment_invoices').select('*').eq('id',receipt.invoice_id).single());
    const submission=await check(db.from('payment_submissions').select('*').eq('id',receipt.submission_id).single());
    if(!invoice||!submission)throw new SafeError('NOT_FOUND',404);
    const bytes=await receiptPDF({receipt_number:receipt.receipt_number,invoice_number:invoice.invoice_number,amount_minor:invoice.amount_minor,description:invoice.description,provider:submission.provider,transaction_id:submission.transaction_id,confirmed_at:invoice.confirmed_at,status:submission.status});
    return new Response(bytes as BodyInit,{headers:{...cors,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${receipt.receipt_number}.pdf"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
   }
   throw new SafeError('INVALID_ACTION');
  }catch(e){return failure(e,cors);}
 };
}
