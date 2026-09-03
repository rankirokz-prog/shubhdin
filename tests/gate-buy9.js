const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(44)+(d||''));};
(async()=>{const b=await chromium.launch();
const CTX=await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'});
async function look(lang){
  const pg=await CTX.newPage();
  pg.on('pageerror',e=>{const m=e.message; if(!/no saleable/.test(m)) console.log('   [err] '+m.slice(0,60));});
  await pg.route('**/*',r=>{const u=r.request().url();
    if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
    if(/\/api\//.test(u))return r.fulfill({status:200,contentType:'application/json',body:'{}'});
    if(u.startsWith('http://localhost:8112'))return r.continue();
    if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
    return r.fulfill({status:404,body:''});});
  await pg.addInitScript(l=>{localStorage.clear();
    localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:l,setupDone:true,
      dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));},lang);
  await pg.goto('http://localhost:8112/buy.html?r=marriage',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(1600);
  const r=await pg.evaluate(()=>({
    ov:document.body.scrollWidth-document.body.clientWidth,
    build:typeof SD_BUILD!=='undefined'?SD_BUILD:'?',
    text:document.body.innerText}));
  await pg.close(); return r;}

const CHECK={
 te:[/నమోదు చేయండి/,/జాతక నివేదిక/,/సిద్ధమైంది/,/భద్రంగా/,/సందేహం ఉందా/],
 bn:[/অনুগ্রহ করে/,/কোষ্ঠী রিপোর্ট/,/প্রস্তুত/,/সংরক্ষিত/,/প্রশ্ন থাকলে/],
 mr:[/नंबर टाका/,/जन्मकुंडली/,/तज्ज्ञ टीम/,/सुरक्षित/,/शंका असल्यास/],
 gu:[/દાખલ કરો/,/જન્મકુંડળી/,/નિષ્ણાત ટીમ/,/સુરક્ષિત/,/પ્રશ્ન હોય તો/],
 ta:[/தயவுசெய்து/,/ஜாதக அறிக்கை/,/நிபுணர் குழு/,/பாதுகாப்பாக/,/பதிவிறக்கம்/],
 kn:[/ದಯವಿಟ್ಟು/,/ಜಾತಕ ವರದಿ/,/ಕಾಳಜಿಯಿಂದ/,/ಸುರಕ್ಷಿತ/,/ಸಂದೇಹವಿದ್ದಲ್ಲಿ/],
 as:[/অনুগ্ৰহ কৰি/,/জন্মকোষ্ঠী/,/অভিজ্ঞ দল/,/সুৰক্ষিত/,/জানিব লগা/],
};
console.log('\n=== the buy page, all nine ===');
for(const lang of ['en','hi','te','bn','mr','gu','ta','kn','as']){
  const r=await look(lang);
  T(lang+' renders, no sideways scroll',r.ov<=2,'overflow '+r.ov+'px');
}
console.log('\n=== the reviewed wording is actually in the source ===');
const src=require('fs').readFileSync('/home/claude/build/buy.html','utf8');
for(const lang of Object.keys(CHECK)){
  const missing=CHECK[lang].filter(re=>!re.test(src));
  T(lang+' — all 5 reviewed phrases present',missing.length===0,
    missing.length?missing.map(x=>x.source).join(', '):'5/5');
}
const r=await look('te');
T('build tag is current',/^C[6-9]|^C\d\d/.test(r.build),r.build);
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
