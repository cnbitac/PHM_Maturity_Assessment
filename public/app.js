(function () {
  const { DIMENSIONS, LEVELS, QUESTIONS, RESULT_COPY_EN, scoreAssessment, validateAnswers } = window.Assessment;
  const BROCHURE_URL = "/2026_交泰智能_Brochure.pdf";
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

  function showToast(zh, en) {
    setBilingualContent(toast, zh, en);
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

    if (!name) return { error: ["请填写姓名", "Please enter your name."] };
    if (!company) return { error: ["请填写工作单位", "Please enter your company."] };
    if (!phoneValid) return { error: ["请填写正确的电话", "Please enter a valid phone number."] };
    if (!consent) return { error: ["请先勾选授权说明", "Please accept the consent statement first."] };

    return { name, company, phone, consent };
  }

  async function handleLeadSubmit(event) {
    event.preventDefault();
    const submitButton = leadForm.querySelector('button[type="submit"]');
    const payload = validateLeadForm(new FormData(leadForm));
    if (payload.error) {
      showToast(...payload.error);
      return;
    }

    submitButton.disabled = true;
    setBilingualContent(submitButton, "保存中", "Saving...");
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
      showToast(error.message || "网络不稳定，请重试", "Please try again due to a network issue.");
    } finally {
      submitButton.disabled = false;
      setBilingualContent(submitButton, "进入答题", "Start Questions");
    }
  }

  function renderQuestion() {
    const question = QUESTIONS[state.currentQuestionIndex];
    if (!question) return;

    const dimension = dimensionMap[question.dimension];
    const progress = ((state.currentQuestionIndex + 1) / QUESTIONS.length) * 100;
    const selectedValue = state.answers[question.id];

    setBilingualContent(dimensionLabel, dimension.label, dimension.labelEn);
    setBilingualContent(dimensionPrompt, dimension.prompt, dimension.promptEn);
    questionCounter.textContent = `${state.currentQuestionIndex + 1} / ${QUESTIONS.length}`;
    progressBar.style.width = `${progress}%`;
    setBilingualContent(questionTitle, question.title, question.titleEn);
    setBilingualContent(questionHint, question.hint, question.hintEn);
    questionBackButton.disabled = state.currentQuestionIndex === 0;

    optionsList.innerHTML = "";
    question.options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "option-button";
      button.type = "button";
      button.setAttribute("aria-pressed", String(Number(selectedValue) === option.value));
      button.innerHTML = `
        <strong>${bilingualHtml(option.label, option.labelEn)}</strong>
        <span class="option-detail">${bilingualHtml(option.detail, option.detailEn)}</span>
      `;
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
      showToast("还有题目没有完成", "Please complete all questions.");
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
      showToast(
        "结果已生成，但保存失败，请让工作人员协助",
        "Your result is ready, but it could not be saved. Please ask our staff for help."
      );
    } finally {
      state.savingAssessment = false;
    }
  }

  function renderResult(score, meta) {
    const result = score.result;
    const resultEn = RESULT_COPY_EN[result.id];
    const dimensions = DIMENSIONS.map((dimension) => score.dimensions[dimension.id]);
    const savedCopy = meta.saved
      ? ["评估结果已保存", "Assessment result saved"]
      : meta.saving
        ? ["正在保存评估结果", "Saving assessment result"]
        : ["结果未保存，请联系工作人员", "Result not saved. Please contact our staff"];

    resultCard.innerHTML = `
      <div class="result-hero ${escapeHtml(result.id)}">
        <div class="result-label">
          <strong class="result-outcome">${bilingualHtml(result.label, resultEn.label)}</strong>
          <span class="result-badge">${bilingualHtml(result.badge, resultEn.badge)}</span>
        </div>
        <h2>${bilingualHtml(result.headline, resultEn.headline)}</h2>
        <p>${bilingualHtml(result.summary, resultEn.summary)}</p>
      </div>

      <div class="dimension-bars">
        ${dimensions.map(renderDimensionBar).join("")}
      </div>

      <div class="insight-block">
        <h3>${bilingualHtml("判断依据", "Why this result")}</h3>
        <p>${bilingualHtml(result.basis, resultEn.basis)}</p>
      </div>

      <div class="insight-block">
        <h3>${bilingualHtml("下一步建议", "Recommended next steps")}</h3>
        <ul>${result.nextSteps.map((step, index) => `
          <li>${bilingualHtml(step, resultEn.nextSteps[index])}</li>
        `).join("")}</ul>
      </div>

      <div class="result-actions">
        <a class="primary-action brochure-action" id="brochureButton" href="${escapeHtml(BROCHURE_URL)}" download="交泰智能机电一体化设备健康与控制协同解决方案.pdf">
          ${bilingualHtml("下载解决方案手册", "Download Solution Brochure")}
        </a>
        <button class="ghost-action" type="button" id="restartButton">
          ${bilingualHtml("重新评估", "Restart")}
        </button>
        <button class="primary-action" type="button" id="staffButton">
          ${bilingualHtml("请工作人员解读", "Ask Our Staff")}
        </button>
      </div>
      <p class="staff-note">${bilingualHtml(
        `${savedCopy[0]}。向工作人员出示此页，可以直接围绕四维结果展开沟通。`,
        `${savedCopy[1]}. Show this page to our staff to discuss your four-dimension result.`
      )}</p>
    `;

    document.getElementById("restartButton").addEventListener("click", restart);
    document.getElementById("staffButton").addEventListener("click", () => {
      showToast(
        "请向展位工作人员出示当前结果页",
        "Please show this result page to our booth staff."
      );
    });
  }

  function renderDimensionBar(dimension) {
    const width = Math.round((dimension.score / dimension.maxScore) * 100);
    const dimensionCopy = dimensionMap[dimension.id];
    const levelCopy = LEVELS[dimension.level];
    return `
      <div class="dimension-bar">
        <div class="bar-meta">
          <strong>${bilingualHtml(dimension.label, dimensionCopy.labelEn)}</strong>
          <span class="bar-score">
            ${bilingualHtml(
              `${dimension.score}/${dimension.maxScore} · ${dimension.levelLabel}`,
              `${dimension.score}/${dimension.maxScore} · ${levelCopy.labelEn}`
            )}
          </span>
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

  function bilingualHtml(zh, en) {
    return `<span class="copy-zh">${escapeHtml(zh)}</span>` +
      `<span class="copy-en" lang="en">${escapeHtml(en)}</span>`;
  }

  function setBilingualContent(element, zh, en) {
    element.innerHTML = bilingualHtml(zh, en);
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
