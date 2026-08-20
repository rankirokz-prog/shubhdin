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
    // is cleared rather than silently used to compute a chart.
    if (el.value && el.value > max) {
      el.value = '';
      flag(el, true);
    }
  }

  function flag(el, on) {
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
    var hi = (document.documentElement.lang === 'hi');
    w.textContent = hi
      ? 'जन्म तिथि आज या उससे पहले की होनी चाहिए।'
      : 'A birth date has to be today or earlier.';
  }

  function check(e) {
    var el = e.target;
    if (!isBirthField(el)) return;
    var bad = !!el.value && el.value > today();
    flag(el, bad);
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
})();
