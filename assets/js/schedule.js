/* Optional admission availability. Preferences are not confirmed bookings. */
(() => {
  'use strict';
  const planner = document.getElementById('schedule-planner');
  if (!planner) return;
  const get = id => document.getElementById('schedule-' + id);
  const zones = [['Asia/Dhaka','বাংলাদেশ · ঢাকা','Bangladesh · Dhaka'],['Asia/Riyadh','সৌদি আরব · রিয়াদ','Saudi Arabia · Riyadh'],['Asia/Dubai','সংযুক্ত আরব আমিরাত · দুবাই','UAE · Dubai'],['Asia/Qatar','কাতার · দোহা','Qatar · Doha'],['Asia/Kuwait','কুয়েত','Kuwait'],['Asia/Muscat','ওমান · মাস্কাট','Oman · Muscat'],['Asia/Kuala_Lumpur','মালয়েশিয়া','Malaysia'],['Asia/Singapore','সিঙ্গাপুর','Singapore'],['Europe/London','যুক্তরাজ্য · লন্ডন','UK · London'],['Europe/Rome','ইতালি · রোম','Italy · Rome'],['America/New_York','যুক্তরাষ্ট্র · নিউইয়র্ক','USA · New York'],['America/Chicago','যুক্তরাষ্ট্র · শিকাগো','USA · Chicago'],['America/Los_Angeles','যুক্তরাষ্ট্র · লস অ্যাঞ্জেলেস','USA · Los Angeles'],['America/Toronto','কানাডা · টরন্টো','Canada · Toronto'],['Australia/Sydney','অস্ট্রেলিয়া · সিডনি','Australia · Sydney']];
  // Include other browser-supported IANA zones without guessing UTC/DST offsets.
  for (const z of Intl.supportedValuesOf?.('timeZone') || []) if (!zones.some(x => x[0] === z)) zones.push([z,z.replaceAll('_',' '),z.replaceAll('_',' ')]);
  const bn = () => document.documentElement.lang === 'bn';
  const text = (b,e) => bn() ? b : e;
  const specific = () => planner.querySelector('[name="schedule-mode"]:checked').value === 'specific';
  const pad = n => String(n).padStart(2,'0');
  const digits = value => bn() ? String(value).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]) : String(value);
  const drafts={start:{hour:null,minute:null,period:'AM'},end:{hour:null,minute:null,period:'AM'}};
  function displayTime(value) {
    if (get('format').value === '24') return digits(value);
    const [h,m] = value.split(':').map(Number);
    return digits(h % 12 || 12) + ':' + digits(pad(m)) + (h < 12 ? ' AM' : ' PM');
  }
  function renderClocks() {
    const twelve = get('format').value === '12';
    for (const side of ['start','end']) {
      const value = get(side).value;
      if (/^\d{2}:\d{2}$/.test(value)) {const [h,m]=value.split(':').map(Number);drafts[side]={hour:h,minute:m,period:h>=12?'PM':'AM'};}
      const {hour:h,minute:m}=drafts[side];
      const hour=get(side+'-hour'), minute=get(side+'-minute'), period=get(side+'-period');
      hour.replaceChildren(new Option(text('বাছুন','Choose'),''),...Array.from({length:twelve?12:24},(_,i)=>new Option(digits(pad(twelve?i+1:i)),String(twelve?i+1:i))));
      minute.replaceChildren(new Option(text('বাছুন','Choose'),''),...Array.from({length:60},(_,i)=>new Option(digits(pad(i)),String(i))));
      hour.value=h===null?'':String(twelve?(h%12||12):h);minute.value=m===null?'':String(m);
      period.value=drafts[side].period;period.hidden=!twelve;
      get(side+'-period-field').hidden=!twelve;get(side+'-controls').dataset.format=twelve?'12':'24';
      const prefix=side==='start'?text('শুরুর','Start'):text('শেষের','End');
      hour.setAttribute('aria-label',prefix+' '+text('ঘণ্টা','hour'));
      minute.setAttribute('aria-label',prefix+' '+text('মিনিট','minute'));
      period.setAttribute('aria-label',prefix+' AM/PM');
    }
  }
  function readClocks() {
    for (const side of ['start','end']) {
      const h=get(side+'-hour').value;let m=get(side+'-minute').value;
      // Choosing an hour is enough for an exact-hour time; minutes remain editable.
      if(h!==''&&m===''){m='0';get(side+'-minute').value='0';}
      let hour=Number(h);
      if(get('format').value==='12') hour=hour%12+(get(side+'-period').value==='PM'?12:0);
      drafts[side]={hour:h===''?null:hour,minute:m===''?null:Number(m),period:h===''?get(side+'-period').value:hour>=12?'PM':'AM'};
      get(side).value=h===''||m===''?'':pad(hour)+':'+pad(m);
    }
  }
  function renderRelationship() {
    const el=document.getElementById('gr'),previous=el.value;
    el.replaceChildren(...[['','সম্পর্ক বেছে নিন','Select relationship'],['father','বাবা','Father'],['mother','মা','Mother'],['brother','ভাই','Brother'],['sister','বোন','Sister'],['grandparent','দাদা/দাদি/নানা/নানি','Grandparent'],['other','অন্যান্য অভিভাবক','Other guardian']].map(x=>new Option(x[bn()?1:2],x[0])));
    el.value=previous;
  }
  let attempted = false;
  function issue() {
    if (!specific()) return '';
    if (!get('start').value || !get('end').value) return text('শুরু ও শেষের সময় দিন।','Enter both start and end times.');
    if (get('end').value <= get('start').value) return text('একই দিনের শুরুর সময়ের পরের একটি শেষ সময় দিন।','Choose an end time later than the start on the same day.');
    return '';
  }
  function renderZones() {
    const previous = get('zone').value || 'Asia/Dhaka';
    get('zone').replaceChildren(...zones.map(z => new Option(z[bn()?1:2] + ' — ' + z[0],z[0])));
    get('zone').value = previous;
  }
  function update() {
    const active = specific();
    get('details').hidden = !active;
    get('details').querySelectorAll('input,select,button').forEach(el => el.disabled = !active);
    const plan = document.querySelector('[name=pkg]:checked')?.value;
    const classDays = plan ? (plan === 'Premium' ? text('শনিবার–বৃহস্পতিবার · ৬ দিন','Saturday–Thursday · 6 days') : text('শনিবার–বুধবার · ৫ দিন','Saturday–Wednesday · 5 days')) : text('Basic / Standard: শনিবার–বুধবার · Premium: শনিবার–বৃহস্পতিবার','Basic / Standard: Saturday–Wednesday · Premium: Saturday–Thursday');
    get('class-days').textContent = classDays;
    const start = get('start').value, end = get('end').value;
    const zoneLabel=zones.find(z=>z[0]===get('zone').value)?.[bn()?1:2]||get('zone').value;
    const summary = !active ? classDays + ' · ' + text('আলোচনা করে সময় ঠিক করব।','Agree on a time together.') : [classDays, start && end ? displayTime(start) + '–' + displayTime(end) : text('সময় বেছে নিন','Choose a time window'),zoneLabel].join(' · ');
    get('summary').textContent = summary;
    document.getElementById('sc').value = !active ? 'Flexible; agree with administration' : issue() ? '' : JSON.stringify({package:plan || null,days:plan ? (plan==='Premium' ? ['sat','sun','mon','tue','wed','thu'] : ['sat','sun','mon','tue','wed']) : [],start,end,timeZone:get('zone').value});
    get('error').textContent = attempted ? issue() : '';
    get('error').hidden = !get('error').textContent;
    get('period-help').hidden=get('format').value==='24';
    for(const side of ['start','end']){
      get(side+'-display').textContent=get(side).value?displayTime(get(side).value):text('সময় বেছে নিন','Choose a time');
      const prefix=side==='start'?text('শুরুর','Start'):text('শেষের','End');
      planner.querySelectorAll('[data-time-side="'+side+'"]').forEach(button=>{
        const value=get(side).value,minutes=value?Number(value.slice(0,2))*60+Number(value.slice(3)):null,next=minutes+Number(button.dataset.timeDelta);
        button.disabled=!active||minutes===null||next<0||next>1439;
        button.setAttribute('aria-label',prefix+' '+text('সময় ','time ')+(Number(button.dataset.timeDelta)<0?text('১৫ মিনিট কমান','minus 15 minutes'):text('১৫ মিনিট বাড়ান','plus 15 minutes')));
      });
    }
    planner.querySelectorAll('[data-start]').forEach(el => {el.setAttribute('aria-pressed',String(start === el.dataset.start && end === el.dataset.end));el.querySelector('small').textContent=displayTime(el.dataset.start)+'–'+displayTime(el.dataset.end);});
  }
  planner.addEventListener('change', e => {
    if (e.target === get('format')) renderClocks();
    else if (e.target.closest('.schedule-clock')) readClocks();
    else if(e.target===get('start')||e.target===get('end')){if(!e.target.value)drafts[e.target.id.endsWith('start')?'start':'end']={hour:null,minute:null,period:'AM'};renderClocks();}
    update();
  });
  document.addEventListener('change',e=>{if(e.target.name==='pkg')update();});
  document.querySelectorAll('[data-p]').forEach(el=>el.addEventListener('click',update));
  planner.addEventListener('input',e=>{if(e.target.closest('.schedule-clock')){readClocks();update();}});
  planner.querySelectorAll('[data-start]').forEach(el => el.addEventListener('click',() => {get('start').value=el.dataset.start;get('end').value=el.dataset.end;renderClocks();update();}));
  planner.querySelectorAll('[data-time-side]').forEach(button=>button.addEventListener('click',()=>{
    const side=button.dataset.timeSide,value=get(side).value;if(!value)return;
    const minutes=Number(value.slice(0,2))*60+Number(value.slice(3))+Number(button.dataset.timeDelta);if(minutes<0||minutes>1439)return;
    get(side).value=pad(Math.floor(minutes/60))+':'+pad(minutes%60);renderClocks();update();
  }));
  get('detect').addEventListener('click',() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zones.some(z=>z[0]===zone)) zones.push([zone,zone,zone]);
    renderZones(); get('zone').value=zone; update();
  });
  window.admissionSchedule={validate(){attempted=true;update();return !issue();},invalidField(){return !get('start').value?get('start-hour'):get('end-hour');}};
  document.getElementById('fm').addEventListener('submit',e => {
    if(window.admissionWizard)return;
    attempted=true;update();
    if (!issue()) return;
    e.preventDefault();e.stopImmediatePropagation();
    const target = !get('start').value ? get('start-hour') : get('end-hour');
    target.focus();
  },true);
  document.getElementById('fm').addEventListener('reset',() => {attempted=false;setTimeout(()=>{for(const side of ['start','end']){get(side).value='';drafts[side]={hour:null,minute:null,period:'AM'};}renderClocks();update();},0);});
  new MutationObserver(() => {renderZones();renderClocks();renderRelationship();update();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  renderZones();renderClocks();renderRelationship();update();
})();
