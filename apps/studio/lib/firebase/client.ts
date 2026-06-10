import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDOhlCel0L2Vihp6aJ3EkKDCiMF04q6Zew",
  authDomain: "humanos-8eeb8.firebaseapp.com",
  projectId: "humanos-8eeb8",
  storageBucket: "humanos-8eeb8.firebasestorage.app",
  messagingSenderId: "875940400940",
  appId: "1:875940400940:web:8f6d74801af28df8bde689",
  measurementId: "G-3CP442VVQP",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
