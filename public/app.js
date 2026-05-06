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
  signOutCurrentUser
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
const questionCountPerDifficulty = getQuestionsByDifficulty('wdl').length;
const questionsById = Object.fromEntries(allQuestions.map((question) => [question.id, question]));

const appTitle = document.querySelector('#app-title');
const appRoot = document.querySelector('#app-root');
const syncStatus = document.querySelector('#sync-status');

appTitle.textContent = runtimeConfig.appName;

let state = normalizeState(loadState());
let syncInFlight = false;
let surveyTimer = null;

appRoot.addEventListener('click', handleClick);
appRoot.addEventListener('change', handleChange);
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

  // const stopBtn = document.querySelector('#global-stop-btn');
  // if (stopBtn) {
  //   const hiddenStages = ['intro', 'consent', 'complete', 'stopped', 'declined'];
    
  //   if (hiddenStages.includes(state.currentStage)) {
  //     stopBtn.style.display = 'none';
  //   } else {
  //     stopBtn.style.display = 'block'; // Shows the button on middle stages
  //   }
  // }

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
    setSyncStatus('idle', '');
  } else if (!isFirebaseEnabled()) {
    setSyncStatus('idle', 'Local');
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
    aiLoading: false,
    aiChecked: false,
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
    attitudeSurvey: {
      answers: {},
      completedAt: null,
    },
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
    attitudeSurvey: {
      answers: candidate.attitudeSurvey?.answers ?? {},
      completedAt: candidate.attitudeSurvey?.completedAt ?? null,
    },
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
    currentStage: 'attitude-survey',
  };

  recordEvent('participant_initialized', {
    difficultyLevel,
    questionOrder,
  });
  recordEvent('consent_granted');
  recordEvent('difficulty_assigned', { difficultyLevel });
  // ensureQuestionViewLogged();
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
  setSyncStatus('syncing', '');

  try {
    const user = await ensureParticipantAuth();

    if (!user) {
      throw new Error('Cannot receive Firebase session.');
    }

    if (state.ownerUid && state.ownerUid !== user.uid) {
      throw new Error('Firebase session has changed. Data will be stored locally.');
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

    setSyncStatus('synced', '');
  } catch (error) {
    setSyncStatus('error', `${error.message}`);
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

  if (action === 'restart-experiment') {
    if (runtimeConfig && runtimeConfig.localStorageKey) {
      localStorage.removeItem(runtimeConfig.localStorageKey);
    }
    signOutCurrentUser().finally(() => {
      window.location.reload();
    });
    return;
  }

  if (action === 'stop-experiment') {
    // Optional: Ask for confirmation before wiping their progress
    if (!confirm("Are you sure you want to stop? Your progress will not be saved.")) {
      return;
    }

    state.currentStage = 'stopped';
    persistState();
    renderStageAndFocus();
    return;
  }

  if (action === 'decline-experiment') {
    state = createBlankState();
    state.declined = true;
    localStorage.removeItem(runtimeConfig.localStorageKey);
    renderStageAndFocus();
    return;
  }

  if (action === 'finish-attitude-survey') {
    state.attitudeSurvey.completedAt = Date.now();
    state.currentStage = 'question';
    ensureQuestionViewLogged();
    recordEvent('attitude_survey_completed');
    persistState();
    renderStageAndFocus();
    void syncParticipantState();
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

      if (!state.survey.openedAt) {
        state.survey.openedAt = Date.now();
        recordEvent('survey_opened_external');
        persistState();
      }
      
      renderStageAndFocus(false);
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

  if (action === 'copy-id') {
    navigator.clipboard.writeText(state.participantId).then(() => {
      const originalContent = actionElement.innerHTML;

      actionElement.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      
      setTimeout(() => {
        actionElement.innerHTML = originalContent;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
    return;
  }
}

function handleChange(event) {
  if (event.target.dataset.action === 'select-attitude') {
    state.attitudeSurvey.answers[event.target.dataset.questionId] = event.target.value;
    persistState();
    render(); // Re-render to unlock the continue button if all answered
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
  render();
  void syncParticipantState();
}

function revealAiResponse() {
  const question = getCurrentQuestion();

  if (!question) {
    return;
  }

  const answerState = state.answers[question.id];

  // Prevent multiple clicks while it is already loading or checked
  if (!answerState.selectedOptionId || answerState.aiChecked || answerState.aiLoading) {
    return;
  }

  // 1. Mark the exact time the user clicked the button
  answerState.aiRequestedAt = Date.now();
  
  // 2. Turn on the loading state
  answerState.aiLoading = true;

  // IMPORTANT: We do NOT set aiChecked = true here anymore! 
  // The renderQuestion function will automatically turn it to true when the 4.5 second animation finishes.

  persistState();
  renderStageAndFocus(false);
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
  const totalSteps = questionCountPerDifficulty + 4;

  if (!state.sessionInitialized) {
    return { current: state.declined ? 0 : 1, total: totalSteps, label: 'Consent' };
  }

  if (state.currentStage === 'attitude-survey') {
    return { current: 2, total: totalSteps, label: 'General' };
  }

  if (state.currentStage === 'question') {
    return {
      current: state.currentQuestionIndex + 3,
      total: totalSteps,
      label: `Question ${state.currentQuestionIndex + 1}/${state.questionOrder.length}`,
    };
  }

  if (state.currentStage === 'survey') {
    return { current: totalSteps - 1, total: totalSteps, label: 'Last survey' };
  }

  return { current: totalSteps, total: totalSteps, label: 'Completed' };
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

  if (state.currentStage === 'attitude-survey') {
    appRoot.insertAdjacentHTML('beforeend', renderAttitudeSurvey());
    return;
  }

  if (state.currentStage === 'question') {
    appRoot.insertAdjacentHTML('beforeend', renderQuestion());
    return;
  }

  if (state.currentStage === 'survey') {
    appRoot.insertAdjacentHTML('beforeend', renderSurvey());
    startSurveyTimer();
    return;
  }

  if (state.currentStage === 'stopped') {
    appRoot.insertAdjacentHTML('beforeend', renderStopped());
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

function renderStopped() {
  return `
    <section class="surface surface-content">
      <div class="section-heading">
        <h2>Experiment Stopped</h2>
      </div>
      <p class="summary-copy">
        You have chosen to end the experiment early. Your current progress has been halted.
      </p>
      
      <div class="action-row">
        <button class="button primary" data-action="restart-experiment" type="button">
          Start a New Session
        </button>
      </div>
    </section>
  `;
}

function renderConsent() {
  return `
    <section class="hero-grid">
      <article class="surface surface-content">
        <p class="eyebrow">${experimentContent.intro.eyebrow}</p>
        <h2>${experimentContent.intro.title}</h2>
        <div class="summary-copy"> 
          <p>Thank you for taking part in this study. This research is conducted as part of a project aimed at developing and improving an AI-assisted decision support program for educational settings.</p>
          
          <p>We are currently in the testing phase and need your input to understand how the program is used across different types of tasks and users.</p>
        </div>
        <article>
          <div class="accordion-container">
            
            <details class="accordion-item" open>
              <summary><strong>What you will do</strong></summary>
              <p class="summary-copy">This study consists of two parts:</p>
              <p class="summary-copy"><strong><em>1. Task section</em></strong></p>

              <p class="summary-copy-copy">You will work through a series of short reasoning and judgment tasks related to educational scenarios. For each task, you will select the answer that best reflects your own thinking.</p>
              <p class="summary-copy-copy">After each answer, KAI — the AI assistant being evaluated — will provide a brief response. Please read KAI's response carefully before moving on to the next task.</p>

              <p class="summary-copy"><strong><em>2. Questionnaire</em></strong></p>
              
              <p class="summary-copy-copy">After completing the tasks, you will fill out a short questionnaire about your experience with the program.</p>

              <p class="summary-copy">Your responses will help us assess how well KAI performs and how it can be improved to better support decision-making in educational contexts.</p>
            </details>

            <details class="accordion-item">
              <summary><strong>Time required</strong></summary>
              <p class="summary-copy">The study will take approximately <strong>10~15 minutes.</strong></p>
            </details>

            <details class="accordion-item">
              <summary><strong>Confidentiality</strong></summary>
              <p class="summary-copy">All responses will be kept confidential and used for research purposes only. No personally identifying information will be linked to your responses.</p>
            </details>

            <details class="accordion-item">
              <summary><strong>Voluntary participation and Risks and discomfort</strong></summary>
              <p class="summary-copy">There are no known risks beyond those encountered in everyday activities.</p>
              <p class="summary-copy">Participation is voluntary. You may stop participating at any time without disadvantage or penalty.</p>
              <p class="summary-copy">Please note that some questions require a response in order to proceed through the study.</p>
            </details>

            <details class="accordion-item">
              <summary><strong>Study procedure notice</strong></summary>
              <p class="summary-copy">To ensure the validity of the research, some aspects of the study cannot be fully explained in advance. A full explanation will be provided at the end of the study.</p>
            </details>

          </div>
        </article>
      </article>

      <aside class="surface hero-aside">
        <div class="section-heading">
          <p class="section-kicker">Contact</p>
          <h2>Contact information</h2>
        </div>
        <div class="summary-copy"> 
          <p>If you have any questions about this study, please feel free to contact: Nguyen Phuong Ngoc (지원).</p>
          <p>
            Email: <a href="mailto:ngocnguyen@ewha.ac.kr" class="email-link">ngocnguyen@ewha.ac.kr</a>
          </p>
        </div>
        <p class="summary-copy">
          Please read the consent before the experiment. By clicking “I agree and continue,” you confirm that you have read and understood the information above and voluntarily agree to participate in this study.
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

function renderAttitudeSurvey() {
  const content = experimentContent.attitudeSurvey;
  const answers = state.attitudeSurvey.answers;
  // Check if all 6 questions have a selected answer
  const allAnswered = content.questions.every((q) => answers[q.id]);

  return `
    <section class="surface question-card">
      <div class="section-heading">
        <h2>${content.title}</h2>
      </div>
      <div class="summary-copy">
        <p>${content.intro}</p>
        <p><strong>${content.instruction}</strong></p>
        <p>(1 = Strongly agree and 7 = Strongly disagree)</p>
      </div>

      <div class="attitude-list">
        ${content.questions.map((q, i) => `
          <div class="attitude-item">
            <p>${i + 1}. ${q.text}</p>
            <div class="likert-scale">
              <span class="likert-bound">${content.labels.left}</span>
              <div class="likert-radios">
                ${[1, 2, 3, 4, 5, 6, 7].map(val => `
                  <label class="likert-radio">
                    <input type="radio" name="${q.id}" value="${val}" 
                      data-action="select-attitude" data-question-id="${q.id}"
                      ${answers[q.id] === String(val) ? 'checked' : ''} />
                    <span>${val}</span>
                  </label>
                `).join('')}
              </div>
              <span class="likert-bound">${content.labels.right}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="opacity: ${allAnswered ? '1' : '0'}; transition: opacity 0.3s ease; margin-bottom: 16px;">
        <p>
          You will now begin the task section. During this part, you will receive feedback from an AI assistant.
        </p>
      </div>
      <div class="action-row">
        <button class="button primary" data-action="finish-attitude-survey" type="button" ${allAnswered ? '' : 'disabled'}>
          ${content.nextButton}
        </button>
      </div>
      <div style="margin-top: 12px; padding-bottom: 12px; display: flex; justify-content: flex-start; width: 100%;">
        <button 
          class="button ghost" 
          data-action="stop-experiment" 
          type="button" 
          style="color: var(--muted); text-decoration: underline;"
        >
          Stop the experiment
        </button>
      </div>
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
  
  // FIX 1: We now generate the AI messages as soon as the user selects an option.
  // This ensures the text is ready to be rendered during the middle animation phase!
  const aiMessages = answerState.selectedOptionId
    ? getAiMessages(question.id, answerState.selectedOptionId, state.conditionId)
    : [];

  // --- INTRO LOGIC (Runs when question loads) ---
  const isFirstQuestion = state.currentQuestionIndex === 0;
  const typingDelay = 1500; 
  const systemDelay = 500; 
  const introFinalPhase = isFirstQuestion ? 3 : 2; 
  let introPhase = 0; 

  if (answerState.questionStartedAt) {
    const elapsed = Date.now() - answerState.questionStartedAt;
    if (isFirstQuestion) {
      if (elapsed < typingDelay) {
        introPhase = 0;
        setTimeout(() => render(), typingDelay - elapsed);
      } else if (elapsed < typingDelay * 2) {
        introPhase = 1;
        setTimeout(() => render(), (typingDelay * 2) - elapsed);
      } else if (elapsed < (typingDelay * 2) + systemDelay) {
        introPhase = 2; 
        setTimeout(() => render(), ((typingDelay * 2) + systemDelay) - elapsed);
      } else {
        introPhase = 3; 
      }
    } else {
      if (elapsed < typingDelay) {
        introPhase = 0;
        setTimeout(() => render(), typingDelay - elapsed);
      } else if (elapsed < typingDelay + systemDelay) {
        introPhase = 1; 
        setTimeout(() => render(), (typingDelay + systemDelay) - elapsed);
      } else {
        introPhase = 2; 
      }
    }
  } else {
     introPhase = introFinalPhase; 
  }
  const isIntroComplete = introPhase === introFinalPhase;


  // --- FEEDBACK LOGIC (Runs when "Ask KAI" is clicked) ---
  let feedbackPhase = 0;
  if (answerState.aiLoading && answerState.aiRequestedAt) {
    const fbElapsed = Date.now() - answerState.aiRequestedAt;
    
    if (fbElapsed < typingDelay) {
      feedbackPhase = 0; // Typing "Thanks"
      setTimeout(() => render(), typingDelay - fbElapsed);
    } else if (fbElapsed < typingDelay * 2) {
      feedbackPhase = 1; // Thanks visible, Typing Answer
      setTimeout(() => render(), (typingDelay * 2) - fbElapsed);
    } else if (fbElapsed < typingDelay * 3) {
      feedbackPhase = 2; // Answer visible, Typing "When you're ready"
      setTimeout(() => render(), (typingDelay * 3) - fbElapsed);
    } else {
      // Sequence complete!
      answerState.aiLoading = false;
      answerState.aiChecked = true;
      answerState.aiCheckedAt = Date.now();
      
      recordEvent('ai_checked', {
        questionId: question.id,
        optionId: answerState.selectedOptionId,
      });
      
      persistState();
      setTimeout(() => renderStageAndFocus(false), 0);
    }
  }

  // These booleans power the HTML blocks below
  const showThanks = feedbackPhase >= 1 || answerState.aiChecked;
  const showAiResponse = feedbackPhase >= 2 || answerState.aiChecked;
  const showFinalMessage = answerState.aiChecked; // Only true when completely finished

  return `
    <section class="question-grid">
      <article class="surface question-card">
        <div class="question-meta">
          <div>
            <h2>${
              question.id
                ? 'Question ' +
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

              // --- NEW LOGIC: Locks buttons during intro, or immediately after Ask KAI is pressed ---
              const isLocked = !isIntroComplete || answerState.aiLoading || answerState.aiChecked || answerState.completedAt;

              if (isLocked) {
                optionClasses.push('locked');
              }

              return `
                <button
                  class="${optionClasses.join(' ')}"
                  data-action="select-option"
                  data-option-id="${option.id}"
                  type="button"
                  ${isLocked ? 'disabled' : ''}
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
            ${answerState.selectedOptionId && !answerState.aiChecked && !answerState.aiLoading && isIntroComplete ? '' : 'disabled'}
          >
            ${experimentContent.quiz.checkButton}
          </button>
        </div>
      </article>

      <aside class="surface chat-card">
        <div class="section-heading">
          <h2>KAI</h2>
        </div>
        <div class="chat-thread">
          ${
            // --- FIX 2: Fixed the HTML animation logic for subsequent questions! ---
            isFirstQuestion
              ? !isIntroComplete
                ? introPhase === 0
                  ? `
                    <div class="chat-bubble ai typing">
                      <div class="typing-dots"><span></span><span></span><span></span></div>
                    </div>
                  `
                  : introPhase === 1
                    ? `
                      <div class="chat-bubble ai">Hi, I'm KAI. I'll provide brief feedback after each task.</div>
                      <div class="chat-bubble ai typing">
                        <div class="typing-dots"><span></span><span></span><span></span></div>
                      </div>
                    `
                    : `
                      <div class="chat-bubble ai">Hi, I'm KAI. I'll provide brief feedback after each task.</div>
                      <div class="chat-bubble ai">Please choose your answer first, then read my response before continuing.</div>
                    `
                : `
                  <div class="chat-bubble ai">Hi, I'm KAI. I'll provide brief feedback after each task.</div>
                  <div class="chat-bubble ai">Please choose your answer first, then read my response before continuing.</div>
                `
              : !isIntroComplete
                ? introPhase === 0
                  ? `
                    <div class="chat-bubble ai typing">
                      <div class="typing-dots"><span></span><span></span><span></span></div>
                    </div>
                  `
                  : `
                    <div class="chat-bubble ai">Please choose your answer first, then read my response before continuing.</div>
                  `
                : `
                  <div class="chat-bubble ai">Please choose your answer first, then read my response before continuing.</div>
                `
          }
          
          ${
            // --- User Selection ---
            answerState.selectedOptionId
              ? `
                <div class="chat-bubble user">
                  I'm leaning towards answer ${answerState.selectedOptionId}: ${
                    question.options.find((entry) => entry.id === answerState.selectedOptionId)?.text
                  }
                </div>
              `
              : isIntroComplete && !answerState.aiChecked && !answerState.aiLoading
                ? '<div class="chat-bubble system">Take a moment to review the question and choose the option that best fits your judgment.</div>'
                : '' 
          }

          ${
            // --- Sequential AI Feedback Sequence ---
            answerState.aiChecked || answerState.aiLoading
              ? `
                ${
                  !showThanks
                    ? `
                      <div class="chat-bubble ai typing">
                        <div class="typing-dots"><span></span><span></span><span></span></div>
                      </div>
                    `
                    : `<div class="chat-bubble ai">Thanks. Here\'s my feedback.</div>`
                }
                
                ${
                  showThanks
                    ? !showAiResponse
                      ? `
                        <div class="chat-bubble ai typing">
                          <div class="typing-dots"><span></span><span></span><span></span></div>
                        </div>
                      `
                      : aiMessages.map((message) => `<div class="chat-bubble ${message.role}">${message.text}</div>`).join('')
                    : ''
                }

                ${
                  showAiResponse
                    ? !showFinalMessage
                      ? `
                        <div class="chat-bubble ai typing">
                          <div class="typing-dots"><span></span><span></span><span></span></div>
                        </div>
                      `
                      : `<div class="chat-bubble ai">When you\'re ready, please continue to the next task.</div>`
                    : ''
                }
              `
              : answerState.selectedOptionId && isIntroComplete
                ? '<div class="chat-bubble system">Press "Ask KAI" to check your answer with KAI.</div>'
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
        <div class="chat-action-row">
          ${
            answerState.aiChecked || showFinalMessage
              ? `
                ${
                  state.currentQuestionIndex === state.questionOrder.length - 1
                    ? `<p style="width: 100%; margin: 0 0 4px 0; color: var(--muted); font-size: 0.95rem;">You’ve completed the task section. Next, you will answer a short questionnaire about your experience.</p>`
                    : ''
                }
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
      </aside>
      <div style="margin-top: 12px; padding-bottom: 12px; display: flex; justify-content: flex-start; width: 100%;">
        <button 
          class="button ghost" 
          data-action="stop-experiment" 
          type="button" 
          style="color: var(--muted); text-decoration: underline;"
        >
          Stop the experiment
        </button>
      </div>
    </section>
  `;
}

function startSurveyTimer() {
  const REQUIRED_WAIT_MS = 60000; // 60 seconds
  if (surveyTimer) clearInterval(surveyTimer);
  
  surveyTimer = setInterval(() => {
    const btn = document.getElementById('survey-confirm-btn');
    
    if (!btn || state.currentStage !== 'survey') {
      clearInterval(surveyTimer);
      return;
    }
    
    const elapsed = Date.now() - state.survey.startedAt;
    const remainingSec = Math.ceil(Math.max(0, REQUIRED_WAIT_MS - elapsed) / 1000);
    
    if (remainingSec > 0) {
      btn.textContent = `Please complete the survey`;
      btn.disabled = true;
      btn.removeAttribute('data-action'); // Prevent accidental clicks
    } else {
      clearInterval(surveyTimer); // Stop ticking
      btn.textContent = experimentContent.survey.confirmButton;
      btn.disabled = false;
      btn.setAttribute('data-action', 'acknowledge-survey'); // Unlock the button
    }
  }, 1000);
}

function renderSurvey() {
  const hasEmbed = Boolean(runtimeConfig.survey.embedUrl);
  const hasFallback = Boolean(runtimeConfig.survey.fallbackUrl);

  const REQUIRED_WAIT_MS = 60000; // 60 seconds
  let remainingSec = 0;
  
  if (state.survey.startedAt) {
    const elapsed = Date.now() - state.survey.startedAt;
    remainingSec = Math.ceil(Math.max(0, REQUIRED_WAIT_MS - elapsed) / 1000);
  }

  return `
    <section class="surface survey-card">
      <div class="section-heading">
        <h2>${experimentContent.survey.title}</h2>
      </div>
      <p class="survey-copy">${experimentContent.survey.copy}</p>
      <div class="participant-code">
        <span>Your ID: <strong>${state.participantId}</strong></span>
        <button class="button secondary" data-action="copy-id" type="button" style="padding: 6px 12px; display: flex; align-items: center; gap: 6px; min-height: 32px;" title="Copy ID">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      ${
        hasEmbed
          ? `<iframe class="survey-frame" src="${runtimeConfig.survey.embedUrl}" title="Final survey"></iframe>`
          : `
            <div class="survey-placeholder">
              <p>ERROR: No survey's links found in <code>public/firebase-config.js</code>.</p>
            </div>
          `
      }
      <div class="action-row">
        <button 
          id="survey-confirm-btn"
          class="button primary" 
          ${remainingSec > 0 ? 'disabled' : 'data-action="acknowledge-survey"'} 
          type="button"
        >
          ${remainingSec > 0 ? `Please complete the survey` : experimentContent.survey.confirmButton}
        </button>
      </div>
      <div style="margin-top: 12px; padding-bottom: 12px; display: flex; justify-content: flex-start; width: 100%;">
        <button 
          class="button ghost" 
          data-action="stop-experiment" 
          type="button" 
          style="color: var(--muted); text-decoration: underline;"
        >
          Stop the experiment
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
      <div class="summary-copy">
        <p>Thank you for completing the study.</p>

        <p>Your responses have been successfully recorded, and your participation is greatly appreciated.</p>

        <p>
          <strong>About this study</strong>
        </p>

        <p>
          This study was introduced as research aimed at developing an AI-assisted decision support program. 
          The purpose of this research was to examine how AI agreement influences users\' trust in AI systems and their reliance on AI rather than their own reasoning.
        </p>

        <p>
          <strong>About the AI responses</strong>
        </p>

        <p>
          During the study, the AI assistant KAI\'s responses were pre-programmed and not generated in real time. 
          KAI was designed to agree with and validate your answer, regardless of whether it was correct. 
          This was necessary to examine how AI agreement affects users\' thinking and decision-making under controlled conditions.
        </p>

        <p>
          Because of this design, KAI's responses should not be interpreted as accurate or authoritative feedback on your answers. 
          <i>For tasks that had a correct answer, the correct responses are available upon request.</i>
        </p>

        <p>Please know</p>

        <p>
          The goal of this study was not to evaluate your performance or intelligence. 
          Being influenced by AI responses is a natural and common human response, and is precisely what this research seeks to understand. 
          Your responses, whatever they were, have contributed meaningfully to this research.
        </p>

        <p>
          Your rights
        </p>

        <p>
          All of your responses will be kept strictly confidential and used for research purposes only. 
          If you wish to withdraw your data after learning about the study's true purpose, please contact the researcher <strong>within two weeks</strong> of completing the study, and your responses will be removed without any consequences.
        </p>
      </div>
      <div class="summary-copy">
        <h3>Contact Information</h3>
        <p>Researcher: Nguyen Phuong Ngoc (지원)</p>
        <p>
          Email: <a href="mailto:ngocnguyen@ewha.ac.kr" class="email-link">ngocnguyen@ewha.ac.kr</a>
        </p>

        <p>Supervisor: Lim Sohye (임소혜)</p>
        <p>
          Email: <a href="mailto:soheilim@gmail.com" class="email-link">soheilim@gmail.com</a>
        </p>
        <p>If you have any questions or concerns about this study, please do not hesitate to reach out.</p>
      </div>
      <div class="action-row">
        <button class="button primary" data-action="restart-experiment" type="button">
          Start a New Session
        </button>
      </div>
    </section>
  `;
}
