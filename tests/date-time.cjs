// Date and time editing regressions; requires jsdom via NODE_PATH.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=name=>fs.readFileSync(path.join(root,'assets/js',name),'utf8'),tick=()=>new Promise(r=>setTimeout(r,0));
function setup(fixed){const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://school.test/#/admission'}),w=dom.window,d=w.document;
 const Original=w.Date;w.Date=class extends Original{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return new Original(fixed).getTime();}};
 w.chosen=['Basic','','',1499,999,5,12.99,8.99];w.sel=()=>w.chosen;const get=id=>d.getElementById(id),change=el=>el.dispatchEvent(new w.Event('change',{bubbles:true}));
 for(const file of ['fee-core.js','fee-ui.js','schedule.js'])w.eval(source(file));return{dom,w,d,get,change};}
(async()=>{
 for(const [fixed,today,tomorrow,next] of [
  ['2026-10-21T06:00:00Z','2026-10-21','2026-10-22','2026-11-01'],
  ['2026-10-31T06:00:00Z','2026-10-31','2026-11-01','2026-11-01'],
  ['2026-12-31T06:00:00Z','2026-12-31','2027-01-01','2027-01-01'],
  ['2028-02-28T06:00:00Z','2028-02-28','2028-02-29','2028-03-01'],
  ['2026-10-20T18:05:00Z','2026-10-21','2026-10-22','2026-11-01']]){
  const {dom,w,d,get,change}=setup(fixed),date=get('fee-start');assert.equal(date.tagName,'SELECT');assert.equal(date.value,today);assert.equal(date.disabled,false);
  const initial=JSON.parse(get('fee-quote').value);assert.equal(initial.feeDate,today);assert.equal(initial.startDate,today);assert.equal(date.options[date.options.length-1].value,next);
  d.querySelector('[data-fee-date=tomorrow]').click();assert.equal(date.value,tomorrow);assert.equal(get('fee-mode').value,tomorrow===next?'next':'current');
  assert.equal(d.querySelector('[data-fee-date=next]').hidden,tomorrow===next);
  get('fee-mode').value='next';change(get('fee-mode'));assert.equal(date.value,next);assert.equal(JSON.parse(get('fee-quote').value).bdtMinor,99900);
  // Edit straight from the next-month selection; no locked native date control.
  date.value=today;change(date);assert.equal(get('fee-mode').value,'current');assert.equal(JSON.parse(get('fee-quote').value).bdtMinor,initial.bdtMinor);
  if(tomorrow!==next){date.value=tomorrow;change(date);assert.equal(JSON.parse(get('fee-quote').value).bdtMinor,initial.bdtMinor);get('fee-mode').value='next';change(get('fee-mode'));get('fee-mode').value='current';change(get('fee-mode'));assert.equal(date.value,tomorrow);}
  const before=date.value;d.documentElement.lang='en';await tick();assert.equal(date.value,before);assert.match(date.selectedOptions[0].textContent,/2026|2027|2028/);assert.equal(JSON.parse(get('fee-quote').value).startDate,before);
  date.value='';change(date);assert.equal(w.admissionFee.validate(),false);assert.equal(get('fee-error').hidden,false);assert.equal(w.admissionFee.invalidField(),date);
  get('fm').reset();await tick();assert.equal(date.value,today);assert.equal(get('fee-error').hidden,true);assert.equal(w.localStorage.length,0);dom.window.close();
 }
 const {dom,w,d,get,change}=setup('2026-10-21T06:00:00Z'),s=id=>get('schedule-'+id),set=(id,value)=>{s(id).value=value;change(s(id));};
 const specific=d.querySelector('[name=schedule-mode][value=specific]');specific.checked=true;change(specific);
 set('start-hour','6');assert.equal(s('start-minute').value,'0');assert.equal(s('start').value,'06:00');set('start-minute','5');set('start-period','PM');assert.equal(s('start').value,'18:05');
 // A minute selected before its hour survives language and format changes.
 set('end-minute','45');assert.equal(s('end').value,'');d.documentElement.lang='en';await tick();assert.equal(s('end-minute').value,'45');set('format','24');assert.equal(s('end-minute').value,'45');assert.equal(s('start-hour').value,'18');assert.equal(s('start').value,'18:05');assert.equal(s('start-period-field').hidden,true);
 set('format','12');assert.equal(s('start-hour').value,'6');assert.equal(s('start-period').value,'PM');set('end-period','PM');set('end-hour','9');assert.equal(s('end').value,'21:45');assert.equal(w.admissionSchedule.validate(),true);
 d.querySelector('[data-time-side=start][data-time-delta="15"]').click();assert.equal(s('start').value,'18:20');d.querySelector('[data-time-side=start][data-time-delta="-15"]').click();assert.equal(s('start').value,'18:05');
 set('format','24');set('start-hour','0');set('start-minute','0');assert.equal(d.querySelector('[data-time-side=start][data-time-delta="-15"]').disabled,true);
 set('end-hour','23');set('end-minute','50');assert.equal(d.querySelector('[data-time-side=end][data-time-delta="15"]').disabled,true);assert.equal(s('end').value,'23:50');
 set('start-hour','23');set('start-minute','55');assert.equal(w.admissionSchedule.validate(),false);
 const flexible=d.querySelector('[name=schedule-mode][value=flexible]');flexible.checked=true;change(flexible);assert.equal(w.admissionSchedule.validate(),true);specific.checked=true;change(specific);assert.equal(s('end').value,'23:50');
 get('fm').reset();await tick();assert.equal(s('start').value,'');assert.equal(s('end-minute').value,'');assert.equal(s('format').value,'12');assert.equal(w.localStorage.length,0);dom.window.close();
 console.log('PASS: friendly editable dates, shortcuts, day/month/year and leap boundaries, Dhaka dates, fee preservation, date reset/focus, exact-hour defaults, partial time retention, 12/24h, ±15-minute bounds and same-day validation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
