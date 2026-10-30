import fs from 'node:fs';
import {parseHTML} from 'linkedom';
const pages=fs.readdirSync('dist',{recursive:true}).filter(p=>p.endsWith('.html')&&!p.startsWith('admin'));
const issues=[],images=new Map();let imageCount=0;
for(const path of pages){
 const d=parseHTML(fs.readFileSync('dist/'+path,'utf8')).document;
 if(!d.title || !d.querySelector('meta[name="description"]')?.getAttribute('content') || !d.querySelector('link[rel="canonical"]'))issues.push([path,'missing page metadata']);
 if(d.querySelectorAll('main h1').length!==1&&d.querySelector('main'))issues.push([path,'H1 count']);
 let prev=0;for(const h of d.querySelectorAll('main h1,main h2,main h3,main h4')){let level=+h.tagName[1];if(level>prev+1)issues.push([path,'heading skip',h.textContent]);prev=level;}
 for(const image of d.querySelectorAll('img')){
  imageCount++;const src=image.getAttribute('src')||image.getAttribute('data-src');const alt=image.getAttribute('alt');
  if(alt===null||(!alt&&!image.closest('[aria-hidden="true"]')))issues.push([path,'missing meaningful alt',src]);
  if(!image.getAttribute('width')||!image.getAttribute('height'))issues.push([path,'missing image dimensions',src]);
  if(!image.getAttribute('loading'))issues.push([path,'loading unspecified',src]);
  if(!src||!fs.existsSync('public'+src))issues.push([path,'broken image',src]);
  if(src&&!images.has(src))images.set(src,alt);
 }
}
fs.writeFileSync('docs/verification/image-heading-audit.json',JSON.stringify({pages:pages.length,imageInstances:imageCount,uniqueImages:images.size,issues,images:[...images].map(([src,alt])=>({src,alt}))},null,2));console.log(JSON.stringify({pages:pages.length,imageInstances:imageCount,issues}));if(issues.length)process.exitCode=1;
