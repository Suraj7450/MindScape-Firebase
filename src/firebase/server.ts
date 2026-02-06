import * as admin from 'firebase-admin';

/**
 * Server-safe initialization for Firebase using the Admin SDK.
 * This provides full access to Firestore and other services without needing client-side auth.
 */
export function initializeFirebaseServer() {
    if (admin.apps.length === 0) {
        try {
            // Try to use service account if available
            const serviceAccount = require('../../service-account.json');
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase Admin initialized with service account");
        } catch (e) {
            // Fallback for environments where service-account.json might be missing (e.g. production env vars)
            admin.initializeApp();
            console.log("ℹ️ Firebase Admin initialized with default credentials");
        }
    }

    return {
        app: admin.app(),
        firestore: admin.firestore(),
    };
}
