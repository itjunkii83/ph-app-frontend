// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOhlCel0L2Vihp6aJ3EkKDCiMF04q6Zew",
  authDomain: "humanos-8eeb8.firebaseapp.com",
  projectId: "humanos-8eeb8",
  storageBucket: "humanos-8eeb8.firebasestorage.app",
  messagingSenderId: "875940400940",
  appId: "1:875940400940:web:8f6d74801af28df8bde689",
  measurementId: "G-3CP442VVQP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);