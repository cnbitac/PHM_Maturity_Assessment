(function () {
  const { DIMENSIONS, QUESTIONS, scoreAssessment, validateAnswers } = window.Assessment;
  const dimensionMap = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.id, dimension]));
  const state = {
    screen: "intro",
    currentQuestionIndex: 0,
    answers: {},
    lead: null,
    source: getSource(),
    leadSubmissionId: makeClientId("lead"),
    assessmentSubmissionId: makeClientId("assessment"),
    savingAssessment: false
  };

  const screens = {
    intro: document.querySelector('[data-screen="intro"]'),
    lead: document.querySelector('[data-screen="lead"]'),
    quiz: document.querySelector('[data-screen="quiz"]'),
    result: document.querySelector('[data-screen="result"]')
  };

  const startButton = document.getElementById("startButton");
  const leadForm = document.getElementById("leadForm");
  const questionBackButton = document.getElementById("questionBackButton");
  const dimensionLabel = document.getElementById("dimensionLabel");
  const dimensionPrompt = document.getElementById("dimensionPrompt");
  const questionCounter = document.getElementById("questionCounter");
  const progressBar = document.getElementById("progressBar");
  const questionTitle = document.getElementById("questionTitle");
  const questionHint = document.getElementById("questionHint");
  const optionsList = document.getElementById("optionsList");
  const resultCard = document.getElementById("resultCard");
  const toast = document.getElementById("toast");

  startButton.addEventListener("click", () => showScreen("lead"));
  document.querySelector("[data-back-intro]").addEventListener("click", () => showScreen("intro"));
  questionBackButton.addEventListener("click", goBackQuestion);
  leadForm.addEventListener("submit", handleLeadSubmit);

  renderQuestion();

  function getSource() {
    const params = new URLSearchParams(window.location.search);
    return params.get("src") || params.get("utm_source") || "waic-booth";
  }

  function makeClientId(prefix) {
    if (window.crypto && window.crypto.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function showScreen(name) {
    state.screen = name;
    Object.entries(screens).forEach(([screenName, element]) => {
      element.classList.toggle("screen-active", screenName === name);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function validateLeadForm(formData) {
    const name = String(formData.get("name") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const phone = String(formData.get("phone") || "").replace(/\s+/g, "");
    const consent = formData.get("consent") === "on";
    const phoneValid = /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8}|\+?\d{6,20})$/.test(phone);

    if (!name) return { error: "请填写姓名" };
    if (!company) return { error: "请填写工作单位" };
    if (!phoneValid) return { error: "请填写正确的电话" };
    if (!consent) return { error: "请先勾选授权说明" };

    return { name, company, phone, consent };
  }

  async function handleLeadSubmit(event) {
    event.preventDefault();
    const submitButton = leadForm.querySelector('button[type="submit"]');
    const payload = validateLeadForm(new FormData(leadForm));
    if (payload.error) {
      showToast(payload.error);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "保存中";
    try {
      const response = await apiPost("/api/leads", {
        ...payload,
        source: state.source,
        clientSubmissionId: state.leadSubmissionId
      });
      state.lead = response.lead;
      showScreen("quiz");
      renderQuestion();
    } catch (error) {
      showToast(error.message || "网络不稳定，请重试");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "进入答题";
    }
  }

  function renderQuestion() {
    const question = QUESTIONS[state.currentQuestionIndex];
    if (!question) return;

    const dimension = dimensionMap[question.dimension];
    const progress = ((state.currentQuestionIndex + 1) / QUESTIONS.length) * 100;
    const selectedValue = state.answers[question.id];

    dimensionLabel.textContent = dimension.label;
    dimensionPrompt.textContent = dimension.prompt;
    questionCounter.textContent = `${state.currentQuestionIndex + 1} / ${QUESTIONS.length}`;
    progressBar.style.width = `${progress}%`;
    questionTitle.textContent = question.title;
    questionHint.textContent = question.hint;
    questionBackButton.disabled = state.currentQuestionIndex === 0;

    optionsList.innerHTML = "";
    question.options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "option-button";
      button.type = "button";
      button.setAttribute("aria-pressed", String(Number(selectedValue) === option.value));
      button.innerHTML = `<strong>${escapeHtml(option.label)}</strong><span>${escapeHtml(option.detail)}</span>`;
      button.addEventListener("click", () => chooseAnswer(question.id, option.value));
      optionsList.appendChild(button);
    });
  }

  function chooseAnswer(questionId, value) {
    state.answers[questionId] = value;
    renderQuestion();
    window.setTimeout(() => {
      if (state.currentQuestionIndex < QUESTIONS.length - 1) {
        state.currentQuestionIndex += 1;
        renderQuestion();
      } else {
        finishAssessment();
      }
    }, 120);
  }

  function goBackQuestion() {
    if (state.currentQuestionIndex > 0) {
      state.currentQuestionIndex -= 1;
      renderQuestion();
    }
  }

  async function finishAssessment() {
    const errors = validateAnswers(state.answers);
    if (errors.length) {
      showToast("还有题目没有完成");
      return;
    }

    const localScore = scoreAssessment(state.answers);
    renderResult(localScore, { saving: true });
    showScreen("result");

    if (!state.lead || state.savingAssessment) return;
    state.savingAssessment = true;
    try {
      const response = await apiPost("/api/assessments", {
        leadId: state.lead.leadId,
        source: state.source,
        answers: state.answers,
        clientSubmissionId: state.assessmentSubmissionId
      });
      renderResult(response.score, { saved: true, assessmentId: response.assessment.assessmentId });
    } catch (error) {
      renderResult(localScore, { saved: false, error: error.message });
      showToast("结果已生成，但保存失败，请让工作人员协助");
    } finally {
      state.savingAssessment = false;
    }
  }

  function renderResult(score, meta) {
    const result = score.result;
    const dimensions = DIMENSIONS.map((dimension) => score.dimensions[dimension.id]);
    const savedText = meta.saved
      ? "评估结果已保存"
      : meta.saving
        ? "正在保存评估结果"
        : "结果未保存，请联系工作人员";

    resultCard.innerHTML = `
      <div class="result-hero ${escapeHtml(result.id)}">
        <div class="result-label">
          <strong>${escapeHtml(result.label)}</strong>
          <span>${escapeHtml(result.badge)}</span>
        </div>
        <h2>${escapeHtml(result.headline)}</h2>
        <p>${escapeHtml(result.summary)}</p>
      </div>

      <div class="dimension-bars">
        ${dimensions.map(renderDimensionBar).join("")}
      </div>

      <div class="insight-block">
        <h3>判断依据</h3>
        <p>${escapeHtml(result.basis)}</p>
      </div>

      <div class="insight-block">
        <h3>下一步建议</h3>
        <ul>${result.nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul>
      </div>

      <div class="result-actions">
        <button class="ghost-action" type="button" id="restartButton">重新评估</button>
        <button class="primary-action" type="button" id="staffButton">请工作人员解读</button>
      </div>
      <p class="staff-note">${escapeHtml(savedText)}。向工作人员出示此页，可以直接围绕四维结果展开沟通。</p>
    `;

    document.getElementById("restartButton").addEventListener("click", restart);
    document.getElementById("staffButton").addEventListener("click", () => {
      showToast("请向展位工作人员出示当前结果页");
    });
  }

  function renderDimensionBar(dimension) {
    const width = Math.round((dimension.score / dimension.maxScore) * 100);
    return `
      <div class="dimension-bar">
        <div class="bar-meta">
          <strong>${escapeHtml(dimension.label)}</strong>
          <span>${dimension.score}/${dimension.maxScore} · ${escapeHtml(dimension.levelLabel)}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
      </div>
    `;
  }

  function restart() {
    state.currentQuestionIndex = 0;
    state.answers = {};
    state.assessmentSubmissionId = makeClientId("assessment");
    showScreen("quiz");
    renderQuestion();
  }

  async function apiPost(url, payload) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "请求失败");
      }
      return data;
    } catch (error) {
      if (error.name === "AbortError") throw new Error("网络超时，请重试");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
