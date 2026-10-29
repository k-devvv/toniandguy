import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../docs/gtm-analytics-tag.html',import.meta.url),'utf8').replace(/^<script>\s*|\s*<\/script>$/g,'');
test('GTM bridge configures once, drains consented backlog and handles future safe events',()=>{
 const events={};const scripts=[];const dataLayer=[{event:'salon_event',analytics_event:'page_view',safe_page_location:'https://toniandguybangalore.in/services',safe_page_title:'Services'}];
 const context={window:{dataLayer},document:{addEventListener:(name,fn)=>events[name]=fn,createElement:()=>({}),head:{appendChild:x=>scripts.push(x)}},location:{hostname:'toniandguybangalore.in'},navigator:{},localStorage:{getItem:()=>JSON.stringify({value:'granted',expires:Date.now()+100000})}};
 vm.runInNewContext(source,context);vm.runInNewContext(source,context);
 assert.equal(scripts.length,1);
 const config=dataLayer.find(x=>x[0]==='config')[2];assert.equal(config.send_page_view,false);assert.equal(config.page_referrer,'');
 assert.equal(dataLayer.filter(x=>x[0]==='event').length,1);
 events['salon-analytics']({detail:{event:'salon_event',analytics_event:'phone_click',safe_page_location:'https://toniandguybangalore.in/book',salon_branch:'s'}});
 events['salon-analytics']({detail:{event:'salon_event',analytics_event:'page_view',safe_page_location:'https://toniandguybangalore.in/book?phone=Private'}});
 assert.equal(dataLayer.filter(x=>x[0]==='event').length,2);
 assert.ok(!JSON.stringify(dataLayer).includes('Private'));
});
