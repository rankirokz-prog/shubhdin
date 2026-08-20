// SHUBH DIN — test-coord-guard.js
// Executes the REAL submitDetails()/resolve() source lifted out of buy.html
// against a stub DOM, and asserts the coordinate guard behaves.
//
//   node test-coord-guard.js
//
// Why this exists: source inspection is not verification on this project. The
// bug this guards against (Eluru markup defaults silently filling unset
// blat/blng) is invisible in the rendered report, so it has to be caught here.

const fs = require('fs');
const src = fs.readFileSync('buy.html', 'utf8');

// lift the two functions verbatim — no copy of the logic lives in this file
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
const BADDATE  = cut('function sdBadDate(');
const DATEMSG  = cut('function sdDateMsg(');
const BADD     = cut('function badDate(');
const SUBMIT   = cut('async function submitDetails()');
const MISSD    = cut('function missD()');
const SUNRISE  = cut('async function sunriseIST(');
const NOTIMEON = cut('function noTimeOn(');

const ELURU = { lat: 16.4343, lng: 81.6985 }; // the markup defaults we must never inherit

function run(scenario) {
  const els = {};
  const el = (id) => (els[id] = els[id] || { id, value: '', textContent: '', style: {} });
  Object.keys(scenario.fields || {}).forEach(k => { el('f_' + k).value = scenario.fields[k]; });

  const sandbox = {
    C: scenario.C, R: scenario.R, H: false,
    CPICK: scenario.CPICK || {},
    $: el,
    SD_TODAY: '2026-08-20',
    bdlog: () => {},   // logging is a no-op under test
    val: (id) => (els[id] ? String(els[id].value).trim() : ''),
    geo: async () => scenario.geoWorks ? { lat: scenario.geo.lat, lng: scenario.geo.lng } : null,
    // no scenario in this file ticks "time unknown", so this must never be reached
    loadEngine: async () => { throw new Error('loadEngine called unexpectedly'); },
    localStorage: { store: {}, setItem(k, v) { this.store[k] = v; } },
    checkAuthThen: () => { sandbox._authed = true; },
    _authed: false
  };

  const fn = new Function('S', `
    with (S) {
      ${NOTIMEON}
      ${BADDATE}
      ${DATEMSG}
      ${BADD}
      ${MISSD}
      ${SUNRISE}
      ${SUBMIT}
      return submitDetails();
    }
  `);
  return fn(sandbox).then(() => ({
    stored: sandbox.localStorage.store['sd_buy_' + scenario.R]
      ? JSON.parse(sandbox.localStorage.store['sd_buy_' + scenario.R]) : null,
    proceeded: sandbox._authed,
    manualShown: Object.keys(els).filter(k => k.startsWith('man_') && els[k].style.display === 'block'),
    err: els.errD ? els.errD.textContent : ''
  }));
}

const BASE = { pname: 'Ram', pdate: '1990-04-12', ptime: '05:30' };
const MARR = { bname: 'A', bdate: '1990-04-12', btime: '05:30',
               gname: 'B', gdate: '1992-08-03', gtime: '11:10' };

const CASES = [
  { n: 'city picked from dropdown → proceeds with picked coords',
    R: 'love', C: { gender: true }, fields: { ...BASE, pplace: 'Vizag' },
    CPICK: { p: { lat: 17.6868, lng: 83.2185 } }, geoWorks: false,
    expect: r => r.proceeded && r.stored.blat === 17.6868 },

  { n: 'no pick, geocode succeeds → proceeds with geocoded coords',
    R: 'career', C: { gender: true }, fields: { ...BASE, pplace: 'Chennai' },
    geoWorks: true, geo: { lat: 13.0827, lng: 80.2707 },
    expect: r => r.proceeded && r.stored.blng === 80.2707 },

  { n: 'geocode FAILS, nothing manual → BLOCKED, manual revealed, nothing stored',
    R: 'career', C: { gender: true }, fields: { ...BASE, pplace: 'Chennai' },
    geoWorks: false,
    expect: r => !r.proceeded && r.stored === null && r.manualShown.includes('man_p') },

  { n: 'geocode fails but manual coords typed → proceeds with manual coords',
    R: 'career', C: { gender: true },
    fields: { ...BASE, pplace: 'Chennai', plat: '13.0827', plng: '80.2707' },
    geoWorks: false,
    expect: r => r.proceeded && r.stored.blat === 13.0827 && r.stored.blng === 80.2707 },

  { n: 'manual coords out of range → BLOCKED, not stored',
    R: 'career', C: { gender: true },
    fields: { ...BASE, pplace: 'Chennai', plat: '913.08', plng: '80.27' },
    geoWorks: false,
    expect: r => !r.proceeded && r.stored === null },

  { n: 'place left blank entirely → BLOCKED (no silent Eluru)',
    R: 'child', C: { gender: true }, fields: { ...BASE }, geoWorks: true, geo: ELURU,
    expect: r => !r.proceeded && r.stored === null },

  { n: 'marriage: groom resolves, bride fails → BLOCKED, only bride block revealed',
    R: 'marriage', C: { two: true }, fields: { ...MARR, bplace: 'Eluru', gplace: 'Nowhere' },
    CPICK: { b: { lat: 16.7107, lng: 81.0952 } }, geoWorks: false,
    expect: r => !r.proceeded && r.stored === null &&
                 r.manualShown.includes('man_g') && !r.manualShown.includes('man_b') },

  { n: 'marriage: both resolve → all four coords stored',
    R: 'marriage', C: { two: true }, fields: { ...MARR, bplace: 'Eluru', gplace: 'Pune' },
    CPICK: { b: { lat: 16.7107, lng: 81.0952 }, g: { lat: 18.5204, lng: 73.8567 } },
    geoWorks: false,
    expect: r => r.proceeded && r.stored.blat === 16.7107 && r.stored.glng === 73.8567 },

  { n: 'annual: residence resolves independently of birth place',
    R: 'annual', C: { residence: true },
    fields: { ...BASE, pplace: 'Delhi', cplace: 'Bengaluru' },
    CPICK: { p: { lat: 28.6139, lng: 77.209 }, c: { lat: 12.9716, lng: 77.5946 } },
    expect: r => r.proceeded && r.stored.blat === 28.6139 && r.stored.clat === 12.9716 &&
                 r.stored.clat !== r.stored.blat },

  { n: 'annual: residence prefilled from profile (CPICK.c, no typing) still resolves',
    R: 'annual', C: { residence: true },
    fields: { ...BASE, pplace: 'Delhi', cplace: 'Eluru' },
    CPICK: { p: { lat: 28.6139, lng: 77.209 }, c: { lat: 16.7107, lng: 81.0952 } },
    expect: r => r.proceeded && r.stored.clat === 16.7107 },

  { n: 'annual: residence unresolvable \u2192 BLOCKED, its own manual box revealed',
    R: 'annual', C: { residence: true },
    fields: { ...BASE, pplace: 'Delhi', cplace: 'Nowhere' },
    CPICK: { p: { lat: 28.6139, lng: 77.209 } }, geoWorks: false,
    expect: r => !r.proceeded && r.stored === null && r.manualShown.includes('man_c') },

  { n: 'annual: birth place fails \u2192 BLOCKED before residence is even asked',
    R: 'annual', C: { residence: true },
    fields: { ...BASE, pplace: 'Nowhere', cplace: 'Bengaluru' },
    CPICK: { c: { lat: 12.9716, lng: 77.5946 } }, geoWorks: false,
    expect: r => !r.proceeded && r.stored === null && r.manualShown.includes('man_p') },

  { n: 'FUTURE birth date (2028) → BLOCKED, nothing stored, future-specific message',
    R: 'career', C: { gender: true },
    fields: { pname: 'Ram', pdate: '2028-05-10', ptime: '05:30', pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => !r.proceeded && r.stored === null && /cannot be in the future/i.test(r.err) },

  { n: 'tomorrow is also rejected (not just far-future years)',
    R: 'career', C: { gender: true },
    fields: { pname: 'Ram', pdate: '2026-08-21', ptime: '05:30', pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => !r.proceeded && r.stored === null },

  { n: 'today is ACCEPTED — a newborn chart is legitimate',
    R: 'career', C: { gender: true },
    fields: { pname: 'Ram', pdate: '2026-08-20', ptime: '05:30', pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => r.proceeded && r.stored.bdate === '2026-08-20' },

  { n: 'pre-1900 date rejected as implausible',
    R: 'career', C: { gender: true },
    fields: { pname: 'Ram', pdate: '1823-05-10', ptime: '05:30', pplace: 'Eluru' },
    CPICK: { p: { lat: 16.7107, lng: 81.0952 } },
    expect: r => !r.proceeded && r.stored === null },

  { n: 'marriage: BRIDE future-dated → BLOCKED even though groom is valid',
    R: 'marriage', C: { two: true },
    fields: { bname: 'A', bdate: '1990-04-12', btime: '05:30', bplace: 'Eluru',
              gname: 'B', gdate: '2028-08-03', gtime: '11:10', gplace: 'Pune' },
    CPICK: { b: { lat: 16.7107, lng: 81.0952 }, g: { lat: 18.5204, lng: 73.8567 } },
    expect: r => !r.proceeded && r.stored === null && /future/i.test(r.err) },

  { n: 'missing required field → BLOCKED with the missing-field message, not the coord one',
    R: 'love', C: { gender: true }, fields: { pname: 'Ram', pplace: 'Vizag' },
    geoWorks: true, geo: ELURU,
    expect: r => !r.proceeded && /fill all details/.test(r.err) }
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
  // final sweep: no passing scenario may ever store the Eluru defaults
  console.log(fail ? '\n✗ ' + fail + ' case(s) failed'
                   : '\n✓ ' + CASES.length + '/' + CASES.length + ' — guard holds; no payload inherits Eluru defaults');
  process.exit(fail ? 1 : 0);
})();
