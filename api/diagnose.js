/**
 * api/diagnose.js
 * Gemini API を用いた店舗別 AI 業務改善診断エンドポイント（多店舗対応版）
 *
 * 環境変数:
 *   GEMINI_API_KEY  — Google AI Studio API Key
 *
 * リクエスト (POST):
 *   { storeId: string, answers: string[] }  // storeId未指定時は _default テンプレートを使用
 *
 * レスポンス:
 *   { score, level, summary, issues, nextAction }
 */

export const config = { runtime: 'edge' };

import storesData from '../data/stores.json';

const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro'];
const GEMINI_BASE   = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_STORE_KEY = '_default';

/**
 * storeId から店舗別設定（questions / systemPromptExtra 等）を取得。
 * 未登録の場合は _default にフォールバックする。
 */
function resolveStoreConfig(storeId) {
  const fallback = storesData[DEFAULT_STORE_KEY];
  if (!storeId) return { ...fallback, storeId: null };

  const store = storesData[storeId];
  if (!store) return { ...fallback, storeId };

  // 店舗固有の questions / systemPromptExtra が未設定の項目は _default で補完
  return {
    ...fallback,
    ...store,
    storeId,
  };
}

function buildSystemPrompt(storeConfig) {
  const storeLabel = storeConfig.storeName ? `店舗名: ${storeConfig.storeName}\n` : '';
  return `あなたは店舗経営改善コンサルティングの専門AI診断システムです。
${storeLabel}ユーザーの5つの回答を分析し、経営における課題と優先アクションを特定してください。
${storeConfig.systemPromptExtra || ''}

以下のJSON形式のみで回答してください。マークダウンやコードブロックは使用しないこと。

{
  "score": <0〜100の整数>,
  "level": <"A（緊急対応推奨）" | "B（早期対応推奨）" | "C（計画的対応）">,
  "summary": "<現状の課題を2〜3文で要約>",
  "issues": ["<課題1>", "<課題2>", "<課題3>"],
  "nextAction": "<最優先で取り組むべき具体的な1つのアクション>"
}

スコア基準:
- 0〜39: リスクが高い（レベルA）
- 40〜69: 対策が必要（レベルB）
- 70〜100: 基礎はあるが最適化の余地あり（レベルC）`;
}

async function callGemini(apiKey, model, answers, storeConfig) {
  const questions = storeConfig.questions;
  const systemPrompt = buildSystemPrompt(storeConfig);

  const userContent = questions
    .map((q, i) => `Q${i + 1}. ${q}\nA: ${answers[i] || '未回答'}`)
    .join('\n\n');

  const body = {
    contents: [
      { role: 'user', parts: [{ text: userContent }] },
    ],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Gemini ${model} error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY が未設定です。' }), { status: 500, headers });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'リクエストボディの解析に失敗しました。' }), { status: 400, headers });
  }

  const { storeId, answers } = body;
  if (!Array.isArray(answers) || answers.length !== 5) {
    return new Response(JSON.stringify({ error: '5問分の回答が必要です。' }), { status: 400, headers });
  }

  const storeConfig = resolveStoreConfig(storeId);

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      const result = await callGemini(apiKey, model, answers, storeConfig);
      return new Response(JSON.stringify({ ...result, model, storeId: storeConfig.storeId }), { status: 200, headers });
    } catch (e) {
      lastError = e;
    }
  }

  // フォールバック: 全モデル失敗時はルールベースで返却
  const fallback = generateFallback(answers, storeConfig);
  return new Response(
    JSON.stringify({ ...fallback, storeId: storeConfig.storeId, _fallback: true, _error: lastError?.message }),
    { status: 200, headers }
  );
}

/**
 * Gemini 全失敗時のルールベースフォールバック（業種非依存の汎用ロジック）
 */
function generateFallback(answers, storeConfig) {
  let score = 60;
  const issues = [];

  const [priority, repeatRate, reviews, booking, goal] = answers;

  if (repeatRate && (repeatRate.includes('低い') || repeatRate.includes('少ない'))) {
    score -= 20;
    issues.push('リピート率の低さが、売上の安定化を阻害している可能性があります');
  }
  if (reviews && (reviews.includes('していない') || reviews.includes('なし'))) {
    score -= 10;
    issues.push('口コミ・Google評価への対応が、新規顧客獲得の機会損失につながっています');
  }
  if (booking && booking.includes('手動')) {
    score -= 10;
    issues.push('予約・顧客管理が手動運用のため、スタッフの負担増と機会損失のリスクがあります');
  }

  score = Math.max(10, Math.min(90, score));
  const level = score < 40 ? 'A（緊急対応推奨）' : score < 70 ? 'B（早期対応推奨）' : 'C（計画的対応）';

  if (issues.length === 0) issues.push('現状の可視化と、継続的な改善サイクルの構築が必要です');

  const storeLabel = storeConfig.storeName ? `${storeConfig.storeName}様の` : '';

  return {
    score,
    level,
    summary: `${storeLabel}現状分析の結果、経営改善スコアは${score}点です。${goal || '今後の目標'}の実現に向けて、専門家との相談を推奨します。`,
    issues,
    nextAction: 'まず口コミ対応とリピート施策の現状を棚卸しし、優先度の高い施策から着手してください。',
  };
}
