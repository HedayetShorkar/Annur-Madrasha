import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'./',build:{outDir:'../live',emptyOutDir:true,cssCodeSplit:false,rollupOptions:{output:{format:'iife',inlineDynamicImports:true}}},server:{proxy:{'/api/live':{target:'http://127.0.0.1:4100'}}}});
