const webhook = process.env.GAS_WEBHOOK_URL;
if (!webhook) {
  console.error('GAS_WEBHOOK_URL is required');
  process.exit(2);
}

const payload = {
  event: process.env.PATHFLOW_TEST_EVENT || 'store_contact_click',
  storeId: process.env.PATHFLOW_STORE_ID || '9',
  path: process.env.PATHFLOW_TEST_PATH || '/p/9/reception',
  handoffText: '11B TRACKING_CONFIRMED test',
  timestamp: new Date().toISOString()
};

const res = await fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  redirect: 'follow'
});

const text = await res.text();
let body;
try { body = JSON.parse(text); } catch { body = null; }

console.log(`HTTP ${res.status}`);
console.log(text);

if (!res.ok) throw new Error(`Webhook HTTP ${res.status}`);
if (!body?.persisted) throw new Error('Webhook did not confirm persisted:true');
if (String(body.storeId || '') !== String(payload.storeId)) throw new Error('storeId confirmation mismatch');
if (String(body.event || '') !== String(payload.event)) throw new Error('event confirmation mismatch');

console.log('TRACKING WEBHOOK TEST: PASS');
