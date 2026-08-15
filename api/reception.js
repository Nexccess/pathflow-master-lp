/**
 * Path-Flow Lite reception endpoint
 * End-user interview -> gentle guidance.
 * Nail stores share one industry question/prompt policy; store facts remain store-specific.
 */
export const config = { runtime: 'edge' };

import storeProfiles from '../data/store-profiles.json';
import nailPack from '../data/industry-packs/nail.json';
import yokohamaStores from '../data/nail-stores/yokohama.json';
import kawasakiStores from '../data/nail-stores/kawasaki.json';
import chibaStores from '../data/nail-stores/chiba.json';
import funabashiStores from '../data/nail-stores/funabashi.json';
import urawaStores from '../data/nail-stores/urawa.json';
import omiyaStores from '../data/nail-stores/omiya.json';

const nailStores = {
  ...yokohamaStores,
  ...kawasakiStores,
  ...chibaStores,
  ...funabashiStores,
  ...urawaStores,
  ...omiyaStores,
};

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS = ['gemini-2.5-flash-lite'];

function hydrateNailStore(raw) {
  return {
    storeId: String(raw.storeId),
    facts: {
      storeName: raw.storeName,
      category: raw.category || 'ネイルサロン',
      address: raw.address || '',
      phone: raw.phone || '',
      hours: [],
      rating: raw.rating,
      reviewCount: raw.reviewCount,
      paymentMethods: [],
      menus: [],
      otherVerifiedFacts: raw.verifiedFacts || []
    },
    experience: {
      reception: {
        recommendationPolicy: nailPack.recommendationPolicy,
        ctaLabel: 'この内容で相談してみる',
        questions: []
      }
    }
  };
}

function resolveStore(storeId) {
  const id = String(storeId);
  if (nailStores[id]) return hydrateNailStore(nailStores[id]);
  return storeProfiles[id] || null;
}

function resolveIndustryPack(store) {
  return String(store?.facts?.category || '').includes('ネイル') ? nailPack : null;
}

function resolveQuestions(store) {
  const pack = resolveIndustryPack(store);
  if (pack?.questionSet?.length) return pack.questionSet.map(q => ({ id: q.id, text: q.label, options: q.options }));
  return store.experience.reception.questions;
}

function buildSystemPrompt(store) {
  const pack = resolveIndustryPack(store);
  const verifiedFacts = [
    `店舗名: ${store.facts.storeName}`,
    `業種: ${store.facts.category}`,
    ...((store.facts.otherVerifiedFacts || []).map((x) => `確認済み事実: ${x}`)),
  ].join('\n');

  const industryRules = pack ? `\n【ネイル業種共通方針】\n${pack.principles.map(x => `- ${x}`).join('\n')}\n\n【共通案内ルール】\n${pack.recommendationPolicy}` : '';

  return `あなたは店舗サイト上の「受付・ヒアリング担当」です。店舗経営者へのコンサルタントではありません。
来店を検討しているエンドユーザーの回答を先に聞き、希望を整理し、次に何を相談するとよいかを穏やかに案内してください。

【最重要方針】
- まず聞く。売り込まない。
- ユーザーの回答を短く整理する。
- 「あなたならこの方向から相談すると話が早そうです」という程度の弱い提案に留める。
- 不安を煽らない。
- 店舗の経営課題、売上、リピート率、集客改善などは一切扱わない。
- 確認済みでないメニュー名、価格、施術、効果、品質、資格、設備を作らない。
- 医療的な診断・治療効果を述べない。
${industryRules}

【確認済み情報】
${verifiedFacts}

【この店舗での受付方針】
${store.experience.reception.recommendationPolicy}

以下のJSONだけを返してください。
{
  "headline": "<利用者への短い結論>",
  "summary": "<回答内容の整理。2文以内>",
  "suggestion": "<予約・問い合わせ時に何を伝えると相談しやすいか。2文以内>",
  "reason": "<回答に基づく理由。1〜2文>",
  "nextAction": "<穏やかな次の一歩>"
}`;
}

async function callGemini(apiKey, store, answers) {
  const questions = resolveQuestions(store);
  const userContent = questions.map((q, i) => `Q${i + 1}. ${q.text}\nA: ${answers[i] || '未回答'}`).join('\n\n');

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          systemInstruction: { parts: [{ text: buildSystemPrompt(store) }] },
          generationConfig: { temperature: 0.2, maxOutputTokens: 700, responseMimeType: 'application/json' }
        })
      });

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        throw new Error(`Gemini ${model} error ${res.status}: ${err.slice(0, 240)}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { ...JSON.parse(text.replace(/```json|```/g, '').trim()), model };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Gemini request failed');
}

function fallback(store, answers) {
  const purpose = answers[0] || '希望';
  const appearance = answers[1] || '見た目のイメージ';
  const scene = answers[2] || '利用シーン';
  return {
    headline: '希望をそのまま伝えて相談するのがよさそうです。',
    summary: `今回は「${purpose}」が近く、見た目は「${appearance}」を意識されているようです。「${scene}」という場面も一緒に伝えると整理しやすそうです。`,
    suggestion: '予約・問い合わせ時に、今回選んだ希望をそのまま伝えてください。具体的なメニュー名を決めてから相談する必要はありません。',
    reason: 'メニューを先に決め打ちするより、希望する見え方や利用場面を共有する方が、相談の入口を作りやすいためです。',
    nextAction: store.experience.reception.ctaLabel,
    _fallback: true
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

  const store = resolveStore(body.storeId);
  if (!store) return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404, headers });

  const questions = resolveQuestions(store);
  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    return new Response(JSON.stringify({ error: '回答数が一致しません。' }), { status: 400, headers });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ ...fallback(store, answers), _error: 'GEMINI_API_KEY missing' }), { status: 200, headers });

  try {
    const result = await callGemini(apiKey, store, answers);
    return new Response(JSON.stringify({ ...result, storeId: store.storeId }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ ...fallback(store, answers), _error: err?.message || 'unknown error' }), { status: 200, headers });
  }
}
