(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、いちばん言葉にしておきたい希望は？",
    "options": [
      "好みや避けたいイメージを整理したい",
      "短髪の長さや横顔・襟足の形を伝えたい",
      "気になる髪色について確認したい",
      "髪の癖や毎日の手入れを整理したい"
    ]
  },
  {
    "title": "今の髪で、気になっていることは？",
    "options": [
      "写真だけでは希望を伝えきれない",
      "短くしすぎず、残したい長さがある",
      "今の色味や明るさが気になる",
      "髪の癖やセットのしにくさが気になる"
    ]
  },
  {
    "title": "来店前に準備しておきたいことは？",
    "options": [
      "参考写真に、自分の好みの言葉を添えたい",
      "横・後ろ・襟足で残したい部分を決めたい",
      "希望の髪色と、対応可否の確認事項をまとめたい",
      "普段の手入れで困る場面をまとめたい"
    ]
  },
  {
    "title": "今回、特に共有しておきたいことは？",
    "options": [
      "前回気に入った点と、変えたい点",
      "避けたい形と、残したい長さ",
      "好きな色味や明るさのイメージ",
      "髪の状態と、日々の扱い方の悩み"
    ]
  }
];
  const results = {
  "CONSULT": {
    "type": "相談・希望整理",
    "title": "写真に、あなたの言葉を添える。",
    "copy": "grooming TokyoのLPで提案している、好みを少しずつ共有する準備から。前回気に入った点や避けたい形を、参考写真とともに整理してみましょう。"
  },
  "CUT": {
    "type": "カット・シルエット",
    "title": "短い髪こそ、残したい長さを。",
    "copy": "横顔や襟足の輪郭、短くしすぎたくない部分を言葉にしてみましょう。短髪への評価とイメージの相違に関する提供口コミを踏まえ、写真に長さや避けたい形の説明を添える準備を。仕上がりを保証するものではありません。"
  },
  "COLOR": {
    "type": "カラー",
    "title": "髪色の希望と、確認事項を整理。",
    "copy": "好きな色味や明るさを言葉や写真にまとめてみましょう。grooming Tokyoでのカラーの提供内容・対応可否は不明です。希望を整理したうえで、利用前に確認してください。"
  },
  "CARE": {
    "type": "ケア",
    "title": "髪の癖と、普段の扱い方を言葉に。",
    "copy": "LPでも触れている髪の癖や、セットで気になる場面を整理してみましょう。ケア施術や商品の提供内容・対応可否は不明です。希望する内容を利用前に確認してください。"
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
    get('wish').textContent = 'いちばん言葉にしたい希望は「' + questions[0].options[answers[0]] + '」です。今の髪では「' + questions[1].options[answers[1]] + '」。来店前には「' + questions[2].options[answers[2]] + '」。特に「' + questions[3].options[answers[3]] + '」を大切にしたいです。施術内容や対応可否も確認したいです。';
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
    ['type','result-title','result-copy','wish','summary'].forEach(name => get(name).replaceChildren());
    step = 0;
    renderQuestion();
  });
  launch.hidden = false;
})();
