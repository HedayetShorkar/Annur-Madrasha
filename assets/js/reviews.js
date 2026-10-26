// Guardian feedback: private submission, moderated public feed, in-memory drafts.
(function(){
 'use strict';
 const get=id=>document.getElementById(id),dialog=get('rvd'),form=get('rvf');
 if(!dialog||!form)return;
 const opener=get('rvo'),name=get('rv-name'),country=get('rv-ct'),text=get('rv-tx'),consent=get('rv-c'),preview=get('review-draft-preview'),status=get('review-submit-status');
 const cfg=window.AnNoorBackend,connected=location.protocol!=='file:'&&!!cfg?.url&&!!cfg.publishableKey;
 let sending=false,sent=false,lastBody='',requestId='',requestLanguage='';
 const radios=[...form.querySelectorAll('[name="rv-st"]')],bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
 const ratings=[['',''],['উন্নতি প্রয়োজন','Needs improvement'],['আরও ভালো হতে পারে','Could be better'],['সন্তোষজনক','Satisfactory'],['ভালো','Good'],['খুব ভালো','Very good']];
 function pair(element,bangla,english){element.replaceChildren();for(const [lang,value] of [['bn',bangla],['en',english]]){const i=document.createElement('i');i.className=lang;i.textContent=value;element.append(i);}}
 async function api(route,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch(cfg.url+'/functions/v1/admissions/'+route,{method:body?'POST':'GET',headers:{apikey:cfg.publishableKey,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal}),data=await response.json();if(!response.ok)throw Error(data.error||'UNAVAILABLE');return data;}finally{clearTimeout(timer);}
 }
 if(connected){
  get('rv-sb').disabled=false;
  pair(dialog.querySelector('.review-availability'),'মতামত কর্তৃপক্ষের অনুমোদনের পর এই পেজে প্রকাশিত হবে।','Feedback appears here after approval by the administration.');
  pair(get('review-submit-note'),'কেবল নিজের বাস্তব অভিজ্ঞতা জানাবেন।','Please share your own real experience.');
 }else{
  pair(dialog.querySelector('.review-availability'),'অনলাইন সংযোগ ছাড়া খসড়া লিখে প্রিভিউ দেখা ও কপি করা যাবে।','Without an online connection, you can preview and copy a draft.');
 }
 const selected=()=>Number(radios.find(r=>r.checked)?.value||0);
 function paintRating(value){radios.forEach(r=>r.nextElementSibling.classList.toggle('is-filled',Number(r.value)<=value));}
 function syncRating(){const value=selected();paintRating(value);get('review-clear-rating').hidden=!value;pair(get('review-rating-label'),value?bn(value)+' / ৫ — '+ratings[value][0]:'চাইলে ১ থেকে ৫ স্টারে মূল্যায়ন করতে পারেন।',value?value+' / 5 — '+ratings[value][1]:'Optionally choose a rating from 1 to 5 stars.');if(!preview.hidden)renderPreview();}
 function counter(){pair(get('review-character-count'),bn(text.value.length)+' / ৬০০',text.value.length+' / 600');}
 const fields=[{input:name,error:'rv-name-error',invalid:()=>!name.value.trim()||name.value.length>80},{input:country,error:'rv-country-error',invalid:()=>!country.value.trim()||country.value.length>60},{input:text,error:'rv-text-error',invalid:()=>text.value.trim().length<10||text.value.length>600}];
 function mark(field,invalid){field.input.classList.toggle('bad',invalid);field.input.setAttribute('aria-invalid',String(invalid));get(field.error).hidden=!invalid;}
 function validate(publishing=false){let first=null;for(const field of fields){const invalid=field.invalid();mark(field,invalid);if(invalid&&!first)first=field.input;}
  const invalid=publishing&&!consent.checked;get('rv-k').classList.toggle('bad',invalid);consent.setAttribute('aria-invalid',String(invalid));get('rv-consent-error').hidden=!invalid;if(invalid&&!first)first=consent;
  if(first){first.focus();return false;}return true;
 }
 function renderPreview(){
  get('review-draft-name').textContent=name.value.trim();get('review-draft-country').textContent=country.value.trim();get('review-draft-text').textContent=text.value.trim();
  const value=selected(),stars=get('review-draft-stars');stars.hidden=!value;pair(stars,'★'.repeat(value)+'☆'.repeat(5-value)+' · '+bn(value)+' / ৫','★'.repeat(value)+'☆'.repeat(5-value)+' · '+value+' / 5');
  const initial=Array.from(name.value.trim())[0]||'';get('review-draft-avatar').textContent=initial.toLocaleUpperCase();
 }
 opener.addEventListener('click',()=>{if(!dialog.open){dialog.showModal();dialog.scrollTop=0;name.focus();}});
 dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('.dx2'))dialog.close();});
 dialog.addEventListener('close',()=>opener.focus({preventScroll:true}));
 for(const field of fields)field.input.addEventListener('input',()=>{mark(field,false);status.hidden=true;get('review-copy-status').hidden=true;if(field.input===text)counter();if(!preview.hidden)renderPreview();});
 consent.addEventListener('change',()=>{get('rv-k').classList.remove('bad');get('rv-consent-error').hidden=true;consent.setAttribute('aria-invalid','false');status.hidden=true;});
 for(const radio of radios){radio.addEventListener('change',()=>{syncRating();status.hidden=true;get('review-copy-status').hidden=true;});radio.nextElementSibling.addEventListener('pointerenter',()=>paintRating(Number(radio.value)));}
 form.querySelector('.stars').addEventListener('pointerleave',()=>paintRating(selected()));
 get('review-clear-rating').addEventListener('click',()=>{radios.forEach(r=>{r.checked=false;});syncRating();radios[0].focus();});
 get('review-preview-button').addEventListener('click',()=>{status.hidden=true;if(!validate())return;renderPreview();preview.hidden=false;preview.focus({preventScroll:true});preview.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});});
 get('review-edit').addEventListener('click',()=>{preview.hidden=true;text.focus();});
 get('review-copy').addEventListener('click',async()=>{
  if(!validate())return;
  const english=document.documentElement.lang==='en',rating=selected();
  const value=[english?'Parent review':'অভিভাবকের মতামত',name.value.trim(),country.value.trim(),rating?(english?'Rating: ':'রেটিং: ')+rating+'/5':'',text.value.trim()].filter(Boolean).join('\n');
  const result=get('review-copy-status');
  try{if(!navigator.clipboard?.writeText)throw Error('CLIPBOARD_UNAVAILABLE');await navigator.clipboard.writeText(value);pair(result,'লেখা কপি হয়েছে। কোথাও জমা বা প্রকাশ করা হয়নি।','Review text copied. It has not been submitted or published.');}
  catch{pair(result,'কপি করা যায়নি। আপনার লেখাটি নির্বাচন করে কপি করতে পারেন।','Could not copy. You can select and copy your text manually.');}
  result.hidden=false;
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||sent)return;status.hidden=true;if(!validate(true))return;
  if(!connected){pair(status,'অনলাইন সংযোগ নেই। মতামত জমা হয়নি; লেখা ফর্মেই আছে।','Not connected online. Feedback has not been submitted; your text remains.');status.hidden=false;status.focus();return;}
  const body={guardian_name:name.value.trim(),country:country.value.trim(),review:text.value.trim(),rating:selected()||null,publish_consent:true,language:document.documentElement.lang==='en'?'en':'bn',website:get('rv-hp').value.trim()},serial=JSON.stringify({...body,language:''});
  if(serial!==lastBody){requestId=window.AnNoorRequestId?.();if(!requestId){pair(status,'ব্রাউজারটি আপডেট করে আবার চেষ্টা করুন। মতামত জমা হয়নি; লেখা ফর্মেই আছে।','Update your browser and retry. Feedback was not submitted; your text remains.');status.hidden=false;status.focus();return;}lastBody=serial;requestLanguage=body.language;}body.language=requestLanguage;
  sending=true;get('rv-sb').disabled=true;form.setAttribute('aria-busy','true');pair(status,'মতামত পাঠানো হচ্ছে…','Sending your feedback…');status.hidden=false;
  try{
   const data=await api('review-submit',{...body,request_id:requestId});
   if(!/^ANR-[A-F0-9]{32}$/.test(data.reference||'')||!['PENDING','APPROVED','REJECTED'].includes(data.status))throw Error('UNAVAILABLE');
   sent=true;pair(get('rv-sb'),'জমা হয়েছে','Submitted');pair(status,'মতামত জমা হয়েছে। নম্বর: '+data.reference+'। অনুমোদনের পর প্রকাশিত হবে।','Feedback received. Reference: '+data.reference+'. It will be published after approval.');
  }catch(error){pair(status,error.message==='RATE_LIMITED'?'বেশ কয়েকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।':'জমা নিশ্চিত হয়নি। লেখা ফর্মেই আছে; নিরাপদে আবার চেষ্টা করা যাবে।',error.message==='RATE_LIMITED'?'Too many attempts. Please try again later.':'Submission could not be confirmed. Your text remains; you can safely retry.');}
  finally{sending=false;get('rv-sb').disabled=sent;form.removeAttribute('aria-busy');status.focus();}
 });
 // Only the server's approved, consented projection is used. Never create testimonials from drafts.
 const feed=get('rvt'),feedStatus=get('review-feed-status'),more=get('review-more'),retry=get('review-retry'),tools=get('review-feed-tools');
 const emptyState=feed?.querySelector('.review-empty-state')?.cloneNode(true);
 let published=[],total=0,nextOffset=0,loading=false,loaded=false;
 function count(){if(get('review-feed-count'))pair(get('review-feed-count'),bn(published.length)+' / '+bn(total)+'টি মতামত',published.length+' / '+total+' reviews');}
 function arrows(){if(!feed||!tools)return;get('review-prev').disabled=feed.scrollLeft<2;get('review-next').disabled=feed.scrollLeft+feed.clientWidth>=feed.scrollWidth-2;}
 function renderFeed(){
  feed.replaceChildren();feed.hidden=false;feed.classList.add('has-published');feed.setAttribute('role','list');
  for(const item of published){
   const card=document.createElement('article');card.className='review-published-card';card.setAttribute('role','listitem');
   const author=document.createElement('div');author.className='review-published-author';
   const avatar=document.createElement('span');avatar.className='review-published-avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=(Array.from(item.name)[0]||'').toLocaleUpperCase();
   const identity=document.createElement('div'),heading=document.createElement('h4'),place=document.createElement('small');heading.textContent=item.name;place.textContent=item.country;identity.append(heading,place);author.append(avatar,identity);card.append(author);
   if(item.rating!==null){const stars=document.createElement('div');stars.className='review-published-rating';stars.textContent='★'.repeat(item.rating)+'☆'.repeat(5-item.rating);stars.setAttribute('aria-label',item.rating+' / 5');card.append(stars);}
   const quote=document.createElement('blockquote');quote.textContent=item.text;card.append(quote);feed.append(card);
  }
  tools.hidden=published.length<2;more.hidden=nextOffset>=total;count();arrows();
 }
 async function loadFeed(reset=false){
  if(!connected||!feed||loading)return;loading=true;more.disabled=true;retry.hidden=true;pair(feedStatus,'প্রকাশিত মতামত দেখা হচ্ছে…','Loading published feedback…');feedStatus.hidden=false;
  try{
   const data=await api('published-reviews?offset='+(reset?0:nextOffset));
   if(!Array.isArray(data.items)||data.items.length>6||!Number.isInteger(data.total)||data.total<0)throw Error('UNAVAILABLE');
   for(const x of data.items)if(!x||typeof x.id!=='string'||!/^[-0-9a-f]{36}$/i.test(x.id)||typeof x.name!=='string'||x.name.length>80||typeof x.country!=='string'||x.country.length>60||typeof x.text!=='string'||x.text.length>600||x.rating!==null&&(!Number.isInteger(x.rating)||x.rating<1||x.rating>5))throw Error('UNAVAILABLE');
   if(reset){published=[];nextOffset=0;}nextOffset+=data.items.length;const known=new Set(published.map(x=>x.id));for(const item of data.items)if(!known.has(item.id)){known.add(item.id);published.push(item);}total=data.total;if(!data.items.length)nextOffset=total;loaded=true;
   if(published.length)renderFeed();else{feed.replaceChildren(...(emptyState?[emptyState.cloneNode(true)]:[]));feed.classList.remove('has-published');feed.removeAttribute('role');feed.hidden=false;tools.hidden=true;more.hidden=true;}
   feedStatus.hidden=true;
  }catch{pair(feedStatus,'মতামত এখন দেখা যাচ্ছে না। কিছুক্ষণ পরে আবার দেখা যাবে।','Feedback could not be loaded. Please try again shortly.');retry.hidden=false;if(!published.length)feed.hidden=true;}
  finally{loading=false;more.disabled=false;}
 }
 if(feed&&more&&retry&&tools){
  more.addEventListener('click',()=>loadFeed());retry.addEventListener('click',()=>loadFeed(true));
  for(const [id,direction]of [['review-prev',-1],['review-next',1]])get(id).addEventListener('click',()=>feed.scrollBy({left:direction*(feed.querySelector('article')?.getBoundingClientRect().width||feed.clientWidth)+direction*12,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'}));
  feed.addEventListener('scroll',arrows,{passive:true});addEventListener('resize',arrows);
  new MutationObserver(count).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  if(connected){if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!loaded){loadFeed();observer.disconnect();}},{rootMargin:'240px'});observer.observe(get('reviews'));}else loadFeed();}
 }
 counter();syncRating();
})();
