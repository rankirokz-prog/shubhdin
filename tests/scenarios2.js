const {chromium}=require('playwright');
const FAILS=[];
const T=(n,p,d)=>{ if(!p) FAILS.push(n); console.log((p?'  [ok]   ':'  [BUG]  ')+n+(d?'  -> '+d:'')); };
const U=o=>JSON.stringify(Object.assign({name:'Ram',lang:'te',setupDone:true,dob:'1990-05-05',
  tob:'06:00',city:'Eluru',city_lat:16.7,city_lon:81.1},o||{}));

(async()=>{
const b=await chromium.launch();
const errs=[];
async function open(page,opts){
  opts=opts||{};
  const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block',
    timezoneId:opts.tz||'Asia/Kolkata'});
  const pg=await CTX.newPage();
  pg.on('pageerror',e=>errs.push(page+' ('+(opts.label||'')+'): '+e.message.slice(0,80)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(/\/api\//.test(u))return r.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify(opts.api||{error:'payments not configured yet'})});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',
      body:"window.sdRashi=function(o){return o&&(o.hi||o.en)||'';};window.sdNak=window.sdRashi;window.sdVara=window.sdRashi;window.sdChog=window.sdRashi;window.sdTithi=window.sdRashi;window.sdPaksha=window.sdRashi;window.sdMasa=window.sdRashi;window.sdTerm=function(k,v){return (v&&(v.hi||v.en))||String(v||'');};window.sdDev=function(h,e){return h||e||'';};window.sdSlug=function(x){return String(x).toLowerCase();};window.sdHas=function(){return false;};"});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(st=>{localStorage.clear();
    for(const k in st) localStorage.setItem(k,st[k]);},opts.storage||{});
  await pg.goto('http://localhost:8112/'+page+(opts.query||''),{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(opts.wait||2200);
  return {pg,CTX};
}

console.log('\n=== 10. THE CITY THE MATHS ACTUALLY USES ===');
{ /* after the settings fix, a failed geocode DELETES the coordinates but keeps
     the city name. What does the panchang page then compute for? */
  const {pg,CTX}=await open('astrology.html',{label:'no coords',
    storage:{shubhdin_user:U({city:'Machilipatnam',city_lat:undefined,city_lon:undefined})}});
  const r=await pg.evaluate(()=>({lat:typeof LAT!=='undefined'?LAT:null,
    lng:typeof LNG!=='undefined'?LNG:null,
    shown:typeof CITY!=='undefined'?CITY:null}));
  /* the real invariant: the city NAME on screen must describe the coordinates
     the timings were computed from. Falling back is fine; lying is not. */
  const usingUjjain = r.lat && Math.abs(r.lat-23.1793)<0.01;
  const claimsUserCity = /Machilipatnam/i.test(r.shown||'');
  T('the city shown always matches the city computed', !(usingUjjain && claimsUserCity),
    'shows "'+r.shown+'" and computes lat '+r.lat);
  await CTX.close(); }
{ const {pg,CTX}=await open('astrology.html',{label:'has coords',
    storage:{shubhdin_user:U()}});
  const r=await pg.evaluate(()=>({lat:LAT,shown:CITY}));
  T('a user WITH coordinates gets their own city',Math.abs(r.lat-16.7)<0.1,
    r.shown+' at '+r.lat);
  await CTX.close(); }

console.log('\n=== 11. THE SALES PAGE ===');
for(const [label,st] of [
  ['corrupt owned list', {shubhdin_user:U(), sd_owned_reports:'{{{BROKEN'}],
  ['owned list is an object not an array', {shubhdin_user:U(), sd_owned_reports:'{"a":1}'}],
  ['no user at all', {}],
  ['owns everything', {shubhdin_user:U(), sd_owned_reports:JSON.stringify(
     ['marriage','love','career','child','annual','forecast'].map(r=>({report:r,lang:'te',order_code:'X'})))}]]){
  const {pg,CTX}=await open('premium.html',{label,storage:st});
  const r=await pg.evaluate(()=>({cards:document.querySelectorAll('#pageRoot a').length,
    html:(document.getElementById('pageRoot')||{}).innerHTML?1:0}));
  T('premium: '+label+' still shows something to buy or open',r.cards>0,r.cards+' cards');
  await CTX.close(); }

console.log('\n=== 12. THE BUY PAGE, ABUSED ===');
for(const [label,query,expect] of [
  ['no report in the url','',            'must not offer a nonsense purchase'],
  ['unknown report',      '?r=unicorn',  'must not offer a nonsense purchase'],
  ['withdrawn report',    '?r=muhurta',  'must not sell a withdrawn report'],
  ['uppercase',           '?r=MARRIAGE', 'should still resolve'],
  ['injection attempt',   '?r=<img src=x onerror=alert(1)>', 'must not inject']]){
  const {pg,CTX}=await open('buy.html',{label,query,storage:{shubhdin_user:U()}});
  const r=await pg.evaluate(()=>({R:typeof R!=='undefined'?R:null,
    title:(document.getElementById('hTitle')||{}).textContent||'',
    hasScript:/onerror|<img/i.test(document.body.innerHTML),
    payVisible:!!document.getElementById('btPay')}));
  if(label==='injection attempt') T('buy: '+label+' is not reflected into the page',!r.hasScript);
  else if(label==='uppercase')    T('buy: '+label+' resolves to a real report',r.R==='marriage',r.R);
  else T('buy: '+label+' — '+expect, r.R!=='unicorn'&&r.R!=='muhurta', 'R='+r.R+' title="'+r.title.slice(0,28)+'"');
  await CTX.close(); }
{ /* the classic double-charge: an anxious buyer taps Pay twice */
  const {pg,CTX}=await open('buy.html',{label:'double pay',query:'?r=marriage',
    storage:{shubhdin_user:U()},api:{ok:true,url:'https://rzp.example/x',order_code:'SD-1'}});
  const n=await pg.evaluate(()=>{
    let calls=0;
    const realFetch=window.fetch;
    window.fetch=function(u,o){ if(String(u).indexOf('create=1')>-1) calls++;
      return Promise.resolve({ok:true,json:()=>Promise.resolve({error:'payments not configured yet'})}); };
    try{ SESSION={user:{id:'u1'},access_token:'t'}; doPay(); doPay(); doPay(); }catch(e){}
    window.fetch=realFetch; return calls;});
  T('three taps on Pay do not mint three payment links',n<=1,n+' link request(s)');
  const warned=await pg.evaluate(()=>!!document.getElementById('sdCoordWarn'));
  await CTX.close(); }

console.log('\n=== 13. DEEP LINKS ===');
for(const [label,q,expect] of [
  ['?go=jap',      '?go=jap',      'scr-jap'],
  ['?go=panchang', '?go=panchang', null],
  ['?go=nonsense', '?go=../../etc','scr-home'],
  ['?go= empty',   '?go=',         'scr-home']]){
  const {pg,CTX}=await open('dashboard.html',{label,query:q,
    storage:{shubhdin_user:U(),shubhdin_kundli_ready:'1'},wait:3800});
  const r=await pg.evaluate(()=>({screen:(document.querySelector('.scr.on')||{}).id,
    url:location.search}));
  const ok = expect===null ? true : r.screen===expect;
  T('deep link '+label+' lands somewhere sane',ok&&!!r.screen,r.screen+' url="'+r.url+'"');
  await CTX.close(); }

console.log('\n=== 14. A WRONG DEVICE CLOCK ===');
for(const [label,offset] of [['clock 3 days behind',-3],['clock 2 years ahead',730]]){
  const {pg,CTX}=await open('dashboard.html',{label,
    storage:{shubhdin_user:U(),shubhdin_kundli_ready:'1',
      shubhdin_streak:JSON.stringify({count:5,date:new Date().toDateString()})},wait:3800});
  const r=await pg.evaluate(off=>{
    const RD=Date, fx=new RD(Date.now()+off*86400000);
    window.Date=function(...a){return a.length?new RD(...a):new RD(fx);};
    window.Date.now=()=>fx.getTime(); window.Date.prototype=RD.prototype;
    let out={};
    try{ out.gita=gitaOfDay()?gitaOfDay().ref:'none'; }catch(e){ out.gita='THREW'; }
    try{ out.done=japDoneToday(); }catch(e){ out.done='THREW'; }
    try{ applyHomeState(); out.state=document.body.dataset.home; }catch(e){ out.state='THREW'; }
    window.Date=RD; return out;},offset);
  T(label+' does not break the app',r.gita!=='THREW'&&r.done!=='THREW'&&r.state!=='THREW',
    'verse='+r.gita+' japDone='+r.done+' state='+r.state);
  await CTX.close(); }

console.log('\n=== 15. LANGUAGE ROUND TRIP ===');
{ const {pg,CTX}=await open('dashboard.html',{label:'lang switch',
    storage:{shubhdin_user:U(),shubhdin_kundli_ready:'1',
      sd_owned_reports:JSON.stringify([{report:'career',lang:'te',order_code:'SD-9'}])},wait:3800});
  const r=await pg.evaluate(()=>{
    const before=JSON.parse(localStorage.getItem('sd_owned_reports'))[0].lang;
    const u=JSON.parse(localStorage.getItem('shubhdin_user')); u.lang='hi';
    localStorage.setItem('shubhdin_user',JSON.stringify(u));
    const after=JSON.parse(localStorage.getItem('sd_owned_reports'))[0].lang;
    return {before,after};});
  T('changing app language does NOT change a purchased report language',
    r.before==='te'&&r.after==='te','bought in '+r.before+', still '+r.after);
  await CTX.close(); }

console.log('\n=== UNCAUGHT PAGE ERRORS ===');
if(!errs.length) console.log('  none');
else [...new Set(errs)].forEach(e=>console.log('  ! '+e));
console.log('\n=== SUMMARY ===');
console.log(FAILS.length? '  '+FAILS.length+' PROBLEM(S):\n   - '+FAILS.join('\n   - ')
                        : '  no failures in this pass');
await b.close();})();
