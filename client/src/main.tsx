// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { FirebaseAuthProvider } from "@/contexts/MockAuthContext";

// Initialize Firebase early to catch any configuration errors
try {
  // Import Firebase to ensure it's initialized
  import("@/firebase").catch((err) => {
    console.error("Firebase initialization error:", err);
  });
} catch (err) {
  console.error("Error importing Firebase:", err);
}

try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found. Make sure index.html has a div with id='root'");
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <FirebaseAuthProvider>
        <App />
      </FirebaseAuthProvider>
    </React.StrictMode>
  );
} catch (err) {
  // If rendering fails early (module error / runtime), write useful message
  // to the DOM so the developer sees it instead of a plain white screen.
  // Also log the error to the console for devtools.
  // NOTE: this should only help during development — React still shows
  // the ErrorBoundary for in-render errors.
  // eslint-disable-next-line no-console
  console.error('Error bootstrapping app:', err);

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding:24px;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;">
      <h2 style="color:#c53030">Falha ao iniciar a aplicação</h2>
      <pre style="white-space:pre-wrap;color:#333;">${String(err)}</pre>
      <p>Abra o console do navegador (F12) para ver mais detalhes.</p>
    </div>`;
  }
}

// Global error listeners to make sure uncaught exceptions are visible during dev
window.addEventListener('error', (ev) => {
  // don't spam if already rendered helpful UI
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', ev.error || ev.message, ev.error?.stack);
});

window.addEventListener('unhandledrejection', (ev) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled promise rejection:', ev.reason);
});
