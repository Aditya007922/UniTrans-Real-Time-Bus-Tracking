import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// Configuration validation
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`ERROR: Missing environment variable: ${varName}`);
  }
});

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBzLPSlcRpaH_RPSTtjr9SDJUVSnHk3rVs",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "unitrans-f281d.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "unitrans-f281d",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "unitrans-f281d.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "817060282082",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:817060282082:web:8829ab2dc2656c7d0028bb"
};

// Masked logging for debugging (to avoid exposing full key in logs if possible)
const maskedKey = firebaseConfig.apiKey ?
  `${firebaseConfig.apiKey.substring(0, 5)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}` :

  console.log("--- Firebase Config Debug ---");
console.log("Project ID:", firebaseConfig.projectId);
console.log("API Key Type:", typeof firebaseConfig.apiKey);
console.log("API Key Length:", firebaseConfig.apiKey?.length);
console.log("API Key (Masked):", maskedKey);
console.log("Auth Domain:", firebaseConfig.authDomain);
console.log("-----------------------------");

console.log("Initializing Firebase with Project ID:", firebaseConfig.projectId);

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error.message);
  throw error;
}

const auth = getAuth(app);
const db = getFirestore(app);

// Messaging initialization - handle potential errors in non-supported environments
let messaging;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn("Firebase Messaging not supported in this browser environment.");
}

export { auth, db, messaging };
export default app;
