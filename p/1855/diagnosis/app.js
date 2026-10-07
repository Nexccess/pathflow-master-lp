"use strict";

const DIAGNOSIS_VERSION = "1855-spec-v2";

const PATHFLOW_ANALYTICS = {
  apiKey: "3c4155ba8800bb2242f3bccec4a4053c",
  endpoint: "https://api2.amplitude.com/2/httpapi",
  commonProperties: {
    lead_id: "1855",
    store_name: "Asure",
    variant_code: "STANDARD_LP",
    lp_version: "ASURE1855-11A-FINAL-v1",
    diagnosis_version: DIAGNOSIS_VERSION
  }
};

function getPathFlowDeviceId() {
  const storageKey = "pathflow_device_id";

  try {
    let id = localStorage.getItem(storageKey);

    if (!id) {
      id =
        "pf-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 12);

      localStorage.setItem(storageKey, id);
    }

    return id;
  } catch (error) {
    return (
      "pf-session-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 12)
    );
  }
}

function sendAnalyticsEvent(eventType, properties = {}) {
  const payload = {
    api_key: PATHFLOW_ANALYTICS.apiKey,
    events: [
      {
        device_id: getPathFlowDeviceId(),
        event_type: eventType,
        time: Date.now(),
        event_properties: {
          ...PATHFLOW_ANALYTICS.commonProperties,
          ...properties
        }
      }
    ]
  };

  fetch(PATHFLOW_ANALYTICS.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "*/*"
    },
    body: JSON.stringify(payload),
    keepalive: true
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Amplitude HTTP " + response.status);
      }

      return response.json();
    })
    .then((result) => {
      console.log(
        "[PathFlow] " +
          eventType +
          " sent: lead_id=1855 events_ingested=" +
          result.events_ingested
      );
    })
    .catch((error) => {
      console.error(
        "[PathFlow] Analytics send failed: " + eventType,
        error
      );
    });
}

const questions = [{"id":"scene","eyebrow":"01 / SCENE","title":"今回、どんな予定に向けて整えたいですか？","help":"いちばん近い予定を選んでください。","answers":[{"value":"wedding","label":"結婚式・お呼ばれ"},{"value":"live_event","label":"ライブ・イベント"},{"value":"special_day","label":"そのほかの大切な予定"}]},{"id":"timing","eyebrow":"02 / TIMING","title":"当日の時間で、気になっていることはありますか？","help":"予定前の支度について近いものを選んでください。","answers":[{"value":"early","label":"朝が早いので、早めに支度を整えたい"},{"value":"normal","label":"時間より、予定に合う仕上がりを重視したい"},{"value":"undecided","label":"まだ時間は決まっていない"}]},{"id":"finish","eyebrow":"03 / FINISH","title":"仕上がりは、どんな考え方に近いですか？","help":"髪型の名前まで決まっていなくても問題ありません。","answers":[{"value":"fit_scene","label":"服やその日の雰囲気に合わせて整えたい"},{"value":"clean","label":"特別な日に合う、きれいな仕上がりにしたい"},{"value":"consult","label":"まだ決めていないので、相談しながら整理したい"}]},{"id":"priority","eyebrow":"04 / PRIORITY","title":"今回いちばん大切にしたいことはどれですか？","help":"当日の過ごし方に近いものを選んでください。","answers":[{"value":"smooth","label":"予定前の準備をできるだけ軽やかにしたい"},{"value":"mood","label":"イベントへ向かう前の気分まで整えたい"},{"value":"private","label":"大きすぎない空間で落ち着いて支度したい"}]}];

const storeEvidence = {
  primaryValue: "大切な日の、いちばんきれいな私で。ヘアセットから始まる、もっと特別な一日。",
  serviceSignals: ["ヘアセット","シーンに合わせたスタイル提案","通常美容メニューにも対応","横浜","プライベートサロン"],
  customerVoiceSummary: "朝の予定でも支度しやすい / イベントへ向かう前の気分まで整う / その日の服や雰囲気に合わせてきれいに仕上げたい",
  distinctivenessAvailable: false
};

let currentQuestion = 0;
const answers = {};

const startScreen = document.getElementById("startScreen");
const questionScreen = document.getElementById("questionScreen");
const resultScreen = document.getElementById("resultScreen");

const startButton = document.getElementById("startButton");
const backButton = document.getElementById("backButton");
const restartButton = document.getElementById("restartButton");
const ctaButton = document.getElementById("ctaButton");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const questionEyebrow = document.getElementById("questionEyebrow");
const questionTitle = document.getElementById("questionTitle");
const questionHelp = document.getElementById("questionHelp");
const answerList = document.getElementById("answerList");

sendAnalyticsEvent("diagnosis_view");

function showScreen(screen) {
  [startScreen, questionScreen, resultScreen].forEach((el) => {
    el.classList.remove("active");
  });

  screen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderQuestion() {
  const q = questions[currentQuestion];

  progressBar.style.width =
    `${((currentQuestion + 1) / questions.length) * 100}%`;

  progressText.textContent =
    `${currentQuestion + 1} / ${questions.length}`;

  questionEyebrow.textContent = q.eyebrow;
  questionTitle.textContent = q.title;
  questionHelp.textContent = q.help;

  answerList.innerHTML = "";

  q.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = answer.label;

    if (answers[q.id] === answer.value) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      answers[q.id] = answer.value;

      sendAnalyticsEvent("question_answered", {
        question_id: q.id,
        question_number: currentQuestion + 1,
        answer_value: answer.value
      });

      if (currentQuestion < questions.length - 1) {
        sendAnalyticsEvent("diagnosis_progress", {
          completed_questions: currentQuestion + 1,
          total_questions: questions.length,
          next_question_id: questions[currentQuestion + 1].id
        });

        currentQuestion += 1;
        renderQuestion();
      } else {
        sendAnalyticsEvent("diagnosis_complete", {
          completed_questions: questions.length,
          total_questions: questions.length
        });

        renderResult();
      }
    });

    answerList.appendChild(button);
  });

  backButton.style.visibility =
    currentQuestion === 0 ? "hidden" : "visible";
}

const SELF_DISCOVERY_SPEC = {"title_question":"priority","title_by_answer":{"smooth":"予定前の準備を、軽やかに整えたい","mood":"大切な日の気分まで、きれいに整えたい","private":"落ち着いた空間で、特別な日の支度をしたい"},"consultation_points":{"scene":{"wedding":"結婚式・お呼ばれに合うヘアセットを相談したい","live_event":"ライブ・イベントに合うヘアセットを相談したい","special_day":"大切な予定に合うヘアセットを相談したい"},"timing":{"early":"朝の予定に合わせた支度時間について確認したい","normal":"予定に合う仕上がりを中心に相談したい","undecided":"予定時間が決まっていない段階で相談したい"},"finish":{"fit_scene":"服やその日の雰囲気に合う仕上がりを相談したい","clean":"特別な日に合う、きれいな仕上がりを相談したい","consult":"具体的な髪型は決め切らず、相談しながら整理したい"},"priority":{"smooth":"予定前の準備を軽やかに進めたい","mood":"イベントへ向かう前の気分まで整えたい","private":"大きすぎない空間で落ち着いて支度したい"}},"summary":"大切な日の予定・時間・仕上がり・支度で重視したいことを整理した状態です。"};

function buildSelfDiscovery() {
  const titleAnswer = answers[SELF_DISCOVERY_SPEC.title_question];
  const title = SELF_DISCOVERY_SPEC.title_by_answer[titleAnswer] || "";
  const consultationPoints = [];
  Object.keys(SELF_DISCOVERY_SPEC.consultation_points).forEach((questionId) => {
    const answerValue = answers[questionId];
    const mapping = SELF_DISCOVERY_SPEC.consultation_points[questionId];
    if (answerValue && mapping[answerValue]) {
      consultationPoints.push(mapping[answerValue]);
    }
  });
  return {
    title,
    summary: SELF_DISCOVERY_SPEC.summary,
    consultationPoints
  };
}

const resonanceSupport = {};

const RESONANCE_SPEC = {"conditions":[{"evidence_key":"manageability","any":[{"question_id":"scene","values":["wedding","live_event","special_day"]},{"question_id":"timing","values":["early","normal"]},{"question_id":"priority","values":["smooth","mood"]}]},{"evidence_key":"fit_or_proposal","any":[{"question_id":"finish","values":["fit_scene","consult"]}]}],"thresholds":{"direct_min":2,"partial_min":1},"messages":{"DIRECT_RESONANCE":"今回整理した希望と、Asureの公開情報には複数の重なりがあります。具体的なヘアセットは当日の予定や希望を伝えて相談してください。","PARTIAL_RESONANCE":"今回整理した希望の一部は、Asureの公開情報と重なります。具体的な仕上がりは予定や希望を伝えて相談してください。","CONSULTATION_REQUIRED":"今回の希望について、確認できる公開情報だけでは十分な一致を判断できません。予定や希望を伝えて相談するのが適切です。"},"no_match_text":"今回の希望と直接照合できる十分な公開情報は確認できませんでした。"};
const RESONANCE_EVIDENCE_SUPPORT = {"consultation":false,"fit_or_proposal":false,"manageability":true,"care":false,"communication_distance":false};
const RESONANCE_EVIDENCE_TEXT = {"manageability":"朝の予定でも支度しやすい / イベントへ向かう前の気分まで整う / その日の服や雰囲気に合わせてきれいに仕上げたい"};

function buildResonance() {
  const matched = [];
  let score = 0;

  RESONANCE_SPEC.conditions.forEach((condition) => {
    const evidenceKey = condition.evidence_key;
    if (RESONANCE_EVIDENCE_SUPPORT[evidenceKey] !== true) return;

    const answerMatched = condition.any.some((rule) => {
      return rule.values.includes(answers[rule.question_id]);
    });

    if (answerMatched) {
      score += 1;
      const evidenceText = RESONANCE_EVIDENCE_TEXT[evidenceKey];
      if (evidenceText) matched.push(evidenceText);
    }
  });

  let type = "CONSULTATION_REQUIRED";
  if (score >= RESONANCE_SPEC.thresholds.direct_min) {
    type = "DIRECT_RESONANCE";
  } else if (score >= RESONANCE_SPEC.thresholds.partial_min) {
    type = "PARTIAL_RESONANCE";
  }

  if (matched.length === 0) {
    matched.push(RESONANCE_SPEC.no_match_text);
  }

  return {
    type,
    message: RESONANCE_SPEC.messages[type],
    matched
  };
}

function renderResult() {
  const discovery = buildSelfDiscovery();
  const resonance = buildResonance();

  document.getElementById("discoveryTitle").textContent =
    discovery.title;

  document.getElementById("discoverySummary").textContent =
    discovery.summary;

  const consultationPoints =
    document.getElementById("consultationPoints");

  consultationPoints.innerHTML = "";

  discovery.consultationPoints.forEach((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    consultationPoints.appendChild(li);
  });

  document.getElementById("resonanceIntro").textContent =
    "あなたの回答を確定した後、Asureの公開情報と照合しました。";

  const resonancePoints =
    document.getElementById("resonancePoints");

  resonancePoints.innerHTML = "";

  resonance.matched.forEach((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    resonancePoints.appendChild(li);
  });

  document.getElementById("resultType").textContent =
    resonance.type;

  document.getElementById("resultMessage").textContent =
    resonance.message;

  showScreen(resultScreen);

  sendAnalyticsEvent("result_view", {
    result_type: resonance.type
  });

  console.log({
    lead_id: "1855",
    diagnosis_version: DIAGNOSIS_VERSION,
    answers,
    self_discovery: discovery,
    resonance
  });
}

startButton.addEventListener("click", () => {
  sendAnalyticsEvent("diagnosis_start");

  currentQuestion = 0;
  showScreen(questionScreen);
  renderQuestion();
});

backButton.addEventListener("click", () => {
  if (currentQuestion > 0) {
    currentQuestion -= 1;
    renderQuestion();
  }
});

ctaButton.addEventListener("click", () => {
  sendAnalyticsEvent("cta_click", {
    destination: ctaButton.href,
    result_type:
      document.getElementById("resultType").textContent || null
  });
});

restartButton.addEventListener("click", () => {
  Object.keys(answers).forEach((key) => {
    delete answers[key];
  });

  currentQuestion = 0;
  showScreen(startScreen);
});
