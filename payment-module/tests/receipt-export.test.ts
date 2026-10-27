import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {normalizeReceipt} from '../../shared/receipt-core.mjs';
import {receiptPdfData,wrapReceiptText,createReceiptPdf} from '../src/receipt-pdf';
import {newReceiptKey,type Issued} from '../src/receipt-types';
const receipt=()=>({...normalizeReceipt({studentName:'পরীক্ষামূলক শিক্ষার্থী',guardianName:'পরীক্ষামূলক অভিভাবক',studentCode:'SYNTHETIC-1',phone:'01700000000',feeType:'MONTHLY',amountMode:'PACKAGE',packageId:'basic',billingMonth:'2026-10',discount:'0',receivedAmount:'500',paidDate:'2026-10-19',method:'CASH',verified:true,evidenceReference:'PRIVATE CASHBOOK REFERENCE'}),id:'synthetic-1',receiptNumber:'AN-R-2026-000001',issuedAt:'2026-10-19T10:00:00Z',issuerName:'Synthetic administrator',status:'ISSUED',source:'ADMIN_MANUAL',paymentStatus:'CONFIRMED_PAID'}) as Issued;
test('PDF projection preserves Bengali amounts, partial balance and public fields without internal evidence',()=>{
 const doc=receipt(),bn=receiptPdfData(doc,'bn'),en=receiptPdfData(doc,'en');
 assert.match(bn.words,/পাঁচ শত টাকা/);assert.match(en.words,/five hundred taka/);assert.equal(bn.details[0][1],doc.studentName);assert.equal(bn.number,doc.receiptNumber);assert.equal(bn.totals.length,5);assert.ok(bn.totals[4][1].includes('৪৯৯'));assert.ok(!JSON.stringify(bn).includes(doc.evidenceReference));
});
test('unconfirmed, void and inconsistent receipts fail before any browser export',async()=>{
 for(const change of [{status:'VOID'},{status:'PENDING'},{paymentStatus:'PENDING'},{source:'UNTRUSTED_SMS'},{receivedMinor:0},{receivedMinor:12345},{receiptNumber:'FORGED'}]){const doc={...receipt(),...change} as Issued;assert.throws(()=>receiptPdfData(doc,'bn'),/PDF_/);await assert.rejects(createReceiptPdf(doc,'en'),/PDF_/);}
});
test('long user text remains intact, including a conjunct at a wrapped word boundary',()=>{
 const ctx={measureText:(text:string)=>({width:Array.from(text).length*8})} as Pick<CanvasRenderingContext2D,'measureText'>;
 const id='LONGREFERENCE'.repeat(6),rows=wrapReceiptText(ctx,id,80);assert.equal(rows.join(''),id);assert.ok(rows.length>1);
 const name='শিক্ষার্থীর'.repeat(10),bn=wrapReceiptText(ctx,name,120);assert.equal(bn.join(''),name);assert.ok(bn.every(x=>!/^\p{M}/u.test(x)));
 const doc=receipt();doc.note='দীর্ঘ মন্তব্য '.repeat(15);doc.studentName='শিক্ষার্থীর দীর্ঘ নাম '.repeat(5);const projection=receiptPdfData(doc,'bn');assert.equal(projection.details[0][1],doc.studentName);assert.ok(projection.note.endsWith(doc.note));
});
test('manual receipt retries use cryptographic UUIDs when randomUUID is unavailable',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try{Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:webcrypto.getRandomValues.bind(webcrypto)}});const ids=Array.from({length:20},()=>newReceiptKey());assert.equal(new Set(ids).size,20);for(const id of ids)assert.match(id,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);Object.defineProperty(globalThis,'crypto',{configurable:true,value:{}});assert.throws(newReceiptKey,/REQUEST_FAILED/);}finally{if(descriptor)Object.defineProperty(globalThis,'crypto',descriptor);}
});
