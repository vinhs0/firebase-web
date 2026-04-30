import { runtimeConfig } from './firebase-config.js';
import {
  fetchAllParticipants,
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

// Grab the other buttons so we can hide them automatically
const exportEventsButton = document.querySelector('#export-events');
const exportJsonButton = document.querySelector('#export-json');

emailField.placeholder = runtimeConfig.adminEmailHint;

let participants = [];

loginForm.addEventListener('submit', handleLogin);
refreshButton.addEventListener('click', () => {
  void refreshDashboard();
});
signoutButton.addEventListener('click', async () => {
  await signOutCurrentUser();
  participants = [];
  renderMetrics();
  renderTable();
  dashboard.classList.add('hidden');
  authStatus.textContent = 'Logged out.';
});

exportSummaryButton?.addEventListener('click', exportSummary);

// Hide the unused buttons from the UI without needing to edit admin.html
if (exportEventsButton) exportEventsButton.style.display = 'none';
if (exportJsonButton) exportJsonButton.style.display = 'none';

if (!isFirebaseEnabled()) {
  authStatus.textContent = 'Let enableFirebaseSync = true to use admin.';
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
    // Calculate total time taken for the whole experiment in seconds
    let totalTimeSec = '';
    if (entry.completedAt && entry.consentedAt) {
      totalTimeSec = ((entry.completedAt - entry.consentedAt) / 1000).toFixed(2);
    }

    // Set up the exact columns you requested
    const row = {
      participantId: entry.participantId,
      difficultyLevel: entry.difficultyLevel ?? '',
      total_time_taken_sec: totalTimeSec,
    };

    // Iterate through all questions to get answers and duration
    experimentContent.questions.forEach((question) => {
      const answer = entry.answers?.[question.id] ?? {};
      
      row[`${question.id}_answer`] = answer.selectedOptionId ?? '';
      
      row[`${question.id}_time_taken_sec`] = answer.totalDurationMs 
        ? (answer.totalDurationMs / 1000).toFixed(2) 
        : '';
    });

    return row;
  });
}

function exportSummary() {
  const csv = toCsv(buildSummaryRows());
  downloadFile('participant-summary.csv', csv, 'text/csv;charset=utf-8');
}