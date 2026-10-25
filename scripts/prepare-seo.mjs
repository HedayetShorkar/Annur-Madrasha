// Generate domain-specific SEO in a staged public release, never in private source.
// No network calls, Search Console access, analytics or automatic publication.
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const sourceRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const htmlEscape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function origin(value){
 if(typeof value!=='string'||/[\u0000-\u0020\\]/.test(value.trim()))throw Error('Use a valid public HTTPS domain.');
 let url;try{url=new URL(value);}catch{throw Error('A real HTTPS site origin is required.');}
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Use the HTTPS origin only, without a path, credentials, query or fragment.');
 if(!url.hostname.includes('.')||!url.hostname.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))||/^\d+$/.test(url.hostname.split('.').at(-1)))throw Error('Use the actual public domain, replacing the documentation placeholder.');
 return url.href;
}
function meta(html,key,value,attribute='property'){
 const tag='<meta '+attribute+'="'+key+'" content="'+htmlEscape(value)+'">';
 const pattern=new RegExp('<meta\\b[^>]*\\b'+attribute+'="'+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"[^>]*>','i');
 return pattern.test(html)?html.replace(pattern,tag):html.replace('</head>',tag+'\n</head>');
}
function canonical(html,url){
 const tag='<link rel="canonical" href="'+htmlEscape(url)+'">',pattern=/<link\b[^>]*\brel="canonical"[^>]*>/i;
 return pattern.test(html)?html.replace(pattern,tag):html.replace('</head>',tag+'\n</head>');
}
export async function prepareSeo({directory,siteUrl}){
 const base=origin(siteUrl),target=await realpath(directory),inside=relative(sourceRoot,target);
 if(!inside||!inside.startsWith('..'))throw Error('Choose a staged public directory outside the source project.');
 const pages=[['index.html',''],['learn/index.html','learn/']],prepared=[];
 for(const [file,path] of pages){
  const full=await realpath(resolve(target,file)),rel=relative(target,full);
  if(rel.startsWith('..'))throw Error('Public pages must not link to private source files.');
  let html=await readFile(full,'utf8');const url=new URL(path,base).href,logo=new URL('assets/images/brand-asset-1.webp',base).href;
  html=canonical(html,url);html=meta(html,'og:url',url);html=meta(html,'og:image',logo);html=meta(html,'og:image:alt','An-Noor International Online Madrasa logo');html=meta(html,'twitter:image',logo,'name');
  html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_,json)=>{
   const data=JSON.parse(json);
   const visit=value=>{
    if(!value||typeof value!=='object')return;
    if(value['@id']==='#org'||value['@id']==='../index.html#org')value['@id']=base+'#org';
    else if(value['@id']==='#website')value['@id']=base+'#website';
    else if(value['@id']==='#page')value['@id']=url+'#page';
    const types=[value['@type']].flat();
    if(types.includes('EducationalOrganization')){value.url=base;value.logo=logo;}
    if(types.includes('WebSite'))value.url=base;
    if(types.includes('WebPage'))value.url=url;
    if(value['@type']==='ListItem'&&value.item==='../index.html')value.item=base;
    Object.values(value).forEach(visit);
   };visit(data);
   return '<script type="application/ld+json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>';
  });prepared.push([full,html]);
 }
 const errorPage=await realpath(resolve(target,'404.html'));if(relative(target,errorPage).startsWith('..'))throw Error('Unsafe error page.');
 prepared.push([errorPage,(await readFile(errorPage,'utf8')).replace(/(<a data-seo-home href=")[^"]*(")/,'$1'+base+'$2')]);
 for(const name of ['robots.txt','sitemap.xml']){
  try{if(relative(target,await realpath(resolve(target,name))).startsWith('..'))throw Error('SEO output must stay inside the staged directory.');}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 prepared.push([resolve(target,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: '+base+'sitemap.xml\n']);
 const urls=pages.map(([,path])=>'<url><loc>'+htmlEscape(new URL(path,base).href)+'</loc></url>').join('\n');
 prepared.push([resolve(target,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls+'\n</urlset>\n']);
 for(const [file,contents]of prepared)await writeFile(file,contents);
 return {origin:base,indexablePages:pages.length,sitemap:base+'sitemap.xml'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length!==4){console.error('Usage: node scripts/prepare-seo.mjs /absolute/staged-public https://YOUR_REAL_DOMAIN');process.exitCode=1;}
 else try{console.log(JSON.stringify(await prepareSeo({directory:process.argv[2],siteUrl:process.argv[3]})));}catch(error){console.error(error.message);process.exitCode=1;}
}
