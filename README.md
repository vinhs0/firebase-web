# Firebase experiment app

Firebase Hosting app for a scripted online experiment with:

- consent page
- randomized hidden condition assignment
- one-question-at-a-time multiple-choice flow
- fixed "AI" responses based on `question + selected answer + condition`
- local resume on reload
- Firestore event logging
- optional researcher admin export page

## Structure

- `public/index.html`: participant-facing experiment
- `public/admin.html`: researcher export dashboard
- `public/experiment-content.js`: consent copy, factors, questions, scripted AI responses
- `.env`: single source of app config for local/dev use
- `scripts/sync-env.ps1`: generates browser-safe config and Firestore rules from `.env`
- `public/firebase-config.js`: reads generated browser config
- `public/firebase-runtime.js`: Firebase Auth + Firestore helpers
- `firestore.rules`: participant write rules and admin read scaffold
- `firestore.rules.template`: Firestore rules template with env-driven admin email

## How to configure

1. Create a Firebase project.
2. Enable Firebase Hosting.
3. Enable Firestore.
4. Enable Authentication with:
   - Anonymous
   - Email/Password
5. Fill in `.env` with your Firebase web app values and researcher email.
6. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-env.ps1
```

7. Create a researcher account in Firebase Auth that matches `ALLOWED_ADMIN_EMAIL`.

## Content you will likely customize

### Questions

Edit `experimentContent.questions` in `public/experiment-content.js`.

Each question uses:

```js
{
  id: 'q1',
  prompt: '...',
  options: [
    { id: 'A', text: '...', rationale: '...' },
    { id: 'B', text: '...', rationale: '...' },
    { id: 'C', text: '...', rationale: '...' },
    { id: 'D', text: '...', rationale: '...' },
  ],
}
```

### Conditions

Edit `experimentContent.factors`.

Default scaffold is `2 x 2`:

- `agreement`: `agree | neutral`
- `explanation`: `brief | detailed`

If you need `2 x 2 x 2`, add one more factor with two levels. The app will automatically generate the full condition matrix and randomly assign one condition per participant.

### Scripted AI responses

There are two ways to control responses:

1. Keep the fallback response builder and only edit `rationale` text.
2. Replace cases explicitly in `experimentContent.customResponses`.

Example explicit override:

```js
customResponses: {
  q1: {
    'agreement-agree__explanation-detailed': {
      A: [
        { role: 'ai', text: 'Tin nhắn 1 viết sẵn.' },
        { role: 'ai', text: 'Tin nhắn 2 viết sẵn.' },
      ],
    },
  },
}
```

If an explicit case exists, the app uses it. Otherwise it falls back to the deterministic template builder.

### Survey embed

Update `SURVEY_EMBED_URL` or `SURVEY_FALLBACK_URL` in `.env`, then rerun:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-env.ps1
```

## Data captured

Each participant snapshot stores:

- participant ID
- condition ID and factor values
- current stage
- selected answer for each question
- whether AI was checked
- answer duration and total duration per question
- consent / completion timestamps
- action count

Each action is also written to `participants/{participantId}/events/{eventId}` with:

- ordered sequence number
- event type
- timestamp
- question ID / option ID when relevant

## Admin page

Open `/admin` after deployment.

The admin page lets a researcher:

- sign in with email/password
- inspect participant rows
- download summary CSV
- download event CSV
- download full JSON bundle

## Deploy

Before serving or deploying, regenerate the browser config and Firestore rules:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-env.ps1
```

```bash
firebase login
firebase use --add
firebase deploy
```

## Important note

This app is intentionally designed around fixed responses only. It does not call any generative model and does not expose free-text chat.
