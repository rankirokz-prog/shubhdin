/* lib/tz.js — the birth moment, done properly.
   Shared by api/ (CommonJS) and, via sd-tz.js, by the pages (same code).

   RULES (F1 spec):
   · Store the IANA zone (Europe/London), never an offset. Offsets depend on
     the zone AND the date: DST, and historical rules (India ran +6:30 in
     1942–45; the US moved its DST dates in 2007).
   · The offset for a birth comes from Intl at that date — every browser and
     Node already carry the full tz database; nothing is bundled.
   · A local wall-clock time → instant is the OPPOSITE direction from reading
     an offset and needs two passes (guess, re-read the offset at the guess).
   · Two edge cases are decided, recorded, never silent:
       gap     — spring-forward, the wall time never existed → shift forward
                 by the gap (01:30 → 02:30 on a +1h change), flagged 'gap'
       overlap — autumn fall-back, the wall time happened twice → the FIRST
                 occurrence (the earlier instant), flagged 'overlap'
   · No zone → no answer. Never default to Asia/Kolkata: that is the bug. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.sdTz = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var cache = {};
  function dtf(zone) {
    if (!cache[zone]) cache[zone] = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return cache[zone];
  }
  function isZone(zone) {
    if (typeof zone !== 'string' || !zone) return false;
    try { dtf(zone); return true; } catch (e) { return false; }
  }
  /* offset in minutes east of UTC at a given instant */
  function zoneOffsetMinutes(instant, zone) {
    var p = {}; dtf(zone).formatToParts(instant).forEach(function (x) { p[x.type] = x.value; });
    var h = p.hour === '24' ? 0 : +p.hour;            // some engines print 24 for midnight
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, h, +p.minute, +p.second);
    return Math.round((asUTC - instant.getTime()) / 60000);
  }
  /* local wall clock (y,mo,d,h,mi) in zone → { instant, offsetMinutes, adjusted }
     Candidates come from the offsets in force a day before and a day after
     the wall time (they differ only across a transition). Each candidate is
     validated by converting back and comparing the wall clock. */
  function localWallTimeToInstant(y, mo, d, h, mi, zone) {
    if (!isZone(zone)) return null;
    if (!(y >= 1 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && h >= 0 && h <= 23 && mi >= 0 && mi <= 59)) return null;
    var wall = Date.UTC(y, mo - 1, d, h, mi, 0);
    var chk = new Date(wall); if (chk.getUTCMonth() !== mo - 1 || chk.getUTCDate() !== d) return null;   // 31 Feb etc.
    var offs = [], seen = {};
    [-86400000, 0, 86400000].forEach(function (dt) {
      var o = zoneOffsetMinutes(new Date(wall + dt), zone); if (!seen[o]) { seen[o] = 1; offs.push(o); }
    });
    var valid = [];
    offs.forEach(function (o) {
      var inst = wall - o * 60000;
      var w = instantToWall(new Date(inst), zone);
      if (w.y === y && w.mo === mo && w.d === d && w.h === h && w.mi === mi) valid.push({ instant: inst, off: o });
    });
    var adjusted = null, pick;
    if (valid.length === 1) pick = valid[0];
    else if (valid.length > 1) {                              // happened twice → first occurrence
      valid.sort(function (a, b) { return a.instant - b.instant; }); pick = valid[0]; adjusted = 'overlap';
    } else {                                                  // never existed → shift forward by the gap
      var before = Math.min.apply(null, offs), after = Math.max.apply(null, offs);
      var inst = wall - before * 60000;                       // the instant the wall time WOULD have been under the pre-gap offset
      pick = { instant: inst, off: zoneOffsetMinutes(new Date(inst), zone) }; adjusted = 'gap';
    }
    return { instant: new Date(pick.instant), offsetMinutes: pick.off, zone: zone, adjusted: adjusted };
  }
  /* instant → local wall clock in zone, as { y, mo, d, h, mi, hhmm } */
  function instantToWall(instant, zone) {
    var p = {}; dtf(zone).formatToParts(instant).forEach(function (x) { p[x.type] = x.value; });
    var h = p.hour === '24' ? 0 : +p.hour;
    return { y: +p.year, mo: +p.month, d: +p.day, h: h, mi: +p.minute,
             hhmm: ('0' + h).slice(-2) + ':' + ('0' + (+p.minute)).slice(-2),
             ymd: p.year + '-' + p.month + '-' + p.day };
  }
  /* convenience: "YYYY-MM-DD", "HH:MM", zone → result */
  function birthInstant(dob, tob, zone) {
    var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || '')), tm = /^(\d{1,2}):(\d{2})/.exec(String(tob || ''));
    if (!dm || !tm) return null;
    return localWallTimeToInstant(+dm[1], +dm[2], +dm[3], +tm[1], +tm[2], zone);
  }
  /* page side: lat/lon → zone via /api/tz (once per city pick), and the engine's
     tzOffsetHours for an instant in a zone */
  function fetchZone(lat, lon) {
    var u = '/api/tz?lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon);
    if (typeof location !== 'undefined' && !(location.protocol === 'https:' && location.host)) u = 'https://www.shubhdin.app' + u;
    return fetch(u).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && isZone(j.tz)) ? j.tz : null; }).catch(function () { return null; });
  }
  function offsetHoursAt(instant, zone) { return isZone(zone) ? zoneOffsetMinutes(instant, zone) / 60 : null; }
  function fmtOffset(min) { var s = min < 0 ? '−' : '+'; min = Math.abs(min); return s + ('0' + Math.floor(min / 60)).slice(-2) + ':' + ('0' + (min % 60)).slice(-2); }
  return { isZone: isZone, zoneOffsetMinutes: zoneOffsetMinutes, localWallTimeToInstant: localWallTimeToInstant,
           instantToWall: instantToWall, birthInstant: birthInstant, fmtOffset: fmtOffset,
           fetchZone: fetchZone, offsetHoursAt: offsetHoursAt };
}));
