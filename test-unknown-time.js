// SHUBH DIN — test-unknown-time.js
// Executes the REAL submitDetails()/sunriseIST() source lifted out of buy.html
// against a stub DOM and the REAL panchang engine.
//
//   node test-unknown-time.js
//
// The point of this file: prove that ticking "I don't know my birth time"
// actually puts a sunrise clock time into btime. The failure mode we're
// guarding against is silent — a blank btime reaches the report, birthUTC()
// splits '' into NaN, and the chart renders as plausible nonsense.

const fs = require('fs');

global.window = global;
const A = require('./astronomy.min.js');
global.Astronomy = A.default || A;
require('./panchang-engine.js');
const PE = global.PanchangEngine;
if (!PE) { console.error('engine failed to load'); process.exit(1); }

const src = fs.readFileSync('buy.html', 'utf8');
const cut = (name) => {
  const i = src.indexOf(name);
  if (i === -1) throw new Error('could not find ' + name + ' in buy.html');
  let depth = 0, started = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error('unbalanced braces in ' + name);
};
const SUBMIT   = cut('async function submitDetails()');
const MISSD    = cut('function missD()');
const SUNRISE  = cut('async function sunriseIST(');
const NOTIMEON = cut('function noTimeOn(');

function run(sc) {
  const els = {};
  const el = (id) => (els[id] = els[id] || { id, value: '', textContent: '', checked: false, style: {} });
  Object.keys(sc.fields || {}).forEach(k => { el('f_' + k).value = sc.fields[k]; });
  (sc.ticked || []).forEach(p => { el('f_' + p + 'notime').checked = true; });

  const S = {
    C: sc.C, R: sc.R, H: false,
    CPICK: sc.CPICK || {},
    $: el,
    val: (id) => (els[id] ? String(els[id].value).trim() : ''),
    geo: async () => sc.geoWorks ? sc.geo : null,
    loadEngine: async () => sc.engineBroken ? Promise.reject(new Error('load failed')) : PE,
    localStorage: { store: {}, setItem(k, v) { this.store[k] = v; } },
    checkAuthThen: () => { S._authed = true; },
    _authed: false
  };

  const fn = new Function('S', `
    with (S) {
      ${NOTIMEON}
      ${MISSD}
      ${SUNRISE}
      ${SUBMIT}
      return submitDetails();
    }
  `);
  return fn(S).then(() => ({
    stored: S.localStorage.store['sd_buy_' + sc.R]
      ? JSON.parse(S.localStorage.store['sd_buy_' + sc.R]) : null,
    proceeded: S._authed,
    err: els.errD ? els.errD.textContent : ''
  }));
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const BASE = { pname: 'Ram', pdate: '1990-04-12' };
const MARR = { bname: 'A', bdate: '1990-04-12', gname: 'B', gdate: '1992-08-03', gtime: '11:10' };

const CASES = [
  { n: 'known time is passed through untouched, no timeUnknown flag',
    R: 'career', C: { gender: true },
    fields: { ...BASE, ptime: '05:30', pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => r.proceeded && r.stored.btime === '05:30' && r.stored.timeUnknown === undefined },

  { n: 'time unknown → btime filled with a valid HH:MM sunrise + flag set',
    R: 'career', C: { gender: true }, ticked: ['p'],
    fields: { ...BASE, pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => r.proceeded && HHMM.test(r.stored.btime) && r.stored.timeUnknown === true },

  { n: 'sunrise matches the engine directly (no drift in the lifted helper)',
    R: 'career', C: { gender: true }, ticked: ['p'],
    fields: { ...BASE, pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => {
      const p = PE.getPanchang(new Date(Date.UTC(1990, 3, 12, 6, 0, 0)), 16.7107, 81.0952);
      const ist = new Date(p.sunrise.getTime() + 5.5 * 3600000);
      const want = ('0' + ist.getUTCHours()).slice(-2) + ':' + ('0' + ist.getUTCMinutes()).slice(-2);
      return r.stored.btime === want;
    } },

  { n: 'sunrise is location-specific — Guwahati differs from Eluru',
    R: 'career', C: { gender: true }, ticked: ['p'],
    fields: { ...BASE, pplace: 'Guwahati' },
    CPICK: { p: { lat: 26.1445, lng: 91.7362 } },
    expect: r => {
      const p = PE.getPanchang(new Date(Date.UTC(1990, 3, 12, 6, 0, 0)), 16.7107, 81.0952);
      const ist = new Date(p.sunrise.getTime() + 5.5 * 3600000);
      const eluru = ('0' + ist.getUTCHours()).slice(-2) + ':' + ('0' + ist.getUTCMinutes()).slice(-2);
      return HHMM.test(r.stored.btime) && r.stored.btime !== eluru;
    } },

  { n: 'blank time WITHOUT the tick still blocks (no accidental empty btime)',
    R: 'career', C: { gender: true },
    fields: { ...BASE, pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => !r.proceeded && r.stored === null && /fill all details/.test(r.err) },

  { n: 'engine unavailable → BLOCKED, nothing stored, no blank btime shipped',
    R: 'career', C: { gender: true }, ticked: ['p'], engineBroken: true,
    fields: { ...BASE, pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => !r.proceeded && r.stored === null && /sunrise/i.test(r.err) },

  { n: 'unknown time still runs AFTER the coordinate guard — bad place blocks first',
    R: 'career', C: { gender: true }, ticked: ['p'],
    fields: { ...BASE, pplace: 'Nowhere' }, geoWorks: false,
    expect: r => !r.proceeded && r.stored === null && /birth place/i.test(r.err) },

  { n: 'marriage: only the bride ticks unknown — her time is sunrise, groom untouched',
    R: 'marriage', C: { two: true }, ticked: ['b'],
    fields: { ...MARR, bplace: 'Eluru', gplace: 'Pune' },
    CPICK: { b: { lat: 16.7107, lng: 81.0952 }, g: { lat: 18.5204, lng: 73.8567 } },
    expect: r => r.proceeded && HHMM.test(r.stored.btime) && r.stored.gtime === '11:10' &&
                 r.stored.timeUnknownB === true && r.stored.timeUnknownG === undefined },

  { n: 'annual: unknown time still mirrors clat/clng from birth coords',
    R: 'annual', C: {}, ticked: ['p'],
    fields: { ...BASE, pplace: 'Delhi' }, geoWorks: true, geo: { lat: 28.6139, lng: 77.209 },
    expect: r => r.proceeded && HHMM.test(r.stored.btime) &&
                 r.stored.clat === r.stored.blat && r.stored.clng === r.stored.blng },

  { n: 'sunrise is a plausible clock time, not a UTC artefact (04:00–08:00 IST)',
    R: 'career', C: { gender: true }, ticked: ['p'],
    fields: { ...BASE, pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => { const h = +r.stored.btime.slice(0, 2); return h >= 4 && h <= 8; } }
];

(async () => {
  let fail = 0;
  for (const c of CASES) {
    let r, ok;
    try { r = await run(c); ok = c.expect(r); }
    catch (e) { ok = false; r = { threw: e.message }; }
    if (!ok) fail++;
    console.log((ok ? '✓ ' : '✗ ') + c.n);
    if (!ok) console.log('    got: ' + JSON.stringify(r));
  }
  console.log(fail ? '\n✗ ' + fail + ' case(s) failed'
                   : '\n✓ ' + CASES.length + '/' + CASES.length + ' — sunrise reaches btime; no blank time ever ships');
  process.exit(fail ? 1 : 0);
})();
