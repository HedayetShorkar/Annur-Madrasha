import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import ReceiptPaper from './ReceiptPaper';
import Icon from './DeskIcon';
import {calendar,money,type Lang,type ReceiptCopy} from './receipt-types';
import {createReceiptPdf,downloadReceiptPdf} from './receipt-export';
type Summary=Pick<ReceiptCopy,'id'|'receiptNumber'|'billingMonth'|'paidDate'|'receivedMinor'>;
type Copies={items:Summary[];total:number;offset:number};
type Api=<T>(path:string,body?:Record<string,unknown>)=>Promise<T>;

// This component is mounted only after a server-authenticated student session.
// Every list, open and export route independently enforces ownership on the server.
export default function MyReceipts({lang,api,onSessionEnded}:{lang:Lang;api:Api;onSessionEnded:()=>void}){
 const [page,setPage]=useState<Copies>({items:[],total:0,offset:0}),[record,setRecord]=useState<ReceiptCopy|null>(null),[printRecord,setPrintRecord]=useState<ReceiptCopy|null>(null),[pdfFile,setPdfFile]=useState<{url:string;filename:string}|null>(null);
 const [busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const alive=useRef(false),working=useRef(false),generation=useRef(0),preview=useRef<HTMLElement>(null);
 const t=(bn:string,en:string)=>lang==='bn'?bn:en;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
 useEffect(()=>{generation.current++;setPdfFile(null);setPrintRecord(null);},[lang]);
 useEffect(()=>()=>{if(pdfFile)URL.revokeObjectURL(pdfFile.url);},[pdfFile]);
 useEffect(()=>{if(!printRecord)return;let active=true;const title=document.title,after=()=>{setPrintRecord(null);document.title=title;};document.title=printRecord.receiptNumber;window.addEventListener('afterprint',after);
  Promise.resolve(document.fonts?.ready).then(()=>{if(active)requestAnimationFrame(()=>{if(active)window.print();});});return()=>{active=false;document.title=title;window.removeEventListener('afterprint',after);};
 },[printRecord]);
 async function run(fn:(current:()=>boolean)=>Promise<void>){
  if(working.current)return;working.current=true;setBusy(true);setError('');const version=generation.current,current=()=>alive.current&&generation.current===version;
  try{await fn(current);}catch(e){if(!current())return;const code=e instanceof Error?e.message:'REQUEST_FAILED';setRecord(null);setPrintRecord(null);setPdfFile(null);if(['LOGIN_REQUIRED','STUDENT_REQUIRED','ADMIN_REQUIRED'].includes(code)){onSessionEnded();return;}setError(code);}finally{working.current=false;if(alive.current)setBusy(false);}
 }
 async function load(offset=0){await run(async current=>{const next=await api<Copies>('/my-receipts?offset='+offset);if(current()){setPage(next);setLoaded(true);}});}
 useEffect(()=>{let active=true;setBusy(true);api<Copies>('/my-receipts?offset=0').then(next=>{if(active){setPage(next);setLoaded(true);}}).catch(e=>{if(!active)return;const code=e instanceof Error?e.message:'REQUEST_FAILED';if(['LOGIN_REQUIRED','STUDENT_REQUIRED','ADMIN_REQUIRED'].includes(code))onSessionEnded();else setError(code);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[]);
 async function open(id:string){await run(async current=>{const next=await api<ReceiptCopy>('/my-receipts/'+encodeURIComponent(id));if(current()){setPdfFile(null);setPrintRecord(null);setRecord(next);requestAnimationFrame(()=>preview.current?.scrollIntoView({behavior:'smooth',block:'start'}));}});}
 async function exportCopy(format:'PRINT'|'PDF'){
  if(!record||record.status!=='ISSUED')return;const language=lang;
  await run(async current=>{const next=await api<ReceiptCopy>('/my-receipts/'+encodeURIComponent(record.id)+'/print',{format});if(!current())return;setRecord(next);
   if(format==='PRINT'){setPrintRecord(next);return;}const blob=await createReceiptPdf(next,language);if(current())setPdfFile(downloadReceiptPdf(blob,next.receiptNumber));
  });
 }
 const printRoot=document.getElementById('receipt-print-root');
 return <section className="my-receipts" aria-busy={busy}>
  <div className="workspace-heading"><div><span className="desk-kicker">AN-NOOR · RECEIPT COPIES</span><h1>{t('আমার রসিদ','My receipts')}</h1><p>{t('শুধু আপনার শিক্ষার্থী অ্যাকাউন্টের সঙ্গে যুক্ত ইস্যু করা রসিদ এখানে পাওয়া যাবে।','Only issued receipts linked to your student account appear here.')}</p></div><button className="desk-outline" disabled={busy} onClick={()=>void load(page.offset)}>{t('হালনাগাদ করুন','Refresh')}</button></div>
  {error&&<p className="desk-message error-message" role="alert">{error==='RECEIPT_NOT_FOUND'?t('রসিদটি পাওয়া যাচ্ছে না। এটি বাতিল বা আপনার অ্যাকাউন্টের সঙ্গে যুক্ত নয়।','This receipt is unavailable, voided or not linked to your account.'):t('রসিদ লোড করা যায়নি। সংযোগ যাচাই করে আবার চেষ্টা করুন।','The receipt could not be loaded. Check your connection and retry.')}</p>}
  {!loaded&&!error&&<p role="status">{t('আপনার রসিদ লোড হচ্ছে…','Loading your receipts…')}</p>}
  {loaded&&!page.items.length&&<div className="office-card receipt-empty"><Icon kind="receipt"/><h2>{t('এখনো কোনো রসিদ নেই','No receipts yet')}</h2><p>{t('অফিস থেকে আপনার অ্যাকাউন্টে রসিদ ইস্যু হলে এখানে দেখা যাবে। আলাদাভাবে দেওয়া PDF ফাইলও সংরক্ষণ করে রাখা যাবে।','Receipts appear after the office issues them to your account. You can also keep any PDF supplied separately by the office.')}</p></div>}
  <div className="receipt-copy-list">{page.items.map(item=><article className="receipt-copy-card" key={item.id}><div><span>{calendar(item.billingMonth,lang,true)}</span><h2>{item.receiptNumber}</h2><small>{calendar(item.paidDate,lang)}</small></div><strong>{money(item.receivedMinor,lang)}</strong><button className="desk-outline" aria-pressed={record?.id===item.id} disabled={busy} onClick={()=>void open(item.id)}>{t('রসিদ দেখুন','View receipt')} <Icon kind="receipt"/></button></article>)}</div>
  {page.total>20&&<div className="history-pages"><button className="desk-outline" disabled={busy||page.offset===0} onClick={()=>void load(Math.max(0,page.offset-20))}>← {t('আগের','Previous')}</button><span>{page.offset+1}–{Math.min(page.offset+20,page.total)} / {page.total}</span><button className="desk-outline" disabled={busy||page.offset+20>=page.total} onClick={()=>void load(page.offset+20)}>{t('পরের','Next')} →</button></div>}
  {record&&<section className="receipt-copy-preview" ref={preview} aria-label={t('ইস্যু করা রসিদের কপি','Issued receipt copy')}><div className="preview-toolbar"><span>{t('শিক্ষার্থী / অভিভাবকের কপি','Student / guardian copy')}</span><div className="receipt-export-actions"><button className="desk-outline" disabled={busy} onClick={()=>void exportCopy('PRINT')}><Icon kind="print"/>{t('প্রিন্ট করুন','Print receipt')}</button><button className="desk-primary" disabled={busy} onClick={()=>void exportCopy('PDF')}><Icon kind="download"/>{t('PDF ডাউনলোড','Download PDF')}</button></div></div>{pdfFile&&<a className="desk-outline pdf-ready-link" href={pdfFile.url} download={pdfFile.filename}>{t('PDF ফাইলটি নিন','Get PDF file')} <Icon kind="download"/></a>}<ReceiptPaper draft={record} totals={record} record={record} lang={lang}/></section>}
  {printRoot&&printRecord&&createPortal(<ReceiptPaper draft={printRecord} totals={printRecord} record={printRecord} lang={lang}/>,printRoot)}
 </section>;
}
