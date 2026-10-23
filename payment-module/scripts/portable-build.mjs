import {readFile,writeFile} from 'node:fs/promises';
const path=new URL('../../payments/index.html',import.meta.url);
let html=await readFile(path,'utf8');
html=html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,'<script defer src="$1"></script>').replace(/ crossorigin(?=[\s>])/g,'');
if(/type="module"/.test(html)||!/<script defer src="\.\/assets\//.test(html))throw Error('Expected relative classic script');
await writeFile(path,html);
