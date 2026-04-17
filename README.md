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
- `public/firebase-config.js`: Firebase web config and runtime toggles
- `public/firebase-runtime.js`: Firebase Auth + Firestore helpers
- `firestore.rules`: participant write rules and admin read scaffold

## How to configure

1. Create a Firebase project.
2. Enable Firebase Hosting.
3. Enable Firestore.
4. Enable Authentication with:
   - Anonymous
   - Email/Password
5. Replace the placeholder config in `public/firebase-config.js`.
6. Set `enableFirebaseSync: true` after the config values are real.
7. Replace the placeholder admin email in `firestore.rules`.
8. Create a researcher account in Firebase Auth that matches that admin email.

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

Update `survey.embedUrl` or `survey.fallbackUrl` in `public/firebase-config.js`.

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

```bash
firebase login
firebase use --add
firebase deploy
```

## Important note

This app is intentionally designed around fixed responses only. It does not call any generative model and does not expose free-text chat.
