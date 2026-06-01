#!/usr/bin/env node
/**
 * Inventory API smoke test — hits endpoints via Platform.Host gateway.
 *
 * Usage:
 *   INVENTORY_TEST_TOKEN=<jwt> TEST_COMPANY_ID=<guid> node scripts/inventory-api-smoke.mjs
 */

const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const TOKEN = process.env.INVENTORY_TEST_TOKEN || process.env.ACCESS_TOKEN || process.env.MERCH_TEST_TOKEN || '';
const COMPANY_ID = process.env.TEST_COMPANY_ID || '';
const ITEM_ID = process.env.TEST_ITEM_ID || '';

if (!COMPANY_ID) {
  console.error('Set TEST_COMPANY_ID (company GUID from seed / active company).');
  process.exit(1);
}

const q = (params) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

async function request(method, path, { query, body } = {}) {
  const url = `${API_BASE}/inventory${path}${query ? q(query) : ''}`;
  const headers = { Accept: 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  if (body) headers['Content-Type'] = 'application/json';

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let payload = null;
    const text = await res.text();
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    const success = res.ok && payload?.success !== false;
    return { ok: success, status: res.status, payload };
  } catch (err) {
    return { ok: false, status: 0, payload: { message: err instanceof Error ? err.message : String(err) } };
  }
}

const endpoints = [
  { name: 'GET items', path: '/items', query: { companyId: COMPANY_ID } },
  { name: 'GET transactions', path: '/transactions', query: { companyId: COMPANY_ID, limit: 20 } },
];

if (ITEM_ID) {
  endpoints.push(
    { name: 'GET item by id', path: `/items/${ITEM_ID}`, query: { companyId: COMPANY_ID } },
    { name: 'GET item transactions', path: `/items/${ITEM_ID}/transactions`, query: { companyId: COMPANY_ID } },
    { name: 'GET item exists', path: `/items/${ITEM_ID}/exists`, query: { companyId: COMPANY_ID } },
    { name: 'GET stock balance', path: `/items/${ITEM_ID}/stock-balance`, query: { companyId: COMPANY_ID } },
  );
}

console.log(`Inventory API smoke — ${API_BASE}/inventory`);
console.log(`Company: ${COMPANY_ID}`);
console.log(`Token: ${TOKEN ? '(set)' : '(none — may 401)'}\n`);

let passed = 0;
let failed = 0;

for (const ep of endpoints) {
  const result = await request('GET', ep.path, { query: ep.query });
  const icon = result.ok ? '✓' : '✗';
  const detail = result.ok
    ? `HTTP ${result.status}`
    : `HTTP ${result.status} — ${result.payload?.message || JSON.stringify(result.payload)?.slice(0, 120)}`;
  console.log(`${icon} ${ep.name}: ${detail}`);
  if (result.ok) passed++;
  else failed++;
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
