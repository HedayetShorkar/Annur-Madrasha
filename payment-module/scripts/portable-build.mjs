import {readFile,writeFile,readdir} from 'node:fs/promises';
const path=new URL('../../payments/index.html',import.meta.url);
let html=await readFile(path,'utf8');
html=html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,'<script defer src="$1"></script>').replace(/ crossorigin(?=[\s>])/g,'');
if(/type="module"/.test(html)||!/<script defer src="\.\/assets\//.test(html))throw Error('Expected relative classic script');
const exporters=(await readdir(new URL('../../payments/assets/',import.meta.url))).filter(n=>/^receipt-pdf-[\w-]+\.js$/.test(n));
if(exporters.length!==1)throw Error('Expected one fingerprinted PDF exporter');
html=html.replace(/(<script defer src="[^"]+")/, '$1 data-receipt-pdf="./assets/'+exporters[0]+'"');
await writeFile(path,html);
