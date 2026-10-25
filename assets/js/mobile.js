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
 const viewport=window.visualViewport;let baseline=viewport?.height||innerHeight;
 const editable=el=>el?.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select');
 function sync(){
  const height=viewport?.height||innerHeight,focused=editable(document.activeElement);
  if(!focused)baseline=height;
  const keyboard=!!focused&&baseline-height>140;
  root.classList.toggle('keyboard-open',keyboard);
  const home=!location.hash.startsWith('#/'),modal=!!document.querySelector('dialog[open]');
  bar.hidden=!home||modal||keyboard;
  document.body.classList.toggle('has-mobile-quick',home);
  bar.querySelectorAll('a').forEach(a=>{if(a.getAttribute('href')===location.hash)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 }
 addEventListener('hashchange',sync);document.addEventListener('annoor:route',sync);
 document.addEventListener('focusin',sync);document.addEventListener('focusout',()=>setTimeout(sync,0));
 viewport?.addEventListener('resize',sync);addEventListener('resize',sync);
 const observer=new MutationObserver(sync);document.querySelectorAll('dialog').forEach(dialog=>observer.observe(dialog,{attributes:true,attributeFilter:['open']}));
 sync();
})();
