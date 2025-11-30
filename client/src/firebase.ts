import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9sTauUQNY8EiQdUrn5mSzBtS7LuLajg0",
  authDomain: "agenda-fd0df.firebaseapp.com",
  projectId: "agenda-fd0df",
  storageBucket: "agenda-fd0df.firebasestorage.app",
  messagingSenderId: "410252885923",
  appId: "1:410252885923:web:3f92cb92cedb2eec9f6416",
  measurementId: "G-2R03LJFES6"
};

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
