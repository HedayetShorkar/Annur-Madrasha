import type {ReceiptCopy,Lang} from './receipt-types';
type Renderer={createReceiptPdf:(record:ReceiptCopy,lang:Lang)=>Promise<Blob>};
declare global{interface Window{AnNoorReceiptPdf?:Renderer}}
let loading:Promise<Renderer>|null=null;
function renderer():Promise<Renderer>{
 if(window.AnNoorReceiptPdf)return Promise.resolve(window.AnNoorReceiptPdf);
 if(loading)return loading;
 loading=new Promise<Renderer>((resolve,reject)=>{
  const path=document.querySelector<HTMLScriptElement>('script[data-receipt-pdf]')?.dataset.receiptPdf;
  if(!path||!/^\.\/assets\/receipt-pdf-[\w-]+\.js$/.test(path)){reject(Error('PDF_UNAVAILABLE'));return;}
  const script=document.createElement('script');script.src=new URL(path,location.href).href;script.async=true;
  const timer=setTimeout(()=>fail(),15000),fail=()=>{clearTimeout(timer);script.remove();reject(Error('PDF_UNAVAILABLE'));};
  script.onerror=fail;script.onload=()=>{clearTimeout(timer);if(window.AnNoorReceiptPdf)resolve(window.AnNoorReceiptPdf);else fail();};document.head.append(script);
 }).catch(error=>{loading=null;throw error;});return loading;
}
export async function createReceiptPdf(record:ReceiptCopy,lang:Lang){return(await renderer()).createReceiptPdf(record,lang);}
export function downloadReceiptPdf(blob:Blob,number:string){
 const url=URL.createObjectURL(blob),a=document.createElement('a');const filename=number.replace(/[^A-Z0-9-]/gi,'')+'.pdf';a.href=url;a.download=filename;a.rel='noopener';document.body.append(a);a.click();a.remove();return{url,filename};
}
