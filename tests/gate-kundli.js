const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(50)+(d||''));};
(async()=>{const b=await chromium.launch();
async function boot(opts){
  opts=opts||{};
  const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'});
  const pg=await CTX.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message.slice(0,70)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(/cdn\.jsdelivr|supabase-js/.test(u)){
      if(opts.noSupabase) return r.fulfill({status:503,body:''});
      return r.fulfill({status:200,contentType:'application/javascript',
        body:'window.supabase={createClient:()=>({auth:{getSession:()=>Promise.resolve({data:{session:null}}),setSession:()=>Promise.resolve({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth(){}}})};'});}
    if(u.startsWith('http://localhost:8113')){
      if(opts.noStrings&&/app-strings/.test(u)) return r.fulfill({status:503,body:''});
      return r.continue();}
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(()=>{localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:'te',setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));});
  await pg.goto('http://localhost:8113/kundli.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(2600);
  const r=await pg.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const vis=e=>{ if(!e) return false; const b=e.getBoundingClientRect(); return b.width>0&&b.height>0; };
    return {
      form:vis(q('#fName'))||vis(q('input[type=text]')),
      nameField:!!q('#fName'), submit:!!q('#btnGen')||!!q('button'),
      pdfVar:typeof PDF_URL, bootRan:typeof absorbHashTokens==='function',
      labelsSet:(q('#hTitle')||{}).textContent||'',
      overflow:document.body.scrollWidth-document.body.clientWidth,
      fnCount:['sdLangOptions','dlog','sbAuth'].filter(f=>typeof window[f]==='function').length};});
  await CTX.close(); return {r,errs};}

console.log('\n=== kundli.html · normal ===');
let x=await boot();
T('the form renders',x.r.form,'name field: '+x.r.nameField);
T('labels are set',!!x.r.labelsSet,'"'+x.r.labelsSet.slice(0,34)+'"');
T('the boot logic below line 226 ran',x.r.bootRan);
T('PDF_URL declared (line 465)',x.r.pdfVar!=='undefined',x.r.pdfVar);
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== the Supabase CDN is blocked (weak connection) ===');
x=await boot({noSupabase:true});
T('the form still renders',x.r.form);
T('the boot logic still ran',x.r.bootRan);
T('no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== THE STRING LAYER FAILS — line 226 is unguarded ===');
x=await boot({noStrings:true});
T('the form still renders',x.r.form,'name field: '+x.r.nameField);
T('the boot logic below line 226 still ran',x.r.bootRan,
  x.r.bootRan?'':'<- everything after line 226 is DEAD');
T('PDF_URL still declared',x.r.pdfVar!=='undefined',x.r.pdfVar);
console.log('   errors: '+(x.errs.join('; ')||'none'));
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
