// api/generate-name.js — NO external dependencies, uses raw fetch only

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const voiceId     = process.env.ELEVENLABS_VOICE_ID;
  const apiKey      = process.env.ELEVENLABS_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!voiceId)     return res.status(500).json({ error: 'Missing ELEVENLABS_VOICE_ID' });
  if (!apiKey)      return res.status(500).json({ error: 'Missing ELEVENLABS_API_KEY' });
  if (!supabaseUrl) return res.status(500).json({ error: 'Missing SUPABASE_URL' });
  if (!supabaseKey) return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_KEY' });

  try {
    // 1. Generate audio from ElevenLabs (Samisha)
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${name} जी`,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.65, similarity_boost: 0.75 },
        }),
      }
    );

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      return res.status(500).json({ error: 'ElevenLabs: ' + errText });
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    // 2. Upload to Supabase Storage using raw REST API (no SDK needed)
    const fileName = name.toLowerCase().replace(/[^a-z0-9]/gi, '_') + '.mp3';
    const uploadUrl = `${supabaseUrl}/storage/v1/object/shubhdin-audio/names/${fileName}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'audio/mpeg',
        'x-upsert': 'true',
      },
      body: audioBuffer,
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      return res.status(500).json({ error: 'Supabase upload: ' + uploadErr });
    }

    return res.json({ success: true, file: `names/${fileName}` });

  } catch (e) {
    console.error('generate-name error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
