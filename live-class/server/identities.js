import {randomBytes} from 'node:crypto';
const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function allocateLoginId(db){
 for(let attempt=0;attempt<10;attempt++){
  const chars=Array.from(randomBytes(16),b=>alphabet[b%32]).join('');
  const id='AN-'+chars.match(/.{4}/g).join('-');
  if(!db.prepare('SELECT 1 FROM users WHERE login_id=? COLLATE NOCASE').get(id))return id;
 }
 throw Error('Could not allocate a unique classroom ID');
}
export function generatePassword(){return randomBytes(18).toString('base64url');}
export function normalizeLoginId(value){return value.trim().toUpperCase().replace(/\s+/g,'');}
