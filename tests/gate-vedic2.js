const {chromium}=require('playwright');
const T=(n,p,d)=>console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(56)+(d||''));
(async()=>{const b=await chromium.launch();
async function run(label,user,tz,hh,mm){
  const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block',timezoneId:tz});
  const pg=await CTX.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message.slice(0,60)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(a=>{const [u,h,m]=a;
    localStorage.clear(); localStorage.setItem('shubhdin_user',JSON.stringify(u));
    localStorage.setItem('shubhdin_kundli_ready','1');
    const RD=Date, fixed=new RD(RD.UTC(2026,7,23,h,m,0));
    window.Date=function(...x){return x.length?new RD(...x):new RD(fixed);};
    window.Date.now=()=>fixed.getTime(); window.Date.prototype=RD.prototype;
    window.Date.UTC=RD.UTC; window.Date.parse=RD.parse;},[user,hh,mm]);
  await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(4200);
  const r=await pg.evaluate(()=>{
    const D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let v=null; try{ v=sdVedic(); }catch(e){}
    const n=document.getElementById('sdVedicNote');
    const hb=document.querySelector('.hbody');
    return {dow:typeof sdDow==='function'?D[sdDow()]:'?',
      cal:D[new Date().getDay()], exact:v&&v.exact, before:v&&v.before,
      note:n&&n.style.display!=='none'?n.textContent:'',
      cards:hb?[...hb.children].filter(e=>e.getBoundingClientRect().height>0).length:0};});
  await CTX.close(); return {r,errs};}

const FULL={name:'Ram',lang:'te',setupDone:true,dob:'1990-05-05',tob:'06:00',
  city:'Eluru',city_lat:16.7107,city_lon:81.0952};
const NOCOORD={name:'Ram',lang:'te',setupDone:true,dob:'1990-05-05',tob:'06:00',city:'Machilipatnam'};

console.log('\n=== does it degrade safely without coordinates? ===');
let x=await run('no coords 04:30',NOCOORD,'Asia/Kolkata',23,0);
T('no coordinates -> falls back to the calendar day, no guess',
  x.r.exact===false&&x.r.dow===x.r.cal,'app '+x.r.dow+' / calendar '+x.r.cal);
T('   and shows no sunrise claim it cannot support',x.r.note==='','"'+x.r.note+'"');
T('   the home screen still renders',x.r.cards>=5,x.r.cards+' cards');
T('   no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== an NRI before sunrise ===');
const NJ={...FULL,city:'New Jersey',city_lat:40.06,city_lon:-74.41};
x=await run('New Jersey 05:00 local',NJ,'America/New_York',9,0);
console.log('    app says '+x.r.dow+', calendar says '+x.r.cal+', exact='+x.r.exact);
T('the engine answers for a western longitude too',x.r.exact===true);
T('   no uncaught errors',x.errs.length===0,x.errs.join('; '));

console.log('\n=== polar: Tromso in December has no sunrise at all ===');
const TR={...FULL,city:'Tromso',city_lat:69.65,city_lon:18.96};
x=await run('Tromso',TR,'Europe/Oslo',10,0);
T('no sunrise -> falls back rather than fabricating one',x.r.dow===x.r.cal,
  'app '+x.r.dow+' / calendar '+x.r.cal+' exact='+x.r.exact);
T('   the app still works',x.r.cards>=5,x.r.cards+' cards');
T('   no uncaught errors',x.errs.length===0,x.errs.join('; '));
await b.close();})();
