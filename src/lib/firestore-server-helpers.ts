import { initializeFirebaseServer } from '@/firebase/server';

export interface UserImageSettings {
    pollinationsApiKey?: string;
    preferredModel?: string;
    apiKeyCreatedAt?: number;
    apiKeyLastUsed?: number;
}

/**
 * Get user's image generation settings using Firebase Admin SDK.
 * Bypasses permission checks.
 */
export async function getUserImageSettingsAdmin(userId: string): Promise<UserImageSettings | null> {
    try {
        const { firestore } = initializeFirebaseServer();

        // Try new location first: /users/{userId}/settings/imageGeneration
        const settingsDoc = await firestore
            .collection('users')
            .doc(userId)
            .collection('settings')
            .doc('imageGeneration')
            .get();

        if (settingsDoc.exists) {
            return settingsDoc.data() as UserImageSettings;
        }

        // Fallback to old location: /users/{userId} (apiSettings field)
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.apiSettings?.pollinationsApiKey) {
                return {
                    pollinationsApiKey: userData.apiSettings.pollinationsApiKey,
                    preferredModel: userData.apiSettings.pollinationsModel || 'klein-large',
                    apiKeyCreatedAt: Date.now(),
                    apiKeyLastUsed: Date.now()
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error in getUserImageSettingsAdmin:', error);
        return null;
    }
}
