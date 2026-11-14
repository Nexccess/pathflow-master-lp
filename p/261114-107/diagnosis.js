(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、いちばん話しておきたいことは？",
    "options": [
      "髪型を決める前に、今の気分を整理したい",
      "正面・横顔・襟足の好きな輪郭を相談したい",
      "好みの色味や明るさについて相談したい",
      "手触りや日々のお手入れについて相談したい"
    ]
  },
  {
    "title": "今の髪で、相談の手がかりにしたいのは？",
    "options": [
      "変えたい気持ちと、変えすぎたくない気持ち",
      "前回気に入った長さや、気になる形",
      "今の髪色で好きなところや気になるところ",
      "毎日の手入れで気になっていること"
    ]
  },
  {
    "title": "写真やメモに残すなら、どんな希望？",
    "options": [
      "まだ言葉にできない、好きな雰囲気",
      "残したい長さや、すっきり見せたい輪郭",
      "試してみたい色のイメージ",
      "髪のまとまりや質感で気になる点"
    ]
  },
  {
    "title": "今回の相談で、大切にしたいことは？",
    "options": [
      "施術名を先に決めず、希望から話すこと",
      "好きな形と、残したい部分を伝えること",
      "希望の色味や明るさを伝えること",
      "今の髪の状態と、お手入れの悩みを伝えること"
    ]
  }
];
  const results = {
    CONSULT: {
      type: '相談・希望整理',
      title: 'まずは、なりたいイメージを一緒に整理。',
      copy: 'やりたい髪が決めきれない日も、今の気分や好きな雰囲気から。写真や言葉を手がかりに、CoRehaで話したい希望を少しずつ整理してみましょう。'
    },
    CUT: {
      type: 'カット・シルエット',
      title: '好きな雰囲気から、長さと形を考える。',
      copy: '毛先の長さや全体のバランスなど、気になる部分を整理してみましょう。希望する雰囲気と毎日の扱いやすさを相談する入口になります。'
    },
    COLOR: {
      type: 'カラー',
      title: 'あなたが求める髪色のイメージを整理。',
      copy: '色味、明るさ、カラーのニュアンス。どんな印象に近づけたいかを考えてみましょう。今の髪色について気になることも、相談時に伝える材料になります。'
    },
    CARE: {
      type: 'ケア',
      title: '髪のまとまりや手触りを見つめ直す。',
      copy: '毛流れや手触り、毎日のスタイリングで気になることを整理しましょう。髪の状態を見ながら、日々のお手入れについて相談するきっかけになります。'
    }
  };
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
    get('wish').textContent = 'CoRehaで相談したい希望です。' + answers.map((answer, index) => questions[index].title + '「' + questions[index].options[answer] + '」').join('。') + '。髪の状態を見ながら、できることを相談したいです。';
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
    document.body.style.top = '-' + scrollPosition + 'px';
    document.documentElement.classList.add('diagnosis-open');
    document.body.classList.add('diagnosis-open');
    dialog.showModal();
    if (form.hidden) get('result-title').focus();
    else renderQuestion();
  });
  get('close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('diagnosis-open');
    document.body.classList.remove('diagnosis-open');
    document.body.style.top = '';
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    launch.focus({ preventScroll: true });
  });
  // Native dialog supplies modal background inertness and Escape handling.
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button, a, input')].filter((el) => !el.disabled && el.getClientRects().length);
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
    ['type', 'result-title', 'result-copy', 'wish', 'summary'].forEach((name) => get(name).replaceChildren());
    step = 0;
    renderQuestion();
  });
  launch.hidden = false;
})();
