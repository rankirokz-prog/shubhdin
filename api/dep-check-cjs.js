// api/dep-check-cjs.js — rung 2 v2: CJS + dynamic import() (loads ESM-only packages).
let _stack = null;
function loadStack() {
  if (!_stack) _stack = Promise.all([import('@sparticuz/chromium'), import('puppeteer-core')])
    .then(([c, p]) => ({ chromium: c.default || c, puppeteer: p.default || p }));
  return _stack;
} 
module.exports = async function handler(req, res) {
  try {
    const { chromium, puppeteer } = await loadStack();
    res.status(200).json({
      rung: '2-dyn', ok: true,
      has_execPath: typeof chromium.executablePath,
      has_args: Array.isArray(chromium.args),
      puppeteer_ok: typeof puppeteer.launch === 'function',
      node: process.version
    });
  } catch (e) {
    res.status(200).json({ rung: '2-dyn', ok: false, error: String(e.message).slice(0, 300) });
  }
};
