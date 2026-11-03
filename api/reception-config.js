export const config = { runtime: 'edge' };

import stores from '../data/reception-stores.json';

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });

  const url = new URL(req.url);
  const storeId = String(url.searchParams.get('storeId') || '');
  const store = stores[storeId];
  if (!store) return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404, headers });

  return new Response(JSON.stringify({
    storeId: store.storeId,
    storeName: store.storeName,
    category: store.category,
    contactUrl: store.contactUrl,
    contactLabel: store.contactLabel,
    questions: store.questions,
    resultPolicy: store.resultPolicy
  }), { status: 200, headers });
}
