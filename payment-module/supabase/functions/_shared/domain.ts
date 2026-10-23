/** SMS patterns are literal templates, never arbitrary operator-supplied regexes. */
export type Provider = 'BKASH' | 'NAGAD' | 'ROCKET';
export type Credit = { provider: Provider; transaction_id: string; receiving_number: string; amount_minor: number; paid_at: string; sender_number: string | null; sender_reliable: boolean; pattern_id: string };
export type Pattern = { id: string; provider: Provider; template: string; timestamp_format: 'ISO_OFFSET' | 'DMY_24H_DHAKA'; sender_reliable: boolean; verified_sample: string; expected: Record<string, unknown>; verification_reference: string; verified_at: string; active: boolean };
export class SafeError extends Error { constructor(public code: string, public status = 400) { super(code); } }
export function exactKeys(value: unknown, required: string[], optional: string[] = []): asserts value is Record<string, unknown> {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SafeError('INVALID_INPUT');
 const keys=Object.keys(value);
 if(required.some(k=>!keys.includes(k)) || keys.some(k=>![...required,...optional].includes(k))) throw new SafeError('INVALID_INPUT');
}
export function text(value: unknown, min = 1, max = 200): string {
 if(typeof value !== 'string' || value.trim().length < min || value.length > max) throw new SafeError('INVALID_INPUT');
 return value.trim();
}
export function phone(value: unknown): string {
 let s=text(value,11,15).replace(/^\+?88/,'');
 if(!/^01[3-9]\d{8}$/.test(s)) throw new SafeError('INVALID_SENDER');
 return s;
}
export function trx(value: unknown): string {
 const s=text(value,5,40).toUpperCase();
 if(!/^[A-Z0-9]{5,40}$/.test(s)) throw new SafeError('INVALID_TRANSACTION');
 return s;
}
export function money(value: string): number {
 // No guessing about commas, locale, signs or decimal placement.
 if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(value)) throw new SafeError('INVALID_AMOUNT');
 const [whole,fraction='']=value.split('.'); const amount=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(amount)||amount<=0||amount>100000000) throw new SafeError('INVALID_AMOUNT');
 return amount;
}
export function sensitiveSMS(body: string): boolean {
 return /\b(?:otp|pin|password|passcode)\b|one[ -]?time|verification\s+code|security\s+code|পিন|পাসওয়ার্ড|পাসওয়ার্ড|ওটিপি|ওটিপি|যাচাইকরণ\s*কোড|গোপন\s*কোড/i.test(body);
}
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const tokenRx: Record<string,string> = {
 amount:'[0-9]{1,7}(?:\\.[0-9]{1,2})?', trx:'[A-Za-z0-9]{5,40}', sender:'(?:\\+?88)?01[3-9][0-9]{8}', account:'[0-9]{11,12}',
 received_at:'[0-9T:/+ .Z-]{16,35}'
};
function timestamp(raw: string, format: Pattern['timestamp_format']): string {
 let iso=raw;
 if(format==='DMY_24H_DHAKA'){
  const m=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(raw);
  if(!m)throw new SafeError('UNSUPPORTED_TIMESTAMP');
  iso=`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}+06:00`;
 }
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(iso))throw new SafeError('UNSUPPORTED_TIMESTAMP');
 const date=new Date(iso);
 if(!Number.isFinite(date.getTime())) throw new SafeError('INVALID_TIMESTAMP');
 // Date parsing can normalize invalid calendar dates: verify each supplied component.
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|([+-])(\d{2}):(\d{2}))$/.exec(iso)!;
 const offset=m[7]==='Z'?0:(m[8]==='+'?1:-1)*(Number(m[9])*60+Number(m[10]));
 if(Number(m[9]||0)>14||Number(m[10]||0)>59)throw new SafeError('INVALID_TIMESTAMP');
 const local=new Date(date.getTime()+offset*60000);
 const parts=[local.getUTCFullYear(),local.getUTCMonth()+1,local.getUTCDate(),local.getUTCHours(),local.getUTCMinutes(),local.getUTCSeconds()];
 if(parts.some((v,i)=>v!==Number(m[i+1])))throw new SafeError('INVALID_TIMESTAMP');
 return date.toISOString();
}
function parseTemplate(p: Pattern, body: string, account: string): Credit | null {
 if(p.template.length<20||p.template.length>1500||sensitiveSMS(p.template))throw new SafeError('INVALID_PATTERN');
 const names:string[]=[]; let pos=0,rx='^';
 for(const m of p.template.matchAll(/\{([a-z_]+)\}/g)){
  const name=m[1];if(!tokenRx[name]||names.includes(name))throw new SafeError('INVALID_PATTERN');
  rx+=escape(p.template.slice(pos,m.index))+`(?<${name}>${tokenRx[name]})`;names.push(name);pos=m.index!+m[0].length;
 }
 rx+=escape(p.template.slice(pos))+'$';
 if(!['amount','trx','received_at'].every(k=>names.includes(k))) throw new SafeError('INCOMPLETE_PATTERN');
 if(p.sender_reliable&&!names.includes('sender'))throw new SafeError('INCOMPLETE_PATTERN');
 const groups=new RegExp(rx,'u').exec(body)?.groups;if(!groups)return null;
 if(groups.account&&groups.account!==account)throw new SafeError('RECEIVING_ACCOUNT_MISMATCH');
 return {provider:p.provider,transaction_id:trx(groups.trx),receiving_number:account,amount_minor:money(groups.amount),paid_at:timestamp(groups.received_at,p.timestamp_format),sender_number:groups.sender?phone(groups.sender):null,sender_reliable:p.sender_reliable,pattern_id:p.id};
}
export interface ProviderAdapter {
 readonly provider: Provider;
 parseCredit(body: string, account: string, patterns: Pattern[]): Credit | null;
 // An official adapter must implement independently authenticated provider verification.
 readonly evidenceType: 'SMS_ASSISTED' | 'OFFICIAL_API';
}
export class SmsAdapter implements ProviderAdapter {
 readonly evidenceType='SMS_ASSISTED' as const;
 constructor(readonly provider: Provider) {}
 parseCredit(body: string, account: string, patterns: Pattern[]): Credit | null {
  if(body.length>2000||sensitiveSMS(body))throw new SafeError('SENSITIVE_OR_INVALID_MESSAGE');
  const matches:Credit[]=[];
  for(const p of patterns.filter(p=>p.active&&p.provider===this.provider)){
   if(!p.verification_reference||!p.verified_at||sensitiveSMS(p.verified_sample))throw new SafeError('UNVERIFIED_PATTERN');
   const sample=parseTemplate(p,p.verified_sample,account);
   if(!sample||!['transaction_id','amount_minor','paid_at','receiving_number','sender_number'].every(k=>Object.hasOwn(p.expected,k)&&p.expected[k]===sample[k as keyof Credit]))throw new SafeError('UNVERIFIED_PATTERN');
   const match=parseTemplate(p,body,account);if(match)matches.push(match);
  }
  if(matches.length>1)throw new SafeError('AMBIGUOUS_PATTERN');
  return matches[0]??null;
 }
}
export const adapters: Record<Provider,ProviderAdapter>={BKASH:new SmsAdapter('BKASH'),NAGAD:new SmsAdapter('NAGAD'),ROCKET:new SmsAdapter('ROCKET')};
export async function hash(value:string):Promise<string>{return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function verifySignature(secret:string, signed:string, signature:string):Promise<boolean>{
 if(!/^[a-f0-9]{64}$/.test(signature)||secret.length<32)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('HMAC',key,new Uint8Array(signature.match(/../g)!.map(x=>parseInt(x,16))),new TextEncoder().encode(signed));
}

/** Future official adapters have an explicit cryptographic/provider verification boundary.
 * No implementation is supplied and no SMS adapter can produce this evidence type.
 */
export interface OfficialProviderAdapter {
 readonly provider: Provider;
 readonly evidenceType: 'OFFICIAL_API';
 verifyCredit(rawBody:Uint8Array, headers:Headers):Promise<{
  credit:Omit<Credit,'pattern_id'>;
  providerVerificationReference:string;
  verifiedAt:string;
 }>;
}
