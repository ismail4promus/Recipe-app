import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from "firebase/app";
import { getFirestore, Timestamp, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
import * as firebaseAnalytics from "firebase/analytics";

// Cook Jatra — production project (cookjatra)
const firebaseConfig = {
  apiKey: "AIzaSyAL3R95FdqKdFsejRVosuIg8AzdmRA2ucs",
  authDomain: "cookjatra.firebaseapp.com",
  projectId: "cookjatra",
  storageBucket: "cookjatra.firebasestorage.app",
  messagingSenderId: "373338314786",
  appId: "1:373338314786:web:2b48ae44661d21346f927b",
  measurementId: "G-DTKXGWHW9B",
};

/**
 * initializeApp throws `app/duplicate-app` if the default app already exists —
 * which happens on every hot reload of this module, and loudly when the config
 * changed since the previous evaluation. Reuse the live app instead of
 * re-registering it, and tear it down when HMR replaces this module.
 */
const resolveApp = (): FirebaseApp => {
  const existing = getApps();
  if (existing.length === 0) return initializeApp(firebaseConfig);

  const current = getApp();
  if ((current.options as any).projectId !== firebaseConfig.projectId) {
    console.warn(
      `Firebase app is bound to project "${(current.options as any).projectId}" but the config now says ` +
      `"${firebaseConfig.projectId}". Reload the page to pick up the new project.`
    );
  }
  return current;
};

const app = resolveApp();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Let the next evaluation register a fresh app with the current config.
    deleteApp(app).catch(() => { /* already deleted */ });
  });
}

const db = getFirestore(app);
const auth = getAuth(app);

// Keep the session across reloads and tabs.
setPersistence(auth, browserLocalPersistence).catch((e) => {
  console.warn("Auth persistence unavailable, session will not survive reload", e);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Enable Offline Persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence failed: Browser not supported');
    }
  });
} catch (e) {
  console.warn("Persistence init error or already enabled", e);
}

// Safe Analytics Initialization
let analytics: any = null;

if (typeof window !== "undefined") {
  try {
    const getAnalytics = (firebaseAnalytics as any).getAnalytics || (firebaseAnalytics as any).default?.getAnalytics;
    if (getAnalytics) {
        analytics = getAnalytics(app);
    }
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

// Helper to convert Firestore Timestamps to Dates
export const convertTimestamps = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (data instanceof Timestamp) return data.toDate();
  if (Array.isArray(data)) return data.map(convertTimestamps);
  if (typeof data === 'object') {
    const newData: any = {};
    for (const key in data) {
      newData[key] = convertTimestamps(data[key]);
    }
    return newData;
  }
  return data;
};

export { app, db, auth, analytics };
