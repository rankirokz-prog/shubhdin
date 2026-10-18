// Durable, atomic purchase-token ownership. Raw Play tokens are never stored.
const crypto=require('crypto');
const fail=(status,message,diagnostic)=>Object.assign(new Error(message),{status,checkoutDiagnostic:diagnostic});
async function storageFailure(stage,code,response){
 const d={stage,code,storage_status:response.status};
 try{const body=await response.json();if(body&&/^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(body.code||''))d.storage_code=body.code;}catch(e){}
 return fail(503,'play receipt storage unavailable',d);
}
exports.id=token=>'play:'+crypto.createHash('sha256').update(token).digest('hex');
exports.ready=async(base,headers)=>{
 const r=await fetch(base+'/rest/v1/sd_play_receipts?select=token_hash,uid,report&limit=0',{headers});
 if(!r.ok)throw await storageFailure('receipts','RECEIPT_STORAGE',r);
};
exports.claim=async(base,headers,uid,report,token)=>{
 const id=exports.id(token);
 const r=await fetch(base+'/rest/v1/sd_play_receipts?on_conflict=token_hash',{
  method:'POST',headers:{...headers,Prefer:'resolution=ignore-duplicates'},
  body:JSON.stringify([{token_hash:id,uid,report}])});
 if(!r.ok)throw await storageFailure('receipt_write','RECEIPT_WRITE',r);
 const check=await fetch(base+'/rest/v1/sd_play_receipts?token_hash=eq.'+id+'&select=uid,report&limit=1',{headers});
 if(!check.ok)throw await storageFailure('receipt_read','RECEIPT_READ',check);
 const rows=await check.json();
 if(!Array.isArray(rows)||rows.length!==1)throw fail(503,'play receipt storage unavailable',{stage:'receipt_verify',code:'RECEIPT_VERIFY'});
 if(rows[0].uid!==uid||rows[0].report!==report)throw fail(409,'purchase already used by another account or report',{stage:'receipt_conflict',code:'RECEIPT_CONFLICT'});
 return id;
};
