// Shared display/validation rules. The server always recalculates these values.
export const PACKAGES = Object.freeze({basic:99900,standard:199900,premium:299900});
export const METHODS = Object.freeze(['CASH','BKASH','NAGAD','ROCKET','BANK']);
export const FEE_TYPES = Object.freeze(['MONTHLY','FIRST_MONTH','ADMISSION','OTHER']);
const invalid = code => {throw Object.assign(Error(code),{status:400});};
export const latinDigits = value => String(value??'').replace(/[০-৯]/g,c=>String('০১২৩৪৫৬৭৮৯'.indexOf(c)));
export function moneyMinor(value){
 const s=latinDigits(value).trim();
 if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(s))invalid('INVALID_AMOUNT');
 const [whole,part='']=s.split('.'),n=Number(whole)*100+Number(part.padEnd(2,'0'));
 if(!Number.isSafeInteger(n)||n>100000000)invalid('INVALID_AMOUNT');
 return n;
}
export function validDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T12:00:00Z');
 return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;
}
export function dhakaToday(now=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function calculateAmounts(input){
 if(!FEE_TYPES.includes(input.feeType)||!['PACKAGE','CUSTOM'].includes(input.amountMode))invalid('INVALID_FEE');
 let baseMinor,daysBilled=null,daysInMonth=null;
 if(input.amountMode==='CUSTOM')baseMinor=moneyMinor(input.customAmount);
 else{
  if(!['MONTHLY','FIRST_MONTH'].includes(input.feeType)||!Object.hasOwn(PACKAGES,input.packageId))invalid('INVALID_FEE');
  baseMinor=PACKAGES[input.packageId];
 }
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.billingMonth||'')||Number(input.billingMonth.slice(0,4))<2025||Number(input.billingMonth.slice(0,4))>2100)invalid('INVALID_MONTH');
 if(input.feeType==='FIRST_MONTH'){
  if(!validDate(input.enrollmentDate)||!input.enrollmentDate.startsWith(input.billingMonth+'-'))invalid('INVALID_ENROLLMENT_DATE');
  const [y,m,day]=input.enrollmentDate.split('-').map(Number);
  daysInMonth=new Date(Date.UTC(y,m,0)).getUTCDate();
  daysBilled=day<=7?daysInMonth:daysInMonth-day+1;
  if(input.amountMode==='PACKAGE')baseMinor=Math.round(baseMinor*daysBilled/daysInMonth);
 }
 const discountMinor=moneyMinor(input.discount||'0'),receivedMinor=moneyMinor(input.receivedAmount);
 if(baseMinor<=0||discountMinor>=baseMinor||receivedMinor<=0||receivedMinor>baseMinor-discountMinor)invalid('AMOUNT_MISMATCH');
 return {baseMinor,discountMinor,netMinor:baseMinor-discountMinor,receivedMinor,balanceMinor:baseMinor-discountMinor-receivedMinor,daysBilled,daysInMonth};
}
const text=(value,max=120,required=false)=>{
 if(value===undefined||value===null)value='';
 if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value))invalid('INVALID_RECEIPT');
 value=value.trim();if(required&&!value)invalid('INVALID_RECEIPT');return value;
};
export function normalizeReceipt(input,today=dhakaToday()){
 const amounts=calculateAmounts(input);
 const studentName=text(input.studentName,100,true),studentCode=text(input.studentCode,40),guardianName=text(input.guardianName,100),phone=text(latinDigits(input.phone),24);
 if(phone&&!/^\+?[\d ()-]{7,24}$/.test(phone))invalid('INVALID_PHONE');
 if(!METHODS.includes(input.method)||!validDate(input.paidDate)||input.paidDate>today)invalid('INVALID_PAYMENT_DETAILS');
 const reference=text(input.transactionId,80).toUpperCase();
 if(input.method!=='CASH'&&!reference)invalid('REFERENCE_REQUIRED');
 if(reference&&!(input.method==='BANK'?/^[A-Z0-9][A-Z0-9 /-]{2,79}$/:/^[A-Z0-9]{5,40}$/).test(reference))invalid('INVALID_REFERENCE');
 const customReason=text(input.customReason,160),description=text(input.description,160),note=text(input.note,240),evidenceReference=text(input.evidenceReference,160,true);
 if(evidenceReference.length<6)invalid('VERIFICATION_REQUIRED');
 if(input.amountMode==='CUSTOM'&&customReason.length<6)invalid('CUSTOM_REASON_REQUIRED');
 if(input.feeType==='OTHER'&&!description)invalid('DESCRIPTION_REQUIRED');
 if(input.verified!==true)invalid('VERIFICATION_REQUIRED');
 return {studentName,studentCode,guardianName,phone,studentId:text(input.studentId,40),feeType:input.feeType,packageId:input.amountMode==='PACKAGE'?input.packageId:'',billingMonth:input.billingMonth,enrollmentDate:input.feeType==='FIRST_MONTH'?input.enrollmentDate:'',amountMode:input.amountMode,customReason,description,note,method:input.method,transactionId:reference,paidDate:input.paidDate,evidenceReference,...amounts};
}
const bnNumbers=['শূন্য','এক','দুই','তিন','চার','পাঁচ','ছয়','সাত','আট','নয়','দশ','এগারো','বারো','তেরো','চৌদ্দ','পনেরো','ষোলো','সতেরো','আঠারো','উনিশ','বিশ','একুশ','বাইশ','তেইশ','চব্বিশ','পঁচিশ','ছাব্বিশ','সাতাশ','আটাশ','ঊনত্রিশ','ত্রিশ','একত্রিশ','বত্রিশ','তেত্রিশ','চৌত্রিশ','পঁয়ত্রিশ','ছত্রিশ','সাঁইত্রিশ','আটত্রিশ','ঊনচল্লিশ','চল্লিশ','একচল্লিশ','বিয়াল্লিশ','তেতাল্লিশ','চুয়াল্লিশ','পঁয়তাল্লিশ','ছেচল্লিশ','সাতচল্লিশ','আটচল্লিশ','ঊনপঞ্চাশ','পঞ্চাশ','একান্ন','বায়ান্ন','তিপ্পান্ন','চুয়ান্ন','পঞ্চান্ন','ছাপ্পান্ন','সাতান্ন','আটান্ন','ঊনষাট','ষাট','একষট্টি','বাষট্টি','তেষট্টি','চৌষট্টি','পঁয়ষট্টি','ছেষট্টি','সাতষট্টি','আটষট্টি','ঊনসত্তর','সত্তর','একাত্তর','বাহাত্তর','তিয়াত্তর','চুয়াত্তর','পঁচাত্তর','ছিয়াত্তর','সাতাত্তর','আটাত্তর','ঊনআশি','আশি','একাশি','বিরাশি','তিরাশি','চুরাশি','পঁচাশি','ছিয়াশি','সাতাশি','আটাশি','ঊননব্বই','নব্বই','একানব্বই','বিরানব্বই','তিরানব্বই','চুরানব্বই','পঁচানব্বই','ছিয়ানব্বই','সাতানব্বই','আটানব্বই','নিরানব্বই'];
const enSmall=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
function words(n,lang){
 if(lang==='bn'&&n<100)return bnNumbers[n];
 if(lang!=='bn'&&n<20)return enSmall[n];
 if(lang!=='bn'&&n<100)return ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'][Math.floor(n/10)]+(n%10?' '+words(n%10,lang):'');
 const units=lang==='bn'?[[100000,'লাখ'],[1000,'হাজার'],[100,'শত']]:[[1000000,'million'],[1000,'thousand'],[100,'hundred']];
 for(const [size,label] of units)if(n>=size)return words(Math.floor(n/size),lang)+' '+label+(n%size?' '+words(n%size,lang):'');
 return '';
}
export function amountWords(minor,lang='bn'){
 if(!Number.isSafeInteger(minor)||minor<0||minor>100000000)return '';
 return words(Math.floor(minor/100),lang)+(lang==='bn'?' টাকা':' taka')+(minor%100?' '+words(minor%100,lang)+(lang==='bn'?' পয়সা':' paisa'):'')+(lang==='bn'?' মাত্র':' only');
}
