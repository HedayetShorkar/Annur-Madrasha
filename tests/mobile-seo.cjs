// Real staged files and compiled/source DOM workflows; fictional domain and no telemetry.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8'),pause=()=>new Promise(r=>setTimeout(r,25));
async function stagedSeo(){
 const {prepareSeo}=await import('../scripts/prepare-seo.mjs'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'annoor-mobile-seo-')),publicDir=path.join(tmp,'public');
 try{
  execFileSync(process.execPath,[path.join(root,'live-class/scripts/stage-public.mjs'),publicDir]);
  for(const name of ['learn/index.html','404.html','robots.txt','live/index.html','payments/index.html','admin/index.html'])assert.ok(fs.existsSync(path.join(publicDir,name)),name);
  for(const name of ['live-class','supabase','original-backup','AnNoor_Payments.zip','.env'])assert.equal(fs.existsSync(path.join(publicDir,name)),false);
  const before=fs.readFileSync(path.join(publicDir,'index.html'),'utf8');assert.ok(!before.includes('rel="canonical"'));
  for(const url of ['http://school.test','https://school.test/path','https://user:password@school.test','https://school.test?x=1','https://school.test/#home','https://YOUR_REAL_DOMAIN','https://localhost','https://127.0.0.1','https://school\n.test'])await assert.rejects(prepareSeo({directory:publicDir,siteUrl:url}));
  assert.equal(fs.readFileSync(path.join(publicDir,'index.html'),'utf8'),before);
  await assert.rejects(prepareSeo({directory:root,siteUrl:'https://school.test'}));
  await prepareSeo({directory:publicDir,siteUrl:'https://school.test'});
  for(const [file,url]of [['index.html','https://school.test/'],['learn/index.html','https://school.test/learn/']]){
   const html=fs.readFileSync(path.join(publicDir,file),'utf8'),d=new JSDOM(html).window.document;
   assert.equal(d.querySelector('link[rel=canonical]').getAttribute('href'),url);assert.equal(d.querySelector('meta[property="og:url"]').content,url);assert.equal(d.querySelector('meta[property="og:image"]').content,'https://school.test/assets/images/brand-asset-1.webp');
   for(const el of d.querySelectorAll('script[type="application/ld+json"]'))JSON.parse(el.textContent);
   assert.ok(!html.includes('aggregateRating'));assert.ok(!html.includes('foundingDate'));
  }
  const sitemap=fs.readFileSync(path.join(publicDir,'sitemap.xml'),'utf8');assert.equal((sitemap.match(/<url>/g)||[]).length,2);assert.ok(!/live|payments|admin|#|lastmod/.test(sitemap));
  assert.match(fs.readFileSync(path.join(publicDir,'robots.txt'),'utf8'),/Sitemap: https:\/\/school.test\/sitemap.xml/);
  assert.match(fs.readFileSync(path.join(publicDir,'404.html'),'utf8'),/data-seo-home href="https:\/\/school.test\/"/);
  const snapshot=['index.html','learn/index.html','404.html','robots.txt','sitemap.xml'].map(f=>fs.readFileSync(path.join(publicDir,f),'utf8'));
  await prepareSeo({directory:publicDir,siteUrl:'https://school.test/'});assert.deepEqual(snapshot,['index.html','learn/index.html','404.html','robots.txt','sitemap.xml'].map(f=>fs.readFileSync(path.join(publicDir,f),'utf8')));
  const secret=path.join(tmp,'private.txt');fs.writeFileSync(secret,'unchanged');fs.unlinkSync(path.join(publicDir,'robots.txt'));fs.symlinkSync(secret,path.join(publicDir,'robots.txt'));
  await assert.rejects(prepareSeo({directory:publicDir,siteUrl:'https://other.test'}));assert.equal(fs.readFileSync(secret,'utf8'),'unchanged');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
function publicMarkup(){
 const d=new JSDOM(read('index.html')).window.document,guide=new JSDOM(read('learn/index.html')).window.document;
 assert.equal(d.querySelectorAll('#pg .pk2').length,3);assert.match(d.querySelector('#pg').textContent,/৯৯৯/);assert.match(d.querySelector('#pg').textContent,/শনিবার–বুধবার/);assert.match(d.querySelector('#pg').textContent,/শনিবার–বৃহস্পতিবার/);
 const prices=read('assets/js/app.js').slice(read('assets/js/app.js').indexOf('const pk='),read('assets/js/app.js').indexOf('const cur='));const plans=vm.runInNewContext(prices+';pk',{B:()=>''});
 for(const plan of plans){const article=[...guide.querySelectorAll('.guide-plans article')].find(x=>x.querySelector('h3').textContent===plan[0]);assert.ok(article);assert.match(article.textContent,new RegExp(plan[7].toFixed(2).replace('.','\\.')));assert.match(article.textContent,new RegExp(plan[4].toLocaleString('bn-BD')));}
 for(const page of [d,guide]){assert.equal(page.querySelectorAll('h1').length>=1,true);assert.ok(page.querySelector('meta[name=description]').content.length>50);assert.ok(page.querySelector('meta[name=viewport]').content.includes('viewport-fit=cover'));assert.equal(page.querySelectorAll('nav.mobile-quick a').length,3);}
 assert.ok(!d.querySelector('meta[name=keywords]'));assert.equal(d.querySelector('link[rel=preload][as=image]').getAttribute('href'),'assets/images/brand-asset-1.webp');
 assert.match(read('live-class/index.html'),/noindex,nofollow/);assert.match(read('payment-module/index.html'),/noindex,nofollow/);assert.match(read('admin/index.html'),/noindex,nofollow/);
 assert.ok(!read('index.html').includes('[Email: admin to add]'));
}
async function mobileAndDecorations(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(read('index.html'),{url:'https://school.test/#home',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document,observers=[],idle=[],intervals=[];let paints=0,hidden=false,vh=800,clockWrites=0;
 Object.defineProperty(w,'innerWidth',{value:390,writable:true});Object.defineProperty(d,'hidden',{get:()=>hidden,configurable:true});
 w.matchMedia=query=>({matches:/max-width/.test(query)&&!query.includes('reduced-motion'),addEventListener(){}});
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.HTMLMediaElement.prototype.pause=function(){};
 Object.defineProperty(w.HTMLElement.prototype,'offsetWidth',{get(){return this.closest('#pg-home[hidden]')?0:390;}});Object.defineProperty(w.HTMLElement.prototype,'offsetHeight',{get(){return {home:760,why:900,teachers:1500,global:800,packages:2200,faq:1800,reviews:900}[this.id]||500;}});
 d.fonts={load:async()=>{}};w.requestIdleCallback=fn=>{idle.push(fn);return idle.length;};w.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};w.clearInterval=()=>{};
 class IO{constructor(fn,options){this.fn=fn;this.options=options;this.targets=[];observers.push(this);}observe(el){this.targets.push(el);}unobserve(){}emit(el,isIntersecting){this.fn([{target:el,isIntersecting}]);}}
 w.IntersectionObserver=IO;
 w.HTMLCanvasElement.prototype.getContext=()=>({scale(){},measureText:text=>({width:text.length*10}),save(){},translate(){},rotate(){},fillText(){},restore(){}});w.HTMLCanvasElement.prototype.toDataURL=()=>{paints++;return 'data:image/png;base64,dGVzdA==';};
 const descriptor=Object.getOwnPropertyDescriptor(w.Element.prototype,'innerHTML'),clock=d.getElementById('clk-bd');Object.defineProperty(clock,'innerHTML',{get(){return descriptor.get.call(this);},set(value){clockWrites++;descriptor.set.call(this,value);}});
 const viewport=new w.EventTarget();Object.defineProperty(viewport,'height',{get:()=>vh});w.visualViewport=viewport;
 for(const file of ['preferences.js','fee-core.js','app.js','navigation.js','mobile.js'])w.eval(read('assets/js/'+file));await pause();
 assert.equal(paints,0);assert.equal(idle.length,1);idle.shift()();assert.equal(paints,1);assert.match(d.getElementById('annoor-patterns').textContent,/\.hero:before/);assert.ok(!d.getElementById('annoor-patterns').textContent.includes('#faq{'));
 const patterns=observers.find(x=>x.targets.some(el=>el.id==='faq')&&x.targets.some(el=>el.matches('footer')));assert.ok(patterns);patterns.emit(d.getElementById('faq'),true);assert.equal(idle.length,1);idle.shift()();assert.equal(paints,2);
 const before=paints;w.dispatchEvent(new w.Event('resize'));await new Promise(r=>setTimeout(r,450));assert.equal(paints,before);assert.equal(idle.length,0);
 const context=w.HTMLCanvasElement.prototype.getContext;w.HTMLCanvasElement.prototype.getContext=()=>{throw Error('Canvas disabled by browser preference');};patterns.emit(d.getElementById('reviews'),true);assert.doesNotThrow(()=>idle.shift()());assert.ok(d.getElementById('sn'));w.HTMLCanvasElement.prototype.getContext=context;
 // Deferred decoration must not restore the old dark review background over light-mode text.
 patterns.emit(d.getElementById('reviews'),true);idle.shift()();
 const reviewPattern=d.getElementById('annoor-patterns').textContent.match(/#reviews\{([^}]+)\}/)?.[1];
 assert.match(reviewPattern,/background-image:url/);assert.ok(!reviewPattern.includes('linear-gradient'));assert.ok(!reviewPattern.includes('background:'));
 assert.equal(clockWrites,1);const tick=intervals.find(x=>x.ms===1000);tick.fn();tick.fn();assert.equal(clockWrites,1);
 const clockObserver=observers.find(x=>x.targets.length===1&&x.targets[0].id==='global');clockObserver.emit(d.getElementById('global'),false);w.Date.now=()=>Date.parse('2026-10-25T12:34:00Z');tick.fn();assert.equal(clockWrites,1);clockObserver.emit(d.getElementById('global'),true);assert.equal(clockWrites,2);
 hidden=true;d.dispatchEvent(new w.Event('visibilitychange'));tick.fn();assert.equal(clockWrites,2);assert.ok(d.documentElement.hasAttribute('data-page-paused'));hidden=false;d.dispatchEvent(new w.Event('visibilitychange'));assert.ok(!d.documentElement.hasAttribute('data-page-paused'));
 const bar=d.querySelector('.mobile-quick');assert.equal(bar.hidden,false);w.location.hash='#/admission';w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(bar.hidden,true);w.location.hash='#home';w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(bar.hidden,false);
 // The phone shortcut must not repeat an action that is already readable on screen.
 const inline=d.querySelector('.hero .live-entry');let inlineTop=120;
 inline.getClientRects=()=>[{top:inlineTop,bottom:inlineTop+48,left:20,right:240,width:220,height:48}];inline.getBoundingClientRect=()=>inline.getClientRects()[0];
 w.dispatchEvent(new w.Event('scroll'));await pause();assert.equal(bar.hidden,true);
 inlineTop=900;w.dispatchEvent(new w.Event('scroll'));await pause();assert.equal(bar.hidden,false);
 // Opening the main menu hides the dock even when no inline action is in view.
 d.getElementById('menu-toggle').click();await pause();assert.equal(bar.hidden,true);assert.ok(d.documentElement.classList.contains('mobile-menu-open'));
 d.querySelector('.site-nav .brand').click();await pause();assert.equal(bar.hidden,false);assert.ok(!d.documentElement.classList.contains('mobile-menu-open'));
 // Recitation remains available from each teacher's profile, without repeated players on the homepage.
 assert.equal(d.querySelectorAll('#tg2 .ap').length,0);d.querySelector('#tg2 .vp').click();await pause();
 assert.ok(d.querySelector('dialog[open] .ap audio'));assert.ok(d.querySelector('dialog[open] .ld input[type=file]'));assert.equal(bar.hidden,true);
 d.querySelector('dialog[open]').close();await pause();assert.equal(bar.hidden,false);
 const dialog=d.querySelector('dialog');dialog.showModal();await pause();assert.equal(bar.hidden,true);dialog.close();await pause();assert.equal(bar.hidden,false);
 const input=d.createElement('textarea');d.body.append(input);input.focus();vh=460;viewport.dispatchEvent(new w.Event('resize'));assert.ok(d.documentElement.classList.contains('keyboard-open'));assert.equal(bar.hidden,true);input.blur();vh=800;viewport.dispatchEvent(new w.Event('resize'));assert.equal(bar.hidden,false);
 assert.equal(w.localStorage.getItem('annoor-language'),null);assert.deepEqual(errors,[]);dom.window.close();
}
(async()=>{publicMarkup();await stagedSeo();await mobileAndDecorations();console.log('PASS: no-JS plans and truthful SEO, domain-only canonical/sitemap generation, idempotency and private-file exclusion, lazy single-section decoration, keyboard-resize avoidance, minute-cached visible clock, duplicate-action/menu suppression, preserved teacher recitation and mobile navigation/dialog/keyboard isolation.');})().catch(error=>{console.error(error);process.exitCode=1;});
