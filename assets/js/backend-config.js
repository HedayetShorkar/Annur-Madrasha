/* Public connection settings only; never put privileged keys here. */
window.AnNoorBackend=Object.freeze({"url":"https://jbmxquvgrekyapcoezmh.supabase.co","publishableKey":"sb_publishable_xzDi2JRyMMCMIm3RrqNh_Q_QssBU7yM","projectRef":"jbmxquvgrekyapcoezmh"});

// CSPRNG-only request IDs, including browsers without crypto.randomUUID.
window.AnNoorRequestId=()=>{
 try{
  if(window.crypto?.randomUUID)return window.crypto.randomUUID();
  if(!window.crypto?.getRandomValues)return '';
  const bytes=new Uint8Array(16);window.crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
 }catch{return '';}
};

/* Admission data stays in memory until an explicit submission. */
(()=>{
 let pending=false,last='',requestId='',submitted=false;
 const form=document.getElementById('fm');if(!form)return;
 const value=id=>document.getElementById(id).value.trim();
 form.addEventListener('reset',()=>{submitted=false;last='';requestId='';document.getElementById('sb').disabled=false;});
 window.annoorSubmitAdmission=async()=>{
  if(pending||submitted)return;
  const status=document.getElementById('admission-submit-status'),button=document.getElementById('sb'),bn=document.documentElement.lang==='bn';
  const show=(b,e)=>{status.textContent=bn?b:e;status.hidden=false;status.focus();};
  if(location.protocol==='file:'){show('আবেদন জমা দিতে ওয়েবসাইটটি অনলাইনে খুলতে হবে। তথ্য এখনো জমা হয়নি।','Open the hosted website to submit. Nothing has been submitted.');return;}
  const mode=form.querySelector('[name="schedule-mode"]:checked').value;
  const body={student_name:value('sn'),gender:value('student-gender'),age:Number(value('ge')),address:value('ad'),level:form.querySelector('[name=lv]:checked').value,hifz:document.getElementById('hifz-progress').disabled?'':value('hifz-progress'),guardian_name:value('gn'),relationship:value('gr'),phone:value('wa'),email:value('em'),plan:form.querySelector('[name=pkg]:checked').value,start_date:value('fee-start'),availability:mode==='flexible'?{mode}:{mode,start:value('schedule-start'),end:value('schedule-end'),timeZone:value('schedule-zone')},notes:value('nt'),consent:['c1','c2','c3'].every(id=>document.getElementById(id).checked),language:bn?'bn':'en'};
  const serial=JSON.stringify(body);if(serial!==last){requestId=window.AnNoorRequestId();if(!requestId){show('ব্রাউজারটি আপডেট করে আবার চেষ্টা করুন। আবেদন জমা হয়নি; তথ্য ফর্মেই আছে।','Update your browser and retry. Nothing was submitted; your entries remain.');return;}last=serial;}
  pending=true;button.disabled=true;form.setAttribute('aria-busy','true');show('আবেদন জমা হচ্ছে…','Submitting application…');
  try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);let r;
   try{r=await fetch(window.AnNoorBackend.url+'/functions/v1/admissions/submit',{method:'POST',headers:{apikey:window.AnNoorBackend.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({...body,request_id:requestId}),signal:controller.signal});}finally{clearTimeout(timer);}
   const data=await r.json();if(!r.ok||!/^ANN-[A-F0-9]{32}$/.test(data.reference||'')||!['SUBMITTED','IN_REVIEW','APPROVED','REJECTED'].includes(data.status)||!Number.isInteger(data.fee_bdt_minor)||data.fee_bdt_minor<=0)throw Error(data.error||'UNAVAILABLE');
   submitted=true;
   // A display preference only: never a classroom credential or stored application record.
   try{localStorage.setItem('annoor-admission-submitted-v1','1');}catch{}
   document.dispatchEvent(new Event('annoor:admission-success'));
   show('আবেদন জমা হয়েছে। আবেদন নম্বর: '+data.reference+'। প্রথম মাসের প্রাথমিক হিসাব ৳'+(data.fee_bdt_minor/100).toFixed(2)+'। কর্তৃপক্ষ যোগাযোগ করে ভর্তি ও ক্লাসের সময় নিশ্চিত করবে।','Application received. Reference: '+data.reference+'. Estimated first-month fee: BDT '+(data.fee_bdt_minor/100).toFixed(2)+'. The administration will confirm admission and class timing.');
  }catch(e){show(e.message==='RATE_LIMITED'?'বারবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন; আবেদন নম্বর পাওয়া না গেলে জমা নিশ্চিত হয়নি।':'জমা নিশ্চিত করা যায়নি। তথ্য ফর্মেই আছে। আবার চেষ্টা করলে একই আবেদন পুনরায় তৈরি হবে না।',e.message==='RATE_LIMITED'?'Too many attempts. Please try later.':'Submission could not be confirmed. Your entries remain. Retry safely with the same application.');}
  finally{pending=false;button.disabled=submitted;form.removeAttribute('aria-busy');}
 };
})();
