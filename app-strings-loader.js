/* ══════════════════════════════════════════════════════════════════════
   APP-STRINGS LOADER — resolves one string in the reader's language.

   Pages load two files: app-strings-hi.js (the fallback) and the file for
   the chosen language. Nobody downloads eight languages they cannot read —
   measured at 120 KB saved per page load against a single combined file.

   Resolution order: chosen -> hi -> en -> the key itself. A string still
   awaiting translation renders in Hindi, never blank and never "undefined".
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  function lang() { return g.SD_LANG || 'hi'; }
  function table(lang) { return g['SD_APP_' + String(lang || '').toUpperCase()] || null; }

  /* A(key) — the string in the current language. */
  g.A = function (key, lang) {
    lang = lang || g.SD_LANG || 'hi';
    var t = table(lang), v = t && t[key];
    if (v) return v;
    var h = table('hi'); if (h && h[key]) return h[key];
    var e = table('en'); if (e && e[key]) return e[key];
    /* No table has the key — which in practice means no table LOADED, because
       a file failed to upload or a stale service-worker page is asking for one
       that isn't there yet. Returning the key painted "dashbo.astrology_today"
       across the screen. Keys are minted from the English text, so humanising
       one recovers readable English instead: a degraded screen a devotee can
       still use, rather than developer codes. */
    return key.replace(/^[a-z]+\./, '')
              .replace(/_/g, ' ')
              .replace(/^./, function (c) { return c.toUpperCase(); });
  };

  /* AF(key, vals) — same, with {tokens} filled. Word order lives in the
     translated string, which is the only place it can be decided. */
  g.AF = function (key, vals, lang) {
    return String(g.A(key, lang)).replace(/\{(\w+)\}/g, function (_, k) {
      return (vals && vals[k] !== undefined && vals[k] !== null) ? vals[k] : '';
    });
  };

  /* AP(key, n, vals) — counted nouns. Telugu, Kannada and Tamil inflect the
     unit with the count; Hindi does not, which is why concatenation looked
     correct for so long. Keys are "<key>" and "<key>_one". */
  g.AP = function (key, n, vals, lang) {
    var k = (Number(n) === 1 && g.A(key + '_one', lang) !== key + '_one') ? key + '_one' : key;
    var o = {}; if (vals) for (var p in vals) o[p] = vals[p];
    o.n = n;
    return g.AF(k, o, lang);
  };

  /* A missing table is invisible until someone reads a humanised key off a
     screenshot and works backwards. Say it once, loudly, in the console —
     the difference between "the translations are broken" and "a file did not
     upload" is one line of output. */
  (function () {
    setTimeout(function () {
      var have = ['en','hi','te','kn','ta','bn','mr','gu','as'].filter(function (l) { return !!table(l); });
      if (!have.length) {
        console.error('[shubhdin] NO STRING TABLE LOADED. Every label is falling back to a '
          + 'humanised key. Check that app-strings-hi.js and app-strings-' + lang()
          + '.js are on the server and not 404ing, and that the service worker is not '
          + 'serving a stale asset list.');
      } else if (have.indexOf(lang()) < 0 && lang() !== 'en') {
        console.warn('[shubhdin] app-strings-' + lang() + '.js did not load — showing '
          + (have.indexOf('hi') >= 0 ? 'Hindi' : have[0]) + ' instead. Loaded: ' + have.join(','));
      }
    }, 1500);
  })();

  /* Which languages actually arrived — for the leak gate and for Settings,
     so a half-translated language is not offered as if it were finished. */
  g.sdLoadedLangs = function () {
    return ['en','hi','te','kn','ta','bn','mr','gu','as'].filter(function (l) { return !!table(l); });
  };
})(typeof window !== 'undefined' ? window : global);
