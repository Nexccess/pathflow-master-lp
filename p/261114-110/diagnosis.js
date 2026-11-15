(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、いちばん話したい髪の希望は？",
    "options": [
      "まだ決めず、自分のペースで相談したい",
      "顔まわりや横からのシルエットを相談したい",
      "自分らしさに合う色の変化を相談したい",
      "髪のクセや日々の扱い方を相談したい"
    ]
  },
  {
    "title": "今の髪で、気になっていることは？",
    "options": [
      "好きな雰囲気をうまく言葉にできない",
      "サイドの膨らみや全体のバランスが気になる",
      "色味や明るさが今の気分と合わない",
      "髪の手触りやまとまりが気になる"
    ]
  },
  {
    "title": "毎日の髪で、大切にしたいことは？",
    "options": [
      "服や仕事に合うイメージを一緒に考えたい",
      "顔まわりや毛流れの見え方を考えたい",
      "派手さの加減も含めて髪色を考えたい",
      "普段の手入れやスタイリングを相談したい"
    ]
  },
  {
    "title": "相談するとき、最初に伝えたいことは？",
    "options": [
      "無理なく取り入れたい変化と、残したい自分らしさ",
      "希望する長さやレイヤー、シルエット",
      "好きな色のニュアンスと気になること",
      "これまでの施術と現在の髪の状態"
    ]
  }
];
  const results = {
  "CONSULT": {
    "type": "相談・希望整理",
    "title": "決まる前の気持ちから、ゆっくり。",
    "copy": "好きな雰囲気と、まだ迷っていることを並べてみましょう。自分のペースで相談できる貸切の時間に、服や仕事、残したい自分らしさも伝える手がかりになります。"
  },
  "CUT": {
    "type": "カット・シルエット",
    "title": "顔まわりと、横からの形を話す。",
    "copy": "顔まわり、サイドの膨らみ、レイヤーのバランス。気になる場所と希望する長さを整理し、髪のクセや普段の扱い方と合わせて相談してみましょう。"
  },
  "COLOR": {
    "type": "カラー",
    "title": "色で遊ぶ気分も、自分らしさも。",
    "copy": "赤に紫のニュアンス、柔らかなピンクなど、LPで気になった色や好きな雰囲気を手がかりに。派手さへの迷いや今の髪色も伝え、色の方向を相談してみましょう。"
  },
  "CARE": {
    "type": "ケア",
    "title": "今の髪と、毎日の付き合い方から。",
    "copy": "クセやまとまり、手触りで気になることを整理しましょう。これまでの施術や普段の手入れも伝えて、今の髪の状態を見ながら扱い方を相談する入口に。"
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
  const booking = document.querySelector('a.booking');
  function fitLaunch() {
    const edge = booking.getBoundingClientRect().right + 8;
    launch.style.setProperty('--diagnosis-left-edge', edge + 'px');
  }
  new ResizeObserver(fitLaunch).observe(booking);
  window.addEventListener('resize', fitLaunch);
  fitLaunch();
  launch.hidden = false;
})();
