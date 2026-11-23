(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [{"title": "今、いちばん相談したいことは？", "options": ["うまく言えない髪の希望を整理したい", "横顔やトップのシルエットを相談したい", "好きな色味や明るさを相談したい", "朝のまとまりや普段の扱い方を相談したい"]}, {"title": "今の髪で、気になる手がかりは？", "options": ["好きな雰囲気を言葉にしにくい", "横や毛先、全体の輪郭が気になる", "今の髪色と好きな印象に違いがある", "毎朝、うまくまとまらない部分がある"]}, {"title": "相談に持っていきたいイメージは？", "options": ["まだ曖昧なので、気分から話したい", "横はすっきり、上は動きを残したい", "落ち着いた色か、印象を変える色か迷う", "日々の髪の扱いで困る場面を伝えたい"]}, {"title": "今回、特に伝えておきたいことは？", "options": ["決めきれないことも含めて相談したい", "短くする範囲や残したい形を伝えたい", "好きな色と避けたい印象を伝えたい", "自宅での手入れについて質問したい"]}];
  const results = {"CONSULT": {"type": "相談・希望整理", "title": "うまく言えない、その感じから。", "copy": "好きな雰囲気や気になる部分を、BARNEYSで話すためのメモに。曖昧な希望や写真も、相談の手がかりにしてみましょう。"}, "CUT": {"type": "カット・シルエット", "title": "輪郭に、自分らしさの手がかりを。", "copy": "横をどのくらいすっきりさせたいか、トップにどんな動きを残したいか。好きな輪郭と変えたくない部分を、写真や言葉で伝えてみましょう。"}, "COLOR": {"type": "カラー", "title": "色の気分を、言葉に。", "copy": "落ち着いた色が好き、少し印象を変えたい。理想の色味や明るさに加えて、避けたい印象も相談のメモに。対応できる内容は店舗へご確認ください。"}, "CARE": {"type": "ケア", "title": "普段の扱い方から、髪の話を。", "copy": "朝、どこがまとまりにくいか、いつ扱いに困るか。日々の具体的な場面を伝え、髪の状態を見ながら手入れの方法を相談してみましょう。"}};
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
    get('wish').textContent = 'いちばん相談したいことは「' + questions[0].options[answers[0]] + '」です。今の髪では「' + questions[1].options[answers[1]] + '」。相談に持っていきたいイメージは「' + questions[2].options[answers[2]] + '」。今回は「' + questions[3].options[answers[3]] + '」を大切にしたいです。髪の状態を見ながら相談したいです。';
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
