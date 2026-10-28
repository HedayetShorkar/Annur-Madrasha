// Read-only and deliberately invalid hosted requests; no real application/review is created.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const context={window:{},document:{getElementById:()=>null}};vm.runInNewContext(fs.readFileSync('assets/js/backend-config.js','utf8'),context);const cfg=context.window.AnNoorBackend;
 for(const [route,body,token,status]of [['health',null,null,200],['published-reviews',null,null,200],['published-reviews?offset=-1',null,null,400],['trial-submit',{},null,400],['review-submit',{},null,400],['review-submit',{request_id:crypto.randomUUID(),status:'APPROVED'},null,400],['trial-list',{offset:0},null,401],['decide',{id:crypto.randomUUID(),status:'APPROVED',reason:'Invalid audit probe'},'forged',400],['list',{offset:-1},'forged',400],['review-list',{offset:0},'forged',401]]){
  const r=await fetch(cfg.url+'/functions/v1/admissions/'+route,{method:body?'POST':'GET',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});assert.equal(r.status,status,route);const data=await r.json();if(route==='health')assert.ok(data.features.includes('moderated_reviews'));if(route==='published-reviews'){assert.ok(Array.isArray(data.items));for(const row of data.items)assert.deepEqual(Object.keys(row).sort(),['country','id','name','published_at','rating','text']);}
 }
 console.log('PASS: hosted feature health/public projection and invalid-data, unauthorized and forged-token denial; no records submitted.');
})().catch(error=>{console.error(error);process.exitCode=1;});
