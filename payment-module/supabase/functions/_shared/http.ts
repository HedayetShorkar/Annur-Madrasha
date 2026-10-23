import { SafeError } from './domain.ts';
export async function limitedBody(req: Request, max = 8192):Promise<string>{
 if(!req.body)throw new SafeError('INVALID_INPUT');
 const reader=req.body.getReader(); const chunks:Uint8Array[]=[];let size=0;
 try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new SafeError('REQUEST_TOO_LARGE',413);}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
export function json(value:unknown,status=200,headers:Record<string,string>={}){
 return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
}
export function failure(error:unknown,headers:Record<string,string>={}){
 const id=crypto.randomUUID();
 // Intentionally never log body, sender, message, keys, JWT, stack or database details.
 return json({error:error instanceof SafeError?error.code:'REQUEST_FAILED',request_id:id},error instanceof SafeError?error.status:500,headers);
}
