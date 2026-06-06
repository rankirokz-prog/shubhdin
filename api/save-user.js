// api/save-user.js
// Saves/updates user profile in Supabase anonymously (no login needed)
// Called on registration and settings change

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if(!supabaseUrl || !supabaseKey)
    return res.status(500).json({ error: 'Missing Supabase config' });

  const { uid, name, lang, city, city_lat, city_lon, dob, tob,
          rashi, nakshatra, nakshatra_pada, sadhana, streak } = req.body || req.query;

  if(!uid) return res.status(400).json({ error: 'uid required' });

  try {
    const row = {
      uid, name, lang, city,
      city_lat: city_lat ? parseFloat(city_lat) : null,
      city_lon: city_lon ? parseFloat(city_lon) : null,
      dob: dob || null,
      tob: tob || null,
      rashi: rashi || null,
      nakshatra: nakshatra || null,
      nakshatra_pada: nakshatra_pada || null,
      sadhana: sadhana ? JSON.stringify(sadhana) : null,
      streak: streak || null,
      updated_at: new Date().toISOString()
    };

    const r = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(row)
    });

    if(!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err });
    }

    return res.json({ success: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
