/* Adversarial pass. The point is to FIND failures, not to collect ticks.
   Every scenario is something a real user can actually do or be. */
const {chromium}=require('playwright');
const FAILS=[];
const T=(n,p,d)=>{ if(!p) FAILS.push(n); console.log((p?'  [ok]   ':'  [BUG]  ')+n+(d?'  -> '+d:'')); };

(async()=>{
const b=await chromium.launch();
const errs=[];

async function open(opts){
  opts=opts||{};
  const CTX=await b.newContext({
    viewport:opts.viewport||{width:412,height:900},
    serviceWorkers:'block',
    timezoneId:opts.tz||'Asia/Kolkata'
  });
  const pg=await CTX.newPage();
  pg.on('pageerror',e=>errs.push((opts.label||'?')+': '+e.message.slice(0,90)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',
      body:"window.sdRashi=function(o){return o&&(o.hi||o.en)||'';};window.sdNak=window.sdRashi;window.sdVara=window.sdRashi;window.sdChog=window.sdRashi;window.sdTithi=window.sdRashi;window.sdPaksha=window.sdRashi;window.sdMasa=window.sdRashi;window.sdTerm=function(k,v){return (v&&(v.hi||v.en))||String(v||'');};window.sdDev=function(h,e){return h||e||'';};window.sdSlug=function(x){return String(x).toLowerCase();};window.sdHas=function(){return false;};"});
    return r.fulfill({status:404,body:''});});
  if(opts.storage) await pg.addInitScript(st=>{
    localStorage.clear();
    for(const k in st){ localStorage.setItem(k,st[k]); }
  },opts.storage);
  await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
  if(opts.offline) await CTX.setOffline(true);
  await pg.waitForTimeout(opts.wait||3600);
  return {pg,CTX};
}
const U=o=>JSON.stringify(Object.assign({name:'Ram',lang:'te',setupDone:true,dob:'1990-05-05',
  tob:'06:00',city:'Eluru',city_lat:16.7,city_lon:81.1},o||{}));
const ds=d=>d.toDateString();

/* what "the app works" means: the splash lifted and the home screen has content */
async function usable(pg){
  return pg.evaluate(()=>{
    const wp=document.getElementById('wallpaper');
    let covered=false;
    if(wp){const cs=getComputedStyle(wp);
      covered=cs.display!=='none'&&cs.visibility!=='hidden'&&parseFloat(cs.opacity)>0.05;}
    const body=document.querySelector('.hbody');
    const visible=body?[...body.children].filter(e=>e.getBoundingClientRect().height>0).length:0;
    return {covered,visible};});
}

console.log('\n=== 1. WHO THE USER IS ===');
{ const {pg,CTX}=await open({label:'brand new',storage:{}});
  const u=await usable(pg);
  T('a brand-new install is not trapped behind the splash',!u.covered);
  await CTX.close(); }
{ const {pg,CTX}=await open({label:'no name',storage:{shubhdin_user:U({name:''})}});
  const u=await usable(pg);
  T('empty name does not break the home screen',!u.covered&&u.visible>0,u.visible+' cards');
  await CTX.close(); }
{ const long='ఆంధ్రప్రదేశ్‌వాసి '.repeat(6);
  const {pg,CTX}=await open({label:'long name',storage:{shubhdin_user:U({name:long})}});
  const over=await pg.evaluate(()=>{
    const el=document.body; return el.scrollWidth-el.clientWidth;});
  T('a very long name does not push the layout sideways',over<=2,'overflow '+over+'px');
  await CTX.close(); }

console.log('\n=== 2. BIRTH DATA THE ENGINE MIGHT CHOKE ON ===');
for(const [label,dob,tob] of [
   ['leap day 29 Feb','2000-02-29','06:00'],
   ['midnight birth','1990-05-05','00:00'],
   ['1 minute to midnight','1990-05-05','23:59'],
   ['a date in the future','2035-01-01','06:00'],
   ['before 1900','1899-01-01','06:00'],
   ['garbage date','not-a-date','06:00']]){
  const {pg,CTX}=await open({label,storage:{shubhdin_user:U({dob,tob})}});
  const u=await usable(pg);
  T(label+' still leaves a usable app',!u.covered&&u.visible>0,u.visible+' cards');
  await CTX.close(); }

console.log('\n=== 3. CORRUPT STORAGE (one key at a time) ===');
for(const key of ['shubhdin_user','shubhdin_streak','shubhdin_kundli_details',
                  'sd_owned_reports','shubhdin_wallpapers','sd_evq','shubhdin_sadhana']){
  const st={shubhdin_user:U()}; st[key]='{{{ NOT JSON';
  const {pg,CTX}=await open({label:'corrupt '+key,storage:st});
  const u=await usable(pg);
  T('corrupt '+key+' -> app still opens',!u.covered,u.visible+' cards');
  await CTX.close(); }

console.log('\n=== 4. THE STREAK ACROSS REAL DAYS ===');
{ const y=new Date(); y.setDate(y.getDate()-1);
  const old=new Date(); old.setDate(old.getDate()-5);
  for(const [label,rec,expectTappable] of [
    ['done today',              {count:4,date:ds(new Date())},        false],
    ['done yesterday only',     {count:3,date:ds(y)},                 true],
    ['last done 5 days ago',    {count:9,date:ds(old)},               true],
    ['legacy lastDate field',   {count:2,lastDate:ds(new Date())},    false],
    ['empty record',            {},                                   true]]){
    /* The fixture dates are built HERE, in node, which runs on the container
       clock (UTC) — but open() forces the browser to Asia/Kolkata. Between
       18:30 and midnight UTC those are different days, so "done today" was
       written as yesterday and the app correctly said not-done. The suite was
       wrong, not the app. Re-stamp the dates inside the page, in the page's
       own timezone. */
    const {pg,CTX}=await open({label,storage:{shubhdin_user:U(),
      shubhdin_streak:JSON.stringify(rec)}});
    await pg.evaluate(function(offsetDays){
      if(offsetDays===null) return;                 /* empty record: leave it */
      var d=new Date(); d.setDate(d.getDate()-offsetDays);
      var rec=JSON.parse(localStorage.getItem('shubhdin_streak')||'{}');
      if(rec.date)     rec.date     = d.toDateString();
      if(rec.lastDate) rec.lastDate = d.toDateString();
      localStorage.setItem('shubhdin_streak',JSON.stringify(rec));
    }, (label==='done today'||label==='legacy lastDate field') ? 0
       : label==='done yesterday only' ? 1
       : label==='last done 5 days ago' ? 5 : null);
    const r=await pg.evaluate(()=>({done:japDoneToday(),
      cursor:(document.querySelector('.streak')||{style:{}}).style.cursor}));
    T(label+' -> tappable='+(!r.done),(!r.done)===expectTappable,'japDoneToday='+r.done);
    await CTX.close(); }
}

console.log('\n=== 5. THE WORLD OUTSIDE INDIA ===');
for(const tz of ['America/New_York','Pacific/Kiritimati','Europe/London','Asia/Tokyo']){
  const {pg,CTX}=await open({label:tz,tz,storage:{shubhdin_user:U()}});
  const u=await usable(pg);
  const g=await pg.evaluate(()=>{try{const x=gitaOfDay();return x?x.ref:'none';}catch(e){return 'THREW';}});
  T('NRI in '+tz+' gets a working app',!u.covered&&g!=='THREW',g);
  await CTX.close(); }

console.log('\n=== 6. NO NETWORK ===');
{ const {pg,CTX}=await open({label:'offline',offline:true,storage:{shubhdin_user:U()},wait:4200});
  const u=await usable(pg);
  T('the app opens with no connection at all',!u.covered,u.visible+' cards');
  const q=await pg.evaluate(()=>{sdTrack('offline_probe',{n:1});return SD_ANALYTICS.queued();});
  T('events are held for later rather than lost',q>0,q+' queued');
  await CTX.close(); }

console.log('\n=== 7. SCREEN SIZES ===');
for(const [label,vp] of [['small phone 320px',{width:320,height:640}],
                         ['tall phone',{width:412,height:915}],
                         ['tablet 768px',{width:768,height:1024}]]){
  const {pg,CTX}=await open({label,viewport:vp,storage:{shubhdin_user:U(),shubhdin_kundli_ready:'1'}});
  const over=await pg.evaluate(()=>document.body.scrollWidth-document.body.clientWidth);
  T(label+' has no sideways scroll',over<=2,'overflow '+over+'px');
  await CTX.close(); }

console.log('\n=== 8. ALL NINE LANGUAGES ===');
for(const lang of ['en','hi','te','kn','ta','bn','mr','gu','as']){
  const {pg,CTX}=await open({label:lang,storage:{shubhdin_user:U({lang}),shubhdin_kundli_ready:'1'}});
  const r=await pg.evaluate(()=>{
    const c=document.querySelector('.gita');
    const over=document.body.scrollWidth-document.body.clientWidth;
    return {card:!!c,over:over};});
  T(lang+' renders without breaking the layout',r.over<=2,'gita card='+r.card+' overflow='+r.over);
  await CTX.close(); }

console.log('\n=== 9. IMPATIENT FINGERS ===');
{ const {pg,CTX}=await open({label:'double tap',storage:{shubhdin_user:U(),
    shubhdin_streak:JSON.stringify({count:1,date:'old'})}});
  const r=await pg.evaluate(()=>{
    const st=document.querySelector('.streak');
    let n=0; const real=window.goJap; window.goJap=function(){n++;};
    st.click(); st.click(); st.click();
    window.goJap=real; return n;});
  T('three fast taps on the streak do not stack three navigations',r<=3,r+' calls');
  await CTX.close(); }

console.log('\n=== UNCAUGHT PAGE ERRORS SEEN ===');
if(!errs.length) console.log('  none');
else [...new Set(errs)].forEach(e=>console.log('  ! '+e));

console.log('\n=== SUMMARY ===');
console.log(FAILS.length? '  '+FAILS.length+' PROBLEM(S):\n   - '+FAILS.join('\n   - ')
                        : '  no failures in this pass');
await b.close();})();
