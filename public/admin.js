import { runtimeConfig } from './firebase-config.js';
import {
  fetchAllParticipants,
  fetchParticipantEvents,
  isFirebaseEnabled,
  signInAdmin,
  signOutCurrentUser,
} from './firebase-runtime.js';
import { experimentContent } from './experiment-content.js';
import { downloadFile, formatDateTime, toCsv } from './shared.js';

const loginForm = document.querySelector('#admin-login-form');
const emailField = document.querySelector('#admin-email');
const passwordField = document.querySelector('#admin-password');
const authStatus = document.querySelector('#admin-auth-status');
const dashboard = document.querySelector('#admin-dashboard');
const metrics = document.querySelector('#admin-metrics');
const tableBody = document.querySelector('#participants-table-body');
const refreshButton = document.querySelector('#refresh-admin');
const signoutButton = document.querySelector('#signout-admin');
const exportSummaryButton = document.querySelector('#export-summary');
const exportEventsButton = document.querySelector('#export-events');
const exportJsonButton = document.querySelector('#export-json');

emailField.placeholder = runtimeConfig.adminEmailHint;

let participants = [];
let cachedEvents = new Map();

loginForm.addEventListener('submit', handleLogin);
refreshButton.addEventListener('click', () => {
  void refreshDashboard();
});
signoutButton.addEventListener('click', async () => {
  await signOutCurrentUser();
  participants = [];
  cachedEvents = new Map();
  renderMetrics();
  renderTable();
  dashboard.classList.add('hidden');
  authStatus.textContent = 'Logged out.';
});
exportSummaryButton.addEventListener('click', exportSummary);
exportEventsButton.addEventListener('click', () => {
  void exportEvents();
});
exportJsonButton.addEventListener('click', () => {
  void exportJsonBundle();
});

if (!isFirebaseEnabled()) {
  authStatus.textContent =
    'Let enableFirebaseSync = true to use admin.';
}

async function handleLogin(event) {
  event.preventDefault();

  if (!isFirebaseEnabled()) {
    return;
  }

  authStatus.textContent = 'Logging in...';

  try {
    await signInAdmin(emailField.value.trim(), passwordField.value);
    authStatus.textContent = 'Logged in.';
    dashboard.classList.remove('hidden');
    await refreshDashboard();
  } catch (error) {
    authStatus.textContent = `Đăng nhập thất bại: ${error.message}`;
  }
}

async function refreshDashboard() {
  authStatus.textContent = 'Đang tải dữ liệu participant...';

  try {
    participants = await fetchAllParticipants();
    cachedEvents = new Map();
    renderMetrics();
    renderTable();
    authStatus.textContent = `Đã tải ${participants.length} participant.`;
  } catch (error) {
    authStatus.textContent = `Không thể tải dữ liệu: ${error.message}`;
  }
}

function renderMetrics() {
  const completed = participants.filter((entry) => entry.completedAt).length;
  const interacted = participants.filter((entry) => (entry.aiCheckCount ?? 0) > 0).length;
  const avgAiChecks =
    participants.length > 0
      ? (
          participants.reduce((sum, entry) => sum + (entry.aiCheckCount ?? 0), 0) /
          participants.length
        ).toFixed(2)
      : '0.00';

  metrics.innerHTML = [
    metricCard('Participants', String(participants.length)),
    metricCard('Completed', String(completed)),
    metricCard('Any AI check', String(interacted)),
    metricCard('Avg AI checks', avgAiChecks),
  ].join('');
}

function metricCard(label, value) {
  return `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function renderTable() {
  tableBody.innerHTML = participants
    .map((entry) => {
      return `
        <tr>
          <td>${entry.participantId}</td>
          <td>${entry.conditionId ?? '—'}</td>
          <td>${entry.difficultyLevel ?? '—'}</td>
          <td>${entry.currentStage ?? '—'}</td>
          <td>${entry.aiCheckCount ?? 0}</td>
          <td>${formatDateTime(entry.lastUpdatedAt)}</td>
        </tr>
      `;
    })
    .join('');
}

function buildSummaryRows() {
  return participants.map((entry) => {
    const row = {
      participantId: entry.participantId,
      conditionId: entry.conditionId,
      difficultyLevel: entry.difficultyLevel,
      currentStage: entry.currentStage,
      actionCount: entry.actionCount,
      aiCheckCount: entry.aiCheckCount,
      createdAt: formatDateTime(entry.createdAt),
      consentedAt: formatDateTime(entry.consentedAt),
      completedAt: formatDateTime(entry.completedAt),
      surveyAcknowledgedAt: formatDateTime(entry.surveyAcknowledgedAt),
    };

    experimentContent.questions.forEach((question) => {
      const answer = entry.answers?.[question.id] ?? {};
      row[`${question.id}_answer`] = answer.selectedOptionId ?? '';
      row[`${question.id}_ai_checked`] = answer.aiChecked ?? false;
      row[`${question.id}_skipped_ai`] = answer.skippedAi ?? false;
      row[`${question.id}_answer_duration_ms`] = answer.answerDurationMs ?? '';
      row[`${question.id}_total_duration_ms`] = answer.totalDurationMs ?? '';
    });

    return row;
  });
}

function exportSummary() {
  const csv = toCsv(buildSummaryRows());
  downloadFile('participant-summary.csv', csv, 'text/csv;charset=utf-8');
}

async function ensureEventsLoaded() {
  await Promise.all(
    participants.map(async (entry) => {
      if (!cachedEvents.has(entry.participantId)) {
        const events = await fetchParticipantEvents(entry.participantId);
        cachedEvents.set(entry.participantId, events);
      }
    }),
  );
}

async function exportEvents() {
  authStatus.textContent = 'Đang tải event logs...';
  await ensureEventsLoaded();

  const rows = participants.flatMap((entry) => {
    const events = cachedEvents.get(entry.participantId) ?? [];

    return events.map((event) => ({
      participantId: entry.participantId,
      difficultyLevel: entry.difficultyLevel ?? '',
      sequence: event.sequence,
      type: event.type,
      stage: event.stage,
      timestamp: formatDateTime(event.timestamp),
      questionId: event.questionId ?? '',
      optionId: event.optionId ?? '',
      skippedAi: event.skippedAi ?? '',
      totalDurationMs: event.totalDurationMs ?? '',
    }));
  });

  downloadFile('participant-events.csv', toCsv(rows), 'text/csv;charset=utf-8');
  authStatus.textContent = 'Đã export event logs.';
}

async function exportJsonBundle() {
  authStatus.textContent = 'Đang chuẩn bị JSON bundle...';
  await ensureEventsLoaded();

  const bundle = participants.map((entry) => ({
    participant: entry,
    events: cachedEvents.get(entry.participantId) ?? [],
  }));

  downloadFile(
    'participant-bundle.json',
    JSON.stringify(bundle, null, 2),
    'application/json;charset=utf-8',
  );
  authStatus.textContent = 'Đã export JSON bundle.';
}
