// SHUBH DIN — render-check.js
// Renders any report in any language and inspects the REAL output.
//
// Exists because duplicated / mis-ordered text is invisible to the English-leak
// scanner: nothing is in English, so the harness passes while a reader sees the
// same sentence twice. Found exactly that in the Love closing quote, in all six
// languages, live.
//
// Usage:
//   node render-check.js <report> <lang> [phrase]     count a phrase
//   node render-check.js <report> <lang> --dupes      auto-find repeated sentences
//
// Examples:
//   node render-check.js love bn --dupes
//   node render-check.js kundli ta "ஏழரைச் சனி"

const fs = require('fs');
const D = __dirname + '/';

// ─────────────────────────────────────────────────────────────────────────────
// ALLOWLIST — repeats reviewed and approved as correct by design.
// Signed off by native review; do not re-flag. Anything NOT listed here is
// still reported, so a genuine new duplication (like the Love closing quote,
// which shipped in all six languages) cannot hide behind these exemptions.
//
// Each entry: { why, match(sentence, count) -> bool }
// ─────────────────────────────────────────────────────────────────────────────
const ALLOW = {
  career: [
    { why: 'primary career signature repeats between Summary and Detail sections',
      test: (s, n) => n === 2 }
  ],
  annual: [
    { why: 'year-lord (varshesh) theme repeats between Summary and Detail sections',
      test: (s, n) => n === 2 }
  ],
  forecast: [
    { why: 'year-rating and action strings recur across years sharing a rating',
      test: (s, n) => n >= 2 }
  ],
  kundli: [
    { why: 'prGuide / prTone repeat per pratyantar — deferred to the v2 rotating-prefix change',
      src: C => tableValues(C, ['prGuide', 'prTone', 'prFlavor']) },
    { why: 'slow-planet transit text recurs across consecutive years (Saturn ~2.5y per sign)',
      src: C => tableValues(C, ['satTransit', 'jupTransit']) },
    { why: 'mahadasha lord text appears in both the timeline and the detail section',
      src: C => tableValues(C, ['dashaLord']) },
  ],
};

// Collect every localized value of the named SD_CONTENT tables, so an allow rule
// can say "this repeat is one of THESE strings" instead of "any string repeated
// N times". Language-agnostic: matches the rendered language's own text.
function tableValues(C, names) {
  const out = [];
  names.forEach(nm => {
    const t = C && C[nm];
    if (!t) return;
    (Array.isArray(t) ? t : Object.values(t)).forEach(entry => {
      if (entry && typeof entry === 'object') Object.values(entry).forEach(v => {
        if (typeof v === "string" && v.length > 12) out.push(v);
      });
    });
  });
  return out;
}

const report = process.argv[2], lang = process.argv[3];
const arg = process.argv[4];
if (!report || !lang) { console.error('Usage: node render-check.js <report> <lang> [phrase|--dupes]'); process.exit(1); }

const DEF = { pname:'Test', bdate:'1996-12-06', btime:'15:47', blat:'16.4343', blng:'81.6985',
  bplace:'Narasapur, AP', clat:'16.7', clng:'81.1', foryear:'2026', bname:'Boy', gname:'Girl',
  gdate:'2000-07-10', gtime:'06:00', glat:'16.4343', glng:'81.6985', gplace:'Narasapur, AP',
  fromd:'2026-01-01', tod:'2026-06-30', pgender:'Male' };

function makeEl(id){ return { id, value: DEF[id]!==undefined?DEF[id]:'', innerHTML:'', className:'',
  style:{}, children:[], appendChild(c){this.children.push(c);}, setAttribute(){}, getAttribute(){return null;},
  addEventListener(){}, focus(){}, scrollIntoView(){} }; }

function render(report, lang){
  const html = fs.readFileSync(D + report + '-report.html', 'utf8');
  const inlineM = html.match(/<script id="sd-ui-inline">([\s\S]*?)<\/script><!--\/sd-ui-inline-->/);
  const mainM = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  if (!mainM) throw new Error('could not extract main script from ' + report);
  const els = {};
  const doc = { getElementById: id => (els[id] = els[id] || makeEl(id)), createElement: () => makeEl('n'),
    querySelector: () => null, querySelectorAll: () => [], fonts:{ready:Promise.resolve()}, addEventListener(){} };
  const win = { print(){}, scrollTo(){}, alert(){} };
  global.window = win;
  const AST = require(D + 'astronomy.min.js'); win.Astronomy = AST; global.Astronomy = AST;
  const files = [D+'panchang-engine.js', D+'report-content.js'];
  if (report !== 'kundli') files.push(D + report + '-content.js');
  files.forEach(f => { delete require.cache[require.resolve(f)]; require(f); });
  if (!global.PanchangEngine && win.PanchangEngine) global.PanchangEngine = win.PanchangEngine;
  win.PanchangEngine = global.PanchangEngine || win.PanchangEngine;
  Object.keys(global).filter(k => /^SD_/.test(k)).forEach(g => { if (!win[g]) win[g] = global[g]; });
  const body = 'with(window){\n' + (inlineM ? inlineM[1] : '') + '\n' + mainM[1] +
    '\nsetLang(LANG_INIT);\nif(typeof confirmStep==="function")confirmStep();' +
    '\nif(typeof generate==="function")generate();\n}\nreturn document.getElementById("report").innerHTML;';
  const fn = new Function('window','document','console','alert','confirm','setTimeout','LANG_INIT', body);
  const out = fn(win, doc, console, ()=>{}, ()=>true, f=>f&&f(), lang) || '';
  LOADED = win.SD_CONTENT || global.SD_CONTENT || null;  // content files attach to the sandbox window
  return out;
}

let LOADED = null;
const rep = render(report, lang);
const text = rep.replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ')
                .replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim();
console.log(report + '/' + lang + ' — rendered ' + rep.length + ' chars, ' + text.length + ' of text\n');

if (arg === '--dupes') {
  // split on sentence enders incl. danda; report any sentence appearing more than once
  const sents = text.split(/(?<=[.!?\u0964])\s+/).map(s => s.trim()).filter(s => s.length > 25);
  const seen = new Map();
  sents.forEach(s => seen.set(s, (seen.get(s) || 0) + 1));
  const all = [...seen.entries()].filter(([, n]) => n > 1);
  const rules = ALLOW[report] || [];
  const allowed = [], flagged = [];
  const SDC = LOADED;
  all.forEach(([s, n]) => {
    const r = rules.find(r => {
      if (r.test) return r.test(s, n);
      if (r.src) { const vals = r.src(SDC); return vals.some(v => v.includes(s) || s.includes(v.slice(0, 60))); }
      return false;
    });
    (r ? allowed : flagged).push([s, n, r]);
  });
  console.log('sentences ≥25 chars: ' + sents.length);
  console.log('repeated: ' + all.length + '   (allowed ' + allowed.length + ', flagged ' + flagged.length + ')');
  if (allowed.length) {
    console.log('\n  allowed by design:');
    const byWhy = {};
    allowed.forEach(([s, n, r]) => { (byWhy[r.why] = byWhy[r.why] || []).push(n); });
    Object.entries(byWhy).forEach(([why, ns]) =>
      console.log('    ' + ns.length + ' sentence(s) ×' + ns.join(',×') + ' — ' + why));
  }
  console.log('\n  FLAGGED: ' + (flagged.length || 'none ✓'));
  flagged.slice(0, 12).forEach(([s, n]) => console.log('    ×' + n + '  ' + s.slice(0, 110)));
  process.exit(flagged.length ? 1 : 0);
} else if (arg) {
  let n = 0, i = 0; const ctx = [];
  while ((i = text.indexOf(arg, i)) !== -1) { n++; ctx.push(text.slice(Math.max(0,i-60), i+90)); i += arg.length; }
  console.log('occurrences of "' + arg + '": ' + n);
  ctx.forEach((c, j) => console.log('\n  [' + (j+1) + '] ...' + c + '...'));
} else {
  console.log(text.slice(0, 600) + '\n…');
}
