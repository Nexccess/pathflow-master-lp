export const config = { runtime: 'edge' };

import stores from '../data/reception-stores.json';

const PRIORITY_WEIGHTS = [1.4, 2.0, 1.6, 1.4, 2.0];

function legacyFallback(store, answers) {
  const pairs = store.questions.map((q, i) => `${q.text} → ${answers[i]}`).join(' / ');
  return {
    headline: store.resultPolicy?.headline || '希望を整理しました',
    prioritizedNeeds: answers.slice(0, 3),
    summary: `今回のご回答をもとに、店舗で相談するときに大切にしたいことを整理しました。`,
    consultationMessage: pairs,
    suggestion: `特に大切にしたいものから店舗でお伝えいただくと、ご希望の方向性を確認しながら相談を進めやすくなると思います。`,
    specialistNote: store.resultPolicy?.disclaimer || '実際の状態確認が必要な内容は店舗スタッフへご相談ください。',
    handoffText: pairs,
    _fallback: true
  };
}

function scoreSemanticTags(store, answers) {
  const scores = new Map();
  const evidence = [];
  store.questions.forEach((q, qi) => {
    const answer = answers[qi];
    const oi = q.options.indexOf(answer);
    if (oi < 0) throw new Error(`Invalid answer at Q${qi + 1}`);
    const tags = Array.isArray(q.tags?.[oi]) ? q.tags[oi] : [];
    const weight = PRIORITY_WEIGHTS[qi] || 1;
    tags.forEach((tag, ti) => {
      const bonus = ti === 0 ? 0.25 : 0;
      scores.set(tag, (scores.get(tag) || 0) + weight + bonus);
    });
    evidence.push({ questionId: q.id, answer, tags });
  });
  return { scores, evidence };
}

function semanticResult(store, answers) {
  const { scores, evidence } = scoreSemanticTags(store, answers);
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, 3).map(([tag]) => tag);
  const labels = top.map(tag => store.tagLabels?.[tag] || tag);
  const fallbackLabels = labels.length ? labels : answers.slice(0, 3);
  const consultationMessage = `今回大切にしたいことは「${fallbackLabels.join('・')}」です。実際の髪の状態を見ていただきながら、無理のない方向を相談したいです。`;
  return {
    headline: store.resultPolicy?.headline || 'お客さまの希望を整理しました',
    intro: '今回のご回答をもとに、店舗で相談するときに大切にしたいことを整理しました。',
    prioritizedNeeds: fallbackLabels,
    summary: fallbackLabels.length === 1 ? `特に「${fallbackLabels[0]}」を大切にしたいようです。` : `「${fallbackLabels.join('」「')}」を大切にしたい方向として整理できます。`,
    suggestion: 'この中でも、特に大切にしたいものから店舗でお伝えいただくと、ご希望の方向性を確認しながら相談を進めやすくなると思います。',
    consultationMessage,
    specialistNote: store.resultPolicy?.disclaimer || '髪の状態や施術方法については、実際の状態を確認したうえで店舗へご相談ください。',
    handoffText: consultationMessage,
    semanticEvidence: evidence,
    matrixScores: Object.fromEntries(ranked)
  };
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

  try {
    const result = store.questions.every(q => Array.isArray(q.tags)) ? semanticResult(store, answers) : legacyFallback(store, answers);
    return new Response(JSON.stringify({ ...result, storeId, storeName: store.storeName, contactUrl: store.contactUrl, contactLabel: store.contactLabel }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Result generation failed' }), { status: 400, headers });
  }
}
