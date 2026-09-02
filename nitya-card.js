/* ═══════════════════════════════════════════════════════════════════════════
   nitya-card.js — Shubh Din · daily Sri Chakra / Nitya card

   Needs, in this order on the page:
     srichakra-draw.js      window.sdSriChakra
     daily-nitya.js         window.SD_NITYA, window.SD_NITYA_CFG
     app-strings-loader.js  A()  (labels; humanised-key fallback if absent)

   Plugs into the Gita slot: applyHomeState() calls sdNityaMount(el, ctx) and
   if it returns false, renders the Gita card into the same slot as before.
   Nothing about the Gita is deleted. Slot content is decided by data:

     entry complete in the reader's language  → Nitya card
     otherwise                                → Gita card

   ctx = { tithi: 1..15, paksha: 'shukla'|'krishna', lang: 'te',
           dateLabel: 'कृष्ण चतुर्थी',        // the strip's tithi text
           date: Date | 'YYYY-MM-DD' }        // the strip's civil date for this Vedic day
   tithi / paksha / date come from the engine's Vedic day (sunrise-anchored),
   the same object the panchang strip renders from. Never from Date.getDate()
   or new Date() — between midnight and sunrise they disagree, and a forwarded
   card with the wrong date is worse than one with no date.

   No mantra. No remedy. No prescription. See the spec.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else Object.assign(root, factory());
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
  /* Shubh Din's A() does NOT return the key on a miss: it returns "[key]" or a
     humanised "Today title". Both are truthy. Ask sdHas() first; belt-and-braces
     reject bracketed values. (Merge side re-applied this three times — keep it.) */
  function A_(k, fb) {
    try {
      if (typeof g.sdHas === 'function' && !g.sdHas(k)) return fb;
      if (typeof g.A === 'function') { var v = g.A(k); if (v && v !== k && !/^\[.*\]$/.test(v)) return v; }
    } catch (e) {}
    return fb;
  }
  /* string in the reader's language: app sheet first, then the nine-language table in daily-nitya.js, else '' — never English */
  function S_(key, lang, sheetKey) {
    var v = sheetKey ? A_(sheetKey, '') : '';
    if (v) return v;
    var t = g.SD_NITYA_STRINGS && g.SD_NITYA_STRINGS[key]; return (t && t[lang]) || '';
  }
  /* the civil date in the reader's language: "मंगलवार, 1 सितंबर 2026".
     Uses the platform's own locale data; digits as the locale prefers. */
  var LOCALE = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN', kn: 'kn-IN', ta: 'ta-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', as: 'as-IN' };
  function sdNityaDateText(ctx, lang, short) {
    var d = ctx && ctx.date; if (!d) return '';
    if (typeof d === 'string') { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d); d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(d); }
    if (!d || typeof d.getTime !== 'function' || isNaN(d.getTime())) return '';   // duck-typed: cross-realm Dates are not instanceof Date
    try {
      return new Intl.DateTimeFormat(LOCALE[lang] || 'en-IN', short ? { day: 'numeric', month: 'long', year: 'numeric' }
                                                                     : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch (e) { return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
  }
  /* "कृष्ण चतुर्थी · मंगलवार, 1 सितंबर 2026" — whichever parts exist */
  function sdNityaWhen(ctx, lang, short) {
    return [ctx.dateLabel, sdNityaDateText(ctx, lang, short)].filter(Boolean).join(' · ');
  }
  /* श्री … देवी — the honorific form, or the bare name if the template is missing */
  function sdNityaName(entry, lang) {
    var n = entry && entry.name && entry.name[lang]; if (!n) return '';
    var h = S_('honorific', lang); return h ? h.replace('{name}', n) : n;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ── which Nitya today ─────────────────────────────────────────────────
     Returns { entry, station } or null. station is 0 for the bindu. */
  function sdNityaOfDay(tithi, paksha, cfg, data) {
    cfg = cfg || g.SD_NITYA_CFG || {}; data = data || g.SD_NITYA || [];
    tithi = parseInt(tithi, 10);
    if (!(tithi >= 1 && tithi <= 15)) return null;
    if (paksha !== 'shukla' && paksha !== 'krishna') return null;
    var pol = cfg.KRISHNA || 'tantraraja', n, state, motion, lit = [], i;
    if (pol === 'tantraraja') {
      /* Tantraraja: krishna k → Nitya k leaves the moon; shukla k → Nitya 16-k returns. */
      if (paksha === 'krishna') { n = tithi; motion = 'out'; for (i = tithi + 1; i <= 15; i++) lit.push(i); }
      else { n = 16 - tithi; motion = 'in'; for (i = n; i <= 15; i++) lit.push(i); }
    } else if (paksha === 'shukla') { n = tithi; motion = 'in'; for (i = 1; i <= n; i++) lit.push(i); }
    else if (pol === 'reverse') { n = tithi === 15 ? 15 : 16 - tithi; motion = 'out'; for (i = n; i <= 15; i++) lit.push(i); }
    else if (pol === 'same') { n = tithi; motion = 'out'; for (i = tithi + 1; i <= 15; i++) lit.push(i); }
    else return null;                                       // 'none'
    state = tithi === 15 ? (paksha === 'shukla' ? 'purnima' : 'amavasya') : 'day';
    /* the bindu is the FIFTEENTH TITHI of either fortnight (purnima / amavasya),
       not "whichever entry is numbered 15" — under the reverse policy krishna
       pratipad maps to Nitya 15 (Chitra) and must stay on the perimeter. */
    var bindu = (tithi === 15 && (cfg.BINDU_DAY || 'mahanitya') === 'mahanitya');
    var entry = null;
    for (var i = 0; i < data.length; i++) {
      if (bindu ? data[i].bindu : (data[i].tithi === n && !data[i].bindu)) { entry = data[i]; break; }
    }
    if (!entry) return null;
    return { entry: entry, station: bindu ? 0 : n, state: bindu ? state : 'day',
             motion: bindu ? null : motion, lit: lit, tithi: tithi, paksha: paksha,
             moon: g.sdSriChakra ? g.sdSriChakra.moonFraction(tithi, paksha) : null };
  }

  /* the one line of motion for the day, or '' if the template is missing in this language */
  function sdNityaMotionText(pick, lang) {
    var M = g.SD_NITYA_MOTION || {}; if (!pick) return '';
    var key = pick.state === 'purnima' ? 'purnima' : pick.state === 'amavasya' ? 'amavasya' : (pick.motion === 'out' ? 'departs' : 'returns');
    var t = M[key] && M[key][lang]; if (!t) return '';
    return t.replace('{name}', pick.entry.name[lang] || '');
  }

  /* complete in this language = all three fields non-empty AND the language is
     marked reviewed by a native reader. window.SD_NITYA_REVIEWED = { te: true, … }
     lives in daily-nitya.js; a language absent from it, or false, shows the Gita.
     Content that exists but nobody native has read is not shippable data. */
  function sdNityaComplete(entry, lang) {
    if (!entry || !lang) return false;
    var R = g.SD_NITYA_REVIEWED; if (R && R[lang] !== true) return false;
    return ['name', 'digit', 'note'].every(function (f) {
      var v = entry[f] && entry[f][lang]; return typeof v === 'string' && v.trim().length > 0;
    });
  }

  /* ── render ──────────────────────────────────────────────────────────── */
  function sdNityaCardHTML(ctx) {
    var pick = sdNityaOfDay(ctx.tithi, ctx.paksha);
    if (!pick || !sdNityaComplete(pick.entry, ctx.lang)) return null;
    var e = pick.entry, L = ctx.lang;
    /* ZOOMED, always. The fifteen stations span 0.19 R; unzoomed at 132 px they
       sit 0.8 px apart under the glow and every day looks the same (review,
       blocker 2). At 150 px and zoom 0.30 the closest pair (across a corner) is 9 px apart, dot 2.75 px. */
    var svg = g.sdSriChakra.svg({ size: 150, station: pick.station, zoom: 0.30, id: 'sdnc',
                                  state: pick.state, motion: pick.motion, lit: pick.lit, animate: true });
    var moon = g.sdSriChakra.moonSVG(pick.tithi, pick.paksha, 22);
    var motionLine = sdNityaMotionText(pick, L);
    var title = S_('today_title', L, 'nitya.today_title') || e.name[L];
    var share = S_('share', L, 'nitya.share') || A_('gita.share', '');
    return '<div class="nitya-card" data-key="' + esc(e.key) + '" data-station="' + pick.station + '">' +
      '<div class="nitya-head">' + moon + '<span>' + esc(title) + (sdNityaWhen(ctx, L, true) ? '<span class="nitya-date">' + esc(sdNityaWhen(ctx, L, true)) + '</span>' : '') + '</span></div>' +
      /* row: lens | name · digit · motion.  Then the note full width below —
         beside a 150 px lens the note ran seven narrow lines and the name broke
         into three; same words, a third less height. */
      '<div class="nitya-body">' +
        '<div class="nitya-chakra" aria-hidden="true">' + svg + '</div>' +
        '<div class="nitya-text">' +
          '<div class="nitya-name">' + esc(sdNityaName(e, L)) + '</div>' +
          '<div class="nitya-digit">' + esc(e.digit[L]) + '</div>' +
          (motionLine ? '<div class="nitya-motion">' + esc(motionLine) + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="nitya-note">' + esc(e.note[L]) + '</div>' +
      (share ? '<button type="button" class="nitya-share" onclick="sdNityaShare()">' + esc(share) + '</button>' : '') +
    '</div>';
  }

  /* returns true when the Nitya card was mounted; false → caller mounts the Gita */
  function sdNityaMount(el, ctx) {
    try {
      if (!el || !g.sdSriChakra || !g.SD_NITYA) return false;
      var html = sdNityaCardHTML(ctx);
      if (!html) return false;
      el.innerHTML = html; g.__SD_NITYA_CTX = ctx;
      try { g.sdTrack && g.sdTrack('nitya_view', { key: el.firstChild.getAttribute('data-key'), lang: ctx.lang }); } catch (e) {}
      return true;
    } catch (e) { try { console.error(e); } catch (x) {} return false; }
  }

  /* ── share text ──────────────────────────────────────────────────────── */
  function sdNityaShareText(ctx) {
    var pick = sdNityaOfDay(ctx.tithi, ctx.paksha); if (!pick) return '';
    var e = pick.entry, L = ctx.lang; if (!sdNityaComplete(e, L)) return '';
    var title = S_('today_title', L, 'nitya.today_title');
    var hook  = S_('hook', L);
    /* Ram's structure. The old text was the card copy dumped out with a faint
       "from Shubh Din" at the end — a relative reads the blessing and has no
       reason to tap anything. Now: the darshan is the WhatsApp preview line,
       the day is named, the note is quoted, and the last two lines say what is
       on the other side of the link. */
    var head = '\u2728 *' + sdNityaName(e, L) + (title ? ' \u00b7 ' + title : '') + '* \uD83D\uDD49\uFE0F';
    var when = [ctx.dateLabel, ctx.weekday].filter(Boolean).join(' \u2022 ');
    var out  = head + '\n';
    if (when) out += '(' + when + ')\n';
    out += '\n\u201c' + e.note[L] + '\u201d \uD83C\uDF38\n';
    if (hook) out += '\n*' + hook + '*\n';
    out += '\uD83D\uDC49 https://shubhdin.app';
    return out;
  }


  /* ── share image: 1080×1150, chakra drawn from the SVG string, no fetch.
     The SVG is a same-origin Blob URL, so the canvas is never tainted and
     toBlob cannot throw for that reason. Verify on a phone anyway. ───────── */
  function sdNityaImageBlob(ctx, done) {
    var pick = sdNityaOfDay(ctx.tithi, ctx.paksha);
    if (!pick || !sdNityaComplete(pick.entry, ctx.lang)) return done(null);
    var e = pick.entry, L = ctx.lang, W = 1080, H = 1190;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2A1400'); bg.addColorStop(1, '#0F0700');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    /* full yantra for recognition, plus a zoomed lens so the day's station is
       unmistakable in the forwarded image too */
    var st = { state: pick.state, lit: pick.lit, animate: false };   // a still image: no SMIL
    var svgFull = g.sdSriChakra.svg(Object.assign({ size: 620, station: pick.station, outer: true, id: 'sdsh' }, st));
    var svgLens = g.sdSriChakra.svg(Object.assign({ size: 300, station: pick.station, zoom: 0.30, id: 'sdsl',
                                      theme: { bg: '#1A0D00' } }, st));
    var svgMoon = g.sdSriChakra.moonSVG(pick.tithi, pick.paksha, 96);
    var mk = function (svg) { return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })); };
    var url = mk(svgFull), url2 = mk(svgLens), url3 = mk(svgMoon);
    var img = new Image(), lens = new Image(), moon = new Image(), left = 3;
    function ready() {
      if (--left) return;
      URL.revokeObjectURL(url); URL.revokeObjectURL(url2); URL.revokeObjectURL(url3);
      c.drawImage(img, 40, 90, 620, 620);
      c.drawImage(moon, W - 40 - 96, 110, 96, 96);
      c.save(); c.beginPath(); c.arc(W - 40 - 150, 90 + 620 - 150, 150, 0, Math.PI * 2); c.closePath(); c.clip();
      c.drawImage(lens, W - 40 - 300, 90 + 620 - 300, 300, 300); c.restore();
      c.beginPath(); c.arc(W - 40 - 150, 90 + 620 - 150, 150, 0, Math.PI * 2);
      c.strokeStyle = '#D4A843'; c.lineWidth = 3; c.stroke();
      c.textAlign = 'center';
      var title = S_('today_title', L, 'nitya.today_title');
      /* full-strength gold and 12px further down: at 0.85 opacity and y=42 the
         header sat faint and crowded against the top edge of the image. */
      if (title) { c.fillStyle = '#F1D27A'; c.font = '600 32px "Noto Serif", "Noto Serif Devanagari", "Noto Serif Telugu", serif'; c.fillText(title, W / 2, 54); }
      var when = sdNityaWhen(ctx, L, false);
      if (when) { c.fillStyle = 'rgba(255,244,222,0.86)'; c.font = '400 27px "Noto Serif", "Noto Serif Devanagari", "Noto Serif Telugu", serif'; c.fillText(when, W / 2, 92); }
      c.fillStyle = '#F1D27A';
      c.font = '600 58px "Noto Serif", "Noto Serif Devanagari", "Noto Serif Telugu", serif';
      c.fillText(sdNityaName(e, L), W / 2, 800);
      c.fillStyle = 'rgba(255,244,222,0.85)'; c.font = '400 32px "Noto Serif", serif';
      c.fillText(e.digit[L], W / 2, 852);
      var ml = sdNityaMotionText(pick, L), y = 906;
      if (ml) { c.fillStyle = '#F1D27A'; c.font = '500 30px "Noto Serif", serif'; wrap(c, ml, W / 2, y, 900, 40, 2); y += 84; }
      /* 34px medium, not 30px light: WhatsApp recompresses a forwarded image and
         the readers are mostly over 50. This is the paragraph they actually read. */
      c.fillStyle = 'rgba(255,244,222,0.88)'; c.font = '500 34px "Noto Serif", "Noto Serif Devanagari", "Noto Serif Telugu", serif';
      var lastY = wrap(c, e.note[L], W / 2, y, 900, 48, ml ? 3 : 4);
      c.fillStyle = 'rgba(241,210,122,0.95)'; c.font = '600 30px sans-serif';
      /* A saved or re-forwarded image arrives with no message attached, so this
         line is the only thing telling a new viewer where the darshan came from.
         It was faint enough to disappear. Brand name in gold, domain beside it. */
      /* THE FOOTER FOLLOWS THE TEXT. It used to sit at a hardcoded y=1110,
         which was fine at 30px/40 line-height — but the note is now 34px on a
         48 line-height, and a four-line note in a long-worded language ran
         straight into it with zero gap. Measured on a real render.
         48px clear of the last line, and never past the bottom margin. */
      c.fillText('\u2728 Shubh Din  \u2022  shubhdin.app', W / 2,
                 Math.min(H - 34, Math.max(1110, lastY + 48)));
      try { cv.toBlob(function (b) { done(b); }, 'image/png'); } catch (err) { done(null); }
    }
    img.onload = lens.onload = moon.onload = ready;
    img.onerror = lens.onerror = moon.onerror = function () { URL.revokeObjectURL(url); URL.revokeObjectURL(url2); URL.revokeObjectURL(url3); done(null); };
    img.src = url; lens.src = url2; moon.src = url3;
  }
  function wrap(c, text, x, y, maxW, lh, maxLines) {
    var words = String(text).split(/\s+/), line = '', n = 0;
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (c.measureText(t).width > maxW && line) {
        c.fillText(line, x, y); y += lh; line = words[i]; if (++n >= maxLines - 1) { line += '…'; break; }
      } else line = t;
    }
    if (line) c.fillText(line, x, y);
    return y;          /* the y of the LAST line drawn — the caller needs it */
  }

  /* share button → image if the browser can share files, else text */
  function sdNityaShare() {
    var ctx = g.__SD_NITYA_CTX; if (!ctx) return;
    var text = sdNityaShareText(ctx);
    try { g.sdTrack && g.sdTrack('nitya_share', { lang: ctx.lang }); } catch (e) {}
    sdNityaImageBlob(ctx, function (blob) {
      var file = blob ? new File([blob], 'shubhdin-srichakra.png', { type: 'image/png' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: text }).catch(function () {});
      } else if (navigator.share) {
        navigator.share({ text: text }).catch(function () {});
      } else {
        g.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
      }
    });
  }

  return { sdNityaOfDay: sdNityaOfDay, sdNityaComplete: sdNityaComplete, sdNityaCardHTML: sdNityaCardHTML, sdNityaMotionText: sdNityaMotionText, sdNityaName: sdNityaName, sdNityaDateText: sdNityaDateText, sdNityaWhen: sdNityaWhen,
           sdNityaMount: sdNityaMount, sdNityaShareText: sdNityaShareText, sdNityaImageBlob: sdNityaImageBlob,
           sdNityaShare: sdNityaShare };
}));
