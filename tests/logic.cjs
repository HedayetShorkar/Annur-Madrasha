const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const preferences=fs.readFileSync(path.join(root,'assets/js/preferences.js'),'utf8');
for(const scenario of [
 {system:false,saved:{},theme:'light',lang:'bn'},
 {system:false,saved:{'annoor-theme':'dark'},theme:'dark',lang:'bn'},
 {system:true,saved:{},theme:'light',lang:'bn'},
 {system:true,saved:{'annoor-theme':'light','annoor-language':'en'},theme:'light',lang:'en'},
 {system:false,saved:{'annoor-theme':'invalid','annoor-language':'xx'},theme:'light',lang:'bn'},
 {system:true,blocked:true,theme:'light',lang:'bn'}
]){
 const html={dataset:{},style:{},lang:'bn'};
 vm.runInNewContext(preferences,{document:{documentElement:html},matchMedia:()=>({matches:scenario.system}),localStorage:{getItem:k=>{if(scenario.blocked)throw Error('Storage blocked');return scenario.saved[k]}}});
 assert.equal(html.dataset.theme,scenario.theme);assert.equal(html.lang,scenario.lang);assert.equal(html.style.colorScheme,scenario.theme);
}
const app=fs.readFileSync(path.join(root,'assets/js/app.js'),'utf8');
const timeLogic=app.slice(app.indexOf('const part='),app.indexOf('const ck='));
for(const [date,expected] of [['2026-01-15T12:00:00Z',6],['2026-07-15T12:00:00Z',5]]){
 const delta=vm.runInNewContext(timeLogic+`;const t=Date.parse('${date}');(off('Asia/Dhaka',t)-off('Europe/London',t))/60;`);
 assert.equal(delta,expected);
}
const packages=app.slice(app.indexOf('const pk='),app.indexOf('const cur='));
const result=vm.runInNewContext(packages+';({pk,INC})');
assert.equal(result.pk.length,3);assert.deepEqual(Array.from(result.pk,p=>p[4]),[999,1999,2999]);
assert.ok(result.INC.every(row=>row.length===5));
console.log('PASS: 6 preference scenarios (including blocked storage); winter/summer IANA conversion; retained plan prices and subject matrix.');
