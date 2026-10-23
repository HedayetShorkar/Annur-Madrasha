// Parent review UI. No publishing endpoint is configured: drafts stay in memory.
(function(){
 'use strict';
 const get=id=>document.getElementById(id),dialog=get('rvd'),form=get('rvf');
 if(!dialog||!form)return;
 const opener=get('rvo'),name=get('rv-name'),country=get('rv-ct'),text=get('rv-tx'),consent=get('rv-c'),preview=get('review-draft-preview'),status=get('review-submit-status');
 const radios=[...form.querySelectorAll('[name="rv-st"]')],bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
 const ratings=[['',''],['উন্নতি প্রয়োজন','Needs improvement'],['আরও ভালো হতে পারে','Could be better'],['সন্তোষজনক','Satisfactory'],['ভালো','Good'],['খুব ভালো','Very good']];
 function pair(element,bangla,english){element.replaceChildren();for(const [lang,value] of [['bn',bangla],['en',english]]){const i=document.createElement('i');i.className=lang;i.textContent=value;element.append(i);}}
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
 form.addEventListener('submit',event=>{event.preventDefault();status.hidden=true;if(!validate(true))return;status.hidden=false;status.focus();});
 counter();syncRating();
})();
