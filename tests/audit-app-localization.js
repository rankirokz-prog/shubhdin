/* App-shell localization gate. Paid report prose is intentionally excluded. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),LANGS=['en','hi','te','kn','ta','bn','mr','gu','as'];
function load(file,out){const c={globalThis:{},console};c.window=c.globalThis;vm.createContext(c);vm.runInContext(fs.readFileSync(file,'utf8'),c);return c.globalThis[out];}
const table={};for(const l of LANGS)table[l]=load(path.join(ROOT,`app-strings-${l}.js`),`SD_APP_${l.toUpperCase()}`);
const master=JSON.parse(fs.readFileSync(path.join(__dirname,'app-strings-todo.json'),'utf8')).strings;
const appRows=master.filter(x=>!/^report(?:\.|Title\.)/.test(x.key));
const failures=[],warnings=[];
function tokens(s){return [...String(s||'').matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort().join(',');}
const tokenExceptions=new Set(['astrol.moon_today_is_in_your_n_ord_house_']); // Indian forms encode the ordinal suffix around {n}.
for(const l of LANGS){
  const nonRegional=appRows.filter(x=>!x.key.startsWith('cal.name_'));
  for(const x of nonRegional){
    if(!table[l][x.key])failures.push(`${l}: missing ${x.key}`);
    else if(!tokenExceptions.has(x.key)&&tokens(table[l][x.key])!==tokens(table.en[x.key]))failures.push(`${l}: placeholder mismatch ${x.key}`);
  }
}

// Only festival names visible for a language are required in its runtime file.
global.window=global;global.Astronomy=require(path.join(ROOT,'astronomy_min.js'));require(path.join(ROOT,'panchang-engine.js'));const PE=global.PanchangEngine;
const LOC={en:[28.61,77.21],hi:[28.61,77.21],te:[17.38,78.48],kn:[12.97,77.59],ta:[13.08,80.27],bn:[22.57,88.36],mr:[19.07,72.87],gu:[23.02,72.57],as:[26.14,91.73]};
for(const l of LANGS){const need=new Set();for(const y of [2026,2027,2028])for(const f of PE.getFestivals(y,LOC[l][0],LOC[l][1],5.5,{regions:PE.REGIONS_FOR_LANG[l]}))need.add('cal.name_'+f.key);for(const k of need)if(!table[l][k])failures.push(`${l}: visible festival name missing ${k}`);}

// Shared panchang and vrat dictionaries must carry every non-English language.
const terms=load(path.join(ROOT,'panchang-terms.js'),'SD_PANCHANG_TERMS');
const vrats=load(path.join(ROOT,'vrat-names.js'),'SD_VRAT_NAMES');
function walk(n,p){if(!n||typeof n!=='object')return;const ks=Object.keys(n);if(ks.includes('en')||ks.includes('hi')){for(const l of LANGS)if(l!=='en'&&!n[l])failures.push(`${p}: missing ${l}`);return;}for(const k of ks)walk(n[k],p+'.'+k);}
walk(terms,'panchang');for(const [name,row] of Object.entries(vrats))for(const l of LANGS.slice(1))if(!row[l])failures.push(`vrat ${name}: missing ${l}`);

console.log(`APP LOCALIZATION: ${failures.length?'FAIL':'PASS'} · ${LANGS.length} languages · ${appRows.length} app-shell source rows`);
if(warnings.length)warnings.forEach(x=>console.log('WARN '+x));
failures.forEach(x=>console.error('FAIL '+x));process.exit(failures.length?1:0);
