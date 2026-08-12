// Diffs live engine output against golden-snapshots.json. Reports per-field drift.
global.window=global; const A=require('./astronomy_min.js'); global.window.Astronomy=A; global.Astronomy=A;
require('./panchang-engine.js'); const PE=global.PanchangEngine;
const fs=require('fs');
const g=JSON.parse(fs.readFileSync('golden-snapshots.json','utf8'));
const ser=o=>JSON.parse(JSON.stringify(o));

let pass=0, fail=0; const failures=[];
function diff(path, a, b, out){
  if(a===b) return;
  if(typeof a!==typeof b || a==null || b==null || typeof a!=='object'){ out.push(path+': golden='+JSON.stringify(a)+' live='+JSON.stringify(b)); return; }
  const keys=new Set([...Object.keys(a),...Object.keys(b)]);
  for(const k of keys) diff(path+'.'+k, a[k], b[k], out);
}
// By-design time-dependent: the sadeSati scan window is anchored on the run
// date, so the FIRST period's start and the LAST period's end move with
// "today". Strip them from both sides; all interior boundaries stay compared.
function sanitize(o){
  if(o==null||typeof o!=='object') return o;
  if(o.sadeSati&&Array.isArray(o.sadeSati.periods)&&o.sadeSati.periods.length){
    const p=o.sadeSati.periods;
    if(p[0]&&typeof p[0]==='object') delete p[0].start;
    const last=p[p.length-1];
    if(last&&typeof last==='object') delete last.end;
  }
  for(const k in o) sanitize(o[k]);
  return o;
}
function check(name, golden, liveFn){
  let live; try{ live=ser(liveFn()); }catch(e){ live={__threw:e.message}; }
  golden=sanitize(JSON.parse(JSON.stringify(golden))); live=sanitize(live);
  const out=[]; diff('', golden, live, out);
  if(out.length){ fail++; failures.push({name, drift:out.slice(0,8), total:out.length}); }
  else pass++;
}

const LOCS={eluru:[16.7,81.1,5.5],delhi:[28.61,77.21,5.5],chennai:[13.08,80.27,5.5],newjersey:[40.06,-74.41,-5],london:[51.51,-0.13,0],sydney:[-33.87,151.21,10],dubai:[25.20,55.27,4],tromso:[69.65,18.96,1]};
for(const key of Object.keys(g.panchang)){
  const [d,loc]=key.split('|'); const [lat,lng,tz]=LOCS[loc];
  const [y,m,dd]=d.split('-').map(Number);
  check('panchang '+key, g.panchang[key], ()=>PE.getPanchang(new Date(Date.UTC(y,m-1,dd,12,0,0)-tz*3600000),lat,lng,tz));
}
const CHARTS={ram:[Date.UTC(1996,11,6,15,47,0)-5.5*3600000,16.4343,81.6985],girl:[Date.UTC(2000,6,10,8,30,0)-5.5*3600000,16.7,81.1],delhi90:[Date.UTC(1990,2,15,4,20,0)-5.5*3600000,28.61,77.21],nri:[Date.UTC(1988,9,2,22,10,0)+5*3600000,40.06,-74.41],south:[Date.UTC(2005,0,26,12,0,0)-10*3600000,-33.87,151.21]};
const FNS={birthChart:(B,la,ln)=>PE.getBirthChart(B,la,ln),dasha:B=>PE.getVimshottariDasha(B),doshas:(B,la,ln)=>PE.getDoshas(B,la,ln),yogas:(B,la,ln)=>PE.getYogas(B,la,ln),sadeSati:B=>PE.getSadeSati(B),careerWealth:(B,la,ln)=>PE.getCareerWealth(B,la,ln),childFamily:(B,la,ln)=>PE.getChildFamily(B,la,ln),loveProfile:(B,la,ln)=>PE.getLoveProfile(B,la,ln),ashtakavarga:(B,la,ln)=>PE.getAshtakavarga(B,la,ln),varshaphal2026:(B,la,ln)=>PE.getVarshaphal(B,la,ln,2026),forecast10:(B,la,ln)=>PE.getYearForecast(B,la,ln,2026,10)};
for(const cid of Object.keys(CHARTS)){
  const [utc,la,ln]=CHARTS[cid]; const B=new Date(utc);
  for(const fk of Object.keys(FNS)) if(g.kundli[cid][fk]) check('kundli '+cid+'.'+fk, g.kundli[cid][fk], ()=>FNS[fk](B,la,ln));
}
const ram=new Date(CHARTS.ram[0]), girl=new Date(CHARTS.girl[0]);
check('match gunaMilan', g.kundli.__match_ram_girl.gunaMilan, ()=>PE.getGunaMilanFull?PE.getGunaMilanFull(ram,girl):PE.getGunaMilan(ram,girl));
check('match manglik', g.kundli.__match_ram_girl.manglik, ()=>PE.getManglikMatch(ram,16.4343,81.6985,girl,16.7,81.1));
check('festivals2026', g.festivals2026, ()=>PE.getFestivals(2026,16.7,81.1));
check('vrats jul2026', g.vrats2026_jul, ()=>PE.getVrats(2026,7,16.7,81.1));


if(g.u1){
  const U1CH={ram:Date.UTC(1996,11,6,15,47,0)-5.5*3600000,girl:Date.UTC(2000,6,10,8,30,0)-5.5*3600000,nri:Date.UTC(1988,9,2,22,10,0)+5*3600000};
  for(const key of Object.keys(g.u1)){
    if(key==='namakshara'){ check('u1 namakshara', g.u1.namakshara, ()=>Array.from({length:27},(_,i)=>PE.getNamakshara(i))); continue; }
    if(key==='taraMatrix'){ check('u1 taraMatrix', g.u1.taraMatrix, ()=>Array.from({length:27},(_,j)=>Array.from({length:27},(_,d)=>PE.tarabalaOf(j,d).tara))); continue; }
    if(key==='chandraMatrix'){ check('u1 chandraMatrix', g.u1.chandraMatrix, ()=>Array.from({length:12},(_,j)=>Array.from({length:12},(_,m)=>PE.chandrabalaOf(j,m).favorable?1:0))); continue; }
    const [cid,d]=key.split('|'); const [y,m,dd]=d.split('-').map(Number);
    check('u1 pds '+key, g.u1[key], ()=>PE.getPersonalDayStrength(new Date(Date.UTC(y,m-1,dd,6,0,0)),16.7,81.1,5.5,{date:new Date(U1CH[cid])}));
  }
}


if(g.u2){
  const U2CH={ram:Date.UTC(1996,11,6,15,47,0)-5.5*3600000,nri:Date.UTC(1988,9,2,22,10,0)+5*3600000};
  for(const cid of Object.keys(g.u2)) check('u2 gochar '+cid, g.u2[cid], ()=>PE.getMonthlyGochar(new Date(Date.UTC(2026,7,11)),12,5.5,{date:new Date(U2CH[cid])}));
}


if(g.u3){
  const U3CH={ram:[Date.UTC(1996,11,6,15,47,0)-5.5*3600000,16.4343,81.6985],delhi90:[Date.UTC(1990,2,15,4,20,0)-5.5*3600000,28.61,77.21]};
  for(const key of Object.keys(g.u3)){
    const [cid,kind]=key.split('|'); const [utc,la,ln]=U3CH[cid]; const Bd=new Date(utc);
    if(kind==='mudda9') check('u3 '+key, g.u3[key], ()=>PE.getMuddaDasha(Bd,2026));
    else if(kind==='muddaC') check('u3 '+key, g.u3[key], ()=>PE.getMuddaDasha(Bd,2026,{variant:'charak'}));
    else check('u3 '+key, g.u3[key], ()=>PE.getSahams(Bd,la,ln,2026));
  }
}

console.log('GOLDEN VERIFY:', pass, 'pass /', fail, 'fail');
for(const f of failures){ console.log('✗', f.name, '('+f.total+' drifted fields)'); f.drift.forEach(d=>console.log('   ', d)); }
process.exit(fail?1:0);
