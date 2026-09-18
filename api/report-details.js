// Read-only recovery of a paid account's existing encrypted report snapshot.
// No migration, table creation or adoption of unscoped browser data.
const { open } = require('../lib/report-vault.js');
const REPORTS = new Set(['marriage','love','career','child','annual','forecast','muhurta']);
module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
  const report=req.query&&req.query.report;
  if(!REPORTS.has(report))return res.status(400).json({error:'unknown_report'});
  const authorization=req.headers&&req.headers.authorization;
  if(typeof authorization!=='string'||!/^Bearer \S+$/.test(authorization))return res.status(401).json({error:'sign_in_required'});
  const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_KEY;
  if(!base||!key)return res.status(503).json({error:'recovery_unavailable'});
  async function get(path,auth){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(base+path,{headers:{apikey:key,Authorization:auth},signal:controller.signal});
      if(!response.ok)throw new Error('upstream_unavailable');
      return await response.json();
    }finally{clearTimeout(timer);}
  }
  let user;
  try{user=await get('/auth/v1/user',authorization);}catch(e){return res.status(401).json({error:'sign_in_required'});}
  if(!user||typeof user.id!=='string'||!user.id)return res.status(401).json({error:'sign_in_required'});
  // Derive identity only from the verified token, never a caller-supplied uid.
  const filter='uid=eq.'+encodeURIComponent(user.id)+'&report=eq.'+encodeURIComponent(report);
  try{
    const orders=await get('/rest/v1/orders?'+filter+'&status=eq.paid&select=id&limit=1','Bearer '+key);
    if(!Array.isArray(orders))throw new Error('invalid_orders');
    if(!orders.length)return res.status(403).json({error:'purchase_required'});
    const rows=await get('/rest/v1/report_drafts?'+filter+'&select=details_enc,lang&limit=1','Bearer '+key);
    if(!Array.isArray(rows)||!rows[0]||!rows[0].details_enc)return res.status(409).json({error:'snapshot_unavailable'});
    const details=open(rows[0].details_enc);
    if(!details||typeof details!=='object'||Array.isArray(details))throw new Error('invalid_snapshot');
    return res.status(200).json({details});
  }catch(e){return res.status(503).json({error:'recovery_unavailable'});}
};
