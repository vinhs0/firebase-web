import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig, runtimeConfig } from './firebase-config.js';
import { hasCompleteFirebaseConfig, normalizeFirestoreValue } from './shared.js';

const firebaseEnabled =
  runtimeConfig.enableFirebaseSync && hasCompleteFirebaseConfig(firebaseConfig);

let app = null;
let auth = null;
let db = null;

if (firebaseEnabled) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export function isFirebaseEnabled() {
  return firebaseEnabled;
}

export function getCurrentUser() {
  return auth?.currentUser ?? null;
}

export async function ensureParticipantAuth() {
  if (!firebaseEnabled) {
    return null;
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function upsertParticipantSnapshot(participantId, payload) {
  if (!firebaseEnabled) {
    return false;
  }

  await setDoc(
    doc(db, 'participants', participantId),
    {
      ...payload,
      createdAt: payload.createdAt ? Timestamp.fromMillis(payload.createdAt) : null,
      consentedAt: payload.consentedAt ? Timestamp.fromMillis(payload.consentedAt) : null,
      completedAt: payload.completedAt ? Timestamp.fromMillis(payload.completedAt) : null,
      surveyAcknowledgedAt: payload.surveyAcknowledgedAt
        ? Timestamp.fromMillis(payload.surveyAcknowledgedAt)
        : null,
      lastUpdatedAt: payload.lastUpdatedAt
        ? Timestamp.fromMillis(payload.lastUpdatedAt)
        : null,
      syncedAtServer: serverTimestamp(),
    },
    { merge: true },
  );

  return true;
}

export async function upsertParticipantEvent(participantId, event) {
  if (!firebaseEnabled) {
    return false;
  }

  await setDoc(doc(db, 'participants', participantId, 'events', event.eventId), {
    ...event,
    timestamp: Timestamp.fromMillis(event.timestamp),
    loggedAtServer: serverTimestamp(),
  });

  return true;
}

export async function fetchParticipantSnapshot(participantId) {
  if (!firebaseEnabled) {
    return null;
  }

  const snapshot = await getDoc(doc(db, 'participants', participantId));
  return snapshot.exists() ? normalizeFirestoreValue(snapshot.data()) : null;
}

export async function signInAdmin(email, password) {
  if (!firebaseEnabled) {
    throw new Error('Firebase sync is disabled in public/firebase-config.js.');
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOutCurrentUser() {
  if (!firebaseEnabled) {
    return;
  }

  await signOut(auth);
}

export async function fetchAllParticipants() {
  if (!firebaseEnabled) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, 'participants'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((entry) => ({
    participantId: entry.id,
    ...normalizeFirestoreValue(entry.data()),
  }));
}

export async function fetchParticipantEvents(participantId) {
  if (!firebaseEnabled) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, 'participants', participantId, 'events'), orderBy('sequence', 'asc')),
  );

  return snapshot.docs.map((entry) => normalizeFirestoreValue(entry.data()));
}
