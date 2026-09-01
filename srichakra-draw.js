/* ═══════════════════════════════════════════════════════════════════════════
   srichakra-draw.js — Shubh Din · daily Sri Chakra card

   Draws the Sri Chakra as an SVG string from a SOLVED, GATED geometry.
   No fetch, no DOM, no dependencies: works in the page and inside the
   share-image canvas path (same origin, so toBlob can never taint).

   GEOMETRY
     The nine triangles below are not free-hand. They were solved so that all
     31 concurrency points close to < 1e-11 (18 marma sthanas + 6 base
     corners on a side + 7 apexes on a base), the two outermost triangles
     touch the circle at all three vertices, the innermost triangle is
     equilateral and its incentre is the centre of the circle (bindu).
     These twelve-decimal constants are GENERATED from srichakra-geometry.json
     (tools/), never typed. verify-srichakra.py v2 prints PASS on them, and
     test-srichakra-draw.js fails if they drift from the file by more than
     1e-11. A six-decimal rounding of these numbers splits four triple points
     and fails the gate (review 2) — do not round, do not retype.

     Names follow Kavi Mahesh (2023): the nine triangles are named after the
     Navagraha, which happens to be the vocabulary this app already speaks.

   THE FIFTEEN NITYAS
     Tradition places the fifteen tithi-nitya devis on the three sides of the
     innermost triangle, five to a side, and Mahakameshvari at the bindu.
     sdSriChakra.station(n) returns the point for tithi n (1..15) on that
     triangle's perimeter; station(0) is the bindu. Which corner the count
     starts from and whether it runs anticlockwise is a ruling for a
     Sri-Vidya-literate reviewer — see START_CORNER / ANTICLOCKWISE.

   RULE OF THE CARD: name and contemplate, never prescribe. This file draws.
   It carries no mantra, no bija, no remedy. Keep it that way.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.sdSriChakra = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* unit circle, y up, bindu at (0,0). base_y, half_width, apex_y */
  var TRI = {
    D1: { graha: 'Kuja',    dir: 'down', b: 0.300000000000, w: 0.953939201417, a: -1.000000000000 },
    D2: { graha: 'Chandra', dir: 'down', b: 0.524275668484, w: 0.677695479203, a: -0.647781193489 },
    D3: { graha: 'Ravi',    dir: 'down', b: 0.716833319104, w: 0.483608923662, a: -0.120801907671 },
    D4: { graha: 'Budha',   dir: 'down', b: 0.169475027463, w: 0.319026197471, a: -0.515029498599 },
    D5: { graha: 'Guru',    dir: 'down', b: 0.060400953836, w: 0.219113030747, a: -0.240000000000 },
    U1: { graha: 'Shani',   dir: 'up',   b: -0.240000000000, w: 0.970772887961, a: 1.000000000000 },
    U2: { graha: 'Rahu',    dir: 'up',   b: -0.515029498599, w: 0.717987681083, a: 0.716833319104 },
    U3: { graha: 'Ketu',    dir: 'up',   b: -0.647781193489, w: 0.413835198329, a: 0.300000000000 },
    U4: { graha: 'Shukra',  dir: 'up',   b: -0.120801907671, w: 0.304704909138, a: 0.524275668484 }
  };
  var ORDER = ['D1', 'U1', 'D2', 'U2', 'D3', 'U3', 'D4', 'U4', 'D5'];   // draw big → small

  /* Innermost triangle (sarva-siddhi-prada): top edge is the Guru base cut by
     the Ravi sides, apex is the Ravi apex. Equilateral, incentre at (0,0). */
  function innerTriangle() {
    var g = TRI.D5, r = TRI.D3;
    var yb = g.b, ya = r.a;
    var w = r.w * (yb - r.a) / (r.b - r.a);          // Ravi side x at the Guru base height
    return { apex: [0, ya], left: [-w, yb], right: [w, yb] };
  }

  /* Ring radii in units of the triangle circle. Classical proportions: the
     three circles, then eight petals, then sixteen, then the earth-square. */
  var R_TRI = 1.00, R_C2 = 1.045, R_C3 = 1.09,
      R_P8_IN = 1.09, R_P8_OUT = 1.30,
      R_P16_IN = 1.32, R_P16_OUT = 1.56,
      R_OUTER = 1.60, BHU = 1.92, BHU_GATE = 0.34, BHU_DEPTH = 0.14;

  /* ── Nitya stations ────────────────────────────────────────────────────
     15 on the perimeter of the innermost triangle, 5 per side, none on a
     corner. Path runs from START_CORNER around the triangle. Defaults below
     are the common diagram convention; both are one-line changes once the
     ruling comes back. */
  var START_CORNER = 'apex';        // 'apex' | 'right' | 'left'
  var ANTICLOCKWISE = true;

  function station(n) {
    if (!n) return { x: 0, y: 0 };                          // bindu
    var t = innerTriangle();
    var corners = { apex: t.apex, right: t.right, left: t.left };
    var cw = ['apex', 'left', 'right'], ccw = ['apex', 'right', 'left'];   // y-up orientation
    var seq = ANTICLOCKWISE ? ccw : cw;
    while (seq[0] !== START_CORNER) seq.push(seq.shift());
    var side = Math.floor((n - 1) / 5), k = (n - 1) % 5;
    var A = corners[seq[side]], B = corners[seq[(side + 1) % 3]];
    /* (k+1)/6, not (k+0.5)/5: on an equilateral triangle two points each a
       distance d from a corner are exactly d apart, so sixths make every
       adjacent pair — along a side or across a corner — the same distance. */
    var f = (k + 1) / 6;
    return { x: A[0] + (B[0] - A[0]) * f, y: A[1] + (B[1] - A[1]) * f };
  }

  /* ── SVG ─────────────────────────────────────────────────────────────── */
  function fmt(v) { return (Math.round(v * 10000) / 10000).toString(); }

  function petals(count, rIn, rOut, S, fill, stroke, sw) {
    var out = '';
    for (var i = 0; i < count; i++) {
      var a0 = (2 * Math.PI * i) / count, a1 = (2 * Math.PI * (i + 1)) / count, am = (a0 + a1) / 2;
      var bulge = rIn + (rOut - rIn) * 0.62;
      var p = [
        [rIn * Math.cos(a0), rIn * Math.sin(a0)],
        [bulge * Math.cos(a0 + (am - a0) * 0.45), bulge * Math.sin(a0 + (am - a0) * 0.45)],
        [rOut * Math.cos(am), rOut * Math.sin(am)],
        [bulge * Math.cos(a1 - (a1 - am) * 0.45), bulge * Math.sin(a1 - (a1 - am) * 0.45)],
        [rIn * Math.cos(a1), rIn * Math.sin(a1)]
      ].map(function (q) { return [fmt(q[0] * S), fmt(-q[1] * S)]; });
      out += '<path d="M' + p[0][0] + ' ' + p[0][1] +
             ' Q' + p[1][0] + ' ' + p[1][1] + ' ' + p[2][0] + ' ' + p[2][1] +
             ' Q' + p[3][0] + ' ' + p[3][1] + ' ' + p[4][0] + ' ' + p[4][1] +
             '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
    }
    return out;
  }

  function bhupura(S, stroke, sw) {
    /* Earth-square with a T-gate in each side. One closed path traced from
       the top-left corner, clockwise. h = half side, g = half gate width,
       d = gate depth (outward). */
    var h = BHU * S, g = BHU_GATE * S, d = BHU_DEPTH * S, gl = g * 0.62;
    var pts = [];
    function P(x, y) { pts.push(fmt(x) + ' ' + fmt(-y)); }
    /* top side, left → right */
    P(-h, h); P(-g, h); P(-g, h + d * 0.5); P(-gl, h + d * 0.5); P(-gl, h + d); P(gl, h + d); P(gl, h + d * 0.5); P(g, h + d * 0.5); P(g, h);
    /* right side, top → bottom */
    P(h, h); P(h, g); P(h + d * 0.5, g); P(h + d * 0.5, gl); P(h + d, gl); P(h + d, -gl); P(h + d * 0.5, -gl); P(h + d * 0.5, -g); P(h, -g);
    /* bottom side, right → left */
    P(h, -h); P(g, -h); P(g, -h - d * 0.5); P(gl, -h - d * 0.5); P(gl, -h - d); P(-gl, -h - d); P(-gl, -h - d * 0.5); P(-g, -h - d * 0.5); P(-g, -h);
    /* left side, bottom → top */
    P(-h, -h); P(-h, -g); P(-h - d * 0.5, -g); P(-h - d * 0.5, -gl); P(-h - d, -gl); P(-h - d, gl); P(-h - d * 0.5, gl); P(-h - d * 0.5, g); P(-h, g);
    var line = '<path d="M' + pts.join(' L') + ' Z" fill="none" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="miter"/>';
    /* the traditional three parallel lines of the bhupura */
    var inner = '<rect x="' + fmt(-h * 0.955) + '" y="' + fmt(-h * 0.955) + '" width="' + fmt(h * 1.91) + '" height="' + fmt(h * 1.91) +
                '" fill="none" stroke="' + stroke + '" stroke-width="' + (sw * 0.55) + '" opacity="0.55"/>';
    return line + inner;
  }

  /**
   * svg(opts) → string
   *   size        px, square                                 default 360
   *   station     0 = bindu, 1..15 = tithi nitya position    default 0
   *   glow        draw the lit station                       default true
   *   outer       draw lotuses and bhupura                   default true
   *   lit         array of station numbers already "home in the moon": drawn
   *               as small steady dots (the story so far)
   *   state       'day' (default) | 'purnima' (all fifteen lit, ripple) |
   *               'amavasya' (bindu only, stations as empty rings)
   *   motion      'in' (a spark travels from the sun to today's station) |
   *               'out' (from the station to the sun) | null
   *   animate     SMIL animation on/off                          default true
   *   zoom        units from centre to edge, e.g. 0.34 — shows the innermost
   *               triangle large, clipped to a circle. THE CARD MUST USE THIS:
   *               the fifteen stations span 0.19 R, invisible at 132 px unzoomed.
   *   theme       { bg, line, gold, glow, bindu, petal8, petal16 }
   *   id          prefix for gradient ids (unique per instance on a page)
   */
  function svg(opts) {
    opts = opts || {};
    var size = opts.size || 360, st = opts.station || 0, id = opts.id || 'sdsc';
    var th = Object.assign({
      bg: 'none', line: '#D4A843', gold: '#F1D27A', glow: '#FFE9A8',
      bindu: '#FF6B3D', petal8: 'rgba(212,168,67,0.10)', petal16: 'rgba(212,168,67,0.06)'
    }, opts.theme || {});
    var zoom = opts.zoom || 0;
    var outer = !zoom && opts.outer !== false;
    var span = zoom ? zoom : (outer ? (BHU + BHU_DEPTH + 0.06) : 1.06);   // units shown from centre to edge
    var S = size / 2 / span;                                          // px per unit
    var sw = Math.max(0.6, size / 520);                               // hairline that survives 1080px too
    var c = size / 2;
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">';
    o += '<defs>' +
         '<radialGradient id="' + id + 'g"><stop offset="0" stop-color="' + th.glow + '" stop-opacity="1"/>' +
         '<stop offset="0.45" stop-color="' + th.gold + '" stop-opacity="0.55"/><stop offset="1" stop-color="' + th.gold + '" stop-opacity="0"/></radialGradient>' +
         '<radialGradient id="' + id + 'b"><stop offset="0" stop-color="#FFF4DE"/><stop offset="0.5" stop-color="' + th.bindu + '"/><stop offset="1" stop-color="' + th.bindu + '" stop-opacity="0"/></radialGradient>' +
         '</defs>';
    if (zoom) o += '<clipPath id="' + id + 'c"><circle cx="0" cy="0" r="' + fmt(c - 0.5) + '"/></clipPath>';
    if (th.bg !== 'none') o += '<rect width="' + size + '" height="' + size + '" fill="' + th.bg + '"/>';
    o += '<g transform="translate(' + c + ' ' + c + ')"' + (zoom ? ' clip-path="url(#' + id + 'c)"' : '') + '>';
    if (zoom) o += '<circle r="' + fmt(c - 0.5) + '" fill="rgba(212,168,67,0.04)" stroke="' + th.line + '" stroke-width="' + sw + '" opacity="0.6"/>';
    if (outer) {
      o += bhupura(S, th.line, sw);
      o += '<circle r="' + fmt(R_OUTER * S) + '" fill="none" stroke="' + th.line + '" stroke-width="' + sw + '"/>';
      o += petals(16, R_P16_IN, R_P16_OUT, S, th.petal16, th.line, sw * 0.9);
      o += petals(8, R_P8_IN, R_P8_OUT, S, th.petal8, th.line, sw * 0.9);
      o += '<circle r="' + fmt(R_C3 * S) + '" fill="none" stroke="' + th.line + '" stroke-width="' + sw + '"/>';
      o += '<circle r="' + fmt(R_C2 * S) + '" fill="none" stroke="' + th.line + '" stroke-width="' + (sw * 0.7) + '"/>';
    }
    o += '<circle r="' + fmt(R_TRI * S) + '" fill="none" stroke="' + th.line + '" stroke-width="' + sw + '"/>';
    /* nine triangles */
    ORDER.forEach(function (k) {
      var t = TRI[k];
      o += '<polygon points="' + fmt(-t.w * S) + ',' + fmt(-t.b * S) + ' ' + fmt(t.w * S) + ',' + fmt(-t.b * S) + ' 0,' + fmt(-t.a * S) +
           '" fill="none" stroke="' + th.line + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
    });
    /* the lit station of the day */
    /* ── the story layer ─────────────────────────────────────────────────
       Sizes are in units of the radius and shrink with the zoom, so a station
       is always a point on a side, never a blob over the triangle. */
    var gr = (st ? 0.16 : 0.22), dot = 0.022;
    if (zoom) { gr = Math.min(gr, 0.06); dot = 0.011; }
    var state = opts.state || 'day', anim = opts.animate !== false, motion = opts.motion || null;
    var lit = (opts.lit || []).slice();
    if (state === 'purnima') { lit = []; for (var i = 1; i <= 15; i++) lit.push(i); }
    if (state === 'amavasya') lit = [];
    var P = function (n) { var q = station(n); return [fmt(q.x * S), fmt(-q.y * S)]; };
    var sunAngle = Math.PI / 4, sunR = span * 0.98;                  // the sun sits at the top-right rim
    var sun = [fmt(Math.cos(sunAngle) * sunR * S), fmt(-Math.sin(sunAngle) * sunR * S)];
    /* empty rings at every station (the seats), faint */
    for (var n = 1; n <= 15; n++) {
      var q = P(n);
      o += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + fmt(dot * 0.9 * S) + '" fill="none" stroke="' + th.gold + '" stroke-width="' + (sw * 0.6) + '" opacity="0.28"/>';
    }
    /* the ones already home: steady small dots. On purnima they light one by one. */
    lit.forEach(function (n, idx) {
      if (state !== 'purnima' && n === st) return;
      var q = P(n);
      o += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + fmt(dot * 0.75 * S) + '" fill="' + th.gold + '" opacity="0.85">' +
           (anim && state === 'purnima' ? '<animate attributeName="opacity" values="0;0.95;0.85" dur="0.6s" begin="' + fmt(idx * 0.13) + 's" fill="freeze"/>' : '') + '</circle>';
      if (state === 'purnima') o += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + fmt(gr * 0.55 * S) + '" fill="url(#' + id + 'g)" opacity="0.7">' +
           (anim ? '<animate attributeName="opacity" values="0;0.7" dur="0.6s" begin="' + fmt(idx * 0.13) + 's" fill="freeze"/><animate attributeName="opacity" values="0.7;0.35;0.7" dur="3s" begin="' + fmt(15 * 0.13 + 0.8) + 's" repeatCount="indefinite"/>' : '') + '</circle>';
    });
    if (opts.glow !== false && state === 'day' && st) {
      var q0 = P(st), delay = motion && anim ? 2.1 : 0;
      /* today's seat: glow + dot, arriving after the spark if there is one */
      /* opacity attribute stays 1 so a renderer without SMIL still shows the seat;
         the animation is what hides it until the spark lands */
      o += '<g opacity="1">' + (delay ? '<animate attributeName="opacity" values="0;0;1" keyTimes="0;' + fmt(delay / (delay + 0.5)) + ';1" dur="' + fmt(delay + 0.5) + 's" begin="0s" fill="freeze"/>' : '') +
           '<circle cx="' + q0[0] + '" cy="' + q0[1] + '" r="' + fmt(gr * S) + '" fill="url(#' + id + 'g)">' +
           (anim ? '<animate attributeName="r" values="' + fmt(gr * S) + ';' + fmt(gr * 1.25 * S) + ';' + fmt(gr * S) + '" dur="2.6s" begin="' + fmt(delay + 0.5) + 's" repeatCount="indefinite"/>' : '') + '</circle>' +
           '<circle cx="' + q0[0] + '" cy="' + q0[1] + '" r="' + fmt(dot * S) + '" fill="' + th.glow + '"/></g>';
      if (motion === 'out') {
        /* leaving: the dot stays lit but the seat empties as the spark departs */
        o += '<circle cx="' + q0[0] + '" cy="' + q0[1] + '" r="' + fmt(dot * S) + '" fill="' + th.glow + '">' +
             (anim ? '<animate attributeName="opacity" values="1;1;0.35" dur="2.4s" begin="0s" fill="freeze"/>' : '') + '</circle>';
      }
      if (motion && anim) {
        /* the spark: a curved flight between the sun and today's seat */
        var from = motion === 'in' ? sun : q0, to = motion === 'in' ? q0 : sun;
        var mx = (parseFloat(from[0]) + parseFloat(to[0])) / 2 - (parseFloat(to[1]) - parseFloat(from[1])) * 0.35;
        var my = (parseFloat(from[1]) + parseFloat(to[1])) / 2 + (parseFloat(to[0]) - parseFloat(from[0])) * 0.35;
        var path = 'M' + from[0] + ' ' + from[1] + ' Q' + fmt(mx) + ' ' + fmt(my) + ' ' + to[0] + ' ' + to[1];
        o += '<path d="' + path + '" fill="none" stroke="' + th.gold + '" stroke-width="' + (sw * 0.8) + '" stroke-dasharray="' + fmt(size * 3) + '" stroke-dashoffset="' + fmt(size * 3) + '" opacity="0.35">' +
             '<animate attributeName="stroke-dashoffset" from="' + fmt(size * 3) + '" to="0" dur="2s" begin="0.1s" fill="freeze"/>' +
             '<animate attributeName="opacity" values="0.35;0.35;0" dur="3s" begin="0.1s" fill="freeze"/></path>';
        o += '<circle r="' + fmt(dot * 1.3 * S) + '" fill="' + th.glow + '" opacity="0">' +
             '<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="2.1s" begin="0.1s" fill="freeze"/>' +
             '<animateMotion dur="2s" begin="0.1s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" path="' + path + '"/></circle>';
        o += '<circle r="' + fmt(gr * 0.9 * S) + '" fill="url(#' + id + 'g)" opacity="0">' +
             '<animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.1;0.9;1" dur="2.1s" begin="0.1s" fill="freeze"/>' +
             '<animateMotion dur="2s" begin="0.1s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" path="' + path + '"/></circle>';
      }
      /* a small sun at the rim so the flight has a visible source or destination */
      if (motion) o += '<circle cx="' + sun[0] + '" cy="' + sun[1] + '" r="' + fmt(0.05 * S) + '" fill="url(#' + id + 'g)" opacity="0.9"/>' +
                       '<circle cx="' + sun[0] + '" cy="' + sun[1] + '" r="' + fmt(0.014 * S) + '" fill="' + th.glow + '"/>';
    }
    /* bindu */
    var br = zoom ? 0.026 : 0.055, bi = zoom ? 0.008 : 0.016;
    var bScale = state === 'amavasya' ? 2.2 : (state === 'purnima' ? 1.6 : (st ? 1 : 1.4));
    o += '<circle r="' + fmt(br * bScale * S) + '" fill="url(#' + id + 'b)">' +
         (anim && (state !== 'day' || !st) ? '<animate attributeName="r" values="' + fmt(br * bScale * S) + ';' + fmt(br * bScale * 1.35 * S) + ';' + fmt(br * bScale * S) + '" dur="' + (state === 'amavasya' ? '4.5s' : '3s') + '" repeatCount="indefinite"/>' : '') + '</circle>';
    o += '<circle r="' + fmt(bi * S) + '" fill="#FFF4DE"/>';
    o += '</g></svg>';
    return o;
  }

  /* ── moon glyph ────────────────────────────────────────────────────────
     Illuminated fraction from the tithi: waxing f = (1-cos(π t/15))/2, waning
     f = (1+cos(π t/15))/2. Waxing moon is lit on the right as seen from India. */
  function moonFraction(tithi, paksha) {
    tithi = Math.max(0, Math.min(15, +tithi || 0));
    var c = Math.cos(Math.PI * tithi / 15);
    return paksha === 'krishna' ? (1 + c) / 2 : (1 - c) / 2;
  }
  function moonSVG(tithi, paksha, size, theme) {
    var th = Object.assign({ dark: '#3A2408', lit: '#F1D27A', rim: 'rgba(212,168,67,0.55)' }, theme || {});
    var f = moonFraction(tithi, paksha), r = size / 2 - 1, c = size / 2;
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" class="sd-moon">';
    o += '<circle cx="' + c + '" cy="' + c + '" r="' + fmt(r) + '" fill="' + th.dark + '" stroke="' + th.rim + '" stroke-width="1"/>';
    if (f > 0.995) o += '<circle cx="' + c + '" cy="' + c + '" r="' + fmt(r) + '" fill="' + th.lit + '"/>';
    else if (f > 0.005) {
      var rx = fmt(Math.abs(2 * f - 1) * r), right = paksha !== 'krishna';
      var side = right ? 1 : 0, terminator = (f > 0.5) === right ? 1 : 0;
      o += '<path d="M' + c + ' ' + fmt(c - r) + ' A' + fmt(r) + ' ' + fmt(r) + ' 0 0 ' + side + ' ' + c + ' ' + fmt(c + r) +
           ' A' + rx + ' ' + fmt(r) + ' 0 0 ' + terminator + ' ' + c + ' ' + fmt(c - r) + ' Z" fill="' + th.lit + '"/>';
    }
    return o + '</svg>';
  }

  return { svg: svg, station: station, geometry: TRI, innerTriangle: innerTriangle,
           moonFraction: moonFraction, moonSVG: moonSVG,
           config: { START_CORNER: START_CORNER, ANTICLOCKWISE: ANTICLOCKWISE } };
}));
