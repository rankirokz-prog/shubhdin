/* ══════════════════════════════════════════════════════════════════
   BIRTH-DATE GUARD

   Two separate bugs this fixes:

   1. Future birth dates. Several forms accepted a date after today, which
      the engine will happily compute a chart for — a plausible-looking
      kundli for someone not yet born.

   2. The signup picker was capped at max="2010-01-01" and min="1940-01-01".
      That silently locked out every child born after 2010 and every elder
      over about 85 — the two groups most likely to have a kundli made for
      them. A parent entering a newborn's details simply could not.

   `max` is set at RUNTIME, never hardcoded: a fixed max is correct on the
   day it ships and wrong the next morning.

   Fields are opted in with data-birthdate="1". Search fields — the panchang
   date picker, the muhurta from/to window — deliberately carry no such flag,
   because those legitimately look into the future and clamping them would
   break the feature.

   A MutationObserver covers inputs created after load (the shared birth
   profile form, the buy flow's person blocks), so a field cannot escape the
   guard just by being rendered later.

   The attribute alone is not enough: several browsers still accept a typed
   or pasted out-of-range value and only report it via validity. So the value
   is also checked on input and on change.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  var MIN = '1900-01-01';
  var WARNINGS = {
    en: ['A birth date must be January 1, 1900 or later.', 'A birth date must be today or earlier.'],
    hi: ['जन्म तिथि 1 जनवरी 1900 या उसके बाद की होनी चाहिए।', 'जन्म तिथि आज या उससे पहले की होनी चाहिए।'],
    te: ['పుట్టిన తేదీ 1900 జనవరి 1 లేదా ఆ తర్వాత ఉండాలి.', 'పుట్టిన తేదీ ఈ రోజు లేదా అంతకు ముందు ఉండాలి.'],
    kn: ['ಜನ್ಮ ದಿನಾಂಕವು 1900ರ ಜನವರಿ 1 ಅಥವಾ ಅದರ ನಂತರ ಇರಬೇಕು.', 'ಜನ್ಮ ದಿನಾಂಕವು ಇಂದು ಅಥವಾ ಅದಕ್ಕಿಂತ ಮೊದಲು ಇರಬೇಕು.'],
    ta: ['பிறந்த தேதி ஜனவரி 1, 1900 அல்லது அதற்குப் பிறகு இருக்க வேண்டும்.', 'பிறந்த தேதி இன்று அல்லது அதற்கு முன்பாக இருக்க வேண்டும்.'],
    bn: ['জন্মতারিখ ১ জানুয়ারি ১৯০০ বা তার পরে হতে হবে।', 'জন্মতারিখ আজ বা তার আগে হতে হবে।'],
    mr: ['जन्मतारीख १ जानेवारी १९०० किंवा त्यानंतरची असावी.', 'जन्मतारीख आजची किंवा त्याआधीची असावी.'],
    gu: ['જન્મતારીખ 1 જાન્યુઆરી 1900 અથવા તે પછીની હોવી જોઈએ.', 'જન્મતારીખ આજની અથવા તે પહેલાંની હોવી જોઈએ.'],
    as: ['জন্মৰ তাৰিখ ১ জানুৱাৰী ১৯০০ বা তাৰ পিছৰ হ’ব লাগিব।', 'জন্মৰ তাৰিখ আজিৰ বা তাৰ আগৰ হ’ব লাগিব।']
  };

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function isBirthField(el) {
    if (!el || el.tagName !== 'INPUT' || el.type !== 'date') return false;
    if (el.hasAttribute('data-birthdate')) return true;
    // Fields built by string templates may not carry the flag. Recognise the
    // known birth-date ids so a dynamically rendered form is still covered.
    return /^(userDOB|settDob|bpDob|fDob|bdate|gdate|f_[a-z]+date)$/.test(el.id || '');
  }

  function clamp(el) {
    var max = today();
    el.setAttribute('min', MIN);
    el.setAttribute('max', max);
    // A value already out of range (restored from storage, typed, pasted)
    // is cleared rather than silently used to compute a chart. Both ends:
    // a pasted 1200-01-01 used to pass because only max was checked.
    if (el.value && (el.value > max || el.value < MIN)) {
      var tooEarly = el.value < MIN;
      el.value = '';
      flag(el, true, tooEarly);
    }
  }

  function flag(el, on, tooEarly) {
    el.style.borderColor = on ? '#E66E5A' : '';
    var id = 'bdWarn_' + (el.id || Math.random().toString(36).slice(2));
    var w = document.getElementById(id);
    if (!on) { if (w) w.remove(); return; }
    if (!w) {
      w = document.createElement('div');
      w.id = id;
      w.style.cssText = 'font-size:11.5px;color:#E66E5A;line-height:1.5;margin-top:5px;';
      (el.parentNode || document.body).insertBefore(w, el.nextSibling);
    }
    var lang = window.SD_LANG || document.documentElement.lang || 'en';
    lang = String(lang).toLowerCase().split('-')[0];
    w.textContent = (WARNINGS[lang] || WARNINGS.en)[tooEarly ? 0 : 1];
  }

  function check(e) {
    var el = e.target;
    if (!isBirthField(el)) return;
    var late = !!el.value && el.value > today(), early = !!el.value && el.value < MIN, bad = late || early;
    flag(el, bad, early);
    if (bad && e.type === 'change') el.value = '';
  }

  function sweep(root) {
    var list = (root || document).querySelectorAll ? (root || document).querySelectorAll('input[type="date"]') : [];
    for (var i = 0; i < list.length; i++) if (isBirthField(list[i])) clamp(list[i]);
  }

  function boot() {
    sweep(document);
    document.addEventListener('input', check, true);
    document.addEventListener('change', check, true);
    try {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType !== 1) continue;
            if (isBirthField(n)) clamp(n); else sweep(n);
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.sdClampBirthDates = function () { sweep(document); };

  /* F4 · `max` was stamped once at boot and never again. This is a PWA people
     leave open for days: a parent registering a newborn the morning after
     found "today" rejected with no explanation. Re-clamp whenever the page
     comes back into view — and at the next local midnight while it stays open. */
  try {
    var again = function () { try { sweep(document); } catch (e) {} };
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') again(); });
    window.addEventListener('focus', again);
    window.addEventListener('pageshow', again);
    (function midnight() {
      var now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      setTimeout(function () { again(); midnight(); }, Math.max(1000, next - now));
    })();
  } catch (e) {}
})();
