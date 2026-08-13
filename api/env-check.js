// api/env-check.js — TEMPORARY diagnostic. Reports what the deployed
// function can actually see: node version, whether the two render
// packages resolve, and what's inside node_modules. Delete after fixing.
import fs from 'fs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const out = { node: process.version, cwd: process.cwd() };

  for (const pkg of ['@sparticuz/chromium', 'puppeteer-core']) {
    try {
      const m = await import(pkg);
      out[pkg] = 'RESOLVES ✓' + (m && (m.default || m) ? '' : ' (empty)');
    } catch (e) {
      out[pkg] = 'MISSING ✗ — ' + String(e.message).slice(0, 120);
    }
  }
  try {
    const dirs = ['node_modules', process.cwd() + '/node_modules', '/var/task/node_modules'];
    out.node_modules = {};
    for (const d of dirs) {
      try { out.node_modules[d] = fs.readdirSync(d).slice(0, 12); }
      catch (e) { out.node_modules[d] = 'not found'; }
    }
  } catch (e) {}
  try { out.task_root = fs.readdirSync('/var/task').slice(0, 20); } catch (e) {}
  try { out.pkg_json_at_root = fs.existsSync(process.cwd() + '/package.json'); } catch (e) {}

  res.status(200).json(out);
}
