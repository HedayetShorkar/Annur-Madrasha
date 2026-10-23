import {readFile,writeFile} from 'node:fs/promises';
const path=new URL('../../live/index.html',import.meta.url);
let html=await readFile(path,'utf8');
// The generated bundle is an IIFE with all dynamic imports inlined. A classic
// deferred script and relative assets also render when index.html is opened
// directly from disk. Actual authentication and media still require HTTP(S).
html=html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,'<script defer src="$1"></script>').replace(/ crossorigin(?=[\s>])/g,'');
if(/type="module"/.test(html)||!/<script defer src="\.\/assets\//.test(html))throw Error('Expected a relative classic entry script');
await writeFile(path,html);
