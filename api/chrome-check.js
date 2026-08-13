// api/chrome-check.js — POC rung 3: boots headless Chrome and reports its version.
// JSON here = the entire render stack works; only the kundli logic remains.
import chromiumPkg from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const chromium = chromiumPkg && chromiumPkg.default ? chromiumPkg.default : chromiumPkg;

export default async function handler(req, res) {
  const t0 = Date.now();
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    const version = await browser.version();
    await browser.close();
    res.status(200).json({ rung: 3, ok: true, chrome: version, boot_ms: Date.now() - t0 });
  } catch (e) {
    if (browser) { try { await browser.close(); } catch (x) {} }
    res.status(200).json({ rung: 3, ok: false, error: String(e.message).slice(0, 300) });
  }
}
