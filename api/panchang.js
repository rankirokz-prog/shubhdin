// api/panchang.js — Vercel Serverless Function
// Fixed: body uses "date" (not "day") and "config" (not "settings")

const CITIES = {
  delhi:         { lat: 28.6139, lng: 77.2090, tz: 5.5, name: 'Delhi' },
  mumbai:        { lat: 19.0760, lng: 72.8777, tz: 5.5, name: 'Mumbai' },
  hyderabad:     { lat: 17.3850, lng: 78.4867, tz: 5.5, name: 'Hyderabad' },
  bangalore:     { lat: 12.9716, lng: 77.5946, tz: 5.5, name: 'Bangalore' },
  eluru:         { lat: 16.7107, lng: 81.0952, tz: 5.5, name: 'Eluru' },
  vijayawada:    { lat: 16.5062, lng: 80.6480, tz: 5.5, name: 'Vijayawada' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, tz: 5.5, name: 'Visakhapatnam' },
  chennai:       { lat: 13.0827, lng: 80.2707, tz: 5.5, name: 'Chennai' },
  kolkata:       { lat: 22.5726, lng: 88.3639, tz: 5.5, name: 'Kolkata' },
  lucknow:       { lat: 26.8467, lng: 80.9462, tz: 5.5, name: 'Lucknow' },
  default:       { lat: 20.5937, lng: 78.9629, tz: 5.5, name: 'India' },
};

const RAHU_HRS = [
  '16:30–18:00', '07:30–09:00', '15:00–16:30', '12:00–13:30',
  '13:30–15:00', '10:30–12:00', '09:00–10:30',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const cityKey = (req.query.city || 'default').toLowerCase().replace(/\s+/g, '');
  const city    = CITIES[cityKey] || CITIES.default;
  const isCron  = req.headers['x-vercel-cron'] === '1' || req.query.cron === '1';

  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const todayStr     = formatDate(ist);
  const tomorrowStr  = formatDate(new Date(ist.getTime() + 86400000));
  const yesterdayStr = formatDate(new Date(ist.getTime() - 86400000));

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  try {
    // ── CRON: store today + tomorrow for all cities ──
    if (isCron && supabaseUrl && supabaseKey) {
      const allCities = Object.keys(CITIES).filter(k => k !== 'default');
      for (const ck of allCities) {
        const c = CITIES[ck];
        try {
          const d1 = await fetchFromAPI(c, ist);
          await storeInSupabase(ck, todayStr, d1, supabaseUrl, supabaseKey);
        } catch(e) { console.error(`City ${ck} today failed:`, e.message); }
        try {
          const tmrw = new Date(ist.getTime() + 86400000);
          const d2 = await fetchFromAPI(c, tmrw);
          await storeInSupabase(ck, tomorrowStr, d2, supabaseUrl, supabaseKey);
        } catch(e) { console.error(`City ${ck} tomorrow failed:`, e.message); }
      }
      // Cleanup old rows
      await fetch(`${supabaseUrl}/rest/v1/panchang_today?date=lt.${yesterdayStr}`, {
        method: 'DELETE',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      return res.status(200).json({ success: true, message: `Cron done for ${allCities.length} cities` });
    }

    // ── NORMAL: try Supabase today → yesterday → live ──
    if (supabaseUrl && supabaseKey) {
      for (const dateStr of [todayStr, yesterdayStr]) {
        try {
          const dbRes = await fetch(
            `${supabaseUrl}/rest/v1/panchang_today?city_key=eq.${cityKey}&date=eq.${dateStr}&select=*`,
            { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
          );
          const rows = await dbRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return res.status(200).json({ success: true, source: 'supabase', data: rows[0] });
          }
        } catch(e) { console.error('Supabase read error:', e.message); }
      }
    }

    // ── Live API fetch ──
    const liveData = await fetchFromAPI(city, ist);
    if (supabaseUrl && supabaseKey) {
      await storeInSupabase(cityKey, todayStr, liveData, supabaseUrl, supabaseKey);
    }
    return res.status(200).json({ success: true, source: 'live', data: { date: todayStr, ...liveData } });

  } catch (err) {
    console.error('Panchang final error:', err.message);
    return res.status(200).json({ success: false, source: 'fallback', data: getFallback(ist) });
  }
}

// ── Fetch panchang from API ──
// FIXED: field names are "date" and "config" per official API docs
async function fetchFromAPI(city, dateObj) {
  const apiKey = process.env.ASTROLOGY_API_KEY;
  if (!apiKey) throw new Error('ASTROLOGY_API_KEY not set in Vercel env vars');

  const year  = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth() + 1;
  const date  = dateObj.getUTCDate();   // ← "date" not "day"
  const dow   = dateObj.getUTCDay();

  // EXACTLY matching freeastrologyapi.com official docs format
  const body = {
    year,
    month,
    date,                                // ← correct field name
    hours: 6,
    minutes: 0,
    seconds: 0,
    latitude: city.lat,
    longitude: city.lng,
    timezone: city.tz,
    config: {                            // ← "config" not "settings"
      observation_point: 'topocentric',
      ayanamsha: 'lahiri'
    }
  };

  console.log('Calling API for:', city.name, year, month, date);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const apiRes = await fetch('https://json.freeastrologyapi.com/complete-panchang', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`API returned ${apiRes.status}: ${errText}`);
    }

    const raw = await apiRes.json();
    console.log('API success, tithi:', raw.tithi?.name);

    const tithi     = raw.tithi?.name     || 'द्वितीया';
    const nakshatra = raw.nakshatra?.name || 'अनुराधा';
    const yoga      = raw.yoga?.[1]?.name || raw.yoga?.[0]?.name || 'शुभ';
    const karana    = raw.karana?.[2]?.name || raw.karana?.[1]?.name || 'बव';
    const sunrise   = raw.sun_rise        || '06:08';
    const sunset    = raw.sun_set         || '18:34';

    return {
      city: city.name,
      tithi, nakshatra, yoga, karana,
      sunrise, sunset,
      rahu_kaal:       calcRahuKaal(sunrise, dow),
      abhijit_muhurta: calcAbhijit(sunrise, sunset),
      updated_at: new Date().toISOString()
    };
  } finally {
    clearTimeout(timeout);
  }
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

function getFallback(dateObj) {
  const dow = dateObj.getUTCDay();
  return {
    date: formatDate(dateObj), city: 'India',
    tithi: 'द्वितीया', nakshatra: 'अनुराधा', yoga: 'शुभ', karana: 'बव',
    sunrise: '06:08', sunset: '18:34',
    rahu_kaal: RAHU_HRS[dow], abhijit_muhurta: '11:48–12:36',
    updated_at: new Date().toISOString()
  };
}

function formatDate(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

function calcRahuKaal(sunrise, dow) {
  try {
    const [h, m] = sunrise.split(':').map(Number);
    const base = h * 60 + m;
    const slots = [7, 1, 6, 4, 5, 3, 2];
    const start = base + slots[dow] * 90;
    return `${fmt(start)}–${fmt(start + 90)}`;
  } catch(e) { return RAHU_HRS[dow]; }
}

function calcAbhijit(sunrise, sunset) {
  try {
    const toM = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    const mid = (toM(sunrise) + toM(sunset)) / 2;
    return `${fmt(mid-24)}–${fmt(mid+24)}`;
  } catch(e) { return '11:48–12:36'; }
}

function fmt(mins) {
  const h = Math.floor(mins/60) % 24;
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
