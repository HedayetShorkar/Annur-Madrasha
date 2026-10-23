// Requires jsdom. Run: NODE_PATH=/path/to/node_modules node tests/portable-classroom.cjs
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),htmlPath=path.join(root,'live/index.html'),html=fs.readFileSync(htmlPath,'utf8');
const main=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(main.includes('href="live/index.html"'));
assert.ok(!main.includes('href="live/"'));
assert.ok(!html.includes('type="module"'));assert.match(html,/<script defer src="\.\/assets\//);
const {pathToFileURL}=require('node:url');
const entry=html.match(/<script defer src="([^"]+)"/)[1];
const script=fs.readFileSync(path.resolve(root,'live',entry),'utf8');
assert.ok(fs.existsSync(new URL(entry,pathToFileURL(htmlPath))));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function options(url,fetch){const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='css-parsing')errors.push(e.message);});return{url,runScripts:'outside-only',virtualConsole:vc,beforeParse(w){w.fetch=fetch;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});},errors};}
(async()=>{
 let calls=0;const localOptions=options(pathToFileURL(htmlPath).href,async()=>{calls++;throw Error('Must not send local preview credentials');});
 const local=new JSDOM(html,localOptions);local.window.eval(script);await delay(300);
 assert.match(local.window.document.body.textContent,/ক্লাসে প্রবেশ/);assert.match(local.window.document.body.textContent,/কম্পিউটার থেকে পেজটি দেখছেন/);
 assert.equal(local.window.document.querySelector('form button').disabled,true);assert.equal(calls,0);assert.deepEqual(localOptions.errors,[]);local.window.close();
 const hostedOptions=options('https://school.example/nested/live/index.html',async url=>{assert.equal(url,'/api/live/me');return{ok:false,json:async()=>({error:'LOGIN_REQUIRED'})};});
 const hosted=new JSDOM(html,hostedOptions);hosted.window.eval(script);await delay(300);
 assert.match(hosted.window.document.body.textContent,/ক্লাসে প্রবেশ/);assert.equal(hosted.window.document.querySelector('.setup-status'),null);assert.equal(hosted.window.document.querySelector('form button').disabled,false);assert.deepEqual(hostedOptions.errors,[]);hosted.window.close();
 console.log('PASS: compiled classic entry executes with file:// and hosted-subfolder URLs; local preview sends no API calls; hosted login remains enabled.');
})().catch(e=>{console.error(e);process.exitCode=1;});
