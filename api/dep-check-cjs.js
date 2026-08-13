// api/dep-check-cjs.js — rung 2 in plain CommonJS (no ESM compile step).
let chromium = require('@sparticuz/chromium');
if (chromium.default) chromium = chromium.default;
const puppeteer = require('puppeteer-core');

module.exports = async function handler(req, res) {
  res.status(200).json({
    rung: '2-cjs', ok: true,
    has_execPath: typeof chromium.executablePath,
    has_args: Array.isArray(chromium.args),
    puppeteer_ok: typeof puppeteer.launch === 'function',
    node: process.version
  });
};
