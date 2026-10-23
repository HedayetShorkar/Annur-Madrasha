import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'VITE_');
 if(Object.keys(env).some(k=>/SECRET|SERVICE_ROLE|WEBHOOK/i.test(k)))throw Error('Privileged variables must never use the VITE_ prefix.');
 const key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(key){
  let publicKey=key.startsWith('sb_publishable_');
  if(!publicKey){try{publicKey=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='anon';}catch{publicKey=false;}}
  if(!publicKey)throw Error('Only a Supabase publishable/anon key may be compiled into the browser.');
 }
 return {plugins:[react(),tailwindcss()],base:'./',build:{outDir:'../payments',emptyOutDir:true,cssCodeSplit:false,rollupOptions:{output:{format:'iife',inlineDynamicImports:true}}},server:{proxy:{'/api/live':{target:'http://127.0.0.1:4100'}}}};
});
