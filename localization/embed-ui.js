// SHUBH DIN — embed-ui.js
// Inlines ui-strings.js directly into a report HTML so there is NO separate
// file to upload (removes the missing-file failure class seen in Telugu review).
// ui-strings.js remains the canonical generated SOURCE; rerun this after any
// change to it. Idempotent: replaces the previous inline block.
//
// Usage: node embed-ui.js <report-file.html> [more.html ...]
//        node embed-ui.js all        (all 8 report pages)

const fs = require('fs');

const ALL = ['love-report.html','marriage-report.html','career-report.html','muhurta-report.html',
             'forecast-report.html','child-report.html','annual-report.html','kundli-report.html'];

let files = process.argv.slice(2);
if (files.length === 1 && files[0] === 'all') files = ALL;
if (!files.length) { console.error('Usage: node embed-ui.js <report.html>|all'); process.exit(1); }

const ui = fs.readFileSync('ui-strings.js', 'utf8');
const START = '<script id="sd-ui-inline">';
const END = '</script><!--/sd-ui-inline-->';
const block = START + '\n/* INLINED from ui-strings.js — regenerate with: node embed-ui.js */\n' + ui + '\n' + END;

for (const f of files) {
  if (!fs.existsSync(f)) { console.log('skip (absent):', f); continue; }
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  // remove any previous inline block
  const si = s.indexOf(START);
  if (si >= 0) {
    const ei = s.indexOf(END, si);
    if (ei >= 0) s = s.slice(0, si) + s.slice(ei + END.length);
  }

  if (s.includes('<script src="ui-strings.js"></script>')) {
    // replace the external tag with the inline block
    s = s.replace('<script src="ui-strings.js"></script>', block);
  } else if (s.includes('<script src="panchang-engine.js"></script>')) {
    // no external tag present — insert inline block right after the engine
    s = s.replace('<script src="panchang-engine.js"></script>',
                  '<script src="panchang-engine.js"></script>\n' + block);
  } else {
    console.log('✗ no insertion point in', f); continue;
  }

  if (s !== before) { fs.writeFileSync(f, s, 'utf8'); console.log('✓ inlined into', f); }
  else console.log('no change:', f);
}
