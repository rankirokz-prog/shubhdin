/* dispatch.html is the only page that can release a PDF to a buyer, and the
   only one Ram personally operates. A mistake here flows through every order
   before anyone notices. */
const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(56)+(d||''));};

const ORDERS=[
 /* clean: everything green, should be approvable */
 {uid:'u-aaa',report:'marriage',order_code:'SD-AAA111',status:'paid',lang:'te',amount:399,
  payment_id:'pay_a',phone:'919492624340',dispatch_status:'pending',
  created_at:new Date(Date.now()-3600000).toISOString(),
  pdf_url:'https://x/reports/u-aaa/marriage-te.pdf',pdf_bytes:900000,pdf_lang_scoped:true},
 /* WRONG LANGUAGE on disk — must be blocked */
 {uid:'u-bbb',report:'career',order_code:'SD-BBB222',status:'paid',lang:'bn',amount:199,
  payment_id:'pay_b',phone:'919876543210',dispatch_status:'pending',
  created_at:new Date(Date.now()-3600000).toISOString(),
  pdf_url:'https://x/reports/u-bbb/career-en.pdf',pdf_bytes:900000,
  pdf_lang_scoped:false,pdf_found_lang:'en'},
 /* NO PHONE — cannot be delivered */
 {uid:'u-ccc',report:'love',order_code:'SD-CCC333',status:'paid',lang:'hi',amount:199,
  payment_id:'pay_c',phone:null,dispatch_status:'pending',
  created_at:new Date(Date.now()-40*3600000).toISOString(),        // also stale
  pdf_url:'https://x/reports/u-ccc/love-hi.pdf',pdf_bytes:900000,pdf_lang_scoped:true},
 /* SUSPICIOUSLY SMALL pdf — a blank render */
 {uid:'u-ddd',report:'child',order_code:'SD-DDD444',status:'paid',lang:'te',amount:199,
  payment_id:'pay_d',phone:'919000000000',dispatch_status:'pending',
  created_at:new Date(Date.now()-3600000).toISOString(),
  pdf_url:'https://x/reports/u-ddd/child-te.pdf',pdf_bytes:4000,pdf_lang_scoped:true},
];

(async()=>{const b=await chromium.launch();
let CALLS=[];
async function board(o){
  o=o||{};
  const CTX=await b.newContext({viewport:{width:412,height:1000},serviceWorkers:'block'});
  const pg=await CTX.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message.slice(0,70)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(/\/api\/order/.test(u)){
      if(r.request().method()==='POST'){
        try{CALLS.push(JSON.parse(r.request().postData()||'{}'));}catch(e){}
        return r.fulfill({status:o.writeFails?500:200,contentType:'application/json',
          body:JSON.stringify(o.writeFails?{error:'write failed'}:{ok:true})});}
      if(/dispatch=1/.test(u))
        return r.fulfill({status:o.notAdmin?403:200,contentType:'application/json',
          body:JSON.stringify(o.notAdmin?{error:'admin only'}:{ok:true,orders:ORDERS})});
      return r.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"leads":[]}'});}
    if(/cdn\.jsdelivr|supabase-js/.test(u))return r.fulfill({status:200,contentType:'application/javascript',
      body:'window.supabase={createClient:()=>({auth:{getSession:()=>Promise.resolve({data:{session:{user:{id:"admin-1"},access_token:"tok"}}}),setSession:()=>Promise.resolve({}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth(){}}})};'});
    if(u.startsWith('http://localhost:8113'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.goto('http://localhost:8113/dispatch.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(2600);
  return {pg,CTX,errs};}

const approveBtns=pg=>pg.evaluate(()=>[...document.querySelectorAll('button')]
  .filter(e=>/approveSend\(/.test(e.getAttribute('onclick')||''))
  .map(e=>({key:(e.getAttribute('onclick')||'').replace(/.*\('|'\).*/g,''),
            disabled:e.disabled,title:e.title||''})));

console.log('\n=== 1 · the board loads ===');
let {pg,CTX,errs}=await board();
let r=await pg.evaluate(()=>({
  codes:['SD-AAA111','SD-BBB222','SD-CCC333','SD-DDD444']
    .filter(c=>(document.body.innerText||'').includes(c)),
  overflow:document.body.scrollWidth-document.body.clientWidth}));
T('all four orders are shown',r.codes.length===4,r.codes.join(', '));
T('no sideways scroll',r.overflow<=2,'overflow '+r.overflow+'px');
T('no uncaught errors',errs.length===0,errs.join('; '));

console.log('\n=== 2 · THE GATE — which orders can be approved? ===');
let btns=await approveBtns(pg);
btns.forEach(x=>console.log('   '+x.key.padEnd(22)+(x.disabled?'DISABLED  '+x.title:'enabled')));
const by=k=>btns.find(x=>x.key.indexOf(k)===0)||{};
T('the clean order CAN be approved',by('u-aaa').disabled===false);
T('the WRONG-LANGUAGE order is BLOCKED',by('u-bbb').disabled===true,
  by('u-bbb').disabled?'cannot send an English PDF to a Bengali buyer':'*** approvable ***');
T('the NO-PHONE order is BLOCKED',by('u-ccc').disabled===true,
  by('u-ccc').disabled?'nowhere to send it':'*** approvable ***');
T('the TINY-PDF order is BLOCKED',by('u-ddd').disabled===true,
  by('u-ddd').disabled?'4KB is a blank render':'*** approvable ***');

console.log('\n=== 3 · is the reason on screen, not just in a tooltip? ===');
r=await pg.evaluate(()=>{
  const t=document.body.innerText||'';
  const i=t.indexOf('SD-BBB222');
  return t.slice(Math.max(0,i-60),i+330).replace(/\s+/g,' ');});
console.log('   '+r.slice(0,230));
T('the wrong-language card says so in words',/WRONG LANGUAGE/i.test(r));
T('   and tells Ram what to do about it',/reopen|re-render|renders/i.test(r));

console.log('\n=== 4 · the stale order is flagged against the 48h promise ===');
r=await pg.evaluate(()=>{const t=document.body.innerText||'';
  const i=t.indexOf('SD-CCC333');
  return t.slice(Math.max(0,i-120),i+120).replace(/\s+/g,' ');});
T('a 40-hour-old order is visibly marked',/stale|⏰|late|hour|h\b/i.test(r),r.slice(0,90));
await CTX.close();

console.log('\n=== 5 · approving hits exactly one, and the right one ===');
({pg,CTX,errs}=await board());
CALLS=[];
await pg.evaluate(()=>{
  const b=[...document.querySelectorAll('button')]
    .filter(e=>/approveSend\(/.test(e.getAttribute('onclick')||'')&&!e.disabled)[0];
  if(b) b.click();});
await pg.waitForTimeout(900);
T('exactly one write',CALLS.length===1,CALLS.length+' write(s)');
if(CALLS.length) T('   and it names the order that was tapped',
  CALLS[0].uid==='u-aaa'&&CALLS[0].report==='marriage',
  CALLS[0].uid+'/'+CALLS[0].report+' → '+CALLS[0].dispatch_status);
await CTX.close();

console.log('\n=== 6 · three fast taps (a slow connection) ===');
({pg,CTX,errs}=await board());
CALLS=[];
await pg.evaluate(()=>{
  const b=[...document.querySelectorAll('button')]
    .filter(e=>/approveSend\(/.test(e.getAttribute('onclick')||'')&&!e.disabled)[0];
  if(b){ b.click(); b.click(); b.click(); }});
await pg.waitForTimeout(1100);
T('three taps do not send three writes',CALLS.length<=1,CALLS.length+' write(s)');
await CTX.close();

console.log('\n=== 7 · a non-admin opens the board ===');
({pg,CTX,errs}=await board({notAdmin:true}));
r=await pg.evaluate(()=>{const t=document.body.innerText||'';
  return {leaked:['SD-AAA111','919492624340','u-aaa','marriage'].filter(x=>t.includes(x)),
    shows:t.replace(/\s+/g,' ').slice(0,120)};});
T('NO buyer data reaches a non-admin',r.leaked.length===0,
  r.leaked.length?('LEAKED: '+r.leaked.join(', ')):'nothing leaked');
T('   and the screen explains why',/admin|denied|⛔/i.test(r.shows),r.shows.slice(0,70));
await CTX.close();

console.log('\n=== 8 · the server refuses the write ===');
({pg,CTX,errs}=await board({writeFails:true}));
r=await pg.evaluate(async()=>{
  const b=[...document.querySelectorAll('button')]
    .filter(e=>/approveSend\(/.test(e.getAttribute('onclick')||'')&&!e.disabled)[0];
  if(!b) return {none:true};
  b.click(); await new Promise(r=>setTimeout(r,1200));
  const t=document.body.innerText||'';
  return {stillPending:/pending/i.test(t), text:t.replace(/\s+/g,' ').slice(0,120)};});
T('a refused write does not look like success',
  r.none||r.stillPending!==false,'the board must not show "sent" when the server said no');
await CTX.close();

console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' finding(s):\n   - '+F.join('\n   - '):'  the dispatch board holds');
await b.close();})();
