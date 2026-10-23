import { createClient } from '@supabase/supabase-js';
import { paymentsHandler } from '../_shared/payments-handler.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(paymentsHandler(db,(Deno.env.get('ALLOWED_ORIGINS')??'').split(',').map(x=>x.trim()).filter(Boolean)));
