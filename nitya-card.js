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

   ctx = { tithi: 1..15, paksha: 'shukla'|'krishna', lang: 'te', dateLabel: '...' }
   tithi/paksha come from the engine's Vedic day (sunrise-anchored), the same
   values the panchang strip already shows. Never from Date.getDate().

   No mantra. No remedy. No prescription. See the spec.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else Object.assign(root, factory());
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
  /* The fallback assumed A() returns the KEY on a miss. Shubh Din's string
     layer returns the key IN BRACKETS — "[gita.share]" — which is truthy and
     not equal to the key, so the fallback never fired. Measured: the button
     rendered "[gita.share]" and, worse, the WhatsApp share text would have
     carried "[nitya.share_tag]" into somebody's family group.
     Treat a bracketed key as a miss. */
  function A_(k, fb) {
    try {
      if (typeof g.A === 'function') {
        var v = g.A(k);
        if (v && v !== k && !/^\[.*\]$/.test(v)) return v;
      }
    } catch (e) {}
    return fb;
  }
  /* Nine-language fallbacks for the three keys this card needs, used until
     they are merged into the string sheet. Without these the sheet miss falls
     through to English, and a Hindi reader gets an English button — the exact
     fault this project spent a week removing. Sheet values still win. */
  var FB = {
    'nitya.today_title': {en:'Today in the Sri Chakra', hi:'आज श्री चक्र में',
      te:'ఈ రోజు శ్రీ చక్రంలో', kn:'ಇಂದು ಶ್ರೀ ಚಕ್ರದಲ್ಲಿ', ta:'இன்று ஸ்ரீ சக்கரத்தில்',
      bn:'আজ শ্রী চক্রে', mr:'आज श्री चक्रात', gu:'આજે શ્રી ચક્રમાં', as:'আজি শ্ৰী চক্ৰত'},
    'gita.share': {en:'Share on WhatsApp', hi:'WhatsApp पर भेजें',
      te:'వాట్సాప్‌లో పంచుకోండి', kn:'WhatsApp‑ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ', ta:'WhatsApp‑இல் பகிருங்கள்',
      bn:'WhatsApp-এ পাঠান', mr:'WhatsApp‑वर पाठवा', gu:'WhatsApp પર મોકલો',
      as:'WhatsApp‑ত শ্বেয়াৰ কৰক'},
    'nitya.share_tag': {en:'Today in the Sri Chakra', hi:'आज श्री चक्र में',
      te:'ఈ రోజు శ్రీ చక్రంలో', kn:'ಇಂದು ಶ್ರೀ ಚಕ್ರದಲ್ಲಿ', ta:'இன்று ஸ்ரீ சக்கரத்தில்',
      bn:'আজ শ্রী চক্রে', mr:'आज श्री चक्रात', gu:'આજે શ્રી ચક્રમાં', as:'আজি শ্ৰী চক্ৰত'}
  };
  function AL_(k, lang, fb) {
    var v = A_(k, null);
    if (v) return v;
    var row = FB[k];
    if (row) return row[lang] || row[(g.SD_LANG || 'hi')] || row.hi || fb;
    return fb;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ── which Nitya today ─────────────────────────────────────────────────
     Returns { entry, station } or null. station is 0 for the bindu. */
  function sdNityaOfDay(tithi, paksha, cfg, data) {
    cfg = cfg || g.SD_NITYA_CFG || {}; data = data || g.SD_NITYA || [];
    tithi = parseInt(tithi, 10);
    if (!(tithi >= 1 && tithi <= 15)) return null;
    var n;
    if (paksha === 'shukla') n = tithi;
    else if (paksha === 'krishna') {
      if (cfg.KRISHNA === 'reverse') n = tithi === 15 ? 15 : 16 - tithi;
      else if (cfg.KRISHNA === 'same') n = tithi;
      else return null;                                   // 'none' — not ruled yet
    } else return null;
    /* the bindu is the FIFTEENTH TITHI of either fortnight (purnima / amavasya),
       not "whichever entry is numbered 15" — under the reverse policy krishna
       pratipad maps to Nitya 15 (Chitra) and must stay on the perimeter. */
    var bindu = (tithi === 15 && (cfg.BINDU_DAY || 'mahanitya') === 'mahanitya');
    var entry = null;
    for (var i = 0; i < data.length; i++) {
      if (bindu ? data[i].bindu : (data[i].tithi === n && !data[i].bindu)) { entry = data[i]; break; }
    }
    if (!entry) return null;
    return { entry: entry, station: bindu ? 0 : n };
  }

  /* complete in this language = all three fields non-empty. No fallback. */
  function sdNityaComplete(entry, lang) {
    if (!entry || !lang) return false;
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
    var svg = g.sdSriChakra.svg({ size: 150, station: pick.station, zoom: 0.30, id: 'sdnc' });
    var title = AL_('nitya.today_title', ctx.lang, 'Today in the Sri Chakra');
    var share = AL_('gita.share', ctx.lang, 'Share');
    return '<div class="nitya-card" data-key="' + esc(e.key) + '" data-station="' + pick.station + '">' +
      '<div class="nitya-head">' + esc(title) + (ctx.dateLabel ? ' <span class="nitya-date">· ' + esc(ctx.dateLabel) + '</span>' : '') + '</div>' +
      '<div class="nitya-body">' +
        '<div class="nitya-chakra" aria-hidden="true">' + svg + '</div>' +
        '<div class="nitya-text">' +
          '<div class="nitya-name">' + esc(e.name[L]) + '</div>' +
          '<div class="nitya-digit">' + esc(e.digit[L]) + '</div>' +
          '<div class="nitya-note">' + esc(e.note[L]) + '</div>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="nitya-share" onclick="sdNityaShare()">' + esc(share) + '</button>' +
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
    return e.name[L] + '\n' + e.digit[L] + '\n\n' + e.note[L] + '\n\n' +
           AL_('nitya.share_tag', ctx.lang, 'Today in the Sri Chakra') + (ctx.dateLabel ? ' · ' + ctx.dateLabel : '') + '\nhttps://shubhdin.app';
  }

  /* ── share image: 1080×1150, chakra drawn from the SVG string, no fetch.
     The SVG is a same-origin Blob URL, so the canvas is never tainted and
     toBlob cannot throw for that reason. Verify on a phone anyway. ───────── */
  function sdNityaImageBlob(ctx, done) {
    var pick = sdNityaOfDay(ctx.tithi, ctx.paksha);
    if (!pick || !sdNityaComplete(pick.entry, ctx.lang)) return done(null);
    var e = pick.entry, L = ctx.lang, W = 1080, H = 1150;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2A1400'); bg.addColorStop(1, '#0F0700');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    /* full yantra for recognition, plus a zoomed lens so the day's station is
       unmistakable in the forwarded image too */
    var svgFull = g.sdSriChakra.svg({ size: 620, station: pick.station, outer: true, id: 'sdsh' });
    var svgLens = g.sdSriChakra.svg({ size: 300, station: pick.station, zoom: 0.30, id: 'sdsl',
                                      theme: { bg: '#1A0D00' } });
    var url = URL.createObjectURL(new Blob([svgFull], { type: 'image/svg+xml;charset=utf-8' }));
    var url2 = URL.createObjectURL(new Blob([svgLens], { type: 'image/svg+xml;charset=utf-8' }));
    var img = new Image(), lens = new Image(), left = 2;
    function ready() {
      if (--left) return;
      URL.revokeObjectURL(url); URL.revokeObjectURL(url2);
      c.drawImage(img, 40, 50, 620, 620);
      c.save(); c.beginPath(); c.arc(W - 40 - 150, 50 + 620 - 150, 150, 0, Math.PI * 2); c.closePath(); c.clip();
      c.drawImage(lens, W - 40 - 300, 50 + 620 - 300, 300, 300); c.restore();
      c.beginPath(); c.arc(W - 40 - 150, 50 + 620 - 150, 150, 0, Math.PI * 2);
      c.strokeStyle = '#D4A843'; c.lineWidth = 3; c.stroke();
      c.textAlign = 'center'; c.fillStyle = '#F1D27A';
      c.font = '600 58px "Noto Serif", "Noto Serif Devanagari", "Noto Serif Telugu", serif';
      c.fillText(e.name[L], W / 2, 790);
      c.fillStyle = 'rgba(255,244,222,0.85)'; c.font = '400 32px "Noto Serif", serif';
      c.fillText(e.digit[L], W / 2, 845);
      c.fillStyle = 'rgba(255,244,222,0.72)'; c.font = '400 30px "Noto Serif", serif';
      wrap(c, e.note[L], W / 2, 915, 900, 44, 4);
      c.fillStyle = 'rgba(241,210,122,0.75)'; c.font = '500 28px sans-serif';
      c.fillText((ctx.dateLabel ? ctx.dateLabel + '  ·  ' : '') + 'shubhdin.app', W / 2, 1105);
      try { cv.toBlob(function (b) { done(b); }, 'image/png'); } catch (err) { done(null); }
    }
    img.onload = ready; lens.onload = ready;
    img.onerror = lens.onerror = function () { URL.revokeObjectURL(url); URL.revokeObjectURL(url2); done(null); };
    img.src = url; lens.src = url2;
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

  return { sdNityaOfDay: sdNityaOfDay, sdNityaComplete: sdNityaComplete, sdNityaCardHTML: sdNityaCardHTML,
           sdNityaMount: sdNityaMount, sdNityaShareText: sdNityaShareText, sdNityaImageBlob: sdNityaImageBlob,
           sdNityaShare: sdNityaShare };
}));
