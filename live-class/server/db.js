import {allocateLoginId} from './identities.js';
import {migrateReceipts} from './receipts.js';
import {DatabaseSync} from 'node:sqlite';import {mkdirSync} from 'node:fs';import {dirname} from 'node:path';
export function openDb(path){if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});const db=new DatabaseSync(path);db.exec(`PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS classes(id TEXT PRIMARY KEY,title TEXT NOT NULL,teacher_id TEXT NOT NULL REFERENCES users(id),room TEXT NOT NULL UNIQUE,scheduled TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','live','ended')),locked INTEGER NOT NULL DEFAULT 0,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS roster(class_id TEXT REFERENCES classes(id),user_id TEXT REFERENCES users(id),blocked INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(class_id,user_id));
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,actor TEXT,action TEXT NOT NULL,class_id TEXT,detail TEXT NOT NULL,at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS attendance(class_id TEXT REFERENCES classes(id),user_id TEXT REFERENCES users(id),first_seen TEXT NOT NULL,last_seen TEXT NOT NULL,samples INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(class_id,user_id));
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);CREATE INDEX IF NOT EXISTS audit_class ON audit(class_id,id);
`);
// Additive migration: existing accounts, classes, passwords and sessions survive.
db.exec('BEGIN IMMEDIATE');
try{
 const columns=db.prepare('PRAGMA table_info(users)').all().map(x=>x.name);
 if(!columns.includes('login_id'))db.exec('ALTER TABLE users ADD COLUMN login_id TEXT');
 if(!columns.includes('contact_email'))db.exec('ALTER TABLE users ADD COLUMN contact_email TEXT');
 db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_login_id_unique ON users(login_id COLLATE NOCASE) WHERE login_id IS NOT NULL');
 for(const u of db.prepare("SELECT id,email FROM users WHERE role='student' AND login_id IS NULL").all()){
  db.prepare('UPDATE users SET login_id=?,contact_email=COALESCE(contact_email,?) WHERE id=?').run(allocateLoginId(db),u.email.endsWith('@accounts.invalid')?null:u.email,u.id);
 }
 db.exec("CREATE TABLE IF NOT EXISTS schema_versions(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);INSERT OR IGNORE INTO schema_versions(version) VALUES(2);");
 migrateReceipts(db);db.exec('COMMIT');
}catch(error){db.exec('ROLLBACK');db.close();throw error;}
return db;}
