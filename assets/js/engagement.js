// Public intake and a non-sensitive display hint. Classroom access is still server-authorized.
(()=>{
 'use strict';
 const root=document.documentElement,key='annoor-admission-submitted-v1';let submitted=false;
 try{submitted=localStorage.getItem(key)==='1';}catch{}
 function syncEntry(){
  document.querySelectorAll('[data-classroom-entry]').forEach(e=>e.hidden=!submitted);
  document.querySelectorAll('[data-trial-entry]').forEach(e=>e.hidden=submitted);
  root.dataset.admissionDevice=submitted?'submitted':'visitor';
  document.dispatchEvent(new Event('annoor:entry-change'));
 }
 document.addEventListener('annoor:admission-success',()=>{submitted=true;syncEntry();});
 addEventListener('storage',e=>{if(e.key===key||e.key===null){try{submitted=localStorage.getItem(key)==='1';}catch{submitted=false;}syncEntry();}});syncEntry();
 const get=id=>document.getElementById(id),dialog=get('trial-dialog'),form=get('trial-form');if(!dialog||!form)return;
 let pending=false,complete=false,last='',requestId='',requestLanguage='',opener=null;
 const pair=(el,bn,en)=>{el.replaceChildren();for(const [language,value]of [['bn',bn],['en',en]]){const node=document.createElement('i');node.className=language;node.textContent=value;el.append(node);}};
 const show=(bn,en)=>{pair(get('trial-status'),bn,en);get('trial-status').hidden=false;get('trial-status').focus();};
 const val=id=>get(id).value.trim();
 function language(){form.querySelectorAll('option[data-bn]').forEach(o=>o.textContent=o.dataset[root.lang==='en'?'en':'bn']);get('trial-phone').placeholder=root.lang==='en'?'+88017XXXXXXXX or your country code':'+88017XXXXXXXX অথবা দেশের কোডসহ';}
 language();new MutationObserver(language).observe(root,{attributes:true,attributeFilter:['lang']});
 document.querySelectorAll('[data-trial-open]').forEach(button=>button.addEventListener('click',()=>{opener=button;dialog.showModal();dialog.scrollTop=0;get('trial-student').focus();}));
 get('trial-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 form.addEventListener('input',e=>{e.target.removeAttribute('aria-invalid');get('trial-error').hidden=true;if(!pending&&!complete)get('trial-status').hidden=true;});
 get('trial-another').addEventListener('click',()=>{form.reset();complete=false;last='';requestId='';get('trial-submit').disabled=false;get('trial-status').hidden=true;get('trial-another').hidden=true;get('trial-student').focus();});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(pending||complete)return;
  const age=Number(val('trial-age')),phone=val('trial-phone').replace(/[\s-]/g,''),fields=[['trial-student',!val('trial-student')||val('trial-student').length>120],['trial-age',!Number.isInteger(age)||age<5||age>18],['trial-guardian',!val('trial-guardian')||val('trial-guardian').length>120],['trial-phone',!/^\+?[0-9]{7,15}$/.test(phone)],['trial-level',!val('trial-level')],['trial-time',val('trial-time').length>240],['trial-consent',!get('trial-consent').checked]];
  fields.forEach(([id,invalid])=>get(id).setAttribute('aria-invalid',String(invalid)));
  const first=fields.find(x=>x[1]);get('trial-error').hidden=!first;
  if(first){get(first[0]).focus();return;}
  const cfg=window.AnNoorBackend;
  if(location.protocol==='file:'||!cfg?.url||!cfg.publishableKey){show('অনলাইনে সংযুক্ত ওয়েবসাইট থেকে আবেদন পাঠানো যাবে। কিছু জমা হয়নি।','Open the connected website online to apply. Nothing was submitted.');return;}
  const body={student_name:val('trial-student'),age,guardian_name:val('trial-guardian'),phone,level:val('trial-level'),preferred_time:val('trial-time'),consent:true,language:root.lang==='en'?'en':'bn',website:val('trial-website')};
  const serial=JSON.stringify({...body,language:''});if(serial!==last){requestId=window.AnNoorRequestId?.();if(!requestId){show('ব্রাউজারটি আপডেট করে আবার চেষ্টা করুন। কিছু জমা হয়নি; তথ্য ফর্মেই আছে।','Update your browser and retry. Nothing was submitted; your entries remain.');return;}last=serial;requestLanguage=body.language;}body.language=requestLanguage;
  pending=true;get('trial-submit').disabled=true;form.setAttribute('aria-busy','true');show('অনুরোধ পাঠানো হচ্ছে…','Sending your request…');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(cfg.url+'/functions/v1/admissions/trial-submit',{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({...body,request_id:requestId}),signal:controller.signal}),data=await response.json();
   if(!response.ok||!/^ANT-[A-F0-9]{32}$/.test(data.reference||'')||!['SUBMITTED','IN_REVIEW','APPROVED','REJECTED'].includes(data.status))throw Error(data.error||'UNAVAILABLE');
   complete=true;get('trial-another').hidden=false;
   show('ট্রায়ালের অনুরোধ পাওয়া গেছে। নম্বর: '+data.reference+'। সময় ও সুযোগ অনুযায়ী কর্তৃপক্ষ যোগাযোগ করে ক্লাস নিশ্চিত করবে।','Trial request received. Reference: '+data.reference+'. The administration will contact you to confirm a suitable class, subject to availability.');
  }catch(error){show(error.message==='RATE_LIMITED'?'বেশ কয়েকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করা যাবে।':'অনুরোধ জমা নিশ্চিত হয়নি। তথ্য ফর্মেই আছে; নিরাপদে আবার চেষ্টা করা যাবে।',error.message==='RATE_LIMITED'?'Too many attempts. Please try again later.':'Your request could not be confirmed. Entries remain; you can safely retry.');}
  finally{clearTimeout(timer);pending=false;get('trial-submit').disabled=complete;form.removeAttribute('aria-busy');}
 });
})();
