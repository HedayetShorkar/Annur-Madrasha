// Mobile navigation and keyboard layout only. No analytics or personal storage.
(()=>{
 const language=document.getElementById('guide-language');
 if(language){
  const syncLanguage=()=>{
   const bn=document.documentElement.lang==='bn',title=bn?'শিশুদের অনলাইন কুরআন শিক্ষা: ভর্তি ও ক্লাসের সহায়িকা | আননূর':'Online Quran Classes: Admission & Phone Guide | An-Noor';
   const description=bn?'৫–১৮ বছরের শিক্ষার্থীর অনলাইন কুরআন ক্লাসের প্রস্তুতি, পড়ার স্তর, প্যাকেজ, মাসিক ফি ও ভর্তি আবেদন সম্পর্কে অভিভাবকদের সহজ সহায়িকা।':'A parent guide to phone preparation, learning levels, monthly fees, schedules and online Quran admission for learners aged 5–18.';
   language.textContent=bn?'English':'বাংলা';language.setAttribute('aria-label',bn?'Read this guide in English':'সহায়িকাটি বাংলায় পড়ুন');document.title=title;
   for(const [selector,value]of [['meta[name=description]',description],['meta[property="og:title"]',title],['meta[property="og:description"]',description],['meta[property="og:locale"]',bn?'bn_BD':'en_US']])document.querySelector(selector)?.setAttribute('content',value);
  };
  language.addEventListener('click',()=>{const root=document.documentElement;root.lang=root.lang==='bn'?'en':'bn';try{localStorage.setItem('annoor-language',root.lang);}catch{}syncLanguage();});syncLanguage();
 }
 const bar=document.querySelector('.mobile-quick'),root=document.documentElement;
 if(!bar)return;
 const viewport=window.visualViewport,phone=matchMedia('(max-width:600px)');let baseline=viewport?.height||innerHeight,queued=false;
 // Treat index.html and its directory URL as the same destination, including on the guide.
 const destination=link=>{const url=new URL(link.href,location.href);return url.origin+url.pathname.replace(/index\.html$/,'')+url.hash;};
 const destinations=new Set([...bar.querySelectorAll('a[href]')].map(destination));
 const inlineActions=[...document.querySelectorAll('a[href]')].filter(a=>!bar.contains(a)&&destinations.has(destination(a)));
 function inlineActionVisible(height){
  const top=Math.max(0,document.querySelector('.site-nav')?.getBoundingClientRect().bottom||0),bottom=height-76;
  return inlineActions.some(a=>{
   if(!a.getClientRects().length||getComputedStyle(a).visibility==='hidden')return false;
   const r=a.getBoundingClientRect(),visible=Math.min(r.bottom,bottom)-Math.max(r.top,top);
   return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&visible>=Math.min(28,r.height*.6);
  });
 }
 const editable=el=>el?.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select');
 function sync(){
  const height=viewport?.height||innerHeight,focused=editable(document.activeElement);
  if(!focused)baseline=height;
  const keyboard=!!focused&&baseline-height>140;
  root.classList.toggle('keyboard-open',keyboard);
  const home=!location.hash.startsWith('#/'),modal=!!document.querySelector('dialog[open]'),menuOpen=document.getElementById('menu-toggle')?.getAttribute('aria-expanded')==='true';
  root.classList.toggle('mobile-menu-open',phone.matches&&menuOpen);
  bar.hidden=!phone.matches||!home||modal||keyboard||menuOpen||inlineActionVisible(height);
  // Reserve the same space while scrolling so hiding the bar never shifts page content.
  document.body.classList.toggle('has-mobile-quick',home&&phone.matches);
  bar.querySelectorAll('a').forEach(a=>{if(a.getAttribute('href')===location.hash)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 }
 addEventListener('hashchange',sync);document.addEventListener('annoor:route',sync);
 document.addEventListener('focusin',sync);document.addEventListener('focusout',()=>setTimeout(sync,0));
 const scheduleSync=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;sync();});}};
 viewport?.addEventListener('resize',sync);addEventListener('resize',sync);addEventListener('scroll',scheduleSync,{passive:true});phone.addEventListener?.('change',sync);
 const observer=new MutationObserver(scheduleSync);document.querySelectorAll('dialog').forEach(dialog=>observer.observe(dialog,{attributes:true,attributeFilter:['open']}));
 const menuToggle=document.getElementById('menu-toggle');if(menuToggle)observer.observe(menuToggle,{attributes:true,attributeFilter:['aria-expanded']});
 observer.observe(root,{attributes:true,attributeFilter:['lang','data-theme']});
 sync();
})();
