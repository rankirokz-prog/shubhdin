/* The money path, end to end and IN SEQUENCE.
   Every mode has been tested alone; none has been tested as a journey.
   A buyer walks: create -> pay -> confirm -> admin approves -> delivered.
   State that survives between steps is where the bugs live. */
const fs=require('fs');
const src=fs.readFileSync('/home/claude/build/order.js','utf8').replace(/module\.exports\s*=/,'globalThis.__h=');
process.env.SUPABASE_URL='https://x.supabase.co';
process.env.SUPABASE_SERVICE_KEY='svc';
process.env.SD_ADMIN_UIDS='admin-1';
process.env.RZP_KEY_ID='rzp_test';
process.env.RZP_KEY_SECRET='secret';
delete process.env.SD_DEV_FREE;

const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(54)+(d||''));};

/* a fake world: one orders table, one Razorpay, one storage bucket */
let DB=[];                       // orders
let PAY={};                      // payment_id -> {status, amount, notes}
let PDFS={};                     // 'uid/report.lang.pdf' -> true
let LINKS=[];

globalThis.fetch=async(url,opt)=>{
  opt=opt||{}; const body=opt.body?JSON.parse(opt.body):null;
  const J=(o,ok=true,st=200)=>({ok,status:st,headers:{get:()=>null},json:async()=>o,text:async()=>JSON.stringify(o)});

  if(url.includes('/auth/v1/user')){
    const t=(opt.headers&&opt.headers.Authorization||'').replace('Bearer ','');
    return J(t?{id:t}:{});
  }
  if(url.includes('api.razorpay.com/v1/payment_links')){
    LINKS.push(body); return J({short_url:'https://rzp.io/l/'+LINKS.length,id:'plink_'+LINKS.length});
  }
  if(url.includes('api.razorpay.com/v1/payments/')){
    const id=decodeURIComponent(url.split('/payments/')[1]);
    return PAY[id]?J(PAY[id]):J({error:{description:'not found'}},false,404);
  }
  if(url.includes('/storage/v1/')){
    /* the real path shape, read from pdfPath(): reports/{uid}/{report}-{lang}.pdf
       My first mock invented a different shape and produced a false failure. */
    const k=Object.keys(PDFS).find(k=>url.endsWith(k));
    return k?{ok:true,status:200,headers:{get:()=>'120000'},json:async()=>({}),text:async()=>''}
            :{ok:false,status:404,headers:{get:()=>null},json:async()=>({}),text:async()=>''};
  }
  if(url.includes('/rest/v1/orders')){
    if(opt.method==='POST'){
      const rows=Array.isArray(body)?body:[body];
      rows.forEach(r=>{
        const i=DB.findIndex(x=>x.uid===r.uid&&x.report===r.report);
        if(i>=0) DB[i]=Object.assign({},DB[i],r); else DB.push(Object.assign({},r));
      });
      return J(rows);
    }
    if(opt.method==='PATCH'){
      const m=url.match(/uid=eq\.([^&]+)/), r2=url.match(/report=eq\.([^&]+)/);
      DB.forEach(x=>{ if(x.uid===decodeURIComponent(m?m[1]:'')&&x.report===decodeURIComponent(r2?r2[1]:''))
        Object.assign(x,body); });
      return J([]);
    }
    const m=url.match(/uid=eq\.([^&]+)/);
    let rows=DB.slice();
    if(m) rows=rows.filter(x=>x.uid===decodeURIComponent(m[1]));
    const st=url.match(/dispatch_status=eq\.([^&]+)/);
    if(st) rows=rows.filter(x=>x.dispatch_status===decodeURIComponent(st[1]));
    return J(rows);
  }
  if(url.includes('/rest/v1/')) return J([]);
  return J({});
};
eval(src);

const call=(m,q,b)=>new Promise(d=>{
  const r={setHeader(){},status(c){this._c=c;return this;},
    json(o){d({code:this._c||200,body:o});},end(){d({code:this._c||200,body:null});}};
  __h({method:m,query:q||{},body:b||{},headers:{}},r);
});

(async()=>{
const BUYER='buyer-9', REPORT='marriage';

console.log('\n=== STEP 1 · the buyer asks for a payment link ===');
let r=await call('POST',{create:'1',uid:BUYER,report:REPORT,access_token:BUYER,
  phone:'9492624340',lang:'te'},{});
T('a link is minted',r.code===200&&(r.body.url||r.body.short_url),JSON.stringify(r.body).slice(0,70));
/* create() deliberately writes NOTHING — a row appears only once a payment
   confirms, so an abandoned checkout leaves no phantom order. Verified by
   reading the handler, not assumed. */
T('no order row is created before payment (no phantom orders)',DB.length===0,
  DB.length+' rows');
T('the amount came from OUR price map, not the client',
  LINKS[0]&&LINKS[0].amount===399*100,'amount '+(LINKS[0]&&LINKS[0].amount));

console.log('\n=== STEP 2 · confirm BEFORE any payment exists ===');
r=await call('GET',{confirm:'1',uid:BUYER,report:REPORT,payment_id:'pay_nope',access_token:BUYER});
T('an unknown payment id is refused',r.code>=400,'HTTP '+r.code+' '+JSON.stringify(r.body).slice(0,50));
T('still no paid order',!DB.find(x=>x.status==='paid'),DB.length+' rows');

console.log('\n=== STEP 3 · a real payment, confirmed ===');
/* the link carried the delivery address into the notes at create time */
T('the payment link carries phone and language in its notes',
  LINKS[0]&&LINKS[0].notes&&LINKS[0].notes.phone&&LINKS[0].notes.lang==='te',
  JSON.stringify(LINKS[0]&&LINKS[0].notes));
PAY['pay_ok']={id:'pay_ok',status:'captured',amount:399*100,
  notes:(LINKS[0]&&LINKS[0].notes)||{uid:BUYER,report:REPORT}};
r=await call('GET',{confirm:'1',uid:BUYER,report:REPORT,payment_id:'pay_ok',access_token:BUYER});
T('the payment confirms',r.code===200,JSON.stringify(r.body).slice(0,70));
const o1=DB.find(x=>x.report===REPORT)||{};
T('the order is now paid',o1.status==='paid','status='+o1.status);
T('the buyer\u2019s LANGUAGE reached the order',o1.lang==='te','lang='+o1.lang);
T('the buyer\u2019s PHONE reached the order',!!o1.phone,'phone='+(o1.phone||'(none)'));
T('it enters the dispatch gate as pending',
  o1.dispatch_status==='pending'||!o1.dispatch_status,
  'dispatch_status='+o1.dispatch_status);

console.log('\n=== STEP 4 · THE GATE — is the PDF withheld before approval? ===');
PDFS['reports/'+BUYER+'/'+REPORT+'-te.pdf']=true;   // the Telugu render exists
r=await call('GET',{list:'1',uid:BUYER,access_token:BUYER});
const pick=b=>((b&&(b.reports||b.orders||(Array.isArray(b)?b:[])))||[])[0]||{};
let row=pick(r.body);
console.log('   list returned: '+JSON.stringify(row).slice(0,150));
T('the buyer sees the order',!!row.report,'report='+row.report);
T('the PDF is WITHHELD until an admin approves',!row.pdf_url,
  row.pdf_url?('LEAKED: '+row.pdf_url):'no pdf_url — gate holding');

console.log('\n=== STEP 5 · a stranger tries to read this order ===');
r=await call('GET',{list:'1',uid:BUYER,access_token:'someone-else'});
T('a forged token cannot read another buyer\u2019s order',r.code>=400,'HTTP '+r.code);

console.log('\n=== STEP 6 · a non-admin tries to approve ===');
r=await call('POST',{dispatch_set:'1'},{admin_uid:BUYER,access_token:BUYER,
  uid:BUYER,report:REPORT,dispatch_status:'approved'});
T('a buyer cannot approve their own order',r.code===403,'HTTP '+r.code);
T('it is still pending',(DB.find(x=>x.report===REPORT)||{}).dispatch_status!=='approved',
  'dispatch_status='+(DB.find(x=>x.report===REPORT)||{}).dispatch_status);

console.log('\n=== STEP 7 · the admin approves ===');
r=await call('POST',{dispatch_set:'1'},{admin_uid:'admin-1',access_token:'admin-1',
  uid:BUYER,report:REPORT,dispatch_status:'approved'});
T('the admin can approve',r.code===200,'HTTP '+r.code);
T('the order is approved',(DB.find(x=>x.report===REPORT)||{}).dispatch_status==='approved',
  'dispatch_status='+(DB.find(x=>x.report===REPORT)||{}).dispatch_status);

console.log('\n=== STEP 8 · now the buyer should get their PDF ===');
/* THE GATE HAS TWO STAGES, and I had assumed one. 'approved' means Ram has
   checked it; 'sent' means he has actually delivered it on WhatsApp. The PDF
   is released only at 'sent'. Assert both halves. */
r=await call('GET',{list:'1',uid:BUYER,access_token:BUYER});
row=pick(r.body);
T('approved alone still WITHHOLDS the PDF',!row.pdf_url,
  row.pdf_url?('LEAKED at approved: '+row.pdf_url):'still withheld — correct');
r=await call('POST',{dispatch_set:'1'},{admin_uid:'admin-1',access_token:'admin-1',
  uid:BUYER,report:REPORT,dispatch_status:'sent'});
T('the admin can mark it sent',r.code===200,'HTTP '+r.code);
r=await call('GET',{list:'1',uid:BUYER,access_token:BUYER});
row=pick(r.body);
T('NOW the PDF is delivered',!!row.pdf_url,(row.pdf_url||JSON.stringify(row)).slice(0,90));
T('the delivered file is the buyer\u2019s own language',
  !row.pdf_url||/\.te\.pdf|marriage-te/.test(row.pdf_url+JSON.stringify(row)),
  'lang='+row.lang);

console.log('\n=== STEP 8b · a NULL dispatch status must not open the gate ===');
DB.forEach(x=>{ if(x.report===REPORT) delete x.dispatch_status; });
r=await call('GET',{list:'1',uid:BUYER,access_token:BUYER});
row=pick(r.body);
T('a missing dispatch_status is treated as pending, not sent',!row.pdf_url,
  'dispatch_status reported as "'+row.dispatch_status+'"');
DB.forEach(x=>{ if(x.report===REPORT) x.dispatch_status='sent'; });

console.log('\n=== STEP 8c · the WRONG-LANGUAGE PDF must be withheld ===');
delete PDFS['reports/'+BUYER+'/'+REPORT+'-te.pdf'];
PDFS['reports/'+BUYER+'/'+REPORT+'-en.pdf']=true;  // only an English render exists
r=await call('GET',{list:'1',uid:BUYER,access_token:BUYER});
row=pick(r.body);
T('an English PDF is NOT handed to a Telugu buyer',!row.pdf_url,
  row.pdf_url?('LEAKED: '+row.pdf_url):'withheld, flagged as '+row.pdf_lang_mismatch);
PDFS['reports/'+BUYER+'/'+REPORT+'-te.pdf']=true;

console.log('\n=== STEP 9 · double-spend — confirm the SAME payment twice ===');
const before=DB.length;
r=await call('GET',{confirm:'1',uid:BUYER,report:REPORT,payment_id:'pay_ok',access_token:BUYER});
T('re-confirming does not create a second order',DB.length===before,DB.length+' rows');
T('and does not reset the dispatch state',
  (DB.find(x=>x.report===REPORT)||{}).dispatch_status==='sent',
  'dispatch_status='+(DB.find(x=>x.report===REPORT)||{}).dispatch_status);

console.log('\n=== STEP 10 · paying for one report must not unlock another ===');
PAY['pay_two']={id:'pay_two',status:'captured',amount:199*100,notes:{uid:BUYER,report:'career'}};
r=await call('GET',{confirm:'1',uid:BUYER,report:'career',payment_id:'pay_two',access_token:BUYER});
const career=DB.find(x=>x.report==='career');
T('the second report is its own order',!!career,'rows now '+DB.length);
T('   and it starts UNAPPROVED',career&&career.dispatch_status!=='approved',
  career?('dispatch_status='+career.dispatch_status):'');
T('   the first report keeps its own state',
  DB.find(x=>x.report===REPORT).dispatch_status==='sent',
  'dispatch_status='+DB.find(x=>x.report===REPORT).dispatch_status);

console.log('\n=== STEP 10b · THE BUYER WHO PAYS AND CLOSES THE TAB ===');
{
  DB=[]; LINKS=[];
  const B2='buyer-closed';
  await call('POST',{create:'1',uid:B2,report:'love',access_token:B2,
    phone:'9876543210',lang:'bn'},{});
  const notes=(LINKS[0]||{}).notes||{};
  /* the webhook path: no browser involved at all, ever */
  PAY['pay_web']={id:'pay_web',status:'captured',amount:199*100,notes:notes};
  await call('GET',{confirm:'1',uid:B2,report:'love',payment_id:'pay_web',access_token:B2});
  const row=DB.find(x=>x.report==='love')||{};
  T('their order is paid',row.status==='paid','status='+row.status);
  T('and it KNOWS THEIR PHONE even though they never came back',
    !!row.phone,'phone='+(row.phone||'(none) — cannot be delivered'));
  T('and their language, so the right PDF is looked for',row.lang==='bn',
    'lang='+row.lang+(row.lang==='hi'?'  <- would search for a .hi.pdf':''));
}

console.log('\n=== STEP 11 · a ₹199 payment must not buy the ₹399 report ===');
DB=[];
PAY['pay_cheap']={id:'pay_cheap',status:'captured',amount:199*100,
  notes:{uid:'buyer-x',report:'marriage'}};
r=await call('GET',{confirm:'1',uid:'buyer-x',report:'marriage',payment_id:'pay_cheap',access_token:'buyer-x'});
const cheap=DB.find(x=>x.report==='marriage');
T('an underpayment does not unlock the expensive report',
  !cheap||cheap.status!=='paid', cheap?('status='+cheap.status+' amount='+cheap.amount):'not recorded');

console.log('\n=== STEP 12 · a payment that FAILED at Razorpay ===');
DB=[];
PAY['pay_failed']={id:'pay_failed',status:'failed',amount:399*100,notes:{uid:'buyer-y',report:'marriage'}};
r=await call('GET',{confirm:'1',uid:'buyer-y',report:'marriage',payment_id:'pay_failed',access_token:'buyer-y'});
T('a failed payment is not recorded as paid',
  !DB.find(x=>x.status==='paid'),'HTTP '+r.code+' rows='+DB.length);

console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' PROBLEM(S):\n   - '+F.join('\n   - '):'  the money path holds end to end');
})();
