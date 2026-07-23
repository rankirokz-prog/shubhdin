// SHUBH DIN — report smoke test
// Executes each report page's REAL script in a DOM stub and runs the actual
// confirmStep() + generate() in every language. Catches scope/shadowing bugs,
// undefined helpers, and missing-language crashes that data-only checks miss.
//
// Usage: node test-reports.js [report ...]      (default: all)

const fs = require('fs');

const ALL = ['love', 'marriage', 'career', 'muhurta', 'forecast', 'child', 'annual'];
const LANGS = ['en', 'hi', 'te'];

const DEFAULTS = {
  pname: 'Test', bdate: '1996-12-06', btime: '15:47',
  blat: '16.4343', blng: '81.6985', bplace: 'Narasapur, AP',
  clat: '16.7', clng: '81.1', foryear: '2026',
  bname: 'Boy', gname: 'Girl',
  gdate: '2000-07-10', gtime: '06:00',
  glat: '16.4343', glng: '81.6985', gplace: 'Narasapur, AP',
  fromd: '2026-01-01', tod: '2026-06-30', pgender: 'Male'
};

function makeEl(id) {
  const el = {
    id, value: DEFAULTS[id] !== undefined ? DEFAULTS[id] : '',
    innerHTML: '', className: '', style: {}, children: [],
    appendChild(c) { this.children.push(c); },
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, focus() {}, scrollIntoView() {}
  };
  return el;
}

function runReport(name) {
  const html = fs.readFileSync(`${name}-report.html`, 'utf8');
  const inlineM = html.match(/<script id="sd-ui-inline">([\s\S]*?)<\/script><!--\/sd-ui-inline-->/);
  const mainM = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  if (!mainM) return [`${name}: could not extract main script`];

  const problems = [];
  for (const lang of LANGS) {
    const els = {};
    const doc = {
      getElementById: (id) => (els[id] = els[id] || makeEl(id)),
      createElement: () => makeEl('new'),
      querySelector: () => null, querySelectorAll: () => [],
      fonts: { ready: Promise.resolve() },
      addEventListener() {}
    };
    const alerts = [];
    const win = { print() {}, scrollTo() {}, alert: (m) => alerts.push(m) };

    const sandbox = {
      window: win, document: doc, console,
      alert: (m) => alerts.push(m), confirm: () => true,
      setTimeout: (fn) => fn && fn(), Date, Math, JSON, parseInt, parseFloat,
      isNaN, String, Number, Array, Object, RegExp, encodeURIComponent
    };
    // load engine + content into the sandbox window
    global.window = win;
    const AST = require('./astronomy.min.js');
    win.Astronomy = AST; global.Astronomy = AST;
    for (const f of ['./panchang-engine.js', './report-content.js', `./${name}-content.js`]) {
      delete require.cache[require.resolve(f)];
      require(f);
    }
    // engine/content attach to whichever object was global.window at require time
    if (!global.PanchangEngine && win.PanchangEngine) global.PanchangEngine = win.PanchangEngine;

    try {
      // Emulate browser global scope: window properties are bare identifiers.
      win.PanchangEngine = global.PanchangEngine || win.PanchangEngine;
      win.Astronomy = global.Astronomy;
      Object.keys(global).filter(k => /^SD_/.test(k)).forEach(g => { if (!win[g]) win[g] = global[g]; });
      const body =
        'with(window){\n' +
        (inlineM ? inlineM[1] : '') + '\n' +
        mainM[1] + '\n' +
        'setLang(LANG_INIT);\n' +
        'if(typeof confirmStep==="function")confirmStep();\n' +
        'if(typeof generate==="function")generate();\n' +
        '}\n' +
        'return document.getElementById("report").innerHTML;';
      const fn = new Function('window', 'document', 'console', 'alert', 'confirm', 'setTimeout', 'LANG_INIT', body);
      const alertFn = (m) => alerts.push(m);
      const rep = fn(win, doc, console, alertFn, () => true, (f2) => f2 && f2(), lang) || '';
      if (!rep || rep.length < 200) problems.push(`${name}/${lang}: report empty (${rep.length} chars)`);
      const realAlerts = alerts.filter(a => !/hard-refresh|does not contain/i.test(a));
      if (realAlerts.length) problems.push(`${name}/${lang}: alert → ${realAlerts[0].slice(0, 80)}`);

      // OUTPUT LANGUAGE SCAN — the check the native reviewer performs:
      // in a non-English report, any Latin-script phrase not on the allowlist is a leak.
      if (lang !== 'en' && rep) {
        const text = rep.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
                        .replace(/&[a-z]+;/g, ' ');
        const ALLOW = /^(DNA|PDF|D\d+|SAV|BAV|IST|AM|PM|Rs|OK|shubhdin(\.app)?|www|app|com|[A-Z]{1,3}\d*|v\d+|Q\d)$/;
        // user-typed values (names, places) render as typed — not leaks
        const USER = new Set(Object.values(DEFAULTS).flatMap(v => String(v).split(/[,\s]+/)));
        const leaks = new Set();
        for (const m of text.matchAll(/[A-Za-z][A-Za-z'’\-]{2,}(?:\s+[A-Za-z][A-Za-z'’\-]*)*/g)) {
          const phrase = m[0].trim();
          const words = phrase.split(/\s+/);
          if (words.every(w => ALLOW.test(w) || USER.has(w))) continue;
          const at = text.indexOf(phrase);
          const ctx = text.slice(Math.max(0, at - 25), at + phrase.length + 25).replace(/\s+/g, ' ');
          leaks.add(phrase.slice(0, 40) + '  ⟪' + ctx.slice(0, 90) + '⟫');
        }
        if (leaks.size) {
          problems.push(`${name}/${lang}: ${leaks.size} ENGLISH LEAK(S) → ` + [...leaks].slice(0, 6).join(' | '));
        }
      }
    } catch (e) {
      problems.push(`${name}/${lang}: THREW ${e && (e.message || e.toString()) || 'non-Error: '+JSON.stringify(e)}`);
    }
  }
  return problems;
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
let all = [];
for (const t of targets) {
  const p = runReport(t);
  console.log(p.length === 0 ? `✓ ${t.padEnd(9)} en/hi/te all generate cleanly` : `✗ ${t}`);
  p.forEach(x => console.log('    ' + x));
  all = all.concat(p);
}
console.log(all.length === 0 ? '\n✓✓✓ ALL REPORTS EXECUTE CLEANLY IN EN + हिन्दी + తెలుగు' : `\n✗ ${all.length} problem(s)`);
process.exit(all.length ? 1 : 0);
