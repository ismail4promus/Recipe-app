import * as firebaseApp from "firebase/app";
import { getFirestore, Timestamp, enableIndexedDbPersistence } from "firebase/firestore";
import * as firebaseAnalytics from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBZQ64teQ1v1fEXcYnFkKedTRKZAUvPVf4",
  authDomain: "chef-babu.firebaseapp.com",
  projectId: "chef-babu",
  storageBucket: "chef-babu.firebasestorage.app",
  messagingSenderId: "207863642974",
  appId: "1:207863642974:web:08d3342f6bce514aa3adcf",
  measurementId: "G-X96GT44DLN",
};

// Initialize Firebase
const initializeApp = (firebaseApp as any).initializeApp || (firebaseApp as any).default?.initializeApp;
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

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

export { app, db, analytics };