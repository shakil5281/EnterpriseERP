#!/usr/bin/env node
/**
 * Security Gate API smoke test — hits GET endpoints via Platform.Host.
 *
 * Usage:
 *   SECURITY_TEST_TOKEN=<jwt> TEST_COMPANY_ID=<guid> node scripts/security-api-smoke.mjs
 */

const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const TOKEN = process.env.SECURITY_TEST_TOKEN || process.env.ACCESS_TOKEN || process.env.CUTTING_TEST_TOKEN || '';
const COMPANY_ID = process.env.TEST_COMPANY_ID || '20000000-0000-0000-0000-000000000001';
const TODAY = new Date().toISOString().slice(0, 10);

const q = (params) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

async function request(method, path, { query } = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}${query ? q(query) : ''}`;
  const headers = { Accept: 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  try {
    const res = await fetch(url, { method, headers });
    let payload = null;
    const text = await res.text();
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    const success = res.ok && payload?.success !== false;
    return { ok: success, status: res.status, payload };
  } catch (err) {
    return { ok: false, status: 0, payload: { message: err instanceof Error ? err.message : String(err) } };
  }
}

const endpoints = [
  { name: 'GET gates', path: '/gates', query: { companyId: COMPANY_ID } },
  { name: 'GET visitors', path: '/visitors', query: { companyId: COMPANY_ID } },
  { name: 'GET visitor-entries', path: '/visitor-entries', query: { companyId: COMPANY_ID, date: TODAY } },
  { name: 'GET employee-out-passes', path: '/employee-out-passes', query: { companyId: COMPANY_ID, date: TODAY } },
  { name: 'GET vehicles', path: '/vehicles', query: { companyId: COMPANY_ID } },
  { name: 'GET vehicle-entries', path: '/vehicle-entries', query: { companyId: COMPANY_ID, date: TODAY } },
  { name: 'GET gate-passes', path: '/gate-passes', query: { companyId: COMPANY_ID } },
  { name: 'GET returnable-gate-pass-returns', path: '/returnable-gate-pass-returns', query: { companyId: COMPANY_ID } },
  { name: 'GET chalans', path: '/chalans', query: { companyId: COMPANY_ID } },
  { name: 'GET bill-entries', path: '/bill-entries', query: { companyId: COMPANY_ID } },
  { name: 'GET security-checks', path: '/security-checks', query: { companyId: COMPANY_ID } },
  { name: 'GET gate-reports/daily-register', path: '/gate-reports/daily-register', query: { companyId: COMPANY_ID, date: TODAY } },
  { name: 'GET gate-reports/returnable-pending', path: '/gate-reports/returnable-pending', query: { companyId: COMPANY_ID } },
];

async function main() {
  console.log(`Security API smoke — ${API_BASE}`);
  console.log(`Company: ${COMPANY_ID}`);
  if (!TOKEN) console.warn('Warning: no SECURITY_TEST_TOKEN — requests may return 401\n');

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    const result = await request('GET', ep.path, { query: ep.query });
    const icon = result.ok ? '✓' : '✗';
    console.log(`${icon} ${ep.name} — HTTP ${result.status}`);
    if (!result.ok) {
      failed++;
      const msg = result.payload?.message || JSON.stringify(result.payload)?.slice(0, 120);
      console.log(`    ${msg}`);
    } else {
      passed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
