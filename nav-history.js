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
    var restoring = false, backMove = false;

    // Tabs have the same problem as the hash router: switching from a scrolled
    // Home into Mantras kept the offset, so Mantras opened part-way down.
    w.addEventListener('popstate', function () { backMove = true; });
    scrollMemory(function () { var b = backMove; backMove = false; return b; });

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


  /* ── scroll position across in-app navigation ────────────────────
     A hash router swaps the page's HTML but the scroll position belongs to the
     document, not the content — so tapping Choghadiya from halfway down Explore
     could open Choghadiya already scrolled halfway down. Worse, browsers differ here:
     history.scrollRestoration defaults to 'auto', meaning the browser restores
     ITS remembered offset for that entry whenever it likes. That is why this
     reproduces on a phone and not in a headless browser — the behaviour is the
     browser's, not the app's.

     Taking it over explicitly: a NEW page always opens at the top, the way a
     normal web page does, and going BACK returns you to exactly where you were
     reading, which is the one case where keeping the offset is what you want. */
  function scrollMemory(isBackRef) {
    var saved = {}, curr = (location.hash || '').slice(1) || 'hub';
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}

    w.addEventListener('scroll', function () {
      saved[curr] = w.scrollY || w.pageYOffset || 0;
    }, { passive: true });

    w.addEventListener('hashchange', function () {
      var was = curr;
      curr = (location.hash || '').slice(1) || 'hub';
      if (was === curr) return;
      var back = isBackRef();
      // The page's own hashchange listener is registered first, so the new view
      // is already rendered by now. rAF waits one frame for layout to settle,
      // or the browser clamps the offset against the height of the OLD page.
      w.requestAnimationFrame(function () {
        var y = (back && saved[curr] != null) ? saved[curr] : 0;
        w.scrollTo(0, y);
      });
    });
  }

  /* ── astrology: ← undoes a step instead of adding one ───────────── */
  w.sdHashBack = function (opts) {
    var route = opts.route, HOME = opts.home || 'hub';
    var depth = 0, backMove = false;

    // popstate fires before hashchange on a back/forward, so the scroll handler
    // can tell "the person pressed back" from "the person opened something new".
    w.addEventListener('popstate', function () { backMove = true; });
    scrollMemory(function () {
      var b = backMove; backMove = false; return b;
    });

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
      if (depth > 0) { if (w.sdMarkBack) w.sdMarkBack(); history.back(); return; }
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

  /* ── scroll position across in-page routes ─────────────────────────
     A single-page app re-renders its container without touching the window
     scroll, so tapping a tile near the bottom of Explore opened Choghadiya
     already scrolled halfway down — the person had to scroll UP to find the
     heading. A new page must start at its top.

     Going back is the opposite: returning to a long list should put you back
     where you were standing in it, not at the top again. So position is
     remembered per route and restored ONLY on a backward move.

     scrollRestoration is set to manual because the browser's own guess is
     made before the router has rendered anything, and lands on the wrong
     place once the content changes height. */
  w.sdScrollRoutes = function (opts) {
    opts = opts || {};
    var home = opts.home || 'hub';
    var POS = {}, cur = location.hash || ('#' + home), back = false;

    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}

    function y() { return w.scrollY || document.documentElement.scrollTop || 0; }
    // Track continuously: by the time hashchange fires the router has already
    // replaced the DOM, and reading the position then gives the NEW page's.
    w.addEventListener('scroll', function () { POS[cur] = y(); }, { passive: true });

    w.addEventListener('popstate', function () { back = true; });
    w.sdMarkBack = function () { back = true; };

    w.addEventListener('hashchange', function () {
      var prev = cur;
      cur = location.hash || ('#' + home);
      var target = (back && POS[cur] != null) ? POS[cur] : 0;
      if (!back) POS[prev] = POS[prev] || 0;
      back = false;
      // The router renders on its own hashchange listener, registered first.
      // Two frames lets late content (engine tables) settle before we jump.
      w.scrollTo(0, target);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { w.scrollTo(0, target); });
      });
    });
  };

})(window);
