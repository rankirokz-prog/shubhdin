// simulate buy.html submitDetails() key emission per report, post-patch,
// then check each payload against the ids the report actually reads.
const fs=require('fs');
const CFG={
 marriage:{two:true}, love:{gender:true}, career:{gender:true}, child:{gender:true},
 muhurta:{}, annual:{}, forecast:{}
};
function emit(R){
  const C=CFG[R]; let k=[];
  if(C.two){ k=['bname','bdate','btime','bplace','gname','gdate','gtime','gplace','blat','blng','glat','glng']; }
  else{ k=['pname','bdate','btime']; if(C.gender)k.push('pgender'); if(!C.noplace)k.push('bplace','blat','blng'); }
  if(R==='annual')k.push('clat','clng');           // patched mirror
  return k;
}
// ids each report reads, minus UI-only nodes
const SKIP=new Set(['report','printbar','inputScreen','sdAutoLoader','confirmBox','confirmText','actGrid','cGpsTxt']);
function reads(R){
  const s=fs.readFileSync(R+'-report.html','utf8');
  const set=new Set();
  for(const m of s.matchAll(/getElementById\(['"]([a-zA-Z]+)['"]\)/g)) if(!SKIP.has(m[1])) set.add(m[1]);
  if(R==='marriage') ['b','g'].forEach(p=>['name','date','time','lat','lng','place'].forEach(f=>set.add(p+f)));
  for(const x of [...set]) if(x==='p'||x.length<3) set.delete(x);
  return [...set].sort();
}
// which of those self-seed from markup value= or load-time assignment
function seeded(R){
  const s=fs.readFileSync(R+'-report.html','utf8');
  const out=new Set();
  for(const m of s.matchAll(/<input[^>]*id="([a-zA-Z]+)"[^>]*value="[^"]+"/g)) out.add(m[1]);
  for(const m of s.matchAll(/getElementById\(['"]([a-zA-Z]+)['"]\)\.value\s*=/g)) out.add(m[1]);
  return out;
}
let fail=0;
for(const R of Object.keys(CFG)){
  const sent=new Set(emit(R)), need=reads(R), seed=seeded(R);
  const missing=need.filter(x=>!sent.has(x));
  const hard=missing.filter(x=>!seed.has(x));
  const soft=missing.filter(x=>seed.has(x));
  const extra=[...sent].filter(x=>!need.includes(x));
  if(hard.length)fail++;
  console.log(R.padEnd(9)+(hard.length?'✗ UNSET: '+hard.join(' '):'✓ all required ids supplied')
    +(soft.length?'   [self-seeded: '+soft.join(' ')+']':'')
    +(extra.length?'   [ignored extras: '+extra.join(' ')+']':''));
}
console.log(fail?'\n✗ '+fail+' report(s) would fall back to markup defaults':'\n✓ no report falls back to markup coordinate defaults');
process.exit(fail?1:0);
