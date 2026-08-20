/* ══════════════════════════════════════════════════════════════════
   BACK-BUTTON / TAB HISTORY

   Two separate faults produced the same symptom — "back takes me to a
   different tab from the one I came from".

   1. dashboard.html — go(tab) swapped CSS classes and touched history not
      at all. Every tab was therefore ONE history entry, so:
        · back from Mantras left the app entirely instead of returning Home
        · leaving to astrology.html and coming back always reopened Home,
          never the tab you had left from
      Giving each tab a hash entry fixes both at once: the browser then
      restores the tab you were on, because it is in the URL.

   2. astrology.html — back(to) did `location.hash = to`, which PUSHES a new
      entry rather than going back. History only ever grew, so the system
      back button replayed the trail forwards-backwards:
        hub → explore → times → (tap ←) → explore, and back now went to
        times, a screen the person had already left.

   Both pages load this file; each opts in by calling the matching setup.
   Deep links keep working, because the tab is read from the hash on boot.
   ══════════════════════════════════════════════════════════════════ */
(function (w) {

  /* ── dashboard: one history entry per tab ───────────────────────── */
  w.sdTabHistory = function (opts) {
    var TABS = opts.tabs, raw = opts.render, open = opts.open || {};
    var HOME = opts.home || 'home';
    var restoring = false;

    function show(tab) {
      // Screens with their own opener (Sadhana) must go through it, or the
      // screen appears with stale content.
      if (open[tab]) open[tab](); else raw(tab);
    }

    function restore(tab) {
      restoring = true;
      try { show(tab); } finally { restoring = false; }
    }

    // go() keeps its old signature so the 13 existing call sites are untouched.
    w.go = function (tab) {
      raw(tab);
      if (restoring || !TABS[tab]) return;
      var h = '#' + tab;
      if (location.hash !== h) history.pushState({ sdTab: tab }, '', h);
    };

    w.addEventListener('popstate', function (e) {
      var tab = (e.state && e.state.sdTab) || (location.hash || '').slice(1);
      if (!TABS[tab]) tab = HOME;
      restore(tab);
    });

    // On boot, the hash decides the tab — that is what makes returning from
    // another page land where you left, and what makes a deep link work.
    var boot = (location.hash || '').slice(1);
    if (TABS[boot]) {
      restore(boot);
      history.replaceState({ sdTab: boot }, '', '#' + boot);
    } else {
      history.replaceState({ sdTab: HOME }, '', '#' + HOME);
    }
  };

  /* ── astrology: ← undoes a step instead of adding one ───────────── */
  w.sdHashBack = function (opts) {
    var route = opts.route, HOME = opts.home || 'hub';
    var depth = 0;

    // Each forward hash push arrives with no state of ours, so it gets the
    // next depth. A back/forward arrives carrying its own depth and adopts it.
    function stamp() {
      var st = history.state;
      if (st && typeof st.sdD === 'number') depth = st.sdD;
      else { depth += 1; history.replaceState({ sdD: depth }, ''); }
    }

    history.replaceState({ sdD: 0 }, '');
    w.addEventListener('hashchange', stamp);

    w.back = function (to) {
      if (depth > 0) { history.back(); return; }
      // Nothing of ours to go back to — the person arrived here by deep link.
      // Replace rather than push, so the next system back leaves the page
      // instead of bouncing between two screens.
      var h = '#' + String(to || HOME).replace(/^#/, '');
      history.replaceState({ sdD: 0 }, '', h);
      depth = 0;
      if (typeof route === 'function') route();
    };
  };

  /* ── standalone pages: ← returns to wherever you came FROM ──────── */
  /* kundli.html and premium.html hard-coded `location.href='dashboard.html'`,
     so opening Kundli from Explore and pressing ← dumped you on Home instead
     of back in Explore. Going back through history returns you to the exact
     screen — including the astrology hash you left from.
     The fallback still matters: opened cold from the home-screen icon or a
     shared link there is no history to go back to, and history.back() would
     leave the site entirely. */
  /* Every page that loads this file records itself on the way out. That gives
     sdBack a signal that is actually trustworthy:
       · document.referrer is empty under a strict referrer policy and on
         file://, which sent every back tap to the fallback
       · history.length counts entries the browser made for other sites too —
         arriving from a Google result would make history.back() leave the app
     sessionStorage is per-tab and survives same-tab navigation, so a stored
     same-origin previous page means "you got here from inside the app". */
  var PREV = 'sd_navPrev';
  try {
    w.addEventListener('pagehide', function () {
      try { sessionStorage.setItem(PREV, location.href); } catch (e) {}
    });
  } catch (e) {}

  w.sdBack = function (fallback) {
    var dest = fallback || 'dashboard.html', cameFromApp = false;
    try {
      var prev = sessionStorage.getItem(PREV);
      cameFromApp = !!prev && prev.indexOf(location.origin) === 0
                    && prev.split('#')[0] !== location.href.split('#')[0];
    } catch (e) {}

    if (cameFromApp && history.length > 1) {
      var here = location.href;
      history.back();
      // If that went nowhere, the person must not be left staring at the page
      // they just tried to leave.
      setTimeout(function () {
        if (location.href === here) location.href = dest;
      }, 450);
      return;
    }
    location.href = dest;
  };

})(window);
