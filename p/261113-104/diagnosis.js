(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、いちばん話したい髪のことは？",
    "options": [
      "まだ曖昧な「こんな感じ」を整理したい",
      "切りたい長さと残したい形を相談したい",
      "好きな色味や明るさを相談したい",
      "髪の手触りや日々のケアを相談したい"
    ]
  },
  {
    "title": "今の髪で、気になるところは？",
    "options": [
      "好みをうまく言葉にできない",
      "前髪や顔まわり、全体のバランス",
      "色のニュアンスや色落ち",
      "乾燥やまとまり、手入れの方法"
    ]
  },
  {
    "title": "毎日の髪との付き合いで、話したいことは？",
    "options": [
      "自分の好みや暮らしに合う方向を考えたい",
      "毛流れを残す形やセットを相談したい",
      "予定や気分に合わせた髪色を考えたい",
      "乾かし方や自宅でのケアを聞きたい"
    ]
  },
  {
    "title": "相談のとき、いちばん大切にしたいのは？",
    "options": [
      "写真を手がかりに希望を伝えること",
      "少しずつ長さや形を確認すること",
      "好きな色と気になる点を伝えること",
      "髪の状態に合わせた手入れを考えること"
    ]
  }
];
  const results = {
    CONSULT: {
      type: '相談・希望整理',
      title: 'まずは、なりたいイメージを一緒に整理。',
      copy: 'やりたい髪が決めきれない日も、今の気分や好きな雰囲気から。写真や言葉を手がかりに、& Graph.で話したい希望を少しずつ整理してみましょう。'
    },
    CUT: {
      type: 'カット・シルエット',
      title: '好きな雰囲気から、長さと形を考える。',
      copy: '前髪や顔まわり、残したい毛流れ。切りたい部分と残したい部分を伝えてみましょう。少しずつ長さを確認することや、乾かし方・セットの相談にもつながります。'
    },
    COLOR: {
      type: 'カラー',
      title: 'あなたが求める髪色のイメージを整理。',
      copy: '好きな写真、肌になじむ色、大切な予定や色落ち。色のニュアンスと気になることを一緒に伝えてみましょう。希望する色の実現方法は髪の状態を見ながら店舗でご相談ください。'
    },
    CARE: {
      type: 'ケア',
      title: '髪のまとまりや手触りを見つめ直す。',
      copy: '手触りや乾燥、毎日の手入れで気になることを整理しましょう。口コミには自宅でのケアや乾かし方を教わった体験があります。今の髪に合うケアは店舗でご相談ください。'
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
    step = 0;
    renderQuestion();
  });
  launch.hidden = false;
})();
