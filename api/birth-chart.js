// api/birth-chart.js
// Calls Prokerala API to get personal birth chart data
// Called ONCE at registration — result stored in localStorage

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { dob, tob, lat, lon } = req.query;

  if (!dob || !tob || !lat || !lon) {
    return res.status(400).json({ error: 'dob, tob, lat, lon required' });
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

    // Use exact coordinates from frontend
    const datetime = `${dob}T${tob}:00+05:30`;

    // Step 2: Get birth details (Nakshatra, Rashi, Lagna)
    const birthRes = await fetch(
      `https://api.prokerala.com/v2/astrology/birth-details?` +
      new URLSearchParams({
        ayanamsa:    1,
        coordinates: `${lat},${lon}`,
        datetime:    datetime,
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
