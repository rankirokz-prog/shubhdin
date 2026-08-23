/* ══════════════════════════════════════════════════════════════════════
   PANCHANG TERM BRIDGE — renders engine values in the reader's language.

   THE PROBLEM IT SOLVES
   The engine returns every panchang value as {hi, en} only. So a Telugu
   reader at 100% UI translation still met the panchang itself in Latin:
       Ekadashi · Mula · Vishkambha · Vanija · Char · Labh · Simha · Sunday
   On a panchang app that is the product, not the chrome.

   WHY THIS IS A LOOKUP AND NOT A TRANSLATION
   ui-strings.js already carries these terms in all nine languages, built for
   the report layer: tithi 16, nakshatra 28, yoga 27, karana 11, rashi 12,
   planet 9, weekday 7, masa 12, paksha 2. The engine says en="Ekadashi";
   SD_UI.tithi.Ekadashi.te is already ఏకాదశి. Nothing needed translating —
   only the two tables the reports never used (choghadiya, ritu), which are
   supplied in panchang-terms.js.

   Hora needs no table: the engine's hora cycle is planet names, and all seven
   are in the existing planet table.

   THE TERMS ARE TRANSLITERATED, NOT TRANSLATED. A Telugu reader looking for
   లాభ expects లాభ, not a descriptive word for "gain". Same ruling that governs
   tithi and nakshatra in the reports: the classical name IS the term.

   Falls back chosen -> hi -> en -> the engine's own value, so a missing entry
   shows what the engine said rather than a blank.
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  function lang() { return g.SD_LANG || 'hi'; }

  /* Where each kind of value lives. SD_UI is the report layer's table;
     SD_PANCHANG_TERMS holds the two it never needed. */
  function table(kind) {
    var U = g.SD_UI || {}, P = g.SD_PANCHANG_TERMS || {};
    /* Look in BOTH tables rather than hard-coding which kind lives where.
       Adding ayana to SD_PANCHANG_TERMS silently fell through because this
       list named only choghadiya and ritu — a list that has to be edited every
       time a table is added is a list that will be forgotten. */
    if (P[kind]) return P[kind];
    /* the report layer names it 'chogh'; the engine and the app call the
       concept choghadiya. One word, one table — theirs. */
    if (kind === 'choghadiya') return U.chogh || null;
    /* vrat and festival names — the only panchang vocabulary with no table
       anywhere until now. Note these are NOT pure transliterations: a festival
       someone actually observes takes their own word (Makar Sankranti is
       సంక్రాంతి, பொங்கல், মাঘ বিহু), which is why the lookup is by the engine's
       English key rather than by transliterating the Hindi. */
    if (kind === 'vrat' || kind === 'festival') return g.SD_VRAT_NAMES || null;
    if (kind === 'hora') return U.planet || null;      // hora lords are planets
    return U[kind] || null;
  }

  /* Entries are keyed by the engine's English string, but a couple of tables
     use lower-case keys (planet). Match case-insensitively on the key OR on
     the entry's own .en, so neither table has to be reshaped. */
  function findEntry(t, en) {
    if (!t || !en) return null;
    if (t[en]) return t[en];
    var want = String(en).toLowerCase();
    for (var k in t) {
      if (k.toLowerCase() === want) return t[k];
      if (t[k] && String(t[k].en || '').toLowerCase() === want) return t[k];
    }
    return null;
  }

  /* T(kind, value) — value may be the engine's object {en,hi,…} or a bare
     English string. Returns the reader's language. */
  g.sdTerm = function (kind, value, l) {
    l = l || lang();
    if (value == null) return '';
    var en = (typeof value === 'object') ? (value.en || '') : String(value);
    var e = findEntry(table(kind), en);
    if (e && e[l]) return e[l];
    if (e && e.hi && l !== 'en') return e.hi;
    /* nothing in the table: fall back to what the engine itself carries */
    if (typeof value === 'object') return (l === 'en' ? value.en : (value.hi || value.en)) || '';
    return en;
  };

  /* Convenience for the common shape — the app calls H?x.hi:x.en in dozens of
     places; this replaces that with something that knows nine languages. */
  g.sdTithi   = function (v, l) { return g.sdTerm('tithi', v, l); };
  g.sdNak     = function (v, l) { return g.sdTerm('nakshatra', v, l); };
  g.sdYoga    = function (v, l) { return g.sdTerm('yoga', v, l); };
  g.sdKarana  = function (v, l) { return g.sdTerm('karana', v, l); };
  g.sdRashi   = function (v, l) { return g.sdTerm('rashi', v, l); };
  g.sdVara    = function (v, l) { return g.sdTerm('weekday', v, l); };
  g.sdChog    = function (v, l) { return g.sdTerm('choghadiya', v, l); };
  g.sdHora    = function (v, l) { return g.sdTerm('hora', v, l); };
  g.sdRitu    = function (v, l) { return g.sdTerm('ritu', v, l); };
  g.sdMasa    = function (v, l) { return g.sdTerm('masa', v, l); };
  g.sdPaksha  = function (v, l) { return g.sdTerm('paksha', v, l); };
  g.sdAyana   = function (v, l) { return g.sdTerm('ayana', v, l); };
  g.sdVrat    = function (v, l) { return g.sdTerm('vrat', v, l); };
})(typeof window !== 'undefined' ? window : global);
