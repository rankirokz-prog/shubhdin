/* v238: guarded startup and small, shared recovery messages. No engine rules. */
(function(w){
  'use strict';
  var langs=['en','hi','te','kn','ta','bn','mr','gu','as'];
  var copy={
    noResults:['No matching city found. Try another spelling.','शहर नहीं मिला। नाम की वर्तनी बदलकर खोजें।','నగరం కనబడలేదు. పేరు మరోలా రాసి ప్రయత్నించండి.','ನಗರ ಸಿಗಲಿಲ್ಲ. ಹೆಸರನ್ನು ಬೇರೆ ರೀತಿಯಲ್ಲಿ ಬರೆದು ಪ್ರಯತ್ನಿಸಿ.','நகரம் கிடைக்கவில்லை. பெயரை வேறு விதமாக எழுதி முயலவும்.','শহর পাওয়া যায়নি। নামের বানান বদলে খুঁজুন।','शहर सापडले नाही. नाव वेगळ्या पद्धतीने लिहून शोधा.','શહેર મળ્યું નથી. નામની જોડણી બદલીને શોધો.','চহৰ পোৱা নগ’ল। নামৰ বানান সলাই বিচাৰক।'],
    city:['Choose city','शहर चुनें','నగరాన్ని ఎంచుకోండి','ನಗರವನ್ನು ಆಯ್ಕೆಮಾಡಿ','நகரத்தைத் தேர்ந்தெடுக்கவும்','শহর বেছে নিন','शहर निवडा','શહેર પસંદ કરો','চহৰ বাছনি কৰক'],
    back:['Back','वापस','వెనక్కి','ಹಿಂದೆ','பின்செல்','ফিরুন','मागे','પાછા','উভতি যাওক'],
    retry:['Retry','फिर कोशिश करें','మళ్లీ ప్రయత్నించండి','ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ','மீண்டும் முயலவும்','আবার চেষ্টা করুন','पुन्हा प्रयत्न करा','ફરી પ્રયાસ કરો','আকৌ চেষ্টা কৰক'],
    unavailable:['Current data unavailable. Check your city and connection.','वर्तमान जानकारी उपलब्ध नहीं है। अपना शहर और इंटरनेट जाँचें।','ప్రస్తుత సమాచారం అందుబాటులో లేదు. మీ నగరం, ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేయండి.','ಪ್ರಸ್ತುತ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ನಿಮ್ಮ ನಗರ ಮತ್ತು ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.','தற்போதைய தகவல் கிடைக்கவில்லை. உங்கள் நகரத்தையும் இணைய இணைப்பையும் சரிபார்க்கவும்.','বর্তমান তথ্য পাওয়া যাচ্ছে না। আপনার শহর ও ইন্টারনেট সংযোগ দেখুন।','सध्याची माहिती उपलब्ध नाही. तुमचे शहर आणि इंटरनेट तपासा.','હાલની માહિતી ઉપલબ્ધ નથી. તમારું શહેર અને ઇન્ટરનેટ તપાસો.','বৰ্তমানৰ তথ্য উপলব্ধ নহয়। আপোনাৰ চহৰ আৰু ইণ্টাৰনেট সংযোগ পৰীক্ষা কৰক।'],
    storage:['Could not save on this device. Allow site storage and try again.','इस डिवाइस पर सेव नहीं हो सका। साइट स्टोरेज की अनुमति देकर फिर कोशिश करें।','ఈ పరికరంలో సేవ్ చేయలేకపోయాం. సైట్ నిల్వకు అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి.','ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಸೈಟ್ ಸಂಗ್ರಹಣೆಗೆ ಅನುಮತಿ ನೀಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.','இந்தச் சாதனத்தில் சேமிக்க முடியவில்லை. தளச் சேமிப்பை அனுமதித்து மீண்டும் முயலவும்.','এই ডিভাইসে সেভ করা যায়নি। সাইট স্টোরেজের অনুমতি দিয়ে আবার চেষ্টা করুন।','या डिव्हाइसवर सेव्ह करता आले नाही. साइट स्टोरेजला परवानगी देऊन पुन्हा प्रयत्न करा.','આ ઉપકરણમાં સાચવી શકાયું નથી. સાઇટ સ્ટોરેજની મંજૂરી આપી ફરી પ્રયાસ કરો.','এই ডিভাইচত সংৰক্ষণ কৰিব পৰা নগ’ল। ছাইট ষ্টোৰেজৰ অনুমতি দি আকৌ চেষ্টা কৰক।'],
    searching:['Searching…','खोज रहे हैं…','వెతుకుతున్నాం…','ಹುಡುಕಲಾಗುತ್ತಿದೆ…','தேடப்படுகிறது…','খোঁজা হচ্ছে…','शोधत आहोत…','શોધી રહ્યા છીએ…','বিচাৰি থকা হৈছে…'],
    chart:['Birth chart','जन्म कुंडली','జన్మ జాతకం','ಜನ್ಮ ಕುಂಡಲಿ','பிறப்பு ஜாதகம்','জন্মকুণ্ডলী','जन्मकुंडली','જન્મકુંડળી','জন্মকুণ্ডলী'],
    chartPending:['Calculated after valid city details are saved','शहर की सही जानकारी सहेजने के बाद गणना होगी','సరైన నగర వివరాలు సేవ్ చేసిన తర్వాత లెక్కిస్తాం','ಸರಿಯಾದ ನಗರ ವಿವರಗಳನ್ನು ಉಳಿಸಿದ ನಂತರ ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ','சரியான நகர விவரங்களைச் சேமித்த பிறகு கணக்கிடப்படும்','সঠিক শহরের তথ্য সেভ করার পর গণনা হবে','शहराची योग्य माहिती सेव्ह केल्यानंतर गणना होईल','શહેરની સાચી વિગતો સાચવ્યા પછી ગણતરી થશે','চহৰৰ সঠিক তথ্য সংৰক্ষণ কৰাৰ পিছত গণনা কৰা হ’ব'],
    nameRequired:['Please enter your name','कृपया अपना नाम भरें','దయచేసి మీ పేరు నమోదు చేయండి','ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ','உங்கள் பெயரை உள்ளிடவும்','অনুগ্রহ করে আপনার নাম লিখুন','कृपया तुमचे नाव भरा','કૃપા કરીને તમારું નામ દાખલ કરો','অনুগ্ৰহ কৰি আপোনাৰ নাম লিখক'],
    privacy:['Your details are stored on this device and synced to our servers.','आपकी जानकारी इस डिवाइस पर सेव होती है और हमारे सर्वर से सिंक होती है।','మీ వివరాలు ఈ పరికరంలో సేవ్ అవుతాయి, మా సర్వర్‌లకు కూడా పంపబడతాయి.','ನಿಮ್ಮ ವಿವರಗಳು ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಯುತ್ತವೆ ಮತ್ತು ನಮ್ಮ ಸರ್ವರ್‌ಗಳಿಗೆ ಸಿಂಕ್ ಆಗುತ್ತವೆ.','உங்கள் விவரங்கள் இந்தச் சாதனத்தில் சேமிக்கப்பட்டு எங்கள் சேவையகங்களுடனும் ஒத்திசைக்கப்படும்.','আপনার তথ্য এই ডিভাইসে সেভ হয় এবং আমাদের সার্ভারের সঙ্গেও সিঙ্ক হয়।','तुमची माहिती या डिव्हाइसवर सेव्ह होते आणि आमच्या सर्व्हरशी सिंक होते.','તમારી વિગતો આ ઉપકરણમાં સાચવાય છે અને અમારા સર્વર સાથે સિંક થાય છે.','আপোনাৰ তথ্য এই ডিভাইচত সংৰক্ষিত হয় আৰু আমাৰ চাৰ্ভাৰৰ সৈতেও ছিংক হয়।']
  };
  w.sdSafeProfile=function(value){
    var u=value;
    if(arguments.length===0){try{u=JSON.parse(localStorage.getItem('shubhdin_user')||'{}');}catch(e){u={};}}
    if(!u||typeof u!=='object'||Array.isArray(u))u={};
    if(langs.indexOf(u.lang)<0)u.lang='hi';
    u.setupDone=u.setupDone===true;
    return u;
  };
  w.sdNotice=function(key,lang){var i=langs.indexOf(lang||w.SD_LANG||w.sdSafeProfile().lang);return (copy[key]||copy.unavailable)[i<0?0:i];};
  w.sdFetch=function(url,opts,ms){
    opts=Object.assign({},opts||{});var ctl=typeof AbortController==='function'?new AbortController():null;
    if(ctl)opts.signal=ctl.signal;
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){if(ctl)ctl.abort();reject(new Error('Request timed out'));},ms||10000);
      fetch(url,opts).then(function(r){clearTimeout(timer);resolve(r);},function(e){clearTimeout(timer);reject(e);});
    });
  };
  /* Runs before fonts, analytics or engine downloads. Never steal auth callbacks. */
  var path=location.pathname, auth=/[?&](code|error)=/.test(location.search)||/access_token=/.test(location.hash);
  if(!auth&&(/\/(index|dashboard)\.html$/.test(path)||path==='/')){
    var u=w.sdSafeProfile(),index=!/dashboard\.html$/.test(path),dest=index&&u.setupDone?'dashboard.html':!index&&!u.setupDone?'index.html':'';
    if(dest){
      document.documentElement.style.visibility='hidden';
      w.__sdBootRedirect=true;
      setTimeout(function(){document.documentElement.style.visibility='';},4000);
      location.replace(dest);
    }
  }
})(window);
