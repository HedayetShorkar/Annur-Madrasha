/* Friendly date selection; fee policy still uses actual Dhaka enrolment date. */
(()=>{
 'use strict';
 const get=id=>document.getElementById(id),date=get('fee-start'),mode=get('fee-mode');
 if(!date||!mode)return;
 const bn=()=>document.documentElement.lang==='bn',text=(b,e)=>bn()?b:e,pad=n=>String(n).padStart(2,'0');
 const today=()=>{const p=new Intl.DateTimeFormat('en',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=k=>p.find(x=>x.type===k).value;return `${v('year')}-${v('month')}-${v('day')}`;};
 const nextMonth=t=>{const [y,m]=t.split('-').map(Number);return `${m===12?y+1:y}-${pad(m===12?1:m+1)}-01`;};
 const addDay=t=>{const d=new Date(t+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
 function friendly(iso,short=false){return iso?new Intl.DateTimeFormat(bn()?'bn-BD':'en-GB',{timeZone:'Asia/Dhaka',day:'numeric',month:short?'short':'long',...(short?{}:{year:'numeric',weekday:'long'})}).format(new Date(iso+'T12:00:00Z')):text('একটি তারিখ বেছে নিন','Choose a date');}
 let attempted=false,lastDay='',lastLanguage='',allowed=new Set(),currentDraft=today();
 function choices(preferred=date.value){
  const t=today(),language=bn()?'bn':'en';if(t===lastDay&&language===lastLanguage)return;
  lastDay=t;lastLanguage=language;const [y,m,d]=t.split('-').map(Number),end=new Date(Date.UTC(y,m,0)).getUTCDate();
  const values=Array.from({length:end-d+1},(_,i)=>`${y}-${pad(m)}-${pad(d+i)}`);values.push(nextMonth(t));allowed=new Set(values);
  date.replaceChildren(new Option(text('তারিখ বেছে নিন','Choose a date'),''),...values.map(iso=>new Option(friendly(iso)+(iso===t?text(' · আজ',' · Today'):iso===nextMonth(t)?text(' · পরের মাস',' · Next month'):''),iso)));
  date.value=preferred;
  const oldMode=mode.value;mode.replaceChildren(new Option(text('এই মাসে শুরু করব','Start this month'),'current'),new Option(text('পরের মাসের ১ তারিখ থেকে','Start on the 1st of next month'),'next'));mode.value=oldMode||'current';
 }
 const valid=()=>allowed.has(date.value);
 function update(){
  choices();const t=today(),next=nextMonth(t),tomorrow=addDay(t);
  if(valid()){mode.value=date.value===next?'next':'current';if(mode.value==='current')currentDraft=date.value;}
  const invalid=!valid();date.setAttribute('aria-invalid',String(attempted&&invalid));
  get('fee-error').hidden=!attempted||!invalid;get('fee-error').textContent=text('তালিকা থেকে একটি শুরুর তারিখ বেছে নিন।','Choose a start date from the list.');
  get('fee-selected-date').textContent=valid()?friendly(date.value):text('এখনো কোনো দিন বাছাই করা হয়নি','No date selected yet');
  document.querySelectorAll('[data-fee-date]').forEach(button=>{const value=button.dataset.feeDate==='today'?t:button.dataset.feeDate==='tomorrow'?tomorrow:next;button.dataset.date=value;button.querySelector('small').textContent=friendly(value,true);button.setAttribute('aria-pressed',String(valid()&&date.value===value));button.hidden=button.dataset.feeDate==='next'&&tomorrow===next;});
  const p=sel();let result=text('প্যাকেজ ও তারিখ বেছে নিলে ফি দেখা যাবে।','Choose a plan and date to see the estimate.');get('fee-quote').value='';
  if(p&&valid()){
   const feeDate=mode.value==='next'?date.value:t,full=Number(feeDate.slice(8))<=7;
   const b=admissionProrate(Math.round(p[4]*100),feeDate),u=admissionProrate(Math.round(p[7]*100),feeDate);
   const amount=bn()?'৳'+(b.amountMinor/100).toLocaleString('bn-BD',{minimumFractionDigits:2,maximumFractionDigits:2}):'$'+(u.amountMinor/100).toFixed(2);
   result=text(`${friendly(feeDate,true)} অনুযায়ী · ${full?'পূর্ণ মাসের ফি':b.total+' দিনের মধ্যে '+b.remaining+' দিনের ফি'} · প্রথম মাস: ${amount}`,`As of ${friendly(feeDate,true)} · ${full?'Full monthly fee':b.remaining+' of '+b.total+' days'} · First month: ${amount}`);
   get('fee-quote').value=JSON.stringify({startDate:date.value,feeDate,fullMonth:full,package:p[0],bdtMinor:b.amountMinor,usdMinor:u.amountMinor,days:b.remaining,monthDays:b.total,estimate:true});
  }
  get('fee-result').textContent=result;if(get('fee-sidebar'))get('fee-sidebar').textContent=result;
 }
 function choose(iso){choices();date.value=iso;update();}
 choices(today());date.value=today();update();
 mode.addEventListener('change',()=>choose(mode.value==='next'?nextMonth(today()):allowed.has(currentDraft)&&currentDraft!==nextMonth(today())?currentDraft:today()));
 date.addEventListener('change',update);date.addEventListener('focus',update);
 document.querySelectorAll('[data-fee-date]').forEach(button=>button.addEventListener('click',()=>{choose(button.dataset.date);date.dispatchEvent(new Event('change',{bubbles:true}));}));
 document.addEventListener('change',event=>{if(event.target.name==='pkg')update();});document.querySelectorAll('[data-p]').forEach(el=>el.addEventListener('click',update));
 new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 window.admissionFee={validate(){attempted=true;update();return valid();},invalidField:()=>date,displayDate:()=>valid()?friendly(date.value):''};
 get('fm').addEventListener('submit',event=>{if(window.admissionWizard)return;attempted=true;update();if(!valid()){event.preventDefault();event.stopImmediatePropagation();date.focus();}},true);
 get('fm').addEventListener('reset',()=>setTimeout(()=>{attempted=false;currentDraft=today();choose(today());},0));
 get('read-admission-rules').addEventListener('click',()=>{if(window.admissionWizard)return;get('admission-rules').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});get('admission-rules').focus({preventScroll:true});});
})();
