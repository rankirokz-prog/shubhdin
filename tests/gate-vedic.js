const {chromium}=require('playwright');
const T=(n,p,d)=>console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(52)+(d||''));
(async()=>{const b=await chromium.launch();
async function at(hh,mm,label){
  const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block',timezoneId:'Asia/Kolkata'});
  const pg=await CTX.newPage();
  pg.on('pageerror',e=>console.log('   [page error] '+e.message.slice(0,70)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(a=>{const [h,m]=a;
    localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:'te',setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
    localStorage.setItem('shubhdin_kundli_ready','1');
    /* Sunday 23 Aug 2026 at the given IST clock time */
    const RD=Date, fx=new RD(RD.UTC(2026,7,23,h-5,m-30)+ (m<30?0:0));
    const fixed=new RD(RD.UTC(2026,7,23,h,m,0)-5.5*3600000);
    window.Date=function(...x){return x.length?new RD(...x):new RD(fixed);};
    window.Date.now=()=>fixed.getTime(); window.Date.prototype=RD.prototype;
    window.Date.UTC=RD.UTC; window.Date.parse=RD.parse;},[hh,mm]);
  await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(4200);
  const r=await pg.evaluate(()=>{
    const v=(typeof sdVedic==='function')?sdVedic():null;
    const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const note=document.getElementById('sdVedicNote');
    let mantra=''; try{ mantra=(MANTRA_WORDS[sdDow()]||[]).join(' ').slice(0,28); }catch(e){}
    return {dow:typeof sdDow==='function'?sdDow():null,
      day:DAYS[typeof sdDow==='function'?sdDow():0],
      before:v&&v.before, exact:v&&v.exact,
      changesAt:v&&v.changesAt?new Date(v.changesAt).toISOString():null,
      noteShown:!!(note&&note.style.display!=='none'&&note.textContent),
      noteText:note?note.textContent:'',
      calendarDay:DAYS[new Date().getDay()], mantra:mantra};});
  await CTX.close(); return r;}

console.log('\n=== Sunday 23 Aug 2026, Eluru — sunrise is 05:50:51 IST ===');
const early=await at(4,30);
console.log('\n  at 04:30 (brahma muhurta):');
console.log('    calendar says : '+early.calendarDay);
console.log('    app says      : '+early.day);
console.log('    notice        : "'+early.noteText+'"');
console.log('    mantra        : '+early.mantra);
T('before sunrise the app follows the VEDIC day',early.day==='Saturday',early.day);
T('it knows it is before sunrise',early.before===true);
T('sunrise was computed from the engine, not guessed',early.exact===true);
T('the notice is shown',early.noteShown);
T('the notice names the sunrise time',/05:50/.test(early.noteText),early.noteText);
T('the mantra is Shani\u2019s, not Surya\u2019s',/शनै|शं/.test(early.mantra),early.mantra);

const late=await at(9,0);
console.log('\n  at 09:00 (after sunrise):');
console.log('    app says      : '+late.day);
T('after sunrise it is Sunday again',late.day==='Sunday',late.day);
T('the notice is gone',!late.noteShown);
T('the mantra is Surya\u2019s',/सूर्याय|नमः सूर्याय/.test(late.mantra),late.mantra);

const edge=await at(5,49);
T('a minute before sunrise (05:49) is still Saturday',edge.day==='Saturday',edge.day);
const edge2=await at(5,52);
T('a minute after sunrise (05:52) is Sunday',edge2.day==='Sunday',edge2.day);
await b.close();})();
