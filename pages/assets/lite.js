(() => {
  const qs = new URLSearchParams(location.search);
  const storeId = qs.get('id') || location.pathname.split('/').filter(Boolean).pop();
  let store = null;
  let current = 0;
  let answers = [];

  const $ = (id) => document.getElementById(id);

  async function loadStore() {
    const res = await fetch('/data/store-profiles.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('店舗データを読み込めませんでした。');
    const all = await res.json();
    store = all[String(storeId)];
    if (!store) throw new Error(`店舗ID ${storeId} は未登録です。`);
    renderStore();
    renderQuestions();
  }

  function renderStore() {
    const e = store.experience;
    const f = store.facts;
    document.title = `${f.storeName}｜Path-Flow Lite`;
    $('eyebrow').textContent = e.eyebrow || 'PATH-FLOW LITE';
    $('headline').textContent = e.headline;
    $('lead').textContent = e.lead;
    $('storeName').textContent = f.storeName;
    $('category').textContent = f.category;
    $('rating').textContent = f.rating ? `${f.rating} (${f.reviewCount || '—'}件)` : '—';
    $('receptionIntro').textContent = e.reception.intro;

    $('features').innerHTML = e.features.map(x => `
      <article class="card"><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.text)}</p></article>
    `).join('');

    $('flow').innerHTML = e.flow.map((x, i) => `
      <div><b>${String(i + 1).padStart(2, '0')}</b>${escapeHtml(x)}</div>
    `).join('');
  }

  function renderQuestions() {
    const list = store.experience.reception.questions;
    answers = new Array(list.length).fill(null);
    $('questions').innerHTML = list.map((q, qi) => `
      <section class="question ${qi === 0 ? 'active' : ''}" data-index="${qi}">
        <div class="mono">QUESTION ${qi + 1} / ${list.length}</div>
        <h3>${escapeHtml(q.text)}</h3>
        <div class="options">
          ${q.options.map((opt, oi) => `<button type="button" class="option" data-q="${qi}" data-o="${oi}">${escapeHtml(opt)}</button>`).join('')}
        </div>
      </section>
    `).join('');

    document.querySelectorAll('.option').forEach(btn => {
      btn.addEventListener('click', () => {
        const qi = Number(btn.dataset.q);
        const oi = Number(btn.dataset.o);
        answers[qi] = list[qi].options[oi];
        document.querySelectorAll(`.option[data-q="${qi}"]`).forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    $('backBtn').addEventListener('click', back);
    $('nextBtn').addEventListener('click', next);
    updateControls();
  }

  function showQuestion(index) {
    document.querySelectorAll('.question').forEach((el, i) => el.classList.toggle('active', i === index));
    current = index;
    updateControls();
  }

  function updateControls() {
    const total = store.experience.reception.questions.length;
    $('backBtn').style.visibility = current === 0 ? 'hidden' : 'visible';
    $('nextBtn').textContent = current === total - 1 ? '受付結果を見る' : '次へ';
    $('progressBar').style.width = `${((current + 1) / total) * 100}%`;
  }

  function back() {
    if (current > 0) showQuestion(current - 1);
  }

  async function next() {
    if (!answers[current]) {
      alert('一つ選んでください。');
      return;
    }
    const total = store.experience.reception.questions.length;
    if (current < total - 1) {
      showQuestion(current + 1);
      return;
    }
    await diagnose();
  }

  async function diagnose() {
    const btn = $('nextBtn');
    btn.disabled = true;
    btn.textContent = '整理しています…';
    try {
      const res = await fetch('/api/reception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '受付結果を取得できませんでした。');
      $('resultHeadline').textContent = data.headline || '';
      $('resultSummary').textContent = data.summary || '';
      $('resultSuggestion').textContent = data.suggestion || '';
      $('resultReason').textContent = data.reason || '';
      $('resultAction').textContent = data.nextAction || store.experience.reception.ctaLabel || '';
      $('result').classList.add('show');
      $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      alert(err.message || 'エラーが発生しました。');
    } finally {
      btn.disabled = false;
      btn.textContent = 'もう一度見る';
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  loadStore().catch(err => {
    document.body.innerHTML = `<main style="padding:40px;font-family:sans-serif"><h1>Path-Flow Lite</h1><p>${escapeHtml(err.message)}</p></main>`;
  });
})();
