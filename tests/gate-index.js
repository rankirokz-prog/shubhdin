const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(52)+(d||''));};
(async()=>{const b=await chromium.launch();
async function boot(o){
  o=o||{};
  const CTX=await b.newContext({viewport:o.vp||{width:412,height:900},serviceWorkers:'block'});
  const pg=await CTX.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message.slice(0,70)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(/nominatim|geocod/i.test(u)){
      if(o.geoFail) return r.fulfill({status:503,body:''});
      return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify([{display_name:'Machilipatnam, Andhra Pradesh',lat:'16.19',lon:'81.13'}])});}
    if(/cdn\.jsdelivr|supabase-js/.test(u))return r.fulfill({status:200,contentType:'application/javascript',
      body:'window.supabase={createClient:()=>({auth:{getSession:()=>Promise.resolve({data:{session:null}}),setSession:()=>Promise.resolve({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth(){}}})};'});
    if(u.startsWith('http://localhost:8113')){
      if(o.noStrings&&/app-strings/.test(u)) return r.fulfill({status:503,body:''});
      return r.continue();}
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(st=>{localStorage.clear();
    if(st) for(const k in st) localStorage.setItem(k,st[k]);},o.storage||null);
  await pg.goto('http://localhost:8113/index.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(o.wait||1800);
  return {pg,CTX,errs};}

console.log('\n=== index.html · a brand-new visitor ===');
let {pg,CTX,errs}=await boot();
let r=await pg.evaluate(()=>{
  const vis=e=>{if(!e)return false;const b=e.getBoundingClientRect();return b.width>0&&b.height>0;};
  return {step1:vis(document.querySelector('.step.active'))||vis(document.querySelector('#step1')),
    name:!!document.getElementById('userName'),
    overflow:document.body.scrollWidth-document.body.clientWidth,
    blank:(document.body.innerText||'').trim().length<10,
    text:(document.body.innerText||'').replace(/\s+/g,' ').slice(0,70)};});
T('onboarding shows something',!r.blank,'"'+r.text+'"');
T('the name field exists',r.name);
T('no sideways scroll',r.overflow<=2,'overflow '+r.overflow+'px');
T('no uncaught errors',errs.length===0,errs.join('; '));
await CTX.close();

console.log('\n=== THE COORDINATE GUARD — the brand-critical rule ===');
({pg,CTX,errs}=await boot({geoFail:true}));
r=await pg.evaluate(async()=>{
  const out={};
  try{
    document.getElementById('userName').value='Ram';
    const dob=document.getElementById('userDOB'); if(dob) dob.value='1990-05-05';
    const tob=document.getElementById('userTOB'); if(tob) tob.value='06:00';
    const ci=document.getElementById('userCityInput'); if(ci) ci.value='Machilipatnam';
    const hidden=document.getElementById('userCity'); if(hidden) hidden.value='';
    window._selectedCityLat=undefined; window._selectedCityLon=undefined;
    if(typeof saveStep==='function'){ try{ await saveStep(); }catch(e){ out.err=e.message.slice(0,50); } }
    out.user=localStorage.getItem('shubhdin_user')||'(none)';
  }catch(e){ out.threw=e.message.slice(0,60); }
  return out;});
const u=(()=>{try{return JSON.parse(r.user||'{}');}catch(e){return {};}})();
console.log('   stored: city="'+(u.city||'')+'"  lat='+(u.city_lat===undefined?'(none)':u.city_lat));
T('a failed geocode does NOT store a wrong latitude',
  u.city_lat===undefined||u.city_lat===null||u.city_lat==='',
  u.city_lat===undefined?'no coordinates stored — correct':'stored lat '+u.city_lat);
T('no uncaught errors',errs.length===0,errs.join('; '));
await CTX.close();

console.log('\n=== awkward inputs ===');
for(const [label,name] of [['a 200-character name','ఆంధ్ర'.repeat(40)],
                           ['a name with markup','<img src=x onerror=alert(1)>'],
                           ['an empty name','']]){
  ({pg,CTX,errs}=await boot());
  const res=await pg.evaluate(n=>{
    const f=document.getElementById('userName'); if(!f) return {no:true};
    f.value=n; f.dispatchEvent(new Event('input',{bubbles:true}));
    return {overflow:document.body.scrollWidth-document.body.clientWidth,
      injected:/onerror=/i.test(document.body.innerHTML)&&!!document.querySelector('img[onerror]')};},name);
  T(label+' does not break the layout',res.overflow<=2,'overflow '+res.overflow+'px');
  if(name.indexOf('<')>=0) T('   markup is not executed',!res.injected);
  await CTX.close();
}

console.log('\n=== the string layer fails ===');
({pg,CTX,errs}=await boot({noStrings:true}));
r=await pg.evaluate(()=>({blank:(document.body.innerText||'').trim().length<10,
  name:!!document.getElementById('userName')}));
T('onboarding still usable',!r.blank&&r.name);
await CTX.close();

console.log('\n=== small screen ===');
({pg,CTX,errs}=await boot({vp:{width:320,height:640}}));
/* scrollWidth still reports CLIPPED content, so it stays at 340 even when the
   page cannot be dragged. What the user experiences is scrollX after trying.
   Measure that instead — the earlier metric produced a false positive here. */
r=await pg.evaluate(()=>{window.scrollTo(9999,0);
  return {x:window.scrollX, reported:document.body.scrollWidth-document.body.clientWidth};});
T('320px phone cannot be dragged sideways',r.x===0,
  'scrollX='+r.x+' (scrollWidth still reports '+r.reported+'px of clipped content)');
await CTX.close();

console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
