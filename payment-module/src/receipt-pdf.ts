import {PDFDocument} from 'pdf-lib';
import {amountWords} from '../../shared/receipt-core.mjs';
import {calendar,feeLabels,methodLabels,money,packageLabels,type Issued,type Lang} from './receipt-types';

// The caller must obtain this snapshot from the authenticated print endpoint.
// Browser rendering preserves Bengali shaping; no receipt data leaves the device.
export function receiptPdfData(record:Issued,lang:Lang){
 const r=record,t=(bn:string,en:string)=>lang==='bn'?bn:en;
 if(r.status!=='ISSUED'||r.paymentStatus!=='CONFIRMED_PAID'||r.source!=='ADMIN_MANUAL'||!r.id||!/^AN-R-\d{4}-\d{6,}$/.test(r.receiptNumber))throw Error('PDF_NOT_CONFIRMED');
 if(![r.baseMinor,r.discountMinor,r.netMinor,r.receivedMinor,r.balanceMinor].every(Number.isSafeInteger)||r.baseMinor<=0||r.discountMinor<0||r.receivedMinor<=0||r.balanceMinor<0||r.baseMinor-r.discountMinor!==r.netMinor||r.receivedMinor+r.balanceMinor!==r.netMinor)throw Error('PDF_INVALID_RECEIPT');
 const label=(map:Record<string,[string,string]>,key:string)=>map[key]?.[lang==='bn'?0:1]||'—';
 return {
  institution:t('আননূর ইন্টারন্যাশনাল','An-Noor International'),subtitle:t('অনলাইন মাদরাসা','Online Madrasa'),title:t('অর্থপ্রাপ্তির রসিদ','MONEY RECEIPT'),copy:t('শিক্ষার্থী / অভিভাবকের কপি','Student / guardian copy'),number:r.receiptNumber,
  status:t('অর্থপ্রাপ্তি নথিভুক্ত','Payment recorded'),details:[
   [t('শিক্ষার্থীর নাম','Student name'),r.studentName],[t('শিক্ষার্থী আইডি','Student ID'),r.studentCode||'—'],
   [t('অভিভাবক','Guardian'),r.guardianName||'—'],[t('যোগাযোগ','Contact'),r.phone||'—'],
   [t('অর্থ গ্রহণের তারিখ','Payment date'),calendar(r.paidDate,lang)],[t('বিলের মাস','Billing month'),calendar(r.billingMonth,lang,true)]
  ],fee:label(feeLabels,r.feeType),description:[r.amountMode==='PACKAGE'?packageLabels[r.packageId]:t('বিশেষভাবে নির্ধারিত ফি','Custom fee'),r.description,r.feeType==='FIRST_MONTH'&&r.daysBilled?(r.daysBilled===r.daysInMonth?t('পূর্ণ মাসের ফি','Full-month fee'):t('অবশিষ্ট '+r.daysBilled+' দিনের ফি','Fee for '+r.daysBilled+' remaining days')):''].filter(Boolean).join(' · '),
  totals:[[t('নির্ধারিত ফি','Assigned fee'),money(r.baseMinor,lang)],[t('ছাড়','Discount'),money(r.discountMinor,lang)],[t('মোট প্রদেয়','Total payable'),money(r.netMinor,lang)],[t('গৃহীত অর্থ','Amount received'),money(r.receivedMinor,lang)],[t('এই বিলের বাকি','Balance on this bill'),money(r.balanceMinor,lang)]],
  words:t('কথায়: ','In words: ')+amountWords(r.receivedMinor,lang),payment:[t('মাধ্যম: ','Method: ')+label(methodLabels,r.method),r.method==='CASH'?'':t('লেনদেনের রেফারেন্স: ','Transaction reference: ')+r.transactionId].filter(Boolean).join(' · '),note:r.note?t('মন্তব্য: ','Note: ')+r.note:'',
  issuer:r.issuerName,receivedFor:t('কর্তৃপক্ষের পক্ষে গ্রহণকারী','Received for the institution'),signature:t('অনুমোদিত স্বাক্ষর','Authorized signature'),
  footer:t('কর্তৃপক্ষের যাচাই অনুযায়ী নথিভুক্ত। এটি কোনো পেমেন্ট সেবাদাতার সেটেলমেন্ট সনদ নয়।','Recorded after the administration’s review. This is not a provider settlement certificate.'),issued:t('ইস্যুর তারিখ: ','Issued: ')+calendar(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.issuedAt)),lang)
 };
}

const font='"AnNoor Receipt", "Nirmala UI", sans-serif';
let fontReady:Promise<void>|null=null;
async function loadReceiptFont(){
 if(!fontReady)fontReady=(async()=>{
  if(typeof FontFace==='undefined'||!document.fonts)throw Error('PDF_UNAVAILABLE');
  const url=new URL('../assets/fonts/NotoSansBengali-VF.ttf',location.href).href;
  const face=new FontFace('AnNoor Receipt',`url("${url}")`,{weight:'100 900'});let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([face.load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('PDF_UNAVAILABLE')),15000);})]);}finally{clearTimeout(timer);}document.fonts.add(face);
  await document.fonts.load('400 14px "AnNoor Receipt"');await document.fonts.load('700 14px "AnNoor Receipt"');
 })().catch(error=>{fontReady=null;throw error;});return fontReady;
}
export function wrapReceiptText(ctx:Pick<CanvasRenderingContext2D,'measureText'>,text:string,width:number):string[]{
 const lines:string[]=[];let line='';
 for(const word of text.split(/\s+/).filter(Boolean)){
  if(ctx.measureText(line?line+' '+word:word).width<=width){line=line?line+' '+word:word;continue;}
  if(line){lines.push(line);line='';}
  if(ctx.measureText(word).width<=width){line=word;continue;}
  // Keep combining marks/conjuncts together when a long ID or name must wrap.
  const parts:string[]=[];for(const char of word){const last=parts.length-1;if(last>=0&&(/\p{M}/u.test(char)||char==='\u200d'||/[\u09cd\u200d]$/.test(parts[last])))parts[last]+=char;else parts.push(char);}
  for(const part of parts){if(line&&ctx.measureText(line+part).width>width){lines.push(line);line='';}line+=part;}
 }
 if(line)lines.push(line);return lines.length?lines:[''];
}
function logo():Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const img=new Image(),timer=setTimeout(()=>reject(Error('PDF_IMAGE_UNAVAILABLE')),10000);img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(Error('PDF_IMAGE_UNAVAILABLE'));};img.src=new URL('../assets/images/brand-asset-1.webp',location.href).href;});}

export async function createReceiptPdf(record:Issued,lang:Lang):Promise<Blob>{
 const data=receiptPdfData(record,lang);await loadReceiptFont();const image=await logo();
 const width=760,padding=40,inner=width-padding*2,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('PDF_UNAVAILABLE');
 const ink='#1d3c30',green='#0b5c43',muted='#526d5e',line='#d7e5db',gold='#c2a365';
 function paint(c:CanvasRenderingContext2D){
  const text=(value:string,x:number,y:number,maxWidth:number,size=14,color=ink,weight=400)=>{c.font=`${weight} ${size}px ${font}`;c.fillStyle=color;const rows=wrapReceiptText(c,value,maxWidth);for(const [i,row]of rows.entries())c.fillText(row,x,y+i*(size*1.65));return rows.length*size*1.65;};
  const rule=(y:number)=>{c.strokeStyle=line;c.lineWidth=1;c.beginPath();c.moveTo(padding,y);c.lineTo(width-padding,y);c.stroke();};
  c.textBaseline='top';c.fillStyle=green;c.fillRect(0,0,width,8);c.fillStyle=gold;c.fillRect(width-150,0,150,8);
  c.drawImage(image,padding,32,88,88);text(data.institution,padding+108,39,inner-108,25,green,700);text(data.subtitle,padding+108,82,inner-108,17,ink,600);text(data.copy,padding+108,113,inner-108,11,muted);
  let y=155;rule(y);y+=18;text(data.title,padding,y,inner,11,muted,700);y+=24;text(data.number,padding,y,inner*.6,18,green,700);text(data.status,width-padding-205,y+2,205,12,green,600);y+=43;rule(y);y+=24;
  for(let i=0;i<data.details.length;i+=2){const h:number[]=[];for(let k=0;k<2;k++){const [label,value]=data.details[i+k],x=padding+k*(inner/2+14);text(label,x,y,inner/2-20,11,muted);h.push(text(value,x,y+23,inner/2-20,15,ink,600));}y+=23+Math.max(...h)+20;}
  c.fillStyle=green;c.fillRect(padding,y,inner,34);text(lang==='bn'?'ফি বিবরণ':'Fee description',padding+14,y+8,inner-28,12,'#ffffff',600);y+=48;y+=text(data.fee,padding+12,y,inner-24,16,ink,700)+4;y+=text(data.description,padding+12,y,inner-24,12,muted)+16;rule(y);y+=15;
  for(const [index,[label,value]]of data.totals.entries()){
   const received=index===3;if(received){c.fillStyle='#e6f3eb';c.fillRect(padding,y-5,inner,40);}
   text(label,padding+12,y,inner*.5,received?16:13,received?green:muted,received?700:400);
   c.font=`${received?700:600} ${received?18:14}px ${font}`;c.fillStyle=received?green:ink;c.textAlign='right';c.fillText(value,width-padding-12,y);c.textAlign='left';y+=received?47:31;
  }
  y+=10;y+=text(data.words,padding,y,inner,13,green,600)+15;rule(y);y+=18;y+=text(data.payment,padding,y,inner,12,muted)+12;if(data.note)y+=text(data.note,padding,y,inner,12,muted)+12;
  y+=28;const issuerHeight=text(data.issuer,padding,y,inner/2-20,14,ink,600);const signatureY=y+Math.max(issuerHeight,24);c.strokeStyle='#8ca897';c.beginPath();c.moveTo(width-padding-190,signatureY);c.lineTo(width-padding,signatureY);c.stroke();y=signatureY+9;text(data.receivedFor,padding,y,inner/2-20,11,muted);text(data.signature,width-padding-190,y,190,11,muted);y+=40;rule(y);y+=16;y+=text(data.footer,padding,y,inner,10,muted)+8;y+=text(data.issued,padding,y,inner,10,muted);return Math.ceil(y+30);
 }
 const height=paint(ctx);if(height>1500)throw Error('PDF_LAYOUT_TOO_LONG');
 canvas.width=width*2;canvas.height=height*2;const render=canvas.getContext('2d');if(!render)throw Error('PDF_UNAVAILABLE');render.scale(2,2);render.fillStyle='#ffffff';render.fillRect(0,0,width,height);paint(render);
 const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PDF_UNAVAILABLE')),'image/png'));
 const pdf=await PDFDocument.create(),page=pdf.addPage([595.28,841.89]),bitmap=await pdf.embedPng(await png.arrayBuffer()),margin=28,scale=Math.min((page.getWidth()-margin*2)/width,(page.getHeight()-margin*2)/height);
 page.drawImage(bitmap,{x:(page.getWidth()-width*scale)/2,y:page.getHeight()-margin-height*scale,width:width*scale,height:height*scale});
 pdf.setTitle('An-Noor Receipt '+data.number);pdf.setSubject('Administrator-issued manual receipt');pdf.setProducer('An-Noor Receipt Desk');
 const bytes=await pdf.save();canvas.width=canvas.height=1;return new Blob([new Uint8Array(bytes).buffer],{type:'application/pdf'});
}
