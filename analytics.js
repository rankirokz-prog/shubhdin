/* ══ SHUBH DIN · analytics ═════════════════════════════════════════════════

   Two rules this file exists to enforce, both of them hard:

   1. IT CAN NEVER BREAK THE APP.
      Every entry point is wrapped. A failure here must be completely
      invisible to the user. This app has already lost whole features to a
      single unguarded throw at the top of a script — analytics, of all
      things, must not become the fourth.

   2. IT NEVER SENDS PERSONAL DATA.
      No name, no phone, no birth date, no birth time, no city, no auth uid.
      Not filtered at the query — refused at the door, by a whitelist, so
      that a future careless call site cannot leak anything either. The
      identifier is a random per-install string with no link to the login,
      so an event cannot be traced back to a person or an order.

      This is not only good manners: it is what makes the Play Data Safety
      declaration honest.

   Design: events queue in localStorage and flush in batches, because the
   people using this app are often on a weak connection and an event lost to
   a dropped request is a decision made on bad data. Nothing blocks the UI. */

(function (g) {
  'use strict';

  var SUPA = 'https://dulfiljhfchkccqwqniv.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bGZpbGpoZmNoa2NjcXdxbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTQ0OTQsImV4cCI6MjA5MDYzMDQ5NH0.et_SeR8w5nLbWMIbIHvix8EYpvPI8-dPHmXQr78ocnM';

  var QKEY = 'sd_evq';        // pending events
  var IDKEY = 'sd_anon_id';   // random install id
  var MAX_QUEUE = 200;        // never grow without bound on a dead connection
  var BATCH = 20;
  var FLUSH_MS = 15000;

  /* ── the privacy door ──────────────────────────────────────────────────
     Only these prop keys may leave the device. Anything else is dropped
     silently. Add to this list deliberately, never casually, and never add
     anything that identifies a person. */
  var ALLOWED = {
    src: 1,
    state: 1, card: 1, surface: 1, source: 1, report: 1, screen: 1,
    count: 1, ok: 1, reason: 1, method: 1, kind: 1, tab: 1,
    msg: 1, err: 1, file: 1, line: 1, verse: 1, tithi: 1, paksha: 1, day: 1,
    ms: 1, n: 1, from: 1, to: 1, value: 1
  };
  /* Belt and braces: even an allowed key is dropped if the VALUE looks
     personal. A phone number or a date of birth arriving in props means a
     call site is wrong, and the fix is to lose the event, not the privacy. */
  /* C2a · what the door refuses, by shape. Phones, dates in either order
     with -, / or . as the separator, emails, credential-shaped text and
     JWTs. A value matching ANY of these drops the whole event. */
  var PHONEISH = /(?:\+?\d[\s-]?){9,}/;
  var DATEISH  = /\b(19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/;      // 1990-05-05, 1990.05.05
  var DATEISH2 = /\b\d{1,2}[-/.]\d{1,2}[-/.](19|20)\d{2}\b/;      // 05.05.1990, 5/5/1990
  var EMAILISH = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  var TOKENISH = /(access_token|refresh_token|apikey|api_key|bearer|authorization|write_key)\s*[=:]/i;
  var JWTISH   = /\beyJ[A-Za-z0-9_-]{10,}/;
  function looksPersonal(s) {
    return PHONEISH.test(s) || DATEISH.test(s) || DATEISH2.test(s) || EMAILISH.test(s) || TOKENISH.test(s) || JWTISH.test(s);
  }

  function clean(props) {
    var out = {};
    if (!props || typeof props !== 'object') return out;
    for (var k in props) {
      if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
      if (!ALLOWED[k]) continue;
      var v = props[k];
      if (v === null || v === undefined) continue;
      if (typeof v === 'object') continue;            // no nested payloads
      var s = String(v);
      if (s.length > 200) s = s.slice(0, 200);
      if (looksPersonal(s)) continue;
      out[k] = (typeof v === 'number' || typeof v === 'boolean') ? v : s;
    }
    return out;
  }

  function rand() {
    try {
      if (g.crypto && g.crypto.randomUUID) return g.crypto.randomUUID();
    } catch (e) {}
    return 'x' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function anonId() {
    try {
      var v = localStorage.getItem(IDKEY);
      if (!v) { v = rand(); localStorage.setItem(IDKEY, v); }
      return v;
    } catch (e) { return 'nostore'; }
  }

  var SESSION = rand();

  /* ══ REFERRAL SOURCE ══
     The Kundli gift link carries ?src=kundli_share. Without something reading
     it the tag is decorative — it would sit in the address bar and never reach
     a table. Capture it ONCE per install, on first arrival, and attach it to
     every event afterwards so v_daily can show what the viral loop actually
     produced.
     It is a short whitelisted token, never a full URL, so no query string a
     user was sent can smuggle anything into the events table. */
  var SRC = (function () {
    try {
      var m = String(location.search || '').match(/[?&]src=([a-z0-9_]{1,24})/i);
      if (m) { localStorage.setItem('sd_src', m[1]); return m[1]; }
      return localStorage.getItem('sd_src') || '';
    } catch (e) { return ''; }
  })();

  function ctx() {
    var lang = 'hi', ver = '', plat = 'browser';
    try { lang = (g.SD_LANG) || (JSON.parse(localStorage.getItem('shubhdin_user') || '{}').lang) || 'hi'; } catch (e) {}
    try { ver = (g.SD_BUILD || document.documentElement.getAttribute('data-build') || ''); } catch (e) {}
    try {
      if (g.matchMedia && g.matchMedia('(display-mode: standalone)').matches) plat = 'pwa';
      else if (g.navigator && g.navigator.standalone) plat = 'pwa';
    } catch (e) {}
    return { lang: String(lang).slice(0, 5), app_version: String(ver).slice(0, 20), platform: plat };
  }

  function readQ() {
    try { var a = JSON.parse(localStorage.getItem(QKEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function writeQ(a) {
    try { localStorage.setItem(QKEY, JSON.stringify(a.slice(-MAX_QUEUE))); } catch (e) {}
  }

  var sending = false;

  function flush(useKeepalive) {
    if (sending) return;
    var q = readQ();
    if (!q.length) return;
    var batch = q.slice(0, BATCH);
    sending = true;
    var opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON,
        Authorization: 'Bearer ' + ANON,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(batch)
    };
    /* keepalive lets the last batch survive the page being closed, which is
       exactly when the most interesting events happen. sendBeacon cannot be
       used because it will not carry the apikey header. */
    if (useKeepalive) opts.keepalive = true;

    try {
      fetch(SUPA + '/rest/v1/events', opts)
        .then(function (r) {
          sending = false;
          if (r && (r.ok || r.status === 201)) {
            var rest = readQ().slice(batch.length);
            writeQ(rest);
            if (rest.length) flush(false);      // keep draining
          }
          /* on failure the batch stays queued and is retried later */
        })
        .catch(function () { sending = false; });
    } catch (e) { sending = false; }
  }

  function track(event, props) {
    try {
      if (!event) return;
      var c = ctx();
      var q = readQ();
      var p = clean(props);
      if (SRC && !p.src) p.src = SRC;
      q.push({
        anon_id: anonId(),
        session_id: SESSION,
        event: String(event).slice(0, 60),
        props: p,
        lang: c.lang,
        app_version: c.app_version,
        platform: c.platform
      });
      writeQ(q);
      if (q.length >= BATCH) flush(false);
    } catch (e) { /* analytics must never surface */ }
  }

  /* ── automatic events ────────────────────────────────────────────────── */

  /* C2b · Error messages are the one field that can carry arbitrary user
     data ("…at user Ram, dob 05.05.1990"), and a name cannot be caught by a
     regex. So the raw message never leaves the device. What goes: the error
     NAME, the first 60 characters with every digit masked to # and every
     non-ASCII character removed (browser/engine messages are English; an
     Indic-script name in a message is user data by definition), plus the
     script and line. That still says WHICH error and WHERE — the diagnostic
     value — and cannot say who. If even the masked text still looks
     personal, the whole event is dropped by the door above. */
  function errShape(msg) {
    return String(msg || 'error').replace(/[^\x20-\x7E]/g, '').replace(/\d/g, '#').replace(/\s+/g, ' ').trim().slice(0, 60);
  }
  /* The door must see the RAW text: once digits are masked, "dob 05.05.1990"
     reads as "dob ##.##.####" and no longer looks like a date — and the name
     beside it would sail through. A personal-looking message is not sent at
     all; the error name, file and line still are. */
  function errProps(name, msg, file, line) {
    var raw = String(msg || ''), p = { err: String(name || 'Error').slice(0, 40), file: file, line: line };
    if (!looksPersonal(raw)) p.msg = errShape(raw);
    return p;
  }
  /* Errors are the highest-value signal in this app. Three features have
     already died silently to an uncaught throw; this is how we find the
     fourth before a user has to tell us. */
  try {
    g.addEventListener('error', function (e) {
      try {
        /* Some throws are deliberate stops rather than faults — buy.html uses
           one to halt the script during a redirect. Reporting those would fill
           the error view with noise and hide the real failures, which is the
           one thing this signal exists to prevent. */
        if (e && e.error && e.error.sdIntentional) return;
        track('js_error', errProps((e && e.error && e.error.name), e && e.message,
          String((e && e.filename) || '').split('/').pop().slice(0, 60), (e && e.lineno) || 0));
        flush(false);
      } catch (x) {}
    });
    g.addEventListener('unhandledrejection', function (e) {
      try {
        var r = e && e.reason;
        track('js_error', errProps((r && r.name) || 'Rejection', (r && r.message) || r || 'rejection', 'promise', 0));
        flush(false);
      } catch (x) {}
    });
  } catch (e) {}

  try {
    g.addEventListener('pagehide', function () { try { flush(true); } catch (e) {} });
    document.addEventListener('visibilitychange', function () {
      try { if (document.visibilityState === 'hidden') flush(true); } catch (e) {}
    });
  } catch (e) {}

  try { setInterval(function () { try { flush(false); } catch (e) {} }, FLUSH_MS); } catch (e) {}

  g.sdTrack = track;
  g.sdFlush = flush;
  g.SD_ANALYTICS = { version: 2, session: SESSION, queued: function () { return readQ().length; },
                     /* exposed for the privacy gate only */ _clean: clean, _errShape: errShape };
})(window);
