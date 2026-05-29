// api/birth-chart.js
// Calls Prokerala API to get personal birth chart data
// Called ONCE at registration — result stored in localStorage

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { dob, tob, city } = req.query;

  if (!dob || !tob) {
    return res.status(400).json({ error: 'dob and tob required' });
  }

  const clientId     = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Missing Prokerala credentials' });
  }

  try {
    // Step 1: Get access token
    const tokenRes = await fetch('https://api.prokerala.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Token failed', detail: tokenData });
    }

    const token = tokenData.access_token;

    // City coordinates map (same cities as panchang)
    const CITY_COORDS = {
      delhi:          { lat: 28.6139, lon: 77.2090 },
      mumbai:         { lat: 19.0760, lon: 72.8777 },
      hyderabad:      { lat: 17.3850, lon: 78.4867 },
      bangalore:      { lat: 12.9716, lon: 77.5946 },
      eluru:          { lat: 16.7107, lon: 81.0952 },
      vijayawada:     { lat: 16.5062, lon: 80.6480 },
      visakhapatnam:  { lat: 17.6868, lon: 83.2185 },
      chennai:        { lat: 13.0827, lon: 80.2707 },
      kolkata:        { lat: 22.5726, lon: 88.3639 },
      lucknow:        { lat: 26.8467, lon: 80.9462 },
    };

    const coords = CITY_COORDS[(city||'delhi').toLowerCase()] || CITY_COORDS.delhi;

    // Format datetime: YYYY-MM-DDTHH:MM:SS+05:30
    const datetime = `${dob}T${tob}:00+05:30`;

    // Step 2: Get birth details (Nakshatra, Rashi, Lagna)
    const birthRes = await fetch(
      `https://api.prokerala.com/v2/astrology/birth-details?` +
      new URLSearchParams({
        ayanamsa:  1,  // Lahiri (standard for Vedic)
        coordinates: `${coords.lat},${coords.lon}`,
        datetime:  datetime,
      }),
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    const birthData = await birthRes.json();

    if (!birthRes.ok) {
      return res.status(500).json({ error: 'Prokerala error', detail: birthData });
    }

    const d = birthData.data;

    return res.json({
      success: true,
      nakshatra:      d.nakshatra?.name       || '',
      nakshatra_pada: d.nakshatra?.pada        || '',
      rashi:          d.rashi?.name            || '',
      lagna:          d.ascendant?.name        || '',
      birth_chart:    d,
    });

  } catch (e) {
    console.error('birth-chart error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
