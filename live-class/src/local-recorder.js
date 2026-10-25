// Local-only browser media. This module has no network, storage or upload API.
export function recordingFormat(env=globalThis){
 for(const mime of ['video/webm;codecs=vp8,opus','video/webm','video/mp4'])if(env.MediaRecorder?.isTypeSupported(mime))return {mime,extension:mime.startsWith('video/mp4')?'mp4':'webm'};
 return null;
}
export function recordingSupport(env=globalThis){return !!(env.isSecureContext&&env.navigator?.mediaDevices?.getDisplayMedia&&env.MediaRecorder&&env.MediaStream&&(env.AudioContext||env.webkitAudioContext)&&recordingFormat(env));}
const error=code=>Object.assign(Error(code),{code});

export function createLocalRecording({env=globalThis,fileHandle=null,includeMic=false,authorize=async()=>{},onState=()=>{},onComplete=()=>{}}={}){
 let recorder,display,mic,context,output,writer,started=false,settled=false,stopping=false,cancelled=false,contextClosed=false;
 const stoppedTracks=new WeakSet();
 let chain=Promise.resolve(),pending=0,bytes=0,chunks=[],failure=null,warning=null,timer,startedAt;
 const format=recordingFormat(env);let resolveDone;const completion=new Promise(resolve=>{resolveDone=resolve;});
 const state=value=>onState(value);
 const cleanup=()=>{
  clearTimeout(timer);
  for(const stream of [display,mic,output])for(const track of stream?.getTracks()||[]){if(stoppedTracks.has(track))continue;stoppedTracks.add(track);track.onended=null;track.stop();}
  if(context&&!contextClosed){contextClosed=true;context.close().catch(()=>{});}
 };
 async function finish(){
  if(settled)return;settled=true;cleanup();await chain;
  if(writer){try{if(failure||cancelled&&!started)await writer.abort();else await writer.close();}catch{failure='RECORDING_WRITE_FAILED';}}
  const result={saved:!!writer&&!failure&&bytes>0,blob:!writer&&!failure&&bytes>0?new env.Blob(chunks,{type:recorder?.mimeType||format?.mime}):null,
   bytes,mime:recorder?.mimeType||format?.mime,extension:format?.extension,error:failure,warning,duration:startedAt?Date.now()-startedAt:0,cancelled};
  chunks=[];state('finished');resolveDone(result);onComplete(result);
 }
 function stop(){
  if(settled||stopping)return completion;stopping=true;cancelled=!started;state(started?'saving':'cancelling');
  // During a browser permission prompt, cleanup resumes when that prompt resolves.
  if(!started){cleanup();return completion;}
  try{if(recorder.state!=='inactive')recorder.stop();else void finish();}catch{failure='RECORDING_FAILED';void finish();}
  cleanup();return completion;
 }
 function check(){if(stopping)throw error('RECORDING_CANCELLED');}
 async function start(){
  try{
   if(!recordingSupport(env))throw error('RECORDING_UNSUPPORTED');
   state('choosing');
   // Called directly by the Record button: getDisplayMedia requires user activation.
   display=await env.navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'browser',frameRate:{ideal:24,max:30},width:{ideal:1280},height:{ideal:720}},audio:true,preferCurrentTab:true,selfBrowserSurface:'include',surfaceSwitching:'exclude',systemAudio:'include'});
   check();
   if(!display.getVideoTracks().some(t=>t.readyState==='live')||!display.getAudioTracks().some(t=>t.readyState==='live'))throw error('RECORDING_TAB_AUDIO_REQUIRED');
   if(includeMic){
    try{mic=await env.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});}catch{throw error('RECORDING_MIC_REQUIRED');}
    check();if(!mic.getAudioTracks().some(t=>t.readyState==='live'))throw error('RECORDING_MIC_REQUIRED');
   }
   context=new (env.AudioContext||env.webkitAudioContext)();await context.resume();check();
   const destination=context.createMediaStreamDestination();
   // Mixed into the recording only; never routed back to speakers/conference.
   for(const stream of [display,mic].filter(Boolean))context.createMediaStreamSource(new env.MediaStream(stream.getAudioTracks())).connect(destination);
   output=new env.MediaStream([...display.getVideoTracks(),...destination.stream.getAudioTracks()]);
   if(fileHandle){writer=await fileHandle.createWritable({mode:'exclusive'});check();}
   recorder=new env.MediaRecorder(output,{mimeType:format.mime,videoBitsPerSecond:2000000,audioBitsPerSecond:128000});
   await authorize();check();
   if(!display.getVideoTracks().some(t=>t.readyState==='live')||!display.getAudioTracks().some(t=>t.readyState==='live')||includeMic&&!mic.getAudioTracks().some(t=>t.readyState==='live'))throw error('RECORDING_SOURCE_ENDED');
   recorder.ondataavailable=event=>{
    if(!event.data?.size||settled)return;
    bytes+=event.data.size;
    if(writer){
     pending+=event.data.size;
     chain=chain.then(async()=>{try{if(!failure)await writer.write(event.data);}catch{failure='RECORDING_WRITE_FAILED';stop();}finally{pending-=event.data.size;}});
     if(pending>32*1024*1024&&!stopping){warning='RECORDING_SLOW_DISK';stop();}
    }else{
     chunks.push(event.data);
     if(bytes>=256*1024*1024&&!stopping){warning='RECORDING_DOWNLOAD_LIMIT';stop();}
    }
   };
   recorder.onstop=()=>{void finish();};
   recorder.onerror=()=>{failure='RECORDING_FAILED';stop();};
   for(const stream of [display,mic].filter(Boolean))for(const track of stream.getTracks())track.onended=()=>stop();
   recorder.start(2000);started=true;startedAt=Date.now();state('recording');
   if(!writer)timer=setTimeout(()=>{warning='RECORDING_DOWNLOAD_LIMIT';stop();},20*60000);
  }catch(cause){
   if(cause?.code==='RECORDING_CANCELLED'||cause?.name==='NotAllowedError'||cause?.name==='AbortError')cancelled=true;
   else failure=cause?.code||'RECORDING_FAILED';
   await finish();
  }
 }
 return {start,stop,completion};
}
