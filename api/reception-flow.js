export const config = { runtime: 'edge' };

import stores from '../data/reception-stores.json';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

function fallback(store, answers) {
  const pairs = store.questions.map((q, i) => `${q.text} → ${answers[i]}`).join(' / ');
  return {
    headline: store.resultPolicy?.headline || '希望を整理しました',
    summary: `今回の希望は「${answers[0]}」が中心です。イメージは「${answers[1]}」、避けたい点は「${answers[2]}」として整理できます。`,
    suggestion: `普段のスタイリングは「${answers[3]}」、カウンセリングは「${answers[4]}」を希望していることを美容師へ伝えると、相談の入口が作りやすくなります。`,
    specialistNote: store.resultPolicy?.disclaimer || '実際の状態確認が必要な内容は店舗スタッフへご相談ください。',
    handoffText: pairs,
    _fallback: true
  };
}

async function callGemini(apiKey, store, answers) {
  const qa = store.questions.map((q, i) => `Q${i + 1}. ${q.text}\nA. ${answers[i]}`).join('\n\n');
  const prompt = `${store.systemPrompt}\n\n以下のJSONだけを返してください。\n{\n  "headline": "<短い結論>",\n  "summary": "<回答の整理。2文以内>",\n  "suggestion": "<美容師に伝えるとよい内容。2文以内>",\n  "specialistNote": "<専門判断が必要な点を自然に店舗相談へつなぐ一文>",\n  "handoffText": "<店舗スタッフへそのまま渡せる短い相談メモ>"\n}`;

  const res = await fetch(`${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: qa }] }],
      systemInstruction: { parts: [{ text: prompt }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 700, responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

  const storeId = String(body.storeId || '');
  const store = stores[storeId];
  if (!store) return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404, headers });

  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length !== store.questions.length || answers.some(v => !String(v || '').trim())) {
    return new Response(JSON.stringify({ error: '5問すべての回答が必要です。' }), { status: 400, headers });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let result;
  try {
    result = apiKey ? await callGemini(apiKey, store, answers) : fallback(store, answers);
  } catch (err) {
    result = { ...fallback(store, answers), _error: err?.message || 'generation failed' };
  }

  return new Response(JSON.stringify({ ...result, storeId, contactUrl: store.contactUrl, contactLabel: store.contactLabel }), { status: 200, headers });
}
