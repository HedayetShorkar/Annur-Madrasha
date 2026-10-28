import {readdirSync,readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
import {publicFiles,publicEntries} from '../live-class/scripts/stage-public.mjs';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
function run(command,args){const result=spawnSync(command,args,{cwd:root,stdio:'inherit',env:process.env});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);}
// Inspect only shipped public text assets; environment values never go to output.
for(const entry of publicEntries){const files=entry.includes('.')?[entry]:(await publicFiles(join(root,entry),entry+'/'));for(const file of files){if(!/\.(?:js|css|html|json)$/.test(file))continue;const text=readFileSync(join(root,file),'utf8');if(/sb_secret_[A-Za-z0-9_-]{16,}/.test(text))throw Error('Privileged key in public asset: '+file);for(const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)){let payload;try{payload=JSON.parse(Buffer.from(match[1],'base64url').toString());}catch{continue;}if(payload.role==='service_role')throw Error('Privileged JWT in public asset: '+file);}}}
// Hosted checks remain an explicit operator action: CI never writes real records.
const excluded=new Set(['responsive-fixtures.cjs','engagement-hosted.cjs']);
run(process.execPath,['--test','tests/release.test.mjs']);
for(const test of readdirSync(new URL('../tests/',import.meta.url)).filter(name=>name.endsWith('.cjs')&&!excluded.has(name)).sort())run(process.execPath,['tests/'+test]);
run('python3',['tests/verify.py']);
console.log('PASS: complete local website/release checks. No production submissions or deployment performed.');
