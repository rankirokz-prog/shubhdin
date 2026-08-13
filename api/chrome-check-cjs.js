// api/chrome-check-cjs.js — rung 3 v2: CJS + dynamic import().
let _stack = null;
function loadStack() {
  if (!_stack) _stack = Promise.all([import('@sparticuz/chromium'), import('puppeteer-core')])
    .then(([c, p]) => ({ chromium: c.default || c, puppeteer: p.default || p }));
  return _stack;
}
module.exports = async function handler(req, res) {
  const t0 = Date.now(); let browser = null;
  try {
    const { chromium, puppeteer } = await loadStack();
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    const version = await browser.version();
    await browser.close();
    res.status(200).json({ rung: '3-dyn', ok: true, chrome: version, boot_ms: Date.now() - t0 });
  } catch (e) {
    if (browser) { try { await browser.close(); } catch (x) {} }
    res.status(200).json({ rung: '3-dyn', ok: false, error: String(e.message).slice(0, 300) });
  }
};
