"use strict";

const DIAGNOSIS_VERSION = "1664-spec-v2";

const PATHFLOW_ANALYTICS = {
  apiKey: "3c4155ba8800bb2242f3bccec4a4053c",
  endpoint: "https://api2.amplitude.com/2/httpapi",
  commonProperties: {"lead_id":"1664","store_name":"YELLOW CORN 横浜店","lp_version":"YC1664-11A-PC-v1","creative_revision":"YC1664-11A-PC-v1","diagnosis_version":"1664-spec-v2","variant_code":"STANDARD_LP"}
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

  try {
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
          " sent: lead_id=1664 events_ingested=" +
          result.events_ingested
      );
    })
    .catch((error) => {
      console.error(
        "[PathFlow] Analytics send failed: " + eventType,
        error
      );
    });
  } catch (error) { console.error("[PathFlow] Analytics send failed", error); }
}

const questions = [{"id":"priority","eyebrow":"01 / CURRENT PRIORITY","title":"今いちばん叶えたいのは、どれですか？","help":"完成形が決まっていなくても、今の気持ちに近いものを選んでください。","answers":[{"value":"change","label":"髪色や長さを大きく変えて、印象を変えたい"},{"value":"fit","label":"ハイトーンやデザインカラーを、自分に似合う形で相談したい"},{"value":"care","label":"ブリーチやエクステ後のケアまで含めて相談したい"},{"value":"undecided","label":"変えたい気持ちはあるが、まだ具体的には決めていない"}]},{"id":"decision","eyebrow":"02 / DECISION","title":"スタイルは、どのくらい決まっていますか？","help":"まだ曖昧でも問題ありません。","answers":[{"value":"open","label":"ほとんど決まっていない。相談しながら考えたい"},{"value":"rough","label":"なんとなくのイメージはあるが、細部は相談したい"},{"value":"clear","label":"かなり具体的に決まっている"}]},{"id":"design","eyebrow":"03 / DESIGN","title":"気になっている変化は、どれに近いですか？","help":"今すぐ決める必要はありません。気になる方向を選んでください。","answers":[{"value":"color","label":"ブリーチやハイトーン、デザインカラー"},{"value":"extension","label":"エクステで長さやシルエットも変えたい"},{"value":"both","label":"色も長さも含めて、大きく印象を変えたい"},{"value":"unknown","label":"まだ決めていないので、相談して考えたい"}]},{"id":"consultation","eyebrow":"04 / CONSULTATION","title":"相談するとき、特に大切にしたいことは？","help":"施術内容だけでなく、相談の進め方に近いものを選んでください。","answers":[{"value":"talk","label":"希望を話しながら、自分に合う形を一緒に考えたい"},{"value":"proposal","label":"自分では決めきれない部分を提案してほしい"},{"value":"care","label":"施術後のケアや扱い方まで説明してほしい"}]}];
const selfDiscoverySpec = {"title_question":"priority","title_by_answer":{"change":"髪の印象を、大きく変えてみたい","fit":"ハイトーンを、自分に似合う形で楽しみたい","care":"変化だけでなく、その後のケアも大切にしたい","undecided":"変えたい気持ちはあるが、まだ答えは決まっていない"},"consultation_points":{"priority":{"change":"髪色や長さを含めて、今までより大きく印象を変えたい","fit":"ハイトーンやデザインカラーを、自分に似合う形で相談したい","care":"ブリーチやエクステ後のケアまで含めて相談したい","undecided":"変えたい気持ちはあるが、具体的な方向は相談して決めたい"},"decision":{"open":"完成形は決め切らず、相談しながら選択肢を整理したい","rough":"大まかなイメージを伝えて、細部を一緒に調整したい","clear":"希望するスタイルをベースに、実現方法を確認したい"},"design":{"color":"ブリーチやハイトーン、デザインカラーに興味がある","extension":"エクステで長さやシルエットも変えてみたい","both":"色も長さも含めて、大きく印象を変えてみたい","unknown":"施術方法は決めず、希望から相談して考えたい"},"consultation":{"talk":"希望を話しながら、自分に合う形を一緒に考えたい","proposal":"決めきれない部分について、提案を受けながら整理したい","care":"施術だけでなく、その後のケア方法まで確認したい"}},"summary":"完成形を先に決め切るより、変えたい方向・今決まっている範囲・気になる施術・相談で大切にしたいことを伝えると、希望を共有しやすい状態です。"};
const diagnosisResonance = {"conditions":[{"evidence_key":"consultation","any":[{"question_id":"decision","values":["open","rough"]},{"question_id":"consultation","values":["talk"]}]},{"evidence_key":"fit_or_proposal","any":[{"question_id":"priority","values":["fit","undecided"]},{"question_id":"consultation","values":["proposal"]}]},{"evidence_key":"care","any":[{"question_id":"priority","values":["care"]},{"question_id":"consultation","values":["care"]}]}],"thresholds":{"direct_min":3,"partial_min":1},"messages":{"DIRECT_RESONANCE":"今回整理した相談内容と、店舗で確認されている情報には複数の重なりがあります。具体的な施術内容は、髪の状態を見てもらいながら相談するのが適切です。","PARTIAL_RESONANCE":"ご相談内容の一部は、他のお客さまからの口コミやご評価と重なります。一方で、すべてを事前に判断できる情報はないため、希望を伝えて確認するのが適切です。","CONSULTATION_REQUIRED":"今回の希望について、公開されている情報だけでは十分な一致を確認できません。これは失敗ではなく、専門家へ直接相談することが適切な状態です。"},"no_match_text":"今回の希望と直接照合できる十分な公開情報は確認できませんでした。"};

const storeEvidence = {"primaryValue":"ハイトーンを、相談しながら自分に似合う形へ落とせること","serviceSignals":["ブリーチ","ダブルカラー","ブリーチカラー","ケアブリーチ","デザインカラー","エクステ","ハイライト","インナーカラー","グレイカラー・白髪カバー"],"customerVoiceSummary":"公開口コミの傾向から、カウンセリングや施術説明の丁寧さ、ブリーチやエクステ後のケア案内、仕上がりへの満足、希望が決まりきっていない状態でも相談しながら進められること、再来意向や横浜駅からの通いやすさに関する肯定的な評価が確認できる。個別口コミの転載ではなく、1664 YELLOW CORN 横浜店のReview Signalを要約したもの。","distinctivenessAvailable":false};
const resonanceEvidence = [{"slot_key":"consultation","supported":true,"text":"ハイトーンを、相談しながら自分に似合う形へ落とせること","evidence_mode":"REVIEW_SIGNALS","matched_review_signals":["相談内容を踏まえた提案への評価が見られる"],"semantic_source":"semantic_data.json/primary_value","evidence_source":"evidence-map.json/interpretation/review_signals"},{"slot_key":"fit_or_proposal","supported":true,"text":"ハイトーンを、相談しながら自分に似合う形へ落とせること","evidence_mode":"REVIEW_SIGNALS","matched_review_signals":["相談内容を踏まえた提案への評価が見られる"],"semantic_source":"semantic_data.json/primary_value","evidence_source":"evidence-map.json/interpretation/review_signals"},{"slot_key":"manageability","supported":false,"text":"UNKNOWN","evidence_mode":"REVIEW_SIGNALS","matched_review_signals":[],"semantic_source":"semantic_data.json/customer_voice_summary","evidence_source":"evidence-map.json/interpretation/review_signals"},{"slot_key":"care","supported":true,"text":"ブリーチ / ダブルカラー / ブリーチカラー / ケアブリーチ / デザインカラー / エクステ / ハイライト / インナーカラー / グレイカラー・白髪カバー","evidence_mode":"REVIEW_SIGNALS","matched_review_signals":["ブリーチやエクステ後のホームケア説明への評価が見られる"],"semantic_source":"semantic_data.json/service_signals","evidence_source":"evidence-map.json/interpretation/review_signals"},{"slot_key":"communication_distance","supported":false,"text":"UNKNOWN","evidence_mode":"REVIEW_SIGNALS","matched_review_signals":[],"semantic_source":"semantic_data.json/secondary_values","evidence_source":"evidence-map.json/interpretation/review_signals"}];

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

function buildSelfDiscovery() {
  const titleQuestion = selfDiscoverySpec.title_question;
  const titleAnswer = answers[titleQuestion];

  const title =
    selfDiscoverySpec.title_by_answer[titleAnswer] || "";

  const consultationPoints = [];

  questions.forEach((question) => {
    const selected = answers[question.id];
    const mapping =
      selfDiscoverySpec.consultation_points[question.id];

    if (
      mapping &&
      selected &&
      Object.prototype.hasOwnProperty.call(mapping, selected)
    ) {
      consultationPoints.push(mapping[selected]);
    }
  });

  return {
    title,
    summary: selfDiscoverySpec.summary,
    consultationPoints
  };
}

function buildResonance() {
  const matched = [];
  let score = 0;

  const evidenceByKey = Object.fromEntries(
    resonanceEvidence.map((evidence) => [
      evidence.slot_key,
      evidence
    ])
  );

  diagnosisResonance.conditions.forEach((condition) => {
    const evidence = evidenceByKey[condition.evidence_key];

    const visitorMatched = condition.any.some((rule) => {
      const selected = answers[rule.question_id];
      return rule.values.includes(selected);
    });

    if (
      visitorMatched &&
      evidence &&
      evidence.supported === true
    ) {
      if (!matched.includes(evidence.text)) {
        matched.push(evidence.text);
      }

      score += 1;
    }
  });

  let type;
  let message;

  if (score >= diagnosisResonance.thresholds.direct_min) {
    type = "DIRECT_RESONANCE";
    message = diagnosisResonance.messages.DIRECT_RESONANCE;
  } else if (score >= diagnosisResonance.thresholds.partial_min) {
    type = "PARTIAL_RESONANCE";
    message = diagnosisResonance.messages.PARTIAL_RESONANCE;
  } else {
    type = "CONSULTATION_REQUIRED";
    message = diagnosisResonance.messages.CONSULTATION_REQUIRED;
  }

  if (matched.length === 0) {
    matched.push(diagnosisResonance.no_match_text);
  }

  return {
    type,
    message,
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
    "あなたの回答と、YELLOW CORN 横浜店で実際に確認できた口コミ・店舗情報を照らし合わせました。";

  const resonancePoints =
    document.getElementById("resonancePoints");

  resonancePoints.innerHTML = "";

  resonance.matched.forEach((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    resonancePoints.appendChild(li);
  });

  const resultTypeLabels = {
    DIRECT_RESONANCE: "今回の相談ポイント",
    PARTIAL_RESONANCE: "一緒に整理したいポイント",
    CONSULTATION_REQUIRED: "お店で確認したいポイント"
  };

  document.getElementById("resultType").textContent =
    resultTypeLabels[resonance.type] || "";

  document.getElementById("resultType").dataset.internalType =
    resonance.type;

  document.getElementById("resultMessage").textContent =
    resonance.message;

  showScreen(resultScreen);

  sendAnalyticsEvent("result_view", {
    result_type: resonance.type
  });

  console.log({
    lead_id: 1664,
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
      document.getElementById("resultType").dataset.internalType || null
  });
});

restartButton.addEventListener("click", () => {
  Object.keys(answers).forEach((key) => {
    delete answers[key];
  });

  currentQuestion = 0;
  showScreen(startScreen);
});
