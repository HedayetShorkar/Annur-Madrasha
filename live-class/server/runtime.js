import {existsSync,lstatSync,realpathSync} from 'node:fs';
import {basename,dirname,isAbsolute,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const sourceRoot=realpathSync(fileURLToPath(new URL('../../',import.meta.url)));
export const within=(parent,child)=>{const p=relative(parent,child);return p===''||p!=='..'&&!p.startsWith('..'+sep)&&!isAbsolute(p);};
function canonical(path){let ancestor=resolve(path),suffix=[];while(!existsSync(ancestor)){suffix.unshift(basename(ancestor));ancestor=dirname(ancestor);}return resolve(realpathSync(ancestor),...suffix);}
export function databasePath(env=process.env,{allowCreate=false}={}){
 const supplied=env.DB_PATH;
 if(env.NODE_ENV!=='production')return supplied||'./data/live.sqlite';
 if(!supplied||!isAbsolute(supplied))throw Error('Production requires an absolute DB_PATH outside the website source');
 const path=canonical(supplied);
 for(const forbidden of [sourceRoot,canonical(env.PUBLIC_ROOT||'/srv/annoor/public'),canonical(env.RELEASE_ROOT||'/srv/annoor/releases')])if(within(forbidden,path))throw Error('Production database must be outside the source, public website and release folders');
 const info=lstatSync(supplied,{throwIfNoEntry:false});if(info&&(info.isSymbolicLink()||!info.isFile()))throw Error('DB_PATH must be a regular database file');
 if(!allowCreate&&info?.size===0)throw Error('Production database is empty; refusing to initialize a replacement');
 if(!allowCreate&&!existsSync(path))throw Error('Production database is missing; refusing to create an empty replacement. Verify DB_PATH or bootstrap explicitly.');
 return path;
}
