'use server';

import { firestoreAdmin } from '@/firebase-admin';
import { MindMapData } from '@/types/mind-map';

/**
 * Creates a public snapshot of a mind map in the 'sharedMindmaps' collection.
 * This allows anyone with the ID to view the map without the original user's private permissions.
 */
export async function shareMindMapAction(mapData: MindMapData) {
    try {
        if (!mapData.topic) {
            throw new Error('Invalid mind map data');
        }

        // 1. Generate a "snapshot" ID
        const shareId = `share_${Math.random().toString(36).substring(2, 15)}`;

        // 2. Prepare the snapshot data
        // We remove sensitive user info but keep the core data
        const snapshot: any = {
            ...mapData,
            id: shareId,
            originalMapId: mapData.id,
            isShared: true,
            sharedAt: Date.now(),
            // Ensure we don't accidentally share full user details if not needed
            // (though avatar/name of author is usually fine for attribution)
        };

        // 3. Save to FirestoreAdmin (bypassing normal client rules)
        const shareRef = firestoreAdmin.collection('sharedMindmaps').doc(shareId);
        await shareRef.set(snapshot);

        // 4. Construct the shareable link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const shareUrl = `${baseUrl}/canvas?mapId=${shareId}`;

        return {
            success: true,
            shareId,
            shareUrl
        };
    } catch (error: any) {
        console.error('Error sharing mind map:', error);
        return { success: false, error: error.message || 'Failed to create shareable link' };
    }
}
