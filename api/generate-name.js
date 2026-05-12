const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const voiceId    = process.env.ELEVENLABS_VOICE_ID;
  const apiKey     = process.env.ELEVENLABS_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  // Debug: log what env vars are present (not values)
  console.log('ENV CHECK:', {
    hasVoiceId: !!voiceId,
    hasApiKey: !!apiKey,
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
  });

  if (!voiceId) return res.status(500).json({ error: 'Missing ELEVENLABS_VOICE_ID' });
  if (!apiKey)  return res.status(500).json({ error: 'Missing ELEVENLABS_API_KEY' });
  if (!supabaseUrl) return res.status(500).json({ error: 'Missing SUPABASE_URL' });
  if (!supabaseKey) return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_KEY' });

  try {
    // 1. Generate audio from ElevenLabs
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
      console.error('ElevenLabs error:', errText);
      return res.status(500).json({ error: 'ElevenLabs: ' + errText });
    }

    const arrayBuf = await ttsRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // 2. Upload to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    const fileName = name.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]/gi, '_') + '.mp3';

    const { error: uploadError } = await supabase.storage
      .from('shubhdin-audio')
      .upload(`names/${fileName}`, buffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Supabase: ' + uploadError.message });
    }

    return res.json({ success: true, file: `names/${fileName}` });

  } catch (e) {
    console.error('Unexpected error:', e);
    return res.status(500).json({ error: e.message });
  }
};
