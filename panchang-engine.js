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
  // ALL PENDING validation vs drikpanchang.com "Auspicious Timings":
  //   Vijaya  = 11th of 15 day muhurtas (Abhijit is the validated 8th).
  //   Godhuli = sunset -> sunset + 24 min (1 ghati).
  //   Nishita = solar midnight ± half a night-muhurta (night = ss -> next sr, /15).
  //   Pratah Sandhya  = (sunrise - 2 prev-night-muhurtas) -> sunrise
  //                     (i.e., Brahma Muhurta start -> sunrise).
  //   Sayahna Sandhya = sunset -> sunset + 2 night-muhurtas.
  function secondaryMuhurtas(srMs, ssMs, nextSrMs, prevSsMs) {
    const mu = (ssMs - srMs) / 15;
    const nmu = (nextSrMs - ssMs) / 15;
    const out = {
      vijaya: { start: new Date(srMs + 10 * mu), end: new Date(srMs + 11 * mu) },
      godhuli: { start: new Date(ssMs), end: new Date(ssMs + 24 * 60000) },
      nishita: (function () {
        const mid = (ssMs + nextSrMs) / 2;
        return { start: new Date(mid - nmu / 2), end: new Date(mid + nmu / 2) };
      })(),
      sayahnaSandhya: { start: new Date(ssMs), end: new Date(ssMs + 2 * nmu) },
      pratahSandhya: null
    };
    if (prevSsMs != null) {
      const pnmu = (srMs - prevSsMs) / 15;
      out.pratahSandhya = { start: new Date(srMs - 2 * pnmu), end: new Date(srMs) };
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
    elongation, moonSidereal, yogaSum, ayanamsa, sunSidereal,
    findSunrise, findSunset, findMoonrise, findMoonset, findBoundary, buildSegments,
    moonSign, sunSign, dayPart, computeAbhijit, computeBrahmaMuhurta,
    sunLongitude, moonLongitude,
    _data: { TITHI_NAMES, NAKSHATRA_NAMES, YOGA_NAMES, RASHI_EN }
  };

})(typeof window !== 'undefined' ? window : this);
