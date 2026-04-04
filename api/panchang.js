// api/panchang.js
// Vercel Serverless Function
// Cron: runs daily at 5 AM IST — stores today + tomorrow (2-day buffer)
// Direct call: GET /api/panchang?city=eluru → returns today's data

const CITIES = {
  delhi:              { lat: 28.6139, lng: 77.2090, tz: 5.5, name: 'Delhi' },
  mumbai:             { lat: 19.0760, lng: 72.8777, tz: 5.5, name: 'Mumbai' },
  hyderabad:          { lat: 17.3850, lng: 78.4867, tz: 5.5, name: 'Hyderabad' },
  bangalore:          { lat: 12.9716, lng: 77.5946, tz: 5.5, name: 'Bangalore' },
  eluru:              { lat: 16.7107, lng: 81.0952, tz: 5.5, name: 'Eluru' },
  vijayawada:         { lat: 16.5062, lng: 80.6480, tz: 5.5, name: 'Vijayawada' },
  visakhapatnam:      { lat: 17.6868, lng: 83.2185, tz: 5.5, name: 'Visakhapatnam' },
  chennai:            { lat: 13.0827, lng: 80.2707, tz: 5.5, name: 'Chennai' },
  kolkata:            { lat: 22.5726, lng: 88.3639, tz: 5.5, name: 'Kolkata' },
  lucknow:            { lat: 26.8467, lng: 80.9462, tz: 5.5, name: 'Lucknow' },
  default:            { lat: 20.5937, lng: 78.9629, tz: 5.5, name: 'India' },
};

// Rahu Kaal slot per weekday (0=Sun...6=Sat)
const RAHU_HRS = [
  '16:30–18:00', // Sun - 8th slot
  '07:30–09:00', // Mon - 2nd slot
  '15:00–16:30', // Tue - 7th slot
  '12:00–13:30', // Wed - 5th slot
  '13:30–15:00', // Thu - 6th slot
  '10:30–12:00', // Fri - 4th slot
  '09:00–10:30', // Sat - 3rd slot
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const cityKey = (req.query.city || 'default').toLowerCase().replace(/\s+/g, '');
  const city    = CITIES[cityKey] || CITIES.default;
  const isCron  = req.headers['x-vercel-cron'] === '1' || req.query.cron === '1';

  try {
    // ── Get today's date in IST ──
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const todayStr    = formatDate(ist);
    const tomorrowStr = formatDate(new Date(ist.getTime() + 86400000));

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    // ── If cron job: fetch + store both today AND tomorrow ──
    if (isCron && supabaseUrl && supabaseKey) {
      const allCities = Object.keys(CITIES).filter(k => k !== 'default');
      const results = [];

      for (const ck of allCities) {
        const c = CITIES[ck];
        // Fetch today
        const todayData = await fetchFromAPI(c, ist);
        await storeInSupabase(ck, todayStr, todayData, supabaseUrl, supabaseKey);
        // Fetch tomorrow
        const tmrw = new Date(ist.getTime() + 86400000);
        const tmrwData = await fetchFromAPI(c, tmrw);
        await storeInSupabase(ck, tomorrowStr, tmrwData, supabaseUrl, supabaseKey);
        results.push(ck);
      }

      // ── Clean up rows older than 2 days ──
      const twoDaysAgo = formatDate(new Date(ist.getTime() - 2 * 86400000));
      await fetch(`${supabaseUrl}/rest/v1/panchang_today?date=lt.${twoDaysAgo}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      return res.status(200).json({
        success: true,
        message: `Stored ${results.length} cities × 2 days. Cleaned up rows before ${twoDaysAgo}`,
        cities: results,
      });
    }

    // ── Normal request: try to read from Supabase first ──
    if (supabaseUrl && supabaseKey) {
      // Try today first, then yesterday as fallback
      for (const dateStr of [todayStr, formatDate(new Date(ist.getTime() - 86400000))]) {
        const dbRes = await fetch(
          `${supabaseUrl}/rest/v1/panchang_today?city_key=eq.${cityKey}&date=eq.${dateStr}&select=*`,
          { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
        );
        const rows = await dbRes.json();
        if (rows && rows.length > 0) {
          return res.status(200).json({ success: true, source: 'supabase', date: dateStr, data: rows[0] });
        }
      }
    }

    // ── No Supabase data — fetch live from API ──
    const liveData = await fetchFromAPI(city, ist);

    // Store it too (single city)
    if (supabaseUrl && supabaseKey) {
      await storeInSupabase(cityKey, todayStr, liveData, supabaseUrl, supabaseKey);
    }

    return res.status(200).json({ success: true, source: 'live', date: todayStr, data: liveData });

  } catch (err) {
    console.error('Panchang error:', err.message);
    // ALWAYS return something — app never breaks
    const now = new Date();
    const dow = new Date(now.getTime() + 5.5*60*60*1000).getUTCDay();
    return res.status(200).json({
      success: false,
      source: 'fallback',
      data: {
        date: formatDate(new Date(now.getTime() + 5.5*60*60*1000)),
        city: city.name,
        tithi: 'द्वितीया',
        nakshatra: 'अनुराधा',
        yoga: 'शुभ',
        karana: 'बव',
        sunrise: '06:08',
        sunset: '18:34',
        rahu_kaal: RAHU_HRS[dow],
        abhijit_muhurta: '11:48–12:36',
        updated_at: now.toISOString()
      }
    });
  }
}

// ── Fetch from Free Astrology API ──
async function fetchFromAPI(city, dateObj) {
  const apiKey = process.env.ASTROLOGY_API_KEY;
  if (!apiKey) throw new Error('No API key');

  const year  = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth() + 1;
  const day   = dateObj.getUTCDate();
  const dow   = dateObj.getUTCDay();

  const body = {
    year, month, day,
    hours: 6, minutes: 0, seconds: 0,
    latitude: city.lat,
    longitude: city.lng,
    timezone: city.tz,
    settings: { observation_point: 'topocentric', ayanamsha: 'lahiri' }
  };

  const apiRes = await fetch('https://json.freeastrologyapi.com/complete-panchang', {
    method: 'POST',
    headers: { 
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`
},
    body: JSON.stringify(body)
  });

  if (!apiRes.ok) throw new Error(`API ${apiRes.status}`);
  const raw = await apiRes.json();

  const tithi     = raw.tithi?.name || 'द्वितीया';
  const nakshatra = raw.nakshatra?.name || 'अनुराधा';
  const yoga      = raw.yoga?.[1]?.name || raw.yoga?.[0]?.name || 'शुभ';
  const karana    = raw.karana?.[2]?.name || raw.karana?.[1]?.name || 'बव';
  const sunrise   = raw.sun_rise || '06:08';
  const sunset    = raw.sun_set  || '18:34';

  const rahu_kaal        = calcRahuKaal(sunrise, dow);
  const abhijit_muhurta  = calcAbhijit(sunrise, sunset);

  return {
    city: city.name,
    tithi, nakshatra, yoga, karana,
    sunrise, sunset,
    rahu_kaal, abhijit_muhurta,
    updated_at: new Date().toISOString()
  };
}

// ── Store in Supabase ──
async function storeInSupabase(cityKey, date, data, url, key) {
  return fetch(`${url}/rest/v1/panchang_today`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ city_key: cityKey, date, ...data })
  });
}

// ── Helpers ──
function formatDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const day = String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function calcRahuKaal(sunrise, dow) {
  try {
    const [h, m] = sunrise.split(':').map(Number);
    const base = h * 60 + m;
    const slots = [7, 1, 6, 4, 5, 3, 2]; // per weekday
    const start = base + slots[dow] * 90;
    const end   = start + 90;
    return `${fmt(start)}–${fmt(end)}`;
  } catch(e) { return RAHU_HRS[dow]; }
}

function calcAbhijit(sunrise, sunset) {
  try {
    const toM = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
    const mid = (toM(sunrise) + toM(sunset)) / 2;
    return `${fmt(mid-24)}–${fmt(mid+24)}`;
  } catch(e) { return '11:48–12:36'; }
}

function fmt(mins) {
  const h = Math.floor(mins/60)%24;
  const m = Math.round(mins%60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
