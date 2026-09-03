const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(54)+(d||''));};
const B='http://localhost:8114';
(async()=>{
const browser=await chromium.launch();
const ctx=await browser.newContext();          // service workers ENABLED
const pg=await ctx.newPage();

console.log('\n=== 1. does it install at all? ===');
await pg.goto(B+'/index.html',{waitUntil:'load'});
await pg.waitForTimeout(2500);
let s=await pg.evaluate(async()=>{
  const r=await navigator.serviceWorker.getRegistration();
  const keys=await caches.keys();
  let n=0; if(keys.length){ const c=await caches.open(keys[0]); n=(await c.keys()).length; }
  return {active:!!(r&&r.active),caches:keys,files:n,thing:window.THING};});
T('the service worker activates',s.active);
T('a cache is created',s.caches.length===1,s.caches.join(','));
T('core files are cached',s.files>5,s.files+' entries');
T('the page loaded its asset',s.thing==='OLD-ASSET-V1',s.thing);

console.log('\n=== 2. offline — does the app still open? ===');
await ctx.setOffline(true);
await pg.goto(B+'/index.html',{waitUntil:'domcontentloaded'}).catch(()=>{});
await pg.waitForTimeout(900);
let off=await pg.evaluate(()=>({title:(document.getElementById('v')||{}).textContent||'',
  thing:window.THING}));
T('the page still opens with no network',/HTML/.test(off.title),'"'+off.title+'"');
T('its cached asset still loads',!!off.thing,String(off.thing));
await ctx.setOffline(false);

console.log('\n=== 3. THE ONE THAT MATTERS — deploy a new version ===');
await pg.goto(B+'/__deploy'); await pg.waitForTimeout(300);
await pg.goto(B+'/index.html',{waitUntil:'load'});
await pg.waitForTimeout(3000);
await pg.reload({waitUntil:'load'});           // second visit: SW should have updated
await pg.waitForTimeout(2500);
let up=await pg.evaluate(async()=>{
  const keys=await caches.keys();
  return {caches:keys, html:(document.getElementById('v')||{}).textContent||'', thing:window.THING};});
console.log('   caches now: '+up.caches.join(', '));
T('the new cache exists',up.caches.includes('shubhdin-v169'),up.caches.join(','));
T('the OLD cache was deleted',!up.caches.includes('shubhdin-v168'),up.caches.join(','));
T('new HTML reaches the user (network-first)',/NEW-HTML-V2/.test(up.html),'"'+up.html+'"');
T('NEW JS reaches the user after the version bump',up.thing==='NEW-ASSET-V2',
  String(up.thing)+(up.thing==='OLD-ASSET-V1'?'  <- stale JS served to an updated client':''));

console.log('\n=== 4. changing a file WITHOUT bumping the version ===');
await pg.goto(B+'/__deploy-asset-only'); await pg.waitForTimeout(200);
await pg.goto(B+'/index.html',{waitUntil:'load'}); await pg.waitForTimeout(1500);
await pg.reload({waitUntil:'load'}); await pg.waitForTimeout(1500);
let sneak=await pg.evaluate(()=>window.THING);
console.log('   asset now: '+sneak);
T('unbumped JS is correctly NOT delivered (this is the known discipline)',
  sneak!=='SNEAKY-V3', sneak==='SNEAKY-V3'?'it WAS delivered — cache-first is not holding':'stale, as designed');
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  the update path works');
await browser.close();})();
