import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const voiceId = process.env.ELEVENLABS_VOICE_ID; // Samisha voice ID
  const apiKey  = process.env.ELEVENLABS_API_KEY;

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
          voice_settings: { stability: 0.65, similarity_boost: 0.75, style: 0 },
        }),
      }
    );

    if (!ttsRes.ok) throw new Error('ElevenLabs error: ' + ttsRes.status);
    const audioBuffer = await ttsRes.arrayBuffer();

    // 2. Upload to Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}.mp3`;
    const { error } = await supabase.storage
      .from('shubhdin-audio')
      .upload(`names/${fileName}`, Buffer.from(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) throw error;

    res.json({ success: true, file: `names/${fileName}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
