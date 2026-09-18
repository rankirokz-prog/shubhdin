// Save the purchased chart before checkout; never replace an existing snapshot.
const vault=require('./report-vault.js');
const langs=['en','hi','te','kn','ta','bn','mr','gu','as'];
function fail(status,error){return Object.assign(new Error(error),{status});}
function canonical(value){
  const out={};Object.keys(value).sort().forEach(k=>{if(k!=='phone')out[k]=value[k];});
  return JSON.stringify(out);
}
function validate(report,details){
  if(!details||typeof details!=='object'||Array.isArray(details)||JSON.stringify(details).length>20000)throw fail(400,'report details required');
  if(!langs.includes(details.lang))throw fail(400,'report language required');
  for(const [k,v] of Object.entries(details))if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(k)||!['string','number','boolean'].includes(typeof v))throw fail(400,'invalid report details');
  const required=report==='marriage'?['bname','bdate','btime','gname','gdate','gtime']:['pname','bdate','btime'];
  if(required.some(k=>typeof details[k]!=='string'||!details[k].trim()))throw fail(400,'incomplete report details');
}
exports.load=async function(base,headers,uid,report){
  const r=await fetch(base+'/rest/v1/report_drafts?uid=eq.'+encodeURIComponent(uid)+'&report=eq.'+encodeURIComponent(report)+'&select=details_enc,lang&limit=1',{headers});
  if(!r.ok)throw fail(503,'report storage unavailable');
  const rows=await r.json();if(!Array.isArray(rows))throw fail(503,'report storage unavailable');
  return rows[0]&&rows[0].details_enc?vault.open(rows[0].details_enc):null;
};
exports.save=async function(base,headers,uid,report,details){
  validate(report,details);
  let current=await exports.load(base,headers,uid,report);
  if(!current){
    const r=await fetch(base+'/rest/v1/report_drafts?on_conflict=uid,report',{
      method:'POST',headers:{...headers,Prefer:'resolution=ignore-duplicates'},
      body:JSON.stringify([{uid,report,lang:details.lang,details_enc:vault.seal(details)}])});
    if(!r.ok)throw fail(503,'report details could not be saved');
    current=await exports.load(base,headers,uid,report);
  }
  if(!current)throw fail(503,'report details could not be verified');
  if(canonical(current)!==canonical(details))throw fail(409,'report details already locked');
  return current;
};
