import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const apiKey  = process.env.ELEVENLABS_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!voiceId || !apiKey) {
    return res.status(500).json({ error: 'Missing ElevenLabs env vars' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase env vars' });
  }

  try {
    // 1. Generate audio from ElevenLabs Samisha
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
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true
          },
        }),
      }
    );

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      return res.status(500).json({ error: 'ElevenLabs error: ' + err });
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    // 2. Upload to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    const fileName = name.toLowerCase().replace(/[^a-z0-9]/gi, '_') + '.mp3';

    const { error } = await supabase.storage
      .from('shubhdin-audio')
      .upload(`names/${fileName}`, Buffer.from(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) return res.status(500).json({ error: 'Supabase: ' + error.message });

    res.json({ success: true, file: `names/${fileName}` });

  } catch (e) {
    console.error('generate-name error:', e);
    res.status(500).json({ error: e.message });
  }
}
