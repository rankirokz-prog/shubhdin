// SHUBH DIN — Localization Phase 1: string extractor
// Walks the 7 paid-report content files and emits master-strings.en.json
// (single source of truth). Rerunnable = delta discipline (Bible rule 6).
// Usage: node extract-strings.js
global.window = global;
require('./love-content.js');
require('./marriage-content.js');
require('./career-content.js');
require('./muhurta-content.js');
require('./forecast-content.js');
require('./child-content.js');
require('./annual-content.js');

const ROOTS = {
  love: global.SD_LOVE,
  marriage: global.SD_MARRIAGE,
  career: global.SD_CAREER,
  muhurta: global.SD_MUHURTA,
  forecast: global.SD_FORECAST,
  child: global.SD_CHILD,
  annual: global.SD_ANNUAL
};

// EN-bearing field -> matching HI field
function hiFieldFor(enField) {
  if (enField === 'en') return 'hi';
  if (enField === 't_en') return 't_hi';
  if (enField.endsWith('En')) return enField.slice(0, -2) + 'Hi';
  return null;
}
function isEnField(name) {
  return name === 'en' || name === 't_en' || /En$/.test(name);
}

const entries = [];
function walk(obj, path, report) {
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, path + '[' + i + ']', report));
    return;
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (isEnField(k) && (typeof v === 'string' || (Array.isArray(v) && v.every(x => typeof x === 'string')))) {
      const hiF = hiFieldFor(k);
      entries.push({
        report: report,
        key: path + '.' + k,
        en: v,
        hi_current: hiF && obj[hiF] !== undefined ? obj[hiF] : null
      });
    } else if (typeof v === 'object') {
      walk(v, path + '.' + k, report);
    }
  }
}

for (const [report, root] of Object.entries(ROOTS)) {
  if (!root) { console.error('MISSING root for', report); process.exit(1); }
  walk(root, report, report);
}

// stats
const byReport = {};
let words = 0;
for (const e of entries) {
  byReport[e.report] = (byReport[e.report] || 0) + 1;
  const t = Array.isArray(e.en) ? e.en.join(' ') : e.en;
  words += t.split(/\s+/).length;
}
const out = {
  _meta: {
    version: '1.0',
    scope: 'paid reports only (Bible rule: free kundli after pipeline proven)',
    generated: new Date().toISOString(),
    blocks: entries.length,
    approxWords: words,
    byReport: byReport
  },
  strings: entries
};
require('fs').writeFileSync('master-strings.en.json', JSON.stringify(out, null, 1), 'utf8');
console.log('master-strings.en.json written');
console.log('blocks:', entries.length, '| approx words:', words);
console.log('by report:', JSON.stringify(byReport));
