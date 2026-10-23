import { createClient } from '@supabase/supabase-js';
import { smsHandler } from '../_shared/sms-handler.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
// Per-device HMAC keys live on the trusted relay server and this server only, never in React or the website.
const secrets=JSON.parse(Deno.env.get('SMS_DEVICE_SECRETS')??'{}');
Deno.serve(smsHandler(async(name,args)=>{const {data,error}=await db.rpc(name,args);if(error)throw new Error('DB_FAILURE');return data;},secrets));
