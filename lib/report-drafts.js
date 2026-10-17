// Save the purchased chart before checkout; never replace an existing snapshot.
const vault=require('./report-vault.js');
const langs=['en','hi','te','kn','ta','bn','mr','gu','as'];
function fail(status,error,diagnostic){return Object.assign(new Error(error),{status,checkoutDiagnostic:diagnostic});}
async function storageFailure(error,stage,response){
  const diagnostic={stage,storage_status:response.status};
  try{const body=await response.json();if(body&&/^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(body.code||''))diagnostic.storage_code=body.code;}catch(e){}
  return fail(503,error,diagnostic);
}
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
  if(!r.ok)throw await storageFailure('report storage unavailable','snapshot_read',r);
  const rows=await r.json();if(!Array.isArray(rows))throw fail(503,'report storage unavailable',{stage:'snapshot_read'});
  if(!rows[0]||!rows[0].details_enc)return null;
  try{return vault.open(rows[0].details_enc);}catch(e){throw fail(503,'report snapshot unreadable',{stage:'snapshot_decrypt'});}
};
exports.save=async function(base,headers,uid,report,details){
  validate(report,details);
  let current=await exports.load(base,headers,uid,report);
  if(!current){
    let encrypted;
    try{encrypted=vault.seal(details);}catch(e){throw fail(503,'report encryption unavailable',{stage:'snapshot_encrypt'});}
    const r=await fetch(base+'/rest/v1/report_drafts?on_conflict=uid,report',{
      method:'POST',headers:{...headers,Prefer:'resolution=ignore-duplicates'},
      body:JSON.stringify([{uid,report,lang:details.lang,details_enc:encrypted,details_hash:vault.digest(details)}])});
    if(!r.ok)throw await storageFailure('report details could not be saved','snapshot_write',r);
    current=await exports.load(base,headers,uid,report);
  }
  if(!current)throw fail(503,'report details could not be verified',{stage:'snapshot_verify'});
  if(canonical(current)!==canonical(details))throw fail(409,'report details already locked');
  return current;
};
