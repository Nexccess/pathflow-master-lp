(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、いちばん話してみたいことは？",
    "options": [
      "小さな希望を、言葉にするところから相談したい",
      "くせや生えぐせを踏まえて、長さや形を相談したい",
      "少し変えたい髪色や、好みの明るさを相談したい",
      "毎日の髪の扱い方やセットを相談したい"
    ]
  },
  {
    "title": "今の髪で、気になっていることは？",
    "options": [
      "なりたい印象をうまく説明できない",
      "うねりや毛先の動き、全体のバランス",
      "今の髪色と、目指したい色の違い",
      "家で髪を整えるときに困ること"
    ]
  },
  {
    "title": "いつもの朝、髪とどう付き合いたいですか？",
    "options": [
      "自分の生活に合う希望を一緒に整理したい",
      "残したい動きや長さを、カットの相談に伝えたい",
      "普段の服や気分に合う髪色を考えたい",
      "自宅でのセット方法を質問したい"
    ]
  },
  {
    "title": "相談の時間で、大切にしたいことは？",
    "options": [
      "細かな希望や迷いを、聞いてもらうこと",
      "自分のくせや生えぐせを踏まえて形を考えること",
      "好みの色味や明るさを伝えること",
      "毎日の手入れで気になることを伝えること"
    ]
  }
];
  const results = {
  "CONSULT": {
    "type": "相談・希望整理",
    "title": "小さな希望から、話してみる。",
    "copy": "Orranaには、要望の聞き取りや質問への丁寧な返答についての体験が寄せられています。まだ決めきれないことも、残したい雰囲気も、相談のきっかけとして言葉にしてみましょう。"
  },
  "CUT": {
    "type": "カット・シルエット",
    "title": "くせも、長さも、相談の手がかりに。",
    "copy": "くせや生えぐせへの配慮、自宅でのセットについての体験が寄せられています。気になるうねり、好きな毛先の動き、残したい長さを伝え、髪の状態を見ながら相談してみましょう。"
  },
  "COLOR": {
    "type": "カラー",
    "title": "少し変えたい髪色を、言葉に。",
    "copy": "細かな髪色のオーダーや、カットとカラーについての体験が寄せられています。今の色と好みの色味・明るさを分けて伝えると、Orranaで話したい希望を整理できます。"
  },
  "CARE": {
    "type": "ケア",
    "title": "いつもの朝の、髪の話から。",
    "copy": "自分でのヘアセットや、質問への丁寧な返答についての体験が寄せられています。家で困る場面や普段の整え方を伝え、髪との付き合い方を相談するきっかけに。ケアの施術や商品の提供を示す結果ではありません。"
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
    ['type','result-title','result-copy','wish','summary'].forEach((id) => get(id).replaceChildren());
    step = 0;
    renderQuestion();
  });
  launch.hidden = false;
})();
