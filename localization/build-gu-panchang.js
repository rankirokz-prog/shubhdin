// SHUBH DIN — build-gu-panchang.js
// Renders a Gujarati Panchang sample page as standalone HTML, using the REAL
// report CSS, the REAL font links and the REAL <table><tr><th/td> markup lifted
// from kundli-report.html — not an approximation.
//
// Produced as HTML rather than PDF/PNG deliberately: this container has no
// headless browser, and fonts.googleapis.com is outside the allowed-domain list,
// so any screenshot taken here would render Gujarati in a fallback font — which
// is precisely the thing under review. Opened in a normal browser this file
// renders byte-identically to the real report. Print to PDF from there.

const fs = require('fs');
const D = __dirname;
global.window = global;
const AST = require(D + '/astronomy.min.js'); global.Astronomy = AST; window.Astronomy = AST;
require(D + '/panchang-engine.js'); require(D + '/ui-strings.js');
const PE = global.PanchangEngine || window.PanchangEngine, U = global.SD_UI;

const src = fs.readFileSync(D + '/kundli-report.html', 'utf8');
const head = src.slice(0, src.indexOf('</head>'));
const fontLinks = (head.match(/<link[^>]*fonts\.googleapis[^>]*>/g) || []).join('\n');
const styleBlocks = (head.match(/<style[\s\S]*?<\/style>/g) || []).join('\n');

const LANG = process.argv[2] || 'gu';
const LAT = 23.0225, LNG = 72.5714, PLACE = 'અમદાવાદ';
const T = (tbl, key) => { const t = U[tbl]; if (!t || !key) return key || '—'; const e = t[key]; return (e && e[LANG]) || key; };
const UI = (p) => { const parts = p.split('.'); let o = U; for (const k of parts) o = o && o[k]; return (o && o[LANG]) || (o && o.en) || p; };
const fT = (iso) => { const d = new Date(iso); const h = d.getUTCHours() + 5, m = d.getUTCMinutes() + 30;
  let H = h + Math.floor(m / 60), M = m % 60; H = ((H % 24) + 24) % 24;
  const ap = H < 12 ? 'AM' : 'PM'; const hh = H % 12 === 0 ? 12 : H % 12;
  return hh + ':' + String(M).padStart(2, '0') + ' ' + ap; };

const DATES = [
  ['આજનું પંચાંગ', new Date(Date.UTC(2026, 7, 6, 12, 0, 0))],
  ['સુદ પક્ષનો દિવસ', new Date(Date.UTC(2026, 7, 28, 12, 0, 0))],
  ['વદ પક્ષનો દિવસ', new Date(Date.UTC(2026, 10, 3, 12, 0, 0))],
];

let body = '';
for (const [label, d] of DATES) {
  const p = PE.getPanchang(d, LAT, LNG);
  const hc = p.hinduCalendar || {};
  const masaEn = (hc.amantaMonth && hc.amantaMonth.en) || null;
  const rows = [
    ['તારીખ', d.toISOString().slice(0, 10) + ' · ' + PLACE],
    [UI('panchangLbl.vara'), T('weekday', p.vara.en)],
    [UI('klbl.masaL'), (masaEn ? T('masa', masaEn) : '—')],
    ['પક્ષ', T('paksha', p.tithi.paksha)],
    [UI('panchangLbl.tithi'), T('tithi', p.tithi.en)],
    [UI('glossTerm.Nakshatra'), T('nakshatra', p.nakshatra.en) + ' · ' + UI('glossTerm.Pada') + ' ' + p.nakshatra.pada],
    [UI('panchangLbl.yoga'), T('yoga', p.yoga.en)],
    [UI('panchangLbl.karana'), T('karana', p.karana.en)],
    [UI('kpanch.sunriseSet'), fT(p.sunrise) + ' / ' + fT(p.sunset)],
    [UI('kpanch.moonSunSign'), T('rashi', p.moonSign.en) + ' / ' + T('rashi', p.sunSign.en)],
  ];
  const tb = '<table>' + rows.map(r => '<tr><th style="width:42%">' + r[0] + '</th><td>' + r[1] + '</td></tr>').join('') + '</table>';
  body += '<h2 class="sec">\uD83D\uDD49\uFE0F ' + label + '</h2>' + tb;
}

const html = `<!doctype html><html lang="${LANG}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shubh Din — Gujarati Panchang sample</title>
${fontLinks}
${styleBlocks}
<style>
  body{background:#f6f1e7;margin:0;padding:18px;}
  #report{max-width:640px;margin:0 auto;background:#fffdf8;padding:26px 22px;
          box-shadow:0 2px 14px rgba(0,0,0,.08);border-radius:6px;}
  .note{max-width:640px;margin:0 auto 14px;font:13px/1.5 system-ui,sans-serif;color:#6b5b45;}
</style></head><body>
<div class="note">Shubh Din — Gujarati Panchang terminology sample. Real engine output,
real report CSS and fonts. Print to PDF from your browser to review typography.</div>
<div id="report" class="lang-${LANG}">
  <div style="text-align:center;margin-bottom:18px">
    <div style="font-size:22px;font-weight:700">${UI('brand.name')}</div>
    <div style="font-size:13px;opacity:.7">${U.toc[LANG] ? U.toc[LANG][0] : 'જન્મ પંચાંગ'}</div>
  </div>
  ${body}
</div></body></html>`;

const out = D + '/gu-panchang-sample.html';
fs.writeFileSync(out, html, 'utf8');
console.log('wrote ' + out + '  (' + Buffer.byteLength(html) + ' bytes)');
console.log('font links reused : ' + (fontLinks.match(/<link/g) || []).length);
console.log('style blocks reused: ' + (styleBlocks.match(/<style/g) || []).length);
console.log('lang-gu rule present: ' + (styleBlocks.includes('#report.lang-gu') ? 'yes' : 'NO'));
