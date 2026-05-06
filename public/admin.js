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
    authStatus.textContent = `Log in failed: ${error.message}`;
  }
}

async function refreshDashboard() {
  authStatus.textContent = 'Loading participants\' data...';

  try {
    participants = await fetchAllParticipants();
    renderMetrics();
    renderTable();
    authStatus.textContent = `Loaded ${participants.length} participant.`;
  } catch (error) {
    authStatus.textContent = `ERROR: ${error.message}`;
  }
}

function renderMetrics() {
  // 1. Total Participants
  const totalParticipants = participants.length;

  // 2. Surveys Completed (Participant has a completedAt timestamp)
  const completedParticipants = participants.filter((entry) => entry.completedAt);
  const surveysCompleted = completedParticipants.length;

  // 3. Breakdown by Difficulty Level (including 0 counts)
  const difficultyCounts = {};
  
  // Pre-fill all possible difficulty levels with 0
  if (experimentContent && experimentContent.questionBanks) {
    Object.keys(experimentContent.questionBanks).forEach((level) => {
      difficultyCounts[level] = 0;
    });
  }

  // Count the actual completions
  completedParticipants.forEach((entry) => {
    const level = entry.difficultyLevel;
    if (level) {
      // Increment if it exists, or create it if it's somehow unexpected
      difficultyCounts[level] = (difficultyCounts[level] || 0) + 1;
    }
  });

  // Build the HTML for the dynamic difficulty breakdown
  const difficultyCardsHTML = Object.entries(difficultyCounts)
    .map(([level, count]) => metricCard(`Completed (${level})`, String(count)))
    .join('');

  metrics.innerHTML = [
    metricCard('Total Participants', String(totalParticipants)),
    metricCard('Surveys Completed', String(surveysCompleted)),
    difficultyCardsHTML, // Append the breakdown cards
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
    // 1. Initialize the row with the exact base columns
    const row = {
      participantId: entry.participantId,
      difficultyLevel: entry.difficultyLevel ?? '',
    };

    // 2. Add Attitude Survey answers (attitudeSurvey_1 to attitudeSurvey_6)
    const attitudeQuestions = experimentContent?.attitudeSurvey?.questions || [];
    for (let i = 0; i < 6; i++) {
      const qId = attitudeQuestions[i]?.id || String(i + 1);
      row[`attitudeSurvey_${i + 1}`] = entry.attitudeSurvey?.answers?.[qId] ?? '';
    }

    // 3. Add Task answers and durations (Q1 to Q6)
    const qOrder = entry.questionOrder || [];
    for (let i = 0; i < 6; i++) {
      const qId = qOrder[i];
      const answer = qId ? (entry.answers?.[qId] ?? {}) : {};
      
      // Selected option
      row[`Q${i + 1}`] = answer.selectedOptionId ?? '';
      
      // NEW: Time taken to select the answer (in milliseconds)
      row[`Q${i + 1}_answerTime_ms`] = answer.answerDurationMs ?? '';
      
      // NEW: Total time spent on the question page (in milliseconds)
      row[`Q${i + 1}_totalTime_ms`] = answer.totalDurationMs ?? '';
    }

    return row;
  });
}

function exportSummary() {
  const csv = toCsv(buildSummaryRows());
  downloadFile('participant-summary.csv', csv, 'text/csv;charset=utf-8');
}