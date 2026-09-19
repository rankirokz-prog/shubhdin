// Durable, atomic purchase-token ownership. Raw Play tokens are never stored.
const crypto=require('crypto');
const fail=(status,message)=>Object.assign(new Error(message),{status});
exports.id=token=>'play:'+crypto.createHash('sha256').update(token).digest('hex');
exports.ready=async(base,headers)=>{
 const r=await fetch(base+'/rest/v1/sd_play_receipts?select=token_hash,uid,report&limit=0',{headers});
 if(!r.ok)throw fail(503,'play receipt storage unavailable');
};
exports.claim=async(base,headers,uid,report,token)=>{
 const id=exports.id(token);
 const r=await fetch(base+'/rest/v1/sd_play_receipts?on_conflict=token_hash',{
  method:'POST',headers:{...headers,Prefer:'resolution=ignore-duplicates'},
  body:JSON.stringify([{token_hash:id,uid,report}])});
 if(!r.ok)throw fail(503,'play receipt storage unavailable');
 const check=await fetch(base+'/rest/v1/sd_play_receipts?token_hash=eq.'+id+'&select=uid,report&limit=1',{headers});
 if(!check.ok)throw fail(503,'play receipt storage unavailable');
 const rows=await check.json();
 if(!Array.isArray(rows)||rows.length!==1)throw fail(503,'play receipt storage unavailable');
 if(rows[0].uid!==uid||rows[0].report!==report)throw fail(409,'purchase already used by another account or report');
 return id;
};
