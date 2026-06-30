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
  function findSunrise(date, lat, lng) {
    const obs = new A.Observer(lat, lng, 0);
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const sr = A.SearchRiseSet(A.Body.Sun, obs, +1, dayStart, 1);
    return sr ? sr.date : null;
  }
  function findSunset(date, lat, lng) {
    const obs = new A.Observer(lat, lng, 0);
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const ss = A.SearchRiseSet(A.Body.Sun, obs, -1, dayStart, 1);
    return ss ? ss.date : null;
  }

  // ---- Moonrise / Moonset (Phase 4) -------------------------------------
  // Search from IST midnight of the target day, 24h forward.
  // tzOffsetHours = local timezone offset from UTC (default +5.5 for IST)
  function findMoonrise(date, lat, lng, tzOffsetHours) {
    const tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    const obs = new A.Observer(lat, lng, 0);
    // local midnight in UTC = day 00:00 local - tz
    const localMidUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0) - tz * 3600000);
    const mr = A.SearchRiseSet(A.Body.Moon, obs, +1, localMidUTC, 1);
    return mr ? mr.date : null;
  }
  function findMoonset(date, lat, lng, tzOffsetHours) {
    const tz = (tzOffsetHours == null) ? 5.5 : tzOffsetHours;
    const obs = new A.Observer(lat, lng, 0);
    const localMidUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0) - tz * 3600000);
    const ms = A.SearchRiseSet(A.Body.Moon, obs, -1, localMidUTC, 1);
    return ms ? ms.date : null;
  }

  // ---- Sidereal sign helpers (Phase 4) ----------------------------------
  function sunSidereal(date) { let s = (sunLongitude(date) - ayanamsa(date)) % 360; if (s < 0) s += 360; return s; }
  function moonSign(date) { return Math.floor(moonSidereal(date) / 30); }   // 0..11
  function sunSign(date) { return Math.floor(sunSidereal(date) / 30); }     // 0..11

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
    const sunrise = findSunrise(date, lat, lng);
    const sunset = findSunset(date, lat, lng);
    const moonrise = findMoonrise(date, lat, lng, tzOffsetHours);
    const moonset = findMoonset(date, lat, lng, tzOffsetHours);
    const nextDate = new Date(date.getTime() + 24 * 3600 * 1000);
    const nextSunrise = findSunrise(nextDate, lat, lng) || new Date((sunrise || date).getTime() + 24 * 3600 * 1000);

    const refInstant = sunrise || date;
    const srMs = refInstant.getTime();
    const nextSrMs = nextSunrise.getTime();
    const dow = refInstant.getDay();

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
      sunSign: { index: sSign, en: RASHI_EN[sSign], hi: RASHI_HI[sSign] }
    };
  }

  global.PanchangEngine = {
    getPanchang,
    elongation, moonSidereal, yogaSum, ayanamsa, sunSidereal,
    findSunrise, findSunset, findMoonrise, findMoonset, findBoundary, buildSegments,
    moonSign, sunSign,
    sunLongitude, moonLongitude,
    _data: { TITHI_NAMES, NAKSHATRA_NAMES, YOGA_NAMES, RASHI_EN }
  };

})(typeof window !== 'undefined' ? window : this);
