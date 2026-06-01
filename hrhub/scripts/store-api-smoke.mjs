#!/usr/bin/env node
/**
 * Store API smoke test — hits GET endpoints via Platform.Host gateway.
 *
 * Usage:
 *   STORE_TEST_TOKEN=<jwt> TEST_COMPANY_ID=<guid> node scripts/store-api-smoke.mjs
 */

const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const TOKEN = process.env.STORE_TEST_TOKEN || process.env.ACCESS_TOKEN || process.env.MERCH_TEST_TOKEN || '';
const COMPANY_ID = process.env.TEST_COMPANY_ID || '';

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
  const url = `${API_BASE}/store${path}${query ? q(query) : ''}`;
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
  { name: 'GET categories', path: '/categories', query: { companyId: COMPANY_ID } },
  { name: 'GET units', path: '/units', query: { companyId: COMPANY_ID } },
  { name: 'GET items', path: '/items', query: { companyId: COMPANY_ID } },
  { name: 'GET buyers', path: '/buyers', query: { companyId: COMPANY_ID } },
  { name: 'GET orders', path: '/orders', query: { companyId: COMPANY_ID } },
  { name: 'GET bookings', path: '/bookings', query: { companyId: COMPANY_ID } },
  { name: 'GET grns', path: '/grns', query: { companyId: COMPANY_ID } },
  { name: 'GET transactions', path: '/transactions', query: { companyId: COMPANY_ID } },
  { name: 'GET dashboard-summary', path: '/dashboard-summary', query: { companyId: COMPANY_ID } },
  { name: 'GET low-stock', path: '/low-stock', query: { companyId: COMPANY_ID } },
  { name: 'GET shortage-report', path: '/shortage-report', query: { companyId: COMPANY_ID } },
  { name: 'GET reports/consumption', path: '/reports/consumption', query: { companyId: COMPANY_ID } },
  { name: 'GET reports/item-stock', path: '/reports/item-stock', query: { companyId: COMPANY_ID } },
  { name: 'GET reports/booking-vs-issue', path: '/reports/booking-vs-issue', query: { companyId: COMPANY_ID } },
];

const optionalIds = {
  categoryId: process.env.TEST_CATEGORY_ID,
  unitId: process.env.TEST_UNIT_ID,
  itemId: process.env.TEST_ITEM_ID,
  buyerId: process.env.TEST_BUYER_ID,
  orderId: process.env.TEST_ORDER_ID,
  bookingId: process.env.TEST_BOOKING_ID,
  grnId: process.env.TEST_GRN_ID,
};

if (optionalIds.categoryId) endpoints.push({ name: 'GET category by id', path: `/categories/${optionalIds.categoryId}`, query: { companyId: COMPANY_ID } });
if (optionalIds.itemId) {
  endpoints.push({ name: 'GET item by id', path: `/items/${optionalIds.itemId}`, query: { companyId: COMPANY_ID } });
  endpoints.push({ name: 'GET ledger', path: '/ledger', query: { companyId: COMPANY_ID, itemId: optionalIds.itemId } });
}
if (optionalIds.orderId) endpoints.push({ name: 'GET order by id', path: `/orders/${optionalIds.orderId}`, query: { companyId: COMPANY_ID } });
if (optionalIds.grnId) endpoints.push({ name: 'GET grn by id', path: `/grns/${optionalIds.grnId}`, query: { companyId: COMPANY_ID } });

console.log(`Store API smoke — ${API_BASE}/store`);
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
