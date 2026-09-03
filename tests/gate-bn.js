const {chromium}=require('playwright');
const T=(n,p,d)=>console.log((p?'  [ok]   ':'  [BUG]  ')+n.padEnd(50)+(d||''));
(async()=>{const b=await chromium.launch();
const CTX=await b.newContext({viewport:{width:412,height:900},deviceScaleFactor:2,serviceWorkers:'block'});
const pg=await CTX.newPage();
pg.on('pageerror',e=>console.log('   [err] '+e.message.slice(0,70)));
await pg.route('**/*',r=>{const u=r.request().url();
  if(/rest\/v1\/events/.test(u))return r.fulfill({status:201,body:''});
  if(u.startsWith('http://localhost:8112'))return r.continue();
  if(/\.js($|\?)/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'/* stub */'});
  return r.fulfill({status:404,body:''});});
await pg.addInitScript(()=>{localStorage.clear();
  localStorage.setItem('shubhdin_user',JSON.stringify({name:'Ram',lang:'bn',setupDone:true,
    dob:'1990-05-05',tob:'06:00',city:'Eluru',city_lat:16.7107,city_lon:81.0952}));
  localStorage.setItem('shubhdin_kundli_ready','1');});
await pg.goto('http://localhost:8112/dashboard.html',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(4200);

const r=await pg.evaluate(()=>{
  const btn=document.querySelector('.gita-share');
  const card=document.querySelector('.gita');
  const head=document.querySelector('.gita-tag');
  return {
    overflow:document.body.scrollWidth-document.body.clientWidth,
    btnText:btn?btn.textContent:'',
    btnW:btn?Math.round(btn.getBoundingClientRect().width):0,
    cardW:card?Math.round(card.getBoundingClientRect().width):0,
    btnWraps:btn?btn.getBoundingClientRect().height>50:null,
    headText:head?head.textContent:'',
    headWraps:head?head.getBoundingClientRect().height>22:null,
    share:(typeof gitaShareText==='function')?gitaShareText():'',
    jap:(function(){let c='';window.doShare=function(t,x){c=x;};try{shareJap();}catch(e){}return c;})(),
    wp:(typeof shareWallpaperText==='function')?shareWallpaperText():''};});

T('no sideways scroll in Bengali',r.overflow<=2,'overflow '+r.overflow+'px');
T('the share button fits its pill',!r.btnWraps,'"'+r.btnText.trim()+'" — '+r.btnW+'px of '+r.cardW+'px card');
T('the card heading does not wrap',!r.headWraps,'"'+r.headText.trim()+'"');
T('gita share uses গীতাবাণী',/গীতাবাণী/.test(r.share));
T('gita share greets with শুভ প্রভাত',/শুভ প্রভাত/.test(r.share));
T('gita share says জন্মকোষ্ঠী',/জন্মকোষ্ঠী/.test(r.share));
T('jap share says সম্পন্ন হলো',/সম্পন্ন হলো/.test(r.jap));
T('jap share says নিত্য জপ',/নিত্য জপ/.test(r.jap));
T('wallpaper share greets with শুভ প্রভাত',/শুভ প্রভাত/.test(r.wp));
T('wallpaper wish uses আসুক',/আসুক/.test(r.wp));
T('wallpaper hook says শুভ মুহূর্ত',/শুভ মুহূর্ত/.test(r.wp));
console.log('\n  ── the forwarded Gita message, Bengali ──');
r.share.split('\n').forEach(l=>console.log('   │ '+l));
console.log('\n  ── panchang row order ──');
const w=await pg.evaluate(()=>{window.SD_LANG='bn';
  return [calLimbUntil('তৃতীয়া','09:51'), calThenUntil('চতুর্থী','08:12'), calThenOnly('বব')];});
console.log('   '+w.join('   |   '));
T('reviewer\u2019s order: {name} {time} পর্যন্ত',/^তৃতীয়া 09:51 পর্যন্ত$/.test(w[0]),w[0]);
T('and তারপর {name} {time} পর্যন্ত',/^তারপর চতুর্থী 08:12 পর্যন্ত$/.test(w[1]),w[1]);
await pg.screenshot({path:'/home/claude/bn-card.png',clip:{x:0,y:0,width:412,height:640}});
await b.close();})();
