const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const token = process.env.PRODUCTION_TEST_TOKEN;
const companyId = process.env.TEST_COMPANY_ID || '20000000-0000-0000-0000-000000000001';

if (!token) {
  console.error('Set PRODUCTION_TEST_TOKEN');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function check(method, path, body) {
  const res = await fetch(`${base}/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  console.log(method, path, res.status, text.slice(0, 120));
  if (!res.ok) throw new Error(`Failed ${path}`);
}

await check('GET', `sewing-lines?companyId=${companyId}`);
await check('GET', `production/line-plans?companyId=${companyId}`);
await check('GET', `shipments/executions?companyId=${companyId}`);
console.log('Production smoke OK');
