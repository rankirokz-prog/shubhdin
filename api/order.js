// api/order.js — one function, eleven jobs:
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
//  6) POST ?meta=1&uid=..&access_token=..             → buyer writes phone+lang
//        onto their OWN order row after payment. Both confirm paths (direct
//        and webhook-poll) end here, so the row always knows where to send.
//  7) POST ?lead=1&uid=..&access_token=..             → free-Kundli WhatsApp
//        opt-in: upserts kundli_leads for THIS signed-in user only.
//  ADMIN modes — session-verified AND uid must be in env SD_ADMIN_UIDS:
//  8) GET  ?dispatch=1        → every paid order + delivery checks (pdf at the
//        language-scoped path, bytes, phone) for dispatch.html
//  9) POST ?dispatch_set=1    → move one order pending→approved→sent / problem
// 10) GET  ?leads=1           → kundli_leads list + per-lead kundli pdf check
// 11) POST ?lead_set=1        → mark kundli_sent / notified / note
//
// env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SD_DEV_FREE, SD_ADMIN_UIDS,
//      GOOGLE_PLAY_PACKAGE, GOOGLE_PLAY_SA_EMAIL, GOOGLE_PLAY_SA_KEY,
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
// one session check for every api/ function — see lib/verify-user.js
const { verifyUser: verifyUserWith } = require('../lib/verify-user.js');

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

// SKU naming, in ONE place. Play SKUs are immutable once created, so this
// map is effectively permanent — get it wrong in the console and the only fix
// is a new SKU and a migration.
function playSku(report) {
  return PRICES[report] ? ('report_' + report + '_' + PRICES[report]) : null;
}

// A service-account access token, signed here rather than pulling in
// googleapis (which is far too heavy for a serverless function and would push
// the bundle past what this endpoint needs).
async function googleAccessToken(email, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now
  };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64(header) + '.' + b64(claim);
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + unsigned + '.' + sig
  }).then(x => x.json());
  return r && r.access_token;
}

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

  /* ══ SD-DELIVERY-ADDRESS ══
     phone and lang used to be written ONLY by ?meta=1, which is a PATCH and so
     needs the row to exist — and the row does not exist until a payment
     confirms. postMeta() runs inside showDone(), i.e. only once the buyer
     RETURNS to the page after paying.

     A buyer who pays and closes the tab is confirmed by the webhook (the code
     already calls that "a backstop for buyers who close the tab") — but their
     row then has NO PHONE and lang defaulting to 'hi'. Two consequences, both
     measured: the dispatch board cannot WhatsApp them, and pdfCheck looks for
     a .hi.pdf so a Telugu buyer's own render is never found and delivery is
     withheld as a language mismatch.

     Fix: the phone and language are known at CREATE time (the buy page
     validates the number before Pay), so they now travel in the Razorpay
     notes and are written by whichever path confirms the payment. Purely
     additive — a link minted before this change simply has no extra notes and
     behaves exactly as before. */
  async function upsertPaid(uid, report, amount, payment_id, extra) {
    return fetch(`${supabaseUrl}/rest/v1/orders?on_conflict=uid,report`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([Object.assign(
        { uid, report, status: 'paid', amount: amount || 0,
          order_code: code(uid, report), payment_id: payment_id || null },
        /* only ever ADD a delivery address, never blank one that is already
           there — ?meta=1 may have written a better one from the live page */
        (function () {
          const e = {}, x = extra || {};
          const ph = cleanPhone(x.phone);
          if (ph) e.phone = ph;
          if (SD_LANGS.includes(x.lang)) e.lang = x.lang;
          return e;
        })()
      )])
    });
  }
  /* the check itself lives in lib/verify-user.js, shared with save-user.js
     and feedback.js — one implementation, three callers */
  async function verifyUser(uid, token) { return verifyUserWith(supabaseUrl, serviceKey, uid, token); }

  // ── dispatch-gate helpers ──────────────────────────────────────────────
  const SD_LANGS = ['en','hi','te','kn','ta','bn','mr','gu','as'];
  const BUCKET = 'shubhdin-audio';
  // Admin = a real signed-in session (verifyUser) whose uid is on the
  // allow-list. Without the second check any signed-in buyer could list every
  // order in the system.
  function isAdmin(uid) {
    return String(process.env.SD_ADMIN_UIDS || '').split(',')
      .map(x => x.trim()).filter(Boolean).includes(uid);
  }
  function cleanPhone(p) {
    /* A4 · wa.me needs 91 + ten digits. Two formats India actually types
       slipped through the old 11–15 length branch and reached the board as a
       green tick: '09876543210' and '0091 98765 43210'. Both became
       wa.me/0… — which resolves to nothing — on a PAID order. */
    let d = String(p || '').replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('91')) return d;      // already correct
    if (d.startsWith('00')) d = d.slice(2);                    // 0091… → 91…
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);  // 0987… → 987…
    if (d.length === 10) return '91' + d;
    if (d.length >= 11 && d.length <= 15) return d;            // other countries
    return null;
  }

  // PDFs are keyed by language since v134: {report}-{lang}.pdf.
  //
  // This used to fall back to the legacy language-less path and hand it back
  // as if it were the buyer's language — so a Telugu buyer could be served an
  // English file, downloaded under the name "…-te.pdf". Silent substitution,
  // the Eluru pattern in a new place.
  //
  // Now: find the file for the language asked for. If it is not there, look at
  // what IS there (legacy, or another language) and SAY SO via found_lang.
  // Callers decide — dispatch shows it as a red tick, the buyer's list refuses
  // to deliver it. Nothing guesses.
  function pdfPath(uid, report, lang) {
    return report === 'kundli'
      ? (lang ? `kundlis/${uid}-${lang}.pdf` : `kundlis/${uid}.pdf`)
      : (lang ? `reports/${uid}/${report}-${lang}.pdf` : `reports/${uid}/${report}.pdf`);
  }
  async function headOk(path) {
    try {
      const h = await fetch(`${supabaseUrl}/storage/v1/object/public/${BUCKET}/` + path, { method: 'HEAD' });
      if (h.ok) return { url: `${supabaseUrl}/storage/v1/object/public/${BUCKET}/` + path,
                         bytes: parseInt(h.headers.get('content-length') || '0', 10) };
    } catch (e) {}
    return null;
  }
  async function pdfCheck(uid, report, lang) {
    const want = await headOk(pdfPath(uid, report, lang));
    if (want) return { ...want, found_lang: lang, exact: true };
    // Not there. What exists instead? Probe the legacy path, then the other
    // eight languages. Only runs on a miss, so the common case stays one HEAD.
    const legacy = await headOk(pdfPath(uid, report, null));
    if (legacy) return { ...legacy, found_lang: null, exact: false };
    const others = await Promise.all(SD_LANGS.filter(l => l !== lang)
      .map(async l => { const h = await headOk(pdfPath(uid, report, l)); return h ? { ...h, found_lang: l } : null; }));
    const hit = others.filter(Boolean)[0];
    return hit ? { ...hit, exact: false } : null;
  }

  // ── buyer writes phone + language onto their own order row ──
  if (req.method === 'POST' && (req.query || {}).meta === '1') {
    const b = req.body || {};
    if (!b.uid || !b.report) return res.status(400).json({ error: 'uid and report required' });
    if (!(await verifyUser(b.uid, b.access_token))) return res.status(401).json({ error: 'auth mismatch' });
    const patch = {};
    const ph = cleanPhone(b.phone);
    if (ph) patch.phone = ph;
    if (SD_LANGS.includes(b.lang)) patch.lang = b.lang;
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'nothing valid to save' });
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${b.uid}&report=eq.${encodeURIComponent(b.report)}`,
        { method: 'PATCH', headers: H, body: JSON.stringify(patch) });
      return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true } : { error: 'meta write failed' });
    } catch (e) { return res.status(500).json({ error: 'meta write failed' }); }
  }

  // ── free-Kundli WhatsApp opt-in ──
  // Only the signed-in owner can write their own row; re-submitting updates it.
  if (req.method === 'POST' && (req.query || {}).lead === '1') {
    const b = req.body || {};
    if (!b.uid) return res.status(400).json({ error: 'uid required' });
    if (!(await verifyUser(b.uid, b.access_token))) return res.status(401).json({ error: 'auth mismatch' });
    const ph = cleanPhone(b.phone);
    if (!ph) return res.status(400).json({ error: 'valid phone required' });
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/kundli_leads?on_conflict=uid`, {
        method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify([{ uid: b.uid, phone: ph,
          name: String(b.name || '').slice(0, 80) || null,
          lang: SD_LANGS.includes(b.lang) ? b.lang : 'hi', consent: true }])
      });
      return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true } : { error: 'lead write failed' });
    } catch (e) { return res.status(500).json({ error: 'lead write failed' }); }
  }

  // ══ ADMIN · analytics ═══════════════════════════════════════════════════
  //
  // The events table is INSERT-ONLY by policy: the browser can add an event
  // with the public anon key and nobody can read one back with it. That is
  // deliberate and it is what makes the data safe to collect. But it also
  // means a dashboard page cannot query it directly, so the read happens here
  // with the service key, behind the same admin gate dispatch.html uses.
  //
  // The heavy lifting is already done by the eight views created in
  // analytics-setup.sql, so this endpoint only selects from them. If the SQL
  // has not been run yet, each view 404s and this returns a clear "run the
  // SQL" answer rather than an empty dashboard that looks like no traffic.
  if (req.method === 'GET' && (req.query || {}).stats === '1') {
    const q = req.query || {};
    if (!q.uid || !(await verifyUser(q.uid, q.access_token)) || !isAdmin(q.uid))
      return res.status(403).json({ error: 'admin only' });

    const VIEWS = ['v_errors_7d', 'v_daily', 'v_home_state', 'v_shares',
                   'v_buy_funnel', 'v_kundli_funnel', 'v_langs', 'v_jap'];
    const out = {}; let missing = 0;
    await Promise.all(VIEWS.map(async (v) => {
      try {
        const r = await fetch(`${supabaseUrl}/rest/v1/${v}?select=*&limit=200`, { headers: H });
        if (!r.ok) { out[v] = null; missing++; return; }
        out[v] = await r.json();
      } catch (e) { out[v] = null; missing++; }
    }));
    if (missing === VIEWS.length)
      return res.status(200).json({ ok: false, setup_needed: true,
        error: 'analytics views not found — run analytics-setup.sql in Supabase first' });
    return res.status(200).json({ ok: true, views: out, missing });
  }

  // ── ADMIN · move one order through the dispatch gate ──
  if (req.method === 'POST' && (req.query || {}).dispatch_set === '1') {
    const b = req.body || {};
    if (!b.admin_uid || !(await verifyUser(b.admin_uid, b.access_token)) || !isAdmin(b.admin_uid))
      return res.status(403).json({ error: 'admin only' });
    if (!b.uid || !b.report) return res.status(400).json({ error: 'uid and report required' });
    const allowed = ['pending', 'approved', 'sent', 'problem'];
    if (!allowed.includes(b.dispatch_status)) return res.status(400).json({ error: 'bad dispatch_status' });
    const to = b.dispatch_status;

    /* A3 · The state machine lives HERE, not in the board's disabled button.
         pending → approved → sent, with 'problem' as a side flag from either
         of the first two. 'sent' is terminal: ?list=1 hands out the download
         only at exactly 'sent', so any move away from it takes a delivered
         report off a paying customer. That needs an explicit unsend + reason,
         and it is recorded. pending → sent directly is refused: it skips the
         hand-check that pdfCheck exists for. */
    let cur;
    try {
      const rows = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${encodeURIComponent(b.uid)}&report=eq.${encodeURIComponent(b.report)}&status=eq.paid&select=dispatch_status,lang,phone,note`,
        { headers: H }).then(r => r.json());
      if (!Array.isArray(rows) || !rows.length) return res.status(404).json({ error: 'no paid order for that uid/report' });
      cur = rows[0];
    } catch (e) { return res.status(500).json({ error: 'read failed' }); }
    const from = cur.dispatch_status || 'pending';
    const NEXT = { pending: ['approved', 'problem'], approved: ['sent', 'problem'], problem: ['pending', 'approved'], sent: [] };
    const patch = {};
    if (to === from) {
      /* idempotent: a replayed request changes nothing and says so */
      if (typeof b.note === 'string') patch.note = b.note.slice(0, 300);
      if (!Object.keys(patch).length) return res.status(200).json({ ok: true, dispatch_status: to, unchanged: true });
    } else if (from === 'sent') {
      if (b.unsend !== true || typeof b.reason !== 'string' || b.reason.trim().length < 3) {
        return res.status(409).json({ error: 'order is sent', why: 'moving a delivered report backwards revokes the buyer\'s download; send unsend:true and a reason' });
      }
      patch.dispatch_status = to;
      patch.note = ('unsent ' + new Date().toISOString().slice(0, 16) + ': ' + b.reason.trim() + (cur.note ? ' | ' + cur.note : '')).slice(0, 300);
    } else if (!NEXT[from].includes(to)) {
      return res.status(409).json({ error: 'bad transition', from: from, to: to, allowed: NEXT[from],
        why: to === 'sent' ? 'approve first — sending skips the hand-check' : undefined });
    } else {
      patch.dispatch_status = to;
      if (typeof b.note === 'string') patch.note = b.note.slice(0, 300);
    }
    if (to === 'sent') {
      /* no exact-language PDF in the bucket, no 'sent' — the red tick, enforced */
      const lang = SD_LANGS.includes(cur.lang) ? cur.lang : 'hi';
      const pdf = await pdfCheck(b.uid, b.report, lang);
      if (!pdf || pdf.exact !== true) {
        return res.status(409).json({ error: 'no exact-language pdf', lang: lang,
          found_lang: pdf ? pdf.found_lang : null, why: 'the buyer would receive a missing or wrong-language report' });
      }
      patch.sent_at = new Date().toISOString();
    }
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${encodeURIComponent(b.uid)}&report=eq.${encodeURIComponent(b.report)}&status=eq.paid`,
        { method: 'PATCH', headers: H, body: JSON.stringify(patch) });
      return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true, dispatch_status: to, from: from } : { error: 'update failed' });
    } catch (e) { return res.status(500).json({ error: 'update failed' }); }
  }

  // ── ADMIN · mark a lead: kundli sent / notified / note ──
  if (req.method === 'POST' && (req.query || {}).lead_set === '1') {
    const b = req.body || {};
    if (!b.admin_uid || !(await verifyUser(b.admin_uid, b.access_token)) || !isAdmin(b.admin_uid))
      return res.status(403).json({ error: 'admin only' });
    if (!b.uid) return res.status(400).json({ error: 'uid required' });
    const patch = {};
    if (b.action === 'kundli_sent') patch.kundli_sent_at = new Date().toISOString();
    if (b.action === 'notified')    patch.last_notified_at = new Date().toISOString();
    if (typeof b.note === 'string') patch.note = b.note.slice(0, 300);
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'nothing to do' });
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/kundli_leads?uid=eq.${b.uid}`,
        { method: 'PATCH', headers: H, body: JSON.stringify(patch) });
      return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true } : { error: 'update failed' });
    } catch (e) { return res.status(500).json({ error: 'update failed' }); }
  }

  // ══ GOOGLE PLAY · verify and acknowledge a purchase ═══════════════════
  //
  // Play's billing runs entirely on the device, so the ONLY proof a purchase
  // is real is asking Google's servers about the token. A client that simply
  // reports "I paid" must never be believed — that is the whole reason this
  // endpoint exists.
  //
  // ACKNOWLEDGEMENT IS TIME-CRITICAL. Google auto-refunds any purchase not
  // acknowledged within three days. Our dispatch gate deliberately holds
  // delivery until Ram has checked the PDF by hand, and the promise to the
  // buyer is 48 hours — so acknowledging at DELIVERY time would leave only a
  // few hours of margin, and one slow weekend would silently refund a paying
  // customer. So: acknowledge here, the moment the purchase verifies. The
  // dispatch gate then runs exactly as it does for Razorpay, on an order that
  // is already safely paid.
  if (req.method === 'POST' && (req.query || {}).play_verify === '1') {
    const b = req.body || {};
    if (!b.uid || !b.report || !b.purchaseToken)
      return res.status(400).json({ error: 'uid, report and purchaseToken required' });
    if (!(await verifyUser(b.uid, b.access_token)))
      return res.status(401).json({ error: 'auth mismatch' });
    if (!PRICES[b.report]) return res.status(400).json({ error: 'unknown report' });

    const pkg = process.env.GOOGLE_PLAY_PACKAGE;
    const saEmail = process.env.GOOGLE_PLAY_SA_EMAIL;
    const saKey = (process.env.GOOGLE_PLAY_SA_KEY || '').replace(/\\n/g, '\n');
    if (!pkg || !saEmail || !saKey)
      return res.status(503).json({ error: 'play billing not configured' });

    // The SKU must be the one this report actually costs. A client asking us
    // to unlock `marriage` with the ₹199 career SKU is the obvious attack.
    const sku = playSku(b.report);
    if (b.productId && b.productId !== sku)
      return res.status(400).json({ error: 'sku does not match report', expected: sku });

    try {
      const token = await googleAccessToken(saEmail, saKey);
      if (!token) return res.status(502).json({ error: 'google auth failed' });

      const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/products/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(b.purchaseToken)}`;
      const pur = await fetch(base, { headers: { Authorization: 'Bearer ' + token } })
                        .then(r => r.json());

      // purchaseState: 0 purchased · 1 cancelled · 2 pending
      if (!pur || pur.error || pur.purchaseState !== 0)
        return res.status(402).json({ error: 'purchase not valid',
          state: pur && pur.purchaseState, detail: pur && pur.error && pur.error.message });

      // acknowledgementState: 0 not yet · 1 done. Acknowledge once, now.
      if (pur.acknowledgementState === 0) {
        const ack = await fetch(base + ':acknowledge', { method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ developerPayload: b.uid + ':' + b.report }) });
        if (!ack.ok)
          // Do NOT record the sale we could not acknowledge — Google would
          // refund it in three days and the books would disagree.
          return res.status(502).json({ error: 'could not acknowledge purchase' });
      }

      await upsertPaid(b.uid, b.report, PRICES[b.report], 'play:' + String(b.purchaseToken).slice(0, 24));
      return res.status(200).json({ ok: true, paid: true, order_code: code(b.uid, b.report),
                                    source: 'google_play' });
    } catch (e) {
      return res.status(500).json({ error: 'play verification failed' });
    }
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
          /* uid+report are what the webhook attributes on. phone+lang ride
             along so a buyer who never returns to the page still has a
             delivery address on their order. */
          notes: (function () {
            const n = { uid: q0.uid, report: q0.report };
            const ph = cleanPhone(q0.phone || (req.body || {}).phone);
            if (ph) n.phone = ph;
            const lg = q0.lang || (req.body || {}).lang;
            if (SD_LANGS.includes(lg)) n.lang = lg;
            return n;
          })(),
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
      /* B0 · compare in paise: Math.round(19850/100) is 199 and let fifty
         paise short through, and !== refused money someone had over-sent.
         Under-payment is refused; over-payment is accepted and logged. */
      const paidPaise = Number(pay.amount || 0);
      if (paidPaise < expect * 100) {
        return res.status(409).json({ error: 'amount short', paid_paise: paidPaise, expected: expect });
      }
      if (paidPaise > expect * 100) console.warn('[order] over-payment on ' + report + ' by ' + q1.uid + ': ' + paidPaise + ' paise vs ' + (expect * 100));

      const up = await upsertPaid(q1.uid, report, expect, pay.id,
        (pay && pay.notes) || {});
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
      /* A1 · Only two events mean "money moved". Anything else (payment.failed,
         payment.authorized, order.paid, refund.*) is acknowledged with 200 so
         Razorpay stops retrying — and recorded as nothing. Before this, any
         signed event carrying a payment entity was treated as paid. */
      const ACCEPT = { 'payment_link.paid': 1, 'payment.captured': 1 };
      if (!ACCEPT[ev.event]) {
        return res.status(200).json({ ok: true, ignored: 'event not a capture', event: ev.event || null });
      }
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
      /* A1 · The price authority applies here exactly as in ?confirm=1. A link
         entity reports amount_paid; a payment entity reports amount. Short,
         zero, or a payment that is not captured → acknowledge, record nothing.
         What gets stored is the catalogue price, as ?confirm=1 stores it. */
      const expect = PRICES[notes.report];
      if (!expect) {
        return res.status(200).json({ ok: true, ignored: 'not for sale', report: notes.report, event: ev.event });
      }
      if (payEnt && !linkEnt && payEnt.status !== 'captured') {
        return res.status(200).json({ ok: true, ignored: 'payment not captured', status: payEnt.status || null, event: ev.event });
      }
      const paise = Number((linkEnt ? (linkEnt.amount_paid != null ? linkEnt.amount_paid : linkEnt.amount) : ent.amount) || 0);
      /* compare in paise: Math.round(19850/100) is 199, which would wave
         through fifty paise short — the round-2 sweep's exact case */
      if (!(paise >= expect * 100)) {
        return res.status(200).json({ ok: true, ignored: 'amount short', paid_paise: paise, expected: expect, report: notes.report, event: ev.event });
      }
      /* E1 · If the order write fails, this MUST NOT be a 200: Razorpay treats
         2xx as delivered and never retries, and the buyer's money has moved
         with no order row behind it. A 5xx makes Razorpay retry (with backoff,
         for ~24h); the on_conflict=uid,report upsert makes the retry write
         exactly one row. Same rule ?confirm=1 already applies. */
      let up;
      try { up = await upsertPaid(notes.uid, notes.report, expect, ent.id, notes); }
      catch (e) { up = { ok: false, status: 0, text: async () => String(e && e.message) }; }
      if (!up || !up.ok) {
        let detail = ''; try { detail = (await up.text()).slice(0, 200); } catch (e) {}
        console.error('[webhook] order write failed for ' + notes.uid + '/' + notes.report + ' (' + (up && up.status) + '): ' + detail + ' — returning 503 so Razorpay retries');
        return res.status(503).json({ ok: false, error: 'order write failed', retry: true, report: notes.report, event: ev.event || null });
      }
      return res.status(200).json({ ok: true, marked: notes.report, event: ev.event || null });
    } catch (e) { return res.status(500).json({ error: String(e.message).slice(0, 150) }); }
  }

  // ── GET modes ──
  const q = req.query || {};
  if (!q.uid) return res.status(400).json({ error: 'uid required' });
  if (!(await verifyUser(q.uid, q.access_token))) return res.status(401).json({ error: 'auth mismatch' });

  // ── ADMIN · the dispatch board ──
  if (q.dispatch === '1') {
    if (!isAdmin(q.uid)) return res.status(403).json({ error: 'admin only', your_uid: q.uid,
      hint: 'add this uid to SD_ADMIN_UIDS in Vercel and redeploy' });
    try {
      const rows = await fetch(`${supabaseUrl}/rest/v1/orders?status=eq.paid&select=uid,report,lang,phone,amount,order_code,payment_id,created_at,dispatch_status,sent_at,note&order=created_at.desc&limit=500`,
        { headers: H }).then(r => r.json());
      if (!Array.isArray(rows)) return res.status(500).json({ error: 'orders query failed' });
      await Promise.all(rows.map(async (r) => {
        r.lang = SD_LANGS.includes(r.lang) ? r.lang : 'hi';
        r.dispatch_status = r.dispatch_status || 'pending';
        /* A4 · the board's phone tick: deliverable, not merely present */
        r.phone_e164 = cleanPhone(r.phone);
        r.phone_ok = /^91\d{10}$/.test(r.phone_e164 || '');
        const pdf = await pdfCheck(r.uid, r.report, r.lang);
        if (pdf) { r.pdf_url = pdf.url; r.pdf_bytes = pdf.bytes;
                   r.pdf_lang_scoped = pdf.exact; r.pdf_found_lang = pdf.found_lang; }
        try {   // buyer's email, for the card — service key may read auth admin
          const u = await fetch(`${supabaseUrl}/auth/v1/admin/users/${r.uid}`, { headers: H }).then(x => x.json());
          if (u && u.email) r.email = u.email;
        } catch (e) {}
      }));
      return res.status(200).json({ ok: true, orders: rows });
    } catch (e) { return res.status(500).json({ error: 'dispatch list failed' }); }
  }

  // ── ADMIN · the leads board ──
  if (q.leads === '1') {
    if (!isAdmin(q.uid)) return res.status(403).json({ error: 'admin only', your_uid: q.uid });
    try {
      const rows = await fetch(`${supabaseUrl}/rest/v1/kundli_leads?select=*&order=created_at.desc&limit=1000`,
        { headers: H }).then(r => r.json());
      if (!Array.isArray(rows)) return res.status(500).json({ error: 'leads query failed' });
      await Promise.all(rows.map(async (r) => {
        r.lang = SD_LANGS.includes(r.lang) ? r.lang : 'hi';
        const pdf = await pdfCheck(r.uid, 'kundli', r.lang);
        if (pdf) { r.kundli_pdf_url = pdf.url; r.kundli_pdf_bytes = pdf.bytes;
                   r.kundli_pdf_exact = pdf.exact; r.kundli_pdf_found_lang = pdf.found_lang; }
      }));
      return res.status(200).json({ ok: true, leads: rows });
    } catch (e) { return res.status(500).json({ error: 'leads list failed' }); }
  }

  // list: every paid report for this uid, one call — feeds sd_owned_reports.
  // Must sit before the report-required check: list has no report param.
  if (q.list === '1') {
    try {
      const rows = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${q.uid}&status=eq.paid&select=report,order_code,created_at,lang,dispatch_status&order=created_at.asc`,
        { headers: H }).then(r => r.json());
      if (!Array.isArray(rows)) return res.status(500).json({ error: 'orders query failed' });
      const seen = {}, reports = [];
      for (const r of rows) {
        if (seen[r.report]) continue;
        seen[r.report] = true;
        reports.push({ report: r.report, order_code: r.order_code, paid_at: r.created_at,
          lang: SD_LANGS.includes(r.lang) ? r.lang : 'hi',
          dispatch_status: r.dispatch_status || 'pending' });
      }
      // pdf_url is the delivery. It appears ONLY once Ram has moved the order
      // to 'sent' on the dispatch page — the whole point of the gate is that a
      // blank or wrong PDF can never reach a buyer because nothing is
      // delivered by default. The path is language-scoped since v134, with a
      // legacy fallback for pre-v134 renders.
      await Promise.all(reports.map(async (r2) => {
        if (r2.dispatch_status !== 'sent') return;
        const pdf = await pdfCheck(q.uid, r2.report, r2.lang);
        if (!pdf) return;
        // EXACT language or nothing. A near-miss (legacy file, or another
        // language) is withheld and flagged: the buyer's Download button then
        // re-renders in the right language rather than opening the wrong one.
        if (!pdf.exact) { r2.pdf_lang_mismatch = pdf.found_lang || 'legacy'; return; }
        r2.pdf_url = pdf.url + `?download=Shubh-Din-${r2.report}-${r2.lang}.pdf`;
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
    const rows = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${encodeURIComponent(q.uid)}&report=eq.${encodeURIComponent(q.report)}&status=eq.paid&select=order_code`,
      { headers: H }).then(r => r.json());
    const paid = Array.isArray(rows) && rows.length > 0;
    return res.status(200).json({ paid, order_code: paid ? rows[0].order_code : null });
  } catch (e) { return res.status(500).json({ error: 'check failed' }); }
};
