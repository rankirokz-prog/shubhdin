/* ══════════════════════════════════════════════════════════════════
   REPORT CATALOG — the single source for the seven paid reports.
   Before this file, premium.html and buy.html each carried their own copy of
   the names and prices, so they could drift apart silently (and a price shown
   on the sales page could differ from the price charged). Anything that needs
   to name, price, link to or list a report reads this.
   ids are exactly those in owned-contract.md, because sd_owned_reports records
   are keyed on them:
       marriage · love · career · child · muhurta · annual · forecast
   Consumers: premium.html (sales cards), reports.html (My Reports).
   buy.html migrates onto this on the buy session's side — until then, any
   price change here must be mirrored there.
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  var CATALOG = [
    {
      id: 'marriage', hero: true, ico: '💍',
      hi: 'विवाह मिलान', en: 'Marriage Compatibility Report',
      was: 799, now: 399,
      anchor: 'card-marriage',
      route: 'buy.html?r=marriage',
      page: 'marriage-report.html',
      hook: 'Will your charts align? What your two kundlis say about compatibility, doshas and the right time to marry.',
      chips: ['Guna Milan', 'Manglik Dosha', 'Marriage timing', 'Shubh dates']
      // 'Spouse nature' REMOVED. Marriage is a TWO-CHART report and never calls
      // getLoveProfile; its six domain scores are compatibility BETWEEN two people,
      // not a description of one spouse. Verified against the rendered PDF: 29
      // sections, none of them spouse nature. The Love report answers that question
      // properly (7th lord, elements, D9) and carries the 'Partner nature' chip,
      // which IS backed — so this is a cross-sell, not a gap.
    },
    {
      id: 'love', ico: '❤️',
      hi: 'प्रेम रिपोर्ट', en: 'Love & Relationship',
      was: 499, now: 199,
      anchor: 'card-love',
      route: 'buy.html?r=love',
      page: 'love-report.html',
      hook: 'Your relationship patterns, partner nature and the periods that matter most in love.',
      chips: ['Love life', 'Partner nature', 'Compatibility', 'Relationship timing']
    },
    {
      id: 'career', ico: '💼',
      hi: 'करियर रिपोर्ट', en: 'Career & Wealth',
      was: 499, now: 199,
      anchor: 'card-career',
      route: 'buy.html?r=career',
      page: 'career-report.html',
      hook: 'Which path actually suits you — and when do the growth periods arrive?',
      chips: ['Career strengths', 'Right fields', 'Job vs business', 'Growth periods']
    },
    {
      id: 'child', ico: '👶',
      hi: 'संतान रिपोर्ट', en: 'Child & Family',
      was: 499, now: 199,
      anchor: 'card-child',
      route: 'buy.html?r=child',
      page: 'child-report.html',
      hook: 'Santaan yog in your chart, favourable timing and auspicious naming letters.',
      chips: ['Santaan Yog', 'Right timing', 'Family prospects', 'Naming letters']
    },
    {
      id: 'muhurta', ico: '🕉️',
      /* UNLISTED — withdrawn from sale, deliberately NOT deleted.

         WHY IT WAS PULLED
         The free Muhurta Finder in Explore already runs the same engine call,
         the same classical rules and the same birth chart. The paid version
         added an arbitrary date range and a PDF, which is not ₹199 of
         difference. It also shipped with no occasion picker in buy.html, so
         every buyer silently received griha-pravesh dates whatever they
         wanted — a vehicle buyer got house dates with no way to know.

         WHY IT IS STILL HERE
         Anyone who ALREADY bought it must keep seeing it in My Reports and be
         able to reopen their PDF. Deleting the entry makes reportById() return
         null and their purchase disappears from the list. Delisting hides it
         from sale only. Sales surfaces must therefore call reportsForSale();
         reportById(), reportName() and sdOwnedIds() deliberately still resolve it.

         BEFORE IT COMES BACK, two claims below must be fixed or dropped:
         the hook and chips promise 'Marriage', but a marriage muhurta needs
         BOTH charts and the finder excludes it for exactly that reason. And
         it must be worth the money: per-day choghadiya, Rahu Kaal and
         good-window bands for the event city — things the free finder does
         not print and the engine already computes. Location was measured and
         changes nothing in the current report, so asking where the house is
         only earns its place once those bands are printed. */
      unlisted: true,
      hi: 'मुहूर्त रिपोर्ट', en: 'Personal Muhurta',
      was: 499, now: 199,
      anchor: 'card-muhurta',
      route: 'buy.html?r=muhurta',
      page: 'muhurta-report.html',
      hook: 'Shubh dates computed for your chart — marriage, griha pravesh, new business and more.',
      chips: ['Marriage', 'Griha Pravesh', 'Business start', 'Vehicle', 'Your shubh dates']
    },
    {
      id: 'annual', ico: '🗓️',
      hi: 'वार्षिक फल', en: 'Annual Varshaphal',
      was: 499, now: 199,
      anchor: 'card-annual',
      route: 'buy.html?r=annual',
      page: 'annual-report.html',
      hook: 'Your coming year, month by month — the strong periods, the careful ones, and remedies.',
      chips: ['Year ahead', 'Month-by-month', 'Major periods', 'Remedies']
    },
    {
      id: 'forecast', ico: '🔮',
      hi: '10 वर्ष का रोडमैप', en: '10-Year Forecast',
      was: 599, now: 299,
      anchor: 'card-forecast',
      route: 'buy.html?r=forecast',
      page: 'forecast-report.html',
      hook: 'A decade mapped from your dasha and transits — the turning points worth planning around.',
      chips: ['Dasha periods', 'Transits', 'Turning points', '10-year timeline']
    }
  ];
  var byId = {};
  CATALOG.forEach(function (r) { byId[r.id] = r; });
  root.REPORT_CATALOG = CATALOG;
  /* Sales surfaces must use this, never CATALOG directly. It drops anything
     withdrawn from sale while leaving byId untouched, so a report someone
     already owns still resolves by name, price and page. */
  root.reportsForSale = function () {
    return CATALOG.filter(function (r) { return !r.unlisted; });
  };
  root.reportById = function (id) { return byId[id] || null; };
  root.reportName = function (id, hindi) {
    var r = byId[id];
    if (!r) return id;                 // unknown id renders as itself, never "undefined"
    return hindi ? r.hi : r.en;
  };
  root.reportDiscount = function (id) {
    var r = byId[id];
    return r ? Math.round((1 - r.now / r.was) * 100) + '% OFF' : '';
  };
  /* ── ownership, per owned-contract.md ──
     Copied VERBATIM from the contract. Do not re-interpret this key: it
     returns [] on missing, corrupt or non-array content and never throws,
     and the filter drops malformed entries so one bad record cannot blank
     the whole list. */
  root.sdOwnedRead = function () {
    try {
      var a = JSON.parse(localStorage.getItem('sd_owned_reports') || '[]');
      return Array.isArray(a) ? a.filter(function (x) { return x && x.report; }) : [];
    } catch (e) { return []; }
  };
  /* Owned ids that this catalog actually knows about — a record for a retired
     or mistyped report must not render a blank row. */
  root.sdOwnedIds = function () {
    var out = {};
    root.sdOwnedRead().forEach(function (o) { if (byId[o.report]) out[o.report] = o; });
    return out;
  };
})(window);
