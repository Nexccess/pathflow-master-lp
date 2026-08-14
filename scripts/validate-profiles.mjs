import fs from 'node:fs';

const profiles = JSON.parse(fs.readFileSync(new URL('../data/store-profiles.json', import.meta.url), 'utf8'));

const subjectiveClaims = ['丁寧', '安心', '高品質', '高技術', '確かな技術', '人気', '評判', '信頼'];
let failed = 0;

for (const [id, store] of Object.entries(profiles)) {
  const errors = [];
  const warnings = [];
  const facts = store.facts || {};
  const exp = store.experience || {};
  const reception = exp.reception || {};
  const text = JSON.stringify(exp);

  if (!facts.storeName) errors.push('storeName missing');
  if (!facts.category) errors.push('category missing');
  if (!exp.headline) errors.push('headline missing');
  if (!exp.lead) errors.push('lead missing');
  if (!Array.isArray(reception.questions) || reception.questions.length < 3 || reception.questions.length > 7) {
    errors.push('reception questions must be 3-7');
  }

  for (const q of reception.questions || []) {
    if (!q.id || !q.text || !Array.isArray(q.options) || q.options.length < 2) errors.push(`invalid question: ${q.id || 'unknown'}`);
  }

  const menus = facts.menus || [];
  if (menus.length === 0 && /おすすめメニュー|コース|プラン/.test(text)) {
    warnings.push('menu-like copy exists while verified menus are empty');
  }

  const evidence = store.reviewAnalysis?.qualityClaimEvidence || [];
  for (const word of subjectiveClaims) {
    if (text.includes(word) && evidence.length === 0) errors.push(`unsupported subjective claim candidate: ${word}`);
  }

  if (store.reviewAnalysis?.doNotPromote?.some(x => x && text.includes(x))) {
    errors.push('doNotPromote content leaked into experience copy');
  }

  const status = errors.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS';
  if (errors.length) failed++;
  console.log(JSON.stringify({ storeId: id, storeName: facts.storeName, status, errors, warnings }, null, 2));
}

if (failed) {
  console.error(`\nValidation failed: ${failed} profile(s).`);
  process.exit(1);
}
console.log(`\nValidation passed for ${Object.keys(profiles).length} profile(s).`);
