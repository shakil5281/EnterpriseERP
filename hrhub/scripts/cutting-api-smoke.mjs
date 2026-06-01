#!/usr/bin/env node
/**
 * Cutting API smoke test — hits GET endpoints via Platform.Host gateway.
 *
 * Usage:
 *   CUTTING_TEST_TOKEN=<jwt> TEST_COMPANY_ID=<guid> node scripts/cutting-api-smoke.mjs
 */

const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const TOKEN = process.env.CUTTING_TEST_TOKEN || process.env.ACCESS_TOKEN || process.env.MERCH_TEST_TOKEN || '';
const COMPANY_ID = process.env.TEST_COMPANY_ID || '20000000-0000-0000-0000-000000000001';

const q = (params) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

async function request(method, path, { query, body } = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}${query ? q(query) : ''}`;
  const headers = { Accept: 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  if (body) headers['Content-Type'] = 'application/json';

  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
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
  { name: 'GET cutting-plans', path: '/cutting-plans', query: { companyId: COMPANY_ID } },
  { name: 'GET fabric-issues-to-cutting', path: '/fabric-issues-to-cutting', query: { companyId: COMPANY_ID } },
  { name: 'GET cutting-lays', path: '/cutting-lays', query: { companyId: COMPANY_ID } },
  { name: 'GET cutting-outputs', path: '/cutting-outputs', query: { companyId: COMPANY_ID } },
  { name: 'GET cutting-wastages', path: '/cutting-wastages', query: { companyId: COMPANY_ID } },
  { name: 'GET cutting-bundles', path: '/cutting-bundles', query: { companyId: COMPANY_ID } },
  { name: 'GET cutting-panel-transfers', path: '/cutting-panel-transfers', query: { companyId: COMPANY_ID } },
  { name: 'GET cutting-reports (plan)', path: '/cutting-reports', query: { companyId: COMPANY_ID, reportType: 'Cutting Plan' } },
];

const PLAN_ID = process.env.TEST_PLAN_ID;
const ORDER_ID = process.env.TEST_ORDER_ID || '40000000-0000-0000-0000-000000000001';
if (PLAN_ID) {
  endpoints.push({ name: 'GET plan by id', path: `/cutting-plans/${PLAN_ID}`, query: {} });
  endpoints.push({ name: 'GET plan size-breakdowns', path: `/cutting-plans/${PLAN_ID}/size-breakdowns`, query: {} });
}
endpoints.push({
  name: 'GET cutting-balances',
  path: '/cutting-balances',
  query: { companyId: COMPANY_ID, orderId: ORDER_ID },
});

console.log(`Cutting API smoke — ${API_BASE}`);
console.log(`Company: ${COMPANY_ID}`);
console.log(`Token: ${TOKEN ? '(set)' : '(none — may 401)'}\n`);

let passed = 0;
let failed = 0;
for (const ep of endpoints) {
  const result = await request('GET', ep.path, { query: ep.query });
  const icon = result.ok ? '✓' : '✗';
  const detail = result.ok ? `HTTP ${result.status}` : `HTTP ${result.status} — ${JSON.stringify(result.payload)?.slice(0, 120)}`;
  console.log(`${icon} ${ep.name}: ${detail}`);
  if (result.ok) passed++; else failed++;
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
