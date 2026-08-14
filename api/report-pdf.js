// api/report-pdf.js
// Renders any paid report to PDF via headless Chromium, gated by a paid order.
// Same proven pipeline as kundli-pdf (CJS + dynamic import — Vercel runtime
// forbids require() of the ESM-only @sparticuz/chromium).
//
// POST { report, uid, access_token, details:{ fieldId: value, ... }, lang }
//  → { ready:true, url }   stored once at reports/{uid}/{report}.pdf
//
// Gate: orders row (uid, report, status='paid') must exist,
//       unless env SD_DEV_FREE === '1' (pre-launch testing).

const REPORTS = {
  marriage: 'marriage-report.html',
  love:     'love-report.html',
  career:   'career-report.html',
  child:    'child-report.html',
  muhurta:  'muhurta-report.html',
  annual:   'annual-report.html',
  forecast: 'forecast-report.html'
};

let _stack = null;
function loadStack() {
  if (!_stack) _stack = Promise.all([import('@sparticuz/chromium'), import('puppeteer-core')])
    .then(([c, p]) => ({ chromium: c.default || c, puppeteer: p.default || p }));
  return _stack;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Missing Supabase config' });

  const { report, uid, access_token, details, lang } = req.body || {};
  if (!REPORTS[report]) return res.status(400).json({ error: 'unknown report' });
  if (!uid || !details) return res.status(400).json({ error: 'uid and details required' });

  // ── auth: caller must be this Supabase user ──
  try {
    const who = await fetch(supabaseUrl + '/auth/v1/user', {
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + access_token }
    }).then(r => r.json());
    if (!who || who.id !== uid) return res.status(401).json({ error: 'auth mismatch' });
  } catch (e) { return res.status(401).json({ error: 'auth check failed' }); }

  // ── order gate ──
  if (process.env.SD_DEV_FREE !== '1') {
    try {
      const q = await fetch(`${supabaseUrl}/rest/v1/orders?uid=eq.${uid}&report=eq.${report}&status=eq.paid&select=id`, {
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
      }).then(r => r.json());
      if (!Array.isArray(q) || !q.length) return res.status(402).json({ error: 'not purchased' });
    } catch (e) { return res.status(500).json({ error: 'order check failed' }); }
  }

  const BUCKET = 'shubhdin-audio';
  const path = `reports/${uid}/${report}.pdf`;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
  const dlUrl = publicUrl + `?download=Shubh-Din-${report}-report.pdf`;

  // ── cached? ──
  try {
    const head = await fetch(publicUrl, { method: 'HEAD' });
    if (head.ok) return res.status(200).json({ ready: true, url: dlUrl, cached: true });
  } catch (e) {}

  // ── render ──
  let browser = null;
  try {
    const { chromium, puppeteer } = await loadStack();
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      defaultViewport: { width: 900, height: 1200 }
    });
    const page = await browser.newPage();
    const site = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
    await page.goto(site + '/' + REPORTS[report], { waitUntil: 'networkidle0', timeout: 90000 });

    // drive the report's own form directly — no report-file edits needed
    await page.evaluate((d, lng) => {
      try { if (lng && typeof setLang === 'function') setLang(lng); } catch (e) {}
      for (const k in d) {
        const el = document.getElementById(k);
        if (el && d[k] !== undefined && d[k] !== null && d[k] !== '') el.value = d[k];
      }
      confirmStep(); generate();
    }, details, lang === 'hi' ? 'hi' : 'en');

    await page.waitForFunction(() => {
      const r = document.getElementById('report');
      return r && r.innerHTML && r.innerHTML.length > 8000;
    }, { timeout: 120000 });
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (e) {}

    const pdf = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' }
    });
    await browser.close(); browser = null;

    const up = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey,
        'Content-Type': 'application/pdf', 'x-upsert': 'true' },
      body: pdf
    });
    if (!up.ok) return res.status(500).json({ error: 'storage upload failed' });
    return res.status(200).json({ ready: true, url: dlUrl, bytes: pdf.length });
  } catch (e) {
    if (browser) { try { await browser.close(); } catch (x) {} }
    return res.status(500).json({ error: 'render failed', detail: String(e.message).slice(0, 200) });
  }
};
