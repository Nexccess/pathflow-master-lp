"use strict";

const DIAGNOSIS_VERSION = "1839-spec-v2-dryrun";

const PATHFLOW_ANALYTICS = {
  apiKey: "3c4155ba8800bb2242f3bccec4a4053c",
  endpoint: "https://api2.amplitude.com/2/httpapi",
  commonProperties: {"lead_id": "1839", "store_name": "Frais Tout", "lp_version": "FT1839-11A-PC-v6", "creative_revision": "FT1839-11A-PC-v6", "diagnosis_version": "1839-spec-v2-dryrun", "variant_code": "STANDARD_LP"}
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
          " sent: lead_id=1839 events_ingested=" +
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

const questions = [{"id":"priority","eyebrow":"01 / CURRENT PRIORITY","title":"今いちばん整えたいのは、どれですか？","help":"完成形より、今気になっていることに近いものを選んでください。","answers":[{"value":"fit","label":"自分に合う形や似合う雰囲気を相談しながら決めたい"},{"value":"manage","label":"来店後も扱いやすく、スタイリングしやすくしたい"},{"value":"care","label":"髪質やダメージ、ケアについても相談したい"},{"value":"change","label":"雰囲気を変えたいが、具体的にはまだ決めていない"}]},{"id":"decision","eyebrow":"02 / DECISION","title":"スタイルは、どのくらい決まっていますか？","help":"まだ曖昧でも問題ありません。","answers":[{"value":"open","label":"ほとんど決まっていない。相談しながら考えたい"},{"value":"rough","label":"なんとなくのイメージはあるが、細部は相談したい"},{"value":"clear","label":"かなり具体的に決まっている"}]},{"id":"daily","eyebrow":"03 / DAILY LIFE","title":"日常では、何を大切にしたいですか？","help":"サロン直後より、その後の毎日に近いものを選んでください。","answers":[{"value":"easy","label":"できるだけ扱いやすく、再現しやすくしたい"},{"value":"learn","label":"自宅での整え方やケア方法も知りたい"},{"value":"design","label":"多少手間がかかっても、デザインを優先したい"}]},{"id":"comfort","eyebrow":"04 / COMFORT","title":"サロンでの過ごし方では、何が近いですか？","help":"技術だけでなく、空間や体験の希望に近いものを選んでください。","answers":[{"value":"consult","label":"相談しやすく、話しながら進めたい"},{"value":"relax","label":"シャンプーやヘッドスパも含めて、心地よく過ごしたい"},{"value":"quiet","label":"落ち着いた雰囲気で、静かに過ごしたい"}]}];
const selfDiscoverySpec = {"title_question":"priority","title_by_answer":{"fit":"似合う形を、相談しながら整えたい","manage":"来店後も扱いやすい髪を優先したい","care":"髪の状態やケアも含めて相談したい","change":"雰囲気を変えたいが、まだ答えは決まっていない"},"consultation_points":{"priority":{"fit":"自分に合う形や雰囲気を、相談しながら決めたい","manage":"来店後も扱いやすく、日常で再現しやすい形に整えたい","care":"髪質やダメージ、ケア方法も含めて相談したい","change":"雰囲気は変えたいが、具体的な方向は相談して決めたい"},"decision":{"open":"完成形は決め切らず、会話しながら選択肢を整理したい","rough":"大まかなイメージを伝えて、細部を一緒に調整したい","clear":"希望するスタイルをベースに、実現方法を確認したい"},"daily":{"easy":"日常では、扱いやすさと再現しやすさを重視したい","learn":"自宅でのスタイリングやケア方法も知りたい","design":"日常の手間より、デザインの完成度を優先したい"},"comfort":{"consult":"相談しやすい空気の中で、自分の希望を整理したい","relax":"シャンプーやヘッドスパも含めて、心地よい時間を過ごしたい","quiet":"落ち着いた雰囲気の中で、静かに過ごしたい"}},"summary":"髪型そのものを先に決めるより、今の希望・日常での扱いやすさ・サロンでの過ごし方を伝えてから相談すると、希望を共有しやすい状態です。"};
const diagnosisResonance = {"conditions":[{"evidence_key":"consultation","any":[{"question_id":"decision","values":["open","rough"]}]},{"evidence_key":"fit_or_proposal","any":[{"question_id":"priority","values":["fit","change"]},{"question_id":"comfort","values":["consult"]}]},{"evidence_key":"manageability","any":[{"question_id":"priority","values":["manage"]},{"question_id":"daily","values":["easy","learn"]}]},{"evidence_key":"care","any":[{"question_id":"priority","values":["care"]},{"question_id":"comfort","values":["relax"]}]}],"thresholds":{"direct_min":3,"partial_min":1},"messages":{"DIRECT_RESONANCE":"今回整理した相談内容と、店舗で確認されているEvidenceには複数の重なりがあります。具体的な施術内容は、髪の状態を見てもらいながら相談するのが適切です。","PARTIAL_RESONANCE":"相談内容の一部は店舗Evidenceと重なります。一方で、すべてを事前に判断できる情報はないため、希望を伝えて確認するのが適切です。","CONSULTATION_REQUIRED":"今回の希望について、公開Evidenceだけでは十分な一致を確認できません。これは失敗ではなく、専門家へ直接相談することが適切な状態です。"},"no_match_text":"今回の希望と直接照合できる十分な公開Evidenceは確認できませんでした。"};

const storeEvidence = {"primaryValue": "迷い・希望・髪の悩みを聞き取り、日常で扱いやすい形へ整える相談・提案力", "serviceSignals": ["Aujua・髪質改善", "透明感カラー", "ショート・ウルフ", "ヘッドスパ"], "customerVoiceSummary": "希望や悩みを丁寧に聞いたうえで提案してくれる / 来店後もスタイリングが楽・扱いやすい / シャンプーやヘッドスパ、接客が丁寧で居心地がよい", "distinctivenessAvailable": false};
const resonanceEvidence = [{"slot_key": "consultation", "supported": true, "text": "迷い・希望・髪の悩みを聞き取り、日常で扱いやすい形へ整える相談・提案力", "evidence_mode": "THEME_OBSERVATIONS", "evidence_count": 7, "semantic_source": "semantic_data.json/primary_value", "evidence_source": "evidence-map.json/review_source/theme_observations/consultation_or_proposal"}, {"slot_key": "fit_or_proposal", "supported": true, "text": "迷い・希望・髪の悩みを聞き取り、日常で扱いやすい形へ整える相談・提案力", "evidence_mode": "THEME_OBSERVATIONS", "evidence_count": 7, "semantic_source": "semantic_data.json/primary_value", "evidence_source": "evidence-map.json/review_source/theme_observations/consultation_or_proposal"}, {"slot_key": "manageability", "supported": true, "text": "希望や悩みを丁寧に聞いたうえで提案してくれる / 来店後もスタイリングが楽・扱いやすい / シャンプーやヘッドスパ、接客が丁寧で居心地がよい", "evidence_mode": "THEME_OBSERVATIONS", "evidence_count": 10, "semantic_source": "semantic_data.json/customer_voice_summary", "evidence_source": "evidence-map.json/review_source/theme_observations/manageability_or_styling"}, {"slot_key": "care", "supported": true, "text": "Aujua・髪質改善 / 透明感カラー / ショート・ウルフ / ヘッドスパ", "evidence_mode": "THEME_OBSERVATIONS", "evidence_count": 5, "semantic_source": "semantic_data.json/service_signals", "evidence_source": "evidence-map.json/review_source/theme_observations/care"}];

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
    "あなたの回答を確定した後、Frais Toutの公開Evidenceと照合しました。";

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
    lead_id: 1839,
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
