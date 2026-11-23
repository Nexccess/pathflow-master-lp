(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [{"title": "今、いちばん相談したいことは？", "options": ["希望の写真の「好き」を言葉にしたい", "髪質やボリュームに合う形を相談したい", "好きな色味や明るさを整理したい", "普段まとまりにくいところを相談したい"]}, {"title": "自分の髪で、気になっていることは？", "options": ["写真のイメージをどう伝えるか迷う", "長さ・顔まわり・全体のシルエット", "今の髪色と希望する色の違い", "日々の手入れや髪の手触り"]}, {"title": "希望の写真に、どんな言葉を添えたいですか？", "options": ["どこに惹かれたか、一緒に整理したい", "この長さや形が好きと伝えたい", "この色味や明るさが好きと伝えたい", "普段のまとまりにくさも伝えたい"]}, {"title": "相談のとき、特に確かめたいことは？", "options": ["希望と自分の髪の違いを聞きたい", "自分の髪質で考えられる形を聞きたい", "希望の髪色について相談できるか聞きたい", "自分の髪の手入れについて聞きたい"]}];
  const results = {
    CONSULT: {
      type: '相談・希望整理',
      title: 'まずは、なりたいイメージを一緒に整理。',
      copy: 'やりたい髪が決めきれない日も、今の気分や好きな雰囲気から。写真のどこに惹かれたか、自分の髪質やボリュームで気になることも添えて、ChiGuRaで話したい希望を整理してみましょう。'
    },
    CUT: {
      type: 'カット・シルエット',
      title: '好きな雰囲気から、長さと形を考える。',
      copy: '長さ、顔まわり、ボリューム。写真の好きな形と、自分の髪質で気になることを並べてみましょう。自分の髪で考えられる形を聞くためのメモです。'
    },
    COLOR: {
      type: 'カラー',
      title: 'あなたが求める髪色のイメージを整理。',
      copy: '色味、明るさ、カラーのニュアンス。どんな印象に近づけたいかを考えてみましょう。今の髪色について気になることも、相談時に伝える材料になります。'
    },
    CARE: {
      type: 'ケア',
      title: '髪のまとまりや手触りを見つめ直す。',
      copy: '毛流れや手触り、毎日のスタイリングで気になることを整理しましょう。まとまりにくい部分や日々の手入れで迷うことを、相談の言葉にしてみましょう。'
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
    get('wish').textContent = 'ChiGuRaで相談したいことを整理しました。' + answers.map((answer, index) => questions[index].title + '「' + questions[index].options[answer] + '」').join('。') + '。希望の写真と自分の髪質を照らし合わせ、可能な内容を相談したいです。';
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
  function placeLaunch() {
    const fixed = document.querySelector('.booking-fixed').getBoundingClientRect();
    launch.style.left = Math.max(Math.ceil(fixed.right + 8), (innerWidth >= 768 ? innerWidth - 348 : Math.round(innerWidth / 2))) + 'px';
  }
  placeLaunch();
  window.addEventListener('resize', placeLaunch);
  if (document.fonts) document.fonts.ready.then(placeLaunch);
  launch.hidden = false;
})();
