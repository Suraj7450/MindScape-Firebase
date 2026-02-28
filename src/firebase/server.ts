import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Server-safe initialization for Firebase using the Admin SDK.
 * This provides full access to Firestore and other services without needing client-side auth.
 */
export function initializeFirebaseServer() {
    if (admin.apps.length === 0) {
        try {
            // Try to use service account if available via root path
            const saPath = path.join(process.cwd(), 'service-account.json');

            if (fs.existsSync(saPath)) {
                const saContent = fs.readFileSync(saPath, 'utf8');
                const serviceAccount = JSON.parse(saContent);

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("✅ Firebase Admin initialized with service account from:", saPath);
            } else {
                console.log("⚠️ service-account.json not found at:", saPath);
                // Fallback to default credentials (environment variables)
                admin.initializeApp();
                console.log("ℹ️ Firebase Admin initialized with default credentials");
            }
        } catch (e: any) {
            console.error("❌ Error initializing Firebase Admin:", e.message);
            // Last resort fallback
            if (admin.apps.length === 0) {
                try {
                    admin.initializeApp();
                } catch (innerError: any) {
                    console.error("❌ Critical: Failed to initialize Firebase Admin even with fallback:", innerError.message);
                }
            }
        }
    }

    return {
        app: admin.app(),
        firestore: admin.firestore(),
    };
}
