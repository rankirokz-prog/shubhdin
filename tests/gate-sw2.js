const {chromium}=require('playwright');
const T=(n,p,d)=>console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(52)+(d||''));
const B='http://localhost:8114';
(async()=>{
const br=await chromium.launch();

console.log('\n=== how many visits before a fix reaches an existing user? ===');
const ctx=await br.newContext(); const pg=await ctx.newPage();
await pg.goto(B+'/index.html',{waitUntil:'load'}); await pg.waitForTimeout(2500);
const start=await pg.evaluate(()=>window.THING);
console.log('   installed with: '+start);
await pg.goto(B+'/__deploy'); await pg.waitForTimeout(300);
let landed=0;
for(let visit=1; visit<=4; visit++){
  await pg.goto(B+'/index.html',{waitUntil:'load'});
  await pg.waitForTimeout(2200);
  const r=await pg.evaluate(async()=>({
    thing:window.THING, html:(document.getElementById('v')||{}).textContent,
    caches:(await caches.keys()).join(',')}));
  console.log('   visit '+visit+':  html='+r.html+'   js='+r.thing+'   cache='+r.caches);
  if(r.thing!==start){ landed=visit; break; }
}
T('the new JS reaches an existing user', landed>0 && landed<=2,
  landed? ('on visit '+landed+(landed<=2?' — a fix lands same session or next':' — too slow'))
        : 'NEVER arrived in 4 visits');

console.log('\n=== and the HTML? (network-first, should be instant) ===');
const ctx2=await br.newContext(); const p2=await ctx2.newPage();
await p2.goto(B+'/index.html',{waitUntil:'load'}); await p2.waitForTimeout(2200);
const h1=await p2.evaluate(()=>(document.getElementById('v')||{}).textContent);
await p2.goto(B+'/__deploy'); await p2.waitForTimeout(300);
await p2.goto(B+'/index.html',{waitUntil:'load'}); await p2.waitForTimeout(1200);
const h2=await p2.evaluate(()=>(document.getElementById('v')||{}).textContent);
console.log('   before: '+h1+'   after one navigation: '+h2);
T('new HTML lands on the very next navigation', h1!==h2, h1===h2?'stale':'instant');

await br.close();})();
