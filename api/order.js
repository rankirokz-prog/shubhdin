// api/order.js — one function, five jobs:
//  1) GET  ?check=1&uid=..&report=..&access_token=..   → { paid, order_code }
//  2) GET  ?list=1&uid=..&access_token=..              → every paid report + pdf_url
//  3) GET  ?dev=1&uid=..&report=..&access_token=..     → marks a ₹0 test order
//        (works only while env SD_DEV_FREE === '1'; pre-launch testing)
//  4) POST ?create=1&uid=..&report=..&access_token=..  → Razorpay payment link
//        for THIS buyer, with notes{uid,report} so the webhook can attribute it.
//        The client never sends an amount; see PRICES below.
//  5) POST  Razorpay webhook (payment_link.paid / payment.captured)
//        verified with env RZP_WEBHOOK_SECRET; expects notes { uid, report }.
//        Inert until keys are configured — safe to deploy today.
//
// env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SD_DEV_FREE,
//      RZP_KEY_ID, RZP_KEY_SECRET, RZP_WEBHOOK_SECRET
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

// ── PRICE AUTHORITY ──────────────────────────────────────────────────────────
// This table is the ONLY place a price is decided. buy.html's CFG and
// report-catalog.js are display copies; neither is trusted and neither is read
// here. The client never sends an amount — there is no amount field to tamper
// with — so a posted ₹1 is impossible by construction rather than by validation.
// A report absent from this table cannot be paid for at all: that is how a
// withdrawn report (muhurta, Aug 2026) stays unsellable even via an old link.
const PRICES = {
  marriage: 399,
  love:     199,
  career:   199,
  child:    199,
  annual:   199,
  forecast: 299
  // muhurta: WITHDRAWN — do not re-add without restoring buy.html's CFG entry
};

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

  // ── create a payment link for THIS buyer ──
  // Must precede the webhook branch: both are POST, but the webhook arrives
  // with no query string. A link created here carries notes{uid,report}, which
  // is the whole point — a static dashboard link cannot know who clicked it,
  // so its webhook would hit the "no notes" early-return and silently mark
  // nothing paid. Money in, nothing out. This is that bug's fix.
  if (req.method === 'POST' && (req.query || {}).create === '1') {
    const q0 = req.query || {};
    if (!q0.uid || !q0.report) return res.status(400).json({ error: 'uid and report required' });
    if (!(await verifyUser(q0.uid, q0.access_token))) return res.status(401).json({ error: 'auth mismatch' });

    const amount = PRICES[q0.report];
    if (!amount) return res.status(400).json({ error: 'not for sale' });   // withdrawn or unknown

    // Already paid? Send them to their report instead of a second payment page.
    // This is the back-button duplicate, which is the common one.
    try {
      const rows = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${q0.uid}&report=eq.${q0.report}&status=eq.paid&select=order_code`,
        { headers: H }).then(r => r.json());
      if (Array.isArray(rows) && rows.length) {
        return res.status(200).json({ ok: true, already: true, order_code: rows[0].order_code });
      }
    } catch (e) { /* fall through and let them pay rather than blocking a sale */ }

    // .trim(): pasted env values very often carry a trailing space or newline,
    // which breaks Basic auth with an opaque 401 from Razorpay.
    const keyId = (process.env.RZP_KEY_ID || '').trim();
    const keySecret = (process.env.RZP_KEY_SECRET || '').trim();
    if (!keyId || !keySecret) return res.status(503).json({ error: 'payments not configured yet' });
    // key_id tells us which Razorpay mode this deployment is actually in
    const mode = keyId.indexOf('rzp_live') === 0 ? 'live' : keyId.indexOf('rzp_test') === 0 ? 'test' : 'unknown';

    const site = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
    const auth = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
    try {
      const rr = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100,                 // paise
          currency: 'INR',
          description: 'Shubh Din — ' + q0.report + ' report',
          reference_id: code(q0.uid, q0.report) + '-' + Date.now(),
          notes: { uid: q0.uid, report: q0.report },   // ← what the webhook reads
          notify: { sms: false, email: false },
          reminder_enable: false,
          callback_url: site + '/buy.html?r=' + encodeURIComponent(q0.report) + '&rzp=1',
          callback_method: 'get'
        })
      });
      const j = await rr.json();
      if (!rr.ok || !j.short_url) {
        // surface Razorpay's own words plus the mode — an "authentication
        // failed" here almost always means the keys were changed without a
        // redeploy, or were pasted with stray whitespace.
        return res.status(502).json({ error: 'payment link failed',
          detail: String((j && j.error && j.error.description) || ('HTTP ' + rr.status)).slice(0, 160),
          rzp_status: rr.status, mode: mode,
          // key_id is not a secret (it is used client-side in Checkout), so show
          // enough of it to compare against the Razorpay dashboard. 'rzp_live'
          // alone was 8 chars and told you nothing.
          key_id: keyId.slice(0, 20), key_len: keyId.length,
          secret_len: keySecret.length });
      }
      return res.status(200).json({ ok: true, url: j.short_url, order_code: code(q0.uid, q0.report) });
    } catch (e) {
      return res.status(502).json({ error: 'payment link failed', detail: String(e.message).slice(0, 150) });
    }
  }

  // ── confirm a payment directly with Razorpay ──
  // The webhook is delivery-dependent: it can be unconfigured, redirected,
  // rate-limited, or simply never arrive, and the buyer pays the price for it.
  // Razorpay returns razorpay_payment_id on the callback URL, so we can ask
  // Razorpay itself whether that payment is real, captured, belongs to THIS
  // buyer, and is for the right amount. This is the primary confirmation path;
  // the webhook is now only a backstop for buyers who close the tab.
  if ((req.query || {}).confirm === '1') {
    const q1 = req.query || {};
    if (!q1.uid || !q1.report || !q1.payment_id) return res.status(400).json({ error: 'uid, report and payment_id required' });
    if (!(await verifyUser(q1.uid, q1.access_token))) return res.status(401).json({ error: 'auth mismatch' });

    const keyId = (process.env.RZP_KEY_ID || '').trim();
    const keySecret = (process.env.RZP_KEY_SECRET || '').trim();
    if (!keyId || !keySecret) return res.status(503).json({ error: 'payments not configured yet' });
    const auth = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');

    try {
      const pay = await fetch('https://api.razorpay.com/v1/payments/' + encodeURIComponent(q1.payment_id),
        { headers: { Authorization: auth } }).then(r => r.json());
      if (!pay || !pay.id) return res.status(404).json({ error: 'payment not found' });
      if (pay.status !== 'captured' && pay.status !== 'authorized') {
        return res.status(200).json({ paid: false, status: pay.status || 'unknown' });
      }

      // notes live on the payment, or on its order, or on the payment link
      let notes = pay.notes || {};
      if ((!notes.uid || !notes.report) && pay.order_id) {
        try {
          const ord = await fetch('https://api.razorpay.com/v1/orders/' + pay.order_id,
            { headers: { Authorization: auth } }).then(r => r.json());
          if (ord && ord.notes && ord.notes.uid) notes = ord.notes;
        } catch (e) {}
      }
      // the payment must belong to this signed-in buyer — otherwise anyone could
      // replay someone else's payment id and claim a report
      if (notes.uid && notes.uid !== q1.uid) return res.status(403).json({ error: 'payment belongs to another account' });
      const report = notes.report || q1.report;
      const expect = PRICES[report];
      if (!expect) return res.status(400).json({ error: 'not for sale' });
      if (Math.round((pay.amount || 0) / 100) !== expect) {
        return res.status(409).json({ error: 'amount mismatch', paid_amount: Math.round((pay.amount || 0) / 100), expected: expect });
      }

      const up = await upsertPaid(q1.uid, report, expect, pay.id);
      if (!up.ok) return res.status(500).json({ error: 'order write failed' });
      return res.status(200).json({ ok: true, paid: true, report: report, order_code: code(q1.uid, report), via: 'confirm' });
    } catch (e) {
      return res.status(502).json({ error: 'confirm failed', detail: String(e.message).slice(0, 150) });
    }
  }

  // ── Razorpay webhook ──
  if (req.method === 'POST') {
    const secret = process.env.RZP_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ error: 'webhook not configured yet', why: 'RZP_WEBHOOK_SECRET missing on this deployment' });

    // Razorpay signs the RAW bytes it sent. Vercel hands us a parsed object, and
    // re-serialising it is not guaranteed to reproduce those bytes. Try the raw
    // body when the runtime exposes it, and accept either match.
    const sig = req.headers['x-razorpay-signature'] || '';
    const raw = (typeof req.rawBody === 'string') ? req.rawBody
              : Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : null;
    const reser = JSON.stringify(req.body || {});
    // An empty body on a webhook POST almost always means the request was
    // redirected (apex -> www) and the body was dropped in transit. Signature
    // verification would then fail as a plain 401 and hide the real cause.
    if (reser === '{}' && !raw) {
      return res.status(400).json({ error: 'empty webhook body',
        why: 'no payload received — if the webhook URL is the apex domain, point it at https://www.shubhdin.app/api/order so the POST is not redirected',
        host: req.headers.host || null, referer: req.headers.referer || null });
    }
    const hmac = (s) => crypto.createHmac('sha256', secret).update(s).digest('hex');
    const okSig = (raw && hmac(raw) === sig) || hmac(reser) === sig;
    if (!okSig) return res.status(401).json({ error: 'bad signature',
      why: raw ? 'raw and re-serialised body both mismatched — check the secret matches Razorpay'
               : 'no raw body available; re-serialised body mismatched — check the secret matches Razorpay' });

    try {
      const ev = req.body || {};
      const P = ev.payload || {};
      // payment_link.paid carries notes on the link. payment.captured often does
      // NOT — Razorpay does not always copy link notes onto the payment. If both
      // events are enabled, the captured one can arrive first with empty notes,
      // which is why a payment can look "ignored" while the money has moved.
      const linkEnt = P.payment_link && P.payment_link.entity;
      const payEnt  = P.payment && P.payment.entity;
      const ent = linkEnt || payEnt || {};
      let notes = (linkEnt && linkEnt.notes) || (payEnt && payEnt.notes) || {};

      // Recover notes from the payment link when the payment alone lacks them.
      if ((!notes.uid || !notes.report) && payEnt) {
        const linkId = payEnt.payment_link_id || (linkEnt && linkEnt.id);
        const keyId = process.env.RZP_KEY_ID, keySecret = process.env.RZP_KEY_SECRET;
        if (linkId && keyId && keySecret) {
          try {
            const auth = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
            const pl = await fetch('https://api.razorpay.com/v1/payment_links/' + linkId,
              { headers: { Authorization: auth } }).then(r => r.json());
            if (pl && pl.notes && pl.notes.uid) notes = pl.notes;
          } catch (e) { /* fall through to the ignored response below */ }
        }
      }

      if (!notes.uid || !notes.report) {
        return res.status(200).json({ ok: true, ignored: 'no notes',
          why: 'event ' + (ev.event || '?') + ' carried no uid/report and the link could not be read',
          event: ev.event || null, has_link: !!linkEnt, has_payment: !!payEnt });
      }
      await upsertPaid(notes.uid, notes.report, Math.round((ent.amount || 0) / 100), ent.id);
      return res.status(200).json({ ok: true, marked: notes.report, event: ev.event || null });
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
