(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、アントでいちばん相談したいことは？",
    "options": [
      "白髪やクセなど、気がかりと希望を整理したい",
      "長さや全体のシルエットを相談したい",
      "白髪の染め方やヘナの色の見え方を相談したい",
      "広がりや手触り、日々のケアを相談したい"
    ]
  },
  {
    "title": "今の髪について、気になることは？",
    "options": [
      "髪の変化に、何を選べばよいか迷っている",
      "伸びてきた髪の長さや形が気になる",
      "白髪や今の髪色の見え方が気になる",
      "クセやパサつき、まとまりにくさが気になる"
    ]
  },
  {
    "title": "毎日の髪との付き合い方で、整理したいことは？",
    "options": [
      "暮らしに合う通い方を相談したい",
      "扱いやすい長さやバランスを考えたい",
      "ヘナで目指したい色の印象を考えたい",
      "洗い方や自宅でのお手入れを確認したい"
    ]
  },
  {
    "title": "相談するとき、まず伝えたい希望は？",
    "options": [
      "迷っていることを一つずつ話したい",
      "好みの長さとシルエットを伝えたい",
      "白髪の気がかりと希望の色を伝えたい",
      "気になるクセの場所や手触りを伝えたい"
    ]
  }
];
  const results = {
  "CONSULT": {
    "type": "相談・希望整理",
    "title": "髪の変化も、暮らしの希望も、言葉に。",
    "copy": "白髪やクセ、手触りなど、気がかりが重なるときは、相談したい順番から整理してみましょう。今までのカラーや縮毛矯正の経験も、アントで話す手がかりになります。"
  },
  "CUT": {
    "type": "カット・シルエット",
    "title": "長さと形の希望を、相談の手がかりに。",
    "copy": "好みの長さや全体のバランス、伸びてきて気になる部分を整理しましょう。クセの場所や普段の扱い方とあわせて、希望をアントへお伝えください。"
  },
  "COLOR": {
    "type": "カラー",
    "title": "白髪の気がかりと、好きな色の見え方を。",
    "copy": "ヘナカラーを考えるときは、白髪の気になるところや希望する色の印象を伝えてみましょう。これまでのカラー経験、肌や頭皮の気がかりも事前にご相談ください。色の見え方には個人差があります。"
  },
  "CARE": {
    "type": "ケア",
    "title": "手触りと、帰宅後のお手入れを整理。",
    "copy": "広がりやクセの場所、目指したい手触りを相談の材料にしましょう。縮毛矯正の履歴や、施術後の洗い方も確認を。塗るだけヘナを検討する場合は、自宅での流し方や準備も店舗へご確認ください。"
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
  launch.hidden = false;
})();
