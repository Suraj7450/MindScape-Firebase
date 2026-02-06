import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Server-safe initialization for Firebase.
 * Does NOT use 'use client', making it safe for Server Actions.
 */
export function initializeFirebaseServer() {
    const apps = getApps();
    const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);

    return {
        app,
        firestore: getFirestore(app),
    };
}
