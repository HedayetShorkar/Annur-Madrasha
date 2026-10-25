import {AccessToken,RoomServiceClient} from 'livekit-server-sdk';
import {jitsiProvider} from './jitsi.js';
export function provider(env){
 const selected=env.VIDEO_PROVIDER||(env.JITSI_DOMAIN||env.JITSI_APP_ID?'jitsi':env.LIVEKIT_URL||env.LIVEKIT_API_KEY?'livekit':'jitsi');
 if(selected==='jitsi')return jitsiProvider(env);
 if(selected!=='livekit')throw Error('INVALID_VIDEO_PROVIDER');
 return livekitProvider(env);
}
function livekitProvider(env){const enabled=!!(env.LIVEKIT_URL&&env.LIVEKIT_API_KEY&&env.LIVEKIT_API_SECRET);const rooms=enabled?new RoomServiceClient(env.LIVEKIT_URL.replace(/^ws/,'http'),env.LIVEKIT_API_KEY,env.LIVEKIT_API_SECRET):null;
const need=()=>{if(!enabled)throw Object.assign(Error('VIDEO_NOT_CONFIGURED'),{status:503});};
return {id:'livekit',label:'LiveKit',capabilities:{roomStats:true,serverModeration:true,verifiedAttendance:true},enabled,url:env.LIVEKIT_URL,
 async token(c,u,{observeOnly=false}={}){need();const token=new AccessToken(env.LIVEKIT_API_KEY,env.LIVEKIT_API_SECRET,{identity:u.id,name:(u.role==='admin'?'তদারকি • ':u.role==='teacher'?'শিক্ষক • ':'')+u.name,ttl:60,metadata:JSON.stringify({role:u.role})});token.addGrant({roomJoin:true,room:c.room,canPublish:!observeOnly,canSubscribe:true,canPublishData:true});return token.toJwt();},
 async list(){need();return rooms.listRooms();},async participants(room){need();return rooms.listParticipants(room);},
 async create(room){need();return rooms.createRoom({name:room,maxParticipants:100,emptyTimeout:300});},
 async end(room){need();try{await rooms.deleteRoom(room);}catch(e){if(e.code!=='not_found')throw e;}},async remove(room,id){need();try{await rooms.removeParticipant(room,id);}catch(e){if(e.code!=='not_found')throw e;}},
 async mute(room,p){need();for(const t of p.tracks||[])if(t.type===0)await rooms.mutePublishedTrack(room,p.identity,t.sid,true);}
};}
