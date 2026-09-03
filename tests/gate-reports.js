const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(52)+(d||''));};
(async()=>{const b=await chromium.launch();
async function boot(o){
  o=o||{};
  const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'});
  const pg=await CTX.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message.slice(0,70)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(/\/api\//.test(u))return r.fulfill({status:o.apiDown?503:200,contentType:'application/json',
      body:JSON.stringify(o.api||{ok:true,orders:[]})});
    if(/cdn\.jsdelivr|supabase-js/.test(u)){
      if(o.noSupabase) return r.fulfill({status:503,body:''});
      return r.fulfill({status:200,contentType:'application/javascript',
        body:'window.supabase={createClient:()=>({auth:{getSession:()=>Promise.resolve({data:{session:null}}),setSession:()=>Promise.resolve({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth(){}}})};'});}
    if(u.startsWith('http://localhost:8113')){
      if(o.noStrings&&/app-strings/.test(u)) return r.fulfill({status:503,body:''});
      return r.continue();}
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(st=>{localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:'te',setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
    if(st) localStorage.setItem('sd_owned_reports',st);},o.owned);
  await pg.goto('http://localhost:8113/reports.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(2400);
  const r=await pg.evaluate(()=>{
    const body=document.body;
    return {text:(body.innerText||'').replace(/\s+/g,' ').trim().slice(0,120),
      overflow:body.scrollWidth-body.clientWidth,
      rendered:typeof render==='function',
      authRan:typeof absorbHash==='function',
      blank:(body.innerText||'').trim().length<8};});
  await CTX.close(); return {r,errs};}

const OWNED=JSON.stringify([{report:'marriage',lang:'te',order_code:'SD-AB12'},
                            {report:'career',lang:'te',order_code:'SD-CD34'}]);

console.log('\n=== reports.html · a buyer with two reports ===');
let x=await boot({owned:OWNED});
T('the page is not blank',!x.r.blank,'"'+x.r.text.slice(0,58)+'"');
T('render() and the auth chain both exist',x.r.rendered&&x.r.authRan);
T('no sideways scroll',x.r.overflow<=2,'overflow '+x.r.overflow+'px');
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== a buyer whose owned list is corrupt ===');
x=await boot({owned:'{{{BROKEN'});
T('the page still renders something',!x.r.blank,'"'+x.r.text.slice(0,58)+'"');
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== the Supabase CDN is blocked ===');
x=await boot({owned:OWNED,noSupabase:true});
T('a paying customer can still see the page',!x.r.blank,'"'+x.r.text.slice(0,58)+'"');
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== the API is down (503) ===');
x=await boot({owned:OWNED,apiDown:true});
T('the page does not go blank when the server fails',!x.r.blank,'"'+x.r.text.slice(0,58)+'"');

console.log('\n=== the string layer fails ===');
x=await boot({owned:OWNED,noStrings:true});
T('the page still renders',!x.r.blank,'"'+x.r.text.slice(0,58)+'"');
T('render() still ran (line 516 is unguarded)',x.r.rendered);

console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
