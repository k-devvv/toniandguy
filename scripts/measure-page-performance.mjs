import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch();const report=[];
for(const origin of ['https://toniandguybangalore.in','http://127.0.0.1:8792']){
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.addInitScript(()=>{window.lab={cls:0,lcp:0};new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.lab.cls+=e.value;}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(list=>{window.lab.lcp=list.getEntries().at(-1).startTime;}).observe({type:'largest-contentful-paint',buffered:true});});
 await page.goto(origin+'/',{waitUntil:'networkidle'});await page.waitForTimeout(2000);
 const result=await page.evaluate(()=>({lcpMs:Math.round(window.lab.lcp),cls:window.lab.cls,imageRequests:performance.getEntriesByType('resource').filter(r=>/\.(webp|png|jpg)$/.test(new URL(r.name).pathname)).length,imageBytes:performance.getEntriesByType('resource').filter(r=>/\.(webp|png|jpg)$/.test(new URL(r.name).pathname)).reduce((sum,r)=>sum+r.encodedBodySize,0)}));
 report.push({origin,...result});await page.screenshot({path:'docs/verification/'+(origin.startsWith('https')?'before':'after')+'-mobile.png'});await page.close();
}
await browser.close();fs.writeFileSync('docs/verification/performance-lab.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
