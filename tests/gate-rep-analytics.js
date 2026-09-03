const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(50)+(d||''));};
(async()=>{const b=await chromium.launch();
let posted=[];
const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'});
const pg=await CTX.newPage();
pg.on('pageerror',e=>console.log('   [err] '+e.message.slice(0,60)));
await pg.route('**/*',r=>{const u=r.request().url();
  if(/rest\/v1\/events/.test(u)){try{posted.push(...JSON.parse(r.request().postData()||'[]'));}catch(e){}
    return r.fulfill({status:201,body:''});}
  if(/\/api\//.test(u))return r.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"orders":[]}'});
  if(/cdn\.jsdelivr|supabase-js/.test(u))return r.fulfill({status:200,contentType:'application/javascript',
    body:'window.supabase={createClient:()=>({auth:{getSession:()=>Promise.resolve({data:{session:null}}),setSession:()=>Promise.resolve({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth(){}}})};'});
  if(u.startsWith('http://localhost:8113'))return r.continue();
  if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
  return r.fulfill({status:404,body:''});});
await pg.addInitScript(()=>{localStorage.clear();
  localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:'te',setupDone:true,dob:'1990-05-05'}));
  localStorage.setItem('sd_owned_reports',JSON.stringify([{report:'marriage',lang:'te',order_code:'SD-AB12'}]));});
await pg.goto('http://localhost:8113/reports.html',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(2400);

console.log('\n=== reports.html analytics ===');
let q=await pg.evaluate(()=>JSON.parse(localStorage.getItem('sd_evq')||'[]'));
T('analytics loaded on the page',await pg.evaluate(()=>typeof sdTrack==='function'));
T('a page view is recorded',q.some(e=>e.event==='reports_view'),
  JSON.stringify((q.find(e=>e.event==='reports_view')||{}).props));
T('the catalog failure is reported as an error',q.some(e=>e.event==='js_error'),
  (q.find(e=>e.event==='js_error')||{props:{}}).props.msg||'');
q=await pg.evaluate(()=>{localStorage.removeItem('sd_evq');
  try{ openPdf('marriage','https://example.com/x.pdf'); }catch(e){}
  try{ viewOnScreen('career'); }catch(e){}
  return JSON.parse(localStorage.getItem('sd_evq')||'[]').map(e=>e.event+':'+(e.props.report||''));});
T('opening a PDF is recorded',q.some(x=>x.indexOf('report_delivered:marriage')===0),q.join(', '));
T('viewing on screen is recorded',q.some(x=>x.indexOf('report_open:career')===0),q.join(', '));
T('no personal data in any event',!/1990-05-05|Ram|SD-AB12/.test(JSON.stringify(q)+JSON.stringify(posted)));
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
