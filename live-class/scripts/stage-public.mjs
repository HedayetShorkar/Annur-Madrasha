import {cp,mkdir,readdir,lstat,realpath} from 'node:fs/promises';import{resolve,relative,isAbsolute,sep}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';
const repository=fileURLToPath(new URL('../../',import.meta.url));
export const publicEntries=['index.html','assets','learn','robots.txt','404.html','live','payments','admin'];
const inside=(parent,child)=>{const value=relative(parent,child);return value===''||value!=='..'&&!value.startsWith('..'+sep)&&!isAbsolute(value);};
export async function publicFiles(directory,prefix=''){
 const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){
  const name=prefix+entry.name,path=resolve(directory,entry.name),info=await lstat(path);
  if(info.isSymbolicLink()||entry.name.startsWith('.')||['node_modules','backups','secrets'].includes(entry.name)||/\.(?:sqlite(?:-.*)?|db(?:-.*)?|pem|key|p12|pfx|log|zip)$/i.test(entry.name))throw Error('Private or symlinked file in public release: '+name);
  if(info.isDirectory())files.push(...await publicFiles(path,name+'/'));else if(info.isFile())files.push(name);else throw Error('Unsupported public file: '+name);
 }return files.sort();
}
export async function stagePublic(target,{source=repository}={}){
 source=await realpath(source);target=resolve(target);if(inside(source,target))throw Error('Public directory must be outside the source project');
 await mkdir(target,{recursive:true});if(inside(source,await realpath(target)))throw Error('Public directory must not resolve inside the source project');
 if((await readdir(target)).length)throw Error('Choose an empty directory for public release');
 const entries=[...publicEntries];try{await lstat(resolve(source,'sitemap.xml'));entries.push('sitemap.xml');}catch(error){if(error.code!=='ENOENT')throw error;}
 for(const item of entries){const path=resolve(source,item),info=await lstat(path);if(info.isSymbolicLink())throw Error('Public source symlinks are not allowed');if(info.isDirectory())await publicFiles(path,item+'/');else if(!info.isFile())throw Error('Unsupported public source');}
 for(const item of entries)await cp(resolve(source,item),resolve(target,item),{recursive:true,force:false,errorOnExist:true});
 return target;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){await stagePublic(process.argv[2]||'../../annoor-public');console.log('Public website staged. Server source, databases and environment files were excluded.');}
