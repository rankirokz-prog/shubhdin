/* The test I should have written first: let the REAL engine and the REAL
   normaliser build _panchangData, and see whether the card appears. My earlier
   suite injected a hand-made object, which is why it passed while the live app
   showed the Gita forever. */
const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(54)+(d||''));};
(async()=>{const b=await chromium.launch();
async function real(lang){
  const CTX=await b.newContext({viewport:{width:412,height:1000},serviceWorkers:'block'});
  const pg=await CTX.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message.slice(0,70)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(l=>{localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:l,setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
    localStorage.setItem('shubhdin_kundli_ready','1');},lang);
  await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(6000);          // let the real engine finish
  const r=await pg.evaluate(()=>{
    const pd=window._panchangData||{};
    const m=document.getElementById('gitaMount');
    const n=m&&m.querySelector('.nitya-card');
    let ctx=null; try{ ctx=sdNityaCtx(); }catch(e){}
    return {haveData:!!window._panchangData,
      tithiType:typeof pd.tithi, tithiIndex:pd.tithi_index, paksha:pd.paksha_key,
      v:pd.v, ctx:ctx, nitya:!!n, gita:!!(m&&m.querySelector('.gita')),
      station:n?n.getAttribute('data-station'):null,
      head:n?n.querySelector('.nitya-head').textContent.trim():''};});
  await CTX.close(); return {r,errs};}

console.log('\n=== the REAL engine, English ===');
let x=await real('en');
console.log('   _panchangData: v='+x.r.v+'  tithi is a '+x.r.tithiType
  +'  tithi_index='+x.r.tithiIndex+'  paksha_key='+x.r.paksha);
T('the engine produced a panchang',x.r.haveData);
T('the machine-readable tithi survived normalisation',x.r.tithiIndex!=null,
  'tithi_index='+x.r.tithiIndex);
T('sdNityaCtx builds a context',!!x.r.ctx,JSON.stringify(x.r.ctx));
T('THE SRI CHAKRA CARD APPEARS',x.r.nitya,'station='+x.r.station+' "'+x.r.head.slice(0,50)+'"');
T('the Gita is not also rendered',!x.r.gita);
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== Telugu — the writer batch has landed ===');
x=await real('te');
T('TELUGU NOW GETS THE SRI CHAKRA',x.r.nitya&&!x.r.gita,
  'station='+x.r.station+'  "'+x.r.head.slice(0,46)+'"');
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));
for(const l of ['kn','ta','bn','mr','gu','as']){
  const y=await real(l);
  T(l+' renders the card',y.r.nitya&&!y.r.gita,'station='+y.r.station);
}

console.log('\n=== a stale v2 cache must not defeat the fix ===');
{
  const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'});
  const pg=await CTX.newPage();
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(()=>{localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:'en',setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
    localStorage.setItem('shubhdin_kundli_ready','1');
    /* an old-shape cache, exactly as a phone would hold it */
    for(const k of ['sd_pg_cache','shubhdin_panchang_cache'])
      localStorage.setItem(k,JSON.stringify({v:2,seg:{},forNak:'',forRas:'',tithi:'Tritiya'}));});
  await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(6000);
  const r=await pg.evaluate(()=>({v:(window._panchangData||{}).v,
    idx:(window._panchangData||{}).tithi_index,
    nitya:!!document.querySelector('.nitya-card')}));
  T('the v2 cache is rejected and v3 is rebuilt',r.v===3,'v='+r.v);
  T('the card still appears',r.nitya,'tithi_index='+r.idx);
  await CTX.close();
}
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
