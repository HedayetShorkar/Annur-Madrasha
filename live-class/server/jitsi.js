import {createHmac,createPrivateKey,randomUUID,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';

const invalid=code=>{throw Error(code);};
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
function domain(value){
 let parsed;
 try{parsed=new URL(value.includes('://')?value:'https://'+value);}catch{invalid('INVALID_JITSI_DOMAIN');}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash)invalid('INVALID_JITSI_DOMAIN');
 return parsed.host;
}
export function jitsiProvider(env){
 const mode=env.JITSI_MODE||'self-hosted';
 if(!['self-hosted','jaas'].includes(mode))invalid('INVALID_JITSI_MODE');
 const host=env.JITSI_DOMAIN?domain(env.JITSI_DOMAIN):mode==='jaas'?'8x8.vc':null;
 if(mode==='self-hosted'&&['meet.jit.si','8x8.vc'].includes(host))invalid('JITSI_PRIVATE_DEPLOYMENT_REQUIRED');
 if(mode==='jaas'&&host!=='8x8.vc')invalid('INVALID_JAAS_DOMAIN');
 const appId=env.JITSI_APP_ID||'';
 if(appId&&!/^[a-zA-Z0-9_-]{1,160}$/.test(appId))invalid('INVALID_JITSI_APP_ID');
 let privateKey=null;
 if(mode==='jaas'&&(env.JITSI_PRIVATE_KEY_FILE||env.JITSI_PRIVATE_KEY)){
  try{
   privateKey=createPrivateKey(env.JITSI_PRIVATE_KEY_FILE?readFileSync(env.JITSI_PRIVATE_KEY_FILE):env.JITSI_PRIVATE_KEY.replace(/\\n/g,'\n'));
   if(privateKey.asymmetricKeyType!=='rsa'||privateKey.asymmetricKeyDetails.modulusLength<2048)invalid('INVALID_JITSI_PRIVATE_KEY');
  }catch{invalid('INVALID_JITSI_PRIVATE_KEY');}
 }
 const kid=env.JITSI_KEY_ID||'';
 if(mode==='jaas'&&appId&&!/^vpaas-magic-cookie-[a-zA-Z0-9]+$/.test(appId))invalid('INVALID_JAAS_APP_ID');
 if(kid&&(!kid.startsWith(appId+'/')||!/^vpaas-magic-cookie-[a-zA-Z0-9]+\/[a-zA-Z0-9_-]+$/.test(kid)))invalid('INVALID_JITSI_KEY_ID');
 const secret=env.JITSI_APP_SECRET||'';
 if(mode==='self-hosted'&&secret&&Buffer.byteLength(secret)<32)invalid('JITSI_SECRET_TOO_SHORT');
 const enabled=!!(host&&appId&&(mode==='jaas'?kid&&privateKey:secret));
 const need=()=>{if(!enabled)throw Object.assign(Error('VIDEO_NOT_CONFIGURED'),{status:503});};
 const name=(u,observeOnly)=> (u.role==='admin'?(observeOnly?'তদারকি (নীরব) • ':'তদারকি • '):u.role==='teacher'?'শিক্ষক • ':'')+u.name;
 return {
  id:'jitsi',label:mode==='jaas'?'Jitsi as a Service':'Jitsi Meet',enabled,
  capabilities:{roomStats:false,serverModeration:false,verifiedAttendance:false},
  async token(c,u,{observeOnly=false}={}){
   need();
   if(!/^[a-z0-9-]{1,180}$/.test(c.room))invalid('INVALID_JITSI_ROOM');
   if(observeOnly&&u.role!=='admin')throw Object.assign(Error('ADMIN_REQUIRED'),{status:403});
   const moderator=u.role==='admin'||u.role==='teacher'&&c.teacher_id===u.id;
   const now=Math.floor(Date.now()/1000);
   const claims={iss:mode==='jaas'?'chat':appId,aud:mode==='jaas'?'jitsi':env.JITSI_AUDIENCE||appId,sub:mode==='jaas'?appId:env.JITSI_SUBJECT||host,room:c.room,iat:now,nbf:now-5,exp:now+60,jti:randomUUID(),context:{user:{id:u.id,name:name(u,observeOnly),moderator:mode==='jaas'?String(moderator):moderator,...(mode==='self-hosted'?{affiliation:moderator?'owner':'member'}:{})},room:{regex:false},features:{recording:false,livestreaming:false,transcription:false,'outbound-call':false}}};
   const body=encode({alg:mode==='jaas'?'RS256':'HS256',typ:'JWT',...(mode==='jaas'?{kid}:{})})+'.'+encode(claims);
   const signature=mode==='jaas'?sign('RSA-SHA256',Buffer.from(body),privateKey).toString('base64url'):createHmac('sha256',secret).update(body).digest('base64url');
   return body+'.'+signature;
  },
  joinInfo(c,u,{observeOnly=false}={}){need();return {provider:'jitsi',domain:host,appId:mode==='jaas'?appId:null,roomName:mode==='jaas'?appId+'/'+c.room:c.room,displayName:name(u,observeOnly)};},
  // Standard Jitsi IFrame API has no trusted server room-management API.
  // Start/end here open/close website admission, not a verified media operation.
  async create(){need();},
  async end(){need();},
  async remove(){need();},
  async list(){throw Object.assign(Error('VIDEO_CAPABILITY_UNAVAILABLE'),{status:409});},
  async participants(){throw Object.assign(Error('VIDEO_CAPABILITY_UNAVAILABLE'),{status:409});},
  async mute(){throw Object.assign(Error('VIDEO_CAPABILITY_UNAVAILABLE'),{status:409});}
 };
}
