import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalRecording,recordingSupport} from '../src/local-recorder.js';
function fixture({audio=true,micDenied=false,denied=false,writeFails=false,closeFails=false,delayedDisplay=false}={}){
 const calls=[],recorders=[],writes=[],tracks=[],contexts=[];
 const track=kind=>{const t={kind,readyState:'live',stops:0,stop(){this.stops++;this.readyState='ended';}};tracks.push(t);return t;};
 class Stream{constructor(tracks){this.tracks=tracks;}getTracks(){return this.tracks;}getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio');}getVideoTracks(){return this.tracks.filter(t=>t.kind==='video');}}
 const display=new Stream([track('video'),...(audio?[track('audio')]:[])]),mic=new Stream([track('audio')]);let release;
 class Recorder{
  static isTypeSupported(mime){return mime.startsWith('video/webm');}
  constructor(stream,options){this.stream=stream;this.mimeType=options.mimeType;this.state='inactive';recorders.push(this);}
  start(){calls.push('record');this.state='recording';}
  emit(text){this.ondataavailable?.({data:new Blob([text])});}
  stop(){this.state='inactive';queueMicrotask(()=>{this.emit('tail');this.onstop?.();});}
 }
 class Audio{
  constructor(){this.closed=0;contexts.push(this);}
  async resume(){}async close(){this.closed++;}
  createMediaStreamDestination(){return {stream:new Stream([track('audio')])};}
  createMediaStreamSource(){return {connect(){calls.push('mix');}};}
 }
 const env={isSecureContext:true,Blob,MediaRecorder:Recorder,MediaStream:Stream,AudioContext:Audio,navigator:{mediaDevices:{getDisplayMedia(options){calls.push('display');assert.equal(options.audio,true);assert.equal(options.selfBrowserSurface,'include');if(denied)return Promise.reject(Object.assign(Error(),{name:'NotAllowedError'}));if(delayedDisplay)return new Promise(r=>release=()=>r(display));return Promise.resolve(display);},getUserMedia:async()=>{calls.push('mic');if(micDenied)throw Error();return mic;}}}};
 const writer={closed:false,aborted:false,async write(chunk){if(writeFails)throw Error('private disk detail');writes.push(await chunk.text());},async close(){if(closeFails)throw Error('private close detail');this.closed=true;},async abort(){this.aborted=true;}};
 const handle={createWritable:async()=>writer};
 return {env,calls,recorders,writes,writer,handle,tracks,contexts,display,release:()=>release()};
}
test('no capture on creation; explicit start mixes tab audio and opted-in mic, writes ordered chunks and finalizes on stop',async()=>{
 const f=fixture(),states=[];let authorized=0;
 const job=createLocalRecording({env:f.env,fileHandle:f.handle,includeMic:true,authorize:async()=>{authorized++;f.calls.push('authorize');},onState:s=>states.push(s)});
 assert.deepEqual(f.calls,[]);await job.start();assert.equal(authorized,1);assert.deepEqual(f.calls,['display','mic','mix','mix','authorize','record']);
 f.recorders[0].emit('first');f.recorders[0].emit('second');const result=await job.stop();assert.equal(result.saved,true);assert.equal(result.blob,null);assert.deepEqual(f.writes,['first','second','tail']);assert.equal(f.writer.closed,true);assert.ok(f.tracks.every(t=>t.stops>0));assert.equal(f.contexts[0].closed,1);await job.stop();assert.equal(f.contexts[0].closed,1);assert.ok(states.includes('recording'));
});
test('download fallback returns a local blob only after stopping, with no microphone when not opted in',async()=>{
 const f=fixture(),job=createLocalRecording({env:f.env});await job.start();assert.ok(!f.calls.includes('mic'));f.recorders[0].emit('part');const result=await job.stop();assert.equal(await result.blob.text(),'parttail');assert.equal(result.saved,false);assert.equal(result.error,null);
});
test('missing tab audio, denied display, and denied requested microphone never begin a silent recording',async()=>{
 for(const [options,code]of [[{audio:false},'RECORDING_TAB_AUDIO_REQUIRED'],[{denied:true},null],[{micDenied:true},'RECORDING_MIC_REQUIRED']]){
  const f=fixture(options),job=createLocalRecording({env:f.env,includeMic:true});await job.start();const result=await job.completion;assert.equal(result.error,code);assert.equal(result.saved,false);assert.ok(!f.calls.includes('record'));assert.equal(result.blob,null);if(!options.denied)assert.ok(f.display.getTracks().every(t=>t.readyState==='ended'));
 }
});
test('capture is stopped if notice authorization fails; no privileged or upstream detail reaches errors',async()=>{
 const f=fixture(),job=createLocalRecording({env:f.env,fileHandle:f.handle,authorize:async()=>{throw Object.assign(Error('private message'),{code:'RECORDING_NOTICE_FAILED'});}});await job.start();const result=await job.completion;assert.equal(result.error,'RECORDING_NOTICE_FAILED');assert.equal(result.saved,false);assert.ok(!f.calls.includes('record'));assert.equal(f.writer.aborted,true);
});
test('permission prompt cancellation and source-share end stop all local tracks',async()=>{
 const f=fixture({delayedDisplay:true}),job=createLocalRecording({env:f.env});const start=job.start();const stopped=job.stop();f.release();await start;assert.equal((await stopped).cancelled,true);assert.ok(!f.calls.includes('record'));assert.ok(f.display.getTracks().every(t=>t.readyState==='ended'));
 const g=fixture(),running=createLocalRecording({env:g.env});await running.start();g.display.getVideoTracks()[0].onended();assert.equal((await running.completion).blob.size,4);
});
test('disk write/close failure never claims a saved recording',async()=>{
 for(const option of [{writeFails:true},{closeFails:true}]){
  const f=fixture(option),job=createLocalRecording({env:f.env,fileHandle:f.handle});await job.start();f.recorders[0].emit('part');const result=await job.stop();assert.equal(result.saved,false);assert.equal(result.blob,null);assert.equal(result.error,'RECORDING_WRITE_FAILED');
 }
});
test('insecure or unsupported browsers are rejected before media access',async()=>{
 const f=fixture();f.env.isSecureContext=false;assert.equal(recordingSupport(f.env),false);const job=createLocalRecording({env:f.env});await job.start();assert.equal((await job.completion).error,'RECORDING_UNSUPPORTED');assert.deepEqual(f.calls,[]);
});
test('cancel during server authorization immediately releases devices; a source ending during setup cannot start',async()=>{
 const f=fixture();let release,entered;const ready=new Promise(resolve=>entered=resolve);
 const job=createLocalRecording({env:f.env,includeMic:true,authorize:()=>new Promise(resolve=>{release=resolve;entered();})});const start=job.start();await ready;
 const stopping=job.stop();assert.ok(f.display.getTracks().every(t=>t.readyState==='ended'));release();await start;assert.equal((await stopping).cancelled,true);assert.ok(!f.calls.includes('record'));assert.equal(f.contexts[0].closed,1);
 const g=fixture(),ended=createLocalRecording({env:g.env,authorize:async()=>{g.display.getVideoTracks()[0].readyState='ended';}});await ended.start();assert.equal((await ended.completion).error,'RECORDING_SOURCE_ENDED');assert.ok(!g.calls.includes('record'));
});
