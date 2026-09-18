// api/kundli-pdf.js
// Renders the user's free Kundli (kundli-report.html, ~263 pages) to a real
// PDF via headless Chromium, stores it privately in shubhdin-reports,
// and returns a signed download URL. Cache identity includes entered details.
//
// POST { uid, access_token, details:{name,gender,dob,time,place,lat,lng} }
//  → { ready:true, url }            (cached or freshly rendered)
//  → { ready:false, rendering:true} (a parallel render is in flight)
//
// Actual render duration must be validated against the deployment's limits.

// @sparticuz/chromium is ESM-only; Vercel's runtime forbids require(esm).
// Load both via dynamic import() — legal in CJS — cached across invocations.
let _stack = null;
const crypto=require('crypto');
function loadStack() {
  if (!_stack) _stack = Promise.all([import('@sparticuz/chromium'), import('puppeteer-core')])
    .then(([c, p]) => ({ chromium: c.default || c, puppeteer: p.default || p }));
  return _stack;
}

// ── report language: nine codes, never clamped to hi/en ──
// Before this, `lang === 'hi' ? 'hi' : 'en'` turned every other language into
// English before the page was asked, so Telugu/Kannada/… PDFs came out English.
const SD_LANGS = ['en','hi','te','kn','ta','bn','mr','gu','as'];
function pickLang(...cands) {
  for (const c of cands) if (typeof c === 'string' && SD_LANGS.includes(c)) return c;
  return 'hi';
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey)
    return res.status(500).json({ error: 'Missing Supabase config' });

  const { uid, access_token, details } = req.body || {};
  const lang = pickLang(req.body && req.body.lang, details && details.lang);
  if (!uid || !details || !details.name || !details.dob || !details.time)
    return res.status(400).json({ error: 'uid and full details required' });

  // ── verify the caller really is this Supabase user ──
  try {
    const who = await fetch(supabaseUrl + '/auth/v1/user', {
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + access_token }
    }).then(r => r.json());
    if (!who || who.id !== uid)
      return res.status(401).json({ error: 'auth mismatch' });
  } catch (e) {
    return res.status(401).json({ error: 'auth check failed' });
  }

  const BUCKET = 'shubhdin-reports';
  // v4: a different birth profile or language is a different cached file.
  const canonical={};Object.keys(details).sort().forEach(k=>canonical[k]=details[k]);
  const fingerprint=crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  const path=`kundlis/v4/${uid}-${lang}-${fingerprint}.pdf`;
  const H={apikey:serviceKey,Authorization:'Bearer '+serviceKey};
  const objectUrl=`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`;
  async function ready(extra){
    const signed=await fetch(`${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${path}`,{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});
    const j=await signed.json();if(!signed.ok||!j.signedURL)throw new Error('PDF link unavailable');
    // Pointer contains no birth details; lets authenticated Dispatch find the latest file.
    await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/kundlis/v4/${uid}-${lang}.json`,{method:'POST',headers:{...H,'Content-Type':'application/json','x-upsert':'true'},body:JSON.stringify({path})});
    return Object.assign({ready:true,url:supabaseUrl+'/storage/v1'+j.signedURL,lang,expires_at:new Date(Date.now()+55*60000).toISOString()},extra);
  }

  // ── cached? serve instantly ──
  try {
    const head = await fetch(objectUrl, { method: 'HEAD',headers:H });
    if (head.ok) return res.status(200).json(await ready({cached:true}));
  } catch (e) { /* fall through to render */ }

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
    await page.evaluateOnNewDocument((d) => {
      localStorage.setItem('shubhdin_kundli_details', JSON.stringify(d));
    }, details);

    const site = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
    await page.goto(site + '/kundli-report.html?lang=' + lang, { waitUntil: 'networkidle0', timeout: 90000 });
    await page.evaluate((lang) => {
      try { if (lang && typeof setLang === 'function') setLang(lang); } catch (e) {}
      confirmStep(); generate();
    }, lang);
    await page.waitForFunction(() => {
      const r = document.getElementById('report');
      return r && r.innerHTML && r.innerHTML.length > 10000;
    }, { timeout: 120000 });
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (e) {}

    const pdf = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' }
    });
    await browser.close(); browser = null;

    // ── store once ──
    const up = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey, Authorization: 'Bearer ' + serviceKey,
        'Content-Type': 'application/pdf', 'x-upsert': 'true'
      },
      body: pdf
    });
    if (!up.ok) {
      const t = await up.text();
      return res.status(500).json({ error: 'storage upload failed', detail: t.slice(0, 200) });
    }
    return res.status(200).json(await ready({pages:'rendered',bytes:pdf.length}));
  } catch (e) {
    if (browser) { try { await browser.close(); } catch (x) {} }
    return res.status(500).json({ error: 'render failed', detail: String(e.message).slice(0, 200) });
  }
}
