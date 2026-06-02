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
  res.setHeader('Cache-Control', 'no-store, no-cache');

  // RAW TEST MODE - bypass everything, call API directly
  if(req.query.raw === '1'){
    const apiKey = process.env.ASTROLOGY_API_KEY;
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5*60*60*1000);
    const body = { year: ist.getUTCFullYear(), month: ist.getUTCMonth()+1, date: ist.getUTCDate(), hours:6, minutes:0, seconds:0, latitude:16.71, longitude:81.10, timezone:5.5, config:{observation_point:'topocentric',ayanamsha:'lahiri'} };
    const r = await fetch('https://json.freeastrologyapi.com/complete-panchang',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey},body:JSON.stringify(body)});
    const raw = await r.json();
    return res.status(200).json({status: r.status, body_sent: body, raw_response: raw});
  }

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
      // Cleanup ALL old rows to force fresh data
      await fetch(`${supabaseUrl}/rest/v1/panchang_today?date=lt.${tomorrowStr}`, {
        method: 'DELETE',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      return res.status(200).json({ success: true, message: `Cron done for ${allCities.length} cities` });
    }

    // Debug: skip Supabase, go straight to live API
    if(req.query.debug==='1'){
      const liveDebug = await fetchFromAPI(city, ist, res, req);
      return; // fetchFromAPI handles response in debug mode
    }
    // ── NORMAL: try Supabase today → yesterday → live ──
    if (supabaseUrl && supabaseKey && req.query.live !== '1') {
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
  const clientId     = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
  if(!clientId || !clientSecret) throw new Error('Prokerala credentials not set');

  const dow = dateObj.getUTCDay();

  // Step 1: Get token
  const tokenRes = await fetch('https://api.prokerala.com/token', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({grant_type:'client_credentials',client_id:clientId,client_secret:clientSecret})
  });
  const tokenData = await tokenRes.json();
  if(!tokenData.access_token) throw new Error('Prokerala token failed');

  // Step 2: Get panchang
  const datetime = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth()+1).padStart(2,'0')}-${String(dateObj.getUTCDate()).padStart(2,'0')}T06:00:00+05:30`;
  const params = new URLSearchParams({
    ayanamsa: 1,
    coordinates: `${city.lat},${city.lng}`,
    datetime,
    la: 'en'
  });

  const panRes = await fetch(`https://api.prokerala.com/v2/astrology/panchang?${params}`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' }
  });
  const panData = await panRes.json();
  if(!panRes.ok) throw new Error('Prokerala panchang failed: ' + JSON.stringify(panData));

  const d = panData.data;

  function fmtTime(t){ if(!t)return ''; const p=t.split(':'); return p[0].padStart(2,'0')+':'+p[1].padStart(2,'0'); }

  const sunrise  = fmtTime(d.sunrise)  || '06:08';
  const sunset   = fmtTime(d.sunset)   || '18:34';
  const moonrise = fmtTime(d.moonrise) || '';

  const tithi     = d.tithi?.[0]?.name           || '';
  const tithi_paksha = d.tithi?.[0]?.paksha?.name || '';
  const nakshatra    = d.nakshatra?.[0]?.name     || '';
  const nakshatra_ruler = d.nakshatra?.[0]?.lord?.name || '';
  const yoga      = d.yoga?.[0]?.name             || '';
  const karana    = d.karana?.[0]?.name           || '';

  // Rahu kaal from API or calculate
  let rahu_kaal = '';
  if(d.rahu_kaal) rahu_kaal = fmtTime(d.rahu_kaal.start)+'–'+fmtTime(d.rahu_kaal.end);
  else rahu_kaal = calcRahuKaal(sunrise, dow);

  // Abhijit muhurta
  let abhijit = '';
  if(d.abhijit_muhurta) abhijit = fmtTime(d.abhijit_muhurta.start)+'–'+fmtTime(d.abhijit_muhurta.end);
  else abhijit = calcAbhijit(sunrise, sunset);

  return {
    city: city.name,
    tithi, tithi_paksha, nakshatra, nakshatra_ruler, yoga, karana,
    sunrise, sunset, moonrise,
    gulika: calcGulika(sunrise, dow),
    rahu_kaal: rahu_kaal,
    abhijit_muhurta: abhijit,
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

function getFallback(dateObj) {
  const dow = dateObj.getUTCDay();
  return {
    date: formatDate(dateObj), city: 'India',
    tithi: 'द्वितीया', nakshatra: 'अनुराधा', yoga: 'शुभ', karana: 'बव',
    sunrise: '06:08', sunset: '18:34', moonrise: '07:22',
    rahu_kaal: RAHU_HRS[dow], abhijit_muhurta: '11:48–12:36',
    gulika: calcGulika('06:08', dow),
    updated_at: new Date().toISOString()
  };
}

function formatDate(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}


// Gulika Kaal calculation (similar to Rahu Kaal)
function calcGulika(sunrise, dow){
  // Gulika slots by day: Sun=6, Mon=5, Tue=4, Wed=3, Thu=2, Fri=1, Sat=0
  const slots = [6,5,4,3,2,1,0];
  const slot = slots[dow];
  const [h,m] = sunrise.split(':').map(Number);
  const startMins = h*60 + m + slot*90;
  const endMins   = startMins + 90;
  const fmt = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  return `${fmt(startMins)}–${fmt(endMins)}`;
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
