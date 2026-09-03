/* ══════════════════════════════════════════════════════════════════════
   FONT LOADER — loads the Noto Serif face for the reader's script only.

   WHY: DEVICE CONSISTENCY — not broken letterforms today.

   The app shell loads NO Indic webfont except on index.html, so a Telugu or
   Tamil reader gets whatever their device happens to have. Tested on a real
   Android phone, that device shaped all six scripts correctly on its own — so
   the claim that conjuncts are breaking today is NOT established, and this
   loader is not fixing a live rendering fault.

   What it fixes is variance. Android font coverage differs by manufacturer,
   OS version and region; budget and older devices routinely ship without
   faces for scripts outside their sale market, and iOS covers a different set
   again. Without a webfont, a Telugu reader on one phone sees correct
   letterforms and on another sees per-character fallback — and we would have
   no way to know which. Shipping the face makes every device render the same
   thing.

   The secondary gain is that it is OUR typeface rather than the system's, so
   a devotional heading looks the same everywhere, matching the reports.

   ONE face, not six. Six serif families on every page load is real weight on
   Indian mobile data, and nobody reads eight scripts at once. Devanagari loads
   alongside because Hindi is the fallback language for any string not yet
   translated — without it, a partially translated Telugu screen would show
   Hindi in a substituted face.

   display=block, not swap: a devotional heading flashing from a broken
   fallback into the correct face looks worse than a brief blank.
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  var FACE = {
    hi: 'Noto+Serif+Devanagari',
    mr: 'Noto+Serif+Devanagari',   // Marathi shares the Devanagari script
    te: 'Noto+Serif+Telugu',
    kn: 'Noto+Serif+Kannada',
    ta: 'Noto+Serif+Tamil',
    bn: 'Noto+Serif+Bengali',
    as: 'Noto+Serif+Bengali',      // Assamese uses the Bengali-Assamese script
    gu: 'Noto+Serif+Gujarati',
    en: null
  };
  var CSS_NAME = {
    'Noto+Serif+Devanagari': 'Noto Serif Devanagari',
    'Noto+Serif+Telugu': 'Noto Serif Telugu',
    'Noto+Serif+Kannada': 'Noto Serif Kannada',
    'Noto+Serif+Tamil': 'Noto Serif Tamil',
    'Noto+Serif+Bengali': 'Noto Serif Bengali',
    'Noto+Serif+Gujarati': 'Noto Serif Gujarati'
  };

  function lang() {
    try { return (JSON.parse(localStorage.getItem('shubhdin_user') || '{}').lang) || 'hi'; }
    catch (e) { return 'hi'; }
  }

  g.sdLoadFonts = function (l) {
    l = l || lang();
    var want = [];
    if (FACE[l]) want.push(FACE[l]);
    if (FACE.hi && want.indexOf(FACE.hi) < 0) want.push(FACE.hi);   // fallback language
    if (!want.length) return [];

    var href = 'https://fonts.googleapis.com/css2?' +
      want.map(function (f) { return 'family=' + f + ':wght@400;500;600;700'; }).join('&') +
      '&display=block';
    if (document.querySelector('link[data-sd-fonts]')) return want;

    var link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; link.setAttribute('data-sd-fonts', l);
    document.head.appendChild(link);

    /* Put the face at the front of the stack for elements that carry Indic
       text, so it is actually used rather than merely downloaded. */
    var fams = want.map(function (f) { return '"' + CSS_NAME[f] + '"'; }).join(',');
    /* D2 · For a language with its own face the rule may own the page. For
       English there is no face of its own — only the Devanagari fallback
       face, loaded so that mantra text (.dev) still shapes correctly. That
       face must NOT be put in front of Poppins for the whole body, or every
       English reader sees the UI in a Devanagari serif's Latin glyphs. So
       for 'en' the rule is scoped to .dev; the load itself is unchanged. */
    var sel = FACE[l] ? '.dev,[lang],body' : '.dev';
    var st = document.createElement('style');
    st.textContent = sel + '{font-family:' + fams + ",'Poppins',sans-serif;}";
    document.head.appendChild(st);
    return want;
  };

  /* Did the face actually arrive AND shape? document.fonts.check() returns
     true even when the stylesheet request failed outright — verified: it said
     true against a 403 with zero registered faces. So the check compares the
     rendered width of a conjunct against the same text in a generic serif.
     Identical widths mean the webfont never applied. */
  g.sdFontsShaped = function (sample) {
    sample = sample || { te: 'విద్య', ta: 'வித்யா', kn: 'ವಿದ್ಯ', bn: 'বিদ্যা',
                         gu: 'વિદ્યા', hi: 'विद्या', as: 'বিদ্যা' }[lang()] || 'विद्या';
    function w(fam) {
      var e = document.createElement('span');
      e.style.cssText = 'font-family:' + fam + ';font-size:32px;white-space:nowrap;position:absolute;visibility:hidden';
      e.textContent = sample; document.body.appendChild(e);
      var x = e.getBoundingClientRect().width; e.remove(); return x;
    }
    var f = CSS_NAME[FACE[lang()]] || 'Noto Serif Devanagari';
    var withFace = w('"' + f + '",serif'), generic = w('serif');
    return { face: f, applied: Math.abs(withFace - generic) > 1,
             shapedWidth: Math.round(withFace), genericWidth: Math.round(generic) };
  };
})(window);
