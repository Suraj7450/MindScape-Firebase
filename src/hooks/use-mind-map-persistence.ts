
import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, serverTimestamp, onSnapshot, query, where, limit } from 'firebase/firestore';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { MindMapData } from '@/types/mind-map';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { trackMapCreated, trackStudyTime } from '@/lib/activity-tracker';

interface PersistenceOptions {
    onRemoteUpdate?: (data: MindMapData) => void;
}

/**
 * Custom hook to handle Firestore persistence for mind maps.
 * Manages saving, loading user preferences (persona), and real-time syncing.
 */
export function useMindMapPersistence(options: PersistenceOptions = {}) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const isSavingRef = useRef(false);

    const [aiPersona, setAiPersona] = useState<string>('Standard');

    // 1. Load User Preferences
    useEffect(() => {
        if (user && firestore) {
            const userRef = doc(firestore, 'users', user.uid);
            getDoc(userRef).then(snap => {
                if (snap.exists()) {
                    const pref = snap.data().preferences?.defaultAIPersona;
                    if (pref) setAiPersona(pref);
                }
            });
        }
    }, [user, firestore]);

    // 2. Persona Change Handler
    const updatePersona = useCallback(async (newPersona: string) => {
        setAiPersona(newPersona);
        if (user && firestore) {
            try {
                await updateDoc(doc(firestore, 'users', user.uid), {
                    'preferences.defaultAIPersona': newPersona
                });
            } catch (e) {
                console.error("Failed to save persona preference:", e);
            }
        }
    }, [user, firestore]);

    // 3. Real-time Sync Listener
    const subscribeToMap = useCallback((mapId: string, currentMap: MindMapData | undefined, isIdle: boolean) => {
        if (!user || !firestore || !mapId || !isIdle) return () => { };

        const metadataRef = doc(firestore, 'users', user.uid, 'mindmaps', mapId);
        const contentRef = doc(firestore, 'users', user.uid, 'mindmaps', mapId, 'content', 'tree');

        const unsubMetadata = onSnapshot(metadataRef, (snapshot) => {
            if (snapshot.metadata.hasPendingWrites) return;
            if (snapshot.exists()) {
                const remoteData = snapshot.data();
                if (!remoteData.hasSplitContent) {
                    // Legacy Sync
                    const remoteUpdatedAt = (remoteData as any).updatedAt?.toMillis?.() || 0;
                    const localUpdatedAt = (currentMap as any)?.updatedAt?.toMillis?.() || 0;
                    if (remoteUpdatedAt > localUpdatedAt && options.onRemoteUpdate) {
                        options.onRemoteUpdate({ ...remoteData, id: snapshot.id } as MindMapData);
                    }
                }
            }
        });

        const unsubContent = onSnapshot(contentRef, (snapshot) => {
            if (snapshot.metadata.hasPendingWrites) return;
            if (snapshot.exists()) {
                const contentData = snapshot.data();
                const remoteUpdatedAt = (contentData as any).updatedAt?.toMillis?.() || 0;
                const localUpdatedAt = (currentMap as any)?.updatedAt?.toMillis?.() || 0;

                if (remoteUpdatedAt > localUpdatedAt && options.onRemoteUpdate && currentMap) {
                    options.onRemoteUpdate({ ...currentMap, ...contentData, id: mapId });
                }
            }
        });

        return () => {
            unsubMetadata();
            unsubContent();
        };
    }, [user, firestore, options]);

    // 4. Save Logic
    const saveMap = useCallback(async (mapToSave: MindMapData, existingId?: string, isSilent: boolean = false) => {
        if (!mapToSave || !user || !firestore || isSavingRef.current) return;

        if (!mapToSave.subTopics || mapToSave.subTopics.length === 0) {
            console.warn('Refused to save empty mind map');
            return;
        }

        const targetId = existingId || mapToSave.id;
        isSavingRef.current = true;

        try {
            const summary = mapToSave.summary || `A detailed mind map exploration of ${mapToSave.topic}.`;
            const thumbnailPrompt = `A cinematic 3D render of ${mapToSave.topic}, in futuristic purple tones, mind-map theme, highly detailed`;
            const thumbnailUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(thumbnailPrompt)}?width=400&height=225&nologo=true`;

            // SPLIT SCHEMA: Metadata vs Content
            const { subTopics, nodes, edges, ...metadata } = mapToSave as any;

            const metadataToSave = {
                ...metadata,
                summary,
                updatedAt: serverTimestamp(),
                thumbnailUrl,
                thumbnailPrompt,
                uid: user.uid,
                isSubMap: mapToSave.isSubMap || false,
                parentMapId: mapToSave.parentMapId || null,
                hasSplitContent: true, // Flag for migration/loading logic
            };

            const contentToSave = {
                subTopics: subTopics || [],
                nodes: nodes || [],
                edges: edges || [],
                updatedAt: serverTimestamp(),
            };

            let finalId = targetId;
            if (targetId) {
                const metadataRef = doc(firestore, 'users', user.uid, 'mindmaps', targetId);
                const contentRef = doc(firestore, 'users', user.uid, 'mindmaps', targetId, 'content', 'tree');

                await setDoc(metadataRef, metadataToSave, { merge: true });
                await setDoc(contentRef, contentToSave);
            } else {
                const mindMapsCollection = collection(firestore, 'users', user.uid, 'mindmaps');
                const docRef = await addDoc(mindMapsCollection, { ...metadataToSave, createdAt: serverTimestamp() });
                finalId = docRef.id;

                const contentRef = doc(firestore, 'users', user.uid, 'mindmaps', finalId, 'content', 'tree');
                await setDoc(contentRef, contentToSave);

                // Track creation
                await trackMapCreated(firestore, user.uid);
            }

            if (!isSilent) {
                toast({
                    title: targetId ? 'Map Updated!' : 'Map Auto-Saved!',
                    description: `Mind map "${mapToSave.topic}" has been ${targetId ? 'updated' : 'saved'}.`,
                });
            }

            return finalId;
        } catch (err: any) {
            console.error('Firestore save failed:', err);
            // ... error handling ...
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: err.message || 'An unknown error occurred.',
            });
        } finally {
            isSavingRef.current = false;
        }
    }, [user, firestore, toast]);

    // 5. Track study time every 5 minutes
    useEffect(() => {
        if (!user || !firestore) return;

        const TRACK_INTERVAL = 5 * 60 * 1000;
        const MINUTES_PER_INTERVAL = 5;

        const intervalId = setInterval(async () => {
            try {
                await trackStudyTime(firestore, user.uid, MINUTES_PER_INTERVAL);
            } catch (error) {
                console.error('Error tracking study time:', error);
            }
        }, TRACK_INTERVAL);

        return () => clearInterval(intervalId);
    }, [user, firestore]);

    // 6. Debounced Auto-Save
    const setupAutoSave = useCallback((mindMap: MindMapData | undefined, hasUnsavedChanges: boolean, isPublic: boolean, isSelfReference: boolean, persistFn: (silent: boolean) => void) => {
        if (!user || !mindMap || isPublic || isSelfReference || !hasUnsavedChanges) return () => { };

        const timer = setTimeout(() => {
            persistFn(true);
        }, 15000);

        return () => clearTimeout(timer);
    }, [user]);

    return {
        aiPersona,
        updatePersona,
        subscribeToMap,
        saveMap,
        setupAutoSave
    };
}
