// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9sTauUQNY8EiQdUrn5mSzBtS7LuLajg0",
  authDomain: "agenda-fd0df.firebaseapp.com",
  projectId: "agenda-fd0df",
  storageBucket: "agenda-fd0df.firebasestorage.app",
  messagingSenderId: "410252885923",
  appId: "1:410252885923:web:3f92cb92cedb2eec9f6416",
  measurementId: "G-2R03LJFES6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);