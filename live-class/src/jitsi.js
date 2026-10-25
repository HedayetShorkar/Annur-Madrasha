// Only a configured, authenticated join response may reach this module.
// Nothing is loaded from the video provider on the public/login page.
const documents=new WeakMap();
function settings(info){
 let target;
 try{target=new URL('https://'+info.domain);}catch{throw Error('JITSI_INVALID_JOIN');}
 if(target.protocol!=='https:'||target.username||target.password||target.pathname!=='/'||target.search||target.hash||target.host!==info.domain)throw Error('JITSI_INVALID_JOIN');
 const appId=info.appId;
 if(appId&&(!/^vpaas-magic-cookie-[a-zA-Z0-9]+$/.test(appId)||target.hostname!=='8x8.vc'))throw Error('JITSI_INVALID_JOIN');
 if(!info.token||!/^([a-zA-Z0-9_-]+\.){2}[a-zA-Z0-9_-]+$/.test(info.token))throw Error('JITSI_INVALID_JOIN');
 const room=appId?info.roomName?.slice(appId.length+1):info.roomName;
 if(!/^[a-z0-9-]{1,180}$/.test(room)||appId&&info.roomName!==appId+'/'+room)throw Error('JITSI_INVALID_JOIN');
 return {domain:target.host,src:target.origin+(appId?'/'+appId:'')+'/external_api.js'};
}
function loadSdk(src,doc){
 if(!documents.has(doc))documents.set(doc,new Map());
 const scripts=documents.get(doc);
 if(scripts.has(src))return scripts.get(src);
 const task=new Promise((resolve,reject)=>{
  const script=doc.createElement('script');let settled=false;
  const done=(error)=>{
   if(settled)return;settled=true;clearTimeout(timer);script.onload=script.onerror=null;
   if(error){script.remove();reject(Error('JITSI_LOAD_FAILED'));}
   else resolve(doc.defaultView.JitsiMeetExternalAPI);
  };
  const timer=setTimeout(()=>done(true),15000);
  script.src=src;script.async=true;script.referrerPolicy='no-referrer';
  script.onload=()=>done(typeof doc.defaultView.JitsiMeetExternalAPI!=='function');
  script.onerror=()=>done(true);doc.head.appendChild(script);
 });
 scripts.set(src,task);task.catch(()=>{if(scripts.get(src)===task)scripts.delete(src);});
 return task;
}
export async function mountJitsi(info,{parentNode,observeOnly=false,isCancelled=()=>false,onJoined=()=>{},onDisconnected=()=>{},onError=()=>{}}){
 const {domain,src}=settings(info),Api=await loadSdk(src,parentNode.ownerDocument);
 if(isCancelled())return {dispose(){}};
 const api=new Api(domain,{
  roomName:info.roomName,jwt:info.token,parentNode,width:'100%',height:'100%',
  userInfo:{displayName:info.displayName},lang:'bn',
  configOverwrite:{startWithAudioMuted:true,startWithVideoMuted:true,startSilent:observeOnly,disableDeepLinking:true,disableInviteFunctions:true,prejoinConfig:{enabled:!observeOnly},toolbarButtons:observeOnly?[]:['microphone','camera','desktop','chat','raisehand','tileview','participants-pane','settings','hangup']}
 });
 let disposed=false,left=false;
 const listeners={
  videoConferenceJoined:()=>{if(disposed)return;api.executeCommand('localSubject',info.title);if(observeOnly)api.executeCommand('setTileView',true);onJoined();},
  videoConferenceLeft:()=>{if(!disposed&&!left){left=true;onDisconnected();}},
  readyToClose:()=>{if(!disposed&&!left){left=true;onDisconnected();}},
  errorOccurred:()=>{if(!disposed)onError();},
  cameraError:()=>{if(!disposed)onError();},micError:()=>{if(!disposed)onError();}
 };
 try{
  for(const [event,handler]of Object.entries(listeners))api.addListener(event,handler);
  const frame=api.getIFrame();if(frame){frame.title=observeOnly?'Jitsi · দৃশ্যমান নীরব তদারকি':'Jitsi · অনলাইন ক্লাস';frame.referrerPolicy='no-referrer';}
 }catch{api.dispose();throw Error('JITSI_LOAD_FAILED');}
 return {dispose(){if(disposed)return;disposed=true;for(const [event,handler]of Object.entries(listeners))api.removeListener(event,handler);api.dispose();}};
}
