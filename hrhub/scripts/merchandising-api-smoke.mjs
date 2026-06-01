#!/usr/bin/env node
/**
 * Merchandising API smoke test — hits GET endpoints via Platform.Host gateway.
 *
 * Usage:
 *   MERCH_TEST_TOKEN=<jwt> TEST_COMPANY_ID=<guid> node scripts/merchandising-api-smoke.mjs
 *
 * Optional:
 *   API_BASE_URL=http://localhost:5000/api/v1
 *   TEST_BUYER_ID, TEST_ORDER_ID, TEST_STYLE_ID, TEST_QUOTATION_ID (for nested GETs)
 */

const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const TOKEN = process.env.MERCH_TEST_TOKEN || process.env.ACCESS_TOKEN || '';
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
  const url = `${API_BASE}/merchandising${path}${query ? q(query) : ''}`;
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

    const success = res.ok && (payload?.success !== false);
    return { ok: success, status: res.status, payload };
  } catch (err) {
    return { ok: false, status: 0, payload: { message: err instanceof Error ? err.message : String(err) } };
  }
}

const endpoints = [
  { name: 'GET buyers', path: '/buyers', query: { companyId: COMPANY_ID } },
  { name: 'GET seasons', path: '/seasons', query: { companyId: COMPANY_ID } },
  { name: 'GET garment-items', path: '/garment-items', query: { companyId: COMPANY_ID } },
  { name: 'GET styles', path: '/styles', query: { companyId: COMPANY_ID } },
  { name: 'GET master/colors', path: '/master/colors', query: { companyId: COMPANY_ID } },
  { name: 'GET master/sizes', path: '/master/sizes', query: { companyId: COMPANY_ID } },
  { name: 'GET master/units', path: '/master/units', query: { companyId: COMPANY_ID } },
  { name: 'GET master/suppliers', path: '/master/suppliers', query: { companyId: COMPANY_ID } },
  { name: 'GET master/brands', path: '/master/brands', query: { companyId: COMPANY_ID } },
  { name: 'GET master/fabric-types', path: '/master/fabric-types', query: { companyId: COMPANY_ID } },
  { name: 'GET master/trims-types', path: '/master/trims-types', query: { companyId: COMPANY_ID } },
  { name: 'GET master/size-ratios', path: '/master/size-ratios', query: { companyId: COMPANY_ID } },
  { name: 'GET master/garment-categories', path: '/master/garment-categories', query: { companyId: COMPANY_ID } },
  { name: 'GET orders', path: '/orders', query: { companyId: COMPANY_ID } },
  { name: 'GET samples', path: '/samples', query: { companyId: COMPANY_ID } },
  { name: 'GET quotations', path: '/quotations', query: { companyId: COMPANY_ID } },
  { name: 'GET bookings', path: '/bookings', query: { companyId: COMPANY_ID } },
  { name: 'GET requisitions', path: '/requisitions', query: { companyId: COMPANY_ID } },
  { name: 'GET communications', path: '/communications', query: { companyId: COMPANY_ID } },
  { name: 'GET approvals/pending', path: '/approvals/pending', query: { companyId: COMPANY_ID } },
  { name: 'GET shipment-plans', path: '/shipment-plans', query: { companyId: COMPANY_ID } },
  { name: 'GET reports/order-summary', path: '/reports/order-summary', query: { companyId: COMPANY_ID } },
  { name: 'GET reports/tna-delay', path: '/reports/tna-delay', query: { companyId: COMPANY_ID } },
  { name: 'GET reports/booking-status', path: '/reports/booking-status', query: { companyId: COMPANY_ID } },
  { name: 'GET reports/order-pipeline', path: '/reports/order-pipeline', query: { companyId: COMPANY_ID } },
];

function optionalEndpoints() {
  const buyerId = process.env.TEST_BUYER_ID;
  const orderId = process.env.TEST_ORDER_ID;
  const styleId = process.env.TEST_STYLE_ID;
  const quotationId = process.env.TEST_QUOTATION_ID;
  const planId = process.env.TEST_SHIPMENT_PLAN_ID;
  const approvalId = process.env.TEST_APPROVAL_ID;

  const list = [];
  if (buyerId) {
    list.push(
      { name: 'GET buyer by id', path: `/buyers/${buyerId}`, query: { companyId: COMPANY_ID } },
      { name: 'GET buyer contacts', path: `/buyers/${buyerId}/contacts` },
      { name: 'GET buyer payment-terms', path: `/buyers/${buyerId}/payment-terms` },
      { name: 'GET buyer compliance-rules', path: `/buyers/${buyerId}/compliance-rules` },
    );
  }
  if (orderId) {
    list.push(
      { name: 'GET order by id', path: `/orders/${orderId}`, query: { companyId: COMPANY_ID } },
      { name: 'GET order details', path: `/orders/${orderId}/details` },
      { name: 'GET order worksheet', path: `/orders/${orderId}/worksheet` },
      { name: 'GET order buyer-pos', path: `/orders/${orderId}/buyer-pos` },
      { name: 'GET order bom-items', path: `/orders/${orderId}/bom-items` },
      { name: 'GET order costing', path: `/orders/${orderId}/costing` },
      { name: 'GET order color-size', path: `/orders/${orderId}/color-size-breakdown` },
      { name: 'GET order documents', path: `/orders/${orderId}/documents`, query: { companyId: COMPANY_ID } },
      { name: 'GET tna by order', path: `/tna/orders/${orderId}` },
    );
  }
  if (styleId) {
    list.push(
      { name: 'GET style by id', path: `/styles/${styleId}`, query: { companyId: COMPANY_ID } },
      { name: 'GET style versions', path: `/styles/${styleId}/versions` },
      { name: 'GET style bom-items', path: `/styles/${styleId}/bom-items` },
      { name: 'GET style documents', path: `/styles/${styleId}/documents`, query: { companyId: COMPANY_ID } },
    );
  }
  if (quotationId) {
    list.push(
      { name: 'GET quotation by id', path: `/quotations/${quotationId}`, query: { companyId: COMPANY_ID } },
      { name: 'GET quotation negotiations', path: `/quotations/${quotationId}/negotiations`, query: { companyId: COMPANY_ID } },
    );
  }
  if (planId) {
    list.push({
      name: 'GET shipment execution by plan',
      path: '/shipment-executions',
      query: { companyId: COMPANY_ID, shipmentPlanId: planId },
    });
  }
  if (approvalId) {
    list.push({
      name: 'GET approval by id',
      path: `/approvals/${approvalId}`,
      query: { companyId: COMPANY_ID },
    });
  }
  return list;
}

async function main() {
  console.log(`API base: ${API_BASE}/merchandising`);
  console.log(`Company:  ${COMPANY_ID}`);
  console.log(`Auth:     ${TOKEN ? 'Bearer token set' : 'NO TOKEN (may 401)'}\n`);

  const all = [...endpoints, ...optionalEndpoints()];
  const results = [];

  for (const ep of all) {
    const r = await request('GET', ep.path, { query: ep.query });
    results.push({ ...ep, ...r });
    const mark = r.ok ? 'PASS' : 'FAIL';
    console.log(`${mark.padEnd(5)} ${r.status}  ${ep.name}`);
    if (!r.ok && r.payload?.message) console.log(`       ${r.payload.message}`);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n--- ${passed} passed, ${failed} failed (${results.length} total) ---`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
