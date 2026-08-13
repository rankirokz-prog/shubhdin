// SHUBH DIN — add-ta-html.js
// Adds Tamil rendering support to report pages:
//   1. Noto Serif Tamil font link (display=block, same as other scripts)
//   2. #report.lang-ta single-font shaping law + print hardening (Bible §10.2/§K6)
//   3. தமிழ் language button + setLang wiring (only where missing)
//
// text-rendering:auto is deliberate — optimizeLegibility caused the Devanagari
// word-duplication bug in PDFs. Do not change it.
//
// Idempotent: re-running makes no further changes.

const fs = require('fs');

const FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;500;600;700&display=block" rel="stylesheet">';
const KN_LINK_RE = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Noto\+Serif\+Kannada[^>]*>/;

const TA_CSS = `
/* Tamil: same single-font shaping law as Devanagari/Telugu/Kannada (§10.2 / §K6) */
#report.lang-ta, #report.lang-ta *{
  font-family:'Noto Serif Tamil','Latha','Nirmala UI',serif !important;
  letter-spacing:normal !important; word-spacing:normal !important;
  word-break:normal !important; overflow-wrap:normal !important;
  font-synthesis:none; text-rendering:auto;
}
#report.lang-ta .prose{text-align:left;}
@media print{
  #report.lang-ta, #report.lang-ta *{
    font-family:'Noto Serif Tamil','Latha','Nirmala UI',serif !important;
    letter-spacing:normal !important; text-rendering:auto !important;
    font-variant-ligatures:normal !important; font-feature-settings:normal !important;
    font-synthesis:none !important;
  }
}
</style>`;

const files = process.argv.slice(2);
if (!files.length) { console.error('Usage: node add-ta-html.js <report.html> ...'); process.exit(1); }

for (const f of files) {
  if (!fs.existsSync(f)) { console.log('skip (absent):', f); continue; }
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  const did = [];

  // 1. font link
  if (!/Noto\+Serif\+Tamil/.test(s)) {
    const m = s.match(KN_LINK_RE);
    if (m) { s = s.replace(m[0], m[0] + '\n' + FONT_LINK); did.push('font'); }
    else console.log('  ! no Kannada font link to anchor to in', f);
  }

  // 2. shaping law — insert before the closing </style> that ends the lang-kn block
  if (!/#report\.lang-ta/.test(s)) {
    const i = s.indexOf('</style>');
    if (i >= 0) { s = s.slice(0, i) + TA_CSS.slice(0, TA_CSS.length - 8) + s.slice(i); did.push('css'); }
  }

  // 3. language button (Kundli lacks it; paid reports already have it)
  if (!/id="lTa"/.test(s)) {
    const m = s.match(/<button id="lKn"[^>]*>[^<]*<\/button>/);
    if (m) {
      s = s.replace(m[0], m[0] + '<button id="lTa" onclick="setLang(\'ta\')">தமிழ்</button>');
      did.push('button');
    }
  }

  // 4. setLang array
  if (/\['en','hi','te','kn'\]/.test(s)) {
    s = s.split("['en','hi','te','kn']").join("['en','hi','te','kn','ta']");
    did.push('setLang');
  }

  if (s !== before) { fs.writeFileSync(f, s, 'utf8'); console.log('✓ ' + f.padEnd(24) + ' → ' + did.join(', ')); }
  else console.log('· ' + f.padEnd(24) + ' → already complete');
}
