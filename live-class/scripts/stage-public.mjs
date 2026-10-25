import {cp,mkdir,readdir} from 'node:fs/promises';import{resolve,relative}from'node:path';import{fileURLToPath}from'node:url';
const source=fileURLToPath(new URL('../../',import.meta.url)),target=resolve(process.argv[2]||'../../annoor-public');
const rel=relative(source,target);if(!rel.startsWith('..'))throw Error('Public directory must be outside the source project');
await mkdir(target,{recursive:true});if((await readdir(target)).length)throw Error('Choose an empty directory for public release');
for(const item of ['index.html','assets','learn','robots.txt','404.html','live','payments','admin'])await cp(resolve(source,item),resolve(target,item),{recursive:true});
console.log('Public website staged. Server source, databases and environment files were excluded.');
