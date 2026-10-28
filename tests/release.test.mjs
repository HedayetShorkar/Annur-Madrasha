import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,rm,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {prepareRelease,activateRelease,rollbackRelease,releaseStatus} from '../scripts/release-public.mjs';
const temporary=async t=>{const dir=await mkdtemp(join(tmpdir(),'annoor-release-'));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;};
async function fixture(parent,name,hash){const source=join(parent,name);for(const dir of ['assets','learn','live/assets','payments/assets','admin'])await mkdir(join(source,dir),{recursive:true});for(const file of ['index.html','404.html','robots.txt','learn/index.html','live/index.html','payments/index.html','admin/index.html'])await writeFile(join(source,file),name);for(const app of ['live','payments'])await writeFile(join(source,app,'assets','index-'+hash+'.js'),name);await writeFile(join(source,'private.sqlite'),'DO NOT PUBLISH');await writeFile(join(source,'.env'),'DO NOT PUBLISH');return source;}
test('release activation and rollback preserve current data and bundles needed by old open tabs',async t=>{
 const dir=await temporary(t),root=join(dir,'hosting'),one=await fixture(dir,'one','AAAAAAAA'),two=await fixture(dir,'two','BBBBBBBB');await mkdir(join(root,'data'),{recursive:true});await writeFile(join(root,'data/live.sqlite'),'student-before');
 await prepareRelease(root,'version-one',one);assert.equal((await releaseStatus(root)).current,null);await activateRelease(root,'version-one');assert.equal(await readFile(join(root,'public/index.html'),'utf8'),'one');
 await prepareRelease(root,'version-two',two);assert.equal(await readFile(join(root,'public/index.html'),'utf8'),'one');await activateRelease(root,'version-two');assert.equal(await readFile(join(root,'public/index.html'),'utf8'),'two');
 for(const app of ['live','payments'])assert.equal(await readFile(join(root,'public',app,'assets/index-AAAAAAAA.js'),'utf8'),'one');
 await writeFile(join(root,'data/live.sqlite'),'new-payment-after-release');const result=await rollbackRelease(root);assert.equal(result.rolledBack,true);assert.equal(await readFile(join(root,'public/index.html'),'utf8'),'one');assert.equal(await readFile(join(root,'data/live.sqlite'),'utf8'),'new-payment-after-release');
 for(const app of ['live','payments'])assert.equal(await readFile(join(root,'public',app,'assets/index-BBBBBBBB.js'),'utf8'),'two');
 await assert.rejects(readFile(join(root,'public/private.sqlite')),/ENOENT/);await assert.rejects(readFile(join(root,'public/.env')),/ENOENT/);
});
test('bad/tampered releases and concurrent operations cannot replace the active site',async t=>{
 const dir=await temporary(t),root=join(dir,'hosting'),one=await fixture(dir,'one','AAAAAAAA');await prepareRelease(root,'good',one);await activateRelease(root,'good');
 await assert.rejects(prepareRelease(root,'../escape',one),/Invalid release ID/);await assert.rejects(prepareRelease(root,'good',one),/already exists/);
 await prepareRelease(root,'tampered',one);await writeFile(join(root,'releases/tampered/public/index.html'),'changed');await assert.rejects(activateRelease(root,'tampered'),/changed/);assert.equal(await readFile(join(root,'public/index.html'),'utf8'),'one');
 await mkdir(join(root,'.release-lock'));await assert.rejects(activateRelease(root,'good'),/holds the lock/);await rm(join(root,'.release-lock'),{recursive:true});
 await writeFile(join(one,'assets/backup.sqlite'),'PRIVATE');await assert.rejects(prepareRelease(root,'private',one),/Private/);await rm(join(one,'assets/backup.sqlite'));
 await symlink(join(one,'index.html'),join(one,'assets/link'));await assert.rejects(prepareRelease(root,'symlink',one),/symlink/);await rm(join(one,'assets/link'));
 assert.equal(await readFile(join(root,'public/index.html'),'utf8'),'one');
 await writeFile(join(root,'public/live/assets/index-AAAAAAAA.js'),'tampered-current');await assert.rejects(prepareRelease(root,'carry-tampered',one),/changed/);
});
test('unmanaged directories and pointers are refused instead of overwritten',async t=>{
 const dir=await temporary(t),root=join(dir,'hosting'),one=await fixture(dir,'one','AAAAAAAA');await mkdir(join(root,'public'),{recursive:true});await writeFile(join(root,'public/keep'),'keep');await assert.rejects(prepareRelease(root,'new',one),/managed symlink/);assert.equal(await readFile(join(root,'public/keep'),'utf8'),'keep');
 await rm(join(root,'public'),{recursive:true});await symlink(one,join(root,'public'));await assert.rejects(prepareRelease(root,'external',one),/Unmanaged/);
});
