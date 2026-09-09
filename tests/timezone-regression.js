// Active timezone-path regression checks. Run from the repository root:
//   node tests/timezone-regression.js
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const tz = require(path.join(root, 'lib/tz.js'));

const londonSummer = tz.birthInstant('1990-07-01', '12:00', 'Europe/London');
const londonWinter = tz.birthInstant('1990-01-01', '12:00', 'Europe/London');
assert.strictEqual(londonSummer.offsetMinutes, 60, 'London summer must use BST');
assert.strictEqual(londonWinter.offsetMinutes, 0, 'London winter must use GMT');
assert.strictEqual(tz.birthInstant('2026-03-29', '01:30', 'Europe/London').adjusted, 'gap');
assert.strictEqual(tz.birthInstant('2026-10-25', '01:30', 'Europe/London').adjusted, 'overlap');

const ctx = { console }; ctx.window = ctx; ctx.global = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'astronomy.min.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'panchang-engine.js'), 'utf8'), ctx);
vm.runInContext(`
  const b=new Date('1990-01-01T12:00:00Z');
  const changing=d=>d<new Date('2026-03-08T07:00:00Z')?-5:-4;
  const r=PanchangEngine.findMuhurta('vehicle',b,40.7128,-74.006,
    new Date('2026-03-01T00:00:00Z'),new Date('2026-04-01T00:00:00Z'),50,changing);
  if(!r||!r.results.length) throw new Error('DST-aware Muhurta search returned no results');
  try{
    PanchangEngine.findMuhurta('vehicle',b,0,0,new Date(),new Date(Date.now()+86400000),5,99);
    throw new Error('invalid timezone offset accepted');
  }catch(e){ if(/accepted/.test(e.message)) throw e; }
`, ctx);

const astrology = fs.readFileSync(path.join(root, 'astrology.html'), 'utf8');
assert(!/timeZone:'Asia\/Kolkata'/.test(astrology), 'Astrology display still hardcodes India');
assert(!/:00\+05:30/.test(astrology), 'Astrology birth parsing still hardcodes India');
assert(/<script src="sd-tz\.js"><\/script>/.test(astrology), 'Astrology must load sd-tz.js');

const dashboard = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
assert(!/fetch\s*\(\s*`?\/api\/birth-chart/.test(dashboard), 'Dashboard still calls third-party birth API');
assert(!fs.existsSync(path.join(root, 'api/birth-chart.js')), 'Dead third-party birth API endpoint still exists');

console.log('timezone regression: 12 checks passed');
