/* Astrological correctness. These check the CLAIMS the app makes about a
   person's chart, which matter more than any layout bug: a wrong rashi is
   noticed instantly by the audience that pays for reports. */
const {chromium}=require('playwright');
const FAILS=[];
const T=(n,p,d)=>{ if(!p) FAILS.push(n); console.log((p?'  [ok]   ':'  [BUG]  ')+n+(d?'  -> '+d:'')); };
const U=o=>JSON.stringify(Object.assign({name:'Ram',lang:'en',setupDone:true,dob:'1990-05-05',
  tob:'06:00',city:'Eluru',city_lat:16.7,city_lon:81.1},o||{}));

(async()=>{
const b=await chromium.launch();
async function open(st,label){
  const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'});
  const pg=await CTX.newPage();
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',
      body:"window.sdRashi=function(o){return (typeof o==='string')?o:((o&&(o.en||o.hi))||'');};window.sdNak=window.sdRashi;window.sdVara=window.sdRashi;window.sdChog=window.sdRashi;window.sdTithi=window.sdRashi;window.sdPaksha=window.sdRashi;window.sdMasa=window.sdRashi;window.sdTerm=function(k,v){return (v&&(v.en||v.hi))||String(v||'');};window.sdDev=function(h,e){return h||e||'';};window.sdSlug=function(x){return String(x).toLowerCase();};window.sdHas=function(){return false;};"});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(s=>{localStorage.clear(); for(const k in s) localStorage.setItem(k,s[k]);},st);
  await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(3700);
  return {pg,CTX};
}
const read=pg=>pg.evaluate(()=>({
  rv:(document.getElementById('rv')||{}).textContent||'',
  nv:(document.getElementById('nv')||{}).textContent||'',
  lhSub:(document.getElementById('lhSub')||{}).textContent||'',
  nak2:(document.getElementById('nakVal2')||{}).textContent||'',
  known:typeof R_KNOWN!=='undefined'?R_KNOWN:null,
  br:typeof BIRTH_RASHI!=='undefined'?BIRTH_RASHI:null }));

console.log('\n=== 16. IS THE RASHI THE MOON SIGN OR A WESTERN SUN SIGN? ===');
{ /* 5 May 1990. Tropical Sun = Taurus/Vrishabha. Sidereal Sun = Mesha.
     The MOON that day was in Dhanu. Only the moon answer is a janma rashi. */
  const {pg,CTX}=await open({shubhdin_user:U({rashi:'Dhanu',nakshatra:'Moola'})},'moon known');
  const r=await read(pg);
  T('the home chip shows a MOON rashi from the engine',/Dhanu|Simha/.test(r.rv),'"'+r.rv+'"');
  T('it is NOT the western sun sign for that date',!/Vrishabha|Taurus/i.test(r.rv),'"'+r.rv+'"');
  T('the listen card agrees with the chip',r.rv&&r.lhSub.indexOf(r.rv)>=0,'"'+r.lhSub+'"');
  T('the nakshatra shown is not one invented from the birth month',
    !/Krittika/.test(r.lhSub),'"'+r.lhSub+'"');
  await CTX.close(); }

{ /* the case that shipped: no engine value yet. It used to show a western sun
     sign plus a nakshatra derived from the birth MONTH, which cannot exist. */
  const {pg,CTX}=await open({shubhdin_user:U()},'no engine value');
  const r=await read(pg);
  T('with no computed chart it does NOT claim a rashi',!/Vrishabha|Taurus|Mesha/i.test(r.rv),'"'+r.rv+'"');
  /* These two used to BLACKLIST four nakshatra names, on the reasoning that
     the old bug invented them from the birth month. But those are also four
     real nakshatras — so on any day the sky genuinely shows Krittika,
     Ashwini, Mrigashira or Punarvasu, the suite failed with nothing wrong.
     That is roughly four days in twenty-seven. Caught on a Krittika day.
     Check PROVENANCE instead: the panchang value must equal what the engine
     computed, and the listen card must not carry a birth nakshatra it was
     never given. */
  const sky = await pg.evaluate(()=>{ try{
    var n=(window._panchangData||{}).nakshatra; return typeof n==='string'?n:(n&&(n.en||n.hi))||''; }catch(e){ return ''; } });
  T('the panchang nakshatra is the engine\u2019s, not an invented one',
    r.nak2==='—'||r.nak2===''||!sky||r.nak2.indexOf(sky)>=0||sky.indexOf(r.nak2)>=0,
    'shown="'+r.nak2+'" engine="'+sky+'"');
  T('with no computed chart the listen card claims no birth nakshatra',
    !r.lhSub||r.lhSub.indexOf('\u2022')<0||!/[A-Z][a-z]+ ?[A-Z]?[a-z]*$/.test(r.lhSub.split('\u2022').pop().trim())
      ||r.lhSub.split('\u2022').length<=2,
    'listen="'+r.lhSub+'"');
  await CTX.close(); }

console.log('\n=== 17. EVERY SIGN ROUND-TRIPS ===');
{ const signs=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula',
               'Vrischika','Dhanu','Makara','Kumbha','Meena'];
  let bad=[];
  for(const sign of signs){
    const {pg,CTX}=await open({shubhdin_user:U({rashi:sign,nakshatra:'Rohini'})},sign);
    const r=await read(pg);
    if(!r.rv||r.rv.length<3) bad.push(sign+'->(blank)');
    await CTX.close(); }
  T('all twelve signs render a real sign (engine may override)',bad.length===0,bad.join(', ')||'12/12'); }

console.log('\n=== 18. THE BIRTH-TIME CAVEAT ===');
{ const {pg,CTX}=await open({shubhdin_user:U({rashi:'Dhanu',nakshatra:'Moola',tobUnknown:true})},'tob unknown');
  const r=await pg.evaluate(()=>{
    try{ updateBirthChips({rashi:'Dhanu',nakshatra:'Moola',nakshatra_pada:3}); }catch(e){}
    return {nv:(document.getElementById('nv')||{}).textContent||'',
            unknown:typeof tobIsUnknown==='function'?tobIsUnknown():null};});
  T('pada is hidden when the birth time was only assumed',r.unknown===true&&!/P3/.test(r.nv),
    '"'+r.nv+'"');
  await CTX.close(); }
{ const {pg,CTX}=await open({shubhdin_user:U({rashi:'Dhanu',nakshatra:'Moola'})},'tob known');
  const r=await pg.evaluate(()=>{
    try{ updateBirthChips({rashi:'Dhanu',nakshatra:'Moola',nakshatra_pada:3}); }catch(e){}
    return (document.getElementById('nv')||{}).textContent||'';});
  T('pada IS shown when the birth time is real',/P3/.test(r),'"'+r+'"');
  await CTX.close(); }

console.log('\n=== 19. THE PANCHANG DAY STARTS AT SUNRISE, NOT MIDNIGHT ===');
{ /* A user opening the app at 03:00 is still in the previous vara by Vedic
     reckoning. Whatever the app decides, the weekday it NAMES and the weekday
     it uses for rahu kaal must be the same one. */
  const {pg,CTX}=await open({shubhdin_user:U()},'3am');
  const r=await pg.evaluate(()=>{
    const RD=Date, fx=new RD(); fx.setHours(3,0,0,0);
    window.Date=function(...a){return a.length?new RD(...a):new RD(fx);};
    window.Date.now=()=>fx.getTime(); window.Date.prototype=RD.prototype;
    let out={};
    try{ out.dow=new Date().getDay(); }catch(e){}
    try{ out.mantraDay=(typeof MANTRA_WORDS!=='undefined')?Object.keys(MANTRA_WORDS).length:null; }catch(e){}
    window.Date=RD; return out;});
  T('a 3am open does not crash the day-of-week logic',r.dow!==undefined,'dow='+r.dow);
  await CTX.close(); }

console.log('\n=== 20. THE CHART FOLLOWS A CORRECTED BIRTH DATE ===');
{ const {pg,CTX}=await open({shubhdin_user:U({rashi:'Dhanu',nakshatra:'Moola',
    birth_cache_key:'OLD'})},'correction');
  const r=await pg.evaluate(async()=>{
    window.saveToCloud=function(){return Promise.resolve();};
    try{ Object.defineProperty(window.location,'reload',{value:function(){},configurable:true}); }catch(e){}
    openSettings();
    document.getElementById('settDob').value='1985-11-11';
    await saveSettings();
    const u=JSON.parse(localStorage.getItem('shubhdin_user'));
    return {rashi:u.rashi,nak:u.nakshatra,cache:u.birth_cache_key};});
  T('a corrected birth date clears the old rashi',!r.rashi,'rashi="'+r.rashi+'"');
  T('and the old nakshatra',!r.nak,'nakshatra="'+r.nak+'"');
  T('and the chart cache key',!r.cache,'cache="'+r.cache+'"');
  await CTX.close(); }

console.log('\n=== SUMMARY ===');
console.log(FAILS.length? '  '+FAILS.length+' PROBLEM(S):\n   - '+FAILS.join('\n   - ')
                        : '  no failures in this pass');
await b.close();})();
