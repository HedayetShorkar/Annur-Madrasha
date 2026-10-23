import { adapters, exactKeys, hash, SafeError, sensitiveSMS, text, verifySignature, type Pattern, type Provider } from './domain.ts';
import { failure, json, limitedBody } from './http.ts';
export type Rpc = (name:string,args:Record<string,unknown>)=>Promise<unknown>;
export function smsHandler(rpc:Rpc, secrets:Record<string,string>, now:()=>number=Date.now){
 return async (req:Request):Promise<Response>=>{
  try{
   if(req.method!=='POST')throw new SafeError('METHOD_NOT_ALLOWED',405);
   if(!req.headers.get('content-type')?.startsWith('application/json'))throw new SafeError('JSON_REQUIRED',415);
   const device=text(req.headers.get('x-device-id'),3,60),nonce=text(req.headers.get('x-request-nonce'),16,100),signedAt=text(req.headers.get('x-request-timestamp'),10,10);
   if(!/^[a-zA-Z0-9_-]+$/.test(device)||!/^[a-zA-Z0-9_-]+$/.test(nonce)||!/^\d{10}$/.test(signedAt))throw new SafeError('UNAUTHORIZED',401);
   if(Math.abs(now()/1000-Number(signedAt))>300)throw new SafeError('STALE_REQUEST',401);
   const raw=await limitedBody(req,8192),secret=secrets[device];
   if(!secret||!await verifySignature(secret,`${signedAt}\n${nonce}\n${device}\n${raw}`,req.headers.get('x-signature')??''))throw new SafeError('UNAUTHORIZED',401);
   if(!await rpc('payment_rate_limit',{p_subject:'sms:'+device,p_limit:60}))throw new SafeError('RATE_LIMITED',429);
   let payload:unknown;try{payload=JSON.parse(raw);}catch{throw new SafeError('INVALID_JSON');}exactKeys(payload,['event_id','sender_label','body']);
   const event=text(payload.event_id,8,100),sender=text(payload.sender_label,1,80),body=text(payload.body,1,2000);
   if(!/^[a-zA-Z0-9_-]+$/.test(event))throw new SafeError('INVALID_INPUT');
   // Reject secrets BEFORE any persistence (including hashes or event audit).
   if(sensitiveSMS(body))throw new SafeError('SENSITIVE_MESSAGE_REJECTED');
   const config=await rpc('payment_sms_config',{p_device:device}) as {device:{allowed_senders:string[]};account:{provider:Provider;account_number:string};patterns:Pattern[]}|null;
   if(!config)throw new SafeError('DEVICE_DISABLED',403);
   let outcome='UNSUPPORTED_FORMAT',credit=null;
   if(!config.device.allowed_senders.includes(sender))outcome='SENDER_LABEL_NOT_ALLOWED';
   else{
    try{credit=adapters[config.account.provider].parseCredit(body,config.account.account_number,config.patterns);if(credit)outcome='PARSED';}
    catch(e){if(!(e instanceof SafeError))throw e;outcome=e.code;}
   }
   // Body stays ephemeral; only signed-event hash and allowlisted parsed fields go to DB.
   const result=await rpc('payment_ingest_sms',{p_device:device,p_nonce:nonce,p_signed_at:new Date(Number(signedAt)*1000).toISOString(),p_event:event,p_hash:await hash(raw),p_outcome:outcome,p_credit:credit}) as {outcome:string};
   if(result.outcome==='REPLAY'||result.outcome==='EVENT_CONFLICT')return json(result,409);
   if(result.outcome==='STALE_REQUEST')return json(result,401);
   return json(result,200);
  }catch(e){return failure(e);}
 };
}
