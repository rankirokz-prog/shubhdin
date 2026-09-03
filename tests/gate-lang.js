const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(48)+(d||''));};
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
  await pg.waitForTimeout(4000);
  const r=await pg.evaluate(l=>{
    const btn=document.querySelector('.gita-share'), head=document.querySelector('.gita-tag');
    window.SD_LANG=l;
    return {overflow:document.body.scrollWidth-document.body.clientWidth,
      btnH:btn?Math.round(btn.getBoundingClientRect().height):0,
      btnW:btn?Math.round(btn.getBoundingClientRect().width):0,
      btn:btn?btn.textContent.trim():'',
      headH:head?Math.round(head.getBoundingClientRect().height):0,
      head:head?head.textContent.trim():'',
      gita:(typeof gitaShareText==='function')?gitaShareText():'',
      jap:(function(){let c='';window.doShare=function(t,x){c=x;};try{shareJap();}catch(e){}return c;})(),
      wp:(typeof shareWallpaperText==='function')?shareWallpaperText():'',
      rows:[calLimbUntil('तृतीया','08:51'),calThenUntil('चतुर्थी','07:42'),calThenOnly('बव')]};},lang);
  await pg.close(); return r;}

console.log('\n=== GUJARATI ===');
const gu=await look('gu');
T('no sideways scroll',gu.overflow<=2,'overflow '+gu.overflow+'px');
T('share button on one line',gu.btnH<50,'"'+gu.btn+'" '+gu.btnW+'x'+gu.btnH+'px');
T('heading does not wrap',gu.headH<26,'"'+gu.head+'"');
T('jap says સંપન્ન થઈ',/સંપન્ન થઈ/.test(gu.jap));
T('jap says નિત્ય જપ',/નિત્ય જપ/.test(gu.jap));
T('says જન્મકુંડળી',/જન્મકુંડળી/.test(gu.jap+gu.gita+gu.wp));
T('gita label is ગીતાવાણી',/ગીતાવાણી/.test(gu.gita));
T('greets શુભ પ્રભાત',/શુભ પ્રભાત/.test(gu.gita)&&/શુભ પ્રભાત/.test(gu.wp));
T('page count stays 250',/250\+/.test(gu.jap)&&!/૨૫૦/.test(gu.jap+gu.gita));

console.log('\n=== TELUGU ===');
const te=await look('te');
T('no sideways scroll',te.overflow<=2,'overflow '+te.overflow+'px');
T('jap says సంపన్నమైంది',/సంపన్నమైంది/.test(te.jap));
T('jap says నిత్య జపం',/నిత్య జపం/.test(te.jap));
T('says జన్మ కుండలి',/జన్మ కుండలి/.test(te.jap+te.gita+te.wp));
T('says శుభ ముహూర్తాలు',/శుభ ముహూర్తాలు/.test(te.gita+te.wp));

console.log('\n=== MARATHI ===');
const m=await look('mr');
T('no sideways scroll',m.overflow<=2,'overflow '+m.overflow+'px');
T('share button on one line',m.btnH<50,'"'+m.btn+'" '+m.btnW+'x'+m.btnH+'px');
T('heading does not wrap',m.headH<26,'"'+m.head+'"');
T('jap says संपन्न झाली',/संपन्न झाली/.test(m.jap));
T('jap says नित्य जपासाठी',/नित्य जपासाठी/.test(m.jap));
T('jap says जन्मकुंडली',/जन्मकुंडली/.test(m.jap));
T('gita heading is शुभाशीर्वाद',/शुभाशीर्वाद/.test(m.head),m.head);
T('gita hook says जन्मकुंडली',/जन्मकुंडली/.test(m.gita));
T('page count stays 250, not २५०',/250\+/.test(m.jap)&&!/२५०/.test(m.jap+m.gita));
console.log('   rows: '+m.rows.join('  |  '));
T('row order {name} {time} पर्यंत',/^तृतीया 08:51 पर्यंत$/.test(m.rows[0]),m.rows[0]);
T('follow-on uses त्यानंतर',/^त्यानंतर चतुर्थी 07:42 पर्यंत$/.test(m.rows[1]),m.rows[1]);
T('no-end-time form too',/^त्यानंतर बव$/.test(m.rows[2]),m.rows[2]);

console.log('\n=== BENGALI (did the revert break anything?) ===');
const n=await look('bn');
T('no sideways scroll',n.overflow<=2,'overflow '+n.overflow+'px');
T('still says সম্পন্ন হলো',/সম্পন্ন হলো/.test(n.jap));
T('still says নিত্য জপ',/নিত্য জপ/.test(n.jap));
T('still says জন্মকোষ্ঠী',/জন্মকোষ্ঠী/.test(n.jap+n.gita));
T('page count is now 250, not ২৫০',/250\+/.test(n.jap)&&!/২৫০/.test(n.jap+n.gita));
T('still greets শুভ প্রভাত',/শুভ প্রভাত/.test(n.gita)&&/শুভ প্রভাত/.test(n.wp));
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
