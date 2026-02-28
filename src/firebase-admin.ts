import { initializeFirebaseServer } from './firebase/server';

/**
 * Centered Firebase Admin Firestore instance.
 * Exported as firestoreAdmin for consistency with the codebase and to resolve type issues.
 */
const { firestore: firestoreAdmin } = initializeFirebaseServer();

export { firestoreAdmin };
