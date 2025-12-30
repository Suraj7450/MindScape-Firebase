import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// 1. You need to download your Service Account Key from Firebase Console:
// Project Settings -> Service Accounts -> Generate New Private Key
const SERVICE_ACCOUNT_PATH = './service-account.json';

try {
    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const email = 'admin@mindscape.ai';

    const user = await admin.auth().getUserByEmail(email);

    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    console.log(`✅ Success! ${email} is now an admin.`);
    console.log('Note: The user must log out and log back in (or refresh their token) for the changes to take effect.');

    process.exit(0);
} catch (error) {
    console.error('❌ Error setting admin claim:', error.message);
    if (error.code === 'auth/user-not-found') {
        console.error('The user with that email does not exist yet. Ensure they have signed up first.');
    }
    process.exit(1);
}
