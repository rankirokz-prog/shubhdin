// api/generate-scripts.js
// ONE-TIME call to generate 14 day scripts (7 days × 2 versions)
// Stores MP3s in Supabase Storage: audio/scripts/sunday_a.mp3 etc.
// Call manually: GET /api/generate-scripts?secret=YOUR_SECRET
// After this runs once — never call ElevenLabs for scripts again!

// ── 14 SCRIPTS: 7 days × 2 versions ──
// Rules: Hinglish, warm, friendly, no specific times, deity-specific, ~30-40 seconds
const SCRIPTS = {
  sunday_a: `Namaste! Aaj Ravivar hai — Surya Dev ka din. Aaj ki energy kaafi bright aur positive hai. Kuch bhi important kaam karna ho — aaj perfect time hai. Ek choti si salah — subah ki roshni mein thodi der baithein, Surya Dev ko yaad karein. Aaj ka din aapka hai. Shubh din ho.`,

  sunday_b: `Good morning! Aaj Ravivar hai — aur Surya Dev ki kripa aap par bani rahe. Aaj confidence aur clarity feel hogi. Kuch naya start karna ho ya kisi mushkil ka hal dhundhna ho — aaj ka din bahut accha hai. Surya Dev ka naam zaroor lein. Aapka din shubh ho.`,

  monday_a: `Namaste! Aaj Somwar hai — Shiv ji ka din. Aaj ka din thoda reflective aur calm rahega. Badi decisions ke liye accha time hai. Ek choti si salah — aaj Shiv ji ka naam lene se mann mein ek alag si shanti aayegi. Patience rakhiye, aaj din aapke favour mein jayega. Shiv ki kripa aap par bani rahe.`,

  monday_b: `Namaste! Aaj Somwar hai — aur Shiv ji bahut prasann rehte hain is din. Aaj jo bhi kaam karein, dil se karein. Mann mein koi bhi tension ho, Shiv ji ko de dein — woh sab sambhal lete hain. Aaj ka din peaceful aur meaningful rahega. Har Har Mahadev.`,

  tuesday_a: `Namaste! Aaj Mangalvar hai — Hanuman ji ka din. Aaj ki energy kaafi strong aur focused hai. Career ya kisi bhi challenge ke liye aaj bahut powerful din hai. Hanuman ji ka naam lein, mann mein shakti aayegi. Aaj koi bhi mushkil aapko rok nahi sakti. Jai Bajrang Bali.`,

  tuesday_b: `Namaste! Aaj Mangalvar hai — aur Hanuman ji hamesha apne bhakton ki raksha karte hain. Aaj thodi bhi hesitation mat rakhiye — confidence se aage badhiye. Hanuman ji bahut jaldi prasann hote hain, sirf sachchi bhakti chahiye. Aaj ka din aapke liye accha rahega. Jai Hanuman.`,

  wednesday_a: `Namaste! Aaj Budhwar hai — Ganesh ji ka din. Aaj buddhi aur clarity ke liye bahut accha din hai. Koi bhi naya kaam start karna ho ya kisi problem ka creative solution chahiye — aaj perfect time hai. Ganesh ji ko yaad karein, woh raah dikhate hain. Shubh din ho.`,

  wednesday_b: `Namaste! Aaj Budhwar hai — aur Ganesh ji ki kripa se aaj sab kuch smooth chalta hai. Har kaam se pehle unka naam lein. Aaj mentally kaafi sharp feel karenge. Koi bhi baat jo atak rahi thi, aaj clear ho sakti hai. Ganpati Bappa Morya.`,

  thursday_a: `Namaste! Aaj Guruvar hai — Vishnu ji ka din. Aaj thodi dhairya rakhiye — jo bhi karenge, uska fal accha aayega. Kisi bade ka aashirwad lein, knowledge seek karein. Vishnu ji ki kripa se aaj din ka har pal meaningful rahega. Om Namo Narayanaya.`,

  thursday_b: `Namaste! Aaj Guruvar hai — aur is din Vishnu ji ki kripa sabse zyada hoti hai. Aaj kisi bade ka aashirwad zaroor lein. Aaj ka din positivity se bhara hai. Vishnu ji hamesha dekhte hain — sach se jiyein, dil se karein. Shubh din ho.`,

  friday_a: `Namaste! Aaj Shukravar hai — Lakshmi ji ka din. Ghar mein saaf-safai rakhein, woh is din ghar mein aati hain. Aaj ki energy kaafi warm hai — family aur relationships ke liye bahut accha din hai. Lakshmi ji ka naam lein, ghar mein sukh-samridhi aayegi. Shubh din ho.`,

  friday_b: `Namaste! Aaj Shukravar hai — aur Lakshmi ji ki kripa aap par bani rahe. Aaj kuch bhi accha kaam karein — kisi ki help karein, daan dein. Aaj ek diya zaroor jalayein. Lakshmi ji unhi ke ghar aati hain jahan shanti aur prem hota hai. Shubh din ho.`,

  saturday_a: `Namaste! Aaj Shanivar hai — Shani Dev ka din. Aaj jo bhi karein, imaandari se karein. Shani Dev karma ke devta hain, woh sab dekhte hain. Kisi bhi insaan ki madad kar sakein toh zaroor karein — yahi sabse badi pooja hai. Aaj ka din karma shuddhi ka din hai. Shubh din ho.`,

  saturday_b: `Namaste! Aaj Shanivar hai — aur Shani Dev ki kripa unhi par hoti hai jo sachche hote hain. Aaj thoda slow down karein, soch-samajh ke chalen. Hanuman ji ko bhi yaad karein — woh Shani Dev se hamari raksha karte hain. Aaj ka din discipline aur patience ka hai. Shubh din ho.`,
};

export default async function handler(req, res) {
  // Security check — only you can run this
  const secret = req.query.secret;
  if (secret !== process.env.GENERATE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized. Pass ?secret=YOUR_SECRET' });
  }

  const elevenKey   = process.env.ELEVENLABS_API_KEY;
  const voiceId     = process.env.ELEVENLABS_VOICE_ID; // Aishwarya's voice ID
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!elevenKey || !voiceId || !supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing env vars', needs: ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'] });
  }

  const results = [];
  const errors  = [];

  for (const [key, text] of Object.entries(SCRIPTS)) {
    const fileName = `scripts/${key}.mp3`;

    try {
      console.log(`Generating ${key}...`);

      // Call ElevenLabs TTS
      const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',   // Best quality, handles Hinglish well
          voice_settings: {
            stability: 0.5,            // Natural variation
            similarity_boost: 0.85,    // Stay true to voice
            style: 0.3,                // Some warmth/style
            use_speaker_boost: true
          }
        })
      });

      if (!ttsRes.ok) {
        const err = await ttsRes.text();
        throw new Error(`ElevenLabs ${ttsRes.status}: ${err}`);
      }

      // Get audio bytes
      const audioBuffer = await ttsRes.arrayBuffer();
      const audioBytes  = new Uint8Array(audioBuffer);

      // Upload to Supabase Storage bucket: shubhdin-audio
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/shubhdin-audio/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'audio/mpeg',
            'x-upsert': 'true',   // Overwrite if exists
          },
          body: audioBytes
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Supabase upload ${uploadRes.status}: ${err}`);
      }

      // Build public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/shubhdin-audio/${fileName}`;
      results.push({ key, url: publicUrl, chars: text.length });
      console.log(`✅ ${key} done (${text.length} chars)`);

    } catch (err) {
      console.error(`❌ ${key} failed:`, err.message);
      errors.push({ key, error: err.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  return res.status(200).json({
    success: errors.length === 0,
    generated: results.length,
    failed: errors.length,
    results,
    errors,
    totalChars: results.reduce((s, r) => s + r.chars, 0),
  });
}
