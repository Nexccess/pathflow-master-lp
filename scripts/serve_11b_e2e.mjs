import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const stores = JSON.parse(fs.readFileSync(path.join(root, 'data/reception-stores.json'), 'utf8'));
const receptionHtml = fs.readFileSync(path.join(root, 'pages/reception.html'), 'utf8');
const trackEvents = [];

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function fallback(store, answers) {
  const pairs = store.questions.map((q, i) => `${q.text} → ${answers[i]}`).join(' / ');
  return {
    headline: store.resultPolicy?.headline || '希望を整理しました',
    summary: `今回の希望は「${answers[0]}」が中心です。イメージは「${answers[1]}」、避けたい点は「${answers[2]}」として整理できます。`,
    suggestion: `普段のスタイリングは「${answers[3]}」、カウンセリングは「${answers[4]}」を希望していることを美容師へ伝えると、相談の入口が作りやすくなります。`,
    specialistNote: store.resultPolicy?.disclaimer || '実際の状態確認が必要な内容は店舗スタッフへご相談ください。',
    handoffText: pairs,
    _fallback: true,
    storeId: store.storeId,
    contactUrl: store.contactUrl,
    contactLabel: store.contactLabel
  };
}

async function readJson(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  return JSON.parse(data || '{}');
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:3000');
  if (u.pathname === '/p/9/reception' || u.pathname === '/pages/reception.html') {
    return send(res, 200, receptionHtml, 'text/html; charset=utf-8');
  }
  if (u.pathname === '/api/reception-config') {
    const store = stores[String(u.searchParams.get('storeId') || '')];
    if (!store) return send(res, 404, { error: 'Store not found' });
    return send(res, 200, {
      storeId: store.storeId, storeName: store.storeName, category: store.category,
      contactUrl: store.contactUrl, contactLabel: store.contactLabel,
      questions: store.questions, resultPolicy: store.resultPolicy
    });
  }
  if (u.pathname === '/api/reception-flow' && req.method === 'POST') {
    const body = await readJson(req).catch(() => null);
    if (!body) return send(res, 400, { error: 'Invalid JSON' });
    const store = stores[String(body.storeId || '')];
    if (!store) return send(res, 404, { error: 'Store not found' });
    const answers = body.answers;
    if (!Array.isArray(answers) || answers.length !== store.questions.length || answers.some(v => !String(v || '').trim())) {
      return send(res, 400, { error: '5問すべての回答が必要です。' });
    }
    return send(res, 200, fallback(store, answers));
  }
  if (u.pathname === '/api/track' && req.method === 'POST') {
    const body = await readJson(req).catch(() => ({}));
    trackEvents.push({ ...body, timestamp: new Date().toISOString() });
    return send(res, 200, { ok: true });
  }
  if (u.pathname === '/__e2e/tracks') return send(res, 200, { events: trackEvents });
  return send(res, 404, { error: 'Not found' });
});

server.listen(3000, '127.0.0.1', () => console.log('11B E2E server listening on http://127.0.0.1:3000'));
