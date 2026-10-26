
const $=s=>document.querySelector(s),L=h=>document.documentElement.lang;
const B=(b,e)=>`<i class="bn">${b}</i><i class="en">${e}</i>`;
/* ============ HERO SLIDER (বৃত্তের ভেতরের স্লাইড) ============
   প্রথম স্লাইড সবসময় মাদরাসার লোগো। কৃতী শিক্ষার্থীদের ছবি যোগ করতে নিচের HERO_STUDENTS-এ এক লাইন করে লিখুন।
   src      : ছবির লিংক বা data URI (চৌকো/পোর্ট্রেট ছবি ভালো)
   nameBn / nameEn : শিক্ষার্থীর নাম   |   noteBn / noteEn : অর্জন (যেমন "হিফজ সম্পন্ন")
   consent  : অভিভাবকের লিখিত অনুমতি পেলে তবেই true দিন। true না হলে ছবি দেখানো হবে না।
   উদাহরণ:
   {src:'student1.jpg',nameBn:'নাম',nameEn:'Name',noteBn:'অর্জন',noteEn:'Achievement',consent:true},
*/
const HERO_STUDENTS=[
];

(function(){const pl=$('.plate'),logo=pl.querySelector('img'),sl=HERO_STUDENTS.filter(s=>s.consent===true&&s.src),esc=s=>String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
const w=document.createElement('div');w.className='sld lg on';pl.insertBefore(w,logo);w.appendChild(logo);if(!sl.length)return;
sl.forEach(s=>{const d=document.createElement('div');d.className='sld st';d.innerHTML=`<img src="${esc(s.src)}" alt="${esc(s.nameEn||s.nameBn||'Student')}" loading="lazy" decoding="async"><div class="cap"><b>${B(esc(s.nameBn),esc(s.nameEn))}</b><span>${B(esc(s.noteBn),esc(s.noteEn))}</span></div>`;pl.appendChild(d)});
const el=[...pl.querySelectorAll('.sld')],dt=document.createElement('div');dt.className='sdots';dt.innerHTML=el.map((_,i)=>`<button type="button" aria-label="Slide ${i+1}"></button>`).join('');pl.appendChild(dt);
let i=0,pz=0,x0=null;const go=n=>{i=(n+el.length)%el.length;el.forEach((e,k)=>e.classList.toggle('on',k==i));[...dt.children].forEach((d,k)=>d.classList.toggle('on',k==i))};go(0);
dt.onclick=e=>{const b=e.target.closest('button');b&&go([...dt.children].indexOf(b))};
pl.addEventListener('pointerdown',e=>x0=e.clientX);pl.addEventListener('pointerup',e=>{if(x0!=null&&Math.abs(e.clientX-x0)>40)go(i+(e.clientX<x0?1:-1));x0=null});
['pointerenter','focusin'].forEach(n=>pl.addEventListener(n,()=>pz=1));['pointerleave','focusout'].forEach(n=>pl.addEventListener(n,()=>pz=0));
if(!matchMedia('(prefers-reduced-motion:reduce)').matches)setInterval(()=>{if(!pz&&!document.hidden&&!$('#pg-home').hidden)go(i+1)},4500)})();
$('#yr').textContent=new Date().getFullYear();
// Original 8%-opacity Quran typography restored from the Phase 1 checkpoint.
const GO='rgba(212,175,55,.08)',EM='rgba(5,150,105,.08)',FO='rgba(6,78,59,.08)',MI='rgba(236,253,245,.08)',WH='rgba(255,255,255,.08)';
const AY=['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', 'رَبِّ زِدْنِي عِلْمًا', 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا', 'فَاذْكُرُونِي أَذْكُرْكُمْ', 'قُلْ هُوَ اللَّهُ أَحَدٌ', 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ', 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', 'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', 'رَبِّ اشْرَحْ لِي صَدْرِي', 'وَيَسِّرْ لِي أَمْرِي', 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', 'وَالضُّحَىٰ وَاللَّيْلِ إِذَا سَجَىٰ', 'إِنَّ رَبِّي قَرِيبٌ مُجِيبٌ', 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ', 'وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا', 'وَقُولُوا لِلنَّاسِ حُسْنًا', 'فَاصْبِرْ صَبْرًا جَمِيلًا', 'وَاللَّهُ يُحِبُّ الصَّابِرِينَ', 'رَبَّنَا تَقَبَّلْ مِنَّا', 'وَقُلْ رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِنْ مُدَّكِرٍ', 'سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ', 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ', 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ', 'إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوْا وَالَّذِينَ هُمْ مُحْسِنُونَ', 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنْتُمُ الْأَعْلَوْنَ إِنْ كُنْتُمْ مُؤْمِنِينَ', 'وَاللَّهُ غَالِبٌ عَلَىٰ أَمْرِهِ', 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', 'رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا', 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ', 'إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ', 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنْسَ إِلَّا لِيَعْبُدُونِ', 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ', 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ', 'وَفِي أَنْفُسِكُمْ أَفَلَا تُبْصِرُونَ', 'أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ', 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِلْمُؤْمِنِينَ', 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِلْمُتَّقِينَ', 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ', 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ', 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', 'وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ', 'وَهُوَ الْعَلِيُّ الْعَظِيمُ', 'لَا إِكْرَاهَ فِي الدِّينِ', 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا', 'وَقُلْ جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ', 'سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا', 'وَكَفَىٰ بِاللَّهِ وَكِيلًا', 'وَمَنْ أَحْسَنُ قَوْلًا مِمَّنْ دَعَا إِلَى اللَّهِ', 'ادْعُونِي أَسْتَجِبْ لَكُمْ', 'فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ', 'وَلَذِكْرُ اللَّهِ أَكْبَرُ', 'وَاللَّهُ يَرْزُقُ مَنْ يَشَاءُ بِغَيْرِ حِسَابٍ', 'إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ', 'وَأَحْسِنُوا إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ', 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ', 'وَقُلْ رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ', 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', 'رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ', 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي', 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ', 'سَلَامٌ عَلَيْكُمْ بِمَا صَبَرْتُمْ', 'وَالْعَصْرِ إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ', 'إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ', 'وَاللَّهُ يَهْدِي مَنْ يَشَاءُ إِلَىٰ صِرَاطٍ مُسْتَقِيمٍ', 'إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', 'وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ', 'لَقَدْ خَلَقْنَا الْإِنْسَانَ فِي أَحْسَنِ تَقْوِيمٍ', 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', 'وَرَفَعْنَا لَكَ ذِكْرَكَ', 'فَإِذَا فَرَغْتَ فَانْصَبْ وَإِلَىٰ رَبِّكَ فَارْغَبْ', 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ', 'وَلَلْآخِرَةُ خَيْرٌ لَكَ مِنَ الْأُولَىٰ', 'أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ', 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ', 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ', 'الرَّحْمَٰنُ عَلَّمَ الْقُرْآنَ', 'خَلَقَ الْإِنْسَانَ عَلَّمَهُ الْبَيَانَ', 'يَا أَيُّهَا الْمُزَّمِّلُ', 'وَاذْكُرِ اسْمَ رَبِّكَ وَتَبَتَّلْ إِلَيْهِ تَبْتِيلًا', 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِلْعَالَمِينَ', 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ', 'لَقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ', 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ', 'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ', 'فَاعْلَمْ أَنَّهُ لَا إِلَٰهَ إِلَّا اللَّهُ', 'وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا', 'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ', 'قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً', 'وَقِنَا عَذَابَ النَّارِ', 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', 'وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً', 'إِنَّكَ أَنْتَ الْوَهَّابُ', 'رَبَّنَا إِنَّنَا آمَنَّا فَاغْفِرْ لَنَا ذُنُوبَنَا', 'رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ', 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ', 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا', 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', 'وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ', 'إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ', 'وَمَا تَشَاءُونَ إِلَّا أَنْ يَشَاءَ اللَّهُ', 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ', 'وَبَشِّرِ الصَّابِرِينَ', 'وَلَا تَيْأَسُوا مِنْ رَوْحِ اللَّهِ', 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ', 'إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا', 'إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ', 'وَلَا تُسْرِفُوا إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ', 'وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا', 'وَاخْفِضْ جَنَاحَكَ لِلْمُؤْمِنِينَ', 'وَقُولُوا قَوْلًا سَدِيدًا', 'وَأَوْفُوا بِالْعَهْدِ إِنَّ الْعَهْدَ كَانَ مَسْئُولًا', 'وَلَا تَقْفُ مَا لَيْسَ لَكَ بِهِ عِلْمٌ', 'وَلَا تَمْشِ فِي الْأَرْضِ مَرَحًا', 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا', 'فَلَا تَقُلْ لَهُمَا أُفٍّ', 'وَقُلْ لَهُمَا قَوْلًا كَرِيمًا', 'هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ', 'كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ', 'وَمَا الْحَيَاةُ الدُّنْيَا إِلَّا مَتَاعُ الْغُرُورِ', 'وَالْآخِرَةُ خَيْرٌ وَأَبْقَىٰ', 'سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَىٰ', 'قَدْ أَفْلَحَ مَنْ تَزَكَّىٰ', 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ', 'الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ', 'وَمَنْ يُؤْمِنْ بِاللَّهِ يَهْدِ قَلْبَهُ', 'هُوَ الَّذِي أَنْزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ', 'نَصْرٌ مِنَ اللَّهِ وَفَتْحٌ قَرِيبٌ', 'وَبَشِّرِ الْمُؤْمِنِينَ', 'سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنْفُسِهِمْ', 'وَهُوَ الَّذِي خَلَقَ اللَّيْلَ وَالنَّهَارَ وَالشَّمْسَ وَالْقَمَرَ', 'كُلٌّ فِي فَلَكٍ يَسْبَحُونَ', 'وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ', 'أَفَلَا يَنْظُرُونَ إِلَى الْإِبِلِ كَيْفَ خُلِقَتْ', 'إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِأُولِي الْأَلْبَابِ', 'هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ', 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنْكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ', 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ', 'عَلَّمَ الْإِنْسَانَ مَا لَمْ يَعْلَمْ', 'الَّذِي عَلَّمَ بِالْقَلَمِ', 'وَالْقَلَمِ وَمَا يَسْطُرُونَ', 'إِنَّ اللَّهَ مَعَ الْمُتَّقِينَ', 'إِنَّ اللَّهَ يُحِبُّ الْمُتَّقِينَ', 'وَاللَّهُ وَلِيُّ الْمُؤْمِنِينَ', 'اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُمْ مِنَ الظُّلُمَاتِ إِلَى النُّورِ', 'قَدْ جَاءَكُمْ مِنَ اللَّهِ نُورٌ وَكِتَابٌ مُبِينٌ', 'وَاللَّهُ يَدْعُو إِلَىٰ دَارِ السَّلَامِ', 'لَهُمْ دَارُ السَّلَامِ عِنْدَ رَبِّهِمْ', 'سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ', 'وَالسَّلَامُ عَلَيَّ يَوْمَ وُلِدْتُ', 'وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِنْ رَبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ', 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ', 'وَلْيَعْفُوا وَلْيَصْفَحُوا', 'ادْفَعْ بِالَّتِي هِيَ أَحْسَنُ', 'وَمَا يُلَقَّاهَا إِلَّا الَّذِينَ صَبَرُوا', 'وَجَاهِدُوا فِي اللَّهِ حَقَّ جِهَادِهِ', 'يُرِيدُ اللَّهُ بِكُمُ الْيُسْرَ وَلَا يُرِيدُ بِكُمُ الْعُسْرَ', 'شَهْرُ رَمَضَانَ الَّذِي أُنْزِلَ فِيهِ الْقُرْآنُ', 'إِنَّا أَنْزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ', 'لَيْلَةُ الْقَدْرِ خَيْرٌ مِنْ أَلْفِ شَهْرٍ', 'إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ', 'كِتَابٌ أَنْزَلْنَاهُ إِلَيْكَ مُبَارَكٌ', 'فَاقْرَءُوا مَا تَيَسَّرَ مِنَ الْقُرْآنِ', 'وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنْصِتُوا لَعَلَّكُمْ تُرْحَمُونَ', 'بَلْ هُوَ قُرْآنٌ مَجِيدٌ', 'فِي لَوْحٍ مَحْفُوظٍ', 'وَالشَّمْسِ وَضُحَاهَا', 'قَدْ أَفْلَحَ مَنْ زَكَّاهَا', 'وَالتِّينِ وَالزَّيْتُونِ', 'اللَّهُ الصَّمَدُ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ'];
const V=[['.hero','.hero:before','Aref Ruqaa',24,GO],['#why','#why','Amiri',28,EM],['#teachers','#teachers','Scheherazade New',24,FO],['section.dark','section.dark','Aref Ruqaa',26,MI],['#packages','#packages','Amiri',26,GO],['#faq','#faq','Scheherazade New',26,EM,'linear-gradient(180deg,#fff,#ECFDF5)'],['#reviews','#reviews','Amiri',24,GO],['footer','footer','Amiri',22,GO]];
let pst,rt;const gc=(a,b)=>b?gc(b,a%b):a;
function mul(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hit(A,B){const dx=B.cx-A.cx,dy=B.cy-A.cy;if(dx*dx+dy*dy>(A.r+B.r)**2)return 0;
for(const O of[A,B])for(const x of[[O.c,O.s],[-O.s,O.c]]){const pr=Q=>Q.hw*Math.abs(x[0]*Q.c+x[1]*Q.s)+Q.hh*Math.abs(-x[0]*Q.s+x[1]*Q.c);if(Math.abs(dx*x[0]+dy*x[1])>pr(A)+pr(B))return 0}return 1}
const FS=['Aref Ruqaa','Amiri','Scheherazade New'];
// Paint nearby decoration during idle time, one section at a time. Keyboard-only
// height changes never rebuild page-sized bitmaps. Text remains at 8% opacity.
const patternRules=new Map(),patternSizes=new Map(),patternPending=new Set(),patternVisible=new Set([0]);
let patternReady=false,patternIdle=null,patternWidth=innerWidth;
function drainPatterns(){
 patternIdle=null;if(!patternReady||document.hidden||$('#pg-home').hidden)return;
 const index=patternPending.values().next().value;if(index===undefined)return;
 patternPending.delete(index);try{pat(index);}catch{/* Optional decoration must not interrupt the page. */}schedulePatterns();
}
function schedulePatterns(){
 if(patternIdle!==null||!patternReady||!patternPending.size||document.hidden||$('#pg-home').hidden)return;
 patternIdle='requestIdleCallback' in window?requestIdleCallback(drainPatterns,{timeout:1500}):setTimeout(drainPatterns,32);
}
function pat(index){
 if(typeof index!=='number'){patternVisible.forEach(i=>patternPending.add(i));schedulePatterns();return;}
 if(!$('#why').offsetWidth)return;
 const E=V.map(v=>document.querySelector(v[0])),A=E.map(e=>e.offsetWidth*e.offsetHeight),T=A.reduce((a,b)=>a+b,0),mobile=matchMedia('(max-width:700px)').matches,sc=Math.min(mobile?1:1.5,devicePixelRatio||1);let p=0;
 V.forEach((v,i)=>{
  const n=i<V.length-1?Math.min(Math.round(AY.length*A[i]/T),AY.length-p):AY.length-p,words=AY.slice(p,p+n);p+=n;
  if(i!==index)return;
  const w=E[i].offsetWidth,h=E[i].offsetHeight,key=w+'x'+h+'x'+sc;
  if(!w||!h||patternSizes.get(i)===key)return;
  const R=mul(i*97+13),cv=document.createElement('canvas');cv.width=w*sc;cv.height=h*sc;const g=cv.getContext('2d');if(!g)return;
  g.scale(sc,sc);g.fillStyle=v[4];g.textAlign='center';g.textBaseline='middle';
  const fo=(size,font)=>size+'px "'+font+'",serif',it=words.map(t=>{const f=FS[Math.floor(R()*3)];g.font=fo(24,f);return{t,f,m:g.measureText(t).width}}).sort((a,b)=>b.m-a.m);
  const S=it.reduce((sum,o)=>sum+(o.m+6)*34,0)||1,k=Math.min(2.6,Math.max(.7,Math.sqrt(.5*w*h/S))),P=[];
  const ang=()=>{const r=R(),d=R()<.5?1:-1;return r<.55?(R()-.5)*.35:r<.78?d*(.5+R()*.4):r<.9?d*(1.35+R()*.3):d*(.15+R()*.3)};
  const put=(t,f,s0,ornament)=>{
   for(let shrink=0;shrink<7;shrink++){
    const z=s0*Math.pow(.88,shrink);g.font=fo(z,f);const m=ornament?z:g.measureText(t).width,hw=m/2+z*.1,hh=ornament?z*.55:z*.65;
    for(let attempt=0;attempt<(ornament?20:mobile?80:120);attempt++){
     const a=ang(),c=Math.abs(Math.cos(a)),sn=Math.abs(Math.sin(a)),ex=hw*c+hh*sn,ey=hw*sn+hh*c;if(ex*2>w||ey*2>h)continue;
     const O={cx:ex+R()*(w-2*ex),cy:ey+R()*(h-2*ey),hw,hh,c:Math.cos(a),s:Math.sin(a),r:Math.hypot(hw,hh)};if(P.some(b=>hit(O,b)))continue;
     P.push(O);g.save();g.translate(O.cx,O.cy);g.rotate(a);g.fillText(t,0,0);g.restore();return;
    }
    if(ornament)return;
   }
  };
  it.forEach(o=>put(o.t,o.f,24*k*(.82+R()*.4),false));
  for(let q=0;q<(mobile?64:160);q++)put('\u06DE','Amiri',13+R()*11,true);
  const u=cv.toDataURL();patternRules.set(i,v[5]?`${v[1]}{background:url("${u}") 0 0/100% 100% no-repeat,${v[5]}}`:`${v[1]}{background-image:url("${u}");background-size:100% 100%;background-repeat:no-repeat}`);
  if(!pst){pst=document.createElement('style');pst.id='annoor-patterns';document.head.appendChild(pst);}
  pst.textContent=[...patternRules.values()].join('');patternSizes.set(i,key);
 });
}
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const index=V.findIndex(v=>document.querySelector(v[0])===entry.target);if(index<0)return;
  entry.target.classList.toggle('outside-viewport',!entry.isIntersecting);
  if(entry.isIntersecting){patternVisible.add(index);patternPending.add(index);schedulePatterns();}else{patternVisible.delete(index);patternPending.delete(index);}
 }),{rootMargin:'180px 0px'});V.forEach(v=>observer.observe(document.querySelector(v[0])));
}else V.forEach((_,i)=>patternVisible.add(i));
addEventListener('resize',()=>{if(Math.abs(innerWidth-patternWidth)<8)return;patternWidth=innerWidth;clearTimeout(rt);rt=setTimeout(pat,400);});
document.addEventListener('visibilitychange',()=>{document.documentElement.toggleAttribute('data-page-paused',document.hidden);if(!document.hidden)pat();});
Promise.all(FS.map(f=>document.fonts?.load('40px "'+f+'"','نور'))).then(()=>{patternReady=true;pat();},()=>{patternReady=true;pat();});

// Remember the visitor's explicit language preference. Storage can be unavailable in private modes.
try { const savedLanguage=localStorage.getItem('annoor-language'); if(savedLanguage==='bn'||savedLanguage==='en') document.documentElement.lang=savedLanguage; } catch (_) {}
const languageButton=$('#tg');
function syncLanguageButton(){
  const next=L()==='bn'?'English':'বাংলা';
  languageButton.setAttribute('aria-label',L()==='bn'?'Switch website language to English':'ওয়েবসাইটের ভাষা বাংলায় পরিবর্তন করুন');
  languageButton.setAttribute('title',L()==='bn'?'Switch to English':'বাংলায় পরিবর্তন করুন');
  languageButton.setAttribute('aria-live','polite');
}
syncLanguageButton();
$('#tg').onclick=()=>{
  document.documentElement.lang=L()==='bn'?'en':'bn';
  try {localStorage.setItem('annoor-language',L());} catch (_) {}
  syncLanguageButton();sum();seo();setTimeout(pat,80)
};
const why=[['🎓','অভিজ্ঞ ও যত্নশীল শিক্ষক','Caring, experienced teachers'],['🏠','ঘরে বসে অনলাইন শিক্ষা','Learn online from home'],['🌍','দেশে ও প্রবাসে শেখার সুবিধা','Learn from Bangladesh or abroad'],['🤝','ব্যক্তিগত মনোযোগ','Personal attention'],['📖','কুরআন ও ইসলামিক শিক্ষার সমন্বয়','Quran and Islamic studies together'],['💬','অভিভাবকদের সঙ্গে নিয়মিত যোগাযোগ','Regular parent communication'],['🕒','সময়সূচি সমন্বয়ের সুবিধা','Flexible schedule coordination'],['🌱','সহজবোধ্য ও যত্নশীল শিক্ষাপদ্ধতি','Supportive, accessible teaching']];
$('#wg').innerHTML=why.map(w=>`<div class="card"><div class="ic">${w[0]}</div><h3>${B(w[1],w[2])}</h3></div>`).join('');
const PO=[[1.08,.2079,.0572,1],[1.08,.1926,.1306,1],[1.08,.1811,.0303,0]];
const PH=['assets/images/brand-asset-2.webp','assets/images/brand-asset-3.webp','assets/images/brand-asset-4.webp'];
const NM=[['হাঃ মোঃ হেদায়েতুল্লাহ','H. Md. Hedayetullah'],['হাঃ মোঃ রহমতুল্লাহ','H. Md. Rahmatullah'],['ক্বারী মোঃ নিয়ামতুল্লাহ','Qari Md. Niamatullah']];
const nm=i=>NM[i]?B(NM[i][0],NM[i][1]):B('মাওলানা [শিক্ষকের নাম]','Maulana [Teacher name]');
const TD=[['Quran & Tajweed Instructor','কুরআন ও তাজবীদ শিক্ষক'],['Islamic Studies Instructor','ইসলামিক স্টাডিজ শিক্ষক'],['Beginner Quran Instructor','প্রাথমিক কুরআন শিক্ষক']];
const TBA=B('[অ্যাডমিন যুক্ত করবেন]','[Admin to add]');
const ph=i=>PH[i]?`<div class="pf"><div class="im"><img src="${PH[i]}" width="480" height="720" loading="lazy" decoding="async" alt="${NM[i][0]} – ${TD[i][1]}" class="${PO[i][3]?'mr':''}" style="--w:${PO[i][0]};--l:${PO[i][1]};--t:${PO[i][2]}"></div></div>`:`<div class="pf"><div class="im sil"><svg viewBox="0 0 100 120" aria-hidden="true"><circle cx="50" cy="42" r="19"/><path d="M10 120c0-27 17-42 40-42s40 15 40 42z"/></svg><span>${B('ছবি যুক্ত হবে','Photo to be added')}</span></div></div>`;
const row=(ic,bn,en)=>`<div class="ti"><b>${ic}</b><div><small>${B(bn,en)}</small><span>${TBA}</span></div></div>`;
const tgs=()=>`<div class="tgs"><span>${B('কুরআন মাজীদ','Quran Majeed')}</span><span>${B('তাজবীদ','Tajweed')}</span></div>`;
const wave=()=>Array.from({length:30},(_,k)=>`<span style="--h:${6+Math.round(18*Math.abs(Math.sin(k*1.7)*Math.cos(k*.6)))}px;--d:-${(k%7)*.12}s"></span>`).join('');
const player=()=>`<div class="ap"><audio preload="none"></audio><div class="ar1"><button type="button" class="pp" disabled aria-label="Play / Pause">▶</button><div class="at"><b>${B('কুরআন তিলাওয়াত','Quran recitation')}</b><small class="st">${B('অডিও আপলোডের অপেক্ষায়','Waiting for audio upload')}</small></div></div><div class="wv" aria-hidden="true">${wave()}</div><input class="sk" type="range" min="0" max="1000" value="0" disabled aria-label="Progress"><div class="ar2"><i class="t1">0:00</i><i class="t2">0:00</i><label class="vol">🔊<input class="vl" type="range" min="0" max="1" step=".05" value="1" aria-label="Volume"></label></div><label class="ld">${B('নিজের অডিও দিয়ে প্রিভিউ (সংরক্ষিত হবে না)','Preview with your own audio (not saved)')}<input type="file" accept="audio/*" hidden></label></div>`;
$('#tg2').innerHTML=TD.map((d,i)=>`<article class="tcd">${ph(i)}<div class="teacher-summary"><div class="teacher-status"><span class="teacher-index">${B(['০১','০২','০৩'][i],'0'+(i+1))}</span><span class="tag">${B('যাচাই বাকি','Unverified')}</span></div><h3>${nm(i)}</h3><p class="ds">${B(d[1],d[0])}</p>${tgs()}</div><button type="button" class="btn vp" data-i="${i}">${B('প্রোফাইল ও তিলাওয়াত','Profile & recitation')} →</button></article>`).join('');
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){const c=x.target;c.style.animationDelay=(c.dataset.n*.14)+'s';c.classList.remove('rv');c.classList.add('in');io.unobserve(c)}}),{threshold:.12});document.querySelectorAll('.tcd').forEach((c,n)=>{c.dataset.n=n;c.classList.add('rv');io.observe(c)})}
const dlg=document.createElement('dialog');dlg.setAttribute('aria-label','Teacher profile');document.body.appendChild(dlg);
function openP(i){const d=TD[i];dlg.innerHTML=`<button type="button" class="dx" aria-label="Close">×</button><div class="dg">${ph(i)}<div><h3>${nm(i)}</h3><p class="ds">${B(d[1],d[0])}</p>${tgs()}<h4>${B('বিস্তারিত পরিচিতি','Biography')}</h4><p>${TBA}</p><h4>${B('শিক্ষাদান পদ্ধতি','Teaching methodology')}</h4><p>${TBA}</p>${player()}<a class="btn p" href="#/admission" data-close>${B('ভর্তি আবেদন','Apply for admission')}</a></div></div>`;dlg.showModal()}
dlg.addEventListener('close',()=>dlg.querySelectorAll('audio').forEach(a=>a.pause()));
const fm=s=>isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
document.addEventListener('click',e=>{const v=e.target.closest('.vp');if(v)return openP(+v.dataset.i);if(e.target.closest('.dx')||e.target.closest('[data-close]')||e.target===dlg)return dlg.close();const b=e.target.closest('.pp');if(b){const a=b.closest('.ap').querySelector('audio');a.paused?a.play().catch(()=>{b.closest('.ap').querySelector('.st').innerHTML=B('অডিও চালানো যায়নি। অন্য ফাইল চেষ্টা করুন।','Unable to play audio. Try another file.')}):a.pause()}});
document.addEventListener('change',e=>{if(!e.target.matches('.ld input'))return;const f=e.target.files[0],ap=e.target.closest('.ap'),a=ap.querySelector('audio');if(!f)return;if(a.dataset.u)URL.revokeObjectURL(a.dataset.u);a.dataset.u=URL.createObjectURL(f);a.src=a.dataset.u;ap.querySelector('.pp').disabled=false;ap.querySelector('.sk').disabled=false;ap.querySelector('.st').textContent=f.name});
document.addEventListener('input',e=>{const r=e.target,ap=r.closest&&r.closest('.ap');if(!ap)return;const a=ap.querySelector('audio');if(r.matches('.sk')&&a.duration)a.currentTime=r.value/1000*a.duration;if(r.matches('.vl'))a.volume=r.value});
['play','pause','ended','timeupdate','loadedmetadata','waiting','canplay'].forEach(n=>document.addEventListener(n,e=>{const a=e.target;if(a.tagName!='AUDIO')return;const ap=a.closest('.ap'),pp=ap.querySelector('.pp');
if(n=='play'){document.querySelectorAll('audio').forEach(o=>o!==a&&o.pause());ap.classList.add('pl');pp.textContent='❚❚'}
if(n=='pause'||n=='ended'){ap.classList.remove('pl');pp.textContent='▶'}
if(n=='waiting')ap.classList.add('ld2');if(n=='canplay')ap.classList.remove('ld2');
if(n=='timeupdate'||n=='loadedmetadata'){ap.querySelector('.sk').value=a.duration?a.currentTime/a.duration*1000:0;ap.querySelector('.t1').textContent=fm(a.currentTime);ap.querySelector('.t2').textContent=fm(a.duration)}},true));
const bd=n=>n.toLocaleString('bn-BD',{useGrouping:false});
const pk=[['Basic','কায়দা ও কুরআন শিক্ষার সহজ শুরু','A simple start with Qaida & Quran',1499,999,5,12.99,8.99],['Standard','কায়দা, কুরআন ও তাজবীদ: গোছানো শিক্ষা','Qaida, Quran & Tajweed, structured',2499,1999,5,20.99,16.99],['Premium','পূর্ণাঙ্গ ইসলামিক শিক্ষা','Complete Islamic learning',3499,2999,6,28.99,24.99]];
const classDays=p=>B(p[0]==='Premium'?'শনিবার–বৃহস্পতিবার':'শনিবার–বুধবার',p[0]==='Premium'?'Saturday–Thursday':'Saturday–Wednesday');
const S=[['কায়দা','Qaida'],['কুরআন মাজীদ','Quran Majeed'],['তাজবীদ','Tajweed'],['হাদীস','Hadith'],['মাসআলা',"Masa'il (Islamic rulings)"]],INC=[[1,1,0,0,0],[1,1,1,0,0],[1,1,1,1,1]];
const cur=(p,o)=>B('৳'+bd(o?p[3]:p[4]),'$'+(o?p[6]:p[7]).toFixed(2));
$('#pg').innerHTML=pk.map((p,i)=>{const c=['b','s','p'][i],pb=Math.round((1-p[4]/p[3])*100),pu=Math.round((1-p[7]/p[6])*100);
return`<article class="pk2 t-${c}">${i==1?`<span class="rbn">${B('তাজবীদসহ শিক্ষা','Includes Tajweed')}</span>`:''}${i==2?`<span class="rbn gd">${B('সম্পূর্ণ শিক্ষা','Complete')}</span>`:''}<div class="pk-h"><span class="pk-ic">${['📖','🌙','👑'][i]}</span><div><h3>${p[0]}</h3><p>${B(p[1],p[2])}</p></div></div><div class="pr2"><div class="pr2-o"><s>${cur(p,1)}</s><span class="sv">${B('−'+bd(pb)+'%','−'+pu+'%')}</span></div><div class="pr2-n"><strong>${cur(p,0)}</strong><small>/ ${B('মাস','month')}</small></div><div class="pr2-s">${B('সাশ্রয় ৳'+bd(p[3]-p[4]),'You save $'+(p[6]-p[7]).toFixed(2))}</div></div><ul class="pk-l">${S.map((s,k)=>`<li class="${INC[i][k]?'y':'n'}"><i>${INC[i][k]?'✓':'–'}</i><span>${B(s[0],s[1])}</span></li>`).join('')}</ul><div class="pk-m"><span>📅 ${B('সপ্তাহে '+bd(p[5])+' দিন ক্লাস',p[5]+' days / week')} · ${classDays(p)}</span><span>⏱ ${B('প্রতি ক্লাস ৬০ মিনিট','60 min / class')}</span></div><a class="btn pk-b" href="#/admission" data-p="${p[0]}">${B(p[0]+'-এ আবেদন','Apply · '+p[0])}</a></article>`}).join('');

// FAQ questions and answers are rendered in index.html for immediate access.
const LV=[['নতুন (এখনো শুরু করেনি)','New (not started yet)'],['নূরানী কায়দা','Noorani Qaida'],['কুরআন দেখে পড়তে পারে','Can read the Quran'],['তাজবীদসহ পড়তে পারে','Reads with Tajweed'],['হিফজ','Hifz']];
$('#lv').innerHTML=LV.map(l=>`<label class="lc"><input type="radio" name="lv" value="${l[1]}"><span>${B(l[0],l[1])}</span></label>`).join('');
// Hifz describes the student's current level, not an additional paid package.
function syncHifz(){
 const active=document.querySelector('input[name=lv]:checked')?.value==='Hifz';
 $('#hifz-details').hidden=!active;
 const field=$('#hifz-progress');field.disabled=!active;field.required=active;
 if(!active){field.classList.remove('bad');field.removeAttribute('aria-invalid');}
 document.querySelector('input[name=lv][value=Hifz]').setAttribute('aria-expanded',String(active));
}
document.querySelector('input[name=lv][value=Hifz]').setAttribute('aria-controls','hifz-details');
$('#lv').addEventListener('change',syncHifz);
$('#fm').addEventListener('reset',()=>setTimeout(syncHifz,0));
syncHifz();
$('#pkg').innerHTML=pk.map(p=>`<label class="pc"><input type="radio" name="pkg" value="${p[0]}"><div><b>${p[0]}</b><small>${B(p[1],p[2])}</small><small>${classDays(p)} · ${B(bd(p[5])+' দিন',p[5]+' days')}</small><s>${cur(p,1)}</s><strong>${cur(p,0)}</strong></div></label>`).join('');
const sel=()=>{const r=document.querySelector('input[name=pkg]:checked');return r?pk.find(p=>p[0]==r.value):null};
function sum(){const p=sel(),e=$('#sm');if(!p){e.innerHTML=`<p style="color:rgba(236,253,245,.8);font-size:14px">${B('নির্বাচিত প্যাকেজের তথ্য এখানে দেখা যাবে।','Selected plan details will appear here.')}</p>`;return}
const i=pk.indexOf(p),sb=S.filter((s,k)=>INC[i][k]).map(s=>s[0]).join('، '),se=S.filter((s,k)=>INC[i][k]).map(s=>s[1]).join(', ');
e.innerHTML=`<div class="sr"><span>${B('প্যাকেজ','Package')}</span><b>${p[0]}</b></div><div class="sr"><span>${B('বিষয়','Subjects')}</span><b>${B(sb,se)}</b></div><div class="sr"><span>${B('ক্লাস','Classes')}</span><b>${B('সপ্তাহে '+bd(p[5])+'টি · ৬০ মিনিট',p[5]+'/week · 60 min')} · ${classDays(p)}</b></div><div class="sr"><span>${B('মাসিক ফি (অফার)','Monthly fee (offer)')}</span><b>${cur(p,0)}</b></div><div class="sr"><span>${B('প্রথম মাসের ফি','First month’s fee')}</span><b><span id="fee-sidebar"></span></b></div><div class="sr"><span>${B('ফেরতের নিয়ম','Refund policy')}</span><b>${B('১ সপ্তাহের কম ক্লাস করে ছেড়ে দিলে অথবা ভর্তি বাতিল করলে পরিশোধিত ফি-এর ৭৫%।','75% of the fee paid if leaving after less than one week of classes or cancelling enrolment.')}</b></div>`}
document.querySelectorAll('[data-p]').forEach(a=>a.addEventListener('click',()=>{const r=document.querySelector(`input[name=pkg][value="${a.dataset.p}"]`);if(r){r.checked=true;sum()}}));
document.addEventListener('change',e=>{if(e.target.name=='pkg')sum()});sum();
$('#fm').addEventListener('submit',e=>{e.preventDefault();$('#admission-submit-status').hidden=true;const bad=(el,c)=>{el.classList.toggle('bad',!!c);el.setAttribute('aria-invalid',String(!!c));return c},v=id=>$('#'+id).value.trim(),age=+v('ge');
const x=[bad($('#sn'),!v('sn')),bad($('#student-gender'),!['boy','girl'].includes(v('student-gender'))),bad($('#ad'),!v('ad')),bad($('#ge'),!(Number.isInteger(age)&&age>=5&&age<=18)),bad($('#lv'),!document.querySelector('input[name=lv]:checked')),bad($('#hifz-progress'),!$('#hifz-progress').disabled&&!v('hifz-progress')),bad($('.wb'),!/^\+?[0-9][0-9\s\-]{6,17}$/.test(v('wa'))),bad($('#gn'),!v('gn')),bad($('#gr'),!v('gr')),bad($('#em'),v('em')&&!$('#em').validity.valid==true),bad($('#pkg'),!sel()),bad($('#k1'),!$('#c1').checked),bad($('#k2'),!$('#c2').checked),bad($('#k3'),!$('#c3').checked)];
if(x.some(Boolean)){const f=document.querySelector('#fm .bad');f.scrollIntoView({block:'center',behavior:'smooth'});(f.matches('input,textarea,select')?f:f.querySelector('input'))?.focus({preventScroll:true});return}
if(window.annoorSubmitAdmission){window.annoorSubmitAdmission();return;}
// Offline fallback.
const status=$('#admission-submit-status');status.innerHTML=B('অনলাইন আবেদন গ্রহণের সংযোগ এখনো চালু হয়নি। আবেদনটি জমা হয়নি; আপনার দেওয়া তথ্য ফর্মেই আছে।','Online application submission is not connected yet. Nothing was submitted; your entries remain in the form.');status.hidden=false;status.focus();
});
const GZ=[['🇬🇧','যুক্তরাজ্য','United Kingdom','Europe/London','লন্ডন','London'],['🇺🇸','যুক্তরাষ্ট্র','USA','America/New_York','নিউ ইয়র্ক','New York'],['🇨🇦','কানাডা','Canada','America/Toronto','টরন্টো','Toronto'],['🇦🇺','অস্ট্রেলিয়া','Australia','Australia/Sydney','সিডনি','Sydney'],['🇸🇦','সৌদি আরব','Saudi Arabia','Asia/Riyadh','রিয়াদ','Riyadh'],['🇦🇪','সংযুক্ত আরব আমিরাত','UAE','Asia/Dubai','দুবাই','Dubai'],['🇶🇦','কাতার','Qatar','Asia/Qatar','দোহা','Doha'],['🇰🇼','কুয়েত','Kuwait','Asia/Kuwait','কুয়েত সিটি','Kuwait City'],['🇲🇾','মালয়েশিয়া','Malaysia','Asia/Kuala_Lumpur','কুয়ালালামপুর','Kuala Lumpur']];
let gs=0;const bdz=s=>String(s).replace(/\d/g,c=>'০১২৩৪৫৬৭৮৯'[c]),bp=h=>h<4?'রাত':h<6?'ভোর':h<12?'সকাল':h<15?'দুপুর':h<18?'বিকাল':h<20?'সন্ধ্যা':'রাত';
$('#gcs').innerHTML=GZ.map((z,i)=>`<button type="button" data-g="${i}" aria-pressed="${i==0}">${z[0]} ${B(z[1],z[2])}</button>`).join('');
$('#gcs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;gs=+b.dataset.g;document.querySelectorAll('#gcs button').forEach(x=>x.setAttribute('aria-pressed',x==b));tk(true)});
const part=(tz,d)=>{const o={};new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}).formatToParts(d).forEach(p=>o[p.type]=+p.value);return o};
const off=(tz,t)=>{const o=part(tz,t);return(Date.UTC(o.year,o.month-1,o.day,o.hour,o.minute,o.second)-t)/6e4};
const ck=(lb,city,tz,t)=>{const o=part(tz,t),h=o.hour%12||12,m=String(o.minute).padStart(2,'0'),d=new Date(t);return`<small>${lb}</small><b>${city}</b><div class="tm"><i class="bn">${bdz(h)}:${bdz(m)}<span>${bp(o.hour)}</span></i><i class="en">${h}:${m}<span>${o.hour<12?'AM':'PM'}</span></i> ${o.hour>=6&&o.hour<18?'☀️':'🌙'}</div><div class="dt">${B(d.toLocaleDateString('bn-BD',{timeZone:tz,weekday:'long',day:'numeric',month:'long'}),d.toLocaleDateString('en-GB',{timeZone:tz,weekday:'short',day:'numeric',month:'short'}))}</div>`};
let clockVisible=true,clockKey='';
function tk(force=false){if($('#pg-home').hidden||!force&&(document.hidden||!clockVisible))return;const key=Math.floor(Date.now()/60000)+'-'+gs+'-'+L();if(!force&&clockKey===key)return;clockKey=key;const t=Math.floor(Date.now()/1000)*1000,z=GZ[gs],df=(off('Asia/Dhaka',t)-off(z[3],t))/60,a=Math.abs(df),hs=Number.isInteger(a)?a:a.toFixed(1);
$('#clk-bd').innerHTML=ck(B('বাংলাদেশ','Bangladesh'),B('ঢাকা','Dhaka'),'Asia/Dhaka',t);$('#clk-sel').innerHTML=ck(B(z[1],z[2]),B(z[4],z[5]),z[3],t);
$('#gdf').innerHTML=df==0?B('বাংলাদেশের সঙ্গে একই সময়','Same time as Bangladesh'):B(`বাংলাদেশের সময় ${z[4]}-এর চেয়ে ${bdz(hs)} ঘণ্টা ${df>0?'এগিয়ে':'পিছিয়ে'}`,`Bangladesh is ${hs} hour${a==1?'':'s'} ${df>0?'ahead of':'behind'} ${z[5]}`)}
setInterval(tk,1000);tk(true);
if('IntersectionObserver' in window){const clockObserver=new IntersectionObserver(entries=>{clockVisible=entries[0].isIntersecting;if(clockVisible)tk(true);});clockObserver.observe($('#global'));}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&clockVisible)tk(true);});
const SEO={"bn": {"h": "অনলাইন কুরআন শিক্ষা — ৫–১৮ বছরের শিক্ষার্থীদের জন্য | আননূর", "a": "অনলাইন ভর্তি আবেদন | আননূর ইন্টারন্যাশনাল অনলাইন মাদরাসা"}, "en": {"h": "Online Quran Classes for Ages 5–18 | An-Noor International", "a": "Admission application | An-Noor International Online Madrasa"}},SD={"bn": {"h": "বাংলাদেশ ও প্রবাসের ৫–১৮ বছরের শিক্ষার্থীদের অনলাইন কায়দা, কুরআন ও তাজবীদ শিক্ষা। প্যাকেজ, ক্লাসের সময়, মাসিক ফি ও ভর্তি আবেদনের তথ্য জানুন।", "a": "আননূর ইন্টারন্যাশনাল অনলাইন মাদরাসায় অনলাইনে সন্তানের ভর্তি আবেদন। সন্তানের তথ্য ও প্যাকেজ নির্বাচনের মাধ্যমে আবেদন করা যায়; প্রশাসন হোয়াটসঅ্যাপে যোগাযোগ করবে।"}, "en": {"h": "Online Qaida, Quran and Tajweed classes for learners aged 5–18 in Bangladesh and abroad. Explore learning plans, monthly fees, schedules and admission details.", "a": "Apply for your child’s admission to An-Noor International Online Madrasa with student and guardian details. The administration will contact the guardian on WhatsApp."}};
function seo(){const l=document.documentElement.lang,a=location.hash.startsWith('#/admission'),k=a?'a':'h',s=(q,v)=>{const e=document.querySelector(q);e&&e.setAttribute('content',v)};
if(location.hash==='#/courses'||location.hash==='#/login'){const course=location.hash==='#/courses';const title=(course?(l==='bn'?'রেকর্ডেড কোর্স':'Recorded courses'):(l==='bn'?'শিক্ষার্থীর লগইন':'Student login'))+' | An-Noor';const desc=course?(l==='bn'?'রেকর্ডেড কোর্সের তালিকা প্রকাশের অপেক্ষায়।':'The recorded course catalogue is awaiting publication.'):(l==='bn'?'প্রতিষ্ঠানের দেওয়া স্থায়ী ক্লাস আইডিতে অনুমোদিত শিক্ষার্থীদের ক্লাসে প্রবেশ।':'Approved students access assigned classes with an institution-issued classroom ID.');document.title=title;['meta[property=\"og:title\"]','meta[name=\"twitter:title\"]'].forEach(q=>s(q,title));['meta[name=description]','meta[property=\"og:description\"]','meta[name=\"twitter:description\"]'].forEach(q=>s(q,desc));return}document.title=SEO[l][k];s('meta[name=description]',SD[l][k]);s('meta[property="og:title"]',SEO[l][k]);s('meta[property="og:description"]',SD[l][k]);s('meta[name="twitter:title"]',SEO[l][k]);s('meta[name="twitter:description"]',SD[l][k]);s('meta[property="og:locale"]',l=='bn'?'bn_BD':'en_US')}
function route(){
 const key=location.hash.split('?')[0];
 const view=key==='#/admission'?'adm':key==='#/courses'?'courses':key==='#/login'?'login':'home';
 ['home','adm','courses','login'].forEach(id=>$('#pg-'+id).hidden=id!==view);
 document.querySelectorAll('audio').forEach(a=>a.pause());
 seo();
 if(view==='home'){
   const el=document.getElementById(key.slice(1)||'home');
   requestAnimationFrame(()=>{pat();(el||$('#home')).scrollIntoView({block:'start'});tk()});
 }else{
   scrollTo(0,0);
   const heading=$('#pg-'+view+' h1, #pg-'+view+' .h1');
   if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true})}
 }
 document.dispatchEvent(new Event('annoor:route'));
}
addEventListener('hashchange',route);route();
