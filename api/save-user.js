// api/save-user.js
// Saves/updates an anonymous profile row in Supabase.
//
// B1 · This used to accept any uid with nothing to prove ownership: whoever
// learned a uid could rewrite that person's name, city, date and time of
// birth — a wrong birth record makes a wrong chart with no error anywhere.
// The dashboard has NO Supabase session (its uid is a random local string),
// so the fix is an ownership key per install — see lib/owner-key.js — plus
// a server-side coordinate guard: a city with no coordinates, or with the
// Eluru default coordinates, is refused. Service key; RLS is on for users.
const { checkOwner } = require('../lib/owner-key.js');

const ELURU_LAT = 16.4343, ELURU_LON = 81.6985;   // the forbidden fallback
const near = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-3;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Missing Supabase config' });

  const src = (req.method === 'POST' ? req.body : req.query) || {};
  const { uid, write_key, name, lang, city, city_lat, city_lon, dob, tob,
          rashi, nakshatra, nakshatra_pada, sadhana, streak } = src;
  if (!uid || typeof uid !== 'string' || uid.length > 64) return res.status(400).json({ error: 'uid required' });

  // ── ownership ──
  const own = await checkOwner(supabaseUrl, supabaseKey, uid, write_key);
  if (!own.ok) return res.status(own.status).json({ error: own.error });

  // ── coordinate guard, server side ──
  const hasCity = typeof city === 'string' && city.trim().length > 0;
  const lat = (city_lat === undefined || city_lat === null || city_lat === '') ? null : parseFloat(city_lat);
  const lon = (city_lon === undefined || city_lon === null || city_lon === '') ? null : parseFloat(city_lon);
  if (hasCity) {
    if (lat === null || lon === null || !isFinite(lat) || !isFinite(lon))
      return res.status(400).json({ error: 'city without coordinates', why: 'a chart cast on a defaulted place is wrong without saying so — resolve the city first' });
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return res.status(400).json({ error: 'coordinates out of range' });
    if (near(lat, ELURU_LAT) && near(lon, ELURU_LON) && !/eluru/i.test(city))
      return res.status(400).json({ error: 'default coordinates refused', why: 'Eluru fallback coordinates with a different city name' });
  }

  try {
    const row = {
      uid, name: typeof name === 'string' ? name.slice(0, 120) : name, lang, city: hasCity ? city.slice(0, 120) : city,
      city_lat: lat, city_lon: lon,
      dob: dob || null, tob: tob || null,
      rashi: rashi || null, nakshatra: nakshatra || null, nakshatra_pada: nakshatra_pada || null,
      sadhana: sadhana ? JSON.stringify(sadhana) : null,
      streak: streak || null,
      updated_at: new Date().toISOString()
    };
    if (own.claim) row.write_key = own.claim;      // first write with a key claims the row
    const r = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`,
                 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(row)
    });
    if (!r.ok) return res.status(500).json({ error: await r.text() });
    return res.json({ success: true, claimed: !!own.claim, open: !!own.open });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
