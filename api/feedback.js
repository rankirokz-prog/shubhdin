// api/feedback.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const { message, rating, name, city, lang } = req.body || {};
  if(!message || message.trim().length < 3)
    return res.status(400).json({ error: 'Message too short' });

  const apiKey = process.env.RESEND_API_KEY;
  if(!apiKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

  const stars = '⭐'.repeat(rating||0) || 'No rating';
  const html = `
    <div style="font-family:sans-serif;max-width:500px;">
      <h2 style="color:#D4A843;">🕉️ ShubhDin Feedback</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;">Rating</td><td>${stars}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Name</td><td>${name||'Anonymous'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">City</td><td>${city||'–'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Language</td><td>${lang==='hi'?'Hindi':'English'}</td></tr>
      </table>
      <div style="margin-top:16px;padding:14px;background:#f9f9f9;border-radius:8px;font-size:15px;line-height:1.6;">
        ${message.replace(/\n/g,'<br>')}
      </div>
      <p style="color:#999;font-size:12px;margin-top:16px;">Sent from shubhdin.app</p>
    </div>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ShubhDin <onboarding@resend.dev>',
        to: ['rankirokz@gmail.com'],
        subject: `${stars} Feedback from ${name||'User'} — ShubhDin`,
        html
      })
    });
    const data = await r.json();
    if(!r.ok) return res.status(500).json({ error: data });
    return res.json({ success: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
