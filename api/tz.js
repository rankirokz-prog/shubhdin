// api/tz.js — lat/lon → IANA time zone, resolved ONCE at city-pick time.
// GET /api/tz?lat=51.5074&lon=-0.1278  →  { tz: "Europe/London" }
// tz-lookup is offline (no key, no quota, ~1.3 MB of polygons) and lives here so
// none of that weight reaches the phone. If the lookup fails the answer is an
// error, never a default: a city with coordinates and no zone must block the
// same way a failed geocode does (coordinate-guard rule).
const tzlookup = require('tz-lookup');
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');   // zones don't move
  const lat = parseFloat(req.query.lat), lon = parseFloat(req.query.lon);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return res.status(400).json({ error: 'lat/lon required' });
  try {
    const tz = tzlookup(lat, lon);
    if (!tz) return res.status(404).json({ error: 'no zone for these coordinates' });
    return res.status(200).json({ tz });
  } catch (e) { return res.status(500).json({ error: 'zone lookup failed' }); }
};
