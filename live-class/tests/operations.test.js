import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,statSync,writeFileSync,readFileSync,symlinkSync,existsSync,readdirSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';
import {openDb,SUPPORTED_SCHEMA_VERSION} from '../server/db.js';
import {databasePath} from '../server/runtime.js';import {createSnapshot,verifySnapshot,openPersistentDatabase} from '../scripts/db-backup.mjs';
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const temporary=t=>{const dir=mkdtempSync(join(tmpdir(),'annoor-operations-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));return dir;};
test('production refuses missing, empty, relative, public/release and symlinked databases',t=>{
 const dir=temporary(t),file=join(dir,'live.sqlite'),env={NODE_ENV:'production',DB_PATH:file,PUBLIC_ROOT:join(dir,'public'),RELEASE_ROOT:join(dir,'releases')};
 for(const value of [undefined,'./data/live.sqlite'])assert.throws(()=>databasePath({...env,DB_PATH:value}),/absolute DB_PATH/);
 assert.throws(()=>databasePath(env),/missing/);assert.equal(existsSync(file),false);assert.equal(databasePath(env,{allowCreate:true}),file);
 writeFileSync(file,'');assert.throws(()=>databasePath(env),/empty/);rmSync(file);openDb(file).close();assert.equal(databasePath(env),file);
 for(const value of [resolve('../data/forbidden.sqlite'),join(dir,'public','data.sqlite'),join(dir,'releases','new','live.sqlite')])assert.throws(()=>databasePath({...env,DB_PATH:value},{allowCreate:true}),/outside/);
 const link=join(dir,'linked.sqlite');symlinkSync(file,link);assert.throws(()=>databasePath({...env,DB_PATH:link}),/regular/);
 assert.equal(databasePath({}), './data/live.sqlite');
});
test('unsupported schema downgrades and unrelated databases fail before migrations',t=>{
 const dir=temporary(t),file=join(dir,'newer.sqlite');let db=new DatabaseSync(file);db.exec('CREATE TABLE schema_versions(version INTEGER PRIMARY KEY);INSERT INTO schema_versions VALUES('+ (SUPPORTED_SCHEMA_VERSION+1)+');CREATE TABLE keep_data(value TEXT);INSERT INTO keep_data VALUES(\'preserve\')');db.close();const before=hash(file);
 assert.throws(()=>openDb(file),/newer than this code/);assert.equal(hash(file),before);db=new DatabaseSync(file,{readOnly:true});assert.equal(db.prepare('SELECT value FROM keep_data').get().value,'preserve');assert.equal(db.prepare("SELECT 1 FROM sqlite_master WHERE name='users'").get(),undefined);db.close();
 const other=join(dir,'other.sqlite');db=new DatabaseSync(other);db.exec('CREATE TABLE unrelated(id INTEGER)');db.close();assert.throws(()=>openDb(other),/not an An-Noor/);
});
test('online WAL backup verifies checksums and restore drill preserves accounts, sessions and receipts',async t=>{
 const dir=temporary(t),file=join(dir,'live.sqlite'),snapshot=join(dir,'private-backups','before-update.sqlite'),db=openDb(file);t.after(()=>{try{db.close();}catch{}});
 db.prepare('INSERT INTO users(id,name,email,password,role,login_id) VALUES(?,?,?,?,?,?)').run('student','Fictional student','test@example.invalid','hashed-test-password','student','AN-STABLE-IDENTITY');
 db.prepare('INSERT INTO sessions(hash,user_id,expires) VALUES(?,?,?)').run('synthetic-session-hash','student',Date.now()+10000);
 const receipt=id=>db.prepare('INSERT INTO manual_receipts(id,receipt_number,request_key,request_hash,actor_id,issuer_name,payload,issued_at,method) VALUES(?,?,?,?,?,?,?,?,?)').run(id,'AN-R-2026-'+id,id,'test-request-hash','student','Fictional office',JSON.stringify({studentId:'student',receivedMinor:99900}),new Date().toISOString(),'CASH');receipt('000001');
 const result=await createSnapshot(file,snapshot);assert.equal(result.sha256,verifySnapshot(snapshot).sha256);assert.equal(statSync(snapshot).mode&0o777,0o600);
 receipt('000002');
 const restoreCopy=join(dir,'restored-copy.sqlite');copyFileSync(snapshot,restoreCopy);let restored=openDb(restoreCopy);assert.equal(restored.prepare('SELECT login_id FROM users').get().login_id,'AN-STABLE-IDENTITY');assert.equal(restored.prepare('SELECT hash FROM sessions').get().hash,'synthetic-session-hash');assert.equal(restored.prepare('SELECT COUNT(*) n FROM manual_receipts').get().n,1);restored.close();verifySnapshot(snapshot);
 // Code restart/rollback uses the current DB, never a stale snapshot.
 const restarted=openDb(file);assert.equal(restarted.prepare('SELECT COUNT(*) n FROM manual_receipts').get().n,2);assert.equal(restarted.prepare('SELECT login_id FROM users').get().login_id,'AN-STABLE-IDENTITY');restarted.close();
 await assert.rejects(createSnapshot(file,snapshot),/never overwritten/);assert.equal(statSync(file).mode&0o777,0o600);
 const saved=readFileSync(snapshot);writeFileSync(snapshot,Buffer.concat([saved,Buffer.from('tamper')]));assert.throws(()=>verifySnapshot(snapshot),/checksum mismatch/);
});
test('every production startup verifies a private snapshot before migrations and fails safely if backup is blocked',async t=>{
 const dir=temporary(t),file=join(dir,'live.sqlite'),env={NODE_ENV:'production',DB_PATH:file,PUBLIC_ROOT:join(dir,'public'),RELEASE_ROOT:join(dir,'releases')};
 let db=openDb(file);db.prepare('INSERT INTO users(id,name,email,password,role,login_id) VALUES(?,?,?,?,?,?)').run('stable','Fictional student','stable@example.invalid','hashed-test-password','student','AN-DO-NOT-RECREATE');db.close();
 db=await openPersistentDatabase(env);assert.equal(db.prepare('SELECT login_id FROM users').get().login_id,'AN-DO-NOT-RECREATE');db.close();const snapshots=readdirSync(join(dir,'backups')).filter(name=>name.endsWith('.sqlite'));assert.equal(snapshots.length,1);verifySnapshot(join(dir,'backups',snapshots[0]));
 await assert.rejects(openPersistentDatabase({...env,DB_BACKUP_DIR:join(dir,'public','backups')}),/outside/);db=openDb(file);assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n,1);db.close();
});
