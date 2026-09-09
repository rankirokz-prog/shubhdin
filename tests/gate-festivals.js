/* Festival regression/certification gate.
   Default mode protects every reconciled fixture and reports open almanac
   discrepancies. --strict also fails while any discrepancy remains. */
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
global.window=global;
const Astronomy=require(path.join(ROOT,'astronomy_min.js'));
global.Astronomy=global.window.Astronomy=Astronomy;
require(path.join(ROOT,'panchang-engine.js'));
const PE=global.PanchangEngine;
const FIX=JSON.parse(fs.readFileSync(path.join(__dirname,'festival-fixtures.json'),'utf8'));
const STRICT=process.argv.includes('--strict');
const CITY={hyd:[17.385,78.4867],che:[13.0827,80.2707],kol:[22.5726,88.3639],del:[28.6139,77.209],ben:[12.9716,77.5946],mum:[19.076,72.8777],ahm:[23.0225,72.5714],guw:[26.1445,91.7362]};
const rules=PE.FESTIVAL_RULES||[],rmap={};rules.forEach(r=>rmap[r.key]=r);
function cityFor(key){const g=(rmap[key]||{regions:['all']}).regions;if(g.includes('all'))return'del';if(g.includes('ap')||g.includes('ts'))return'hyd';if(g.includes('tn'))return'che';if(g.includes('wb'))return'kol';if(g.includes('ka'))return'ben';if(g.includes('mh'))return'mum';if(g.includes('gj'))return'ahm';if(g.includes('as'))return'guw';return'del';}
const cache={};
function actual(y,key){const c=cityFor(key),ck=y+'|'+c,xy=CITY[c];const rows=cache[ck]||(cache[ck]=PE.getFestivals(y,xy[0],xy[1],5.5));const hit=rows.filter(x=>x.key===key);return hit.length?hit.map(x=>x.date+(x.end?'→'+x.end:'')).join(', '):null;}
let failures=[];
for(const f of FIX){const got=actual(f.year,f.key);if(f.status==='confirmed'&&got!==f.date)failures.push(`${f.year} ${f.key}: expected ${f.date}, got ${got}`);}
const open=FIX.filter(f=>f.status==='disagree');
if(STRICT&&open.length)failures.push(`${open.length} source discrepancies remain unresolved`);

for(const y of [2026,2027,2028]){
  const rows=PE.getFestivals(y,17.385,78.4867,5.5),seen=new Set();
  for(const r of rows){const k=r.key+'@'+r.date;if(seen.has(k))failures.push(`${y} duplicate ${k}`);seen.add(k);if(r.span&&(!r.end||r.end<r.date))failures.push(`${y} invalid span ${r.key}`);}
}
const astro=fs.readFileSync(path.join(ROOT,'astrology.html'),'utf8');
if(!/getFestivals\([^\n]+\{regions:rg\}/.test(astro))failures.push('astrology.html does not apply language-region filtering');
if(!/function sdFestivalName\(/.test(astro))failures.push('astrology.html does not resolve cal.name_<festival key>');

console.log(`Festival fixtures: ${FIX.length-open.length} reconciled, ${open.length} open`);
for(const f of open)console.log(`OPEN ${f.year} ${f.key}: engine ${actual(f.year,f.key)} / source ${f.almanac}`);
console.log(failures.length?`FESTIVAL GATE: ${failures.length} FAIL`:'FESTIVAL GATE: PASS');
failures.forEach(x=>console.error(' - '+x));
process.exit(failures.length?1:0);
