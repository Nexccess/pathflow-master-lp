(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [
  {
    "title": "今、いちばん相談したいことは？",
    "options": [
      "言葉にしにくい好みを整理したい",
      "長さや横顔のシルエットを相談したい",
      "髪色の希望と対応できる範囲を確認したい",
      "髪や頭皮の手入れについて相談したい"
    ]
  },
  {
    "title": "今、気になっていることは？",
    "options": [
      "どんな写真や言葉で希望を伝えるか迷う",
      "短くしたいが残したい長さもある",
      "色味や明るさのイメージが気になる",
      "普段の手入れで気になることがある"
    ]
  },
  {
    "title": "普段の整え方から、伝えたいことは？",
    "options": [
      "自分の好みを一緒に言葉にしたい",
      "ジェルやワックスで整えるときの形を相談したい",
      "普段の髪色と変えてみたい印象を伝えたい",
      "自宅での手入れの方法を確認したい"
    ]
  },
  {
    "title": "今回、最後に確認しておきたいことは？",
    "options": [
      "細かな希望が伝わっているか確認したい",
      "前回気に入った長さやバランスを共有したい",
      "希望の髪色への対応可否と料金を確認したい",
      "ケアについて相談できる内容と料金を確認したい"
    ]
  }
];
  const results = {
  "CONSULT": {
    "type": "相談・希望整理",
    "title": "うまく言えない、その好みから。",
    "copy": "希望を聞き、細部を確認してもらえたという体験談があります。好きな写真や、まだ決めきれない部分を手がかりに、ODINで話したいことを整理してみましょう。"
  },
  "CUT": {
    "type": "カット・シルエット",
    "title": "輪郭と、残したい長さを言葉に。",
    "copy": "短くしたい部分、残したい長さ、横から見たバランス。前回気に入ったところや普段の整髪料も、カットの相談で伝える手がかりになります。"
  },
  "COLOR": {
    "type": "カラー",
    "title": "髪色の希望は、対応の確認から。",
    "copy": "気になる色味や明るさ、変えてみたい印象を整理してみましょう。提供資料ではカラーの対応内容は確認できません。対応可否・施術内容・料金を店舗へ事前にご確認ください。"
  },
  "CARE": {
    "type": "ケア",
    "title": "いつもの手入れで、気になることから。",
    "copy": "提供された体験談にはヘッドスパやケアについての記述があります。今の髪や頭皮について気になることと普段の手入れを伝え、現在相談できる内容・料金を確認してみましょう。"
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
    get('wish').textContent = questions.map((item, index) => item.title + '：' + item.options[answers[index]]).join('。') + '。これらの希望について、対応できる範囲や料金を確認しながら相談したいです。';
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
    get('wish').textContent = '';
    get('summary').replaceChildren();
    get('type').textContent = '';
    get('result-title').textContent = '';
    get('result-copy').textContent = '';
    step = 0;
    renderQuestion();
  });
  launch.hidden = false;
})();
