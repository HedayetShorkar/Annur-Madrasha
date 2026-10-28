// Static releases only. This tool never opens/restores a DB or restarts a service.
import {createHash,randomUUID} from 'node:crypto';
import {cp,lstat,mkdir,readFile,readdir,realpath,rename,rm,symlink,writeFile} from 'node:fs/promises';
import {dirname,isAbsolute,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {publicFiles,stagePublic} from '../live-class/scripts/stage-public.mjs';
const repository=fileURLToPath(new URL('../',import.meta.url));
const inside=(parent,child)=>{const r=relative(parent,child);return r===''||r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r);};
const exists=async path=>{try{return await lstat(path);}catch(error){if(error.code==='ENOENT')return null;throw error;}};
const identifier=id=>{if(typeof id!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id))throw Error('Invalid release ID');return id;};
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
async function current(root,name='public'){
 const path=join(root,name),info=await exists(path);if(!info)return null;
 if(!info.isSymbolicLink())throw Error(name+' must be a managed symlink; existing directories are never replaced');
 const target=await realpath(path),releases=join(root,'releases');
 if(!inside(releases,target)||dirname(dirname(target))!==releases||target.split(sep).at(-1)!=='public')throw Error('Unmanaged release pointer');
 return target;
}
async function pointer(root,name,target){const next=join(root,'.'+name+'-'+randomUUID());await symlink(target,next,'dir');try{await rename(next,join(root,name));}catch(error){await rm(next,{force:true});throw error;}}
async function locked(root,work){
 root=resolve(root);await mkdir(root,{recursive:true});root=await realpath(root);
 if(inside(await realpath(repository),root))throw Error('Release root must be outside the source project');
 const lock=join(root,'.release-lock');try{await mkdir(lock,{mode:0o700});}catch(error){if(error.code==='EEXIST')throw Error('Another release holds the lock; inspect it before retrying');throw error;}
 try{await writeFile(join(lock,'owner.json'),JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()}),{mode:0o600});return await work(root);}finally{await rm(lock,{recursive:true,force:true});}
}
async function checksums(directory){const files=await publicFiles(directory),result={};for(const file of files)result[file]=await hash(join(directory,file));return result;}
async function verify(root,id){
 identifier(id);const release=join(root,'releases',id),manifest=JSON.parse(await readFile(join(release,'release.json'),'utf8'));
 if((await lstat(release)).isSymbolicLink()||(await lstat(join(release,'public'))).isSymbolicLink())throw Error('Release directories cannot be symlinks');
 if(manifest.format!==1||manifest.id!==id)throw Error('Invalid release manifest');
 const actual=await checksums(join(release,'public'));if(JSON.stringify(actual)!==JSON.stringify(manifest.files))throw Error('Release files have changed; activation refused');return release;
}
async function carryAssets(from,to){
 if(!from)return;for(const section of ['live','payments']){
  const directory=join(from,section,'assets');for(const file of await readdir(directory)){
   if(! /^[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]{8,}\.(?:js|css)$/.test(file))continue;
   const old=join(directory,file),next=join(to,section,'assets',file);if(!(await lstat(old)).isFile()||(await lstat(old)).isSymbolicLink())throw Error('Invalid cached bundle');
   if(await exists(next)){if(await hash(old)!==await hash(next))throw Error('Immutable bundle filename collision');}else await cp(old,next,{force:false,errorOnExist:true});
  }
 }
}
async function prepare(root,id,source){
 identifier(id);await mkdir(join(root,'releases'),{recursive:true});const final=join(root,'releases',id);if(await exists(final))throw Error('Release already exists; choose a new ID');
 const temporary=join(root,'releases','.incoming-'+randomUUID());await mkdir(temporary);
 try{
  await stagePublic(join(temporary,'public'),{source});const old=await current(root);if(old)await verify(root,dirname(old).split(sep).at(-1));await carryAssets(old,join(temporary,'public'));
  const manifest={format:1,id,createdAt:new Date().toISOString(),files:await checksums(join(temporary,'public'))};
  await writeFile(join(temporary,'release.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600,flag:'wx'});await rename(temporary,final);return {id,prepared:true};
 }catch(error){await rm(temporary,{recursive:true,force:true});throw error;}
}
async function activate(root,id){
 const release=await verify(root,id),old=await current(root),next=join(release,'public');if(old===next)return{id,active:true};
 // Refuse unmanaged legacy previous pointers instead of overwriting them.
 await current(root,'previous-public');if(old)await pointer(root,'previous-public',old);
 await pointer(root,'public',next);return{id,active:true,previous:old?dirname(old).split(sep).at(-1):null};
}
export const prepareRelease=(root,id,source=repository)=>locked(root,base=>prepare(base,id,source));
export const activateRelease=(root,id)=>locked(root,base=>activate(base,id));
export const rollbackRelease=root=>locked(root,async base=>{
 const prior=await current(base,'previous-public');if(!prior)throw Error('No previous release is available');
 await verify(base,dirname(prior).split(sep).at(-1));const id='rollback-'+randomUUID();
 // Copy the prior public code into a new release while retaining current hashes.
 // No database snapshot is restored, so post-release payments remain intact.
 await prepare(base,id,prior);return {...await activate(base,id),rolledBack:true};
});
export async function releaseStatus(root){root=resolve(root);return{current:await current(root),previous:await current(root,'previous-public')};}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const [action,root,id,source]=process.argv.slice(2);try{
  if(!root)throw Error('Usage: release-public.mjs prepare ROOT ID [SOURCE] | activate ROOT ID | rollback ROOT | status ROOT');
  const result=action==='prepare'?await prepareRelease(root,id,source):action==='activate'?await activateRelease(root,id):action==='rollback'?await rollbackRelease(root):action==='status'?await releaseStatus(root):null;
  if(!result)throw Error('Unknown release action');console.log(JSON.stringify(result));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
