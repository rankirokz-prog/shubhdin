/* ============================================================
   SHUBH DIN — Offline Panchang Engine
   Phase 2: Five Limbs + Transition Times (Drik-style segments)
   Powered by astronomy-engine (MIT). Runs fully on-device.
   ------------------------------------------------------------
   Depends on: window.Astronomy (load astronomy.min.js first)
   ============================================================ */
(function (global) {
  'use strict';

  const A = global.Astronomy;
  if (!A) { console.error('[PanchangEngine] astronomy.min.js not loaded'); return; }

  // ---- Reference data ----------------------------------------------------
  const TITHI_NAMES = [
    'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami',
    'Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima',
    'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami',
    'Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Amavasya'
  ];
  const TITHI_HI = [
    '\u092a\u094d\u0930\u0924\u093f\u092a\u0926\u093e','\u0926\u094d\u0935\u093f\u0924\u0940\u092f\u093e','\u0924\u0943\u0924\u0940\u092f\u093e','\u091a\u0924\u0941\u0930\u094d\u0925\u0940','\u092a\u0902\u091a\u092e\u0940','\u0937\u0937\u094d\u0920\u0940','\u0938\u092a\u094d\u0924\u092e\u0940',
    '\u0905\u0937\u094d\u091f\u092e\u0940','\u0928\u0935\u092e\u0940','\u0926\u0936\u092e\u0940','\u090f\u0915\u093e\u0926\u0936\u0940','\u0926\u094d\u0935\u093e\u0926\u0936\u0940','\u0924\u094d\u0930\u092f\u094b\u0926\u0936\u0940','\u091a\u0924\u0941\u0930\u094d\u0926\u0936\u0940','\u092a\u0942\u0930\u094d\u0923\u093f\u092e\u093e',
    '\u092a\u094d\u0930\u0924\u093f\u092a\u0926\u093e','\u0926\u094d\u0935\u093f\u0924\u0940\u092f\u093e','\u0924\u0943\u0924\u0940\u092f\u093e','\u091a\u0924\u0941\u0930\u094d\u0925\u0940','\u092a\u0902\u091a\u092e\u0940','\u0937\u0937\u094d\u0920\u0940','\u0938\u092a\u094d\u0924\u092e\u0940',
    '\u0905\u0937\u094d\u091f\u092e\u0940','\u0928\u0935\u092e\u0940','\u0926\u0936\u092e\u0940','\u090f\u0915\u093e\u0926\u0936\u0940','\u0926\u094d\u0935\u093e\u0926\u0936\u0940','\u0924\u094d\u0930\u092f\u094b\u0926\u0936\u0940','\u091a\u0924\u0941\u0930\u094d\u0926\u0936\u0940','\u0905\u092e\u093e\u0935\u0938\u094d\u092f\u093e'
  ];

  const NAKSHATRA_NAMES = [
    'Ashvini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya',
    'Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha',
    'Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta',
    'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
  ];
  const NAKSHATRA_HI = [
    '\u0905\u0936\u094d\u0935\u093f\u0928\u0940','\u092d\u0930\u0923\u0940','\u0915\u0943\u0924\u094d\u0924\u093f\u0915\u093e','\u0930\u094b\u0939\u093f\u0923\u0940','\u092e\u0943\u0917\u0936\u093f\u0930\u093e','\u0906\u0930\u094d\u0926\u094d\u0930\u093e','\u092a\u0941\u0928\u0930\u094d\u0935\u0938\u0941','\u092a\u0941\u0937\u094d\u092f',
    '\u0906\u0936\u094d\u0932\u0947\u0937\u093e','\u092e\u0918\u093e','\u092a\u0942\u0930\u094d\u0935 \u092b\u093e\u0932\u094d\u0917\u0941\u0928\u0940','\u0909\u0924\u094d\u0924\u0930 \u092b\u093e\u0932\u094d\u0917\u0941\u0928\u0940','\u0939\u0938\u094d\u0924','\u091a\u093f\u0924\u094d\u0930\u093e','\u0938\u094d\u0935\u093e\u0924\u093f','\u0935\u093f\u0936\u093e\u0916\u093e',
    '\u0905\u0928\u0941\u0930\u093e\u0927\u093e','\u091c\u094d\u092f\u0947\u0937\u094d\u0920\u093e','\u092e\u0942\u0932','\u092a\u0942\u0930\u094d\u0935\u093e\u0937\u093e\u0922\u093c\u093e','\u0909\u0924\u094d\u0924\u0930\u093e\u0937\u093e\u0922\u093c\u093e','\u0936\u094d\u0930\u0935\u0923','\u0927\u0928\u093f\u0937\u094d\u0920\u093e',
    '\u0936\u0924\u092d\u093f\u0937\u093e','\u092a\u0942\u0930\u094d\u0935 \u092d\u093e\u0926\u094d\u0930\u092a\u0926','\u0909\u0924\u094d\u0924\u0930 \u092d\u093e\u0926\u094d\u0930\u092a\u0926','\u0930\u0947\u0935\u0924\u0940'
  ];
  const NAK_LORDS = [
    'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
    'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
    'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'
  ];

  const YOGA_NAMES = [
    'Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti',
    'Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata',
    'Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'
  ];
  const YOGA_HI = [
    '\u0935\u093f\u0937\u094d\u0915\u092e\u094d\u092d','\u092a\u094d\u0930\u0940\u0924\u093f','\u0906\u092f\u0941\u0937\u094d\u092e\u093e\u0928','\u0938\u094c\u092d\u093e\u0917\u094d\u092f','\u0936\u094b\u092d\u0928','\u0905\u0924\u093f\u0917\u0923\u094d\u0921','\u0938\u0941\u0915\u0930\u094d\u092e\u093e','\u0927\u0943\u0924\u093f',
    '\u0936\u0942\u0932','\u0917\u0923\u094d\u0921','\u0935\u0943\u0926\u094d\u0927\u093f','\u0927\u094d\u0930\u0941\u0935','\u0935\u094d\u092f\u093e\u0918\u093e\u0924','\u0939\u0930\u094d\u0937\u0923','\u0935\u091c\u094d\u0930','\u0938\u093f\u0926\u094d\u0927\u093f','\u0935\u094d\u092f\u0924\u0940\u092a\u093e\u0924',
    '\u0935\u0930\u0940\u092f\u093e\u0928','\u092a\u0930\u093f\u0918','\u0936\u093f\u0935','\u0938\u093f\u0926\u094d\u0927','\u0938\u093e\u0927\u094d\u092f','\u0936\u0941\u092d','\u0936\u0941\u0915\u094d\u0932','\u092c\u094d\u0930\u0939\u094d\u092e','\u0907\u0928\u094d\u0926\u094d\u0930','\u0935\u0948\u0927\u0943\u0924\u093f'
  ];

  const KARANA_MOVABLE = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'];
  const KARANA_MOVABLE_HI = ['\u092c\u0935','\u092c\u093e\u0932\u0935','\u0915\u094c\u0932\u0935','\u0924\u0948\u0924\u093f\u0932','\u0917\u0930','\u0935\u0923\u093f\u091c','\u0935\u093f\u0937\u094d\u091f\u093f'];
  function karanaName(k) {
    if (k === 0) return { en: 'Kimstughna', hi: '\u0915\u093f\u0902\u0938\u094d\u0924\u0941\u0918\u094d\u0928' };
    if (k >= 1 && k <= 56) { const i = (k - 1) % 7; return { en: KARANA_MOVABLE[i], hi: KARANA_MOVABLE_HI[i] }; }
    if (k === 57) return { en: 'Shakuni', hi: '\u0936\u0915\u0941\u0928\u093f' };
    if (k === 58) return { en: 'Chatushpada', hi: '\u091a\u0924\u0941\u0937\u094d\u092a\u093e\u0926' };
    return { en: 'Naga', hi: '\u0928\u093e\u0917' };
  }

  const VARA_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const VARA_HI = ['\u0930\u0935\u093f\u0935\u093e\u0930','\u0938\u094b\u092e\u0935\u093e\u0930','\u092e\u0902\u0917\u0932\u0935\u093e\u0930','\u092c\u0941\u0927\u0935\u093e\u0930','\u0917\u0941\u0930\u0941\u0935\u093e\u0930','\u0936\u0941\u0915\u094d\u0930\u0935\u093e\u0930','\u0936\u0928\u093f\u0935\u093e\u0930'];

  // 12 Rashis (zodiac signs) — sidereal
  const RASHI_EN = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
  const RASHI_HI = ['\u092e\u0947\u0937','\u0935\u0943\u0937\u092d','\u092e\u093f\u0925\u0941\u0928','\u0915\u0930\u094d\u0915','\u0938\u093f\u0902\u0939','\u0915\u0928\u094d\u092f\u093e','\u0924\u0941\u0932\u093e','\u0935\u0943\u0936\u094d\u091a\u093f\u0915','\u0927\u0928\u0941','\u092e\u0915\u0930','\u0915\u0941\u0902\u092d','\u092e\u0940\u0928'];

  // ---- Core astronomy ----------------------------------------------------
  function sunLongitude(date) { return A.Ecliptic(A.GeoVector(A.Body.Sun, date, true)).elon; }
  function moonLongitude(date) { return A.EclipticGeoMoon(date).lon; }

  // Lahiri (Chitrapaksha) ayanamsa, anchored to verified 2026.0 value.
  // CALIBRATION_OFFSET tuned in Phase 3 to align nakshatra/yoga times with Drik.
  const CALIBRATION_OFFSET = 0.10;
  function ayanamsa(date) {
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const yearFrac = 2000.0 + (jd - 2451545.0) / 365.25;
    return 24.12972 + (yearFrac - 2026.0) * (50.2388 / 3600) + CALIBRATION_OFFSET;
  }

  function elongation(date) { let e = (moonLongitude(date) - sunLongitude(date)) % 360; if (e < 0) e += 360; return e; }
  function moonSidereal(date) { let m = (moonLongitude(date) - ayanamsa(date)) % 360; if (m < 0) m += 360; return m; }
  function yogaSum(date) {
    let s = (sunLongitude(date) - ayanamsa(date)) % 360; if (s < 0) s += 360;
    return (s + moonSidereal(date)) % 360;
  }

  // ---- Sunrise / sunset --------------------------------------------------
  // Anchor the search at LOCAL (IST) midnight, not UTC midnight. Otherwise, for
  // eastern cities in summer (e.g. Kolkata sunrise 4:52 AM IST = 23:22 UTC prev day),
  // a UTC-midnight search skips the real sunrise and returns the next day's — shifting
  // the whole panchang by a day. Searching from local midnight fixes all seasons/cities.
  function findSunrise(date, lat, lng, tzOffsetHours) {
    const tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    const obs = new A.Observer(lat, lng, 0);
    const localMidUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0) - tz * 3600000);
    const sr = A.SearchRiseSet(A.Body.Sun, obs, +1, localMidUTC, 1.5);
    return sr ? sr.date : null;
  }
  function findSunset(date, lat, lng, tzOffsetHours) {
    const tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    const obs = new A.Observer(lat, lng, 0);
    const localMidUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0) - tz * 3600000);
    const ss = A.SearchRiseSet(A.Body.Sun, obs, -1, localMidUTC, 1.5);
    return ss ? ss.date : null;
  }

  // ---- Moonrise / Moonset (Phase 4) -------------------------------------
  // DinchaK convention: the day's moonrise is the first rise on/after local midnight.
  // The day's moonset is the first SET that occurs AFTER that moonrise (they pair up).
  // This avoids grabbing the previous night's moonset, and never goes blank.
  function findMoonrise(date, lat, lng, tzOffsetHours) {
    const tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    const obs = new A.Observer(lat, lng, 0);
    const localMidUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0) - tz * 3600000);
    const mr = A.SearchRiseSet(A.Body.Moon, obs, +1, localMidUTC, 2);
    return mr ? mr.date : null;
  }
  function findMoonset(date, lat, lng, tzOffsetHours) {
    const tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    const obs = new A.Observer(lat, lng, 0);
    const localMidUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0) - tz * 3600000);
    // Find this day's moonrise first, then the moonset that follows it.
    const mr = A.SearchRiseSet(A.Body.Moon, obs, +1, localMidUTC, 2);
    const searchFrom = mr ? mr.date : localMidUTC;
    const ms = A.SearchRiseSet(A.Body.Moon, obs, -1, searchFrom, 2);
    return ms ? ms.date : null;
  }

  // ---- Sidereal sign helpers (Phase 4) ----------------------------------
  function sunSidereal(date) { let s = (sunLongitude(date) - ayanamsa(date)) % 360; if (s < 0) s += 360; return s; }
  function moonSign(date) { return Math.floor(moonSidereal(date) / 30); }   // 0..11
  function sunSign(date) { return Math.floor(sunSidereal(date) / 30); }     // 0..11

  // ---- Kaal periods & Muhurtas (Phase 5) --------------------------------
  // Day (sunrise→sunset) is divided into 8 equal parts. Each weekday assigns a
  // specific part to Rahu, Gulika and Yamaganda. Index 0-indexed, 0=Sunday.
  const RAHU_PART   = [7, 1, 6, 4, 5, 3, 2];   // Sun,Mon,Tue,Wed,Thu,Fri,Sat
  const GULIKA_PART = [6, 5, 4, 3, 2, 1, 0];
  const YAMA_PART   = [4, 3, 2, 1, 0, 6, 5];

  // Returns {start:Date, end:Date} for a given eighth-part index of the day.
  function dayPart(sunriseMs, sunsetMs, partIdx) {
    const part = (sunsetMs - sunriseMs) / 8;
    return { start: new Date(sunriseMs + partIdx * part), end: new Date(sunriseMs + (partIdx + 1) * part) };
  }

  // Abhijit Muhurta — the 8th of 15 muhurtas of the day (centered on solar noon).
  // Traditionally VOID on Wednesday (dow 3), where DinchaK/Drik show "None".
  function computeAbhijit(sunriseMs, sunsetMs, dow) {
    if (dow === 3) return null; // Wednesday: no Abhijit Muhurta
    const muhurta = (sunsetMs - sunriseMs) / 15;
    return { start: new Date(sunriseMs + 7 * muhurta), end: new Date(sunriseMs + 8 * muhurta) };
  }

  // Brahma Muhurta — 2nd muhurta before sunrise, using night/15 division.
  function computeBrahmaMuhurta(sunriseMs, prevSunsetMs) {
    const mNight = (sunriseMs - prevSunsetMs) / 15;
    return { start: new Date(sunriseMs - 2 * mNight), end: new Date(sunriseMs - mNight) };
  }

  // ---- Varjyam & Amrit Kaal (Phase 5b) ----------------------------------
  // Varjyam (Nakshatra Thyajyam / Visha Ghati): each nakshatra has a tyajya START
  // ghati (of 60). The window lasts 4 ghatis in nakshatra-time. A day (sunrise→next
  // sunrise) can contain 1-2 Varjyam windows — from whichever nakshatra(s) are active.
  // Drik's published per-nakshatra tyajya start ghati (index 0 = Ashvini).
  // Mula = 20 (not 56 — earlier data-entry error confirmed against DinchaK + literature).
  const TYAJYA_START_GHATI = [
    50, 24, 30, 40, 14, 21, 30, 20, 32, 30, 20, 18, 21, 20, 14,
    14, 10, 14, 20, 24, 20, 10, 10, 18, 16, 24, 30
  ];
  const VARJYAM_SPAN_GHATI = 4; // ≈ 1h36m in nakshatra-time
  // Note: Amrit Kaal ≈ tyajya + 36 ghati (relationship confirmed vs DinchaK),
  // but reliable anchoring isn't solved yet, so Amrit is not emitted for now.

  // Day-scan for Varjyam windows overlapping [srMs, nextSrMs]. This anchors each
  // candidate nakshatra by a time offset from sunrise; validated against DinchaK
  // to ~1 min across many cities/dates. (Amrit Kaal needs a different anchoring
  // that isn't yet solved — see note in getPanchang.)
  function varjyamForNakshatra(nakIdx, nearMs) {
    const nakSize = 360 / 27;
    const startDeg = nakIdx * nakSize;
    const endDeg = (nakIdx + 1) * nakSize;
    const cross = bisectMoonDeg(nearMs - 2 * 86400000, nearMs + 2 * 86400000, startDeg);
    const nakEnd = bisectMoonDeg(cross, cross + 3 * 86400000, endDeg);
    const dur = nakEnd - cross;
    const g = TYAJYA_START_GHATI[nakIdx];
    return { start: cross + (g / 60) * dur, end: cross + ((g + VARJYAM_SPAN_GHATI) / 60) * dur };
  }
  function varjyamsInDay(srMs, nextSrMs) {
    const nakSize = 360 / 27;
    const out = [];
    const startNak = Math.floor(moonSidereal(new Date(srMs - 12 * 3600000)) / nakSize);
    for (let k = 0; k < 4; k++) {
      const ni = ((startNak + k) % 27 + 27) % 27;
      const w = varjyamForNakshatra(ni, srMs + k * 86400000);
      if (w.end > srMs && w.start < nextSrMs) {
        out.push({ nakIndex: ni, start: new Date(w.start), end: new Date(w.end) });
      }
    }
    return out;
  }

  // Bisection helpers to find when Moon's sidereal longitude hits a target degree
  function bisectMoonDeg(loMs, hiMs, targetDeg) {
    const vLo = moonSidereal(new Date(loMs));
    for (let i = 0; i < 60; i++) {
      const mid = (loMs + hiMs) / 2;
      let vv = moonSidereal(new Date(mid));
      let tt = targetDeg;
      if (vv < vLo - 0.5) vv += 360;
      if (tt < vLo - 0.5) tt += 360;
      if (vv < tt) loMs = mid; else hiMs = mid;
    }
    return (loMs + hiMs) / 2;
  }

  // ---- Transition-time engine (bisection) -------------------------------
  function findBoundary(startMs, phaseFn, stepDeg) {
    const v0 = phaseFn(new Date(startMs));
    const nextB = (Math.floor(v0 / stepDeg) + 1) * stepDeg;
    let lo = startMs, hi = startMs + 30 * 3600 * 1000;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      let v = phaseFn(new Date(mid));
      if (v < v0 - 0.0001) v += 360;
      if (v < nextB) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function buildSegments(srMs, nextSrMs, phaseFn, stepDeg, nameFn) {
    const segs = []; let t = srMs, guard = 0;
    while (t < nextSrMs && guard < 8) {
      const v = phaseFn(new Date(t));
      const idx = Math.floor(v / stepDeg);
      const nm = nameFn(idx);
      const endMs = findBoundary(t, phaseFn, stepDeg);
      segs.push({ index: idx, en: nm.en, hi: nm.hi, end: new Date(endMs) });
      t = endMs + 1000;
      guard++;
    }
    return segs;
  }

  const tithiNameFn = i => ({ en: TITHI_NAMES[i % 30], hi: TITHI_HI[i % 30] });
  const nakNameFn   = i => ({ en: NAKSHATRA_NAMES[i % 27], hi: NAKSHATRA_HI[i % 27] });
  const yogaNameFn  = i => ({ en: YOGA_NAMES[i % 27], hi: YOGA_HI[i % 27] });
  const karNameFn   = i => karanaName(i % 60);

  // ---- Public: full Phase-2 panchang ------------------------------------
  function getPanchang(date, lat, lng, tzOffsetHours) {
    const tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    const sunrise = findSunrise(date, lat, lng, tz);
    const sunset = findSunset(date, lat, lng, tz);
    const moonrise = findMoonrise(date, lat, lng, tz);
    const moonset = findMoonset(date, lat, lng, tz);
    const nextDate = new Date(date.getTime() + 24 * 3600 * 1000);
    const nextSunrise = findSunrise(nextDate, lat, lng, tz) || new Date((sunrise || date).getTime() + 24 * 3600 * 1000);

    const refInstant = sunrise || date;
    const srMs = refInstant.getTime();
    const nextSrMs = nextSunrise.getTime();
    // Weekday must be in LOCAL time, not the JS runtime's timezone.
    // Shift the sunrise instant by tz and read the UTC weekday = local weekday.
    const dow = new Date(refInstant.getTime() + tz * 3600000).getUTCDay();

    const tithiSegs = buildSegments(srMs, nextSrMs, elongation, 12, tithiNameFn);
    const nakSegs   = buildSegments(srMs, nextSrMs, moonSidereal, 360 / 27, nakNameFn);
    const yogaSegs  = buildSegments(srMs, nextSrMs, yogaSum, 360 / 27, yogaNameFn);
    const karSegs   = buildSegments(srMs, nextSrMs, elongation, 6, karNameFn);

    const tithiIdx = tithiSegs[0].index;
    const paksha = (tithiIdx % 30) < 15 ? 'Shukla' : 'Krishna';
    const moonSid = moonSidereal(refInstant);
    const nakPada = Math.floor((moonSid % (360 / 27)) / ((360 / 27) / 4)) + 1;
    const nakLord = NAK_LORDS[nakSegs[0].index % 27];

    // Signs at sunrise
    const mSign = moonSign(refInstant);
    const sSign = sunSign(refInstant);

    // Kaal periods & muhurtas (Phase 5)
    const ssMs = sunset ? sunset.getTime() : (srMs + 12 * 3600000);
    const rahu = dayPart(srMs, ssMs, RAHU_PART[dow]);
    const gulika = dayPart(srMs, ssMs, GULIKA_PART[dow]);
    const yama = dayPart(srMs, ssMs, YAMA_PART[dow]);
    const abhijit = computeAbhijit(srMs, ssMs, dow);
    const prevSunset = findSunset(new Date(date.getTime() - 86400000), lat, lng, tz);
    const brahma = prevSunset ? computeBrahmaMuhurta(srMs, prevSunset.getTime()) : null;

    // Varjyam (Phase 5b) — validated against DinchaK to ~1 min.
    // Amrit Kaal: the +36-ghati relationship is confirmed, but the nakshatra-
    // instance bracketing needs a fix before Amrit times are reliable. Kept OFF
    // rather than show a wrong auspicious muhurta.
    let varjyamList = [], amritList = [];
    try { varjyamList = varjyamsInDay(srMs, nextSrMs); } catch (e) { varjyamList = []; }
    const varjyam = varjyamList.length ? varjyamList[0] : null;
    const amritKaal = null;

    return {
      date: date,
      sunrise: sunrise,
      sunset: sunset,
      moonrise: moonrise,
      moonset: moonset,
      nextSunrise: nextSunrise,
      vara: { index: dow, en: VARA_EN[dow], hi: VARA_HI[dow] },
      tithi: { index: tithiIdx % 30, en: tithiSegs[0].en, hi: tithiSegs[0].hi, paksha, segments: tithiSegs },
      nakshatra: { index: nakSegs[0].index % 27, en: nakSegs[0].en, hi: nakSegs[0].hi, lord: nakLord, pada: nakPada, segments: nakSegs },
      yoga: { index: yogaSegs[0].index % 27, en: yogaSegs[0].en, hi: yogaSegs[0].hi, segments: yogaSegs },
      karana: { index: karSegs[0].index % 60, en: karSegs[0].en, hi: karSegs[0].hi, segments: karSegs },
      moonSign: { index: mSign, en: RASHI_EN[mSign], hi: RASHI_HI[mSign] },
      sunSign: { index: sSign, en: RASHI_EN[sSign], hi: RASHI_HI[sSign] },
      rahuKaal: rahu,
      gulikaKaal: gulika,
      yamaganda: yama,
      abhijit: abhijit,
      brahmaMuhurta: brahma,
      varjyam: varjyam,
      varjyamAll: varjyamList,
      amritKaal: amritKaal,
      amritKaalAll: amritList
    };
  }

  global.PanchangEngine = {
    getPanchang,
    elongation, moonSidereal, yogaSum, ayanamsa, sunSidereal,
    findSunrise, findSunset, findMoonrise, findMoonset, findBoundary, buildSegments,
    moonSign, sunSign, dayPart, computeAbhijit, computeBrahmaMuhurta,
    sunLongitude, moonLongitude,
    _data: { TITHI_NAMES, NAKSHATRA_NAMES, YOGA_NAMES, RASHI_EN }
  };

})(typeof window !== 'undefined' ? window : this);
