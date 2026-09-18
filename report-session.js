/* v238. Local caches are presentation data, NEVER proof of payment.
   Keep each account in its own record; never adopt unverified legacy URLs. */
(function(w){
  'use strict';
  var override, AUTH_KEY='sb-dulfiljhfchkccqwqniv-auth-token';
  function read(k,def){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?def:v;}catch(e){return def;}}
  function uid(){
    if(override!==undefined)return override;
    var s=read(AUTH_KEY,null);return s&&s.user&&typeof s.user.id==='string'?s.user.id:null;
  }
  function key(id){return 'sd_reports_v2_'+encodeURIComponent(id);}
  function state(){var id=uid(),v=id?read(key(id),{}):{};return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
  function write(v,id){if(!id||id!==uid())return false;try{localStorage.setItem(key(id),JSON.stringify(v));return true;}catch(e){return false;}}
  w.sdReportAccount=uid;
  w.sdReportSetSession=function(session){override=session&&session.user&&session.user.id||null;last=override;};
  w.sdAccountOwned=function(){var a=state().owned;return Array.isArray(a)?a.filter(function(o){return o&&o.report;}):[];};
  w.sdAccountWriteOwned=function(rows,id){var s=state();s.owned=rows;return write(s,id||uid());};
  w.sdReportDetails=function(id){var s=state();return s.details&&s.details[id]||null;};
  w.sdReportSaveDetails=function(id,details){var s=state();s.details=s.details||{};s.details[id]=details;return write(s,uid());};
  w.sdReportDraft=function(id){try{var d=JSON.parse(sessionStorage.getItem('sd_checkout_draft')||'null');return d&&d.report===id&&(!d.owner||d.owner===uid())?d.details:null;}catch(e){return null;}};
  w.sdReportSaveDraft=function(id,details){try{sessionStorage.setItem('sd_checkout_draft',JSON.stringify({report:id,owner:uid(),details:details}));return true;}catch(e){return false;}};
  w.sdReportAdoptDraft=function(id){var d=w.sdReportDraft(id);if(!d)return false;if(!w.sdReportSaveDetails(id,d))return false;try{sessionStorage.removeItem('sd_checkout_draft');}catch(e){}return true;};
  w.sdReportReconcile=function(rows,id){
    if(!Array.isArray(rows)||!id||id!==uid())return false;
    var s=state();s.details=s.details||{};
    s.owned=rows.filter(function(o){return o&&typeof o.report==='string';}).map(function(o){
      /* An old order code cannot establish who last wrote sd_buy_<report>.
         Preserve those legacy keys, but never adopt their unscoped details. */
      return {report:o.report,order_code:o.order_code,date:(o.paid_at||o.date||'').slice(0,10),lang:o.lang,
        dispatch_status:o.dispatch_status,generation_status:o.generation_status,
        pdf_url:o.pdf_url||null,pdf_expires_at:o.pdf_expires_at||null};
    });
    return write(s,id);
  };
  w.sdReportRestoreDetails=function(session){
    var s=session||read(AUTH_KEY,null),id=uid();
    if(!id||!s||!s.user||s.user.id!==id||!s.access_token)return Promise.resolve(false);
    var missing=w.sdAccountOwned().filter(function(o){return !w.sdReportDetails(o.report);});
    return Promise.all(missing.map(function(o){
      return (w.sdFetch||fetch)('/api/report-details?report='+encodeURIComponent(o.report),
        {headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'})
        .then(function(r){return r.ok?r.json():null;})
        .then(function(j){
          if(id!==uid()||!j||!j.details||typeof j.details!=='object'||Array.isArray(j.details))return false;
          if(!w.sdAccountOwned().some(function(x){return x.report===o.report;}))return false;
          return w.sdReportDetails(o.report)?true:w.sdReportSaveDetails(o.report,j.details);
        }).catch(function(){return false;});
    })).then(function(results){return results.some(Boolean);});
  };
  w.sdReportSync=function(){
    var s=read(AUTH_KEY,null),id=uid();if(!id||!s||!s.user||s.user.id!==id||!s.access_token)return Promise.resolve(false);
    return (w.sdFetch||fetch)('/api/order?list=1&uid='+encodeURIComponent(id),{headers:{Authorization:'Bearer '+s.access_token}})
      .then(function(r){if(!r.ok)throw new Error('Account unavailable');return r.json();})
      .then(function(j){return j&&Array.isArray(j.reports)?w.sdReportReconcile(j.reports,id):false;}).catch(function(){return false;});
  };
  var last=uid();
  w.addEventListener('storage',function(e){if(e.key===AUTH_KEY){override=undefined;var next=uid();if(last!==next){last=next;location.reload();}}});
  w.addEventListener('pageshow',function(e){if(e.persisted){override=undefined;if(last!==uid())location.reload();}});
})(window);
