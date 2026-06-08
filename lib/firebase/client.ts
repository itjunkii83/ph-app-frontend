import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Public web config (safe to ship in the client bundle). Shared with the
// sibling project on the same Firebase project (humanos-8eeb8). Analytics is
// intentionally omitted: it touches window and breaks SSR.
const firebaseConfig = {
  apiKey: "AIzaSyDOhlCel0L2Vihp6aJ3EkKDCiMF04q6Zew",
  authDomain: "humanos-8eeb8.firebaseapp.com",
  projectId: "humanos-8eeb8",
  storageBucket: "humanos-8eeb8.firebasestorage.app",
  messagingSenderId: "875940400940",
  appId: "1:875940400940:web:8f6d74801af28df8bde689",
  measurementId: "G-3CP442VVQP",
};

// Singleton guard: Next can evaluate this module more than once (HMR, server
// and client), so reuse the existing app instead of re-initializing.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
