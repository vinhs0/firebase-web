const env = window.__APP_ENV__ ?? {};

function readString(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed === '' ? fallback : trimmed;
}

function readBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return fallback;
}

export const firebaseConfig = {
  apiKey: readString(env.FIREBASE_API_KEY),
  authDomain: readString(env.FIREBASE_AUTH_DOMAIN),
  projectId: readString(env.FIREBASE_PROJECT_ID),
  storageBucket: readString(env.FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readString(env.FIREBASE_MESSAGING_SENDER_ID),
  appId: readString(env.FIREBASE_APP_ID),
};

export const runtimeConfig = {
  appName: readString(env.APP_NAME, 'Interactive Media Experiment'),
  localStorageKey: readString(env.LOCAL_STORAGE_KEY, 'interactive-media-experiment-v1'),
  enableFirebaseSync: readBoolean(env.ENABLE_FIREBASE_SYNC, false),
  adminEmailHint: readString(env.ADMIN_EMAIL_HINT, 'researcher@example.com'),
  survey: {
    embedUrl: readString(env.SURVEY_EMBED_URL),
    fallbackUrl: readString(env.SURVEY_FALLBACK_URL),
  },
};
