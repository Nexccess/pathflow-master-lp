(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、bunny hairでいちばん相談したいことは？",
    "options": [
      "まだ決まらない髪の希望を、一緒に整理したい",
      "長さやシルエットを、暮らしに合わせて相談したい",
      "落ち着いた色や少し遊びのある髪色を相談したい",
      "手触りや毎日のケアを相談したい"
    ]
  },
  {
    "title": "鏡の前や朝のセットで、気になることは？",
    "options": [
      "自分に似合う雰囲気をうまく言葉にできない",
      "伸びてきた髪の形や、セットのしづらさ",
      "今の髪色や白髪の見え方",
      "髪のまとまりや手触り"
    ]
  },
  {
    "title": "次の髪で、少し変えてみたいところは？",
    "options": [
      "写真や会話を手がかりに、全体の気分を考えたい",
      "顔まわりや毛先の長さ、全体のバランス",
      "落ち着いた色味か、少し冒険する色味かを考えたい",
      "髪の状態に合う手入れの仕方"
    ]
  },
  {
    "title": "来店時に、まず伝えたい希望は？",
    "options": [
      "決めきれていないことも、気負わず相談したい",
      "朝のセットと好きな形の両方について話したい",
      "好きな髪色と、変えてみたい範囲を伝えたい",
      "トリートメントや自宅でのケアについて聞きたい"
    ]
  }
];
  const results = {
  "CONSULT": {
    "type": "相談・希望整理",
    "title": "まだ決まらない気持ちも、髪の話の入口に。",
    "copy": "好きな雰囲気や、言葉にしづらい希望から。bunny hairで話したいことを、写真や日々の小さな困りごとを手がかりに整理してみましょう。"
  },
  "CUT": {
    "type": "カット・シルエット",
    "title": "明日の暮らしから、好きな形を考える。",
    "copy": "顔まわりや毛先、伸びてきた髪のバランス。朝のセットで困っていることも添えて、bunny hairで長さやシルエットを相談する材料にしてみましょう。"
  },
  "COLOR": {
    "type": "カラー",
    "title": "落ち着く色も、ひとさじの冒険も。",
    "copy": "いつもの色が好きな気持ちも、少し変えてみたい気持ちも。色味や明るさ、白髪の見え方など、気になる点をbunny hairで相談するためのメモにしましょう。"
  },
  "CARE": {
    "type": "ケア",
    "title": "いつもの手触りから、ケアの話へ。",
    "copy": "まとまりや手触り、普段の手入れで気になることを整理しましょう。bunny hairの口コミにはトリートメントやシャンプーの相談に触れた声もあります。現在の髪の状態に合うケアを店舗で相談してみましょう。"
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
    get('wish').textContent = 'bunny hairで相談したいことは「' + questions[0].options[answers[0]] + '」です。今の髪では「' + questions[1].options[answers[1]] + '」。普段のスタイリングでは「' + questions[2].options[answers[2]] + '」。今回は「' + questions[3].options[answers[3]] + '」を大切にしたいです。髪の状態を見ながら相談したいです。';
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
    document.body.classList.add('diagnosis-open');
    dialog.showModal();
    if (form.hidden) get('result-title').focus();
    else renderQuestion();
  });
  get('close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('diagnosis-open');
    document.body.classList.remove('diagnosis-open');
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
