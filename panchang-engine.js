/* ============================================================
   SHUBH DIN — Offline Panchang Engine
   Phase 1: The Five Limbs (Tithi, Nakshatra, Yoga, Karana, Vara)
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
    'प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी',
    'अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा',
    'प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी',
    'अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','अमावस्या'
  ];

  const NAKSHATRA_NAMES = [
    'Ashvini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya',
    'Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha',
    'Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta',
    'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
  ];
  const NAKSHATRA_HI = [
    'अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य',
    'आश्लेषा','मघा','पूर्व फाल्गुनी','उत्तर फाल्गुनी','हस्त','चित्रा','स्वाति','विशाखा',
    'अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा',
    'शतभिषा','पूर्व भाद्रपद','उत्तर भाद्रपद','रेवती'
  ];
  // Nakshatra lords (Vimshottari sequence)
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
    'विष्कम्भ','प्रीति','आयुष्मान','सौभाग्य','शोभन','अतिगण्ड','सुकर्मा','धृति',
    'शूल','गण्ड','वृद्धि','ध्रुव','व्याघात','हर्षण','वज्र','सिद्धि','व्यतीपात',
    'वरीयान','परिघ','शिव','सिद्ध','साध्य','शुभ','शुक्ल','ब्रह्म','इन्द्र','वैधृति'
  ];

  // Karana: 7 movable (chara) + 4 fixed (sthira)
  const KARANA_MOVABLE = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'];
  const KARANA_MOVABLE_HI = ['बव','बालव','कौलव','तैतिल','गर','वणिज','विष्टि'];
  // returns {en, hi} for a karana half-tithi index 0..59
  function karanaName(k) {
    // k = floor(elongation / 6), range 0..59 within a lunar month
    if (k === 0) return { en: 'Kimstughna', hi: 'किंस्तुघ्न' };
    if (k >= 1 && k <= 56) {
      const idx = (k - 1) % 7;
      return { en: KARANA_MOVABLE[idx], hi: KARANA_MOVABLE_HI[idx] };
    }
    if (k === 57) return { en: 'Shakuni', hi: 'शकुनि' };
    if (k === 58) return { en: 'Chatushpada', hi: 'चतुष्पाद' };
    return { en: 'Naga', hi: 'नाग' }; // k === 59
  }

  const VARA_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const VARA_HI = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

  // ---- Core astronomical helpers ----------------------------------------
  // Sun's geocentric true-of-date ecliptic longitude (tropical), degrees
  function sunLongitude(date) {
    const v = A.GeoVector(A.Body.Sun, date, true);
    return A.Ecliptic(v).elon;
  }
  // Moon's geocentric ecliptic longitude (tropical), degrees
  function moonLongitude(date) {
    return A.EclipticGeoMoon(date).lon;
  }
  // Elongation (Moon - Sun) normalised 0..360 — drives Tithi & Karana
  function elongation(date) {
    let d = (moonLongitude(date) - sunLongitude(date)) % 360;
    if (d < 0) d += 360;
    return d;
  }

  // Lahiri (Chitrapaksha) ayanamsa, anchored to verified 2026.0 value
  // 24°07'47" = 24.12972° at 2026.0, precession ~50.2388"/yr
  function ayanamsa(date) {
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const yearFrac = 2000.0 + (jd - 2451545.0) / 365.25;
    return 24.12972 + (yearFrac - 2026.0) * (50.2388 / 3600);
  }

  // ---- Sunrise (the conventional reference instant for panchang) --------
  function findSunrise(date, lat, lng) {
    const obs = new A.Observer(lat, lng, 0);
    // Search starting from local midnight (approx via UTC day start minus tz)
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const sr = A.SearchRiseSet(A.Body.Sun, obs, +1, dayStart, 1);
    return sr ? sr.date : null;
  }

  // ---- The Five Limbs at a given instant --------------------------------
  function limbsAt(date) {
    const sunL = sunLongitude(date);
    const moonL = moonLongitude(date);
    const ay = ayanamsa(date);

    // Tithi (ayanamsa cancels — uses tropical difference)
    let elong = (moonL - sunL) % 360; if (elong < 0) elong += 360;
    const tithiIdx = Math.floor(elong / 12);              // 0..29
    const paksha = tithiIdx < 15 ? 'Shukla' : 'Krishna';

    // Nakshatra (needs sidereal Moon)
    let moonSid = (moonL - ay) % 360; if (moonSid < 0) moonSid += 360;
    const nakIdx = Math.floor(moonSid / (360 / 27));      // 0..26
    const nakPada = Math.floor((moonSid % (360 / 27)) / ((360 / 27) / 4)) + 1; // 1..4

    // Yoga (sidereal Sun + sidereal Moon)
    let sunSid = (sunL - ay) % 360; if (sunSid < 0) sunSid += 360;
    let yogaSum = (sunSid + moonSid) % 360;
    const yogaIdx = Math.floor(yogaSum / (360 / 27));     // 0..26

    // Karana (half-tithi)
    const karanaIdx = Math.floor(elong / 6);              // 0..59
    const kar = karanaName(karanaIdx);

    return {
      elongation: elong,
      tithi: { index: tithiIdx, en: TITHI_NAMES[tithiIdx], hi: TITHI_HI[tithiIdx], paksha },
      nakshatra: { index: nakIdx, en: NAKSHATRA_NAMES[nakIdx], hi: NAKSHATRA_HI[nakIdx], lord: NAK_LORDS[nakIdx], pada: nakPada },
      yoga: { index: yogaIdx, en: YOGA_NAMES[yogaIdx], hi: YOGA_HI[yogaIdx] },
      karana: { index: karanaIdx, en: kar.en, hi: kar.hi },
      _debug: { sunL, moonL, ayanamsa: ay, moonSid, sunSid }
    };
  }

  // ---- Public: full Phase-1 panchang for a date+place -------------------
  // date: JS Date (any time on the target calendar day, UTC-safe)
  // lat, lng: observer location in degrees
  function getPanchang(date, lat, lng) {
    const sunrise = findSunrise(date, lat, lng);
    const refInstant = sunrise || date; // panchang stated at sunrise
    const limbs = limbsAt(refInstant);
    const dow = refInstant.getDay(); // weekday at sunrise (local to runtime tz)

    return {
      date: date,
      sunrise: sunrise,
      vara: { index: dow, en: VARA_EN[dow], hi: VARA_HI[dow] },
      tithi: limbs.tithi,
      nakshatra: limbs.nakshatra,
      yoga: limbs.yoga,
      karana: limbs.karana,
      _debug: limbs._debug
    };
  }

  // Expose
  global.PanchangEngine = {
    getPanchang,
    limbsAt,
    elongation,
    ayanamsa,
    findSunrise,
    sunLongitude,
    moonLongitude,
    _data: { TITHI_NAMES, NAKSHATRA_NAMES, YOGA_NAMES }
  };

})(typeof window !== 'undefined' ? window : this);
