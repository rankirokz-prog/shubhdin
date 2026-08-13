// api/dep-check.js — POC rung 2: imports the render packages, nothing else.
// 500 crash here = packages absent from the cloud bundle.
// JSON here = install + bundling are fine.
import chromiumPkg from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const chromium = chromiumPkg && chromiumPkg.default ? chromiumPkg.default : chromiumPkg;
  res.status(200).json({
    rung: 2, ok: true,
    chromium_shape: typeof chromium,
    has_execPath: typeof chromium.executablePath,
    has_args: Array.isArray(chromium.args),
    puppeteer_ok: typeof puppeteer.launch === 'function',
    node: process.version
  });
}
