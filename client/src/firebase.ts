import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getMessaging, Messaging, getToken, onMessage } from "firebase/messaging";

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

// Initialize Firebase Cloud Messaging lazily (only when needed and after service worker is ready)
// Don't initialize immediately - wait for service worker to be registered first
let messaging: Messaging | null = null;

export function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn("Firebase Messaging initialization failed:", error);
      return null;
    }
  }

  return messaging;
}

export { getToken, onMessage };

// VAPID key for web push notifications
export const VAPID_KEY = "BOLZkkZ9vT6dg4DuptIHveyyutoYcFB6etpbamtXIZ9WGzg5x-NRaG5qPSQuQEh8rokFy0Ots11YN5s1u5Q3UbU";
