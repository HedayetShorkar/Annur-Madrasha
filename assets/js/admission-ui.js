/* Six-step admission wizard. Entries remain only in the current page. */
(()=>{
 'use strict';
 const get=id=>document.getElementById(id),form=get('fm');if(!form)return;
 const panels=[...form.querySelectorAll('.admission-section')],steps=[...document.querySelectorAll('.admission-steps button')];
 const guide=document.querySelector('.admission-guide'),nav=document.querySelector('.site-nav'),next=get('wizard-next'),prev=get('wizard-prev'),submit=get('sb'),error=get('wizard-error');
 const bn=()=>document.documentElement.lang==='bn',text=(b,e)=>bn()?b:e,num=n=>bn()?String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]):String(n);
 let current=0,furthest=0;
 const value=id=>get(id).value.trim();
 function mark(el,invalid){el.classList.toggle('bad',!!invalid);el.setAttribute('aria-invalid',String(!!invalid));return invalid?el:null;}
 function validate(index){
  const bad=[];const check=(id,invalid)=>{const target=typeof id==='string'?get(id):id;const found=mark(target,invalid);if(found)bad.push(found);};
  if(index===0){
   const age=Number(value('ge'));check('sn',!value('sn'));check('student-gender',!['boy','girl'].includes(value('student-gender')));check('ad',!value('ad'));check('ge',!(Number.isInteger(age)&&age>=5&&age<=18));
   check('lv',!form.querySelector('[name=lv]:checked'));check('hifz-progress',!get('hifz-progress').disabled&&!value('hifz-progress'));
  }else if(index===1){
   check('gn',!value('gn'));check('gr',!['father','mother','brother','sister','grandparent','other'].includes(value('gr')));
   check(form.querySelector('.wb'),!/^\+?[0-9][0-9\s\-]{6,17}$/.test(value('wa')));check('em',!!value('em')&&!get('em').validity.valid);
  }else if(index===2){
   check('pkg',!form.querySelector('[name=pkg]:checked'));
   if(!window.admissionFee?.validate())check('fee-start',true);else check('fee-start',false);
  }else if(index===3){
   for(const el of panels[3].querySelectorAll('.bad'))mark(el,false);
   if(!window.admissionSchedule?.validate())check(window.admissionSchedule?.invalidField()||get('schedule-start-hour'),true);
  }else if(index===4)check('k1',!get('c1').checked);
  else if(index===5){check('k2',!get('c2').checked);check('k3',!get('c3').checked);}
  return bad;
 }
 function measure(){if(guide.hidden||get('pg-adm').hidden)return;document.documentElement.style.setProperty('--adm-nav-height',nav.getBoundingClientRect().height+'px');document.documentElement.style.setProperty('--adm-guide-height',guide.getBoundingClientRect().height+'px');}
 function chrome(){
  steps.forEach((button,i)=>{button.disabled=i>furthest;button.dataset.state=i===current?'active':i<current?'complete':'available';if(i===current)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');button.querySelector('.wizard-step-index').textContent=i<current?'✓':num(i+1);});
  get('wizard-position').textContent=text('ধাপ ','Step ')+num(current+1)+' / '+num(panels.length)+' · '+panels[current].querySelector(bn()?'.ah h2 .bn':'.ah h2 .en').textContent;
  const progress=get('wizard-progress');progress.setAttribute('aria-valuenow',String(current+1));progress.setAttribute('aria-label',text('ভর্তি আবেদনের ধাপ','Admission application step'));progress.querySelector('span').style.width=((current+1)/panels.length*100)+'%';
  prev.disabled=current===0;next.hidden=current===panels.length-1;submit.hidden=current!==panels.length-1;measure();
 }
 function show(index,focus=true){
  current=index;furthest=Math.max(furthest,index);panels.forEach((p,i)=>{p.hidden=i!==index;});error.hidden=true;get('admission-submit-status').hidden=true;chrome();review();
  if(focus){panels[index].scrollIntoView({block:'start',behavior:'instant'});panels[index].focus({preventScroll:true});}
 }
 function revealInvalid(index,items){
  show(index);error.textContent=text('এই ধাপের চিহ্নিত তথ্যগুলো সঠিকভাবে পূরণ করতে হবে।','Please complete the highlighted information in this step.');error.hidden=false;
  const first=items[0],field=first.matches('input,select,textarea,button')?first:first.querySelector('input,select,textarea,button');field?.focus({preventScroll:true});field?.scrollIntoView({block:'center',behavior:'instant'});
 }
 function validateThrough(last){for(let i=0;i<=last;i++){const bad=validate(i);if(bad.length){revealInvalid(i,bad);return false;}}return true;}
 function advance(){if(current>=panels.length-1)return false;if(!validateThrough(current))return false;show(current+1);return true;}
 function go(id){const target=panels.findIndex(p=>p.id===id);if(target<0||target>furthest)return false;if(target>current&&!validateThrough(target-1))return false;show(target);return true;}
 next.addEventListener('click',advance);prev.addEventListener('click',()=>{if(current>0)show(current-1);});
 document.querySelectorAll('[data-adm-target]').forEach(button=>button.addEventListener('click',()=>go(button.dataset.admTarget)));
 form.addEventListener('submit',event=>{
  if(current<panels.length-1){event.preventDefault();event.stopImmediatePropagation();advance();return;}
  if(!validateThrough(panels.length-1)){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 const preview=get('admission-rules-preview');get('read-admission-rules').addEventListener('click',()=>preview.showModal());
 get('rules-preview-close').addEventListener('click',()=>preview.close());preview.addEventListener('click',e=>{if(e.target===preview)preview.close();});
 function review(){
  const selected=form.querySelector('[name=pkg]:checked')?.value;
  const level=form.querySelector('[name=lv]:checked');const levelText=level?.closest('label').querySelector(bn()?'.bn':'.en').textContent||'';
  const genders={boy:text('ছেলে','Boy'),girl:text('মেয়ে','Girl')};
  const groups=[
   {id:'adm-student',title:text('শিক্ষার্থী','Student'),rows:[[text('নাম','Name'),value('sn')],[text('বয়স ও লিঙ্গ','Age & gender'),[value('ge')?num(value('ge'))+text(' বছর',' years'):'',genders[value('student-gender')]].filter(Boolean).join(' · ')],[text('ঠিকানা','Address'),value('ad')],[text('পাঠের স্তর','Learning level'),levelText+(level?.value==='Hifz'&&value('hifz-progress')?' · '+value('hifz-progress'):'')]]},
   {id:'adm-guardian',title:text('অভিভাবক','Guardian'),rows:[[text('নাম ও সম্পর্ক','Name & relationship'),[value('gn'),value('gr')?get('gr').selectedOptions[0]?.textContent:''].filter(Boolean).join(' · ')],[text('হোয়াটসঅ্যাপ','WhatsApp'),value('wa')],[text('ইমেইল','Email'),value('em')||text('দেওয়া হয়নি (ঐচ্ছিক)','Not provided (optional)')]]},
   {id:'adm-plan',title:text('প্যাকেজ ও প্রথম মাস','Plan & first month'),rows:[[text('প্যাকেজ','Plan'),selected],[text('ক্লাস শুরুর তারিখ','Start date'),window.admissionFee?.displayDate()||value('fee-start')],[text('প্রাথমিক ফি','Estimated fee'),get('fee-result').textContent]]},
   {id:'adm-time',title:text('ক্লাসের সময়','Availability'),rows:[[text('পছন্দ','Preference'),get('schedule-summary').textContent],[text('অতিরিক্ত তথ্য','Notes'),value('nt')||text('উল্লেখ করা হয়নি','None provided')]]}
  ];
  get('admission-review-values').replaceChildren(...groups.map(group=>{
   const box=document.createElement('div');box.className='wizard-review-group';const head=document.createElement('div');head.className='wizard-review-head';const title=document.createElement('h3');title.textContent=group.title;const edit=document.createElement('button');edit.type='button';edit.className='admission-edit';edit.textContent=text('সংশোধন','Edit');edit.setAttribute('aria-label',group.title+' · '+text('তথ্য সংশোধন','Edit details'));edit.addEventListener('click',()=>go(group.id));head.append(title,edit);
   const dl=document.createElement('dl');for(const [label,content]of group.rows){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=content||text('এখনো দেওয়া হয়নি','Not provided yet');row.append(dt,dd);dl.append(row);}box.append(head,dl);return box;
  }));
 }
 const refresh=()=>queueMicrotask(review);form.addEventListener('input',refresh);form.addEventListener('change',refresh);form.addEventListener('click',refresh);document.querySelectorAll('[data-p]').forEach(el=>el.addEventListener('click',refresh));
 form.addEventListener('reset',()=>setTimeout(()=>{furthest=0;for(const el of form.querySelectorAll('.bad'))mark(el,false);show(0);},0));
 window.addEventListener('resize',measure,{passive:true});window.addEventListener('hashchange',measure);document.addEventListener('annoor:route',measure);
 if('ResizeObserver'in window){const ro=new ResizeObserver(measure);ro.observe(nav);ro.observe(guide);}
 new MutationObserver(()=>{chrome();review();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 window.admissionWizard={go,advance,current:()=>current,readRules:()=>preview.showModal()};
 show(0,false);
})();
