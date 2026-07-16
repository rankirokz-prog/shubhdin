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

  // ---- Choghadiya (Phase 6) ---------------------------------------------
  // Day (sunrise→sunset) and night (sunset→next sunrise) each split into 8.
  // Cycle order fixed; the day's first choghadiya is set by weekday.
  const CHOG_CYCLE_EN = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];
  const CHOG_CYCLE_HI = ['\u0909\u0926\u094d\u0935\u0947\u0917', '\u091a\u0930', '\u0932\u093e\u092d', '\u0905\u092e\u0943\u0924', '\u0915\u093e\u0932', '\u0936\u0941\u092d', '\u0930\u094b\u0917'];
  const CHOG_GOOD = { Udveg: false, Char: true, Labh: true, Amrit: true, Kaal: false, Shubh: true, Rog: false };
  const CHOG_DAY_START = [0, 3, 6, 2, 5, 1, 4]; // Sun..Sat → index into CHOG_CYCLE

  function computeChoghadiya(sunriseMs, sunsetMs, nextSunriseMs, dow) {
    const dayStart = CHOG_DAY_START[dow];
    const nightStart = (dayStart + 5) % 7;
    const dayPart = (sunsetMs - sunriseMs) / 8;
    const nightPart = (nextSunriseMs - sunsetMs) / 8;
    const day = [], night = [];
    for (let i = 0; i < 8; i++) {
      const ci = (dayStart + i) % 7;
      day.push({ en: CHOG_CYCLE_EN[ci], hi: CHOG_CYCLE_HI[ci], good: CHOG_GOOD[CHOG_CYCLE_EN[ci]],
        start: new Date(sunriseMs + i * dayPart), end: new Date(sunriseMs + (i + 1) * dayPart) });
    }
    for (let i = 0; i < 8; i++) {
      const ci = (nightStart + i) % 7;
      night.push({ en: CHOG_CYCLE_EN[ci], hi: CHOG_CYCLE_HI[ci], good: CHOG_GOOD[CHOG_CYCLE_EN[ci]],
        start: new Date(sunsetMs + i * nightPart), end: new Date(sunsetMs + (i + 1) * nightPart) });
    }
    return { day, night };
  }

  // ---- Hora / Planetary Hours (Phase 6) ---------------------------------
  // Day split into 12 horas, night into 12. First hora at sunrise = weekday lord.
  // Chaldean cycle order. The 25th hora correctly yields the next weekday's lord.
  const HORA_CYCLE_EN = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
  const HORA_CYCLE_HI = ['\u0938\u0942\u0930\u094d\u092f', '\u0936\u0941\u0915\u094d\u0930', '\u092c\u0941\u0927', '\u091a\u0902\u0926\u094d\u0930', '\u0936\u0928\u093f', '\u0917\u0941\u0930\u0941', '\u092e\u0902\u0917\u0932'];
  const HORA_START = [0, 3, 6, 2, 5, 1, 4]; // Sun..Sat → index (starts with weekday lord)
  // Hora "goodness" for general activity (traditional): benefics good, malefics caution
  const HORA_GOOD = { Sun: false, Venus: true, Mercury: true, Moon: true, Saturn: false, Jupiter: true, Mars: false };

  function computeHora(sunriseMs, sunsetMs, nextSunriseMs, dow) {
    const startIdx = HORA_START[dow];
    const dayHora = (sunsetMs - sunriseMs) / 12;
    const nightHora = (nextSunriseMs - sunsetMs) / 12;
    const horas = [];
    for (let i = 0; i < 12; i++) {
      const li = (startIdx + i) % 7;
      horas.push({ en: HORA_CYCLE_EN[li], hi: HORA_CYCLE_HI[li], good: HORA_GOOD[HORA_CYCLE_EN[li]], dayTime: true,
        start: new Date(sunriseMs + i * dayHora), end: new Date(sunriseMs + (i + 1) * dayHora) });
    }
    for (let i = 0; i < 12; i++) {
      const li = (startIdx + 12 + i) % 7;
      horas.push({ en: HORA_CYCLE_EN[li], hi: HORA_CYCLE_HI[li], good: HORA_GOOD[HORA_CYCLE_EN[li]], dayTime: false,
        start: new Date(sunsetMs + i * nightHora), end: new Date(sunsetMs + (i + 1) * nightHora) });
    }
    return horas;
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

  // ---- Amrit Kaal (Phase 8, bracketing FIXED) ----------------------------
  // Amrit start ghati = tyajya + 24 for 25 of 27 nakshatras (span always 4 ghati).
  // Validated from Ram's DinchaK data: Shatabhisha 42 (Jul 5), Hasta 45 (Jul 20),
  // plus Sep 10 + Sep 24 (Kolkata, cross-midnight) to 1 min.
  // EXCEPTIONS (where tyajya+24 would exceed 60): the classical Amrita Ghatika
  // table caps them with their own values:
  //   Rohini = 52  — VALIDATED (Ram's Aug 8 2026 data: DinchaK ghati 51.95)
  //   Ashvini = 42 — published table value, PENDING validation (test: Sep 1 2026)
  function amritGhati(idx) {
    if (idx === 0) return 42;  // Ashvini (pending validation)
    if (idx === 3) return 52;  // Rohini (validated)
    return TYAJYA_START_GHATI[idx] + 24;
  }
  function nakInstanceAt(ms) {
    const step = 360 / 27;
    const idx = Math.floor(moonSidereal(new Date(ms)) / step) % 27;
    const start = bisectMoonDeg(ms - 30 * 3600000, ms, idx * step);
    const end = findBoundary(start + 60000, moonSidereal, step);
    return { idx: idx, start: start, end: end, dur: end - start };
  }
  function amritKaalsInDay(srMs, nextSrMs) {
    const out = [];
    let inst = nakInstanceAt(srMs);
    for (let k = 0; k < 3; k++) {
      const g = amritGhati(inst.idx);
      const ws = inst.start + (g / 60) * inst.dur;
      const we = inst.start + ((g + 4) / 60) * inst.dur;
      if (we > srMs && ws < nextSrMs) out.push({ nakIndex: inst.idx, start: new Date(ws), end: new Date(we) });
      const nStart = inst.end;
      const nIdx = (inst.idx + 1) % 27;
      const nEnd = findBoundary(nStart + 60000, moonSidereal, 360 / 27);
      inst = { idx: nIdx, start: nStart, end: nEnd, dur: nEnd - nStart };
      if (inst.start > nextSrMs) break;
    }
    return out;
  }

  // ---- Dur Muhurtam (Phase 8) --------------------------------------------
  // Day (sunrise->sunset) / 15 muhurtas; inauspicious muhurta(s) by weekday.
  // 1-based indices. ALL 7 WEEKDAYS VALIDATED from Ram's DinchaK data (Jul 2026):
  // Sun 14 · Mon 9,12 · Tue 4 (+ NIGHT 7th) · Wed 8 · Thu 6,12 · Fri 4,9 · Sat 1,2.
  // Tuesday additionally has a night dur muhurtam = 7th muhurta of the night
  // (sunset -> next sunrise, /15) — validated: Jul 21 2026, 23:08-23:52, 44 min.
  const DUR_MUHURTA_DAY = [[14], [9, 12], [4], [8], [6, 12], [4, 9], [1, 2]]; // Sun..Sat
  const DUR_MUHURTA_NIGHT = [[], [], [7], [], [], [], []];                    // Sun..Sat
  function durMuhurtamsInDay(srMs, ssMs, nextSrMs, dow) {
    const mu = (ssMs - srMs) / 15;
    const out = DUR_MUHURTA_DAY[dow].map(function (i) {
      return { start: new Date(srMs + (i - 1) * mu), end: new Date(srMs + i * mu) };
    });
    const nmu = (nextSrMs - ssMs) / 15;
    DUR_MUHURTA_NIGHT[dow].forEach(function (i) {
      out.push({ start: new Date(ssMs + (i - 1) * nmu), end: new Date(ssMs + i * nmu) });
    });
    return out;
  }

  // ---- Phase 8: Disha Shool, Tarabalam, Chandrabalam ---------------------
  // Disha Shool: direction to AVOID travelling, fixed by weekday (classical
  // table, Sun..Sat) — PENDING Ram's validation vs DinchaK.
  const DISHA_EN = ['West', 'East', 'North', 'North', 'South', 'West', 'East'];
  const DISHA_HI = ['\u092A\u0936\u094D\u091A\u093F\u092E', '\u092A\u0942\u0930\u094D\u0935',
    '\u0909\u0924\u094D\u0924\u0930', '\u0909\u0924\u094D\u0924\u0930',
    '\u0926\u0915\u094D\u0937\u093F\u0923', '\u092A\u0936\u094D\u091A\u093F\u092E',
    '\u092A\u0942\u0930\u094D\u0935'];

  // Tarabalam: tara = position of the DAY's nakshatra counted from a person's
  // JANMA nakshatra, cycled by 9. Taras: 1 Janma, 2 Sampat, 3 Vipat, 4 Kshema,
  // 5 Pratyari, 6 Sadhaka, 7 Vadha, 8 Mitra, 9 Parama Mitra.
  // GOOD = {2,4,6,8,9} (15 of 27 janma nakshatras favourable on any day).
  // Whether tara 1 (Janma) counts as good varies by tradition — DinchaK's list
  // length (15 vs 18) will settle it; PENDING Ram's validation.
  const TARA_GOOD = [2, 4, 6, 8, 9];
  // Tara names + DinchaK verdicts (decoded from Ram's Jul 8 2026 screenshots):
  // 1 Janma=Not Good · 2 Sampata=Very Good · 3 Vipata=Bad · 4 Kshema=Good ·
  // 5 Pratyari=Not Good · 6 Sadhaka=Very Good · 7 Naidhana=Totally Bad ·
  // 8 Mitra=Good · 9 Param Mitra=Good.  VALIDATED 27/27.
  const TARA_NAMES = ['Janma', 'Sampata', 'Vipata', 'Kshema', 'Pratyari', 'Sadhaka', 'Naidhana', 'Mitra', 'Param Mitra'];
  const TARA_VERDICT = ['Not Good', 'Very Good', 'Bad', 'Good', 'Not Good', 'Very Good', 'Totally Bad', 'Good', 'Good'];
  function taraOf(dayNak, janmaNak) {
    return ((dayNak - janmaNak + 27) % 27) % 9 + 1;
  }
  function goodTarabalamNaks(dayNak) {
    const out = [];
    for (let j = 0; j < 27; j++) {
      if (TARA_GOOD.indexOf(taraOf(dayNak, j)) >= 0) out.push(j);
    }
    return out;
  }
  function allTarabalam(dayNak) {
    const out = [];
    for (let j = 0; j < 27; j++) {
      const t = taraOf(dayNak, j);
      out.push({ index: j, en: NAKSHATRA_NAMES[j], hi: NAKSHATRA_HI[j],
                 tara: t, taraEn: TARA_NAMES[t - 1], verdict: TARA_VERDICT[t - 1],
                 good: TARA_GOOD.indexOf(t) >= 0 });
    }
    return out;
  }

  // Chandrabalam: Moon transiting the 1,3,6,7,10,11th rashi FROM a person's
  // janma rashi is favourable (6 of 12 rashis on any day) — PENDING validation.
  const CHANDRA_GOOD_POS = [1, 3, 6, 7, 10, 11];
  // DinchaK 3-state (decoded from Ram's Jul 6 2026 screenshot, VALIDATED 12/12):
  // positions {1,3,6,7,10,11}=Good · {4,8,12}=Bad · {2,5,9}=Puja Needed.
  const CHANDRA_BAD_POS = [4, 8, 12];
  function goodChandrabalamRashis(dayRashi) {
    const out = [];
    for (let r = 0; r < 12; r++) {
      if (CHANDRA_GOOD_POS.indexOf(((dayRashi - r + 12) % 12) + 1) >= 0) out.push(r);
    }
    return out;
  }
  function allChandrabalam(dayRashi) {
    const out = [];
    for (let r = 0; r < 12; r++) {
      const pos = ((dayRashi - r + 12) % 12) + 1;
      const status = CHANDRA_GOOD_POS.indexOf(pos) >= 0 ? 'Good'
                   : CHANDRA_BAD_POS.indexOf(pos) >= 0 ? 'Bad' : 'Puja Needed';
      out.push({ index: r, en: RASHI_EN[r], hi: RASHI_HI[r], position: pos, status: status });
    }
    return out;
  }

  // ---- Panchaka -----------------------------------------------------------
  // Panchaka = Moon in the last 5 nakshatras (Dhanishtha 2nd half -> Revati)
  // = moon sidereal longitude in [300°, 360°) = Kumbha + Meena. Period spans
  // ~4.5-5 days; start = crossing 300°, end = crossing 360° (Revati end).
  // Type named by the WEEKDAY of the period's start: Sun=Roga, Mon=Raja,
  // Tue=Agni, Fri=Chora, Sat=Mrityu; Wed & Thu are traditionally dosha-free
  // (type null). Period times validatable vs Drik's published Panchak lists —
  // type convention PENDING Ram's validation.
  const PANCHAKA_TYPE_EN = ['Roga', 'Raja', 'Agni', null, null, 'Chora', 'Mrityu'];
  function panchakaForDay(srMs, nextSrMs, tz) {
    const inZone = function (ms) { return moonSidereal(new Date(ms)) >= 300; };
    const in0 = inZone(srMs), in1 = inZone(nextSrMs);
    if (!in0 && !in1) return null;
    const startMs = in0
      ? bisectMoonDeg(srMs - 6 * 86400000, srMs, 300)
      : bisectMoonDeg(srMs, nextSrMs, 300);
    const endMs = bisectMoonDeg(startMs + 60000, startMs + 6.5 * 86400000, 360);
    const dowStart = new Date(startMs + tz * 3600000).getUTCDay();
    return { start: new Date(startMs), end: new Date(endMs),
             type: PANCHAKA_TYPE_EN[dowStart], startWeekday: dowStart };
  }

  // ---- Secondary muhurtas (Vijaya, Godhuli, Nishita, Sandhya) -------------
  // Reverse-engineered + VALIDATED against Drik's published values for
  // Bengaluru + New Delhi (Jul 8 2026) and Chennai + Mumbai (Jul 3 2026):
  //   Vijaya  = 11th of 15 day muhurtas (fit: start muhurta #10.996-11.002). ✓
  //   Nishita = solar midnight ± half night-muhurta (fit: 0.1-0.3 min). ✓
  //   Sayahna Sandhya = sunset -> sunset + 1.5 night-muhurtas (fit: 1.49-1.51). ✓
  //   Godhuli = (sunset - 84 s) -> (sunset + nmu/2 - 45 s); the small constants
  //     are Drik's slightly different solar-disc sunset definition (fits all
  //     four cities within ~0.5 min). ✓
  //   Pratah Sandhya = (sunrise - 1.5 prev-night-muhurtas) -> sunrise —
  //     inferred by SYMMETRY with Sayahna; pending one confirmation.
  function secondaryMuhurtas(srMs, ssMs, nextSrMs, prevSsMs) {
    const mu = (ssMs - srMs) / 15;
    const nmu = (nextSrMs - ssMs) / 15;
    const out = {
      vijaya: { start: new Date(srMs + 10 * mu), end: new Date(srMs + 11 * mu) },
      godhuli: { start: new Date(ssMs - 84000), end: new Date(ssMs + nmu / 2 - 45000) },
      nishita: (function () {
        const mid = (ssMs + nextSrMs) / 2;
        return { start: new Date(mid - nmu / 2), end: new Date(mid + nmu / 2) };
      })(),
      sayahnaSandhya: { start: new Date(ssMs), end: new Date(ssMs + 1.5 * nmu) },
      pratahSandhya: null
    };
    if (prevSsMs != null) {
      const pnmu = (srMs - prevSsMs) / 15;
      out.pratahSandhya = { start: new Date(srMs - 1.5 * pnmu), end: new Date(srMs) };
    }
    return out;
  }

  // ---- Phase 7: Hindu Calendar Layer -------------------------------------
  // Lunar (Amanta) month = new moon to new moon. The month is NAMED by the
  // sidereal rashi the Sun ENTERS during that month (Mesha entry -> Chaitra).
  // Adhik Maas = a lunar month containing NO sankranti (Sun stays in one rashi);
  // it takes the name of the FOLLOWING regular month, prefixed "Adhik".
  // 2026 has a rare Adhik Jyeshtha (~mid-May to mid-June) — primary validation target.
  const MASA_EN = ['Chaitra','Vaishakha','Jyeshtha','Ashadha','Shravana','Bhadrapada',
                   'Ashwina','Kartika','Margashirsha','Pausha','Magha','Phalguna'];
  const MASA_HI = ['\u091A\u0948\u0924\u094D\u0930','\u0935\u0948\u0936\u093E\u0916',
    '\u091C\u094D\u092F\u0947\u0937\u094D\u0920','\u0906\u0937\u093E\u0922\u093C',
    '\u0936\u094D\u0930\u093E\u0935\u0923','\u092D\u093E\u0926\u094D\u0930\u092A\u0926',
    '\u0906\u0936\u094D\u0935\u093F\u0928','\u0915\u093E\u0930\u094D\u0924\u093F\u0915',
    '\u092E\u093E\u0930\u094D\u0917\u0936\u0940\u0930\u094D\u0937','\u092A\u094C\u0937',
    '\u092E\u093E\u0918','\u092B\u093E\u0932\u094D\u0917\u0941\u0928'];
  const ADHIK_HI = '\u0905\u0927\u093F\u0915';

  const RITU_EN = ['Vasanta','Grishma','Varsha','Sharad','Hemanta','Shishira'];
  const RITU_HI = ['\u0935\u0938\u0902\u0924','\u0917\u094D\u0930\u0940\u0937\u094D\u092E',
    '\u0935\u0930\u094D\u0937\u093E','\u0936\u0930\u0926','\u0939\u0947\u092E\u0902\u0924',
    '\u0936\u093F\u0936\u093F\u0930'];

  // 60-year Jupiter cycle (Samvatsara), 0-based from Prabhava.
  // Anchor verified: Shaka 1947 (2025-26) = Vishvavasu, Shaka 1948 (2026-27) = Parabhava.
  // Formula: index = (shakaYear + 11) % 60  [South/Drik convention — VALIDATE vs DinchaK]
  const SAMVATSARA_EN = ['Prabhava','Vibhava','Shukla','Pramoda','Prajapati','Angirasa',
    'Shrimukha','Bhava','Yuva','Dhatri','Ishvara','Bahudhanya','Pramathi','Vikrama','Vrisha',
    'Chitrabhanu','Svabhanu','Tarana','Parthiva','Vyaya','Sarvajit','Sarvadhari','Virodhi',
    'Vikriti','Khara','Nandana','Vijaya','Jaya','Manmatha','Durmukha','Hemalamba','Vilamba',
    'Vikari','Sharvari','Plava','Shubhakrit','Shobhakrit','Krodhi','Vishvavasu','Parabhava',
    'Plavanga','Kilaka','Saumya','Sadharana','Virodhikrit','Paridhavi','Pramadicha','Ananda',
    'Rakshasa','Nala','Pingala','Kalayukta','Siddharthi','Raudra','Durmati','Dundubhi',
    'Rudhirodgari','Raktakshi','Krodhana','Akshaya'];

  // New moon (phase 0) search via astronomy-engine — precise to seconds.
  function newMoonAfter(ms) {
    const t = A.SearchMoonPhase(0, new Date(ms), 40);
    return t ? t.date.getTime() : null;
  }
  function newMoonBefore(ms) {
    // First new moon after (ms - 35d) is guaranteed before ms (lunation < 30d);
    // then step forward while still before ms, keeping the last one.
    let t = newMoonAfter(ms - 35 * 86400000);
    if (t == null) return null;
    let nxt = newMoonAfter(t + 86400000);
    while (nxt != null && nxt < ms) { t = nxt; nxt = newMoonAfter(t + 86400000); }
    return t;
  }

  function sunRashiAt(ms) { return Math.floor(sunSidereal(new Date(ms)) / 30); }

  // Amanta lunar month containing the instant `ms`.
  function amantaMonthInfo(ms) {
    const startNM = newMoonBefore(ms);   // amavasya that BEGAN this month
    const endNM = newMoonAfter(ms);      // amavasya that ENDS this month
    const r1 = sunRashiAt(startNM);
    const r2 = sunRashiAt(endNM);
    const entries = ((r2 - r1) % 12 + 12) % 12; // sankrantis inside the month
    const k = (r1 + 1) % 12;                    // first rashi the Sun enters (or would enter)
    return {
      index: k, en: MASA_EN[k], hi: MASA_HI[k],
      adhik: entries === 0,          // no sankranti -> Adhik Maas
      kshaya: entries > 1,           // two sankrantis -> rare Kshaya month (flagged only)
      startNM: startNM, endNM: endNM
    };
  }

  // Bisection: instant when Sun's SIDEREAL longitude crosses targetDeg (~approxMs ±25d).
  function sidSunCross(targetDeg, approxMs) {
    let lo = approxMs - 25 * 86400000, hi = approxMs + 25 * 86400000;
    const f = function (ms) {
      let d = (sunSidereal(new Date(ms)) - targetDeg + 180) % 360;
      if (d < 0) d += 360;
      return d - 180;
    };
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Chaitra Shukla Pratipada of a CE year = new moon just before Mesha sankranti (~Apr 14).
  function chaitraShukla1(yearCE) {
    return newMoonBefore(sidSunCross(0, Date.UTC(yearCE, 3, 14)));
  }
  // Kartika Shukla Pratipada = new moon just before Vrishchika sankranti (~Nov 16).
  function kartikaShukla1(yearCE) {
    return newMoonBefore(sidSunCross(210, Date.UTC(yearCE, 10, 16)));
  }

  // Vikram / Shaka change at Chaitra S1; Gujarati changes at Kartika S1 (Diwali new year).
  function hinduYears(refMs, tz) {
    const y = new Date(refMs + tz * 3600000).getUTCFullYear();
    const cs1 = chaitraShukla1(y);
    let vikram, shaka, vikramStartYear;
    if (refMs >= cs1) { vikram = y + 57; shaka = y - 78; vikramStartYear = y; }
    else { vikram = y + 56; shaka = y - 79; vikramStartYear = y - 1; }
    const ks1 = kartikaShukla1(vikramStartYear);
    const gujarati = (refMs >= ks1) ? vikram : vikram - 1;
    const nameOf = function (n) { return SAMVATSARA_EN[((n % 60) + 60) % 60]; };
    // Drik attaches a DIFFERENT samvatsara name to each samvat. Offsets
    // reverse-engineered from Ram's DinchaK data (Mar 15/25 + Nov 5/25, 2026):
    //   Shaka 1948 -> Parabhava  => index = (shaka + 11) % 60
    //   Vikram 2082 -> Kalayukta, 2083 -> Siddharthi => index = (vikram + 9) % 60
    //   Gujarati 2082 -> Pingala, 2083 -> Kalayukta  => index = (gujarati + 8) % 60
    return { vikram: vikram, shaka: shaka, gujarati: gujarati,
             samvatsaraShaka: nameOf(shaka + 11),
             samvatsaraVikram: nameOf(vikram + 9),
             samvatsaraGujarati: nameOf(gujarati + 8) };
  }

  // Ritu: six 60° seasons, Vasanta anchored at 330° (Meena) — Drik's convention
  // for BOTH Vedic (sidereal longitude) and Drik (tropical longitude) ritu.
  function rituFromLong(lon) {
    const idx = Math.floor((((lon - 330) % 360 + 360) % 360) / 60);
    return { index: idx, en: RITU_EN[idx], hi: RITU_HI[idx] };
  }
  // Ayana: Uttarayana = longitude in [270°, 90°); Vedic uses sidereal, Drik tropical.
  function ayanaFromLong(lon) {
    const utt = (lon >= 270 || lon < 90);
    return utt
      ? { en: 'Uttarayana', hi: '\u0909\u0924\u094D\u0924\u0930\u093E\u092F\u0923' }
      : { en: 'Dakshinayana', hi: '\u0926\u0915\u094D\u0937\u093F\u0923\u093E\u092F\u0928' };
  }

  function computeHinduCalendar(refMs, paksha, tz) {
    const cur = amantaMonthInfo(refMs);
    // Purnimanta: Shukla paksha -> same name; Krishna paksha -> next month's name
    // (Krishna paksha of Amanta month M = Krishna paksha of Purnimanta month M+1).
    let purn;
    if (paksha === 'Shukla') {
      purn = { en: cur.en, hi: cur.hi, adhik: cur.adhik };
    } else {
      const nxt = amantaMonthInfo(cur.endNM + 43200000);
      purn = { en: nxt.en, hi: nxt.hi, adhik: nxt.adhik };
    }
    const years = hinduYears(refMs, tz);
    const sidLon = sunSidereal(new Date(refMs));
    const tropLon = sunLongitude(new Date(refMs));
    return {
      amantaMonth: { index: cur.index, en: cur.en, hi: cur.hi, adhik: cur.adhik,
                     kshaya: cur.kshaya, adhikHi: ADHIK_HI,
                     monthStart: new Date(cur.startNM), monthEnd: new Date(cur.endNM) },
      purnimantaMonth: { en: purn.en, hi: purn.hi, adhik: purn.adhik, adhikHi: ADHIK_HI },
      vikramSamvat: years.vikram,
      shakaSamvat: years.shaka,
      gujaratiSamvat: years.gujarati,
      samvatsara: { en: years.samvatsaraShaka, shaka: years.samvatsaraShaka,
                    vikram: years.samvatsaraVikram, gujarati: years.samvatsaraGujarati },
      ritu: { vedic: rituFromLong(sidLon), drik: rituFromLong(tropLon) },
      ayana: { vedic: ayanaFromLong(sidLon), drik: ayanaFromLong(tropLon) }
    };
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

  // ---- Phase 9: Festivals & Vrats ----------------------------------------
  // Rules use AMANTA month indices (Chaitra=0 .. Phalguna=11), paksha S/K,
  // tithi 1..15 (S15 = Purnima, K15 = Amavasya). Adhik months are SKIPPED
  // (festivals fall in the nija month). Anchors:
  //   'udaya'    = tithi at sunrise (default festival-day rule)
  //   'nishita'  = tithi at the night's midpoint (Shivaratri, Janmashtami)
  //   'pradosh'  = tithi just after sunset (Diwali, Dhanteras, Holika Dahan)
  //   'moonrise' = tithi at moonrise (Karwa Chauth)
  //   sankranti  = Sun entering a sidereal rashi (Makar Sankranti = 270 deg)
  // ALL DATES PENDING Ram's validation against Drik's festival calendar.
  var FESTIVAL_RULES = [
    { en: 'Makar Sankranti', hi: '\u092E\u0915\u0930 \u0938\u0902\u0915\u094D\u0930\u093E\u0902\u0924\u093F', rule: 'sankranti', deg: 270, approxMonth: 0, approxDay: 14 },
    { en: 'Vasant Panchami', hi: '\u0935\u0938\u0902\u0924 \u092A\u0902\u091A\u092E\u0940', month: 10, paksha: 'S', tithi: 5, anchor: 'udaya' },
    { en: 'Maha Shivaratri', hi: '\u092E\u0939\u093E\u0936\u093F\u0935\u0930\u093E\u0924\u094D\u0930\u093F', month: 10, paksha: 'K', tithi: 14, anchor: 'nishita' },
    { en: 'Holika Dahan', hi: '\u0939\u094B\u0932\u093F\u0915\u093E \u0926\u0939\u0928', month: 11, paksha: 'S', tithi: 15, anchor: 'pradosh' },
    { en: 'Holi', hi: '\u0939\u094B\u0932\u0940', month: 11, paksha: 'S', tithi: 15, anchor: 'pradosh', nextDay: 1 },
    { en: 'Ugadi / Gudi Padwa', hi: '\u0909\u0917\u093E\u0926\u093F / \u0917\u0941\u0921\u093C\u0940 \u092A\u0921\u093C\u0935\u093E', month: 0, paksha: 'S', tithi: 1, anchor: 'udaya' },
    { en: 'Rama Navami', hi: '\u0930\u093E\u092E \u0928\u0935\u092E\u0940', month: 0, paksha: 'S', tithi: 9, anchor: 'madhyahna' },
    { en: 'Hanuman Jayanti', hi: '\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u092F\u0902\u0924\u0940', month: 0, paksha: 'S', tithi: 15, anchor: 'udaya' },
    { en: 'Akshaya Tritiya', hi: '\u0905\u0915\u094D\u0937\u092F \u0924\u0943\u0924\u0940\u092F\u093E', month: 1, paksha: 'S', tithi: 3, anchor: 'madhyahna' },
    { en: 'Vat Savitri Vrat', hi: '\u0935\u091F \u0938\u093E\u0935\u093F\u0924\u094D\u0930\u0940 \u0935\u094D\u0930\u0924', month: 1, paksha: 'K', tithi: 15, anchor: 'udaya' },
    { en: 'Guru Purnima', hi: '\u0917\u0941\u0930\u0941 \u092A\u0942\u0930\u094D\u0923\u093F\u092E\u093E', month: 3, paksha: 'S', tithi: 15, anchor: 'udaya' },
    { en: 'Nag Panchami', hi: '\u0928\u093E\u0917 \u092A\u0902\u091A\u092E\u0940', month: 4, paksha: 'S', tithi: 5, anchor: 'udaya' },
    { en: 'Raksha Bandhan', hi: '\u0930\u0915\u094D\u0937\u093E \u092C\u0902\u0927\u0928', month: 4, paksha: 'S', tithi: 15, anchor: 'aparahna' },
    { en: 'Krishna Janmashtami', hi: '\u0915\u0943\u0937\u094D\u0923 \u091C\u0928\u094D\u092E\u093E\u0937\u094D\u091F\u092E\u0940', month: 4, paksha: 'K', tithi: 8, anchor: 'nishita' },
    { en: 'Ganesh Chaturthi', hi: '\u0917\u0923\u0947\u0936 \u091A\u0924\u0941\u0930\u094D\u0925\u0940', month: 5, paksha: 'S', tithi: 4, anchor: 'madhyahna' },
    { en: 'Anant Chaturdashi', hi: '\u0905\u0928\u0902\u0924 \u091A\u0924\u0941\u0930\u094D\u0926\u0936\u0940', month: 5, paksha: 'S', tithi: 14, anchor: 'udaya' },
    { en: 'Sharad Navratri Begins', hi: '\u0936\u093E\u0930\u0926\u0940\u092F \u0928\u0935\u0930\u093E\u0924\u094D\u0930\u093F \u092A\u094D\u0930\u093E\u0930\u0902\u092D', month: 6, paksha: 'S', tithi: 1, anchor: 'udaya' },
    { en: 'Durga Ashtami', hi: '\u0926\u0941\u0930\u094D\u0917\u093E \u0905\u0937\u094D\u091F\u092E\u0940', month: 6, paksha: 'S', tithi: 8, anchor: 'udaya' },
    { en: 'Maha Navami', hi: '\u092E\u0939\u093E \u0928\u0935\u092E\u0940', month: 6, paksha: 'S', tithi: 9, anchor: 'aparahna' },
    { en: 'Vijayadashami (Dussehra)', hi: '\u0935\u093F\u091C\u092F\u093E\u0926\u0936\u092E\u0940 (\u0926\u0936\u0939\u0930\u093E)', month: 6, paksha: 'S', tithi: 10, anchor: 'aparahna' },
    { en: 'Karwa Chauth', hi: '\u0915\u0930\u0935\u093E \u091A\u094C\u0925', month: 6, paksha: 'K', tithi: 4, anchor: 'moonrise' },
    { en: 'Dhanteras', hi: '\u0927\u0928\u0924\u0947\u0930\u0938', month: 6, paksha: 'K', tithi: 13, anchor: 'pradosh' },
    { en: 'Naraka Chaturdashi', hi: '\u0928\u0930\u0915 \u091A\u0924\u0941\u0930\u094D\u0926\u0936\u0940', month: 6, paksha: 'K', tithi: 14, anchor: 'arunodaya' },
    { en: 'Diwali (Lakshmi Puja)', hi: '\u0926\u0940\u092A\u093E\u0935\u0932\u0940 (\u0932\u0915\u094D\u0937\u094D\u092E\u0940 \u092A\u0942\u091C\u093E)', month: 6, paksha: 'K', tithi: 15, anchor: 'pradosh' },
    { en: 'Govardhan Puja', hi: '\u0917\u094B\u0935\u0930\u094D\u0927\u0928 \u092A\u0942\u091C\u093E', month: 7, paksha: 'S', tithi: 1, anchor: 'aparahna' },
    { en: 'Bhai Dooj', hi: '\u092D\u093E\u0908 \u0926\u0942\u091C', month: 7, paksha: 'S', tithi: 2, anchor: 'aparahna' },
    { en: 'Chhath Puja', hi: '\u091B\u0920 \u092A\u0942\u091C\u093E', month: 7, paksha: 'S', tithi: 6, anchor: 'udaya' },
    { en: 'Dev Uthani Ekadashi', hi: '\u0926\u0947\u0935 \u0909\u0920\u0928\u0940 \u090F\u0915\u093E\u0926\u0936\u0940', month: 7, paksha: 'S', tithi: 11, anchor: 'udaya' },
    { en: 'Kartika Purnima', hi: '\u0915\u093E\u0930\u094D\u0924\u093F\u0915 \u092A\u0942\u0930\u094D\u0923\u093F\u092E\u093E', month: 7, paksha: 'S', tithi: 15, anchor: 'udaya' },
  ];

  function elongAt(ms) {
    var e = (moonSidereal(new Date(ms)) - sunSidereal(new Date(ms))) % 360;
    return e < 0 ? e + 360 : e;
  }
  // Elongation is 0 at the new moon starting a month and rises monotonically
  // to 360 at the next new moon, so simple bisection works within a month.
  function bisectElong(loMs, hiMs, target) {
    for (var i = 0; i < 60; i++) {
      var mid = (loMs + hiMs) / 2;
      if (elongAt(mid) < target) loMs = mid; else hiMs = mid;
    }
    return (loMs + hiMs) / 2;
  }

  function buildMonthTable(yearCE) {
    var months = [];
    var t = newMoonBefore(Date.UTC(yearCE, 0, 5));
    var guard = 0;
    while (t < Date.UTC(yearCE + 1, 0, 20) && guard < 16) {
      var end = newMoonAfter(t + 86400000);
      var r1 = sunRashiAt(t), r2 = sunRashiAt(end);
      var entries = ((r2 - r1) % 12 + 12) % 12;
      months.push({ index: (r1 + 1) % 12, adhik: entries === 0, start: t, end: end });
      t = end; guard++;
    }
    return months;
  }

  // Choose the celebration DAY for a tithi window [Ts, Te) given the anchor.
  function anchorDay(Ts, Te, anchor, lat, lng, tz) {
    var base = new Date(Ts + tz * 3600000);
    var d0 = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()) - tz * 3600000;
    for (var k = 0; k <= 2; k++) {
      var noon = new Date(d0 + k * 86400000 + 6 * 3600000);
      var point = null;
      if (anchor === 'udaya') {
        var sr = findSunrise(noon, lat, lng, tz);
        point = sr ? sr.getTime() : null;
      } else if (anchor === 'nishita') {
        var ssN = findSunset(noon, lat, lng, tz);
        var nsr = findSunrise(new Date(noon.getTime() + 86400000), lat, lng, tz);
        point = (ssN && nsr) ? (ssN.getTime() + nsr.getTime()) / 2 : null;
      } else if (anchor === 'pradosh') {
        var ssP = findSunset(noon, lat, lng, tz);
        point = ssP ? ssP.getTime() + 3600000 : null;
      } else if (anchor === 'moonrise') {
        var mr = findMoonrise(noon, lat, lng, tz);
        point = mr ? mr.getTime() : null;
      } else if (anchor === 'arunodaya') {
        var srA = findSunrise(noon, lat, lng, tz);
        point = srA ? srA.getTime() - 96 * 60000 : null; // 4 ghati before sunrise
      } else if (anchor === 'madhyahna' || anchor === 'aparahna') {
        // Day split into 5 parts: madhyahna = 3rd part, aparahna = 4th part.
        // The day QUALIFIES if the part-window OVERLAPS the tithi (vyapini rule);
        // the FIRST qualifying day wins (purvaviddha).
        var srW = findSunrise(noon, lat, lng, tz);
        var ssW = findSunset(noon, lat, lng, tz);
        if (srW && ssW) {
          var D5 = (ssW.getTime() - srW.getTime()) / 5;
          var wi = (anchor === 'madhyahna') ? 2 : 3;
          var wS = srW.getTime() + wi * D5, wE = srW.getTime() + (wi + 1) * D5;
          if (wS < Te && wE > Ts) return d0 + k * 86400000 + 6 * 3600000;
        }
        continue;
      }
      if (point != null && point >= Ts && point < Te) return d0 + k * 86400000 + 6 * 3600000;
    }
    // Fallback 1: udaya rule; Fallback 2 (kshaya tithi): the day the tithi begins.
    for (var k2 = 0; k2 <= 2; k2++) {
      var sr2 = findSunrise(new Date(d0 + k2 * 86400000 + 6 * 3600000), lat, lng, tz);
      if (sr2 && sr2.getTime() >= Ts && sr2.getTime() < Te) return d0 + k2 * 86400000 + 6 * 3600000;
    }
    return d0 + 6 * 3600000;
  }

  // Public: festival calendar for a CE year.
  function getFestivals(yearCE, lat, lng, tzOffsetHours) {
    var tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    var months = buildMonthTable(yearCE);
    var out = [];
    function dateStr(ms) { return new Date(ms + tz * 3600000).toISOString().slice(0, 10); }
    for (var fi = 0; fi < FESTIVAL_RULES.length; fi++) {
      var F = FESTIVAL_RULES[fi];
      if (F.rule === 'sankranti') {
        var cross = sidSunCross(F.deg, Date.UTC(yearCE, F.approxMonth, F.approxDay));
        var dsk = dateStr(cross);
        if (dsk.slice(0, 4) === String(yearCE)) out.push({ date: dsk, en: F.en, hi: F.hi });
        continue;
      }
      for (var mi = 0; mi < months.length; mi++) {
        var M = months[mi];
        if (M.index !== F.month || M.adhik) continue;
        var idx = (F.paksha === 'S') ? F.tithi - 1 : 14 + F.tithi;
        var Ts = (idx === 0) ? M.start : bisectElong(M.start, M.end, idx * 12);
        var Te = (idx === 29) ? M.end : bisectElong(Ts + 60000, M.end, (idx + 1) * 12);
        var dayMs = anchorDay(Ts, Te, F.anchor || 'udaya', lat, lng, tz);
        if (F.nextDay) dayMs += 86400000;
        var ds = dateStr(dayMs);
        if (ds.slice(0, 4) === String(yearCE)) out.push({ date: ds, en: F.en, hi: F.hi });
      }
    }
    out.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return out;
  }

  // ---- Phase 9b: Recurring vrats (Ekadashi, Pradosh, Sankashti) ----------
  // Ekadashi names indexed by AMANTA month (Chaitra=0). Krishna-paksha names
  // are the purnimanta (m+1) names translated to amanta indexing. Adhik-month
  // ekadashis are Padmini (S) and Parama (K). Day rule v1 = udaya (smarta
  // dashami-viddha nuance not yet modeled — validate vs Drik).
  var EKADASHI_S = [{ en: 'Kamada', hi: '\u0915\u093E\u092E\u0926\u093E' }, { en: 'Mohini', hi: '\u092E\u094B\u0939\u093F\u0928\u0940' }, { en: 'Nirjala', hi: '\u0928\u093F\u0930\u094D\u091C\u0932\u093E' }, { en: 'Devshayani', hi: '\u0926\u0947\u0935\u0936\u092F\u0928\u0940' }, { en: 'Shravana Putrada', hi: '\u0936\u094D\u0930\u093E\u0935\u0923 \u092A\u0941\u0924\u094D\u0930\u0926\u093E' }, { en: 'Parivartini', hi: '\u092A\u0930\u093F\u0935\u0930\u094D\u0924\u093F\u0928\u0940' }, { en: 'Papankusha', hi: '\u092A\u093E\u092A\u093E\u0902\u0915\u0941\u0936\u093E' }, { en: 'Devutthana', hi: '\u0926\u0947\u0935\u0909\u0920\u0928\u0940' }, { en: 'Mokshada', hi: '\u092E\u094B\u0915\u094D\u0937\u0926\u093E' }, { en: 'Pausha Putrada', hi: '\u092A\u094C\u0937 \u092A\u0941\u0924\u094D\u0930\u0926\u093E' }, { en: 'Jaya', hi: '\u091C\u092F\u093E' }, { en: 'Amalaki', hi: '\u0906\u092E\u0932\u0915\u0940' }];
  var EKADASHI_K = [{ en: 'Varuthini', hi: '\u0935\u0930\u0941\u0925\u093F\u0928\u0940' }, { en: 'Apara', hi: '\u0905\u092A\u0930\u093E' }, { en: 'Yogini', hi: '\u092F\u094B\u0917\u093F\u0928\u0940' }, { en: 'Kamika', hi: '\u0915\u093E\u092E\u093F\u0915\u093E' }, { en: 'Aja', hi: '\u0905\u091C\u093E' }, { en: 'Indira', hi: '\u0907\u0902\u0926\u093F\u0930\u093E' }, { en: 'Rama', hi: '\u0930\u092E\u093E' }, { en: 'Utpanna', hi: '\u0909\u0924\u094D\u092A\u0928\u094D\u0928\u093E' }, { en: 'Saphala', hi: '\u0938\u092B\u0932\u093E' }, { en: 'Shattila', hi: '\u0937\u091F\u0924\u093F\u0932\u093E' }, { en: 'Vijaya', hi: '\u0935\u093F\u091C\u092F\u093E' }, { en: 'Papmochani', hi: '\u092A\u093E\u092A\u092E\u094B\u091A\u0928\u0940' }];
  var EKADASHI_ADHIK_S = { en: 'Padmini', hi: '\u092A\u0926\u094D\u092E\u093F\u0928\u0940' };
  var EKADASHI_ADHIK_K = { en: 'Parama', hi: '\u092A\u0930\u092E\u093E' };
  var EK_WORD = ' \u090F\u0915\u093E\u0926\u0936\u0940';
  var PRADOSH_HI = '\u092A\u094D\u0930\u0926\u094B\u0937 \u0935\u094D\u0930\u0924';
  var PRADOSH_PREFIX_EN = { 1: 'Soma ', 2: 'Bhauma ', 6: 'Shani ' };
  var PRADOSH_PREFIX_HI = { 1: '\u0938\u094B\u092E ', 2: '\u092D\u094C\u092E ', 6: '\u0936\u0928\u093F ' };
  var SANKASHTI_EN = 'Sankashti Chaturthi', SANKASHTI_HI = '\u0938\u0902\u0915\u0937\u094D\u091F\u0940 \u091A\u0924\u0941\u0930\u094D\u0925\u0940';
  var ANGARKI_EN = 'Angarki Sankashti Chaturthi', ANGARKI_HI = '\u0905\u0902\u0917\u093E\u0930\u0915\u0940 \u0938\u0902\u0915\u0937\u094D\u091F\u0940 \u091A\u0924\u0941\u0930\u094D\u0925\u0940';

  // Public: recurring vrats for a CE year — Ekadashi (both pakshas, named),
  // Pradosh Vrat (Trayodashi at pradosh kaal, Soma/Bhauma/Shani prefixes),
  // Sankashti Chaturthi (Krishna Chaturthi at moonrise; Tuesday = Angarki).
  // Pradosh + Sankashti occur in adhik months too; Ekadashi gets Padmini/Parama there.
  function getVrats(yearCE, lat, lng, tzOffsetHours) {
    var tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    var months = buildMonthTable(yearCE);
    var out = [];
    function dateStr(ms) { return new Date(ms + tz * 3600000).toISOString().slice(0, 10); }
    function push(dayMs, en, hi, type) {
      var ds = dateStr(dayMs);
      if (ds.slice(0, 4) === String(yearCE)) out.push({ date: ds, en: en, hi: hi, type: type });
    }
    function dowOf(dayMs) { return new Date(dayMs + tz * 3600000).getUTCDay(); }
    // Smarta dashami-viddha rule: if the Ekadashi tithi BEGAN inside the
    // arunodaya window (sunrise − 96 min .. sunrise) of the udaya day, Dashami
    // "pierced" arunodaya — the fast shifts to the NEXT day. Validated: 2026
    // Padmini Ekadashi (tithi begins pre-dawn May 26 -> fast May 27).
    function ekadashiDay(Ts, Te) {
      var d = anchorDay(Ts, Te, 'udaya', lat, lng, tz);
      var sr = findSunrise(new Date(d), lat, lng, tz);
      if (sr && Ts > sr.getTime() - 96 * 60000 && Ts < sr.getTime()) d += 86400000;
      return d;
    }
    for (var mi = 0; mi < months.length; mi++) {
      var M = months[mi];
      // Ekadashi — Shukla (idx 10) and Krishna (idx 25), udaya rule.
      var pairs = [
        [10, M.adhik ? EKADASHI_ADHIK_S : EKADASHI_S[M.index]],
        [25, M.adhik ? EKADASHI_ADHIK_K : EKADASHI_K[M.index]]
      ];
      for (var p = 0; p < 2; p++) {
        var idx = pairs[p][0], nm = pairs[p][1];
        var Ts = bisectElong(M.start, M.end, idx * 12);
        var Te = bisectElong(Ts + 60000, M.end, (idx + 1) * 12);
        var d = ekadashiDay(Ts, Te);
        push(d, nm.en + ' Ekadashi', nm.hi + EK_WORD, 'ekadashi');
      }
      // Pradosh Vrat — S13 (idx 12) and K13 (idx 27), pradosh-kaal rule.
      var pIdx = [12, 27];
      for (var q = 0; q < 2; q++) {
        var Tsp = bisectElong(M.start, M.end, pIdx[q] * 12);
        var Tep = bisectElong(Tsp + 60000, M.end, (pIdx[q] + 1) * 12);
        var dp = anchorDay(Tsp, Tep, 'pradosh', lat, lng, tz);
        var dw = dowOf(dp);
        var pre = PRADOSH_PREFIX_EN[dw] || '';
        var preHi = PRADOSH_PREFIX_HI[dw] || '';
        push(dp, pre + 'Pradosh Vrat', preHi + PRADOSH_HI, 'pradosh');
      }
      // Sankashti Chaturthi — K4 (idx 18) at moonrise; Tuesday = Angarki.
      var Tsk = bisectElong(M.start, M.end, 18 * 12);
      var Tek = bisectElong(Tsk + 60000, M.end, 19 * 12);
      var dk = anchorDay(Tsk, Tek, 'moonrise', lat, lng, tz);
      var isTue = dowOf(dk) === 2;
      push(dk, isTue ? ANGARKI_EN : SANKASHTI_EN, isTue ? ANGARKI_HI : SANKASHTI_HI, 'sankashti');
    }
    out.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return out;
  }

  // ---- Kundli K1: Lagna (Ascendant) ---------------------------------------
  // Ascendant = ecliptic longitude rising on the eastern horizon.
  // RAMC = Greenwich apparent sidereal time (astronomy-engine) x 15 + east longitude.
  // Tropical Asc = atan2( cos RAMC, -(sin RAMC * cos eps + tan lat * sin eps) ),
  // then sidereal via our VALIDATED Lahiri ayanamsa. Self-check: lagna at sunrise
  // must approximately equal the Sun's sidereal longitude (the rising Sun).
  function obliquity(date) {
    var T = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525.0;
    return (23.43929111 - 0.0130042 * T) * Math.PI / 180;
  }
  // DRIK CALIBRATION: Drik's ascendant corresponds to a sidereal-time epoch
  // ~51.6 s ahead of straight GAST(UT) — likely their Delta-T / ephemeris-time
  // convention. Empirically fitted to 0.01 arc-min against Drik's Kundali
  // (Jul 10 2026 10:00 IST Vijayawada: lagna 22 Simha 44'02'') and consistent
  // with the Jul 10 Vrishchika->Dhanu boundary bracket (ours 16:57:08 inside
  // Drik's 16:56:00-16:57:41). Constancy across DECADES not yet verified —
  // validate with an old-year birth (e.g. 1990s) before trusting historic charts.
  var LAGNA_ST_OFFSET_MS = 51600;
  function lagnaLongitude(date, lat, lng) {
    var gst = A.SiderealTime(new Date(date.getTime() + LAGNA_ST_OFFSET_MS)); // hours
    var ramcDeg = (gst * 15 + lng) % 360;
    if (ramcDeg < 0) ramcDeg += 360;
    var ramc = ramcDeg * Math.PI / 180;
    var eps = obliquity(date);
    var phi = lat * Math.PI / 180;
    var asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * 180 / Math.PI;
    if (asc < 0) asc += 360;
    var sid = (asc - ayanamsa(date)) % 360;
    if (sid < 0) sid += 360;
    return sid;
  }

  // Public: lagna at an instant — sidereal longitude, rashi, degrees within rashi.
  function getLagna(date, lat, lng) {
    var lon = lagnaLongitude(date, lat, lng);
    var r = Math.floor(lon / 30) % 12;
    return { longitude: lon, rashiIndex: r, en: RASHI_EN[r], hi: RASHI_HI[r],
             degreesInRashi: lon - r * 30 };
  }

  // Public: lagna timings table for a day (sunrise -> next sunrise), Drik-style.
  // Lagna moves ~15 deg/hour (a rashi rises in ~1.3-3h), far faster than tithi,
  // so the shared 30h-window bisection would see multiple 360-wraps. This walker
  // uses a dedicated 5h window (exactly one crossing of each 30-deg boundary).
  function getLagnaTable(date, lat, lng, tzOffsetHours) {
    var tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    var sr = findSunrise(date, lat, lng, tz);
    var nextSr = findSunrise(new Date(date.getTime() + 86400000), lat, lng, tz);
    if (!sr || !nextSr) return [];
    function nextBoundary(fromMs) {
      var v0 = lagnaLongitude(new Date(fromMs), lat, lng);
      var target = (Math.floor(v0 / 30) + 1) * 30; // next multiple of 30 (may be 360)
      var lo = fromMs, hi = fromMs + 5 * 3600000;
      for (var i = 0; i < 50; i++) {
        var mid = (lo + hi) / 2;
        var v = lagnaLongitude(new Date(mid), lat, lng);
        if (v < v0 - 0.001) v += 360; // unwrap past 0
        if (v < target) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    var out = [];
    var t = sr.getTime();
    for (var k = 0; k < 16 && t < nextSr.getTime(); k++) {
      var r = Math.floor(lagnaLongitude(new Date(t + 60000), lat, lng) / 30) % 12;
      var end = nextBoundary(t + 60000);
      out.push({ rashiIndex: r, en: RASHI_EN[r], hi: RASHI_HI[r],
                 start: new Date(t), end: new Date(Math.min(end, nextSr.getTime())) });
      t = end;
    }
    return out;
  }

  // ---- Kundli K2: Graha (planetary) positions ------------------------------
  // Sun..Saturn: geocentric true ecliptic-of-date longitude via astronomy-engine
  // (same call pattern as the validated Sun), converted to sidereal with the
  // validated Lahiri ayanamsa. Rahu = MEAN lunar ascending node (Meeus
  // polynomial; panchang convention — Drik's default is Mean Rahu); Ketu =
  // Rahu + 180. Retrograde flag = sign of tropical motion over a 6h sample
  // (Rahu/Ketu come out perpetually retrograde naturally).
  var GRAHA_LIST = [
    { key: 'sun', en: 'Surya (Sun)', hi: '\u0938\u0942\u0930\u094D\u092F', body: 'Sun' },
    { key: 'moon', en: 'Chandra (Moon)', hi: '\u091A\u0902\u0926\u094D\u0930', body: 'Moon' },
    { key: 'mars', en: 'Mangal (Mars)', hi: '\u092E\u0902\u0917\u0932', body: 'Mars' },
    { key: 'mercury', en: 'Budh (Mercury)', hi: '\u092C\u0941\u0927', body: 'Mercury' },
    { key: 'jupiter', en: 'Guru (Jupiter)', hi: '\u0917\u0941\u0930\u0941', body: 'Jupiter' },
    { key: 'venus', en: 'Shukra (Venus)', hi: '\u0936\u0941\u0915\u094D\u0930', body: 'Venus' },
    { key: 'saturn', en: 'Shani (Saturn)', hi: '\u0936\u0928\u093F', body: 'Saturn' },
    { key: 'rahu', en: 'Rahu', hi: '\u0930\u093E\u0939\u0941', body: 'Rahu' },
    { key: 'ketu', en: 'Ketu', hi: '\u0915\u0947\u0924\u0941', body: 'Ketu' },
  ];
  function meanLunarNode(date) {
    var T = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525.0;
    var om = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T
           + T * T * T / 467441.0 - T * T * T * T / 60616000.0;
    om %= 360; if (om < 0) om += 360;
    return om; // tropical longitude of mean ascending node
  }
  function grahaTropical(body, date) {
    if (body === 'Moon') return A.EclipticGeoMoon(date).lon;
    if (body === 'Rahu') return meanLunarNode(date);
    if (body === 'Ketu') return (meanLunarNode(date) + 180) % 360;
    return A.Ecliptic(A.GeoVector(A.Body[body], date, true)).elon;
  }
  // Public: all 9 graha positions at an instant.
  function getGrahas(date) {
    var ay = ayanamsa(date);
    var later = new Date(date.getTime() + 6 * 3600000);
    var out = [];
    for (var i = 0; i < GRAHA_LIST.length; i++) {
      var g = GRAHA_LIST[i];
      var trop = grahaTropical(g.body, date);
      var trop2 = grahaTropical(g.body, later);
      var motion = ((trop2 - trop + 540) % 360) - 180;
      var sid = (trop - ay) % 360; if (sid < 0) sid += 360;
      var r = Math.floor(sid / 30) % 12;
      var nIdx = Math.floor(sid / (360 / 27)) % 27;
      var pada = Math.floor((sid % (360 / 27)) / ((360 / 27) / 4)) + 1;
      out.push({
        key: g.key, en: g.en, hi: g.hi,
        longitude: sid,
        rashi: { index: r, en: RASHI_EN[r], hi: RASHI_HI[r] },
        degreesInRashi: sid - r * 30,
        nakshatra: { index: nIdx, en: NAKSHATRA_NAMES[nIdx], hi: NAKSHATRA_HI[nIdx], pada: pada },
        retrograde: motion < 0
      });
    }
    // Combustion (Asta): planet within its threshold of the Sun. Thresholds
    // (deg): Moon 12, Mars 17, Mercury 14 (12 if retrograde), Jupiter 11,
    // Venus 10 (8 if retrograde), Saturn 15 — per Drik's convention (their
    // kundali showed Budha Asta on Jul 10+12 2026, reproduced by these values).
    var sunLon = out[0].longitude;
    var COMBUST = { moon: 12, mars: 17, mercury: 14, jupiter: 11, venus: 10, saturn: 15 };
    var COMBUST_R = { mercury: 12, venus: 8 };
    for (var c = 0; c < out.length; c++) {
      var gg = out[c];
      var th = COMBUST[gg.key];
      if (th == null) { gg.combust = false; continue; }
      if (gg.retrograde && COMBUST_R[gg.key] != null) th = COMBUST_R[gg.key];
      var dd = Math.abs(((gg.longitude - sunLon + 540) % 360) - 180);
      gg.combust = (180 - dd) < th || dd < th;
      gg.combust = Math.min(Math.abs(gg.longitude - sunLon), 360 - Math.abs(gg.longitude - sunLon)) < th;
    }
    return out;
  }

  // ---- Kundli K3: Birth Chart (D1 Rashi + D9 Navamsa) ----------------------
  // D1: whole-sign houses — house of a graha = ((grahaRashi - lagnaRashi + 12) % 12) + 1.
  // D9 Navamsa: each rashi divided into 9 parts of 3deg20'; navamsa rashi =
  // floor(longitude * 9 / 30) mod 12. This single formula reproduces the classical
  // rule exactly (movable signs count from themselves, fixed from the 9th, dual
  // from the 5th) — verified programmatically for all 12 rashis.
  function navamsaRashi(lon) {
    return Math.floor((((lon % 360) + 360) % 360) * 9 / 30) % 12;
  }
  function buildHouses(lagnaRashiIndex) {
    var houses = [];
    for (var h = 0; h < 12; h++) {
      var r = (lagnaRashiIndex + h) % 12;
      houses.push({ house: h + 1, rashiIndex: r, en: RASHI_EN[r], hi: RASHI_HI[r], grahas: [] });
    }
    return houses;
  }
  // Public: full birth chart for a birth instant + place.
  function getBirthChart(date, lat, lng) {
    var lagna = getLagna(date, lat, lng);
    var grahas = getGrahas(date);
    var d1 = buildHouses(lagna.rashiIndex);
    var navLagnaR = navamsaRashi(lagna.longitude);
    var d9 = buildHouses(navLagnaR);
    for (var i = 0; i < grahas.length; i++) {
      var g = grahas[i];
      g.house = ((g.rashi.index - lagna.rashiIndex + 12) % 12) + 1;
      d1[g.house - 1].grahas.push(g.key);
      var nr = navamsaRashi(g.longitude);
      g.navamsa = { rashiIndex: nr, en: RASHI_EN[nr], hi: RASHI_HI[nr] };
      g.navamsaHouse = ((nr - navLagnaR + 12) % 12) + 1;
      d9[g.navamsaHouse - 1].grahas.push(g.key);
    }
    return {
      lagna: lagna,
      navamsaLagna: { rashiIndex: navLagnaR, en: RASHI_EN[navLagnaR], hi: RASHI_HI[navLagnaR] },
      grahas: grahas,
      d1: d1,
      d9: d9
    };
  }

  // ---- Kundli K4: Vimshottari Dasha ----------------------------------------
  // 120-year cycle. Lord order = nakshatra-lord order (Ashvini=Ketu):
  // Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19,
  // Mercury 17. Birth mahadasha lord = Moon's birth-nakshatra lord; the first
  // dasha's BALANCE = (1 - elapsed fraction of the nakshatra) x lord's years.
  // CRITICAL correctness detail: the first mahadasha's ANTARDASHA boundaries are
  // anchored at the NOTIONAL dasha start (before birth) and then clipped to the
  // birth instant — they are NOT rescaled to the balance (this is how Drik and
  // classical texts compute it). Year = 365.25 days (validate vs Drik).
  var DASHA_ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
  var DASHA_YEARS = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 };
  // Year = SIDEREAL year 365.25636 days — decoded from Drik's own dasha table:
  // their notional Shukra start (Jun 18 2009 17:06) to Ketu end (Jun 20 2129
  // 11:25) implies 365.25636 d/yr to 5 decimals. (Was 365.25 before decoding.)
  var DASHA_YEAR_MS = 365.25636 * 86400000;
  function grahaMeta(key) {
    for (var i = 0; i < GRAHA_LIST.length; i++) if (GRAHA_LIST[i].key === key) return GRAHA_LIST[i];
    return { key: key, en: key, hi: key };
  }
  // Sub-periods of any period: sub-lords start from the period's own lord,
  // each spanning (subLordYears/120) of the parent. Same recursion gives
  // antardasha -> pratyantardasha -> sookshma, so this helper is exported.
  function dashaSubPeriods(lordKey, startMs, endMs) {
    var res = [];
    var total = endMs - startMs;
    var i0 = DASHA_ORDER.indexOf(lordKey);
    var t = startMs;
    for (var k = 0; k < 9; k++) {
      var L = DASHA_ORDER[(i0 + k) % 9];
      var span = total * DASHA_YEARS[L] / 120;
      var m = grahaMeta(L);
      res.push({ lord: L, en: m.en, hi: m.hi, start: new Date(t), end: new Date(t + span) });
      t += span;
    }
    return res;
  }
  // Public: full Vimshottari timeline from a birth instant.
  function getVimshottariDasha(birthDate) {
    var moonSid = moonSidereal(birthDate);
    var nakIdx = Math.floor(moonSid / (360 / 27)) % 27;
    var lordIdx = nakIdx % 9;
    var frac = (moonSid % (360 / 27)) / (360 / 27); // elapsed fraction of nakshatra
    var birthMs = birthDate.getTime();
    var mahas = [];
    var idx = lordIdx;
    var lord0 = DASHA_ORDER[lordIdx];
    var fullSpan0 = DASHA_YEARS[lord0] * DASHA_YEAR_MS;
    var notionalStart = birthMs - frac * fullSpan0;
    var cur = notionalStart;
    for (var k = 0; k < 9; k++) {
      var L = DASHA_ORDER[idx];
      var span = DASHA_YEARS[L] * DASHA_YEAR_MS;
      var end = cur + span;
      var antars = dashaSubPeriods(L, cur, end);
      if (k === 0) {
        // clip the balance dasha to birth: drop finished antars, clip the running one
        antars = antars.filter(function (a) { return a.end.getTime() > birthMs; });
        if (antars.length && antars[0].start.getTime() < birthMs) antars[0].start = new Date(birthMs);
      }
      var m = grahaMeta(L);
      mahas.push({
        lord: L, en: m.en, hi: m.hi, years: DASHA_YEARS[L],
        start: new Date(k === 0 ? birthMs : cur), end: new Date(end),
        balance: k === 0, antardashas: antars
      });
      cur = end;
      idx = (idx + 1) % 9;
    }
    return {
      birthMoonLongitude: moonSid,
      birthNakshatra: { index: nakIdx, en: NAKSHATRA_NAMES[nakIdx], hi: NAKSHATRA_HI[nakIdx] },
      balanceYears: (1 - frac) * DASHA_YEARS[lord0],
      mahadashas: mahas
    };
  }

  // ---- Kundli K5: Doshas (Manglik, Kaal Sarp, Sade Sati) -------------------
  // MANGLIK — Drik's model (decoded from their Mangal Dosha page, Ram's 1996
  // validation): headline verdict is FROM LAGNA; houses considered 12,1,2,4,7,8
  // (Drik includes BOTH 1st and 2nd). Dosha %: Mars alone in 12=50, 1=60, 2=80,
  // 4=80, 7=100, 8=100; aggravated by Saturn/Rahu/Ketu/Sun placed with Mars or
  // in {12,1,2,4}: Mars in {12,1,2,4} -> 150 (1 malefic) / 200 (2+); Mars in
  // {7,8} -> 200 (1) / 250 (2+). Cancellation rules = report layer (v2).
  var MANGLIK_BASE = { 12: 50, 1: 60, 2: 80, 4: 80, 7: 100, 8: 100 };
  function manglikFromRef(bc, refRashi) {
    var byKey = {};
    for (var i = 0; i < bc.grahas.length; i++) byKey[bc.grahas[i].key] = bc.grahas[i];
    function houseOf(k) { return ((byKey[k].rashi.index - refRashi + 12) % 12) + 1; }
    var mh = houseOf('mars');
    if (MANGLIK_BASE[mh] == null) return { house: mh, dosha: false, percent: 0, aggravators: [] };
    var aggr = [];
    var mal = ['saturn', 'rahu', 'ketu', 'sun'];
    for (var j = 0; j < mal.length; j++) {
      var h = houseOf(mal[j]);
      if (h === mh || h === 12 || h === 1 || h === 2 || h === 4) aggr.push(mal[j]);
    }
    var pct;
    if (mh === 7 || mh === 8) pct = aggr.length >= 2 ? 250 : aggr.length === 1 ? 200 : MANGLIK_BASE[mh];
    else pct = aggr.length >= 2 ? 200 : aggr.length === 1 ? 150 : MANGLIK_BASE[mh];
    return { house: mh, dosha: true, percent: pct, aggravators: aggr };
  }
  function manglikCheck(bc) {
    var moonR = 0, venusR = 0;
    for (var i = 0; i < bc.grahas.length; i++) {
      if (bc.grahas[i].key === 'moon') moonR = bc.grahas[i].rashi.index;
      if (bc.grahas[i].key === 'venus') venusR = bc.grahas[i].rashi.index;
    }
    var L = manglikFromRef(bc, bc.lagna.rashiIndex);
    var M = manglikFromRef(bc, moonR);
    var V = manglikFromRef(bc, venusR);
    return { fromLagna: L, fromMoon: M, fromVenus: V,
             present: L.dosha,          // Drik headline convention: Lagna chart
             percent: L.percent };
  }

  // KAAL SARP: all seven classical grahas hemmed on one side of the Rahu-Ketu
  // axis. Type named by RAHU'S HOUSE from lagna (1 Anant .. 12 Sheshnag).
  // A planet within 1 deg of either node is flagged (partial/anshik cases).
  var KAAL_SARP_TYPES = ['Anant', 'Kulik', 'Vasuki', 'Shankhpal', 'Padma', 'Mahapadma',
                         'Takshak', 'Karkotak', 'Shankhachur', 'Ghatak', 'Vishdhar', 'Sheshnag'];
  function kaalSarpCheck(bc) {
    var rahu = null, seven = [];
    for (var i = 0; i < bc.grahas.length; i++) {
      var g = bc.grahas[i];
      if (g.key === 'rahu') rahu = g;
      else if (g.key !== 'ketu') seven.push(g);
    }
    var allFirst = true, allSecond = true, nearNode = false;
    for (var j = 0; j < seven.length; j++) {
      var d = (seven[j].longitude - rahu.longitude + 360) % 360;
      if (!(d > 0 && d < 180)) allFirst = false;
      if (!(d > 180 && d < 360)) allSecond = false;
      if (Math.min(d % 180, 180 - (d % 180)) < 1) nearNode = true;
    }
    var present = allFirst || allSecond;
    var rahuHouse = ((rahu.rashi.index - bc.lagna.rashiIndex + 12) % 12) + 1;
    return { present: present, partial: present && nearNode,
             type: present ? KAAL_SARP_TYPES[rahuHouse - 1] : null,
             rahuHouse: rahuHouse,
             direction: present ? (allFirst ? 'Rahu-to-Ketu' : 'Ketu-to-Rahu') : null };
  }

  // SADE SATI: Saturn transiting the 12th (Rising), 1st (Peak) or 2nd (Setting)
  // rashi from the natal Moon sign — ~7.5 years. Saturn retrogrades across
  // boundaries, so periods are found by SCANNING Saturn's sidereal rashi in
  // 10-day steps over the window and refining each change by bisection (Drik's
  // own Sade Sati tables likewise show multiple start/end rows near boundaries).
  // Also flags the two Dhaiya (Small Panoti) transits: 4th (Ardhashtama) and 8th
  // (Ashtama Shani) from Moon.
  function saturnSid(ms) {
    var s = (grahaTropical('Saturn', new Date(ms)) - ayanamsa(new Date(ms))) % 360;
    return s < 0 ? s + 360 : s;
  }
  function getSadeSati(moonRashiIndex, refDate) {
    var ref = refDate ? refDate.getTime() : Date.now();
    var from = ref - 12 * 365.25 * 86400000, to = ref + 18 * 365.25 * 86400000;
    var zone = {};
    zone[(moonRashiIndex + 11) % 12] = 'Rising (12th)';
    zone[moonRashiIndex] = 'Peak (1st)';
    zone[(moonRashiIndex + 1) % 12] = 'Setting (2nd)';
    var dhaiya = {};
    dhaiya[(moonRashiIndex + 3) % 12] = 'Ardhashtama Shani (4th Dhaiya)';
    dhaiya[(moonRashiIndex + 7) % 12] = 'Ashtama Shani (8th Dhaiya)';
    var step = 10 * 86400000;
    function rashiAt(ms) { return Math.floor(saturnSid(ms) / 30) % 12; }
    function refine(loMs, hiMs) { // instant where rashi changes between samples
      var rLo = rashiAt(loMs);
      for (var i = 0; i < 40; i++) {
        var mid = (loMs + hiMs) / 2;
        if (rashiAt(mid) === rLo) loMs = mid; else hiMs = mid;
      }
      return (loMs + hiMs) / 2;
    }
    var periods = [];
    var prevR = rashiAt(from), segStart = from;
    for (var t = from + step; t <= to + step; t += step) {
      var r = rashiAt(Math.min(t, to));
      if (r !== prevR || t > to) {
        var segEnd = (r !== prevR) ? refine(t - step, Math.min(t, to)) : to;
        var label = zone[prevR] || dhaiya[prevR] || null;
        if (label) periods.push({ phase: label, rashiIndex: prevR, en: RASHI_EN[prevR],
                                  start: new Date(segStart), end: new Date(segEnd) });
        segStart = segEnd; prevR = r;
        if (t > to) break;
      }
    }
    var nowR = rashiAt(ref);
    return {
      moonRashi: { index: moonRashiIndex, en: RASHI_EN[moonRashiIndex] },
      active: !!zone[nowR],
      currentPhase: zone[nowR] || dhaiya[nowR] || null,
      periods: periods
    };
  }

  // Public: all doshas for a birth (Sade Sati status evaluated at refDate, default now).
  function getDoshas(birthDate, lat, lng, refDate) {
    var bc = getBirthChart(birthDate, lat, lng);
    var moonR = 0;
    for (var i = 0; i < bc.grahas.length; i++) if (bc.grahas[i].key === 'moon') moonR = bc.grahas[i].rashi.index;
    return {
      manglik: manglikCheck(bc),
      kaalSarp: kaalSarpCheck(bc),
      sadeSati: getSadeSati(moonR, refDate || new Date())
    };
  }

  // ---- Kundli K6: Yogas -----------------------------------------------------
  // Starter set of classical, crisply-defined yogas. Rashi lords (Mesha..Meena):
  // Mars, Venus, Mercury, Moon, Sun, Mercury, Venus, Mars, Jupiter, Saturn,
  // Saturn, Jupiter. Dignities: own signs + exaltation/debilitation rashis.
  var RASHI_LORD = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
                    'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
  var OWN_SIGNS = { sun: [4], moon: [3], mars: [0, 7], mercury: [2, 5],
                    jupiter: [8, 11], venus: [1, 6], saturn: [9, 10] };
  var EXALT = { sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6 };
  var DEBIL = { sun: 6, moon: 7, mars: 3, mercury: 11, jupiter: 9, venus: 5, saturn: 0 };
  var KENDRA = [1, 4, 7, 10];

  function dignityOf(g) {
    if (EXALT[g.key] === g.rashi.index) return 'Exalted';
    if (DEBIL[g.key] === g.rashi.index) return 'Debilitated';
    if (OWN_SIGNS[g.key] && OWN_SIGNS[g.key].indexOf(g.rashi.index) >= 0) return 'Own Sign';
    return null;
  }

  // Public: yoga analysis of a birth chart.
  function getYogas(birthDate, lat, lng) {
    var bc = getBirthChart(birthDate, lat, lng);
    var byKey = {};
    for (var i = 0; i < bc.grahas.length; i++) byKey[bc.grahas[i].key] = bc.grahas[i];
    var lagR = bc.lagna.rashiIndex;
    function houseFromLagna(rashiIdx) { return ((rashiIdx - lagR + 12) % 12) + 1; }
    function houseFromMoon(rashiIdx) { return ((rashiIdx - byKey.moon.rashi.index + 12) % 12) + 1; }
    function lordOfHouse(h) { return RASHI_LORD[(lagR + h - 1) % 12]; }
    var yogas = [];
    function add(key, en, present, detail) { yogas.push({ key: key, en: en, present: present, detail: detail }); }

    // Gaja Kesari: Jupiter in a kendra FROM THE MOON.
    var jupFromMoon = houseFromMoon(byKey.jupiter.rashi.index);
    add('gajaKesari', 'Gaja Kesari Yoga', KENDRA.indexOf(jupFromMoon) >= 0,
        'Jupiter is in house ' + jupFromMoon + ' from the Moon');
    // Budhaditya: Sun + Mercury in the same rashi.
    add('budhaditya', 'Budhaditya Yoga', byKey.sun.rashi.index === byKey.mercury.rashi.index,
        'Sun in ' + byKey.sun.rashi.en + ', Mercury in ' + byKey.mercury.rashi.en +
        (byKey.mercury.combust ? ' (Mercury combust)' : ''));
    // Chandra-Mangal: Moon + Mars in the same rashi.
    add('chandraMangal', 'Chandra-Mangal Yoga', byKey.moon.rashi.index === byKey.mars.rashi.index,
        'Moon in ' + byKey.moon.rashi.en + ', Mars in ' + byKey.mars.rashi.en);
    // Panch Mahapurusha: planet in own/exaltation sign AND in a kendra from Lagna.
    var MAHA = [['ruchaka', 'Ruchaka Yoga (Mars)', 'mars'], ['bhadra', 'Bhadra Yoga (Mercury)', 'mercury'],
                ['hamsa', 'Hamsa Yoga (Jupiter)', 'jupiter'], ['malavya', 'Malavya Yoga (Venus)', 'venus'],
                ['shasha', 'Shasha Yoga (Saturn)', 'saturn']];
    for (var m = 0; m < MAHA.length; m++) {
      var pk = MAHA[m][2], pg = byKey[pk];
      var strong = (OWN_SIGNS[pk].indexOf(pg.rashi.index) >= 0) || (EXALT[pk] === pg.rashi.index);
      var hK = houseFromLagna(pg.rashi.index);
      add(MAHA[m][0], MAHA[m][1], strong && KENDRA.indexOf(hK) >= 0,
          pg.en.split(' ')[0] + ' in ' + pg.rashi.en + ' (' + (dignityOf(pg) || 'ordinary') + '), house ' + hK);
    }
    // Vipreet Raja trio: lords of 6/8/12 placed in 6/8/12.
    var VIP = [['harsha', 'Harsha Yoga (Vipreet)', 6], ['sarala', 'Sarala Yoga (Vipreet)', 8], ['vimala', 'Vimala Yoga (Vipreet)', 12]];
    for (var v = 0; v < VIP.length; v++) {
      var lord = byKey[lordOfHouse(VIP[v][2])];
      var lh = houseFromLagna(lord.rashi.index);
      add(VIP[v][0], VIP[v][1], lh === 6 || lh === 8 || lh === 12,
          'Lord of house ' + VIP[v][2] + ' (' + lord.en.split(' ')[0] + ') is in house ' + lh);
    }
    // Basic Raja Yoga: a kendra-lord conjunct a trikona-lord (different planets).
    var kendraLords = [1, 4, 7, 10].map(lordOfHouse);
    var trikonaLords = [1, 5, 9].map(lordOfHouse);
    var rajaPairs = [];
    for (var a = 0; a < kendraLords.length; a++) {
      for (var b = 0; b < trikonaLords.length; b++) {
        var A = kendraLords[a], B = trikonaLords[b];
        if (A !== B && byKey[A].rashi.index === byKey[B].rashi.index) {
          var tag = A + '+' + B;
          if (rajaPairs.indexOf(tag) < 0 && rajaPairs.indexOf(B + '+' + A) < 0) rajaPairs.push(tag);
        }
      }
    }
    add('raja', 'Raja Yoga (kendra-trikona conjunction)', rajaPairs.length > 0,
        rajaPairs.length ? 'Pairs: ' + rajaPairs.join(', ') : 'No kendra-lord + trikona-lord conjunction');
    // Basic Dhana Yoga: lord of 2 conjunct lord of 11.
    var l2 = lordOfHouse(2), l11 = lordOfHouse(11);
    add('dhana', 'Dhana Yoga (2nd-11th lords)', l2 !== l11 && byKey[l2].rashi.index === byKey[l11].rashi.index,
        '2nd lord ' + l2 + ' in ' + byKey[l2].rashi.en + ', 11th lord ' + l11 + ' in ' + byKey[l11].rashi.en);
    // Kemadruma (inauspicious): houses 2 and 12 FROM MOON empty and no planet
    // with the Moon (Sun, Rahu, Ketu excluded per classical rule). Note:
    // kendra-based cancellations exist — report layer.
    var occupied = false;
    for (var q = 0; q < bc.grahas.length; q++) {
      var gg = bc.grahas[q];
      if (gg.key === 'moon' || gg.key === 'sun' || gg.key === 'rahu' || gg.key === 'ketu') continue;
      var hm = houseFromMoon(gg.rashi.index);
      if (hm === 1 || hm === 2 || hm === 12) occupied = true;
    }
    add('kemadruma', 'Kemadruma Yoga (inauspicious)', !occupied,
        occupied ? 'Moon is supported by adjacent planets' : 'No planets in 12th/1st/2nd from Moon (cancellations not yet checked)');

    // Dignities table
    var dignities = [];
    for (var d2 = 0; d2 < bc.grahas.length; d2++) {
      var gd = bc.grahas[d2];
      var dg = dignityOf(gd);
      if (dg) dignities.push({ key: gd.key, en: gd.en, rashi: gd.rashi.en, dignity: dg });
    }
    return {
      yogas: yogas,
      presentYogas: yogas.filter(function (y) { return y.present; }),
      dignities: dignities
    };
  }

  // ---- Kundli K7: Guna Milan (Ashtakoota, 36 points) ------------------------
  // Marriage matching from the two Moons (nakshatra + rashi) only. Kootas:
  // Varna 1 + Vashya 2 + Tara 3 + Yoni 4 + Graha Maitri 5 + Gana 6 + Bhakoot 7
  // + Nadi 8 = 36. Vashya matrix, Yoni matrix and Gana matrix follow the widely
  // published North-Indian standard — PENDING one Drik Horoscope-Match
  // validation (any cell differences will be reverse-engineered, as always).
  var KOOTA_HI = { 'Varna': '\u0935\u0930\u094D\u0923', 'Vashya': '\u0935\u0936\u094D\u092F', 'Tara': '\u0924\u093E\u0930\u093E', 'Yoni': '\u092F\u094B\u0928\u093F', 'Graha Maitri': '\u0917\u094D\u0930\u0939 \u092E\u0948\u0924\u094D\u0930\u0940', 'Gana': '\u0917\u0923', 'Bhakoot': '\u092D\u0915\u0942\u091F', 'Nadi': '\u0928\u093E\u0921\u093C\u0940' };
  // Varna by rashi: 0=Brahmin(water) 1=Kshatriya(fire) 2=Vaishya(earth) 3=Shudra(air)
  var VARNA_OF_RASHI = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0];
  var VARNA_NAMES = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra'];
  // Vashya groups by rashi (full-sign convention): 0 Chatushpad, 1 Manav,
  // 2 Jalchar, 3 Vanchar, 4 Keet. (Dhanu->Chatushpad, Makara->Jalchar variants noted.)
  var VASHYA_OF_RASHI = [0, 0, 1, 2, 3, 1, 1, 4, 0, 2, 1, 2];
  var VASHYA_NAMES = ['Chatushpad', 'Manav', 'Jalchar', 'Vanchar', 'Keet'];
  var VASHYA_MATRIX = [ // boy rows x girl cols
    [2, 1, 1, 0, 1],
    [1, 2, 0.5, 0, 1],
    [1, 0.5, 2, 0, 1],
    [0, 0, 0, 2, 0],
    [1, 1, 1, 0, 2]
  ];
  // Yoni animal per nakshatra (0..26):
  var YONI_OF_NAK = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
  var YONI_NAMES = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
                    'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion'];
  var YONI_MATRIX = [
    [4,2,2,3,2,2,2,1,0,1,3,3,2,1],
    [2,4,3,3,2,2,2,2,3,1,2,3,2,0],
    [2,3,4,2,1,2,1,3,3,1,2,0,3,1],
    [3,3,2,4,2,1,1,1,1,2,2,2,0,2],
    [2,2,1,2,4,2,1,2,2,1,0,2,1,1],
    [2,2,2,1,2,4,0,2,2,1,3,3,2,1],
    [2,2,1,1,1,0,4,2,2,2,2,2,1,2],
    [1,2,3,1,2,2,2,4,3,0,3,2,2,1],
    [0,3,3,1,2,2,2,3,4,1,2,2,2,1],
    [1,1,1,2,1,1,2,0,1,4,1,1,2,1],
    [3,2,2,2,0,3,2,3,2,1,4,2,2,1],
    [3,3,0,2,2,3,2,2,2,1,2,4,3,2],
    [2,2,3,0,1,2,1,2,2,2,2,3,4,2],
    [1,0,1,2,1,1,2,1,1,1,1,2,2,4]
  ];
  // Graha Maitri: natural planetary friendship. 2=friend 1=neutral 0=enemy.
  var MAITRI = {
    sun:     { sun: 2, moon: 2, mars: 2, mercury: 1, jupiter: 2, venus: 0, saturn: 0 },
    moon:    { sun: 2, moon: 2, mars: 1, mercury: 2, jupiter: 1, venus: 1, saturn: 1 },
    mars:    { sun: 2, moon: 2, mars: 2, mercury: 0, jupiter: 2, venus: 1, saturn: 1 },
    mercury: { sun: 2, moon: 0, mars: 1, mercury: 2, jupiter: 1, venus: 2, saturn: 1 },
    jupiter: { sun: 2, moon: 2, mars: 2, mercury: 0, jupiter: 2, venus: 0, saturn: 1 },
    venus:   { sun: 0, moon: 0, mars: 1, mercury: 2, jupiter: 1, venus: 2, saturn: 2 },
    saturn:  { sun: 0, moon: 0, mars: 0, mercury: 2, jupiter: 1, venus: 2, saturn: 2 }
  };
  // Gana per nakshatra: 0 Deva, 1 Manushya, 2 Rakshasa.
  var GANA_OF_NAK = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];
  var GANA_NAMES = ['Deva', 'Manushya', 'Rakshasa'];
  var GANA_MATRIX = [ // boy rows x girl cols
    [6, 6, 1],
    [5, 6, 0],
    [1, 0, 6]
  ];
  // Nadi per nakshatra: 0 Adi, 1 Madhya, 2 Antya.
  var NADI_OF_NAK = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];
  var NADI_NAMES = ['Adi', 'Madhya', 'Antya'];

  function taraKootaScore(boyNak, girlNak) {
    function bad(from, to) {
      var t = ((to - from + 27) % 27) % 9 + 1;
      return t === 3 || t === 5 || t === 7;
    }
    var b1 = bad(girlNak, boyNak), b2 = bad(boyNak, girlNak);
    return (!b1 && !b2) ? 3 : (b1 && b2) ? 0 : 1.5;
  }
  // Core matcher on the two Moons.
  function gunaMilanCore(boyNak, boyRashi, girlNak, girlRashi) {
    var k = [];
    // 1 Varna
    var bv = VARNA_OF_RASHI[boyRashi], gv = VARNA_OF_RASHI[girlRashi];
    k.push({ koota: 'Varna', hi: KOOTA_HI['Varna'], max: 1, obtained: bv <= gv ? 1 : 0,
             boy: VARNA_NAMES[bv], girl: VARNA_NAMES[gv] });
    // 2 Vashya
    var bw = VASHYA_OF_RASHI[boyRashi], gw = VASHYA_OF_RASHI[girlRashi];
    k.push({ koota: 'Vashya', hi: KOOTA_HI['Vashya'], max: 2, obtained: VASHYA_MATRIX[bw][gw],
             boy: VASHYA_NAMES[bw], girl: VASHYA_NAMES[gw] });
    // 3 Tara
    k.push({ koota: 'Tara', hi: KOOTA_HI['Tara'], max: 3, obtained: taraKootaScore(boyNak, girlNak),
             boy: NAKSHATRA_NAMES[boyNak], girl: NAKSHATRA_NAMES[girlNak] });
    // 4 Yoni
    var by = YONI_OF_NAK[boyNak], gy = YONI_OF_NAK[girlNak];
    k.push({ koota: 'Yoni', hi: KOOTA_HI['Yoni'], max: 4, obtained: YONI_MATRIX[by][gy],
             boy: YONI_NAMES[by], girl: YONI_NAMES[gy] });
    // 5 Graha Maitri (moon-sign lords)
    var bl = RASHI_LORD[boyRashi], gl = RASHI_LORD[girlRashi];
    var f1 = MAITRI[bl][gl], f2 = MAITRI[gl][bl];
    var gm;
    if (bl === gl) gm = 5;
    else if (f1 === 2 && f2 === 2) gm = 5;
    else if ((f1 === 2 && f2 === 1) || (f1 === 1 && f2 === 2)) gm = 4;
    else if (f1 === 1 && f2 === 1) gm = 3;
    else if ((f1 === 2 && f2 === 0) || (f1 === 0 && f2 === 2)) gm = 1;
    else if ((f1 === 1 && f2 === 0) || (f1 === 0 && f2 === 1)) gm = 0.5;
    else gm = 0;
    k.push({ koota: 'Graha Maitri', hi: KOOTA_HI['Graha Maitri'], max: 5, obtained: gm,
             boy: bl, girl: gl });
    // 6 Gana
    var bg = GANA_OF_NAK[boyNak], gg = GANA_OF_NAK[girlNak];
    k.push({ koota: 'Gana', hi: KOOTA_HI['Gana'], max: 6, obtained: GANA_MATRIX[bg][gg],
             boy: GANA_NAMES[bg], girl: GANA_NAMES[gg] });
    // 7 Bhakoot
    var d1 = ((girlRashi - boyRashi + 12) % 12) + 1;
    var d2 = ((boyRashi - girlRashi + 12) % 12) + 1;
    var badB = (d1 === 2 || d1 === 12 || d1 === 5 || d1 === 9 || d1 === 6 || d1 === 8);
    k.push({ koota: 'Bhakoot', hi: KOOTA_HI['Bhakoot'], max: 7, obtained: badB ? 0 : 7,
             boy: RASHI_EN[boyRashi], girl: RASHI_EN[girlRashi],
             note: badB ? (d1 + '/' + d2 + ' — Bhakoot Dosha') : (d1 + '/' + d2) });
    // 8 Nadi
    var bn = NADI_OF_NAK[boyNak], gn = NADI_OF_NAK[girlNak];
    k.push({ koota: 'Nadi', hi: KOOTA_HI['Nadi'], max: 8, obtained: bn === gn ? 0 : 8,
             boy: NADI_NAMES[bn], girl: NADI_NAMES[gn],
             note: bn === gn ? 'Nadi Dosha' : '' });
    var total = 0;
    for (var i = 0; i < k.length; i++) total += k[i].obtained;
    var verdict = total >= 33 ? 'Excellent' : total >= 25 ? 'Very Good' : total >= 18 ? 'Acceptable' : 'Not Recommended';
    return {
      kootas: k, total: total, max: 36, verdict: verdict,
      doshas: {
        nadi: bn === gn,
        bhakoot: badB,
        gana: GANA_MATRIX[bg][gg] <= 1
      }
    };
  }
  // Public: full match from two birth instants (Moon needs no location).
  function getGunaMilan(boyBirthDate, girlBirthDate) {
    function moonOf(d) {
      var ms = moonSidereal(d);
      return { nak: Math.floor(ms / (360 / 27)) % 27, rashi: Math.floor(ms / 30) % 12 };
    }
    var b = moonOf(boyBirthDate), g = moonOf(girlBirthDate);
    var res = gunaMilanCore(b.nak, b.rashi, g.nak, g.rashi);
    res.boyMoon = { nakshatra: NAKSHATRA_NAMES[b.nak], rashi: RASHI_EN[b.rashi] };
    res.girlMoon = { nakshatra: NAKSHATRA_NAMES[g.nak], rashi: RASHI_EN[g.rashi] };
    return res;
  }

  // ---- Kundli K6b: Ashtakavarga (BPHS) --------------------------------------
  // Each of the 7 planets receives benefic bindus from 8 contributors (7 planets
  // + Lagna): from each contributor's rashi, specific house-counts (classical
  // BPHS tables below) receive 1 bindu. Bhinnashtakavarga totals must equal
  // 48/49/39/54/56/52/39 (Sun..Saturn) and Sarvashtakavarga total = 337.
  var ASHTAK_TABLES = {
    sun:     { sun: [1,2,4,7,8,9,10,11], moon: [3,6,10,11], mars: [1,2,4,7,8,9,10,11],
               mercury: [3,5,6,9,10,11,12], jupiter: [5,6,9,11], venus: [6,7,12],
               saturn: [1,2,4,7,8,9,10,11], lagna: [3,4,6,10,11,12] },
    moon:    { sun: [3,6,7,8,10,11], moon: [1,3,6,7,10,11], mars: [2,3,5,6,9,10,11],
               mercury: [1,3,4,5,7,8,10,11], jupiter: [1,4,7,8,10,11,12],
               venus: [3,4,5,7,9,10,11], saturn: [3,5,6,11], lagna: [3,6,10,11] },
    mars:    { sun: [3,5,6,10,11], moon: [3,6,11], mars: [1,2,4,7,8,10,11],
               mercury: [3,5,6,11], jupiter: [6,10,11,12], venus: [6,8,11,12],
               saturn: [1,4,7,8,9,10,11], lagna: [1,3,6,10,11] },
    mercury: { sun: [5,6,9,11,12], moon: [2,4,6,8,10,11], mars: [1,2,4,7,8,9,10,11],
               mercury: [1,3,5,6,9,10,11,12], jupiter: [6,8,11,12],
               venus: [1,2,3,4,5,8,9,11], saturn: [1,2,4,7,8,9,10,11], lagna: [1,2,4,6,8,10,11] },
    jupiter: { sun: [1,2,3,4,7,8,9,10,11], moon: [2,5,7,9,11], mars: [1,2,4,7,8,10,11],
               mercury: [1,2,4,5,6,9,10,11], jupiter: [1,2,3,4,7,8,10,11],
               venus: [2,5,6,9,10,11], saturn: [3,5,6,12], lagna: [1,2,4,5,6,7,9,10,11] },
    venus:   { sun: [8,11,12], moon: [1,2,3,4,5,8,9,11,12], mars: [3,5,6,9,11,12],
               mercury: [3,5,6,9,11], jupiter: [5,8,9,10,11],
               venus: [1,2,3,4,5,8,9,10,11], saturn: [3,4,5,8,9,10,11], lagna: [1,2,3,4,5,8,9,11] },
    saturn:  { sun: [1,2,4,7,8,10,11], moon: [3,6,11], mars: [3,5,6,10,11,12],
               mercury: [6,8,9,10,11,12], jupiter: [5,6,11,12], venus: [6,11,12],
               saturn: [3,5,6,11], lagna: [1,3,4,6,10,11] }
  };
  // Public: Bhinnashtakavarga (per planet, per rashi, with contributor rows)
  // + Sarvashtakavarga, from a birth chart.
  function getAshtakavarga(birthDate, lat, lng) {
    var bc = getBirthChart(birthDate, lat, lng);
    var pos = { lagna: bc.lagna.rashiIndex };
    for (var i = 0; i < bc.grahas.length; i++) {
      var g = bc.grahas[i];
      if (ASHTAK_TABLES[g.key] || g.key === 'sun') pos[g.key] = g.rashi.index;
    }
    var targets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
    var contributors = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'lagna'];
    var bav = {};
    var sav = [0,0,0,0,0,0,0,0,0,0,0,0];
    for (var t = 0; t < targets.length; t++) {
      var tk = targets[t];
      var perRashi = [0,0,0,0,0,0,0,0,0,0,0,0];
      var rows = {};
      for (var c = 0; c < contributors.length; c++) {
        var ck = contributors[c];
        var row = [0,0,0,0,0,0,0,0,0,0,0,0];
        var houses = ASHTAK_TABLES[tk][ck];
        for (var h = 0; h < houses.length; h++) {
          var r = (pos[ck] + houses[h] - 1) % 12;
          row[r] = 1;
          perRashi[r]++;
        }
        rows[ck] = row;
      }
      var tot = 0;
      for (var r2 = 0; r2 < 12; r2++) { tot += perRashi[r2]; sav[r2] += perRashi[r2]; }
      bav[tk] = { perRashi: perRashi, total: tot, rows: rows };
    }
    var savTotal = 0;
    for (var r3 = 0; r3 < 12; r3++) savTotal += sav[r3];
    return { bav: bav, sav: sav, savTotal: savTotal };
  }

  // ---- Generic transit periods (gochara) ------------------------------------
  // Rashi-transit segments for any slow graha over a window, retrogrades
  // captured via sampling + bisection (same method as the validated Sade Sati).
  function getTransitPeriods(planetKey, fromDate, toDate) {
    var body = null;
    for (var i = 0; i < GRAHA_LIST.length; i++) if (GRAHA_LIST[i].key === planetKey) body = GRAHA_LIST[i].body;
    if (!body || planetKey === 'moon') return [];
    function sid(ms) {
      var s = (grahaTropical(body, new Date(ms)) - ayanamsa(new Date(ms))) % 360;
      return s < 0 ? s + 360 : s;
    }
    function rashiAt(ms) { return Math.floor(sid(ms) / 30) % 12; }
    var fast = (planetKey === 'sun' || planetKey === 'mercury' || planetKey === 'venus' || planetKey === 'mars');
    var step = (fast ? 2 : 10) * 86400000;
    var from = fromDate.getTime(), to = toDate.getTime();
    function refine(loMs, hiMs) {
      var rLo = rashiAt(loMs);
      for (var k = 0; k < 40; k++) {
        var mid = (loMs + hiMs) / 2;
        if (rashiAt(mid) === rLo) loMs = mid; else hiMs = mid;
      }
      return (loMs + hiMs) / 2;
    }
    var out = [];
    var prevR = rashiAt(from), segStart = from;
    for (var t2 = from + step; t2 <= to + step; t2 += step) {
      var r = rashiAt(Math.min(t2, to));
      if (r !== prevR || t2 > to) {
        var segEnd = (r !== prevR) ? refine(t2 - step, Math.min(t2, to)) : to;
        out.push({ rashiIndex: prevR, en: RASHI_EN[prevR], hi: RASHI_HI[prevR],
                   start: new Date(segStart), end: new Date(segEnd) });
        segStart = segEnd; prevR = r;
        if (t2 > to) break;
      }
    }
    return out;
  }

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

    // Panchaka + secondary muhurtas (Phase 8).
    let panchaka = null;
    try { panchaka = panchakaForDay(srMs, nextSrMs, tz); } catch (e) { panchaka = null; }
    let muhurtas = null;
    try {
      muhurtas = secondaryMuhurtas(srMs, (sunset ? sunset.getTime() : srMs + 12 * 3600000),
        nextSrMs, prevSunset ? prevSunset.getTime() : null);
    } catch (e) { muhurtas = null; }

    // Varjyam (Phase 5b) — validated against DinchaK to ~1 min.
    let varjyamList = [];
    try { varjyamList = varjyamsInDay(srMs, nextSrMs); } catch (e) { varjyamList = []; }
    const varjyam = varjyamList.length ? varjyamList[0] : null;

    // Amrit Kaal (Phase 8) — bracketing fixed; ghati = tyajya + 24 (validated
    // against DinchaK Jul 5 + Jul 20 2026). Ashvini/Rohini days skipped pending validation.
    let amritList = [];
    try { amritList = amritKaalsInDay(srMs, nextSrMs); } catch (e) { amritList = []; }
    const amritKaal = amritList.length ? amritList[0] : null;

    // Dur Muhurtam (Phase 8) — ALL 7 weekdays validated from Ram's DinchaK data.
    let durMuhurtam = [];
    try { durMuhurtam = durMuhurtamsInDay(srMs, (sunset ? sunset.getTime() : srMs + 12 * 3600000), nextSrMs, dow); } catch (e) { durMuhurtam = []; }

    // Hindu calendar layer (Phase 7) — months, samvats, ritu, ayana.
    let hinduCalendar = null;
    try { hinduCalendar = computeHinduCalendar(srMs, paksha, tz); } catch (e) { hinduCalendar = null; }

    // Phase 8: Disha Shool + Tarabalam + Chandrabalam.
    const dishaShool = { en: DISHA_EN[dow], hi: DISHA_HI[dow] };
    // Tarabalam: one entry per day-nakshatra segment (list = favourable JANMA nakshatras).
    let tarabalam = [];
    try {
      tarabalam = nakSegs.map(function (s) {
        const good = goodTarabalamNaks(s.index % 27);
        return {
          dayNakshatra: { index: s.index % 27, en: s.en, hi: s.hi },
          upto: s.end,
          good: good.map(function (j) { return { index: j, en: NAKSHATRA_NAMES[j], hi: NAKSHATRA_HI[j] }; }),
          all: allTarabalam(s.index % 27)
        };
      });
    } catch (e) { tarabalam = []; }
    // Chandrabalam: one entry per day moon-rashi segment (list = favourable JANMA rashis).
    let chandrabalam = [];
    try {
      const rashiNameFn = function (i) { return { en: RASHI_EN[i % 12], hi: RASHI_HI[i % 12] }; };
      const rashiSegs = buildSegments(srMs, nextSrMs, moonSidereal, 30, rashiNameFn);
      chandrabalam = rashiSegs.map(function (s) {
        const good = goodChandrabalamRashis(s.index % 12);
        return {
          dayRashi: { index: s.index % 12, en: s.en, hi: s.hi },
          upto: s.end,
          good: good.map(function (r) { return { index: r, en: RASHI_EN[r], hi: RASHI_HI[r] }; }),
          all: allChandrabalam(s.index % 12)
        };
      });
    } catch (e) { chandrabalam = []; }

    // Choghadiya & Hora (Phase 6) — pure day/night divisions, no ambiguity.
    const ssForDiv = sunset ? sunset.getTime() : (srMs + 12 * 3600000);
    let choghadiya = null, hora = null;
    try { choghadiya = computeChoghadiya(srMs, ssForDiv, nextSrMs, dow); } catch (e) { choghadiya = null; }
    try { hora = computeHora(srMs, ssForDiv, nextSrMs, dow); } catch (e) { hora = null; }

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
      amritKaalAll: amritList,
      durMuhurtam: durMuhurtam,
      choghadiya: choghadiya,
      hora: hora,
      hinduCalendar: hinduCalendar,
      dishaShool: dishaShool,
      tarabalam: tarabalam,
      chandrabalam: chandrabalam,
      panchaka: panchaka,
      muhurtas: muhurtas
    };
  }

  global.PanchangEngine = {
    getPanchang,
    getFestivals,
    getVrats,
    getLagna,
    getLagnaTable,
    getGrahas,
    getBirthChart,
    getVimshottariDasha,
    dashaSubPeriods,
    getDoshas,
    getSadeSati,
    getYogas,
    getGunaMilan,
    gunaMilanCore,
    getAshtakavarga,
    getTransitPeriods,
    elongation, moonSidereal, yogaSum, ayanamsa, sunSidereal,
    findSunrise, findSunset, findMoonrise, findMoonset, findBoundary, buildSegments,
    moonSign, sunSign, dayPart, computeAbhijit, computeBrahmaMuhurta,
    sunLongitude, moonLongitude,
    _data: { TITHI_NAMES, NAKSHATRA_NAMES, YOGA_NAMES, RASHI_EN }
  };

})(typeof window !== 'undefined' ? window : this);
