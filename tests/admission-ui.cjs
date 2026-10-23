const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{runScripts:'outside-only',url:'https://example.test/#/admission'}),w=dom.window,d=w.document;
d.getElementById('pg-adm').hidden=false;w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
const read=f=>fs.readFileSync(path.join(root,'assets/js',f),'utf8'),app=read('app.js');
w.eval("const $=s=>document.querySelector(s),B=(b,e)=>`<i class=bn>${b}</i><i class=en>${e}</i>`,bd=n=>String(n);"+app.slice(app.indexOf('const pk='),app.indexOf("$('#pg').innerHTML"))+app.slice(app.indexOf('const LV='),app.indexOf('const GZ='))+';window.sel=sel;window.$=$;window.B=B;');
for(const f of ['fee-core.js','schedule.js','fee-ui.js','admission-ui.js'])w.eval(read(f));
const get=id=>d.getElementById(id),change=el=>el.dispatchEvent(new w.Event('change',{bubbles:true})),next=()=>get('wizard-next').click(),current=()=>w.admissionWizard.current(),tick=async()=>new Promise(r=>setTimeout(r,0));
function checkPanel(index){assert.equal(current(),index);assert.equal(d.querySelectorAll('.admission-section:not([hidden])').length,1);assert.equal(get('wizard-progress').getAttribute('aria-valuenow'),String(index+1));assert.equal(get('sb').hidden,index!==5);}
(async()=>{
 assert.equal(d.querySelectorAll('.admission-section').length,6);checkPanel(0);assert.equal(get('wa').closest('.admission-section').id,'adm-guardian');
 assert.equal(d.querySelector('[data-adm-target=adm-review]').disabled,true);assert.equal(w.admissionWizard.go('adm-review'),false);
 get('read-admission-rules').click();assert.equal(get('admission-rules-preview').open,true);checkPanel(0);get('rules-preview-close').click();assert.equal(get('admission-rules-preview').open,false);assert.equal(get('c1').checked,false);
 next();checkPanel(0);assert.equal(get('sn').getAttribute('aria-invalid'),'true');
 get('sn').value='<img src=x onerror=alert(1)>';get('student-gender').value='boy';get('ad').value='Example city';get('ge').value='4';const h=d.querySelector('[name=lv][value=Hifz]');h.checked=true;change(h);next();checkPanel(0);
 get('ge').value='10';next();checkPanel(0);assert.equal(get('hifz-progress').getAttribute('aria-invalid'),'true');get('hifz-progress').value='৩ পারা';next();checkPanel(1);
 get('gn').value='Parent';get('gr').value='father';get('wa').value='bad';get('em').value='not-an-email';next();checkPanel(1);
 get('wa').value='+8801700000000';get('em').value='parent@example.test';next();checkPanel(2);next();checkPanel(2);assert.equal(get('pkg').getAttribute('aria-invalid'),'true');
 const plan=d.querySelector('[name=pkg][value=Standard]');plan.checked=true;change(plan);get('fee-start').value='2001-01-01';change(get('fee-start'));next();checkPanel(2);assert.equal(get('fee-error').hidden,false);
 get('fee-mode').value='next';change(get('fee-mode'));assert.equal(JSON.parse(get('fee-quote').value).bdtMinor,199900);next();checkPanel(3);
 const specific=d.querySelector('[name=schedule-mode][value=specific]');specific.checked=true;change(specific);next();checkPanel(3);assert.equal(get('schedule-error').hidden,false);
 d.querySelector('[data-start="18:00"]').click();next();checkPanel(4);next();checkPanel(4);assert.equal(get('c1').checked,false);
 get('c1').checked=true;next();checkPanel(5);await tick();assert.match(get('admission-review-values').textContent,/Standard/);assert.match(get('admission-review-values').textContent,/৩ পারা/);assert.match(get('admission-review-values').textContent,/parent@example.test/);assert.equal(get('admission-review-values').querySelector('img'),null);
 // Back/edit preserves all values; returning to a later visited step revalidates prerequisites.
 get('admission-review-values').querySelector('button').click();checkPanel(0);assert.equal(get('hifz-progress').value,'৩ পারা');get('sn').value='';d.querySelector('[data-adm-target=adm-review]').click();checkPanel(0);
 get('sn').value='Student';d.querySelector('[data-adm-target=adm-review]').click();checkPanel(5);
 get('fm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));checkPanel(5);assert.equal(get('k2').getAttribute('aria-invalid'),'true');assert.equal(get('admission-submit-status').hidden,true);
 get('c2').checked=true;get('c3').checked=true;get('fm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));checkPanel(5);assert.equal(get('admission-submit-status').hidden,false);assert.match(get('admission-submit-status').textContent,/জমা হয়নি/);assert.equal(get('rf').textContent,'');
 d.documentElement.lang='en';await tick();assert.match(get('wizard-position').textContent,/Step 6 \/ 6/);assert.equal(get('gn').value,'Parent');
 get('wizard-prev').click();checkPanel(4);get('wizard-prev').click();checkPanel(3);assert.equal(get('schedule-start').value,'18:00');
 const flexible=d.querySelector('[name=schedule-mode][value=flexible]');flexible.checked=true;change(flexible);next();checkPanel(4);next();checkPanel(5);
 w.admissionWizard.go('adm-student');get('fm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));checkPanel(1);assert.equal(get('admission-submit-status').hidden,true);
 get('fm').reset();await tick();await tick();checkPanel(0);assert.equal(get('gn').value,'');assert.equal(get('c1').checked,false);assert.equal(get('c3').checked,false);assert.equal(d.querySelector('[data-adm-target=adm-review]').disabled,true);
 w.eval(read('reviews.js'));get('rv-name').value='Parent';get('rv-ct').value='BD';get('rv-tx').value='A learning experience worth sharing';get('rv-c').checked=true;get('rvf').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(get('rvf').hidden,false);assert.equal(get('review-submit-status').hidden,false);
 console.log('PASS: six-step gating, Hifz/guardian/date/time validation, rules preview/consent, safe final review, edit/back retention, revalidation, language switch, Enter behavior, reset and honest unconnected submission.');w.close();
})().catch(e=>{console.error(e);process.exitCode=1;w.close();});
