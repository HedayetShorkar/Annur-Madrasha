// Compiled portal workflows with fictional accounts/media; no network or capture.
const {JSDOM,VirtualConsole}=require('jsdom'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),pause=()=>new Promise(r=>setTimeout(r,15));
async function until(check){for(let i=0;i<160&&!check();i++)await pause();assert.ok(check(),'Expected UI state was not reached');}
const html=fs.readFileSync(path.join(root,'live/index.html'),'utf8'),entry=html.match(/<script defer src="([^"]+)"/)[1],script=fs.readFileSync(path.resolve(root,'live',entry),'utf8');
const info={provider:'jitsi',domain:'meet.school.test',roomName:'annoor-test',token:'test.header.signature',title:'Quran class'};
function fixture(role,{disk=false,denied=false,heartbeatFails=false}={}){
 const requests=[],errors=[],captures=[],recorders=[],intervals=[],writes=[];let lesson={version:0,topic:'মাখরাজ',summary:'পাঠের নোট',homework:'অনুশীলন'},report={id:'student',name:'Test Child',version:0};
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://school.test/live/index.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 w.confirm=()=>true;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 Object.defineProperty(w,'isSecureContext',{value:true});w.URL.createObjectURL=()=> 'blob:https://school.test/fictional-recording';w.URL.revokeObjectURL=()=>{};
 class Track{constructor(kind){this.kind=kind;this.readyState='live';}stop(){this.readyState='ended';}}
 class Stream{constructor(tracks){this.tracks=tracks;}getTracks(){return this.tracks;}getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio');}getVideoTracks(){return this.tracks.filter(t=>t.kind==='video');}}
 class Recorder{static isTypeSupported(mime){return mime.startsWith('video/webm');}constructor(stream,options){this.state='inactive';this.mimeType=options.mimeType;recorders.push(this);}start(){this.state='recording';}stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new w.Blob(['fictional clip'])});this.onstop?.();});}}
 class Audio{async resume(){}async close(){}createMediaStreamDestination(){return {stream:new Stream([new Track('audio')])};}createMediaStreamSource(){return {connect(){}};}}
 w.MediaStream=Stream;w.MediaRecorder=Recorder;w.AudioContext=Audio;
 Object.defineProperty(w.navigator,'mediaDevices',{value:{getDisplayMedia:async()=>{captures.push('display');if(denied)throw Object.assign(Error(),{name:'NotAllowedError'});return new Stream([new Track('video'),new Track('audio')]);},getUserMedia:async()=>{captures.push('mic');return new Stream([new Track('audio')]);}}});
 if(disk)w.showSaveFilePicker=async()=>({name:'Selected-record.webm',createWritable:async()=>({write:async chunk=>writes.push(chunk.size),close:async()=>writes.push('closed'),abort:async()=>writes.push('aborted')})});
 w.setInterval=(fn,ms)=>{const timer={fn,ms,active:true};intervals.push(timer);return timer;};w.clearInterval=timer=>{if(timer)timer.active=false;};
 class Api{constructor(domain,options){this.frame=d.createElement('iframe');options.parentNode.append(this.frame);}addListener(){}removeListener(){}executeCommand(){}getIFrame(){return this.frame;}dispose(){this.frame.remove();}}
 const append=d.head.appendChild.bind(d.head);d.head.appendChild=node=>{const result=append(node);if(node.tagName==='SCRIPT')queueMicrotask(()=>{w.JitsiMeetExternalAPI=Api;node.onload?.();});return result;};
 const classes=[{id:'c',title:'Quran class',teacher:'Teacher',teacher_id:'teacher',scheduled:'2026-10-25T12:00:00Z',status:'live',participants:[],roster:role==='student'?undefined:[report],recordings:[]}];
 w.fetch=async(url,options={})=>{
  const body=options.body?JSON.parse(options.body):null;requests.push({url,body});let data={},ok=true;
  if(url==='/api/live/me')data={user:{id:role,name:role,role,loginId:'AN-TEST'}};
  else if(url==='/api/live/classes')data={classes,videoConfigured:true,video:{id:'jitsi',capabilities:{roomStats:false,serverModeration:false,verifiedAttendance:false}}};
  else if(url==='/api/live/users')data=[];
  else if(url.endsWith('/token'))data=info;
  else if(url.endsWith('/learning'))data={lesson,reports:[report],canEdit:role!=='student',attendanceSource:'STAFF_RECORDED'};
  else if(url.endsWith('/lesson')){lesson={...body,version:body.version+1};data={ok:true};}
  else if(url.endsWith('/reports/student')){report={...report,...body,homework_status:body.homeworkStatus,version:body.version+1};data={ok:true};}
  else if(url.endsWith('/recording')){if(heartbeatFails&&body.action==='heartbeat'){ok=false;data={error:'RECORDING_NOTICE_EXPIRED'};}else data={ok:true,expires:Date.now()+45000};}
  return {ok,json:async()=>data};
 };
 w.eval(script);
 const click=label=>{const button=[...d.querySelectorAll('button')].find(b=>b.textContent===label||b.textContent.startsWith(label));assert.ok(button,label);button.click();};
 const submit=form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 return {dom,w,d,requests,errors,captures,recorders,intervals,writes,click,submit};
}
async function learning(){
 for(const role of ['student','teacher','admin']){
  const f=fixture(role);await until(()=>f.d.querySelector('.classes'));
  assert.equal(f.captures.length,0);f.click('পড়াশোনা ও অগ্রগতি');await until(()=>f.d.querySelector('.lesson-overview'));
  if(role==='student')assert.match(f.d.body.textContent,/মাখরাজ/);else assert.equal(f.d.querySelector('[name="topic"]').value,'মাখরাজ');assert.match(f.d.body.textContent,/ভিডিও সার্ভারের যাচাইকৃত হাজিরা নয়/);
  if(role==='student'){assert.equal(f.d.querySelectorAll('.learning-content form').length,0);assert.match(f.d.body.textContent,/মূল্যায়ন দিলে/);}
  else{
   let form=f.d.querySelector('.lesson-overview form');f.submit(form);await until(()=>f.requests.some(r=>r.url.endsWith('/lesson')));await until(()=>f.d.querySelector('.learning-success'));
   assert.equal(f.requests.find(r=>r.url.endsWith('/lesson')).body.version,0);
   form=f.d.querySelector('.learner-entry form');form.querySelector('[name="covered"]').value='হিফজ — সূরা ফাতিহা';f.submit(form);await until(()=>f.requests.some(r=>r.url.endsWith('/reports/student')));
   assert.equal(f.requests.find(r=>r.url.endsWith('/reports/student')).body.covered,'হিফজ — সূরা ফাতিহা');
  }
  assert.equal(f.w.localStorage.length,0);assert.deepEqual(f.errors,[]);f.dom.window.close();
 }
}
async function recording(){
 for(const disk of [false,true]){
  const f=fixture('teacher',{disk});await until(()=>f.d.querySelector('.classes'));f.click('ক্লাসে যোগ দিন');await until(()=>f.d.querySelector('.recording-panel'));
  assert.equal(f.captures.length,0);assert.equal(f.recorders.length,0);
  if(disk){f.click('১. ফাইলের জায়গা বাছুন');await until(()=>f.d.body.textContent.includes('Selected-record.webm'));assert.equal(f.captures.length,0);}
  f.click(disk?'২. রেকর্ডিং শুরু':'রেকর্ডিং শুরু · ডাউনলোড মোড');await until(()=>f.d.querySelector('.recording-timer'));
  assert.deepEqual(f.captures,['display','mic']);assert.equal(f.requests.filter(r=>r.body?.action==='start').length,1);
  f.click('ড্যাশবোর্ডে ফিরুন');await until(()=>f.d.querySelector('.recording-result'));assert.equal(f.recorders[0].state,'inactive');
  if(disk){assert.match(f.d.querySelector('.recording-result').textContent,/সংরক্ষণ সম্পূর্ণ/);assert.deepEqual(f.writes,[14,'closed']);}
  else{const link=f.d.querySelector('.recording-result a');assert.ok(link.download.endsWith('.webm'));assert.ok(link.href.startsWith('blob:'));f.click('লগআউট');await pause();assert.ok(!f.requests.some(r=>r.url==='/api/live/logout'));link.addEventListener('click',e=>e.preventDefault());link.click();f.click('লগআউট');await until(()=>f.requests.some(r=>r.url==='/api/live/logout'));}
  assert.ok(f.requests.some(r=>r.body?.action==='stop'));assert.ok(!f.requests.some(r=>r.url.includes('upload')));assert.equal(f.w.localStorage.length,0);assert.deepEqual(f.errors,[]);f.dom.window.close();
 }
 const student=fixture('student');await until(()=>student.d.querySelector('.classes'));student.click('ক্লাসে যোগ দিন');await until(()=>student.d.querySelector('.classroom'));assert.equal(student.d.querySelector('.recording-panel'),null);assert.equal(student.captures.length,0);student.dom.window.close();
 const fail=fixture('teacher',{heartbeatFails:true});await until(()=>fail.d.querySelector('.classes'));fail.click('ক্লাসে যোগ দিন');await until(()=>fail.d.querySelector('.recording-panel'));fail.click('রেকর্ডিং শুরু · ডাউনলোড মোড');await until(()=>fail.d.querySelector('.recording-timer'));const heartbeat=fail.intervals.find(x=>x.ms===15000&&x.active);assert.ok(heartbeat);await heartbeat.fn();await until(()=>fail.d.querySelector('.recording-result'));assert.equal(fail.recorders[0].state,'inactive');assert.match(fail.d.body.textContent,/নোটিশ সার্ভারে নিশ্চিত করা যায়নি/);fail.dom.window.close();
 const denied=fixture('teacher',{denied:true});await until(()=>denied.d.querySelector('.classes'));denied.click('ক্লাসে যোগ দিন');await until(()=>denied.d.querySelector('.recording-panel'));denied.click('রেকর্ডিং শুরু · ডাউনলোড মোড');await pause();assert.equal(denied.requests.some(r=>r.body?.action==='start'),false);assert.equal(denied.recorders.length,0);denied.dom.window.close();
}
module.exports={fixture,until};
if(require.main===module)(async()=>{await learning();await recording();console.log('PASS: compiled lesson/report workflows, student read-only view, explicit staff-only local recording, file/download modes, stop on classroom exit, heartbeat failure and permission cancellation; no uploads or private browser storage.');})().catch(e=>{console.error(e);process.exitCode=1;});
