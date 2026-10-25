// Jitsi lifecycle + compiled portal tests. Fictional data; no real media service.
const {JSDOM,VirtualConsole}=require('jsdom'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<200&&!fn();i++)await delay(10);}
function sdk(dom,{fail=false}={}){
 const w=dom.window,d=w.document,instances=[],scripts=[];let failures=fail?1:0;
 class Api{
  constructor(domain,options){this.domain=domain;this.options=options;this.handlers=new Map();this.commands=[];this.disposed=0;this.frame=d.createElement('iframe');this.frame.src='about:blank';options.parentNode.append(this.frame);instances.push(this);}
  addListener(event,handler){this.handlers.set(event,handler);}
  removeListener(event,handler){assert.equal(this.handlers.get(event),handler);this.handlers.delete(event);}
  executeCommand(...args){this.commands.push(args);}
  getIFrame(){return this.frame;}
  dispose(){this.disposed++;this.frame.remove();}
 }
 const append=d.head.appendChild.bind(d.head);d.head.appendChild=node=>{const result=append(node);if(node.tagName==='SCRIPT'){scripts.push(node.src);queueMicrotask(()=>{if(failures){failures--;node.onerror?.();}else{w.JitsiMeetExternalAPI=Api;node.onload?.();}});}return result;};
 return {instances,scripts};
}
const info={provider:'jitsi',domain:'meet.school.test',roomName:'annoor-test-room',token:'test.header.signature',title:'Quran lesson',displayName:'Visible supervisor'};
async function lifecycle(){
 const {mountJitsi}=await import('../live-class/src/jitsi.js');
 const dom=new JSDOM('<div id="a"></div><div id="b"></div>',{url:'https://school.test'}),fake=sdk(dom);let joined=0,left=0,errors=0;
 const first=await mountJitsi(info,{parentNode:dom.window.document.getElementById('a'),onJoined:()=>joined++,onDisconnected:()=>left++,onError:()=>errors++});
 const a=fake.instances[0];assert.equal(a.options.jwt,info.token);assert.equal(a.options.roomName,info.roomName);assert.equal(a.options.configOverwrite.startWithAudioMuted,true);assert.equal(a.options.configOverwrite.startWithVideoMuted,true);assert.equal(a.options.configOverwrite.startSilent,false);assert.equal(a.frame.referrerPolicy,'no-referrer');
 a.handlers.get('videoConferenceJoined')();assert.equal(joined,1);assert.deepEqual(a.commands[0],['localSubject','Quran lesson']);a.handlers.get('cameraError')();assert.equal(errors,1);a.handlers.get('videoConferenceLeft')();a.handlers.get('readyToClose')();assert.equal(left,1);
 const second=await mountJitsi(info,{parentNode:dom.window.document.getElementById('b'),observeOnly:true});assert.equal(fake.scripts.length,1);const b=fake.instances[1];assert.equal(b.options.configOverwrite.startSilent,true);assert.equal(b.options.configOverwrite.prejoinConfig.enabled,false);assert.deepEqual(b.options.configOverwrite.toolbarButtons,[]);assert.match(b.frame.title,/নীরব/);
 first.dispose();first.dispose();second.dispose();assert.equal(a.disposed,1);assert.equal(b.disposed,1);assert.equal(a.handlers.size,0);assert.equal(dom.window.localStorage.length,0);dom.window.close();
 const cancelled=new JSDOM('<div></div>'),c=sdk(cancelled);await mountJitsi(info,{parentNode:cancelled.window.document.querySelector('div'),isCancelled:()=>true});assert.equal(c.instances.length,0);cancelled.window.close();
 const retry=new JSDOM('<div></div>'),r=sdk(retry,{fail:true});const host=retry.window.document.querySelector('div');await assert.rejects(mountJitsi(info,{parentNode:host}),/JITSI_LOAD_FAILED/);const room=await mountJitsi(info,{parentNode:host});assert.equal(r.scripts.length,2);room.dispose();retry.window.close();
 const jaas=new JSDOM('<div></div>'),j=sdk(jaas),appId='vpaas-magic-cookie-test123';const jaasRoom=await mountJitsi({...info,domain:'8x8.vc',appId,roomName:appId+'/'+info.roomName},{parentNode:jaas.window.document.querySelector('div')});assert.equal(j.scripts[0],'https://8x8.vc/'+appId+'/external_api.js');jaasRoom.dispose();jaas.window.close();
 const bad=new JSDOM('<div></div>');for(const wrong of [{domain:'meet.school.test/path'},{roomName:'*'},{token:''},{domain:'other.test',appId}])await assert.rejects(mountJitsi({...info,...wrong},{parentNode:bad.window.document.querySelector('div')}),/INVALID_JOIN/);assert.equal(bad.window.document.scripts.length,0);bad.window.close();
}
async function compiled(){
 const html=fs.readFileSync(path.join(root,'live/index.html'),'utf8'),asset=html.match(/<script defer src="([^"]+)"/)[1],script=fs.readFileSync(path.resolve(root,'live',asset),'utf8');
 for(const role of ['student','teacher','admin']){
  let rows=[{id:'c',title:'Quran class',teacher:'Teacher',teacher_id:'teacher',scheduled:'2026-10-25T08:00:00Z',status:'live',liveNow:null,count:null,participants:[],roster:role==='student'?undefined:[{id:'student',name:'Child',blocked:0}]}],poll,requests=[];
  const vc=new VirtualConsole(),jsErrors=[];vc.on('jsdomError',e=>jsErrors.push(e.message));
  const dom=new JSDOM(html,{url:'https://school.test/live/index.html',runScripts:'outside-only',virtualConsole:vc}),w=dom.window,d=w.document,fake=sdk(dom);
  w.setInterval=fn=>{poll=fn;return 1;};w.clearInterval=()=>{};
  w.fetch=async(url,options={})=>{requests.push(url);const data=url==='/api/live/me'?{user:{id:role,name:role,role,loginId:'AN-TEST-1234'}}:url==='/api/live/classes'?{classes:rows,videoConfigured:true,video:{id:'jitsi',capabilities:{roomStats:false,serverModeration:false,verifiedAttendance:false}}}:url==='/api/live/users'?[]:url.endsWith('/token')?{...info,id:'c'}:{};return {ok:true,json:async()=>data};};
  w.eval(script);await delay(160);assert.equal(fake.scripts.length,0);assert.equal(d.querySelectorAll('.stats strong')[2].textContent,'—');assert.match(d.body.textContent,/সংযোগসংখ্যা অজানা/);assert.equal([...d.querySelectorAll('button')].some(b=>b.textContent==='শিক্ষার্থীদের মিউট'),false);
  if(role==='admin'){
   [...d.querySelectorAll('button')].find(b=>b.textContent==='ভিডিও প্রিভিউ').click();await until(()=>fake.instances.length===1);assert.equal(fake.instances.length,1);assert.equal(fake.instances[0].options.configOverwrite.startSilent,true);
  }else{
   assert.equal([...d.querySelectorAll('button')].some(b=>b.textContent==='ভিডিও প্রিভিউ'),false);
   [...d.querySelectorAll('button')].find(b=>b.textContent==='ক্লাসে যোগ দিন').click();await until(()=>fake.instances.length===1);assert.equal(fake.instances.length,1);assert.equal(fake.instances[0].options.jwt,info.token);assert.equal(d.querySelectorAll('.jitsi-embed iframe').length,1);
  }
  rows=[];await poll();await delay(30);assert.equal(fake.instances[0].disposed,1);assert.equal(d.querySelectorAll('.jitsi-embed iframe').length,0);assert.equal(w.localStorage.length,0);assert.ok(!requests.some(x=>x.includes('heartbeat')));assert.deepEqual(jsErrors,[]);dom.window.close();
 }
}
(async()=>{await lifecycle();await compiled();console.log('PASS: Jitsi SDK loading/retry, room JWT, muted devices, silent previews, visible identity, cancellation/disposal, role-aware compiled UI and access-revocation polling; no browser attendance claim.');})().catch(e=>{console.error(e);process.exitCode=1;});
