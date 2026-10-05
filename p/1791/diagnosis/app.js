"use strict";

const DIAGNOSIS_VERSION = "1791-spec-v2-dryrun";

const PATHFLOW_ANALYTICS = {
  apiKey: "3c4155ba8800bb2242f3bccec4a4053c",
  endpoint: "https://api2.amplitude.com/2/httpapi",
  commonProperties: {
    lead_id: "1791",
    store_name: "ガーデンヨコハマエスト(GARDEN YOKOHAMA est)",
    variant_code: "STANDARD_LP",
    lp_version: "1",
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
          " sent: lead_id=1791 events_ingested=" +
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

const questions = [
  {
    id: "priority",
    eyebrow: "01 / CURRENT PRIORITY",
    title: "今いちばん整えたいのは、どれですか？",
    help: "完成形ではなく、「今気になっていること」に近いものを選んでください。",
    answers: [
      {
        value: "fit",
        label: "自分に似合う形を相談しながら決めたい"
      },
      {
        value: "manage",
        label: "朝のセットや普段の扱いを楽にしたい"
      },
      {
        value: "texture",
        label: "くせ・広がり・まとまりを整えたい"
      },
      {
        value: "change",
        label: "雰囲気を変えたいが、具体的にはまだ決めていない"
      }
    ]
  },
  {
    id: "decision",
    eyebrow: "02 / DECISION",
    title: "スタイルは、どのくらい決まっていますか？",
    help: "写真や髪型の名前まで決まっていなくても問題ありません。",
    answers: [
      {
        value: "open",
        label: "ほとんど決まっていない。相談しながら考えたい"
      },
      {
        value: "rough",
        label: "なんとなくイメージはあるが、細部は相談したい"
      },
      {
        value: "clear",
        label: "かなり具体的に決まっている"
      }
    ]
  },
  {
    id: "daily",
    eyebrow: "03 / DAILY LIFE",
    title: "日常では、何を大切にしたいですか？",
    help: "サロン直後より、その後の毎日に近いものを選んでください。",
    answers: [
      {
        value: "easy",
        label: "できるだけ手間をかけずに整えたい"
      },
      {
        value: "learn",
        label: "セット方法が分かれば、自分でも少し手をかけられる"
      },
      {
        value: "design",
        label: "多少手間がかかっても、デザインを優先したい"
      }
    ]
  },
  {
    id: "communication",
    eyebrow: "04 / COMMUNICATION",
    title: "相談するとき、どんな進め方が安心ですか？",
    help: "美容師との会話や提案の受け方について選んでください。",
    answers: [
      {
        value: "guide",
        label: "希望を聞いてもらいながら、提案もしてほしい"
      },
      {
        value: "confirm",
        label: "自分の希望を中心に、認識を確認しながら進めたい"
      },
      {
        value: "minimal",
        label: "必要な確認だけで、静かに過ごしたい"
      }
    ]
  }
];

const storeEvidence = {
  primaryValue: "言葉になりきらない希望を汲み取り、似合う形と日常の扱いやすさへつなげる相談・提案",
  serviceSignals: ["カット","レイヤー/顔まわり","ショートボブ","カラー","透明感カラー","N.カラー","Rezoカラー","トリートメント","marbb","ホームケア/スタイリング助言"],
  customerVoiceSummary: "公開口コミ30件の傾向から、曖昧・大まかな要望でもニュアンスや好みを汲み取った提案、髪質・頭の形・悩みに合わせた提案と日常の扱いやすさ、乾かし方・巻き方・ホームケアの助言、スタッフ対応や居心地への肯定的な評価が複数確認できる。一方、少数ではカウンセリングやイメージ共有不足、仕上がり相違への否定的な記述も確認される。",
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

function buildSelfDiscovery() {
  const consultationPoints = [];
  let title = "";
  let summary = "";

  switch (answers.priority) {
    case "fit":
      title = "「似合う」を、相談しながら見つけたい";
      consultationPoints.push(
        "自分に合う長さ・形・顔まわりのバランスを相談したい"
      );
      break;

    case "manage":
      title = "毎日の扱いやすさを優先したい";
      consultationPoints.push(
        "朝のセットや、自宅での扱いやすさを重視したい"
      );
      break;

    case "texture":
      title = "髪質やまとまりの悩みを整理したい";
      consultationPoints.push(
        "くせ・広がり・まとまりについて、今の状態を見ながら相談したい"
      );
      break;

    case "change":
      title = "雰囲気を変えたいが、答えはまだ決まっていない";
      consultationPoints.push(
        "今の雰囲気から変えたいが、具体的なスタイルは相談して決めたい"
      );
      break;
  }

  if (answers.decision === "open") {
    consultationPoints.push(
      "完成形は決め切らず、会話しながら選択肢を整理したい"
    );
  } else if (answers.decision === "rough") {
    consultationPoints.push(
      "大まかなイメージを伝えて、細部を一緒に調整したい"
    );
  } else {
    consultationPoints.push(
      "希望するスタイルをベースに、実現方法を確認したい"
    );
  }

  if (answers.daily === "easy") {
    consultationPoints.push(
      "日常では、できるだけ手間の少ない状態を維持したい"
    );
  } else if (answers.daily === "learn") {
    consultationPoints.push(
      "自宅で再現するためのセット方法も知りたい"
    );
  } else {
    consultationPoints.push(
      "日常の手間より、デザインの完成度を優先したい"
    );
  }

  if (answers.communication === "guide") {
    consultationPoints.push(
      "希望を聞いてもらったうえで、プロからの提案も受けたい"
    );
  } else if (answers.communication === "confirm") {
    consultationPoints.push(
      "自分の希望を軸に、認識を合わせながら進めたい"
    );
  } else {
    consultationPoints.push(
      "必要な確認はしつつ、会話量は控えめにしたい"
    );
  }

  summary =
    "髪型そのものを先に決めるより、今の優先順位と日常での過ごし方を伝えてから相談すると、希望を共有しやすい状態です。";

  return {
    title,
    summary,
    consultationPoints
  };
}

const resonanceSupport = [
  false, false,
  false, false
];

function buildResonance() {
  const matched = [];
  let score = 0;

  if ((
    answers.decision === "open" ||
    answers.decision === "rough"
  ) && resonanceSupport[0] === true) {
    matched.push(
      "UNKNOWN"
    );
    score += 1;
  }

  if ((
    answers.priority === "fit" ||
    answers.communication === "guide"
  ) && resonanceSupport[1] === true) {
    matched.push(
      "UNKNOWN"
    );
    score += 1;
  }

  if ((
    answers.priority === "manage" ||
    answers.daily === "easy" ||
    answers.daily === "learn"
  ) && resonanceSupport[2] === true) {
    matched.push(
      "UNKNOWN"
    );
    score += 1;
  }

  if ((answers.priority === "texture") && resonanceSupport[3] === true) {
    matched.push(
      "UNKNOWN"
    );
    score += 1;
  }

  let type;
  let message;

  if (score >= 3) {
    type = "DIRECT_RESONANCE";
    message =
      "今回整理した相談内容と、店舗で確認されているEvidenceには複数の重なりがあります。具体的な施術内容は、髪の状態を見てもらいながら相談するのが適切です。";
  } else if (score >= 1) {
    type = "PARTIAL_RESONANCE";
    message =
      "相談内容の一部は店舗Evidenceと重なります。一方で、すべてを事前に判断できる情報はないため、希望を伝えて確認するのが適切です。";
  } else {
    type = "CONSULTATION_REQUIRED";
    message =
      "今回の希望について、公開Evidenceだけでは十分な一致を確認できません。これは失敗ではなく、専門家へ直接相談することが適切な状態です。";
  }

  if (matched.length === 0) {
    matched.push(
      "今回の希望と直接照合できる十分な公開Evidenceは確認できませんでした。"
    );
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
    "あなたの回答を確定した後、ガーデンヨコハマエスト(GARDEN YOKOHAMA est)の公開Evidenceと照合しました。";

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
    lead_id: "1791",
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
