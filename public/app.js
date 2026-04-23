import {
  experimentContent,
  getAiMessages,
  getAllQuestions,
  getConditionMatrix,
  getQuestionsByDifficulty,
} from './experiment-content.js';
import {
  ensureParticipantAuth,
  isFirebaseEnabled,
  upsertParticipantEvent,
  upsertParticipantSnapshot,
} from './firebase-runtime.js';
import { runtimeConfig } from './firebase-config.js';
import {
  chooseRandomItem,
  clone,
  formatDateTime,
  formatDuration,
  generateParticipantId,
} from './shared.js';

const STATE_VERSION = 3;
const conditionMatrix = getConditionMatrix();
const allQuestions = getAllQuestions();
const questionCountPerDifficulty = getQuestionsByDifficulty('low').length;
const questionsById = Object.fromEntries(allQuestions.map((question) => [question.id, question]));

const appTitle = document.querySelector('#app-title');
const appRoot = document.querySelector('#app-root');
const syncStatus = document.querySelector('#sync-status');

appTitle.textContent = runtimeConfig.appName;

let state = normalizeState(loadState());
let syncInFlight = false;

appRoot.addEventListener('click', handleClick);
window.addEventListener('online', () => {
  void syncParticipantState();
});

boot();

function renderStageAndFocus(smooth = true) {
  render();

  const selectorByStage = {
    consent: '.hero-grid',
    question: '.question-card',
    survey: '.survey-card',
    complete: '.complete-card',
  };

  const selector = selectorByStage[state.currentStage] ?? '.progress-card';

  requestAnimationFrame(() => {
    const element = document.querySelector(selector) ?? document.querySelector('.progress-card');

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start',
    });
  });
}

async function boot() {
  if (state.sessionInitialized && isFirebaseEnabled()) {
    try {
      const user = await ensureParticipantAuth();

      if (user && !state.ownerUid) {
        state.ownerUid = user.uid;
        persistState();
      }
    } catch (error) {
      setSyncStatus('error', `Không thể mở Firebase session: ${error.message}`);
    }
  } else if (isFirebaseEnabled()) {
    setSyncStatus('idle', 'Firebase');
  } else if (!isFirebaseEnabled()) {
    setSyncStatus('idle', 'Local preview mode');
  }

  if (state.currentStage === 'question') {
    ensureQuestionViewLogged();
  }

  if (state.currentStage === 'survey' && !state.survey.startedAt) {
    state.survey.startedAt = Date.now();
    recordEvent('survey_viewed');
    persistState();
  }

  renderStageAndFocus(false);
  void syncParticipantState();
}

function createAnswerState() {
  return {
    questionStartedAt: null,
    selectedOptionId: null,
    firstAnsweredAt: null,
    answeredAt: null,
    aiChecked: false,
    aiCheckedAt: null,
    skippedAi: false,
    completedAt: null,
    answerDurationMs: null,
    totalDurationMs: null,
  };
}

function createBlankState() {
  return {
    version: STATE_VERSION,
    sessionInitialized: false,
    participantId: null,
    ownerUid: null,
    createdAt: null,
    consentedAt: null,
    hasConsented: false,
    declined: false,
    conditionId: null,
    conditionValues: {},
    difficultyLevel: null,
    difficultyAssignedAt: null,
    questionOrder: [],
    currentStage: 'consent',
    currentQuestionIndex: 0,
    answers: Object.fromEntries(
      allQuestions.map((question) => [question.id, createAnswerState()]),
    ),
    survey: {
      startedAt: null,
      acknowledgedAt: null,
    },
    sequence: 0,
    pendingEvents: [],
    lastUpdatedAt: null,
    completedAt: null,
  };
}

function normalizeState(candidate) {
  const base = createBlankState();

  if (!candidate || candidate.version !== STATE_VERSION) {
    return base;
  }

  return {
    ...base,
    ...candidate,
    conditionValues: candidate.conditionValues ?? {},
    questionOrder:
      Array.isArray(candidate.questionOrder) && candidate.questionOrder.length
        ? candidate.questionOrder
        : base.questionOrder,
    answers: Object.fromEntries(
      allQuestions.map((question) => [
        question.id,
        {
          ...createAnswerState(),
          ...(candidate.answers?.[question.id] ?? {}),
        },
      ]),
    ),
    survey: {
      ...base.survey,
      ...(candidate.survey ?? {}),
    },
    pendingEvents: Array.isArray(candidate.pendingEvents) ? candidate.pendingEvents : [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(runtimeConfig.localStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function persistState() {
  state.lastUpdatedAt = Date.now();
  localStorage.setItem(runtimeConfig.localStorageKey, JSON.stringify(state));
}

function setSyncStatus(mode, message) {
  const normalizedMode = mode === 'idle' ? 'idle' : mode;
  syncStatus.dataset.state = normalizedMode;
  syncStatus.textContent = message;
}

function initializeParticipantSession() {
  const condition = chooseRandomItem(conditionMatrix);
  const difficultyLevel = chooseRandomItem(Object.keys(experimentContent.questionBanks));
  const questionOrder = getQuestionsByDifficulty(difficultyLevel).map((question) => question.id);
  const freshState = createBlankState();
  const now = Date.now();

  state = {
    ...freshState,
    sessionInitialized: true,
    participantId: generateParticipantId(difficultyLevel),
    createdAt: now,
    consentedAt: now,
    hasConsented: true,
    conditionId: condition.id,
    conditionValues: clone(condition.values),
    difficultyLevel,
    difficultyAssignedAt: now,
    questionOrder,
    currentStage: 'question',
  };

  recordEvent('participant_initialized', {
    difficultyLevel,
    questionOrder,
  });
  recordEvent('consent_granted');
  recordEvent('difficulty_assigned', { difficultyLevel });
  ensureQuestionViewLogged();
  persistState();
  renderStageAndFocus();
  void syncParticipantState();
}

function getCurrentQuestionId() {
  return state.questionOrder[state.currentQuestionIndex] ?? null;
}

function getCurrentQuestion() {
  const questionId = getCurrentQuestionId();
  return questionId ? questionsById[questionId] : null;
}

function ensureQuestionViewLogged() {
  const questionId = getCurrentQuestionId();

  if (!questionId) {
    return;
  }

  const answerState = state.answers[questionId];

  if (!answerState.questionStartedAt) {
    answerState.questionStartedAt = Date.now();
    recordEvent('question_viewed', { questionId });
    persistState();
  }
}

function recordEvent(type, payload = {}) {
  if (!state.sessionInitialized) {
    return;
  }

  const event = {
    eventId: `${state.participantId}-${Date.now()}-${state.sequence + 1}`,
    participantId: state.participantId,
    sequence: state.sequence + 1,
    type,
    stage: state.currentStage,
    timestamp: Date.now(),
    ...payload,
  };

  state.sequence = event.sequence;
  state.pendingEvents.push(event);
}

async function syncParticipantState() {
  if (!isFirebaseEnabled() || !state.sessionInitialized || syncInFlight) {
    return;
  }

  syncInFlight = true;
  setSyncStatus('syncing', 'Đang đồng bộ dữ liệu');

  try {
    const user = await ensureParticipantAuth();

    if (!user) {
      throw new Error('Không nhận được Firebase session.');
    }

    if (state.ownerUid && state.ownerUid !== user.uid) {
      throw new Error('Firebase session đã thay đổi. Dữ liệu sẽ tiếp tục được giữ local.');
    }

    if (!state.ownerUid) {
      state.ownerUid = user.uid;
      persistState();
    }

    await upsertParticipantSnapshot(state.participantId, buildSnapshotPayload());

    for (const event of [...state.pendingEvents]) {
      await upsertParticipantEvent(state.participantId, {
        ...event,
        ownerUid: state.ownerUid,
      });

      state.pendingEvents = state.pendingEvents.filter((entry) => entry.eventId !== event.eventId);
      persistState();
    }

    setSyncStatus('synced', 'Đã đồng bộ với Firebase');
  } catch (error) {
    setSyncStatus('error', `Đồng bộ thất bại: ${error.message}`);
  } finally {
    syncInFlight = false;
  }
}

function buildSnapshotPayload() {
  const answers = Object.fromEntries(
    Object.entries(state.answers).map(([questionId, answerState]) => [
      questionId,
      {
        ...answerState,
      },
    ]),
  );

  return {
    participantId: state.participantId,
    ownerUid: state.ownerUid,
    createdAt: state.createdAt,
    consentedAt: state.consentedAt,
    completedAt: state.completedAt,
    surveyAcknowledgedAt: state.survey.acknowledgedAt,
    lastUpdatedAt: state.lastUpdatedAt ?? Date.now(),
    conditionId: state.conditionId,
    conditionValues: state.conditionValues,
    currentStage: state.currentStage,
    currentQuestionIndex: state.currentQuestionIndex,
    questionOrder: state.questionOrder,
    difficultyLevel: state.difficultyLevel,
    difficultyAssignedAt: state.difficultyAssignedAt,
    answers,
    aiCheckCount: Object.values(state.answers).filter((entry) => entry.aiChecked).length,
    actionCount: state.sequence,
    hasConsented: state.hasConsented,
    device: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    },
  };
}

function handleClick(event) {
  const actionElement = event.target.closest('[data-action]');

  if (!actionElement) {
    return;
  }

  const action = actionElement.dataset.action;

  if (action === 'start-experiment') {
    const checkbox = document.querySelector('#consent-checkbox');
    const helper = document.querySelector('#consent-helper');

    if (!checkbox?.checked) {
      if (helper) {
        helper.textContent = 'Please check the box before starting the survey.';
      }
      return;
    }

    initializeParticipantSession();
    return;
  }

  if (action === 'decline-experiment') {
    state = createBlankState();
    state.declined = true;
    localStorage.removeItem(runtimeConfig.localStorageKey);
    renderStageAndFocus();
    return;
  }

  if (action === 'select-option') {
    selectOption(actionElement.dataset.optionId);
    return;
  }

  if (action === 'check-ai') {
    revealAiResponse();
    return;
  }

  if (action === 'advance-question') {
    finalizeCurrentQuestion(false);
    return;
  }

  if (action === 'open-survey') {
    if (runtimeConfig.survey.fallbackUrl) {
      window.open(runtimeConfig.survey.fallbackUrl, '_blank', 'noopener,noreferrer');
      recordEvent('survey_opened_external');
      persistState();
      void syncParticipantState();
    }
    return;
  }

  if (action === 'acknowledge-survey') {
    const now = Date.now();

    state.survey.acknowledgedAt = now;
    state.currentStage = 'complete';
    state.completedAt = now;
    recordEvent('survey_acknowledged');
    recordEvent('experiment_completed');
    persistState();
    renderStageAndFocus();
    void syncParticipantState();
  }
}

function selectOption(optionId) {
  if (state.currentStage !== 'question') {
    return;
  }

  const question = getCurrentQuestion();

  if (!question) {
    return;
  }

  const answerState = state.answers[question.id];

  if (answerState.completedAt || answerState.aiChecked) {
    return;
  }

  const now = Date.now();
  answerState.selectedOptionId = optionId;
  answerState.answeredAt = now;
  answerState.firstAnsweredAt = answerState.firstAnsweredAt ?? now;
  answerState.answerDurationMs = answerState.questionStartedAt
    ? now - answerState.questionStartedAt
    : null;

  recordEvent('answer_selected', { questionId: question.id, optionId });
  persistState();
  renderStageAndFocus(false);
  void syncParticipantState();
}

function revealAiResponse() {
  const question = getCurrentQuestion();

  if (!question) {
    return;
  }

  const answerState = state.answers[question.id];

  if (!answerState.selectedOptionId || answerState.aiChecked) {
    return;
  }

  answerState.aiChecked = true;
  answerState.aiCheckedAt = Date.now();

  recordEvent('ai_checked', {
    questionId: question.id,
    optionId: answerState.selectedOptionId,
  });
  persistState();
  renderStageAndFocus();
  void syncParticipantState();
}

function finalizeCurrentQuestion(skipAi) {
  const question = getCurrentQuestion();

  if (!question) {
    return;
  }

  const answerState = state.answers[question.id];

  if (!answerState.selectedOptionId) {
    return;
  }

  const now = Date.now();

  answerState.skippedAi = skipAi;
  answerState.completedAt = answerState.completedAt ?? now;
  answerState.totalDurationMs = answerState.questionStartedAt
    ? answerState.completedAt - answerState.questionStartedAt
    : null;

  recordEvent('question_completed', {
    questionId: question.id,
    optionId: answerState.selectedOptionId,
    aiChecked: answerState.aiChecked,
    skippedAi: skipAi,
    totalDurationMs: answerState.totalDurationMs,
  });

  if (state.currentQuestionIndex === state.questionOrder.length - 1) {
    state.currentStage = 'survey';
    state.survey.startedAt = state.survey.startedAt ?? now;
    recordEvent('survey_viewed');
  } else {
    state.currentQuestionIndex += 1;
    ensureQuestionViewLogged();
  }

  persistState();
  renderStageAndFocus();
  void syncParticipantState();
}

function getProgressModel() {
  const totalSteps = questionCountPerDifficulty + 3;

  if (!state.sessionInitialized) {
    return {
      current: state.declined ? 0 : 1,
      total: totalSteps,
      label: 'Consent',
    };
  }

  if (state.currentStage === 'question') {
    return {
      current: state.currentQuestionIndex + 2,
      total: totalSteps,
      label: `Question ${state.currentQuestionIndex + 1}/${state.questionOrder.length}`,
    };
  }

  if (state.currentStage === 'survey') {
    return {
      current: totalSteps - 1,
      total: totalSteps,
      label: 'Last survey',
    };
  }

  return {
    current: totalSteps,
    total: totalSteps,
    label: 'Completed',
  };
}

function render() {
  const progress = getProgressModel();

  appRoot.innerHTML = `
    <section class="surface progress-card">
      <div class="progress-meta">
        <div>
          <p class="progress-caption">Progress bar</p>
        </div>
        <div class="inline-group">
          <strong>${progress.label}</strong>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${(progress.current / progress.total) * 100}%"></div>
      </div>
    </section>
  `;

  if (state.declined) {
    appRoot.insertAdjacentHTML('beforeend', renderDeclined());
    return;
  }

  if (!state.sessionInitialized) {
    appRoot.insertAdjacentHTML('beforeend', renderConsent());
    return;
  }

  if (state.currentStage === 'question') {
    appRoot.insertAdjacentHTML('beforeend', renderQuestion());
    return;
  }

  if (state.currentStage === 'survey') {
    appRoot.insertAdjacentHTML('beforeend', renderSurvey());
    return;
  }

  appRoot.insertAdjacentHTML('beforeend', renderComplete());
}

function renderDeclined() {
  return `
    <section class="surface surface-content">
      <p class="summary-copy">${experimentContent.intro.declineCopy}</p>
    </section>
  `;
}

function renderConsent() {
  return `
    <section class="hero-grid">
      <article class="surface surface-content">
        <p class="eyebrow">${experimentContent.intro.eyebrow}</p>
        <h2>${experimentContent.intro.title}</h2>
        <p class="summary-copy">${experimentContent.intro.summary}</p>
        <ul class="bullet-list">
          ${experimentContent.intro.bullets.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </article>

      <aside class="surface hero-aside">
        <div class="section-heading">
          <p class="section-kicker">Consent</p>
          <h2>Researcher's info</h2>
        </div>
        <ul class="contact-list">
          ${experimentContent.intro.contact.map((item) => `<li>${item}</li>`).join('')}
        </ul>
        <p>
          Please read the consent form here:
          <a href="https://example.com/consent-form" target="_blank" rel="noopener noreferrer">
            Consent Form
          </a>
        </p>
        <div class="consent-block">
          <label class="checkbox-row">
            <input id="consent-checkbox" type="checkbox" />
            <span>${experimentContent.intro.consentLabel}</span>
          </label>
          <p>Start the experiment?</p>
          <div class="action-row">
            <button class="button primary" data-action="start-experiment" type="button">
              Yes
            </button>
            <button class="button ghost" data-action="decline-experiment" type="button">
              No
            </button>
          </div>
          <p class="inline-status" id="consent-helper"></p>
        </div>
      </aside>
    </section>
  `;
}

function renderQuestion() {
  const question = getCurrentQuestion();

  if (!question) {
    return `
      <section class="surface question-card">
        <p class="summary-copy">No question set is currently active.</p>
      </section>
    `;
  }

  const answerState = state.answers[question.id];
  const aiMessages = answerState.aiChecked
    ? getAiMessages(question.id, answerState.selectedOptionId, state.conditionId)
    : [];

  return `
    <section class="question-grid">
      <article class="surface question-card">
        <div class="question-meta">
          <div>
            <h2>${
              question.id
                ? question.id[0].toUpperCase() +
                  (question.id.length > 1 ? question.id[question.id.length - 1].toUpperCase() : '')
                : ''
            }</h2>
          </div>
        </div>
        <p class="question-prompt">${question.prompt}</p>
        <p class="helper-copy">${experimentContent.quiz.helper}</p>
        <div class="option-list">
          ${question.options
            .map((option) => {
              const isSelected = option.id === answerState.selectedOptionId;
              const optionClasses = ['option-card'];

              if (isSelected) {
                optionClasses.push('selected');
              }

              if (answerState.completedAt || answerState.aiChecked) {
                optionClasses.push('locked');
              }

              return `
                <button
                  class="${optionClasses.join(' ')}"
                  data-action="select-option"
                  data-option-id="${option.id}"
                  type="button"
                  ${answerState.completedAt || answerState.aiChecked ? 'disabled' : ''}
                >
                  <span class="option-badge">${option.id}</span>
                  <span class="option-text">${option.text}</span>
                </button>
              `;
            })
            .join('')}
        </div>
        <div class="action-row">
          <button
            class="button primary"
            data-action="check-ai"
            type="button"
            ${answerState.selectedOptionId && !answerState.aiChecked ? '' : 'disabled'}
          >
            ${experimentContent.quiz.checkButton}
          </button>
          ${
            answerState.aiChecked
              ? `
                <button class="button secondary" data-action="advance-question" type="button">
                  ${
                    state.currentQuestionIndex === state.questionOrder.length - 1
                      ? experimentContent.quiz.finalButton
                      : experimentContent.quiz.nextButton
                  }
                </button>
              `
              : ''
          }
        </div>
      </article>

      <aside class="surface chat-card">
        <div class="section-heading">
          <h2>Psych AI</h2>
        </div>
        <div class="chat-thread">
          ${
            state.currentQuestionIndex === 0
              ? '<div class="chat-bubble ai">Hi, I am Psych AI, a chatbot designed for human psychology studies. Let\'s start the conversation!</div>'
              : ''
          }
          <div class="chat-bubble ai">What is your choice for this question?</div>
          ${
            answerState.selectedOptionId
              ? `
                <div class="chat-bubble user">
                  I'm leaning towards answer ${answerState.selectedOptionId}: ${
                    question.options.find((entry) => entry.id === answerState.selectedOptionId)?.text
                  }
                </div>
              `
              : '<div class="chat-bubble system">Select an answer to start the conversation.</div>'
          }
          ${
            answerState.aiChecked
              ? aiMessages.map((message) => `<div class="chat-bubble ${message.role}">${message.text}</div>`).join('')
              : answerState.selectedOptionId
                ? '<div class="chat-bubble system">Press "Show AI response" to check your answer with Psych AI.</div>'
                : ''
          }
        </div>
        <p class="chat-hint">
          ${
            answerState.totalDurationMs
              ? `Response time: ${formatDuration(answerState.totalDurationMs)}`
              : ''
          }
        </p>
      </aside>
    </section>
  `;
}

function renderSurvey() {
  const hasEmbed = Boolean(runtimeConfig.survey.embedUrl);
  const hasFallback = Boolean(runtimeConfig.survey.fallbackUrl);

  return `
    <section class="surface survey-card">
      <div class="section-heading">
        <p class="section-kicker">Final survey</p>
        <h2>${experimentContent.survey.title}</h2>
      </div>
      <p class="survey-copy">${experimentContent.survey.copy}</p>
      ${
        hasEmbed
          ? `<iframe class="survey-frame" src="${runtimeConfig.survey.embedUrl}" title="Final survey"></iframe>`
          : `
            <div class="survey-placeholder">
              <p>Chưa có survey embed URL trong <code>public/firebase-config.js</code>.</p>
              <p>Điền link Google Form của bạn vào <code>survey.embedUrl</code> hoặc <code>survey.fallbackUrl</code>.</p>
            </div>
          `
      }
      <div class="action-row">
        ${
          hasFallback
            ? `
              <button class="button ghost" data-action="open-survey" type="button">
                ${experimentContent.survey.openFallbackButton}
              </button>
            `
            : ''
        }
        <button class="button primary" data-action="acknowledge-survey" type="button">
          ${experimentContent.survey.confirmButton}
        </button>
      </div>
    </section>
  `;
}

function renderComplete() {
  const answeredCount = state.questionOrder.filter(
    (questionId) => state.answers[questionId]?.selectedOptionId,
  ).length;
  const aiChecks = state.questionOrder.filter((questionId) => state.answers[questionId]?.aiChecked)
    .length;

  return `
    <section class="surface complete-card">
      <div class="section-heading">
        <p class="section-kicker">Completed</p>
        <h2>${experimentContent.complete.title}</h2>
      </div>
      <p class="summary-copy">${experimentContent.complete.copy}</p>
      <div class="participant-code">ID: ${state.participantId}</div>
      <p> Thời điểm hoàn tất: ${formatDateTime(state.completedAt)}</p>
    </section>
  `;
}
