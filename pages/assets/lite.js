(() => {
  const qs = new URLSearchParams(location.search);
  const storeId = qs.get('id') || location.pathname.split('/').filter(Boolean).pop();
  let store = null;
  let industryPack = null;
  let current = 0;
  let answers = [];
  let lastResult = null;

  const $ = (id) => document.getElementById(id);

  function hydrateNailStore(raw) {
    const verifiedFacts = raw.verifiedFacts || [];
    const features = verifiedFacts.map(fact => ({
      title: fact,
      text: `公開情報に「${fact}」の記載があります。`
    }));
    if (features.length < 3 && raw.address) {
      features.push({ title: '所在地', text: raw.address });
    }
    if (features.length < 3) {
      features.push({ title: '受付スタイル', text: '5つの質問で、予約前に伝えたい希望を整理します。' });
    }

    return {
      schemaVersion: '1.3',
      storeId: String(raw.storeId),
      facts: {
        storeName: raw.storeName,
        category: raw.category || 'ネイルサロン',
        address: raw.address || '',
        phone: raw.phone || '',
        websiteUrl: raw.websiteUrl || '',
        bookingUrl: raw.bookingUrl || '',
        contactUrl: raw.contactUrl || '',
        placeId: raw.placeId || '',
        hours: [],
        rating: raw.rating,
        reviewCount: raw.reviewCount,
        paymentMethods: [],
        menus: [],
        otherVerifiedFacts: verifiedFacts
      },
      experience: {
        eyebrow: 'NAIL RECEPTION',
        headline: '何を選ぶか\n決まってますか？\n決まってなくても、希望は整理できます。',
        lead: '5つだけ聞かせてください。予約前に、どんなことを相談したいか一緒に整理します。',
        features: features.slice(0, 3),
        flow: ['希望を少しだけ聞く','一緒に整理する','その内容で店舗へ相談'],
        reception: {
          intro: '正解を当てる診断ではなく、予約前に希望を整理するための受付です。',
          questions: [],
          recommendationPolicy: '回答を短く要約し、予約・問い合わせ時に伝えると相談が進めやすい希望を1つ案内する。入力で確認できないメニュー名、価格、所要時間、効果、会員制度は出さない。',
          ctaLabel: 'この内容で相談してみる'
        }
      }
    };
  }

  async function loadStore() {
    const [storeRes, nailPackRes, nailStoresRes] = await Promise.all([
      fetch('/data/store-profiles.json', { cache: 'no-store' }),
      fetch('/data/industry-packs/nail.json', { cache: 'no-store' }),
      fetch('/data/nail-stores.json', { cache: 'no-store' })
    ]);
    if (!storeRes.ok) throw new Error('店舗データを読み込めませんでした。');
    const all = await storeRes.json();
    const nailStores = nailStoresRes.ok ? await nailStoresRes.json() : {};
    store = nailStores[String(storeId)] ? hydrateNailStore(nailStores[String(storeId)]) : all[String(storeId)];
    if (!store) throw new Error(`店舗ID ${storeId} は未登録です。`);

    if (nailPackRes.ok && String(store.facts.category || '').includes('ネイル')) industryPack = await nailPackRes.json();
    renderStore();
    renderQuestions();
    renderContactRoute();
  }

  function getQuestions() {
    if (industryPack?.questionSet?.length) return industryPack.questionSet.map(q => ({ id: q.id, text: q.label, options: q.options }));
    return store.experience.reception.questions;
  }

  function renderStore() {
    const e = store.experience;
    const f = store.facts;
    document.title = `${f.storeName}｜Path-Flow Lite`;
    $('eyebrow').textContent = e.eyebrow || 'PATH-FLOW LITE';
    $('headline').textContent = industryPack ? '何を選ぶか\n決まってますか？\n決まってなくても、希望は整理できます。' : e.headline;
    $('lead').textContent = e.lead;
    $('storeName').textContent = f.storeName;
    $('category').textContent = f.category;
    $('rating').textContent = f.rating ? `${f.rating} (${f.reviewCount || '—'}件)` : '—';
    $('receptionIntro').textContent = '5つだけ聞かせてください。正解を当てる診断ではなく、予約前に希望を整理するための受付です。';
    $('features').innerHTML = e.features.map(x => `<article class="card"><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.text)}</p></article>`).join('');
    $('flow').innerHTML = e.flow.map((x, i) => `<div><b>${String(i + 1).padStart(2, '0')}</b><span>${escapeHtml(x)}</span></div>`).join('');
    $('contactStoreName').textContent = f.storeName;
    $('contactAddress').textContent = f.address || '所在地は公式案内でご確認ください。';
    $('contactPhone').textContent = f.phone ? `TEL ${f.phone}` : '電話番号は公式案内でご確認ください。';
  }

  function routeInfo() {
    const f = store?.facts || {};
    if (f.bookingUrl) return { url: f.bookingUrl, label: 'Web予約へ', kind: 'booking' };
    if (f.contactUrl) return { url: f.contactUrl, label: 'Webで問い合わせる', kind: 'contact' };
    if (f.websiteUrl) return { url: f.websiteUrl, label: '公式サイトへ', kind: 'website' };
    if (f.phone) return { url: `tel:${String(f.phone).replace(/[^0-9+]/g, '')}`, label: '電話で問い合わせる', kind: 'phone' };
    return null;
  }

  function externalAttrs(url) {
    return /^https?:/i.test(url) ? 'target="_blank" rel="noopener noreferrer"' : '';
  }

  function renderContactRoute() {
    const f = store.facts;
    const route = routeInfo();
    const actions = [];
    const seen = new Set();

    const pushAction = (url, label, primary = false) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      actions.push(`<a class="contact-action${primary ? ' primary' : ''}" href="${escapeAttr(url)}" ${externalAttrs(url)}>${escapeHtml(label)}</a>`);
    };

    // Standard Path-Flow Lite hand-off routes. Show every verified route that exists.
    pushAction(f.bookingUrl, 'Web予約へ', true);
    pushAction(f.contactUrl, 'Webで問い合わせる', !f.bookingUrl);
    if (f.phone) {
      const tel = `tel:${String(f.phone).replace(/[^0-9+]/g, '')}`;
      pushAction(tel, '電話する', !f.bookingUrl && !f.contactUrl);
    }
    pushAction(f.websiteUrl, '公式サイトへ', !f.bookingUrl && !f.contactUrl && !f.phone);

    if (!actions.length) {
      actions.push('<a class="contact-action" href="#storeContact">連絡先を確認中です</a>');
    }
    $('contactActions').innerHTML = actions.join('');

    // Hero / mobile / result CTA use the best single verified route.
    const topTargets = [$('heroRoute'), $('mobileRoute'), $('resultRoute')];
    topTargets.forEach(el => {
      if (!el) return;
      if (route) {
        el.href = route.url;
        el.textContent = el.id === 'mobileRoute' ? (route.kind === 'booking' ? '予約する' : '店舗へ') : route.label;
        if (/^https?:/i.test(route.url)) {
          el.target = '_blank';
          el.rel = 'noopener noreferrer';
        }
      } else {
        el.href = '#storeContact';
        el.textContent = el.id === 'mobileRoute' ? '店舗情報' : '店舗の連絡先を見る';
      }
    });
  }

  function renderQuestions() {
    const list = getQuestions();
    answers = new Array(list.length).fill(null);
    $('questions').innerHTML = list.map((q, qi) => `
      <section class="question ${qi === 0 ? 'active' : ''}" data-index="${qi}">
        <div class="mono">QUESTION ${qi + 1} / ${list.length}</div>
        <h3>${escapeHtml(q.text)}</h3>
        <div class="options">${q.options.map((opt, oi) => `<button type="button" class="option" data-q="${qi}" data-o="${oi}" aria-pressed="false">${escapeHtml(opt)}</button>`).join('')}</div>
      </section>`).join('');

    document.querySelectorAll('.option').forEach(btn => {
      btn.addEventListener('click', () => {
        const qi = Number(btn.dataset.q);
        const oi = Number(btn.dataset.o);
        answers[qi] = list[qi].options[oi];
        document.querySelectorAll(`.option[data-q="${qi}"]`).forEach(x => {
          x.classList.remove('selected');
          x.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      });
    });

    $('backBtn').addEventListener('click', back);
    $('nextBtn').addEventListener('click', next);
    $('editAnswersBtn')?.addEventListener('click', editAnswers);
    $('copyResultBtn')?.addEventListener('click', copyResult);
    updateControls();
  }

  function showQuestion(index) {
    document.querySelectorAll('.question').forEach((el, i) => el.classList.toggle('active', i === index));
    current = index;
    updateControls();
  }

  function updateControls() {
    const total = getQuestions().length;
    $('backBtn').style.visibility = current === 0 ? 'hidden' : 'visible';
    const remaining = total - current - 1;
    $('nextBtn').textContent = current === total - 1 ? '受付結果を見る' : `次へ（あと${remaining}問）`;
    $('progressBar').style.width = `${((current + 1) / total) * 100}%`;
  }

  function back() { if (current > 0) showQuestion(current - 1); }

  function editAnswers() {
    $('reception').classList.remove('completed');
    $('result').classList.remove('show');
    showQuestion(current);
    $('questions').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function next() {
    if (!answers[current]) { alert('一つ選んでください。'); return; }
    const total = getQuestions().length;
    if (current < total - 1) { showQuestion(current + 1); return; }
    await diagnose();
  }

  async function diagnose() {
    const btn = $('nextBtn');
    btn.disabled = true;
    btn.textContent = '整理しています…';
    try {
      const res = await fetch('/api/reception', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId, answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '受付結果を取得できませんでした。');
      lastResult = data;
      $('resultHeadline').textContent = data.headline || '';
      $('resultSummary').textContent = data.summary || '';
      $('resultSuggestion').textContent = data.suggestion || '';
      $('resultReason').textContent = data.reason || '';
      $('resultAction').textContent = data.nextAction || store.experience.reception.ctaLabel || '';
      $('reception').classList.add('completed');
      $('result').classList.add('show');
      $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      alert(err.message || 'エラーが発生しました。');
    } finally {
      btn.disabled = false;
      btn.textContent = '受付結果を見る';
    }
  }

  async function copyResult() {
    if (!lastResult) return;
    const text = [
      `店舗：${store.facts.storeName}`,
      `希望：${lastResult.summary || ''}`,
      `相談時の伝え方：${lastResult.suggestion || ''}`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      const btn = $('copyResultBtn');
      const old = btn.textContent;
      btn.textContent = 'コピーしました';
      setTimeout(() => { btn.textContent = old; }, 1600);
    } catch {
      alert('コピーできませんでした。文章を選択してコピーしてください。');
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  loadStore().catch(err => {
    document.body.innerHTML = `<main style="padding:40px;font-family:sans-serif"><h1>Path-Flow Lite</h1><p>${escapeHtml(err.message)}</p></main>`;
  });
})();
