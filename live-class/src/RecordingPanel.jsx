import React,{forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {createLocalRecording,recordingFormat,recordingSupport} from './local-recorder.js';
const messages={RECORDING_UNSUPPORTED:'এই ব্রাউজারে রেকর্ডিং সমর্থিত নয়। কম্পিউটারে আপডেট করা Chrome বা Edge এবং HTTPS ঠিকানা ব্যবহার করুন।',RECORDING_TAB_AUDIO_REQUIRED:'ক্লাসের ট্যাব নির্বাচন করে Share tab audio চালু করতে হবে। শব্দ ছাড়া রেকর্ডিং শুরু হয়নি।',RECORDING_MIC_REQUIRED:'নিজের কণ্ঠ রাখার জন্য মাইক্রোফোনের অনুমতি প্রয়োজন। চাইলে ওই অপশন বন্ধ করে আবার শুরু করা যাবে।',RECORDING_WRITE_FAILED:'ফাইল লেখা সম্পূর্ণ হয়নি। ডিস্কের জায়গা ও অনুমতি পরীক্ষা করুন; এই ফাইলকে সম্পূর্ণ রেকর্ড ধরে নেওয়া যাবে না।',RECORDING_FAILED:'রেকর্ডিং সম্পূর্ণ হয়নি। ব্রাউজার ও ডিভাইসের অনুমতি যাচাই করুন।',RECORDING_DOWNLOAD_LIMIT:'ডাউনলোড মোডের ২০ মিনিট বা প্রায় ২৫৬ MB সীমায় রেকর্ডিং বন্ধ হয়েছে। ফাইল নামিয়ে পরের অংশ শুরু করা যাবে।',RECORDING_SLOW_DISK:'ডিস্কে লেখার গতি কম হওয়ায় রেকর্ডিং থামানো হয়েছে। সংরক্ষিত অংশ যাচাই করুন।',RECORDING_NOTICE_FAILED:'রেকর্ডিংয়ের নোটিশ সার্ভারে নিশ্চিত করা যায়নি। রেকর্ডিং বন্ধ করা হয়েছে।'};
const activeStates=['choosing','recording','saving','cancelling'];
messages.RECORDING_SOURCE_ENDED='নির্বাচিত ট্যাব বা মাইক্রোফোনের সংযোগ বন্ধ হয়েছে। আবার নির্বাচন করে রেকর্ড শুরু করা যাবে।';
const filename=extension=>'AnNoor-Class-'+new Date().toISOString().replace(/[:.]/g,'-')+'.'+extension;
export default forwardRef(function RecordingPanel({user,room,api,onNotice},ref){
 const [phase,setPhase]=useState('idle'),[includeMic,setIncludeMic]=useState(true),[target,setTarget]=useState(null),[result,setResult]=useState(null),[problem,setProblem]=useState(''),[elapsed,setElapsed]=useState(0);
 const job=useRef(null),lease=useRef(null),currentRoom=useRef(room),owner=useRef(user?.id),mounted=useRef(true),url=useRef(null),downloaded=useRef(false),latestUser=useRef(user?.id);currentRoom.current=room;latestUser.current=user?.id;
 const canRecord=!!(user&&room&&(user.role==='admin'||room.canRecord===true)),active=activeStates.includes(phase),supported=recordingSupport(window);
 const clearResult=()=>{if(url.current)URL.revokeObjectURL(url.current);url.current=null;downloaded.current=false;setResult(null);};
 async function endNotice(){const item=lease.current;if(!item)return;lease.current=null;try{await api('/classes/'+item.classId+'/recording',{action:'stop',recordingId:item.id});onNotice?.();}catch{/* The server expires abandoned notices after 45 seconds. */}}
 async function finish(){const item=job.current;if(item)await item.stop();await endNotice();}
 useImperativeHandle(ref,()=>({finish,canLogout:()=>!url.current||downloaded.current}),[]);
 useEffect(()=>()=>{mounted.current=false;void finish();if(url.current)URL.revokeObjectURL(url.current);},[]);
 useEffect(()=>{if(job.current&&(!room||room.id!==job.current.classId||user?.id!==owner.current))void finish();},[room?.id,user?.id]);
 useEffect(()=>{if(user?.id&&owner.current&&user.id!==owner.current){clearResult();setProblem('');}},[user?.id]);
 useEffect(()=>{
  if(!active&&!result?.url)return;
  const before=e=>{e.preventDefault();e.returnValue='';},page=()=>{void finish();};
  window.addEventListener('beforeunload',before);window.addEventListener('pagehide',page);
  return()=>{window.removeEventListener('beforeunload',before);window.removeEventListener('pagehide',page);};
 },[active,result?.url]);
 useEffect(()=>{
  if(phase!=='recording')return;const start=Date.now();let pending=false;
  const clock=setInterval(()=>{setElapsed(Math.floor((Date.now()-start)/1000));if(lease.current&&Date.now()>=lease.current.expires){setProblem(messages.RECORDING_NOTICE_FAILED);void finish();}},1000);
  const heartbeat=setInterval(async()=>{
   const item=lease.current;if(!item||pending)return;pending=true;
   try{const response=await api('/classes/'+item.classId+'/recording',{action:'heartbeat',recordingId:item.id});if(lease.current===item)item.expires=response.expires;}
   catch{if(lease.current===item){setProblem(messages.RECORDING_NOTICE_FAILED);void finish();}}
   finally{pending=false;}
  },15000);
  return()=>{clearInterval(clock);clearInterval(heartbeat);};
 },[phase]);
 async function chooseFile(){
  setProblem('');const format=recordingFormat(window);if(!format)return;
  try{
   const handle=await window.showSaveFilePicker({suggestedName:filename(format.extension),types:[{description:'Class recording',accept:{[format.mime.split(';')[0]]:['.'+format.extension]}}]});
   setTarget({handle,name:handle.name});
  }catch(error){if(!['AbortError','NotAllowedError'].includes(error.name))setProblem('ফাইলের জায়গা নির্বাচন হয়নি। চাইলে ডাউনলোড মোডে রেকর্ড রাখা যাবে।');}
 }
 function start(){
  if(!canRecord||active||job.current)return;if(result?.url&&!confirm('আগের রেকর্ডটি ডাউনলোড করা হয়েছে? নতুন রেকর্ড শুরু করলে আগের লিংকটি বন্ধ হবে।'))return;clearResult();setProblem('');setElapsed(0);owner.current=user.id;
  const selected=room,recordingId=crypto.randomUUID(),name=target?.name||filename(recordingFormat(window)?.extension||'webm');
  const task=createLocalRecording({env:window,fileHandle:target?.handle||null,includeMic,
   authorize:async()=>{
    if(currentRoom.current?.id!==selected.id)throw Object.assign(Error(),{code:'RECORDING_CANCELLED'});
    try{const response=await api('/classes/'+selected.id+'/recording',{action:'start',recordingId});lease.current={classId:selected.id,id:recordingId,expires:response.expires};onNotice?.();}
    catch{throw Object.assign(Error(),{code:'RECORDING_NOTICE_FAILED'});}
   },onState:value=>{if(mounted.current)setPhase(value);},
   onComplete:done=>{
    void endNotice();job.current=null;
    if(!mounted.current||latestUser.current&&latestUser.current!==owner.current)return;
    if(done.error)setProblem(messages[done.error]||messages.RECORDING_FAILED);
    else if(done.warning)setProblem(messages[done.warning]);
    if(done.blob){url.current=URL.createObjectURL(done.blob);setResult({url:url.current,name,bytes:done.bytes});}
    else if(done.saved)setResult({saved:true,name,bytes:done.bytes});
    setTarget(null);
   }
  });task.classId=selected.id;job.current=task;void task.start();
 }
 if(!canRecord&&!active&&!result&&!problem)return null;
 return <section className={'recording-panel panel '+(phase==='recording'?'is-recording':'')} aria-label="কম্পিউটারে ক্লাস রেকর্ডিং">
  <div className="recording-heading"><div><p className="eyebrow">LOCAL RECORDING</p><h2>ক্লাসের রেকর্ড আপনার কম্পিউটারে</h2></div>{phase==='recording'&&<strong className="recording-timer" role="status">● REC {Math.floor(elapsed/60).toString().padStart(2,'0')}:{(elapsed%60).toString().padStart(2,'0')}</strong>}</div>
  <p>শুধু আপনি শুরু করলে রেকর্ড হবে। ক্লাসের ট্যাব ও <b>Share tab audio</b> বেছে নিতে হবে। ফাইল এই কম্পিউটারে থাকবে; সার্ভারে আপলোড হবে না।</p>
  {!supported&&<p className="error">{messages.RECORDING_UNSUPPORTED}</p>}
  {supported&&!active&&canRecord&&<>
   <label className="recording-check"><input type="checkbox" checked={includeMic} onChange={e=>setIncludeMic(e.target.checked)}/>নিজের কণ্ঠও রাখব — ক্লাসের মাইক বন্ধ থাকলেও রেকর্ডে থাকবে</label>
   <div className="actions">{typeof window.showSaveFilePicker==='function'&&<button type="button" onClick={chooseFile}>১. ফাইলের জায়গা বাছুন</button>}<button type="button" className="primary" onClick={start}>{target?'২. রেকর্ডিং শুরু':'রেকর্ডিং শুরু · ডাউনলোড মোড'}</button></div>
   <small>{target?'নির্বাচিত ফাইল: '+target.name+'। বন্ধ করার পর ফাইল লেখা সম্পূর্ণ হবে।':'ডাউনলোড মোডে বন্ধ করার পর ফাইল নামাতে হবে; প্রতি অংশ সর্বোচ্চ ২০ মিনিট বা প্রায় ২৫৬ MB। দীর্ঘ ক্লাসে আগে ফাইলের জায়গা বেছে নেওয়া ভালো।'} রেকর্ড শুরুর নোটিশ ক্লাসের পেজে দেখা যাবে।</small>
  </>}
  {active&&<div className="actions"><button type="button" className="danger" disabled={phase==='saving'||phase==='cancelling'} onClick={()=>void finish()}>{phase==='recording'?'রেকর্ডিং বন্ধ ও সেভ':phase==='choosing'?'প্রস্তুতি বাতিল':'ফাইল প্রস্তুত হচ্ছে…'}</button>{phase==='recording'&&<button type="button" onClick={()=>document.querySelector('.classroom')?.scrollIntoView?.({block:'start',behavior:'smooth'})}>ক্লাসের পর্দা দেখুন</button>}<span role="status">{phase==='choosing'?'ব্রাউজারের অনুমতি ও ট্যাব নির্বাচন চলছে…':phase==='recording'?'রেকর্ডিং চলমান · ট্যাব খোলা রাখতে হবে':'শেষ অংশ সংরক্ষণ হচ্ছে…'}</span></div>}
  {problem&&<p className="error" role="alert">{problem}</p>}
  {result&&<div className="recording-result" role="status"><strong>{result.saved?'ফাইল সংরক্ষণ সম্পূর্ণ':'রেকর্ডিং প্রস্তুত — ডাউনলোড করতে হবে'}</strong><p>{result.name} · {(result.bytes/1048576).toFixed(1)} MB</p><div className="actions">{result.url&&<a className="receipt-desk-link" href={result.url} download={result.name} onClick={()=>{downloaded.current=true;}}>রেকর্ড ডাউনলোড</a>}<button type="button" onClick={()=>{if(result.saved||confirm('ফাইলটি ডাউনলোড করা হয়েছে? বন্ধ করলে এই ডাউনলোড লিংক আর থাকবে না।'))clearResult();}}>ফলাফল বন্ধ</button></div></div>}
 </section>;
});
