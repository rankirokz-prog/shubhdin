// api/generate-problems.js
// ONE-TIME call — generates 6 audio files:
// 5 problem guidance audios + 1 Power of Chant story
// Call: GET /api/generate-problems?secret=YOUR_SECRET

const AUDIO_FILES = {

  // ── POWER OF CHANT STORY ──
  power_of_chant: {
    folder: 'stories',
    text: `Ek sach hai jo bahut log nahi jaante.

June 2025 mein, Ahmedabad se London ja raha ek plane crash ho gaya. 242 log the. 241 ki mrityu ho gayi. Sirf ek bacha — Vishwash Kumar Ramesh. Woh bola: "Yeh miracle hai. Main explain nahi kar sakta."

Vigyan iske liye koi jawab nahi de sakta.

Lekin Hindustan ke rishiyon ne hazaron saal pehle kaha tha — Naad Brahma. Yani sound hi Ishwar hai. Jab hum mantra jaap karte hain, woh sirf words nahi hote — woh ek shakti hai jo hamari aatma ko protect karti hai.

Dr. Masaru Emoto ne paani par experiments kiye. Jab "OM" bola, paani ke crystals sundar ho gaye. Yeh science hai.

Toh aaj jab aap jaap karte hain — aap sirf pooja nahi karte. Aap ek aisi shakti ko activate karte hain jo centuries se proven hai.

Shiv hi satya hain. Unka naam lo — aur dekho kya hota hai.`
  },

  // ── VIVAH (MARRIAGE) ──
  vivah: {
    folder: 'problems',
    text: `Vivah ke liye sabse powerful upay hai Shiv-Parvati ki aradhana.

Somwar ka din Shiv ji ka hota hai. Is din subah snan karke Shiv ji ko jal chadhayen — sirf ek lota, ek bilva patra. Bas itna.

"Om Uma Maheshwaraya Namah" — yeh mantra roz 108 baar jayap karein. Kuch hi hafton mein mann mein ek shanti aayegi.

16 Somwar ka vrat bahut powerful hota hai. Sahgol mein kisi ne bhi yeh vrat poori shradha se kiya — Parvati ji ne unki sunni.

Ek baat yaad rakhein — Shiv ji sirf sacchi bhakti dekhte hain, rishte ya paise nahi. Dil mein prem rakho, mann mein vishwaas rakho.

Jab waqt aayega, sab apne aap ho jaayega.`
  },

  // ── DHAN / CAREER (MONEY) ──
  dhan: {
    folder: 'problems',
    text: `Dhan aur career ke liye Lakshmi ji ki kripa sabse zaroori hai.

Shukravar Lakshmi ji ka din hai. Is din ghar saaf rakho — woh saaf ghar mein aati hain, yeh Puranon mein likha hai.

"Om Shreem Mahalakshmyai Namah" — roz subah uthke 108 baar. Ek diya zaroor jalayein — shaam ko.

Ek aur upay jo bahut kaam karta hai — kisi zarooratmand ki madad karo. Chahe ek roti ho, chahe thoda paisa. Lakshmi ji unhi par meharbaan hoti hain jo dusron mein unhe dekhte hain.

Career mein agar rukavat hai — Budhwar ko Ganesh ji ka naam lo. Woh Vighnharta hain — raste ki har rukavat hatate hain.

Mehnat karo, bhakti rakho. Phir koi taaqat nahi jo roke.`
  },

  // ── SWASTHYA (HEALTH) ──
  swasthya: {
    folder: 'problems',
    text: `Swasthya ke liye Surya Dev aur Hanuman ji — yeh do deities sabse zyada kaam karte hain.

Roz subah — uthke baad, khule aasman mein jao. Uthte hue sooraj ko dekhkar "Om Suryaya Namah" — 108 baar.

Yeh sirf pooja nahi hai. Subah ki roshni mein Vitamin D hoti hai, fresh air hoti hai — yeh body ke liye sabse badi dava hai.

Mangalvar ko Hanuman ji ka jaap karo — "Om Hum Hanumate Namah". Hanuman ji shakti ke devta hain. Unki kripa se sharir mein ek alag si urja aati hai.

Ek baat aur — tension aur dar se zyada bimari koi cheez nahi deti. Ishwar par bharosa rakho. Jo hona hai, woh hoga. Aur jo woh chahte hain, woh hamesha accha hota hai.

Shiv ji ki sharan mein jao — mann shant hoga. Aur jab mann shant hoga, tan bhi swasth rahega.`
  },

  // ── VIDYA (EDUCATION) ──
  vidya: {
    folder: 'problems',
    text: `Vidya ke liye Saraswati ji aur Ganesh ji — yeh dono milkar saath dete hain.

Roz subah padhne se pehle — "Om Gam Ganapataye Namah" — 21 baar. Ganesh ji sabse pehle pujey jaate hain kyunki woh raaste ki rukavat hatate hain.

Kitabon ko zameen par mat rakho. Unka aadar karo — woh Saraswati ji ka roop hain.

Ek simple practice — subah uthke 10 minute aankhein band karke baitho. Mann khali karo. Phir padho. Concentration khud aa jaayega.

Budhwar ko Ganesh ji ka vrat rakho — ya sirf ek laddoo chadha do. Woh bahut jaldi khush ho jaate hain.

Yaad rakho — mehnat aur bhakti dono zaroori hain. Sirf bhakti karo aur padhai mat karo — woh bhi nahi chalta. Lekin jab dono saath hain — koi paper nahi hoga jo pass na ho.`
  },

  // ── GHAR SHANTI (FAMILY PEACE) ──
  ghar: {
    folder: 'problems',
    text: `Ghar mein shanti ke liye — pehle khud ke mann mein shanti aani chahiye.

Guruvar ko Vishnu ji ki pooja karo. "Om Namo Narayanaya" — parivaar ke saath milkar jaap karo. Jab ghar ke sab log ek saath bhakti karte hain — ek alag hi energy create hoti hai.

Subah aur shaam — ghar mein ek diya zaroor jalao. Yeh ghar mein positivity laata hai — yeh pracheen rishiyon ka gyaan hai.

Buzon ka aadar karo — yahi ghar ki neenv hai. Jahan buzon ko izzat milti hai, wahan Lakshmi ji ka vaas hota hai.

Aur ek baat — jo bhi takraav ho ghar mein, use Shiv ji ke charan mein rakh do. Kaho: "Main nahi sambhal sakta — aap sambhalo." Woh sambhaalte hain.

Jahan prem hai, wahan Ishwar hai. Ghar ko mandir banao.`
  },
};

export default async function handler(req, res) {
  const secret = req.query.secret;
  if (secret !== process.env.GENERATE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized. Pass ?secret=YOUR_SECRET' });
  }

  const elevenKey   = process.env.ELEVENLABS_API_KEY;
  const voiceId     = process.env.ELEVENLABS_VOICE_ID;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!elevenKey || !voiceId || !supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: 'Missing env vars',
      needs: ['ELEVENLABS_API_KEY','ELEVENLABS_VOICE_ID','SUPABASE_URL','SUPABASE_SERVICE_KEY']
    });
  }

  const results = [];
  const errors  = [];

  for (const [key, item] of Object.entries(AUDIO_FILES)) {
    const fileName = `${item.folder}/${key}.mp3`;
    console.log(`Generating: ${fileName}`);

    try {
      // Call ElevenLabs
      const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: item.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.85,
            style: 0.35,
            use_speaker_boost: true
          }
        })
      });

      if (!ttsRes.ok) {
        const err = await ttsRes.text();
        throw new Error(`ElevenLabs ${ttsRes.status}: ${err}`);
      }

      const audioBuffer = await ttsRes.arrayBuffer();
      const audioBytes  = new Uint8Array(audioBuffer);

      // Upload to Supabase Storage
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/shubhdin-audio/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'audio/mpeg',
            'x-upsert': 'true',
          },
          body: audioBytes
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Supabase ${uploadRes.status}: ${err}`);
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/shubhdin-audio/${fileName}`;
      results.push({ key, url: publicUrl, chars: item.text.length });
      console.log(`✅ ${key} done (${item.text.length} chars)`);

    } catch (err) {
      console.error(`❌ ${key} failed:`, err.message);
      errors.push({ key, error: err.message });
    }

    // Delay between calls to avoid rate limiting
    await new Promise(r => setTimeout(r, 800));
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
