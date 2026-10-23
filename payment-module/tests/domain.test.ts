import {test} from 'node:test';import assert from 'node:assert/strict';
import {adapters,money,phone,sensitiveSMS} from '../supabase/functions/_shared/domain.ts';
import {fixturePattern} from './fixtures.ts';
import {receiptPDF} from '../supabase/functions/_shared/receipt.ts';
import {PDFDocument} from 'pdf-lib';
for(const provider of ['BKASH','NAGAD','ROCKET'] as const){test(provider+' adapter only accepts its verified synthetic fixture',()=>{const p=fixturePattern(provider);assert.equal(adapters[provider].parseCredit(p.verified_sample,'01700000000',[p])?.amount_minor,10000);assert.equal(adapters[provider].parseCredit(p.verified_sample,'01700000000',[]),null);});}
test('no guessed SMS formats and no missing amount',()=>{const p=fixturePattern();assert.equal(adapters.BKASH.parseCredit('You got money Trx TEST0001','01700000000',[p]),null);assert.equal(adapters.BKASH.parseCredit(p.verified_sample.replace('100.00',''),'01700000000',[p]),null);});
test('wrong receiving account is rejected',()=>{const p=fixturePattern();assert.throws(()=>adapters.BKASH.parseCredit(p.verified_sample.replace('01700000000','01900000000'),'01700000000',[p]));});
test('incorrect or unverified pattern sample fails closed',()=>{const p=fixturePattern();p.expected.amount_minor=1;assert.throws(()=>adapters.BKASH.parseCredit(p.verified_sample,'01700000000',[p]));});
test('PIN/OTP messages rejected, including before pattern matching',()=>{for(const s of ['Your OTP is 123456','PIN: 1234','পিন ১২৩৪','ওটিপি ১২৩৪৫৬','verification code 123456']){assert.equal(sensitiveSMS(s),true);assert.throws(()=>adapters.BKASH.parseCredit(s,'01700000000',[fixturePattern()]));}});
test('amount precision and phone normalization',()=>{assert.equal(money('0.01'),1);assert.equal(money('999.99'),99999);for(const n of ['','0','-1','1,000','1.001','NaN'])assert.throws(()=>money(n));assert.equal(phone('+8801800000000'),'01800000000');});
test('invalid calendar date fails',()=>{const p=fixturePattern();assert.throws(()=>adapters.BKASH.parseCredit(p.verified_sample.replace('2026-01-15','2026-02-30'),'01700000000',[p]));});
test('no receipt before confirmation; confirmed PDF is a real PDF',async()=>{const d={receipt_number:'RCPT-AN-2026-0000000001',invoice_number:'AN-2026-0000000001',amount_minor:10000,provider:'BKASH',transaction_id:'TEST0001',confirmed_at:'2026-01-15T10:00:00Z',status:'PENDING',description:'Tuition'};await assert.rejects(receiptPDF(d));const pdf=await receiptPDF({...d,status:'CONFIRMED_PAID'});assert.equal((await PDFDocument.load(pdf)).getPageCount(),1);});
