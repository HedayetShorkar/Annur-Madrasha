/** TRUSTED SERVER example; stdin JSON only. Never run in browser or attach a key to a mobile client. */
import {createHmac,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {adapters} from '../supabase/functions/_shared/domain.ts';
let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>8192)throw Error('Too large');}
const event=JSON.parse(raw);
if(!event||Object.keys(event).some(k=>!['event_id','sender_label','body'].includes(k))||typeof event.body!=='string')throw Error('Invalid credit event');
// The phone/source collector must drop PIN/OTP messages BEFORE forwarding anything to this server.
if(/\b(?:otp|pin|password|passcode)\b|one[ -]?time|verification\s+code|পিন|ওটিপি|পাসওয়ার্ড|পাসওয়ার্ড/i.test(event.body))throw Error('Sensitive message rejected');
const {SMS_WEBHOOK_URL,SMS_DEVICE_ID,SMS_DEVICE_SECRET,SMS_PATTERN_CONFIG_PATH}=process.env;
if(!SMS_PATTERN_CONFIG_PATH)throw Error('Private verified credit-pattern configuration required');
const config=JSON.parse(readFileSync(SMS_PATTERN_CONFIG_PATH,'utf8'));
if(!config.allowed_senders?.includes(event.sender_label)||!adapters[config.provider]?.parseCredit(event.body,config.account_number,config.patterns))throw Error('Not a verified-format credit notification; not forwarded');
if(!SMS_WEBHOOK_URL?.startsWith('https://')||!SMS_DEVICE_ID||!SMS_DEVICE_SECRET||SMS_DEVICE_SECRET.length<32)throw Error('Server configuration missing');
const timestamp=String(Math.floor(Date.now()/1000)),nonce=randomUUID(),body=JSON.stringify(event);
const signature=createHmac('sha256',SMS_DEVICE_SECRET).update(`${timestamp}\n${nonce}\n${SMS_DEVICE_ID}\n${body}`).digest('hex');
const r=await fetch(SMS_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json','x-device-id':SMS_DEVICE_ID,'x-request-nonce':nonce,'x-request-timestamp':timestamp,'x-signature':signature},body});
const result=await r.json();console.log(JSON.stringify({status:r.status,outcome:result.outcome??result.error}));
if(!r.ok)process.exitCode=1;
