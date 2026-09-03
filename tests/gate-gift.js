const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(52)+(d||''));};
(async()=>{const b=await chromium.launch();
async function open(lang,query){
  const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'});
  const pg=await CTX.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message.slice(0,70)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(/cdn\.jsdelivr|supabase-js/.test(u))return r.fulfill({status:200,contentType:'application/javascript',
      body:'window.supabase={createClient:()=>({auth:{getSession:()=>Promise.resolve({data:{session:null}}),setSession:()=>Promise.resolve({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth(){}}})};'});
    if(u.startsWith('http://localhost:8113'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(l=>{localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:l,setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));},lang);
  await pg.goto('http://localhost:8113/kundli.html'+(query||''),{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(2400);
  return {pg,CTX,errs};}

console.log('\n=== the gift button on the ready screen ===');
let {pg,CTX,errs}=await open('te');
let r=await pg.evaluate(()=>{
  show('stReady');
  const btn=document.getElementById('rdGift');
  return {exists:!!btn, label:btn?btn.textContent.trim():'',
    visible:btn?btn.getBoundingClientRect().height>0:false,
    text:sdGiftText()};});
T('the button exists and is visible',r.exists&&r.visible);
T('its label is in Telugu',/కుటుంబ/.test(r.label),'"'+r.label+'"');
T('the invite carries the referral tag',/src=kundli_share/.test(r.text));
console.log('\n  the Telugu invite:');
r.text.split('\n').forEach(l=>console.log('   | '+l));

console.log('\n=== it must NOT leak anything personal ===');
T('no name in the message',!/Ram/.test(r.text));
T('no birth date',!/1990|05-05/.test(r.text));
T('no city',!/Eluru/.test(r.text));
T('no chart, rashi or dosha wording',!/rashi|dosha|nakshatra|కుండలి నా జాతకం/i.test(r.text.replace(/జన్మ కుండలి/g,'')));
await CTX.close();

console.log('\n=== all nine languages ===');
let bad=[];
for(const l of ['en','hi','te','kn','ta','bn','mr','gu','as']){
  const o=await open(l);
  const x=await o.pg.evaluate(()=>{show('stReady');
    return {label:document.getElementById('rdGiftTxt').textContent.trim(), text:sdGiftText()};});
  if(!x.label||!x.text||x.text.indexOf('src=kundli_share')<0) bad.push(l);
  if(o.errs.length) bad.push(l+' errors');
  await o.CTX.close();
}
T('every language has a label and a tagged invite',bad.length===0,bad.join(', ')||'9/9');

console.log('\n=== the referral tag is actually recorded ===');
({pg,CTX,errs}=await open('en','?src=kundli_share'));
r=await pg.evaluate(()=>{
  sdTrack('probe',{n:1});
  const q=JSON.parse(localStorage.getItem('sd_evq')||'[]');
  return {stored:localStorage.getItem('sd_src'),
    onEvent:(q.find(e=>e.event==='probe')||{props:{}}).props.src};});
T('?src is captured on arrival',r.stored==='kundli_share',String(r.stored));
T('and stamped on every event afterwards',r.onEvent==='kundli_share',String(r.onEvent));
await CTX.close();
({pg,CTX,errs}=await open('en'));
r=await pg.evaluate(()=>{sdTrack('probe',{n:1});
  return (JSON.parse(localStorage.getItem('sd_evq')||'[]').find(e=>e.event==='probe')||{props:{}}).props.src;});
T('a normal visit carries no src',!r,String(r));
T('no uncaught errors',errs.length===0,errs.join('; '));
await CTX.close();
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
