// SHUBH DIN — test-order-list.js
// Runs the REAL merged api/order.js handler with stubbed fetch and env, and
// checks every mode still behaves: list=1 works, and — critically — the modes
// that existed before the merge (check, dev, webhook-unconfigured, bad auth)
// are unchanged. The failure this hunts: a merge that fixes the new thing and
// quietly breaks an old one.
//
//   node test-order-list.js

process.env.SUPABASE_URL = 'https://sb.test';
process.env.SUPABASE_SERVICE_KEY = 'svc';
process.env.SD_DEV_FREE = '1';
delete process.env.RZP_WEBHOOK_SECRET;

const calls = [];
let ORDERS = []; // rows the stub "table" returns
let PDFS = [];   // reports whose cached PDF "exists" in storage

global.fetch = async (url, opts) => {
  url = String(url);
  calls.push(url);
  if (url.includes('/auth/v1/user')) {
    const tok = (opts.headers.Authorization || '').replace('Bearer ', '');
    return { json: async () => tok === 'good' ? { id: 'u1' } : {} };
  }
  if (url.includes('/storage/v1/object/public/')) {
    const m = url.match(/reports\/[^/]+\/(\w+)\.pdf/);
    const exists = m && PDFS.includes(m[1]);
    return { ok: !!exists };
  }
  if (url.includes('/rest/v1/orders')) {
    if (opts && opts.method === 'POST') { return { ok: true, text: async () => '[]' }; }
    // simulate PostgREST filtering
    let rows = ORDERS.filter(r => r.status === 'paid');
    const m = url.match(/report=eq\.(\w+)/);
    if (m) rows = rows.filter(r => r.report === m[1]);
    return { json: async () => rows };
  }
  return { ok: true, json: async () => ({}), text: async () => '' };
};

const handler = require('./order.js');

function call(method, query, body, headers) {
  return new Promise((resolve) => {
    const res = {
      _h: {}, setHeader(k, v) { this._h[k] = v; },
      status(c) { this._c = c; return this; },
      json(o) { resolve({ code: this._c, body: o }); },
      end() { resolve({ code: this._c || 200, body: null }); }
    };
    handler({ method, query: query || {}, body: body || {}, headers: headers || {} }, res);
  });
}

const CASES = [
  { n: 'list=1 with two paid + one created row → only the paid two, deduped',
    async go() {
      ORDERS = [
        { uid: 'u1', report: 'marriage', status: 'paid', order_code: 'A', created_at: '2026-01-01' },
        { uid: 'u1', report: 'annual', status: 'paid', order_code: 'B', created_at: '2026-02-01' },
        { uid: 'u1', report: 'love', status: 'created', order_code: 'C', created_at: '2026-03-01' }
      ];
      PDFS = [];
      const r = await call('GET', { list: '1', uid: 'u1', access_token: 'good' });
      const names = (r.body.reports || []).map(x => x.report).sort().join(',');
      return r.code === 200 && r.body.ok === true && names === 'annual,marriage';
    } },
  { n: 'list=1 with nothing paid → ok:true, empty array (not an error)',
    async go() {
      ORDERS = [];
      const r = await call('GET', { list: '1', uid: 'u1', access_token: 'good' });
      return r.code === 200 && Array.isArray(r.body.reports) && r.body.reports.length === 0;
    } },
  { n: 'list=1 with bad token → 401, no data',
    async go() {
      ORDERS = [{ uid: 'u1', report: 'marriage', status: 'paid', order_code: 'A' }];
      const r = await call('GET', { list: '1', uid: 'u1', access_token: 'stolen' });
      return r.code === 401 && !r.body.reports;
    } },
  { n: 'list=1 without report param does NOT 400 (the merge-order point)',
    async go() {
      const r = await call('GET', { list: '1', uid: 'u1', access_token: 'good' });
      return r.code === 200;
    } },
  { n: 'list=1 includes pdf_url only for reports whose cached PDF exists',
    async go() {
      ORDERS = [
        { uid: 'u1', report: 'marriage', status: 'paid', order_code: 'A', created_at: '2026-01-01' },
        { uid: 'u1', report: 'annual', status: 'paid', order_code: 'B', created_at: '2026-02-01' }
      ];
      PDFS = ['marriage'];
      const r = await call('GET', { list: '1', uid: 'u1', access_token: 'good' });
      const m = r.body.reports.find(x => x.report === 'marriage');
      const a = r.body.reports.find(x => x.report === 'annual');
      return r.code === 200 && typeof m.pdf_url === 'string' &&
             m.pdf_url.includes('/reports/u1/marriage.pdf') && a.pdf_url === undefined;
    } },
  { n: 'list=1 pdf_url carries the download filename param',
    async go() {
      ORDERS = [{ uid: 'u1', report: 'career', status: 'paid', order_code: 'C', created_at: '2026-01-01' }];
      PDFS = ['career'];
      const r = await call('GET', { list: '1', uid: 'u1', access_token: 'good' });
      return r.body.reports[0].pdf_url.includes('download=Shubh-Din-career-report.pdf');
    } },
  { n: 'UNCHANGED: check=1 still requires report — missing report → 400',
    async go() {
      const r = await call('GET', { uid: 'u1', access_token: 'good' });
      return r.code === 400;
    } },
  { n: 'UNCHANGED: check=1 paid → {paid:true, order_code}',
    async go() {
      ORDERS = [{ uid: 'u1', report: 'career', status: 'paid', order_code: 'OC' }];
      const r = await call('GET', { uid: 'u1', report: 'career', access_token: 'good' });
      return r.code === 200 && r.body.paid === true && r.body.order_code === 'OC';
    } },
  { n: 'UNCHANGED: check=1 unpaid → {paid:false}',
    async go() {
      ORDERS = [];
      const r = await call('GET', { uid: 'u1', report: 'career', access_token: 'good' });
      return r.code === 200 && r.body.paid === false;
    } },
  { n: 'UNCHANGED: dev=1 still mints a paid order',
    async go() {
      const r = await call('GET', { dev: '1', uid: 'u1', report: 'love', access_token: 'good' });
      return r.code === 200 && r.body.ok === true && r.body.paid === true;
    } },
  { n: 'UNCHANGED: webhook POST without secret env → 503 (inert until configured)',
    async go() {
      const r = await call('POST', {}, { any: 'thing' });
      return r.code === 503;
    } },
  { n: 'UNCHANGED: missing uid → 400 before any auth call',
    async go() {
      const before = calls.length;
      const r = await call('GET', { list: '1', access_token: 'good' });
      const authCalled = calls.slice(before).some(u => u.includes('/auth/'));
      return r.code === 400 && !authCalled;
    } }
];

(async () => {
  let fail = 0;
  for (const c of CASES) {
    let ok;
    try { ok = await c.go(); } catch (e) { ok = false; console.log('    threw: ' + e.message); }
    if (!ok) fail++;
    console.log((ok ? '✓ ' : '✗ ') + c.n);
  }
  console.log(fail ? '\n✗ ' + fail + ' failed'
                   : '\n✓ ' + CASES.length + '/' + CASES.length + ' — list=1 works; every pre-merge mode unchanged');
  process.exit(fail ? 1 : 0);
})();
