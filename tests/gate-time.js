const {chromium}=require('playwright');
const F=[];
const T=(n,p,d)=>{if(!p)F.push(n);console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(50)+(d||''));};
(async()=>{const b=await chromium.launch();
const pg=await (await b.newContext({viewport:{width:412,height:900},serviceWorkers:'block'})).newPage();
await pg.route('**/*',r=>{const u=r.request().url();
  if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
  if(u.startsWith('http://localhost:8112'))return r.continue();
  if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'window.sdHas=function(){return false;};'});
  return r.fulfill({status:404,body:''});});
await pg.addInitScript(()=>{localStorage.clear();
  localStorage.setItem('shubhdin_user',JSON.stringify({name:'R',lang:'te',setupDone:true,dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
  localStorage.setItem('shubhdin_kundli_ready','1');});
await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(5000);

console.log('\n=== your five examples, exactly ===');
const ex=await pg.evaluate(()=>{
  window.SD_LANG='te';
  return [
    ['ఆ తర్వాత షష్ఠి 04:26 వరకు', calThenUntil('షష్ఠి','04:26')],
    ['భరణి 01:42 వరకు',           calLimbUntil('భరణి','01:42')],
    ['ధ్రువ 21:11 వరకు',          calLimbUntil('ధ్రువ','21:11')],
    ['ఆ తర్వాత వ్యాఘాత 18:32 వరకు',calThenUntil('వ్యాఘాత','18:32')],
    ['ఆ తర్వాత గర 17:21 వరకు',    calThenUntil('గర','17:21')]
  ];});
ex.forEach(([was,now])=>{console.log('   was: '+was); console.log('   now: '+now); console.log();});
const want=['షష్ఠి తె. 04:26','భరణి తె. 01:42','ధ్రువ రా. 09:11','వ్యాఘాత సా. 06:32','గర సా. 05:21'];
T('all five match your spec',ex.every((e,i)=>e[1].indexOf(want[i])>=0),
  ex.map((e,i)=>e[1].indexOf(want[i])>=0?'':want[i]).filter(Boolean).join(' | ')||'5/5');

console.log('=== the band boundaries ===');
const bands=await pg.evaluate(()=>{
  window.SD_LANG='te';
  return ['00:00','05:59','06:00','11:59','12:00','15:59','16:00','19:59','20:00','23:59','12:30']
    .map(t=>t+' -> '+sdFmtTime(t,'te'));});
bands.forEach(x=>console.log('   '+x));
T('midnight is 12:00 not 00:00',/తె\. 12:00/.test(bands[0]),bands[0]);
T('noon is 12:00 PM side',/మ\. 12:00/.test(bands[4]),bands[4]);

console.log('\n=== every language, 21:11 ===');
const all=await pg.evaluate(()=>['en','hi','te','kn','ta','bn','mr','gu','as']
  .map(l=>l+': '+sdFmtTime('21:11',l)));
all.forEach(x=>console.log('   '+x));
T('English uses AM/PM, not a prefix',/en: 09:11 PM/.test(all[0]),all[0]);
T('no language returns a raw 24h value',!all.some(x=>/21:11/.test(x)));

console.log('\n=== it must not mangle non-times ===');
const safe=await pg.evaluate(()=>[sdFmtTime('',"te"),sdFmtTime(null,'te'),
  sdFmtTime('—','te'),sdFmtTime('अभी','te'),sdFmtTime('25:99','te')]);
T('empty, dash, word and out-of-range pass through',
  safe[0]===''&&safe[1]===''&&safe[2]==='—'&&safe[3]==='अभी'&&safe[4]==='25:99',
  JSON.stringify(safe));
console.log('\n=== SUMMARY ===');
console.log(F.length?'  '+F.length+' problem(s):\n   - '+F.join('\n   - '):'  clean');
await b.close();})();
