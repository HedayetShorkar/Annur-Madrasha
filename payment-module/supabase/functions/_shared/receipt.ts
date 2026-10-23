import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { SafeError } from './domain.ts';
export type ReceiptData={receipt_number:string;invoice_number:string;amount_minor:number;provider:string;transaction_id:string;confirmed_at:string;status:string;description:string};
export async function receiptPDF(data:ReceiptData):Promise<Uint8Array>{
 if(data.status!=='CONFIRMED_PAID'||!data.confirmed_at)throw new SafeError('RECEIPT_NOT_AVAILABLE',409);
 const doc=await PDFDocument.create();const page=doc.addPage([595,842]);const font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 page.drawRectangle({x:0,y:690,width:595,height:152,color:rgb(.025,.18,.13)});
 const draw=(s:string,y:number,size=12,strong=false,white=false)=>page.drawText(s,{x:46,y,size,font:strong?bold:font,color:white?rgb(1,1,1):rgb(.03,.16,.11)});
 draw('AN-NOOR INTERNATIONAL',777,21,true,true);draw('ONLINE MADRASA',748,15,false,true);draw('PAYMENT RECEIPT',715,12,true,true);
 const rows=[['Receipt',data.receipt_number],['Invoice',data.invoice_number],['Amount',`BDT ${(data.amount_minor/100).toFixed(2)}`],['Provider',data.provider],['Transaction ID',data.transaction_id],['Confirmed (UTC)',new Date(data.confirmed_at).toISOString()],['Status','CONFIRMED_PAID']];
 let y=645;for(const [label,value] of rows){draw(label,y,11,true);draw(value,y-23,13);y-=62;}
 draw('Confirmed by madrasa administration after independent review.',155,10);
 draw('SMS-assisted evidence is not official MFS settlement verification.',135,10);
 draw('This receipt records the madrasa ledger confirmation.',115,10);
 doc.setTitle(data.receipt_number);doc.setAuthor('An-Noor International Online Madrasa');
 return doc.save();
}
