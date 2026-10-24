const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
async function rpc(name:string,args:unknown){const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args)});const d=await r.json();if(!r.ok)throw Error(d.message||'UNAVAILABLE');return d;}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
  const route=new URL(req.url).pathname.split('/').pop();
  if(req.method==='GET'&&route==='health')return reply({service:'annoor-admissions',version:1});
  if(req.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON_REQUIRED'},415);
  const reader=req.body?.getReader();if(!reader)return reply({error:'INVALID_DATA'},400);
  const parts:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();return reply({error:'TOO_LARGE'},413);}parts.push(value);}
  const bytes=new Uint8Array(size);let pos=0;for(const p of parts){bytes.set(p,pos);pos+=p.length;}
  let b;try{b=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply({error:'INVALID_JSON'},400);}
  if(!b||typeof b!=='object'||Array.isArray(b))return reply({error:'INVALID_DATA'},400);
  if(route==='submit'){
   const fields=['request_id','student_name','gender','age','address','level','hifz','guardian_name','relationship','phone','email','plan','start_date','availability','notes','consent','language'];
   if(Object.keys(b).some(k=>!fields.includes(k)))return reply({error:'INVALID_DATA'},400);
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.request_id))return reply({error:'INVALID_DATA'},400);
   for(const [field,min,max] of [['student_name',1,120],['address',1,500],['guardian_name',1,120],['phone',7,25],['hifz',0,500],['notes',0,1000],['email',0,254]] as const){if(typeof b[field]!=='string'||b[field].trim().length<min||b[field].length>max)return reply({error:'INVALID_DATA'},400);b[field]=b[field].trim();}
   b.phone=b.phone.replace(/[\s-]/g,'');
   if(!/^\+?[0-9]{7,15}$/.test(b.phone)||!['boy','girl'].includes(b.gender)||!Number.isInteger(b.age)||b.age<5||b.age>18||!['father','mother','brother','sister','grandparent','other'].includes(b.relationship)||!['New (not started yet)','Noorani Qaida','Can read the Quran','Reads with Tajweed','Hifz'].includes(b.level)||b.level==='Hifz'&&!b.hifz||b.consent!==true||!['bn','en'].includes(b.language)||!/^\d{4}-\d{2}-\d{2}$/.test(b.start_date)||b.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))return reply({error:'INVALID_DATA'},400);
   const a=b.availability;if(!a||!['flexible','specific'].includes(a.mode)||Object.keys(a).some(k=>!['mode','start','end','timeZone'].includes(k)))return reply({error:'INVALID_DATA'},400);
   if(a.mode==='specific'){if(typeof a.timeZone!=='string'||a.timeZone.length>100)return reply({error:'INVALID_DATA'},400);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.end)||a.start>=a.end)return reply({error:'INVALID_DATA'},400);try{new Intl.DateTimeFormat('en',{timeZone:a.timeZone}).format();}catch{return reply({error:'INVALID_DATA'},400);}}
   const ip=req.headers.get('x-forwarded-for')?.split(',').pop()?.trim()||'unknown';
   const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
   const hash=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
   return reply(await rpc('annoor_submit_admission',{p_data:b,p_ip:hash}));
  }
  if(!['list','decide','audit'].includes(route||''))return reply({error:'NOT_FOUND'},404);
  const token=req.headers.get('authorization')||'';
  if(!token.startsWith('Bearer '))return reply({error:'UNAUTHORIZED'},401);
  const auth=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:token}});
  if(!auth.ok)return reply({error:'UNAUTHORIZED'},401);
  const user=await auth.json();if(!user.email_confirmed_at||user.is_anonymous)return reply({error:'FORBIDDEN'},403);
  const data=await rpc('annoor_admin_admissions',{p_actor:user.id,p_action:route,p_data:b});return reply(data);
 }catch(e){const m=e instanceof Error?e.message:'';const code=['FORBIDDEN','INVALID_DATA','RATE_LIMITED','CONFLICT','INVALID_DATE'].find(c=>m.includes(c));return reply({error:code||'UNAVAILABLE'},code==='FORBIDDEN'?403:code==='RATE_LIMITED'?429:code==='CONFLICT'?409:code?400:503);}
});
