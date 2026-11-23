(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、いちばん話しておきたい希望は？",
    "options": [
      "写真や今の気分から、なりたいイメージを整理したい",
      "長さや顔まわり、全体の形を相談したい",
      "色の明るさや、色を入れる範囲を相談したい",
      "髪の手触りや、日々の手入れを相談したい"
    ]
  },
  {
    "title": "今の髪で、先に伝えておきたいことは？",
    "options": [
      "変えたいところと残したいところが、まだ曖昧",
      "前髪の長さや左右のボリュームが気になる",
      "毛先を暗くしすぎず、好みの明るさを伝えたい",
      "まとまりや指通りで気になるところがある"
    ]
  },
  {
    "title": "家で髪を整えるとき、相談したいことは？",
    "options": [
      "自分の好みと普段の整え方を、一緒に整理したい",
      "毎朝のスタイリングを考えて、長さや形を相談したい",
      "髪色の印象や、カラー後の手入れを相談したい",
      "日々続けやすいケアの方法を聞きたい"
    ]
  },
  {
    "title": "来店時、いちばん確かめたいことは？",
    "options": [
      "写真や言葉で希望を共有し、提案を聞いてから決めたい",
      "切る長さやシルエットを確認してから決めたい",
      "好きな色と避けたい暗さ、入れる範囲を確認したい",
      "今の髪の状態に合う手入れを相談したい"
    ]
  }
];
  const results = {
  "CONSULT": {
    "type": "相談・希望整理",
    "title": "まだ言葉にならない気分も、相談ノートに。",
    "copy": "好きな写真と、変えたいところ・残したいところを並べてみましょう。Color salon Biscariaで希望を伝える手がかりに。相談しながら決めたいことや、静かに過ごしたい気持ちも、来店時に添えられます。"
  },
  "CUT": {
    "type": "カット・シルエット",
    "title": "前髪も、全体の形も。希望を具体的に。",
    "copy": "長さや顔まわり、左右のボリュームなど、気になる部分を写真や言葉で整理しましょう。普段のスタイリングも添えて、切る前にイメージを確認するための相談メモになります。"
  },
  "COLOR": {
    "type": "カラー",
    "title": "明るさと、色を入れる範囲に、私のものさし。",
    "copy": "好きな色の写真と、避けたい暗さ。全体・顔まわり・毛先で、変えたいところと残したいところを分けて伝えてみましょう。白髪ぼかしやハイライトが気になる場合も、希望のイメージと今の髪の状態から相談を。"
  },
  "CARE": {
    "type": "ケア",
    "title": "毎日の手入れも、相談ノートの一頁に。",
    "copy": "手触りやまとまりで気になること、朝のスタイリングや家での手入れを整理しましょう。今の髪の状態を見てもらいながら、日々続けやすい方法を相談する入口に。"
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
