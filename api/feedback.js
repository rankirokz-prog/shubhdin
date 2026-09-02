// api/feedback.js
// B2 · This endpoint was open, unlimited and unescaped: anyone could burn the
// 3,000/month Resend quota in an hour (after which real feedback silently
// stops arriving) and store raw HTML for the next admin screen to render.
//   1. Ownership is required: uid + write_key, the same proof save-user.js
//      takes (lib/owner-key.js) — the dashboard has no Supabase session.
//   2. Caps: message ≤ 2000 chars, name/city ≤ 80.
//   3. Rate limit from the feedbacks table itself (serverless has no memory):
//      1 per uid per minute, 5 per uid per day. Needs a `uid` column — see the
//      one-line SQL in the handover. If the column is missing the count query
//      fails open (logged), never blocks a real user.
//   4. Escaped on WRITE, so whatever renders this table next need not remember.
const { checkOwner } = require('../lib/owner-key.js');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s, n) => String(s == null ? '' : s).slice(0, n);
const PER_MINUTE = 1, PER_DAY = 5, MAX_MSG = 2000;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const supabaseUrl = process.env.SUPABASE_URL, supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const H = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
  const b = req.body || {};
  const { uid, write_key, rating, lang } = b;

  const message = cap(b.message, MAX_MSG + 1);
  if (!message || message.trim().length < 3) return res.status(400).json({ error: 'Message too short' });
  if (message.length > MAX_MSG) return res.status(400).json({ error: 'Message too long', max: MAX_MSG });
  if (!uid || typeof uid !== 'string') return res.status(401).json({ error: 'uid required' });
  const own = await checkOwner(supabaseUrl, supabaseKey, uid, write_key);
  if (!own.ok) return res.status(own.status).json({ error: own.error });

  const name = esc(cap(b.name, 80)), city = esc(cap(b.city, 80)), msg = esc(message.trim());
  const stars = '⭐'.repeat(Math.max(0, Math.min(5, parseInt(rating, 10) || 0))) || 'No rating';

  // ── rate limit, from the table ──
  try {
    const since = (ms) => new Date(Date.now() - ms).toISOString();
    const count = async (iso) => {
      const r = await fetch(`${supabaseUrl}/rest/v1/feedbacks?uid=eq.${encodeURIComponent(uid)}&created_at=gte.${encodeURIComponent(iso)}&select=uid`, { headers: H });
      if (!r.ok) throw new Error('count ' + r.status);
      const rows = await r.json(); return Array.isArray(rows) ? rows.length : 0;
    };
    if (await count(since(60 * 1000)) >= PER_MINUTE) return res.status(429).json({ error: 'one message a minute, please', retry_in: 60 });
    if (await count(since(24 * 3600 * 1000)) >= PER_DAY) return res.status(429).json({ error: 'daily limit reached', limit: PER_DAY });
  } catch (e) { console.warn('[feedback] rate-limit query failed open: ' + e.message + ' — is the uid column on feedbacks?'); }

  // ── store first (so the limit counts even if email fails), escaped ──
  try {
    await fetch(`${supabaseUrl}/rest/v1/feedbacks`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ uid, name, city, lang: cap(lang, 5), rating: parseInt(rating, 10) || 0, message: msg, created_at: new Date().toISOString() })
    });
  } catch (e) { console.warn('[feedback] store failed: ' + e.message); }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });
  const html = `
    <div style="font-family:sans-serif;max-width:500px;">
      <h2 style="color:#D4A843;">🕉️ ShubhDin Feedback</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;">Rating</td><td>${stars}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Name</td><td>${name || 'Anonymous'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">City</td><td>${city || '–'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Language</td><td>${esc(cap(lang, 5)) || '–'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">User</td><td>${esc(uid)}</td></tr>
      </table>
      <div style="margin-top:16px;padding:14px;background:#f9f9f9;border-radius:8px;font-size:15px;line-height:1.6;">
        ${msg.replace(/\n/g, '<br>')}
      </div>
      <p style="color:#999;font-size:12px;margin-top:16px;">Sent from shubhdin.app</p>
    </div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'ShubhDin <onboarding@resend.dev>', to: ['rankirokz@gmail.com'],
        subject: `${stars} Feedback from ${(name || 'User').slice(0, 40)} — ShubhDin`, html })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(500).json({ error: data });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
