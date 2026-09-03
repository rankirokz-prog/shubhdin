const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(46)+(d||''));};
(async()=>{const b=await chromium.launch();
const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'});
async function look(lang){
  const pg=await CTX.newPage();
  pg.on('pageerror',e=>console.log('   [err] '+e.message.slice(0,60)));
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(l=>{localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:l,setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
    localStorage.setItem('shubhdin_kundli_ready','1');},lang);
  await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(3900);
  const r=await pg.evaluate(l=>{window.SD_LANG=l;
    const btn=document.querySelector('.gita-share'),head=document.querySelector('.gita-tag');
    return {ov:document.body.scrollWidth-document.body.clientWidth,
      btnH:btn?Math.round(btn.getBoundingClientRect().height):0,
      btnW:btn?Math.round(btn.getBoundingClientRect().width):0,
      headH:head?Math.round(head.getBoundingClientRect().height):0,
      jap:(function(){let c='';window.doShare=function(t,x){c=x;};try{shareJap();}catch(e){}return c;})(),
      gita:(typeof gitaShareText==='function')?gitaShareText():'',
      wp:(typeof shareWallpaperText==='function')?shareWallpaperText():'',
      row:calThenUntil('X','09:37')};},lang);
  await pg.close(); return r;}

const WANT={
 kn:[[/ಸಂಪನ್ನವಾಯಿತು/,'sadhana'],[/ನಿತ್ಯ ಜಪ/,'nitya'],[/ಜನ್ಮ ಕುಂಡಲಿ/,'kundli'],[/ಶುಭ ಮುಹೂರ್ತ/,'muhurta'],[/^ಆನಂತರ /,'aanantara']],
 ta:[[/நிறைவேறியது/,'sadhana'],[/நித்திய ஜபம்/,'nitya'],[/ஜாதக/,'jathagam KEPT'],[/^அதன் பிறகு /,'adan piragu']],
 as:[[/সম্পন্ন হ/,'sadhana'],[/নিত্য জপ/,'nitya'],[/জন্মকোষ্ঠী/,'kundli'],[/শুভ মুহূৰ্ত/,'muhurta']],
};
console.log('\n=== the three just ruled on ===');
for(const lang of ['kn','ta','as']){
  const r=await look(lang);
  const all=r.jap+' '+r.gita+' '+r.wp+' '+r.row;
  console.log('\n  ['+lang+']  button '+r.btnW+'x'+r.btnH+'px · overflow '+r.ov+'px');
  T(lang+' no sideways scroll',r.ov<=2);
  T(lang+' button on one line',r.btnH<50);
  T(lang+' heading does not wrap',r.headH<26);
  WANT[lang].forEach(([re,label])=>T(lang+' '+label,re.test(re.source.startsWith('^')?r.row:all),
    re.source.startsWith('^')?r.row:''));
}
console.log('\n=== TAMIL: the two things that must NOT have changed ===');
const ta=await look('ta');
T('ஜாதகம் kept, not replaced with a Kundli word',/ஜாதக/.test(ta.jap+ta.gita+ta.wp));
T('நல்ல நேரம் kept, no சுப முகூர்த்தம் anywhere',
  !/முகூர்த்தம்/.test(ta.jap+ta.gita+ta.wp),/முகூர்த்தம்/.test(ta.jap+ta.gita+ta.wp)?'LEAKED':'clean');

console.log('\n=== all nine still render ===');
for(const lang of ['en','hi','te','kn','ta','bn','mr','gu','as']){
  const r=await look(lang);
  T(lang+' renders, no overflow, button fits',r.ov<=2&&r.btnH<50&&r.headH<26,
    'btn '+r.btnW+'px');
}
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  all nine languages clean');
await b.close();})();
