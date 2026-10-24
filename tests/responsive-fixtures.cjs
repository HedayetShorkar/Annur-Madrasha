// Generate fictional, inert admin snapshots for browser layout QA, outside the source tree.
// NODE_PATH=<jsdom node_modules> node tests/responsive-fixtures.cjs <public-preview-directory>
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),target=path.resolve(process.argv[2]||'');
if(!process.argv[2]||!path.relative(root,target).startsWith('..'))throw Error('Choose a preview directory outside the source tree.');
const pause=()=>new Promise(resolve=>setTimeout(resolve,100));
const users=[
 {id:'admin',name:'Fictional administrator with a long display name',role:'admin',active:1},
 {id:'teacher',name:'পরীক্ষামূলক শিক্ষক — দীর্ঘ নামের লেআউট যাচাই',role:'teacher',email:'teacher@example.test',active:1},
 {id:'student',name:'পরীক্ষামূলক শিক্ষার্থী — দীর্ঘ নাম ও পরিচয়পত্রের লেআউট যাচাই',role:'student',loginId:'AN-ABCD-2345-EFGH-6789',email:'parent@example.test',active:1}
];
const classes=[{id:'class-1',title:'পরীক্ষামূলক কুরআন ও তাজবীদ শিক্ষা — দীর্ঘ ব্যাচের নাম',teacher:users[1].name,teacher_id:'teacher',scheduled:'2026-10-24T08:00:00Z',status:'live',liveNow:true,count:3,participants:[{...users[2],audioMuted:true}],roster:[users[2]],locked:0}];
const receipt={id:'fixture-receipt',receiptNumber:'AN-R-2026-000001',issuedAt:'2026-10-24T10:00:00Z',issuerName:'Fictional office',status:'ISSUED',paymentStatus:'CONFIRMED_PAID',source:'ADMIN_MANUAL',studentId:'student',studentName:users[2].name,studentCode:'AN-ABCD-2345-EFGH-6789',guardianName:'Fictional guardian for layout QA',phone:'01700000000',feeType:'MONTHLY',packageId:'basic',billingMonth:'2026-10',enrollmentDate:'',amountMode:'PACKAGE',customReason:'',description:'',note:'Fictional layout fixture; no actual receipt was issued.',method:'CASH',transactionId:'',paidDate:'2026-10-24',evidenceReference:'Fictional fixture only',baseMinor:99900,discountMinor:0,netMinor:99900,receivedMinor:99900,balanceMinor:0,daysBilled:null,daysInMonth:null};
async function render(app,role='admin'){
 const html=fs.readFileSync(path.join(root,app,'index.html'),'utf8'),entry=html.match(/<script defer src="([^"]+)"/)[1];
 const vc=new VirtualConsole();
 const dom=new JSDOM(html,{url:'https://fixture.test/'+app+'/index.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.localStorage.setItem('annoor-language','en');w.localStorage.setItem('annoor-theme','dark');
  w.fetch=async(url,options={})=>{
   if(options.method==='POST')throw Error('Snapshots never perform mutations.');
   const value=url==='/api/live/me'?{user:users.find(u=>u.role===role)}:url==='/api/live/users'?users:url==='/api/live/classes'?{classes,videoConfigured:true,checkedAt:'2026-10-24T10:00:00Z'}:url==='/api/live/audit'?[{id:'audit-1',at:'2026-10-24T10:00:00Z',action:'FICTIONAL_LAYOUT_CHECK_WITH_A_LONG_ACTION_LABEL',actor:'admin',class_id:'class-1'}]:url.startsWith('/api/live/receipts?')?{items:[receipt],total:1,offset:0}:{};
   return{ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>value};
  };
 }});
 dom.window.eval(fs.readFileSync(path.resolve(root,app,entry),'utf8'));await pause();return dom;
}
function save(dom,app,name){
 const d=dom.window.document;d.querySelectorAll('script').forEach(s=>s.remove());
 const banner=d.createElement('div');banner.textContent='FICTIONAL, INERT LAYOUT FIXTURE · NOT A LIVE ACCOUNT';banner.style.cssText='padding:8px;background:#ffefbb;color:#493b12;font:12px system-ui;text-align:center';d.body.prepend(banner);
 const output=path.join(target,app,name);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,dom.serialize());dom.window.close();
}
(async()=>{
 for(const mode of ['classes','setup','audit']){
  const dom=await render('live');
  if(mode!=='classes'){[...dom.window.document.querySelectorAll('nav button')].find(b=>b.textContent===(mode==='setup'?'ক্লাস ও অ্যাকাউন্ট':'কার্যক্রমের লগ')).click();await pause();}
  save(dom,'live','qa-'+mode+'.html');
 }
 save(await render('live','student'),'live','qa-student.html');
 const dom=await render('payments');[...dom.window.document.querySelectorAll('button')].find(b=>b.textContent==='Issued receipts').click();await pause();save(dom,'payments','qa-register.html');
 console.log('PASS: five fictional, script-free layout snapshots generated outside the project.');
})().catch(e=>{console.error(e);process.exitCode=1;});
