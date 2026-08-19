// api/order.js — one function, three jobs:
//  1) GET  ?check=1&uid=..&report=..&access_token=..   → { paid, order_code }
//  2) GET  ?dev=1&uid=..&report=..&access_token=..     → marks a ₹0 test order
//        (works only while env SD_DEV_FREE === '1'; pre-launch testing)
//  3) POST  Razorpay webhook (payment_link.paid / payment.captured)
//        verified with env RZP_WEBHOOK_SECRET; expects notes { uid, report }.
//        Inert until keys are configured — safe to deploy today.
//
// orders table (run once in Supabase SQL editor):
//   create table if not exists orders (
//     id uuid default gen_random_uuid() primary key,
//     uid uuid not null, report text not null,
//     status text default 'created', amount int,
//     order_code text, payment_id text,
//     created_at timestamptz default now(),
//     unique (uid, report)
//   );

const crypto = require('crypto');

function code(uid, report) {
  return 'SD-' + crypto.createHash('sha1').update(uid + ':' + report)
    .digest('base64').replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Missing Supabase config' });
  const H = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json' };

  async function upsertPaid(uid, report, amount, payment_id) {
    return fetch(`${supabaseUrl}/rest/v1/orders?on_conflict=uid,report`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([{ uid, report, status: 'paid', amount: amount || 0,
        order_code: code(uid, report), payment_id: payment_id || null }])
    });
  }
  async function verifyUser(uid, token) {
    try {
      const who = await fetch(supabaseUrl + '/auth/v1/user', {
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + token }
      }).then(r => r.json());
      return who && who.id === uid;
    } catch (e) { return false; }
  }

  // ── Razorpay webhook ──
  if (req.method === 'POST') {
    const secret = process.env.RZP_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ error: 'webhook not configured yet' });
    const body = JSON.stringify(req.body || {});
    const sig = req.headers['x-razorpay-signature'] || '';
    const expect = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (sig !== expect) return res.status(401).json({ error: 'bad signature' });
    try {
      const ev = req.body;
      const ent = (ev.payload && (ev.payload.payment_link ? ev.payload.payment_link.entity
                 : ev.payload.payment ? ev.payload.payment.entity : null)) || {};
      const notes = ent.notes || {};
      if (!notes.uid || !notes.report) return res.status(200).json({ ok: true, ignored: 'no notes' });
      await upsertPaid(notes.uid, notes.report, Math.round((ent.amount || 0) / 100), ent.id);
      return res.status(200).json({ ok: true });
    } catch (e) { return res.status(500).json({ error: String(e.message).slice(0, 150) }); }
  }

  // ── GET modes ──
  const q = req.query || {};
  if (!q.uid) return res.status(400).json({ error: 'uid required' });
  if (!(await verifyUser(q.uid, q.access_token))) return res.status(401).json({ error: 'auth mismatch' });

  // list: every paid report for this uid, one call — feeds sd_owned_reports.
  // Must sit before the report-required check: list has no report param.
  if (q.list === '1') {
    try {
      const rows = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${q.uid}&status=eq.paid&select=report,order_code,created_at&order=created_at.asc`,
        { headers: H }).then(r => r.json());
      if (!Array.isArray(rows)) return res.status(500).json({ error: 'orders query failed' });
      const seen = {}, reports = [];
      for (const r of rows) {
        if (seen[r.report]) continue;
        seen[r.report] = true;
        reports.push({ report: r.report, order_code: r.order_code, paid_at: r.created_at });
      }
      // pdf_url: the storage path is deterministic, so HEAD-check the cache and
      // include the URL only when the PDF actually exists. Presence in the
      // response therefore means "openable right now" — a buyer on a new phone
      // gets restore → open with no birth details needed. Checks run in
      // parallel; a failed HEAD just means no pdf_url for that report.
      const BUCKET = 'shubhdin-audio';
      await Promise.all(reports.map(async (rep) => {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/reports/${q.uid}/${rep.report}.pdf`;
        try {
          const head = await fetch(publicUrl, { method: 'HEAD' });
          if (head.ok) rep.pdf_url = publicUrl + `?download=Shubh-Din-${rep.report}-report.pdf`;
        } catch (e) {}
      }));
      return res.status(200).json({ ok: true, reports });
    } catch (e) { return res.status(500).json({ error: 'list failed' }); }
  }

  if (!q.report) return res.status(400).json({ error: 'uid and report required' });

  if (q.dev === '1') {
    if (process.env.SD_DEV_FREE !== '1') return res.status(403).json({ error: 'dev mode disabled' });
    const r = await upsertPaid(q.uid, q.report, 0, 'dev-test');
    if (!r.ok) return res.status(500).json({ error: 'order write failed', detail: (await r.text()).slice(0, 150) });
    return res.status(200).json({ ok: true, paid: true, order_code: code(q.uid, q.report), dev: true });
  }

  // check
  try {
    const rows = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${q.uid}&report=eq.${q.report}&status=eq.paid&select=order_code`,
      { headers: H }).then(r => r.json());
    const paid = Array.isArray(rows) && rows.length > 0;
    return res.status(200).json({ paid, order_code: paid ? rows[0].order_code : null });
  } catch (e) { return res.status(500).json({ error: 'check failed' }); }
};
