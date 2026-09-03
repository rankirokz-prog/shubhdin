# tests/ — the suites, now actually in the repo

Round six found that seven of the eight suites the brief calls "the first line
of defence" **did not exist on any remote branch**. They lived on one machine.
That is the finding in this round with the longest tail, and it was mine.

This folder fixes it. Commit it.

## What is here

| | |
|---|---|
| `verify-goldens.js` + `golden-snapshots.json` | 228 engine snapshots. **The snapshot file is committed here as `.json`.** In the repo it was named `golden-snapshots.js` while the script opens `golden-snapshots.json` — one character, and it meant the engine's drift protection had never run. Verified here: `228 pass / 0 fail`. |
| `gate-month.js` | 31 real consecutive days: the tithi the label names is the tithi the card acts on |
| `gate-real.js` | drives the real engine and the real normaliser, all nine languages |
| `gate-chain.js` | buy → pay → confirm → approve → sent → delivered |
| `gate-time.js` | 12-hour panchang formatting, nine languages, band boundaries |
| `gate-merge.js` | the Sri Chakra card in its slot |
| `scenarios.js` | 40 adversarial home-screen states |
| `scenarios2.js` · `scenarios3.js` | other pages · the astrology claims |
| `gate-index/kundli/reports/dispatch/gift/vedic/all9/buy9/sw/lang/bn` | per-page and per-feature |
| `app-strings-todo.json` | the rebuilt string source — 974 entries, nine languages |

## How to run

They need `playwright` and a local static server on **8112** (dashboard,
astrology, buy) and **8113** (index, kundli, reports, dispatch). Serve the repo
root on both if that is simpler.

```
node verify-goldens.js        # no server needed — must print 228 pass / 0 fail
node gate-month.js
node scenarios.js
```

## Two things about them

**They are not a CI suite.** They were written incrementally against a live
container and several hard-code paths or ports. Treat this commit as making
them *available and auditable*, not as a finished harness. Making them run
from a clean checkout is worth a small piece of work and would close the round
six finding properly.

**Two had real bugs found this week — in the tests, not the app.**
`scenarios.js` built fixture dates in Node (UTC) while forcing the browser to
`Asia/Kolkata`, so "done today" became yesterday for a few hours each night.
`scenarios3.js` blacklisted four nakshatra names, which are also four *real*
nakshatras, so it failed on roughly four days in twenty-seven. Both are fixed
in these copies. It is the standing lesson: when a suite fails after a change,
suspect the suite first.
