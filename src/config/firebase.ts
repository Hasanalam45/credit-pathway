// Firebase configuration and initialization
import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import type { Functions } from "firebase/functions";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-XHKDQQWbF9OnMucHMpKwDzn4OgyFYks",
  authDomain: "paramount-credit-pathway-ea134.firebaseapp.com",
  projectId: "paramount-credit-pathway-ea134",
  storageBucket: "paramount-credit-pathway-ea134.firebasestorage.app",
  messagingSenderId: "624446810636",
  appId: "1:624446810636:web:ca06937e42d217f6ff9c29",
  measurementId: "G-YZ65L1N9XS"
};

// Initialize Firebase App (only if not already initialized)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Services
export const auth: Auth = getAuth(app);
export const functions: Functions = getFunctions(app, "us-central1"); // Your functions are in us-central1
export const firestore: Firestore = getFirestore(app);

// Test: Log Firebase initialization (remove this after testing)
// console.log("✅ Firebase initialized successfully!", {
//   projectId: firebaseConfig.projectId,
//   authDomain: firebaseConfig.authDomain,
// });

// Optional: Connect to emulators in development (uncomment if using Firebase emulators)
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFunctionsEmulator(functions, "localhost", 5001);
//   connectFirestoreEmulator(firestore, "localhost", 8080);
// }

// Export the app instance if needed
export default app;

