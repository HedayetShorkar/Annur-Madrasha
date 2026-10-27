import {defineConfig} from 'vite';
export default defineConfig({build:{outDir:'../payments/assets',emptyOutDir:false,lib:{entry:'src/receipt-pdf.ts',name:'AnNoorReceiptPdf',formats:['iife'],fileName:'receipt-pdf'},rollupOptions:{output:{entryFileNames:'receipt-pdf-[hash].js'}}}});
