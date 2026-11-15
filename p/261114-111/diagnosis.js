(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、いちばん相談したいことは？",
    "options": [
      "写真や言葉で、なりたいイメージを整理したい",
      "前髪や耳まわり、シルエットを相談したい",
      "好みの色味や明るさを相談したい",
      "髪の状態や毎日のケアを相談したい"
    ]
  },
  {
    "title": "今の髪で、伝えておきたいことは？",
    "options": [
      "好きな雰囲気と避けたい印象がある",
      "生え癖や分け目、長さが気になる",
      "暗く見せたくないなど、髪色の希望がある",
      "普段の手入れで気になることがある"
    ]
  },
  {
    "title": "毎日の髪について、聞いておきたいことは？",
    "options": [
      "自分の生活に合う希望の伝え方",
      "前髪の上げ下ろしやセットの仕方",
      "色の見え方や明るさの共有方法",
      "今の髪に合うケアの方法"
    ]
  },
  {
    "title": "来店前に、用意しておきたいメモは？",
    "options": [
      "好きな写真と、好きだと思ったポイント",
      "耳まわりや前髪など、形の希望",
      "好きな色味と、避けたい明るさや印象",
      "これまでの施術履歴と、ケアで聞きたいこと"
    ]
  }
];
  const results = {
  "CONSULT": {
    "type": "相談・希望整理",
    "title": "好きなイメージを、あなたの言葉で。",
    "copy": "写真を見ながらの相談や、細かな希望を掘り下げるやり取りが口コミに記されています。好きなポイントと避けたい印象を、ZEST kalonで話すためのメモにしてみましょう。"
  },
  "CUT": {
    "type": "カット・シルエット",
    "title": "前髪も耳まわりも、毎日の話から。",
    "copy": "耳まわりの癖を考えたカットや、セットの説明に触れた口コミがあります。普段の分け目、前髪を上げる日と下ろす日のことも添えて、長さや形を相談してみましょう。"
  },
  "COLOR": {
    "type": "カラー",
    "title": "色味と明るさ、両方を伝えるメモに。",
    "copy": "カラーの提案に触れた声がある一方、希望と仕上がりの印象が異なったという声もあります。好きな写真と避けたい印象をそろえ、明るさや色味の見え方を相談してみましょう。"
  },
  "CARE": {
    "type": "ケア",
    "title": "髪の状態と、家での付き合い方を。",
    "copy": "髪色やケアの方法、髪質について質問したという口コミがあります。これまでの施術履歴や日々の手入れで気になる点を伝え、今の髪に合う方法を相談してみましょう。"
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

    document.documentElement.classList.add('diagnosis-open');

    dialog.showModal();
    if (form.hidden) get('result-title').focus();
    else renderQuestion();
  });
  get('close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('diagnosis-open');


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
    step = 0;
    renderQuestion();
  });
  function fitLaunch() {
    const right = document.querySelector('.booking').getBoundingClientRect().right;
    launch.style.width = Math.max(0, Math.min(260, window.innerWidth - right - 20)) + 'px';
  }
  new ResizeObserver(fitLaunch).observe(document.querySelector('.booking'));
  window.addEventListener('resize', fitLaunch);
  fitLaunch();
  launch.hidden = false;
})();
