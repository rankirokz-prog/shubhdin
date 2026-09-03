/* The test that would have caught the off-by-one: walk REAL consecutive days
   through the REAL engine and check that the tithi the label names is the same
   tithi the card acts on. My earlier suites injected one index and asserted a
   station I had derived from the same wrong formula — circular, and green. */
const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(52)+(d||''));};
const ORD={1:'Pratipada',2:'Dwitiya',3:'Tritiya',4:'Chaturthi',5:'Panchami',6:'Shashthi',
 7:'Saptami',8:'Ashtami',9:'Navami',10:'Dashami',11:'Ekadashi',12:'Dwadashi',
 13:'Trayodashi',14:'Chaturdashi',15:null};   // 15 is Purnima or Amavasya

(async()=>{const b=await chromium.launch();
const CTX=await b.newContext({viewport:{width:412,height:1000},serviceWorkers:'block'});
const pg=await CTX.newPage(); const errs=[];
pg.on('pageerror',e=>errs.push(e.message.slice(0,60)));
await pg.route('**/*',r=>{const u=r.request().url();
  if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
  if(u.startsWith('http://localhost:8112'))return r.continue();
  if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'window.sdHas=function(){return false;};'});
  return r.fulfill({status:404,body:''});});
await pg.addInitScript(()=>{localStorage.clear();
  localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:'en',setupDone:true,
    dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
  localStorage.setItem('shubhdin_kundli_ready','1');});
await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(6000);

console.log('\n=== 31 real days: does the label agree with the goddess? ===');
const rows=await pg.evaluate(async()=>{
  const out=[];
  const PE=window.PanchangEngine;
  for(let d=1; d<=31; d++){
    const anchor=new Date(Date.UTC(2026,7,d,12,0,0)-5.5*3600000);
    let p; try{ p=PE.getPanchang(anchor,16.7107,81.0952,5.5); }catch(e){ continue; }
    window._panchangData={v:3, tithi:p.tithi.en, tithi_paksha:p.tithi.paksha,
      tithi_index:p.tithi.index, paksha_key:p.tithi.paksha};
    let ctx=null; try{ ctx=sdNityaCtx(); }catch(e){}
    renderDailySlot();
    const n=document.querySelector('.nitya-card');
    out.push({day:d, idx:p.tithi.index, engName:p.tithi.en, engPak:p.tithi.paksha,
      ctxTithi:ctx&&ctx.tithi, ctxPak:ctx&&ctx.paksha,
      ctxDate:ctx&&ctx.date?new Date(ctx.date).toDateString():null,
      station:n?n.getAttribute('data-station'):null,
      goddess:n?n.querySelector('.nitya-name').textContent.trim():null});
  }
  return out;});

let mismatch=[], noCard=[];
rows.forEach(r=>{
  const expect = ORD[r.ctxTithi];
  if(r.station===null){ noCard.push('Aug'+r.day); return; }
  if(expect && r.engName!==expect) mismatch.push('Aug'+r.day+': engine says '+r.engName+
    ' but card acts on tithi '+r.ctxTithi+' ('+expect+')');
  if(r.ctxPak.toLowerCase()!==r.engPak.toLowerCase())
    mismatch.push('Aug'+r.day+': paksha '+r.ctxPak+' vs engine '+r.engPak);
});
rows.slice(0,6).forEach(r=>console.log('   Aug'+String(r.day).padStart(2)+'  idx '+
  String(r.idx).padStart(2)+'  '+r.engName.padEnd(12)+r.engPak.padEnd(9)+
  '→ tithi '+String(r.ctxTithi).padStart(2)+' station '+String(r.station).padStart(2)+'  '+(r.goddess||'')));
T('the label and the card agree on every day',mismatch.length===0,
  mismatch.slice(0,3).join(' | ')||rows.length+' days checked');
T('a card renders on every day of the month',noCard.length===0,noCard.join(', ')||rows.length+'/'+rows.length);

/* Fable asked for this: ctx.date is the one field nothing proved. */
const today=new Date().toDateString();
const badDate=rows.filter(r=>r.ctxDate!==today);
T('ctx.date is the civil date of the Vedic day',badDate.length===0,
  badDate.length?('e.g. '+badDate[0].ctxDate+' vs '+today):rows.length+' days, all today');

console.log('\n=== the two days my old code got wrong ===');
const prat=rows.find(r=>r.idx===0);
T('Shukla Pratipada (index 0) renders — it used to be rejected',
  prat&&prat.station!==null,prat?('station '+prat.station+' '+prat.goddess):'(not in range)');
const chat=rows.find(r=>r.engName==='Chaturthi'&&r.engPak==='Krishna');
T('Krishna Chaturthi acts on tithi 4, not 3',chat&&chat.ctxTithi===4,
  chat?('tithi '+chat.ctxTithi+' station '+chat.station+' '+chat.goddess):'(not found)');

console.log('\n=== purnima and amavasya go to the bindu ===');
const pur=rows.find(r=>r.engName==='Purnima'), ama=rows.find(r=>r.engName==='Amavasya');
T('Purnima → station 0',!pur||pur.station==='0',pur?('station '+pur.station):'(none in range)');
T('Amavasya → station 0',!ama||ama.station==='0',ama?('station '+ama.station):'(none in range)');
T('no uncaught errors',errs.length===0,errs.join('; '));

console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  label and card agree all month');
await b.close();})();
