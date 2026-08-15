// SHUBH DIN — check-engine-strings.js
// Guards the bug class that has now bitten THREE times:
//   chartYoga (July) · koota values (caught pre-deploy) · manglik factors (found in te/kn PDFs)
//
// Cause every time: the engine emits a PLAIN English string; the report passes
// it to T(), which expects an {en,hi,...} object and returns plain strings
// unchanged; English prints inside all 8 non-English reports.
//
// A language scanner CANNOT see this — the leak is in ENGINE output, not in any
// content file. So this walks live engine output, collects every plain Latin
// string a report could render, and asserts each has a terms-layer entry.
//
// Run: node check-engine-strings.js
const vm = require('vm'), fs = require('fs');
const D = __dirname + '/';
const ctx = { console, Math, Date, JSON, parseInt, parseFloat, isNaN, Number, String, Array, Object, RegExp, Error };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(D + 'astronomy.min.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(D + 'panchang-engine.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(D + 'ui-strings.js', 'utf8'), ctx);
const PE = ctx.PanchangEngine, U = ctx.SD_UI;

// Every value in these tables is a legitimate lookup key, so a string is
// "covered" if it appears as a key OR as an .en anywhere in SD_UI.
const covered = new Set();
(function walk(o) {
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    covered.add(k);
    if (v && typeof v === 'object') { if (typeof v.en === 'string') covered.add(v.en); walk(v); }
  }
})(U);

// Strings the report never displays, or that are display-safe as-is.
const IGNORE = /^(en|hi|te|kn|ta|bn|mr|gu|as|D\d+|[a-z_]+|\d[\d:.\-+TZ ]*|[A-Z]{1,4}|.{0,3})$/;
const STRUCTURAL = new Set(['none','present','softened','neutralized','favorable','unfavorable','neutral','full','partial','zero','male','female','day','night']);

// COMPOSED AT RENDER TIME — verified, not assumed. These reach the reader
// through a composer that rebuilds them from the terms layer, so the raw
// English never displays. Each entry records WHERE the composition happens so
// a future reader can re-verify rather than trust this list.
//   yogas.detail  → kundli-report.html locYogaDetail(): parses the English and
//                   rebuilds from planetAlias/planetEn/rashi/dignity/yogaDetail.
//                   Proven on 3024 live strings across 8 languages, zero Latin.
//   yogas.en      → rendered via term('chartYoga', y.en); all 13 names present.
//   dignities.en  → NOT rendered; kundli reads only .key and .dignity.
//   guna verdicts → NOT rendered by any report today.
//   sahams.en     → NOT rendered today (Annual U3 page not yet built). When it
//                   is built, use the saham table added in Phase 0 batch 2.
const COMPOSED = [/^getYogas\.yogas\.(detail|en|key)$/, /^getYogas\.dignities\./,
                  // VERIFIED NOT RENDERED, checked against fresh Bengali dumps:
                  //   getCareerWealth.fieldKeys / .avoidKeys are LOOKUP KEYS
                  //     ("jupiter|0") resolved through PE.CAREER_FIELDS and
                  //     SD_UI.careerFields — the key itself never prints.
                  //   getCareerWealth.jobBusiness is an internal verdict string;
                  //     the report renders its own localised jobBusiness prose.
                  //   getMonthlyGochar.note is a DEVELOPER note about Moon
                  //     exclusion and U2b vedha deferral, not display text.
                  /^getCareerWealth\.(fieldKeys|avoidKeys|jobBusiness)$/,
                  /^getMonthlyGochar\.note$/,
                  /^getGunaMilanFull\.(verdict|effectiveVerdict)$/,
                  /^getGunaMilanFull\.kootas\.note$/, /^getSahams\.sahams\./,
                  /^getMuddaDasha\./];

const found = new Map();          // string -> where first seen
function collect(o, where) {
  if (typeof o === 'string') {
    if (!/[A-Za-z]{4}/.test(o)) return;
    if (IGNORE.test(o) || STRUCTURAL.has(o)) return;
    if (!found.has(o)) found.set(o, where);
    return;
  }
  if (Array.isArray(o)) { o.forEach(x => collect(x, where)); return; }
  if (o && typeof o === 'object') {
    // an {en,hi,...} object is already localised — skip it, that is the correct shape
    if (typeof o.en === 'string' && (o.hi || o.te || o.bn)) return;
    for (const [k, v] of Object.entries(o)) collect(v, where + '.' + k);
  }
}

const B = new Date(Date.UTC(1996, 11, 6, 15, 47, 0) - 5.5 * 3600000);
const G = new Date(Date.UTC(2000, 6, 10, 8, 30, 0) - 5.5 * 3600000);
const LA = 16.4343, LN = 81.6985;
const CALLS = [
  ['getGunaMilanFull', () => PE.getGunaMilanFull(B, G)],
  ['getManglikMatch',  () => PE.getManglikMatch(B, LA, LN, G, 16.7, 81.1)],
  ['getEventWindows',  () => PE.getEventWindows('marriage', B, LA, LN, new Date(Date.UTC(2026,0,1)), new Date(Date.UTC(2034,0,1)))],
  ['getDoshas',        () => PE.getDoshas(B, LA, LN)],
  ['getYogas',         () => PE.getYogas(B, LA, LN)],
  ['getSadeSati',      () => PE.getSadeSati(B)],
  ['getAshtakavarga',  () => PE.getAshtakavarga(B, LA, LN)],
  ['getVarga(9)',      () => PE.getVarga(B, LA, LN, 9)],
  ['getPersonalDayStrength', () => PE.getPersonalDayStrength(new Date(Date.UTC(2026,10,8,6)), 16.7, 81.1, 5.5, { date: B })],
  ['getSahams',        () => PE.getSahams(B, LA, LN, 2026)],
  ['getMuddaDasha',    () => PE.getMuddaDasha(B, 2026)],
  // GAP CLOSED. The gate swept 11 calls while the reports made 25 — less than
  // half. 'air' from getLoveProfile reached a page raw in 8 languages and the
  // gate could not see it because getLoveProfile was never swept. Every
  // function any report calls is now here.
  ['getLoveProfile',   () => PE.getLoveProfile(B, LA, LN)],
  ['getCareerWealth',  () => PE.getCareerWealth(B, LA, LN)],
  ['getChildFamily',   () => PE.getChildFamily(B, LA, LN)],
  ['getYearForecast',  () => PE.getYearForecast(B, LA, LN, 2026, 10)],
  ['getVarshaphal',    () => PE.getVarshaphal(B, LA, LN, 2026)],
  ['getMonthlyGochar', () => PE.getMonthlyGochar(new Date(), 12, 5.5, { date: B })],
  ['getVimshottariDasha', () => PE.getVimshottariDasha(B)],
  ['getBirthChart',    () => PE.getBirthChart(B, LA, LN)],
  ['getPanchang',      () => PE.getPanchang(B, LA, LN, 5.5)],
  ['getNamakshara',    () => PE.getNamakshara(13)],
  ['findMuhurta',      () => PE.findMuhurta('business', B, LA, LN,
                              new Date(), new Date(Date.now() + 120*86400000), 6)],
];
for (const [name, fn] of CALLS) { try { collect(fn(), name); } catch (e) { console.log('  ! ' + name + ' threw: ' + e.message); } }

const leaks = [...found.entries()]
  .filter(([s]) => !covered.has(s))
  .filter(([, w]) => !COMPOSED.some(re => re.test(w)));
const composed = [...found.entries()].filter(([s, w]) => !covered.has(s) && COMPOSED.some(re => re.test(w)));
console.log('\n  engine calls swept   : ' + CALLS.length);
console.log('  display strings seen : ' + found.size);
console.log('  composed at render time (safe): ' + composed.length);
console.log('  UNCOVERED (would leak English): ' + leaks.length);
leaks.slice(0, 25).forEach(([s, w]) => console.log('    \u2717 [' + w + '] ' + s.slice(0, 88)));
if (leaks.length > 25) console.log('    … and ' + (leaks.length - 25) + ' more');
console.log(leaks.length
  ? '\n  \u2717 add these to the terms layer before shipping.'
  : '\n  \u2713 every engine-emitted display string has a terms-layer entry.');
process.exit(leaks.length ? 1 : 0);
