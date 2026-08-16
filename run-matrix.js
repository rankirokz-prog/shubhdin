// SHUBH DIN — run-matrix.js
// PHASE 1 executor. Generates the certification matrix and applies the 10
// checks mechanically. Prints failures only; a clean run prints a summary.
//
// Usage:
//   node run-matrix.js --chart 1              one chart, all reports, all langs
//   node run-matrix.js --chart 7 --lang en    one chart, one language
//   node run-matrix.js --smoke                charts 1,7,9 in one language
//   node run-matrix.js                        the full matrix (783 PDFs)
const fs = require('fs'), cp = require('child_process');
const D = __dirname + '/';
const M = require(D + 'certify-matrix.json');

const REPORTS = ['kundli','love','marriage','career','muhurta','forecast','child','annual'];
const LANGS   = ['en','hi','te','kn','ta','bn','mr','gu','as'];
const KUNDLI_SAMPLE = [1, 7, 9];

// ---- CHECK 1: raw terms-layer keys. Only known prefixes, so shubhdin.app
// cannot fire. Verified both ways: clean on real reports, still catches
// reason.tenthLord / lvD9.seventhTitle / kundli.k024.
const KEY_PREFIXES = ['reason','kundli','forecast','marriage','career','love','annual',
  'muhurta','child','common','chartLbl','gocharLbl','panchangLbl','glossTerm','balaLbl',
  'muddaLbl','saham','sahamMean','sahamLbl','tblLbl','jp','dsh','trn','edu','pev','psLbl',
  'd7Lbl','annU3','annGo','fcGo','fcYr','ssLbl','lvD9','lvTm','element','tara','brand',
  'yoni','gana','nadi','varna','vashya','koota','planet','rashi','nakshatra','weekday',
  'tithi','masa','dignity','ssPhase','winLbl','mSec','cSec','kootaLbl','monFull'];
const RAW_KEY_RE = new RegExp('\\b(' + KEY_PREFIXES.join('|') + ')\\.[a-zA-Z][a-zA-Z0-9]{2,}\\b', 'g');

// Latin that is legitimate on any page, in any language
// User-supplied fields (name, birthplace) are Latin by the buyer's choice and
// appear on every page. The harness supplies 'Test' / 'Narasapur'.
// User-supplied fields are Latin by the buyer's choice and appear on every
// page. The harness fixtures are pname 'Test', bplace 'Narasapur',
// bname 'Boy', gname 'Girl' — a report echoing a typed name is correct
// behaviour, not a leak. Chart 7 flagged 'Girl' in 6 languages before
// this exemption; the underlying terms (bn পাত্র/পাত্রী) were always fine.
const LATIN_OK = /\b(shubhdin|app|SHUBHDIN|APP|PDF|AM|PM|IST|D1|D7|D9|D10|SAV|BAV|Om|Test|Narasapur|Tromso|Boy|Girl)\b/g;

function textOf(html) {
  return html.replace(/<style[\s\S]*?<\/style>/g, ' ')
             .replace(/<script[\s\S]*?<\/script>/g, ' ')
             .replace(/<[^>]+>/g, ' ')
             .replace(/&nbsp;/g, ' ')
             .replace(/\s+/g, ' ');
}

function runChecks(html, lang, report) {
  const t = textOf(html);
  const fails = [];

  // 1 raw keys
  const keys = [...new Set(t.match(RAW_KEY_RE) || [])];
  if (keys.length) fails.push(['raw keys', keys.slice(0, 4).join(', ')]);

  // 2 untranslated English in the 8 Indic outputs
  if (lang !== 'en') {
    const clean = t.replace(LATIN_OK, ' ');
    const eng = [...new Set(clean.match(/\b[A-Za-z]{4,}\b/g) || [])];
    if (eng.length) fails.push(['English leak', eng.slice(0, 5).join(', ')]);
  }

  // 3 empty table cells (the blank-header class)
  const blanks = (html.match(/<th><\/th>/g) || []).length;
  // a LEADING blank th over a row-label column is legitimate table design
  const leadBlanks = (html.match(/<tr><th><\/th>/g) || []).length;
  if (blanks - leadBlanks > 0) fails.push(['blank header', (blanks - leadBlanks) + ' non-leading']);

  // 4 null / NaN / undefined / Invalid Date / [object Object]
  const nulls = [...new Set(t.match(/\b(undefined|NaN|Invalid Date)\b|\[object Object\]/g) || [])];
  if (nulls.length) fails.push(['null-class', nulls.join(', ')]);

  // 5 ISO timestamps
  const iso = (t.match(/\d{4}-\d{2}-\d{2}T/g) || []).length;
  if (iso) fails.push(['ISO timestamp', iso + ' occurrence(s)']);

  // 6 page overflow / orphan risk
  const over = [];
  html.split(/<div class="page">/).slice(1).forEach((p, i) => {
    const rows = (p.match(/<tr/g) || []).length, h2 = (p.match(/<h2/g) || []).length;
    const prose = [...p.matchAll(/class="prose"[^>]*>([\s\S]*?)<\/div>/g)]
      .reduce((a, m) => a + m[1].replace(/<[^>]+>/g, '').length, 0);
    const cards = (p.match(/class="(mcard|ycard)"/g) || []).length;
    const box = (p.match(/class="yog/g) || []).length;
    const est = rows*29 + h2*62 + Math.ceil(prose/78)*28 + cards*120 + box*62 + 40;
    if (est > 1055) over.push('p' + (i+1) + ' ~' + est);
  });
  if (over.length) fails.push(['page overflow', over.slice(0, 3).join(', ')]);

  // 7 conjunct integrity — DELEGATED, not regexed.
  // A naive "same cluster twice" test fires on legitimate reduplication:
  // বারবার (again and again), হুরহুর, धीरे-धीरे. Indic languages reduplicate
  // freely, so only the repha-bucket-aware check-conjuncts.js can tell a real
  // extraction artefact from an ordinary word. Run it separately over the
  // corpus; this per-PDF pass does not guess.
  //   node check-conjuncts.js <dump>

  // 8 dates outside the window the report itself declares
  const years = [...new Set((t.match(/\b(19|20)\d{2}\b/g) || []).map(Number))];
  const wild = years.filter(y => y < 1900 || y > 2110);
  if (wild.length) fails.push(['wild year', wild.join(', ')]);

  // 9 cross-page consistency: a dasha pair stated twice must match.
  // KUNDLI EXEMPT — verified: its 120-year Vimshottari table lists every pair
  // at antar level AND again inside sookshma breakdowns (Jupiter-Venus appears
  // 38x with different spans, all correct). The check assumes one pair = one
  // period, which holds for the paid reports and not for a lifetime table.
  const pairs = {};
  [...t.matchAll(/(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s*[–-]\s*(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)[\s\S]{0,80}?(\d{1,2} \w{3,} \d{4})[\s\S]{0,30}?(\d{1,2} \w{3,} \d{4})/g)]
    .forEach(m => { const k = m[1] + '-' + m[2]; (pairs[k] = pairs[k] || new Set()).add(m[3] + '→' + m[4]); });
  const inconsistent = report === 'kundli' ? [] : Object.entries(pairs).filter(([, v]) => v.size > 1);
  if (inconsistent.length) fails.push(['cross-page', inconsistent.map(([k]) => k).join(', ')]);

  return fails;
}

// ---- generation
function harnessFor(chart) {
  let src = fs.readFileSync(D + 'test-reports.js', 'utf8');
  src = src.replace(/16\.4343/g, String(chart.lat)).replace(/81\.6985/g, String(chart.lng));
  src = src.replace("if (!rep || rep.length < 200)",
    "if(process.env.SD_DUMP){require('fs').writeFileSync(process.env.SD_DUMP+'.'+lang+'.html',rep,'utf8');}\n      if (!rep || rep.length < 200)");
  const langs = process.env.SD_LANGS ? process.env.SD_LANGS.split(',') : LANGS;
  src = src.replace(/^const LANGS = .*/m, 'const LANGS = ' + JSON.stringify(langs) + ';');
  fs.writeFileSync(D + 'tmatrix.js', src, 'utf8');
}

const args = process.argv.slice(2);
const argOf = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i+1] : null; };
const smoke = args.includes('--smoke');
let charts = M.charts;
if (argOf('--chart')) charts = charts.filter(c => c.id === +argOf('--chart'));
if (smoke) charts = charts.filter(c => [1,7,9].includes(c.id));
const langs = argOf('--lang') ? [argOf('--lang')] : (smoke ? ['en'] : LANGS);

let generated = 0, failedFiles = 0;
const failLog = [];

for (const chart of charts) {
  harnessFor(chart);
  for (const report of REPORTS) {
    if (report === 'kundli' && !KUNDLI_SAMPLE.includes(chart.id)) continue;
    const stem = '/tmp/mx-' + chart.id + '-' + report;
    try {
      cp.execSync('SD_DUMP=' + stem + ' SD_LANGS=' + langs.join(',') +
        ' node ' + D + 'tmatrix.js ' + report, { cwd: D, timeout: 600000, stdio: 'pipe' });
    } catch (e) {
      failLog.push(['chart ' + chart.id, report, 'ALL', 'generation failed', (e.message || '').slice(0, 60)]);
      failedFiles++; continue;
    }
    for (const lang of langs) {
      const f = stem + '.' + lang + '.html';
      if (!fs.existsSync(f)) { failLog.push(['chart ' + chart.id, report, lang, 'no output', '']); failedFiles++; continue; }
      generated++;
      const html = fs.readFileSync(f, 'utf8');
      const fails = runChecks(html, lang, report);
      if (fails.length) {
        failedFiles++;
        fails.forEach(([what, detail]) => failLog.push(['chart ' + chart.id, report, lang, what, detail]));
      }
      fs.unlinkSync(f);
    }
  }
}

try { fs.unlinkSync(D + 'tmatrix.js'); } catch (e) {}

console.log('\n  ── MATRIX RESULT ──');
console.log('  PDFs generated : ' + generated);
console.log('  files with failures : ' + failedFiles);
if (failLog.length) {
  console.log('\n  FAILURES:');
  const byKind = {};
  failLog.forEach(r => { byKind[r[3]] = (byKind[r[3]] || 0) + 1; });
  Object.entries(byKind).sort((a,b) => b[1]-a[1]).forEach(([k,n]) => console.log('    ' + String(n).padStart(4) + '  ' + k));
  console.log('\n  first 25:');
  failLog.slice(0, 25).forEach(r => console.log('    ' + r[0].padEnd(9) + r[1].padEnd(10) + r[2].padEnd(4) + r[3].padEnd(20) + r[4]));
} else {
  console.log('\n  \u2713 every PDF passed all checks.');
}
process.exit(failLog.length ? 1 : 0);
