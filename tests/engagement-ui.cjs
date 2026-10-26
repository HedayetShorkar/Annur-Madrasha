const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),read=f=>fs.readFileSync(path.join(root,'assets/js',f),'utf8');
const pause=()=>new Promise(r=>setTimeout(r,15));
function fixture(saved=false,blocked=false){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(html,{url:'https://school.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.matchMedia=()=>({matches:false});w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(saved)w.localStorage.setItem('annoor-admission-submitted-v1','1');if(blocked)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage blocked');}});
 return {dom,w,d,get:id=>d.getElementById(id),eval:file=>w.eval(read(file)),errors};
}
function admissionValues(f){const {d,get}=f;for(const [id,value]of Object.entries({sn:'Synthetic student','student-gender':'boy',ge:'10',ad:'Synthetic city',gn:'Synthetic guardian',wa:'+8801700000000',em:'',nt:'','fee-start':'2026-10-26'})){const e=get(id);if(e.tagName==='SELECT'&&!e.querySelector('option[value="'+value+'"]'))e.add(new f.w.Option(value,value));e.value=value;}const relation=get('gr');relation.add(new f.w.Option('Father','father'));relation.value='father';for(const [id,name,value]of [['lv','lv','Noorani Qaida'],['pkg','pkg','Basic']]){const e=d.createElement('input');e.type='radio';e.name=name;e.value=value;e.checked=true;get(id).append(e);}['c1','c2','c3'].forEach(id=>get(id).checked=true);}
async function gate(){
 for(const blocked of [false,true]){
  const f=fixture(false,blocked),{w,get}=f;let mode='failed';w.fetch=async()=>({ok:mode!=='failed',json:async()=>mode==='good'?{reference:'ANN-'+'A'.repeat(32),status:'SUBMITTED',fee_bdt_minor:99900}:{reference:'fake',fee_bdt_minor:99900}});f.eval('backend-config.js');f.eval('engagement.js');admissionValues(f);
  assert.equal(f.d.querySelector('.hero .live-entry').hidden,true);assert.equal(f.d.querySelector('.hero .trial-entry').hidden,false);
  await w.annoorSubmitAdmission();assert.equal(f.d.querySelector('.hero .live-entry').hidden,true);mode='malformed';await w.annoorSubmitAdmission();assert.equal(f.d.querySelector('.hero .live-entry').hidden,true);
  mode='good';await w.annoorSubmitAdmission();assert.equal(f.d.querySelector('.hero .live-entry').hidden,false);assert.equal(f.d.querySelector('.hero .trial-entry').hidden,true);assert.equal(get('pg-login').querySelector('a[href="live/index.html"]').hidden,false);
  if(!blocked){assert.equal(w.localStorage.length,1);assert.equal(w.localStorage.getItem('annoor-admission-submitted-v1'),'1');w.localStorage.clear();w.dispatchEvent(new w.StorageEvent('storage',{key:null}));assert.equal(f.d.querySelector('.hero .live-entry').hidden,true);}
  assert.deepEqual(f.errors,[]);w.close();
 }
 const unavailable=fixture();unavailable.eval('backend-config.js');admissionValues(unavailable);Object.defineProperty(unavailable.w,'crypto',{value:{}});let attempted=false;unavailable.w.fetch=async()=>{attempted=true;};await unavailable.w.annoorSubmitAdmission();assert.equal(attempted,false);assert.match(unavailable.get('admission-submit-status').textContent,/Update your browser|ব্রাউজারটি/);assert.equal(unavailable.get('sb').disabled,false);unavailable.w.close();
 const returning=fixture(true);returning.eval('engagement.js');assert.equal(returning.d.querySelector('.hero .live-entry').hidden,false);returning.w.close();
}
async function trial(){
 const f=fixture(),{w,d,get}=f;Object.defineProperty(w.crypto,'randomUUID',{value:undefined});let calls=[];w.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));if(calls.length===1)throw Error('Synthetic network failure');return{ok:true,json:async()=>({reference:'ANT-'+'B'.repeat(32),status:'SUBMITTED'})};};f.eval('backend-config.js');f.eval('engagement.js');
 d.querySelector('[data-trial-open]').click();assert.equal(get('trial-dialog').open,true);get('trial-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(calls.length,0);
 for(const [id,value]of Object.entries({'trial-student':'Synthetic student','trial-age':'10','trial-guardian':'Synthetic guardian','trial-phone':'+8801700000000','trial-level':'To discuss','trial-time':'Discuss later'}))get(id).value=value;get('trial-consent').checked=true;
 get('trial-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();assert.equal(calls.length,1);assert.match(calls[0].request_id,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);assert.equal(get('trial-submit').disabled,false);
 d.documentElement.lang='en';get('trial-form').dispatchEvent(new w.Event('submit',{cancelable:true}));get('trial-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();assert.equal(calls.length,2);assert.equal(calls[0].request_id,calls[1].request_id);assert.equal(calls[0].language,calls[1].language);assert.match(get('trial-status').textContent,/ANT-/);assert.equal(w.localStorage.length,0);assert.equal(d.querySelector('.hero .live-entry').hidden,true);assert.equal(get('trial-submit').disabled,true);
 get('trial-another').click();assert.equal(get('trial-submit').disabled,false);assert.equal(get('trial-student').value,'');assert.deepEqual(f.errors,[]);w.close();
}
async function reviews(){
 const f=fixture(),{w,d,get}=f,items=Array.from({length:8},(_,i)=>({id:crypto.randomUUID(),name:i===0?'<img src=x onerror=alert(1)>':'Synthetic parent '+i,country:'Test country',text:i===0?'<script>alert(1)</script> A synthetic published review.':'Synthetic published review '+i,rating:i===0?null:5,published_at:'2026-10-26T00:00:00Z'}));
 let posts=[],gets=[],fail=false,empty=false;
 w.fetch=async(url,options={})=>{if(options.method==='POST'){posts.push(JSON.parse(options.body));if(posts.length===1)throw Error('Synthetic failure');return{ok:true,json:async()=>({reference:'ANR-'+'C'.repeat(32),status:'PENDING'})};}gets.push(url);if(fail)throw Error('Synthetic offline');const offset=Number(new URL(url).searchParams.get('offset')||0);return{ok:true,json:async()=>({items:empty?[]:items.slice(offset,offset+6),total:empty?0:8})};};
 f.eval('backend-config.js');f.eval('reviews.js');await pause();assert.equal(d.querySelectorAll('.review-published-card').length,6);assert.equal(get('rvt').querySelector('img,script'),null);assert.equal(d.querySelectorAll('.review-published-rating').length,5);assert.equal(get('review-more').hidden,false);
 for(const [id,value]of Object.entries({'rv-name':'Synthetic parent','rv-ct':'Test country','rv-tx':'A private pending review must not appear immediately.'}))get(id).value=value;get('rv-c').checked=true;
 get('rvf').dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();d.documentElement.lang='en';get('rvf').dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();assert.equal(posts[0].request_id,posts[1].request_id);assert.equal(posts[0].language,posts[1].language);assert.equal(posts[1].status,undefined);assert.equal(d.querySelectorAll('.review-published-card').length,6);assert.match(get('review-submit-status').textContent,/ANR-/);assert.equal(w.localStorage.length,0);
 get('review-more').click();await pause();assert.equal(d.querySelectorAll('.review-published-card').length,8);assert.ok(gets.at(-1).endsWith('offset=6'));assert.equal(get('review-more').hidden,true);
 // A failed refresh followed by an empty result removes the previously rendered records.
 fail=true;get('review-retry').click();await pause();assert.equal(get('review-retry').hidden,false);fail=false;empty=true;get('review-retry').click();await pause();assert.equal(d.querySelectorAll('.review-published-card').length,0);assert.ok(get('rvt').querySelector('.review-empty-state'));assert.deepEqual(f.errors,[]);w.close();
}

async function office(){
 const source=fs.readFileSync(path.join(root,'admin/index.html'),'utf8'),dom=new JSDOM(source,{url:'https://school.test/admin/index.html',runScripts:'outside-only'}),w=dom.window,d=w.document,get=id=>d.getElementById(id),decisions=[];
 const review={id:crypto.randomUUID(),reference:'ANR-'+'D'.repeat(32),status:'PENDING',version:1,created_at:'2026-10-26T00:00:00Z',published_at:null,data:{guardian_name:'<script>Synthetic guardian</script>',country:'Test country',review:'<img src=x onerror=alert(1)> Synthetic feedback only.',rating:null,publish_consent:true}};
 const trial={id:crypto.randomUUID(),reference:'ANT-'+'E'.repeat(32),status:'SUBMITTED',version:1,created_at:'2026-10-26T00:00:00Z',data:{student_name:'Synthetic student',age:10,guardian_name:'Synthetic guardian',phone:'01700000000',level:'To discuss',preferred_time:''}};
 w.fetch=async(url,options={})=>{
  let data={items:[],total:0};if(url.includes('/auth/v1/token'))data={access_token:'SYNTHETIC-TEST-TOKEN',expires_in:60};
  else if(url.endsWith('/review-list'))data={items:[review],total:1};else if(url.endsWith('/trial-list'))data={items:[trial],total:1};
  else if(url.endsWith('/review-decide')){const body=JSON.parse(options.body);decisions.push(body);assert.equal(body.actor,undefined);assert.equal(body.expected_version,review.version);review.status=body.status;review.version++;data={status:review.status,version:review.version};}
  return{ok:true,status:200,json:async()=>JSON.parse(JSON.stringify(data))};
 };
 w.eval(read('backend-config.js'));w.eval([...source.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]);get('email').value='synthetic@example.test';get('password').value='SYNTHETIC-TEST-ONLY';get('login').dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();await pause();assert.equal(get('office').hidden,false);
 get('module').value='REVIEW';get('module').dispatchEvent(new w.Event('change'));await pause();assert.equal(get('list').querySelector('script,img'),null);assert.ok(get('list').textContent.includes(review.data.review));
 let form=get('list').querySelector('form');form.querySelector('textarea').value='Synthetic approval reason';form.querySelector('select').value='APPROVED';form.dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();await pause();assert.equal(decisions[0].expected_version,1);assert.equal(review.status,'APPROVED');
 form=get('list').querySelector('form');form.querySelector('textarea').value='Synthetic withdrawal reason';form.querySelector('select').value='REJECTED';form.dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();await pause();assert.equal(decisions[1].expected_version,2);assert.equal(review.status,'REJECTED');
 get('module').value='TRIAL';get('module').dispatchEvent(new w.Event('change'));await pause();assert.match(get('list').textContent,/Synthetic student/);assert.match(get('list').textContent,/ফ্রি ট্রায়াল/);assert.equal(w.localStorage.length,0);assert.equal(w.sessionStorage.length,0);get('logout').click();assert.equal(get('office').hidden,true);assert.equal(get('list').children.length,0);w.close();
}
(async()=>{await gate();await trial();await reviews();await office();console.log('PASS: admission-only device hint, failed/fake response denial, returning/blocked-storage behavior, trial validation and retry across languages, no trial auto-access, safe multiple moderated cards/pagination/withdrawal, pending-not-public and no private browser storage.');})().catch(error=>{console.error(error);process.exitCode=1;});
