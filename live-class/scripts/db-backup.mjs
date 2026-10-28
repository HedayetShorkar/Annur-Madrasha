import {DatabaseSync,backup} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {closeSync,existsSync,lstatSync,mkdirSync,openSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {within,databasePath} from '../server/runtime.js';
import {openDb} from '../server/db.js';
import {randomUUID} from 'node:crypto';
const repository=realpathSync(fileURLToPath(new URL('../../',import.meta.url)));
const digest=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
export function verifySnapshot(path,{manifest=true}={}){
 if(!lstatSync(path).isFile()||lstatSync(path).isSymbolicLink())throw Error('Backup must be a regular file');
 const db=new DatabaseSync(path,{readOnly:true});let versions=[];
 try{
  if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Backup integrity check failed');
  if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='users'").get())throw Error('Not an An-Noor classroom database');
  if(db.prepare("SELECT 1 FROM sqlite_master WHERE name='schema_versions'").get())versions=db.prepare('SELECT version FROM schema_versions ORDER BY version').all().map(row=>row.version);
 }finally{db.close();}
 const sha256=digest(path);
 if(manifest){const saved=JSON.parse(readFileSync(path+'.json','utf8'));if(saved.sha256!==sha256||saved.format!==1)throw Error('Backup checksum mismatch');}
 return {format:1,sha256,schemaVersions:versions};
}
export async function createSnapshot(source,destination,{env=process.env}={}){
 source=resolve(source);destination=resolve(destination);
 if(!existsSync(source)||!lstatSync(source).isFile()||lstatSync(source).isSymbolicLink())throw Error('Existing regular source database required');
 if(source===destination||existsSync(destination)||existsSync(destination+'.json'))throw Error('Backup destination must be new; existing data is never overwritten');
 mkdirSync(dirname(destination),{recursive:true,mode:0o700});
 const parent=realpathSync(dirname(destination));
 for(const publicPath of [repository,env.PUBLIC_ROOT||'/srv/annoor/public',env.RELEASE_ROOT||'/srv/annoor/releases'])if(existsSync(publicPath)&&within(realpathSync(publicPath),parent))throw Error('Backups must be outside source, public and release directories');
 // Reserve private files first and never overwrite an existing backup.
 closeSync(openSync(destination,'wx',0o600));let db;
 try{
  db=new DatabaseSync(source,{readOnly:true});await backup(db,destination);db.close();db=null;
  const result={...verifySnapshot(destination,{manifest:false}),createdAt:new Date().toISOString()};
  writeFileSync(destination+'.json',JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});return result;
 }catch(error){db?.close();rmSync(destination,{force:true});throw error;}
}
export async function openPersistentDatabase(env=process.env){
 const path=databasePath(env);
 if(env.NODE_ENV==='production'){
  const directory=env.DB_BACKUP_DIR||join(dirname(path),'backups');if(!isAbsolute(directory))throw Error('DB_BACKUP_DIR must be absolute');
  const name=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID()+'.sqlite';
  // A failed snapshot/checksum prevents startup migrations, never a data reset.
  await createSnapshot(path,join(directory,name),{env});
 }
 return openDb(path);
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const [action,source,destination]=process.argv.slice(2);
 try{
  if(action==='create'&&source&&destination)await createSnapshot(source,destination);
  else if(action==='verify'&&source&&!destination)verifySnapshot(source);
  else throw Error('Usage: node scripts/db-backup.mjs create SOURCE NEW_BACKUP | verify BACKUP');
  console.log(action==='create'?'Private database backup created and verified.':'Backup checksum and database integrity verified.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
