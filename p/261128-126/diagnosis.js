(() => {
  'use strict';

  // Priority order also resolves ties. Answers stay in this closure only.
  const categories = ['CONSULT', 'CUT', 'COLOR', 'CARE'];
  const questions = [{"title": "大切な日の支度で、まず相談したいことは？", "options": ["予定や装いに合う雰囲気を整理したい", "長さやシルエットの希望を伝えたい", "装いと合わせた髪色の見え方を相談したい", "髪の手触りやまとまりを相談したい"]}, {"title": "希望を伝えるとき、気になることは？", "options": ["髪型が決まらず、画像を見ながら相談したい", "まとめ髪や顔まわりのバランスが気になる", "着物や服と今の髪色の調和が気になる", "髪のクセやパサつきが気になる"]}, {"title": "当日の髪を思い描くなら？", "options": ["ヘア・メイク・装いの雰囲気を一緒に考えたい", "やわらかさやすっきり感を形で伝えたい", "今の髪色を生かした印象を考えたい", "髪の状態に合わせた支度を相談したい"]}, {"title": "予約前に、特に整理しておきたいことは？", "options": ["予定と出発時刻、相談したい希望", "長さやカットも含めた形の相談事項", "色味や明るさについて確認したいこと", "当日までのお手入れで確認したいこと"]}];
  const results = {"CONSULT": {"type": "相談・希望整理", "title": "予定と装いから、なりたい雰囲気を。", "copy": "希望の画像がある日も、髪型が決まらない日も。結婚式へのお呼ばれや前撮りなどの予定、装い、出発時刻を添えて、VELVETで相談したいことを整理してみましょう。"}, "CUT": {"type": "カット・シルエット", "title": "形の希望を、装いと一緒に言葉に。", "copy": "顔まわりやまとめ髪のバランス、やわらかさ・すっきり感などを画像とともに伝えてみましょう。カットを希望する場合の対応可否や、今の長さで可能な支度は事前に店舗へご確認ください。"}, "COLOR": {"type": "カラー", "title": "今の髪色と、装いの調和を考える。", "copy": "着物や服の写真と、髪色の色味・明るさで気になることを相談のメモに。カラー施術の提供内容・対応可否はこのページでは確認できません。希望がある場合は予約前に店舗へご確認ください。"}, "CARE": {"type": "ケア", "title": "髪の状態も、支度の相談メモに。", "copy": "クセやパサつき、まとまりで気になることを伝え、当日までのお手入れや支度について相談してみましょう。必要な対応や施術の適否は、髪の状態を確認したうえで店舗へご相談ください。"}};
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
    get('wish').textContent = 'VELVETで支度について相談したいです。' + answers.map((answer, index) => questions[index].title + '「' + questions[index].options[answer] + '」').join('。') + '。希望する内容の対応可否、料金、所要時間、持ち物、受付時間を事前に確認したいです。';
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
    step = 0;
    renderQuestion();
  });
  launch.hidden = false;
})();
