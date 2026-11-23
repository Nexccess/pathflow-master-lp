(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [{"title": "今、clampでいちばん相談したいことは？", "options": ["なりたい雰囲気を、写真やことばで整理したい", "残したい長さと、変えたいシルエットを相談したい", "希望する髪色や明るさを相談したい", "生活に合うヘアケアやセットを相談したい"]}, {"title": "希望を伝える前に、確認しておきたいことは？", "options": ["まだ決めきれない希望を、どう伝えるか", "切りたくない長さや、今の形で気になるところ", "今の髪色と、目指したい色の違い", "家で髪を扱うときに、困っていること"]}, {"title": "毎日の髪で、大切にしたいことは？", "options": ["暮らしに合う髪のイメージを考えること", "朝のセット時間に合わせて、長さや形を考えること", "日々の服装に合わせて、髪色の印象を考えること", "自分で続けられるケアやセット方法を知ること"]}, {"title": "相談メモに、最後に添えたい希望は？", "options": ["好きな雰囲気と迷っていることを、一緒に整理したい", "長さや仕上がりのイメージを、切る前に確認したい", "色味や明るさの希望を伝え、施術内容を確認したい", "髪の状態に合わせて、家での手入れを相談したい"]}];
  const results = {"CONSULT": {"type": "相談・希望整理", "title": "希望を、ことばにするところから。", "copy": "「小さな、相談メモ」のように、好きな雰囲気や迷っていることを整理しましょう。写真やことばを手がかりに、今回変えたいことと残したいことを伝える準備に。"}, "CUT": {"type": "カット・シルエット", "title": "残したい長さも、大切な希望。", "copy": "希望した長さや仕上がりのイメージを、切る前に確認するためのメモに。clampの口コミには希望のスタイルを喜ぶ声と、長さやイメージの違いを感じた声があります。朝のセット時間も添えて相談してみましょう。"}, "COLOR": {"type": "カラー", "title": "髪色の希望も、ことばと写真で。", "copy": "色味や明るさ、日々の服装に合わせたい印象を、clampで相談するために整理しましょう。現在のカラーメニューや対応できる内容は、この診断では不明です。予約ページや店舗で確認し、今の髪の状態とともに相談してください。"}, "CARE": {"type": "ケア", "title": "家に帰ってからの髪も、相談のひとつに。", "copy": "clampの口コミには、生活に合わせたヘアケアやセット方法の助言を受けたという声があります。家で困る場面や朝にかけられる時間を伝え、続けられる手入れの方法を相談するメモにしましょう。"}};
  const get = (name) => document.getElementById('diagnosis-' + name);
  const dialog = get('dialog');
  const launch = get('launch');
  const form = get('form');
  const options = get('options');
  const question = get('question');
  const next = get('next');
  const back = get('back');
  const result = get('result');
  const answers = Array(4).fill(null);
  let step = 0;
  let scrollPosition = 0;

  function renderQuestion() {
    form.hidden = false;
    result.hidden = true;
    get('progress').textContent = '質問 ' + (step + 1) + ' / 4';
    get('meter').value = answers.filter((answer) => answer !== null).length;
    question.textContent = 'Q' + (step + 1) + '｜' + questions[step].title;
    options.replaceChildren();
    questions[step].options.forEach((text, index) => {
      const label = document.createElement('label');
      label.className = 'diagnosis-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'diagnosis-answer';
      input.value = String(index);
      input.checked = answers[step] === index;
      const caption = document.createElement('span');
      caption.textContent = text;
      label.append(input, caption);
      options.append(label);
    });
    back.disabled = step === 0;
    next.disabled = answers[step] === null;
    next.textContent = step === 3 ? '結果を見る' : '次へ';
    dialog.scrollTop = 0;
    question.focus();
  }

  function showResult() {
    if (answers.some((answer) => answer === null)) return;
    const scores = [0, 0, 0, 0];
    answers.forEach((answer, index) => { scores[answer] += index === 0 ? 2 : 1; });
    const category = categories[scores.indexOf(Math.max(...scores))];
    const content = results[category];
    form.hidden = true;
    result.hidden = false;
    get('progress').textContent = '4問の回答が完了しました';
    get('meter').value = 4;
    get('type').textContent = content.type;
    get('result-title').textContent = content.title;
    get('result-copy').textContent = content.copy;
    get('wish').textContent = 'いちばん相談したいことは「' + questions[0].options[answers[0]] + '」です。今の髪では「' + questions[1].options[answers[1]] + '」。普段のスタイリングでは「' + questions[2].options[answers[2]] + '」。今回は「' + questions[3].options[answers[3]] + '」を大切にしたいです。髪の状態を見ながら相談したいです。';
    get('summary').replaceChildren();
    answers.forEach((answer, index) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = 'Q' + (index + 1) + '｜' + questions[index].title;
      description.textContent = questions[index].options[answer];
      row.append(term, description);
      get('summary').append(row);
    });
    dialog.scrollTop = 0;
    get('result-title').focus();
  }

  launch.addEventListener('click', () => {
    scrollPosition = window.scrollY;
    dialog.showModal();
    if (form.hidden) get('result-title').focus();
    else renderQuestion();
  });
  get('close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    launch.focus({ preventScroll: true });
  });
  // Native dialog supplies modal background inertness and Escape handling.
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button, a, input')].filter((el) => !el.disabled && el.getClientRects().length && (el.type !== 'radio' || el.checked || !options.querySelector('input:checked') && el === options.querySelector('input')));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  options.addEventListener('change', (event) => {
    if (!event.target.matches('input[type="radio"]')) return;
    answers[step] = Number(event.target.value);
    next.disabled = false;
    get('meter').value = answers.filter((answer) => answer !== null).length;
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (answers[step] === null) return;
    if (step === 3) showResult();
    else {
      step += 1;
      renderQuestion();
    }
  });
  back.addEventListener('click', () => {
    if (step === 0) return;
    step -= 1;
    renderQuestion();
  });
  get('edit').addEventListener('click', () => {
    step = 0;
    renderQuestion();
  });
  get('reset').addEventListener('click', () => {
    answers.fill(null);
    ['type', 'result-title', 'result-copy', 'wish'].forEach((name) => { get(name).textContent = ''; });
    get('summary').replaceChildren();
    step = 0;
    renderQuestion();
  });
  launch.hidden = false;
})();
