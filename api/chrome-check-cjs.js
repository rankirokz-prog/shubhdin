// api/chrome-check-cjs.js — rung 3 in plain CommonJS.
let chromium = require('@sparticuz/chromium');
if (chromium.default) chromium = chromium.default;
const puppeteer = require('puppeteer-core');

module.exports = async function handler(req, res) {
  const t0 = Date.now(); let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    const version = await browser.version();
    await browser.close();
    res.status(200).json({ rung: '3-cjs', ok: true, chrome: version, boot_ms: Date.now() - t0 });
  } catch (e) {
    if (browser) { try { await browser.close(); } catch (x) {} }
    res.status(200).json({ rung: '3-cjs', ok: false, error: String(e.message).slice(0, 300) });
  }
};
