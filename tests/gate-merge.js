const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(54)+(d||''));};
(async()=>{const b=await chromium.launch();
async function home(o){
  o=o||{};
  const CTX=await b.newContext({viewport:{width:412,height:1000},serviceWorkers:'block'});
  const pg=await CTX.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message.slice(0,70)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(u.startsWith('http://localhost:8112')){
      if(o.noChakra&&/srichakra-draw|nitya-card|daily-nitya/.test(u)) return r.fulfill({status:404,body:''});
      return r.continue();}
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(l=>{localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:l,setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
    localStorage.setItem('shubhdin_kundli_ready','1');},o.lang||'hi');
  await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(3800);
  // inject a panchang exactly as the engine shapes it
  if(o.clear) await pg.evaluate(()=>{ window._panchangData=null;
    try{ renderDailySlot(); }catch(e){} });
  if(o.tithi!==undefined) await pg.evaluate(t=>{
    /* inject the NORMALISED shape the app really builds, not the raw engine
   object — testing against an invented shape is what let the live Gita bug
   through in the first place */
    window._panchangData=Object.assign(window._panchangData||{},{
      v:3, tithi:t.en, tithi_paksha:t.paksha, tithi_index:t.index, paksha_key:t.paksha});
    try{ renderDailySlot(); }catch(e){}
  },o.tithi);
  await pg.waitForTimeout(500);
  const r=await pg.evaluate(()=>{
    const m=document.getElementById('gitaMount');
    const n=m&&m.querySelector('.nitya-card'), g=m&&m.querySelector('.gita');
    return {nitya:!!n, gita:!!g,
      head:n?n.querySelector('.nitya-head').textContent.trim():'',
      name:n?n.querySelector('.nitya-name').textContent.trim():'',
      station:n?n.getAttribute('data-station'):null,
      svgs:n?n.querySelectorAll('svg').length:0,
      ov:document.body.scrollWidth-document.body.clientWidth,
      cards:[...document.querySelector('.hbody').children].filter(e=>e.getBoundingClientRect().height>0).length};});
  await CTX.close(); return {r,errs};}

console.log('\n=== shukla, Hindi -> the Sri Chakra card ===');
let x=await home({lang:'hi',tithi:{index:6,en:'Saptami',hi:'सप्तमी',paksha:'Shukla'}});
T('the Nitya card mounted',x.r.nitya,'station='+x.r.station);
T('the Gita is NOT also rendered',!x.r.gita);
T('the yantra and the moon glyph are both there',x.r.svgs===2,x.r.svgs+' svgs');
T('the heading is in Hindi, not English',/श्रीचक्र दर्शन|दिव्य ऊर्जा/.test(x.r.head),'"'+x.r.head+'"');
T('shukla saptami (index 6) -> station 9 (16-7, returning)',x.r.station==='9',x.r.station);
T('no sideways scroll',x.r.ov<=2,'overflow '+x.r.ov+'px');
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== the 1..30 index must become 1..15 ===');
x=await home({lang:'hi',tithi:{index:17,en:'Tritiya',hi:'तृतीया',paksha:'Krishna'}});
T('krishna tritiya (index 17) -> station 3, departing',x.r.nitya&&x.r.station==='3',
  'station '+x.r.station);
x=await home({lang:'en',tithi:{index:14,en:'Purnima',hi:'पूर्णिमा',paksha:'Shukla'}});
T('purnima (index 14) maps to the bindu',x.r.nitya&&x.r.station==='0',x.r.station);
x=await home({lang:'en',tithi:{index:0,en:'Pratipada',hi:'प्रतिपदा',paksha:'Shukla'}});
T('shukla pratipada (index 0) is station 15 — used to render NOTHING',
  x.r.nitya&&x.r.station==='15',x.r.station);
x=await home({lang:'en',tithi:{index:29,en:'Amavasya',hi:'अमावस्या',paksha:'Krishna'}});
T('amavasya (index 29) is the bindu',x.r.nitya&&x.r.station==='0',x.r.station);

console.log('\n=== Telugu must get the Gita, never English ===');
x=await home({lang:'te',tithi:{index:7,en:'Saptami',hi:'सप्तमी',paksha:'Shukla'}});
T('Telugu now renders the card',x.r.nitya&&!x.r.gita,'station='+x.r.station);
T('no English Nitya name anywhere',!/Kameshvari|Bhagamalini/.test(JSON.stringify(x.r)));

console.log('\n=== before the panchang arrives ===');
/* the real engine now loads in this harness, so simply not injecting is no
   longer "no data". Clear it explicitly. */
x=await home({lang:'hi',clear:true});
T('the Gita shows while the tithi is unknown',x.r.gita&&!x.r.nitya,
  'no engine data -> floor, not a blank slot');
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== the three files fail to load ===');
x=await home({lang:'hi',noChakra:true,tithi:{index:7,en:'Saptami',hi:'सप्तमी',paksha:'Shukla'}});
T('the Gita renders, app unharmed',x.r.gita&&!x.r.nitya);
T('the home screen is intact',x.r.cards>=5,x.r.cards+' cards');
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  the merge holds');
await b.close();})();
