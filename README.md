# KAI Decision Support System

This repository contains a Firebase Hosting app for an online experiment about AI-assisted judgment. Participants do not interact with a real chatbot. Every KAI response is scripted in advance and controlled by the study content in [public/experiment-content.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/experiment-content.js:1).

## What the app does

- collects consent
- randomly assigns each participant to one study bank
- runs a short pre-task attitude survey about AI
- presents one task question at a time
- requires the participant to press `Ask KAI` before moving on
- shows a fixed KAI response in a chat-style panel
- embeds the final survey and asks the participant to copy their participant ID
- stores progress locally and can resume after reload
- syncs participant data to Firestore when Firebase is enabled

## Current participant flow

1. Consent page
2. Hidden random assignment to one of four task banks
3. Six-item AI attitude survey
4. Six task questions shown one by one
5. Scripted KAI feedback after each selected answer
6. Final survey page
7. Completion and debrief page

The current random assignment is at the task-bank level. The four banks are:

- `wdl`: well-defined, low difficulty
- `wdh`: well-defined, high difficulty
- `idl`: ill-defined, low difficulty
- `idh`: ill-defined, high difficulty

The assigned bank is stored for the full session and reused on reload.

## Participant IDs

Participant IDs are generated automatically in this format:

```text
<BANK>-<10 character random code>
```

Example:

```text
WDL-A7K3M9Q2XZ
```

The ID is shown again on the final survey page so the participant can paste it into the external questionnaire.

## What is stored

The app records:

- participant ID
- assigned bank in `difficultyLevel`
- consent timestamp
- attitude survey responses
- question order
- selected option for each task
- whether KAI feedback was checked
- answer timing and total question timing
- current stage and completion timestamps
- action count and ordered event log
- basic device metadata such as language, user agent, and viewport

Participant snapshots are written to `participants/{participantId}`. Event-level logs are written to `participants/{participantId}/events/{eventId}`.

## Project layout

- [public/index.html](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/index.html:1): participant-facing page
- [public/app.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/app.js:1): experiment flow, rendering, state, and Firestore sync
- [public/experiment-content.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/experiment-content.js:1): consent copy, attitude survey, question banks, and scripted KAI text
- [public/firebase-config.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/firebase-config.js:1): reads browser runtime config from `window.__APP_ENV__`
- [public/__env.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/__env.js:1): runtime config loaded before the app
- [public/firebase-runtime.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/firebase-runtime.js:1): Firebase Auth and Firestore helpers
- [public/shared.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/shared.js:1): utility functions such as ID generation and CSV export
- [public/admin.html](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/admin.html:1): researcher login and export page
- [public/admin.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/admin.js:1): admin metrics and CSV export logic
- [firestore.rules](/C:/Users/Vinh%20Tran/Desktop/firebase_web/firestore.rules:1): Firestore access rules
- [firebase.json](/C:/Users/Vinh%20Tran/Desktop/firebase_web/firebase.json:1): Hosting and Firestore config

## Runtime configuration

This app expects [public/__env.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/__env.js:1) to define `window.__APP_ENV__` before [public/app.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/app.js:1) runs.

Expected fields:

- `APP_NAME`
- `LOCAL_STORAGE_KEY`
- `ENABLE_FIREBASE_SYNC`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `ADMIN_EMAIL_HINT`
- `SURVEY_EMBED_URL`
- `SURVEY_FALLBACK_URL`

Minimal example:

```js
window.__APP_ENV__ = Object.freeze({
  APP_NAME: 'KAI Decision Support System',
  LOCAL_STORAGE_KEY: 'interactive-media-experiment-v1',
  ENABLE_FIREBASE_SYNC: 'true',
  FIREBASE_API_KEY: 'YOUR_API_KEY',
  FIREBASE_AUTH_DOMAIN: 'YOUR_PROJECT.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'YOUR_PROJECT_ID',
  FIREBASE_STORAGE_BUCKET: 'YOUR_PROJECT.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: 'YOUR_SENDER_ID',
  FIREBASE_APP_ID: 'YOUR_APP_ID',
  ADMIN_EMAIL_HINT: 'researcher@example.com',
  SURVEY_EMBED_URL: 'https://example.com/form',
  SURVEY_FALLBACK_URL: 'https://example.com/form',
});
```

Important: `public/__env.js` is still delivered to the browser. Firebase web config is not a server secret. If you need true secrets, keep them on a backend or Cloud Function instead of the client.

## Editing study content

Most study content lives in [public/experiment-content.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/experiment-content.js:1).

### Task banks

Each bank is an array of questions with this shape:

```js
{
  id: 'wdl1',
  difficulty: 'wdl',
  prompt: 'Question prompt',
  options: [
    { id: 'A', text: 'Option A', rationale: 'Scripted KAI reply', is_correct: true },
    { id: 'B', text: 'Option B', rationale: 'Scripted KAI reply', is_correct: false },
    { id: 'C', text: 'Option C', rationale: 'Scripted KAI reply', is_correct: false },
    { id: 'D', text: 'Option D', rationale: 'Scripted KAI reply', is_correct: false },
  ],
}
```

Right now, the KAI reply is simply the selected option's `rationale`. That behavior is defined in `getAiMessages()`.

If you need different KAI responses by condition, bank, or answer pattern, the place to extend is `getAiMessages(questionId, optionId)` in [public/experiment-content.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/experiment-content.js:350).

### Bank assignment

Random bank assignment happens in `initializeParticipantSession()` inside [public/app.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/app.js:206). The app currently chooses randomly from `Object.keys(experimentContent.questionBanks)`.

### Fixed item counts

The current admin export code assumes:

- 6 attitude survey items
- 6 task questions per bank

If you change those counts, update [public/admin.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/admin.js:163) so the CSV columns still match the study design.

## Firebase setup

1. Create a Firebase project.
2. Enable Firestore.
3. Enable Firebase Hosting.
4. Enable Firebase Authentication with:
   - Anonymous sign-in for participants
   - Email/Password sign-in for researchers
5. Update [public/__env.js](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/__env.js:1) with your project values.
6. Update the allowed researcher emails in [firestore.rules](/C:/Users/Vinh%20Tran/Desktop/firebase_web/firestore.rules:1).
7. Deploy the project.

This repository already contains [firebase.json](/C:/Users/Vinh%20Tran/Desktop/firebase_web/firebase.json:1) and [.firebaserc](/C:/Users/Vinh%20Tran/Desktop/firebase_web/.firebaserc:1). If you switch to a different Firebase project, update the active project before deployment.

## Admin dashboard

The researcher dashboard lives at [public/admin.html](/C:/Users/Vinh%20Tran/Desktop/firebase_web/public/admin.html:1).

Current admin features:

- email/password login
- participant count
- completed survey count
- completed count by assigned bank
- participant table with ID, bank, stage, AI-check count, and last update time
- summary CSV export

The current UI does not expose event CSV or JSON bundle export, even though participant event logs are stored in Firestore.

## Running and deploying

The frontend has no build step. Files in `public/` are served as static assets.

Typical deployment flow:

```bash
firebase login
firebase deploy
```

If local dependencies are missing, restore them with:

```bash
npm install
```

## Notes and limitations

- KAI is scripted. There is no live model call and no free-text participant input.
- The final survey confirmation button unlocks after a 60-second wait on the survey page.
- Progress is stored in local storage under `LOCAL_STORAGE_KEY`, so a participant can resume after reload on the same browser.
- Some older scaffolding around experimental conditions still exists in the codebase, but the active implementation currently randomizes only across the four task banks above.
