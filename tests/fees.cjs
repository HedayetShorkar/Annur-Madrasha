const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),calc=require('../assets/js/fee-core.js');
assert.deepEqual(calc(99900,'2026-10-15'),{total:31,remaining:17,amountMinor:54784});
assert.equal(calc(199900,'2026-11-01').amountMinor,199900);
for(const amount of [99900,199900,299900]) {
 for(const day of ['01','02','07'])assert.equal(calc(amount,'2026-10-'+day).amountMinor,amount);
 assert.equal(calc(amount,'2026-10-08').amountMinor,Math.round(amount*24/31));
}

assert.deepEqual(calc(299900,'2028-02-29'),{total:29,remaining:1,amountMinor:10341});
assert.equal(calc(99900,'2026-02-28').remaining,1);
for(const date of ['2026-02-29','2026-13-01','2026-10-00','invalid'])assert.throws(()=>calc(99900,date));
const {JSDOM}=require('jsdom');const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{runScripts:'outside-only'}),w=dom.window,d=w.document;
const app=fs.readFileSync(path.join(root,'assets/js/app.js'),'utf8');
w.eval(app.slice(app.indexOf('const pk='),app.indexOf('const S='))+';window.sel=()=>window.chosen;');
w.chosen=['Basic','','',1499,999,5,12.99,8.99];
for(const file of ['fee-core.js','fee-ui.js'])w.eval(fs.readFileSync(path.join(root,'assets/js',file),'utf8'));
const get=id=>d.getElementById(id),change=el=>el.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.ok(JSON.parse(get('fee-quote').value).bdtMinor>0);
get('fee-mode').value='next';change(get('fee-mode'));
assert.equal(JSON.parse(get('fee-quote').value).bdtMinor,99900);assert.equal(get('fee-start').tagName,'SELECT');assert.equal(get('fee-start').disabled,false);assert.match(get('fee-start').value,/-01$/);
w.chosen=['Premium','','',3499,2999,6,28.99,24.99];change(get('fee-start'));assert.equal(JSON.parse(get('fee-quote').value).bdtMinor,299900);
get('fee-mode').value='current';change(get('fee-mode'));get('fee-start').value='2001-01-01';change(get('fee-start'));assert.equal(get('fee-quote').value,'');
const e=new w.Event('submit',{bubbles:true,cancelable:true});get('fm').dispatchEvent(e);assert.equal(e.defaultPrevented,true);assert.equal(get('fee-error').hidden,false);
assert.match(get('k1').textContent,/নিজ দায়িত্বে/);assert.ok(get('read-admission-rules'));assert.equal(get('student-gender').required,true);assert.deepEqual(Array.from(get('student-gender').options,o=>o.value),['','boy','girl']);dom.window.close();
console.log('PASS: 28/29/30/31-day months, inclusive days, rounding, invalid dates, next-month full fee, package change and invalid-submit blocking.');
