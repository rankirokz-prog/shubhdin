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
    /* 'window' spans BOTH tables: cleanWindows() returns choghadiya segments
       AND named muhurtas (Abhijit, Amrit, Brahma). Passing them all to the
       choghadiya table missed on every muhurta and returned its Hindi. */
    if (kind === 'window') return null;   // handled by sdWindow below
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
    if (e && l === 'en') return en;        /* the key IS the English name */
    if (e && e.hi && l !== 'en') return e.hi;
    /* A MISS IS A DEFECT, NOT A FALLBACK.

       This used to return the input unchanged, so sdChog('उद्वेग') gave back
       उद्वेग and sdChog(muhurtaWindow) gave back its Hindi — Devanagari on a
       Telugu screen, with nothing logged and nothing thrown. Every wrong-table
       and wrong-argument bug in this bridge was invisible for that reason: the
       failure mode looked exactly like a deliberate fallback.

       Now every miss is recorded. On a non-English language the fallback still
       renders (a blank screen helps nobody), but the miss is counted, warned,
       and the leak gate asserts the count is ZERO before a language can ship. */
    g.SD_TERM_MISSES = g.SD_TERM_MISSES || [];
    g.SD_TERM_MISSES.push({ kind: kind, value: en, lang: l });
    if (g.console && g.console.warn)
      g.console.warn('[sdTerm] MISS kind=' + kind + ' value=' + JSON.stringify(en) + ' lang=' + l);
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
  /* A choghadiya segment can also be a named muhurta (Abhijit, Brahma…) —
     the hub's "first clean window" passes both. Route through sdWindow so a
     named muhurta resolves from its own table instead of missing. */
  g.sdChog    = function (v, l) { return g.sdWindow(v, l); };
  g.sdHora    = function (v, l) { return g.sdTerm('hora', v, l); };
  g.sdRitu    = function (v, l) { return g.sdTerm('ritu', v, l); };
  g.sdMasa    = function (v, l) { return g.sdTerm('masa', v, l); };
  g.sdPaksha  = function (v, l) { return g.sdTerm('paksha', v, l); };
  g.sdAyana   = function (v, l) { return g.sdTerm('ayana', v, l); };
  g.sdVrat    = function (v, l) { return g.sdTerm('vrat', v, l); };
  g.sdTara    = function (v, l) { return g.sdTerm('tara', v, l); };
  g.sdTaraV   = function (v, l) { return g.sdTerm('taraVerdict', v, l); };
  g.sdQuality = function (v, l) { return g.sdTerm('rashiQuality', v, l); };
  /* Try choghadiya, then the named muhurtas, then the app string table —
     without recording a miss for simply being in the other table. */
  g.sdWindow  = function (v, l) {
    var en = (typeof v === 'object') ? (v.en || v.name || '') : String(v);
    var U = g.SD_UI || {}, P = g.SD_PANCHANG_TERMS || {};
    var e = findEntry(U.chogh, en) || findEntry(P.muhurtaName, en) || findEntry(P.ritu, en);
    l = l || lang();
    if (e && e[l]) return e[l];
    if (e && e.hi && l !== 'en') return e.hi;
    return g.sdTerm('choghadiya', v, l);   // records a miss if genuinely unknown
  };
})(typeof window !== 'undefined' ? window : global);
