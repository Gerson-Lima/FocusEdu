# Client — Firebase migration notes

This project/client was migrated from a local mock/localStorage-based data layer to Firebase (Auth + Firestore).

Key points
- Real-time data and persistence now use Firestore collections: `activity`, `kanban_columns`, `kanban_items`, `courses`.
- Authentication uses Firebase Auth. The React provider is `FirebaseAuthProvider` (exported from `src/contexts/MockAuthContext.tsx`) and the hook is `useFirebaseAuth()`.
- Use the hooks in `src/hooks/useActivities.ts` (`useActivities`, `useKanban`) and the service `activitiesService` to create/update/delete activities.

Developer checklist to run locally
1. Create a Firebase project and configure Firestore + Auth.
2. Populate the `.env` variables in the root workspace (Vite environment vars) — typically `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc. See `client/src/firebase.ts` for the exact keys.
3. Start the app and sign in with a test user. Activities created in the UI will be stored as documents in the Firestore collection `activity`.

Notes
- The file `src/lib/mockStorage.ts` remains in the repo for local/offline development, but production code uses Firestore now.
- `reportService.ts` writes reports as documents into `activity` as well (no more aggregated `data/{userId}` doc).

If you want, I can add a small migration script to move legacy `data/{userId}` documents into the `activity` collection (one document per activity). Let me know.