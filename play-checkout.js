/* Play-only checkout in the Android wrapper. Durable reports are never consumed. */
(function(w){
 'use strict';
 var STORE='https://play.google.com/billing';
 var sku={marriage:'report_marriage_399',love:'report_love_199',career:'report_career_199',annual:'report_annual_199',forecast:'report_forecast_299'};
 var langs=['en','hi','te','kn','ta','bn','mr','gu','as'];
 var messages={
 unavailable:['Google Play payments are unavailable. Please try again later.','Google Play भुगतान उपलब्ध नहीं है। कृपया बाद में फिर कोशिश करें।','Google Play చెల్లింపులు అందుబాటులో లేవు. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.','Google Play ಪಾವತಿಗಳು ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.','Google Play கட்டண வசதி கிடைக்கவில்லை. பின்னர் மீண்டும் முயலவும்.','Google Play পেমেন্ট উপলব্ধ নেই। পরে আবার চেষ্টা করুন।','Google Play पेमेंट उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.','Google Play ચુકવણી ઉપલબ્ધ નથી. કૃપા કરીને પછી ફરી પ્રયાસ કરો.','Google Play পৰিশোধ উপলব্ধ নহয়। অনুগ্ৰহ কৰি পিছত আকৌ চেষ্টা কৰক।'],
 checking:['Checking Google Play purchases…','Google Play खरीद की जाँच हो रही है…','Google Play కొనుగోళ్లను తనిఖీ చేస్తున్నాం…','Google Play ಖರೀದಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…','Google Play வாங்குதல்கள் சரிபார்க்கப்படுகின்றன…','Google Play কেনাকাটা যাচাই করা হচ্ছে…','Google Play खरेदी तपासत आहोत…','Google Play ખરીદીઓ તપાસી રહ્યા છીએ…','Google Play ক্ৰয় পৰীক্ষা কৰি থকা হৈছে…'],
 retry:['Check purchase again','खरीद फिर जाँचें','కొనుగోలును మళ్లీ తనిఖీ చేయండి','ಖರೀದಿಯನ್ನು ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ','வாங்குதலை மீண்டும் சரிபார்க்கவும்','কেনাকাটা আবার যাচাই করুন','खरेदी पुन्हा तपासा','ખરીદી ફરી તપાસો','ক্ৰয় পুনৰ পৰীক্ষা কৰক'],
 pending:['Purchase not confirmed yet. Check again before paying again.','खरीद की पुष्टि अभी नहीं हुई है। दोबारा भुगतान से पहले फिर जाँचें।','కొనుగోలు ఇంకా నిర్ధారణ కాలేదు. మళ్లీ చెల్లించే ముందు తనిఖీ చేయండి.','ಖರೀದಿ ಇನ್ನೂ ದೃಢಪಟ್ಟಿಲ್ಲ. ಮತ್ತೆ ಪಾವತಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ.','வாங்குதல் இன்னும் உறுதியாகவில்லை. மீண்டும் பணம் செலுத்தும் முன் சரிபார்க்கவும்.','কেনাকাটা এখনও নিশ্চিত হয়নি। আবার টাকা দেওয়ার আগে যাচাই করুন।','खरेदीची पुष्टी अद्याप झालेली नाही. पुन्हा पैसे देण्याआधी तपासा.','ખરીદીની પુષ્ટિ હજી થઈ નથી. ફરી ચૂકવતાં પહેલાં તપાસો.','ক্ৰয় এতিয়াও নিশ্চিত হোৱা নাই। পুনৰ পৰিশোধ কৰাৰ আগতে পৰীক্ষা কৰক।']
 };
 var state=null,revision=0,busy=false;
 function say(k){var i=langs.indexOf(w.SD_LANG||'en');return messages[k][i<0?0:i];}
 function element(id){return document.getElementById(id);}
 function inWrapper(){
  try{if(w.__sdTwa||sessionStorage.getItem('sd_twa')==='1'||/^android-app:\/\/app\.shubhdin\.daily(?:\/|$)/.test(document.referrer))return true;}catch(e){}
  // Conservatively block external checkout for Android installed-mode launches.
  return /Android/i.test(navigator.userAgent)&&w.matchMedia&&w.matchMedia('(display-mode: standalone)').matches;
 }
 function valid(s){return state===s&&s.revision===revision&&w.SESSION&&w.SESSION.user.id===s.uid&&w.sdReportAccount()===s.uid;}
 function guard(s){if(!valid(s))throw new Error('account changed');}
 function showError(key){element('errP').textContent=say(key);element('errP').style.display='block';}
 async function api(s,mode,body){
  guard(s);
  var r=await w.sessionFetch('/api/order?'+mode+'=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({uid:s.uid,report:s.report},body||{}))});
  guard(s);var j=await r.json();guard(s);
  if(!r.ok||!j.ok){var e=new Error('play request failed');e.reason=j.error;throw e;}
  return j;
 }
 function complete(s,j){guard(s);if(j.details){w.sdReportSaveDetails(s.report,j.details);try{sessionStorage.removeItem('sd_checkout_draft');}catch(e){}}w.ORDER_CODE=j.order_code;w.sdOwnedWrite(s.report,j.order_code,null,j.lang||w.viewLang());w.showDone();}
 async function verify(s,p){
  if(!p||p.itemId!==sku[s.report]||typeof p.purchaseToken!=='string'||!p.purchaseToken)throw new Error('invalid receipt');
  return api(s,'play_verify',{productId:p.itemId,purchaseToken:p.purchaseToken});
 }
 function timed(p){return new Promise(function(resolve,reject){var t=setTimeout(function(){reject(new Error('timeout'));},12000);Promise.resolve(p).then(function(v){clearTimeout(t);resolve(v);},function(e){clearTimeout(t);reject(e);});});}
 async function service(){
  if(typeof w.getDigitalGoodsService!=='function')return null;
  try{return await timed(w.getDigitalGoodsService(STORE));}catch(e){return null;}
 }
 w.sdPlayShow=async function(){
  var rev=++revision,uid=w.SESSION&&w.SESSION.user.id;
  var s=state={revision:rev,uid:uid,report:w.R,ready:false,play:inWrapper()};
  element('btPay').disabled=true;
  var dg=await service();if(!valid(s))return;
  if(!dg&&!s.play){state=null;element('btPay').disabled=false;return;}
  s.play=true;s.dg=dg;
  element('payNote').textContent='🔒 Google Play';
  // Do not show a hard-coded INR price in place of the store's actual price.
  element('payS').textContent=say('checking');
  element('btPay').textContent=say('retry');
  var restore=element('btPlayRestore');
  if(!restore){restore=document.createElement('button');restore.id='btPlayRestore';restore.className='btn';element('btPay').after(restore);}
  restore.textContent=say('retry');restore.onclick=function(){if(!busy)w.sdPlayShow();};restore.disabled=true;
  element('errP').style.display='none';
  try{
   if(!dg||!w.PaymentRequest||!sku[s.report])throw new Error('unavailable');
   var purchases=await timed(dg.listPurchases());guard(s);
   if(!Array.isArray(purchases))throw new Error('invalid purchase list');
   var p=purchases.find(function(x){return x.itemId===sku[s.report];});
   if(p){s.pending=true;complete(s,await verify(s,p));return;}
   var products=await timed(dg.getDetails([sku[s.report]]));guard(s);
   var product=products.find(function(x){return x.itemId===sku[s.report];});
   if(!product||!product.price||!product.price.currency||!isFinite(Number(product.price.value))||Number(product.price.value)<0)throw new Error('product unavailable');
   var d=w.details();if(!d)throw new Error('details missing');
   s.product=product;s.details=JSON.stringify(d);s.ready=true;s.prepared=false;
   var amount=new Intl.NumberFormat(w.SD_LANG||'en',{style:'currency',currency:product.price.currency}).format(Number(product.price.value));
   element('payS').textContent=amount+' · '+w.RT+' · '+w.sdNotice('checkoutLock');
   element('btPay').textContent='Google Play · '+w.A('buy.continue');element('btPay').disabled=false;
  }catch(e){if(valid(s)){
   if(e.reason==='report details already locked'){element('errP').textContent=w.sdNotice('checkoutLocked');element('errP').style.display='block';}
   else showError(s.pending?'pending':'unavailable');
  }}finally{if(valid(s))restore.disabled=false;}
 };
 w.sdPlayPay=function(){
  var s=state;
  // Detection/preparation still running: never leak through to Razorpay.
  if(!s)return inWrapper()?(w.sdPlayShow(),true):false;
  if(!valid(s)||!s.ready||busy)return true;
  if(JSON.stringify(w.details())!==s.details){w.sdPlayShow();return true;}
  busy=true;s.ready=false;element('btPay').disabled=true;element('btPlayRestore').disabled=true;
  if(!s.prepared){
   // Explicit confirmation saves the chart. The next tap opens Play synchronously.
   api(s,'play_prepare',{details:w.details()}).then(function(j){
    if(j.already){complete(s,j);return;}
    if(j.productId!==sku[s.report])throw new Error('sku mismatch');
    s.prepared=true;s.ready=true;
    element('btPay').textContent='Google Play · '+w.A('buy.pay');element('btPay').disabled=false;
   }).catch(function(e){if(valid(s)){
    if(e.reason==='report details already locked'){element('errP').textContent=w.sdNotice('checkoutLocked');element('errP').style.display='block';}
    else showError('unavailable');
   }}).finally(function(){busy=false;if(valid(s))element('btPlayRestore').disabled=false;});
   return true;
  }
  var response;
  try{
   var request=new w.PaymentRequest([{supportedMethods:STORE,data:{sku:sku[s.report]}}],{total:{label:w.RT,amount:s.product.price}});
   // Called synchronously within the tap: preserves browser user activation.
   request.show().then(async function(r){
    response=r;guard(s);s.pending=true;
    var j=await verify(s,{itemId:sku[s.report],purchaseToken:r.details.purchaseToken});
    try{await r.complete('success');}catch(e){}
    complete(s,j);
   }).catch(async function(){
    if(response)try{await response.complete('unknown');}catch(e){}
    if(valid(s))showError('pending');
   }).finally(function(){
    busy=false;if(valid(s)){element('btPlayRestore').disabled=false;element('btPay').textContent=say('retry');element('btPay').disabled=true;}
   });
  }catch(e){busy=false;showError('unavailable');element('btPlayRestore').disabled=false;}
  return true;
 };
})(window);
