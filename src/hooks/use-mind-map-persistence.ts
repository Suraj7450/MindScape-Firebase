
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
    const onRemoteUpdateRef = useRef(options.onRemoteUpdate);
    useEffect(() => {
        onRemoteUpdateRef.current = options.onRemoteUpdate;
    }, [options.onRemoteUpdate]);

    const subscribeToMap = useCallback((mapId: string, currentMap: MindMapData | undefined, isIdle: boolean) => {
        if (!user || !firestore || !mapId || !isIdle) return () => { };

        const metadataRef = doc(firestore, 'users', user.uid, 'mindmaps', mapId);
        const contentRef = doc(firestore, 'users', user.uid, 'mindmaps', mapId, 'content', 'tree');

        const unsubMetadata = onSnapshot(metadataRef, (snapshot) => {
            if (snapshot.metadata.hasPendingWrites) return;
            if (snapshot.exists()) {
                const remoteData = snapshot.data();

                // Track update times for synchronization
                const remoteUpdatedAt = (remoteData as any).updatedAt?.toMillis?.() || 0;
                const localUpdatedAt = (currentMap as any)?.updatedAt?.toMillis?.() || 0;

                if (remoteUpdatedAt > localUpdatedAt && onRemoteUpdateRef.current) {
                    if (!remoteData.hasSplitContent) {
                        // Legacy Sync (full doc in metadata)
                        onRemoteUpdateRef.current({ ...remoteData, id: snapshot.id } as MindMapData);
                    } else if (currentMap) {
                        // Split Schema Sync: Merge metadata (isPublic, stats, etc) into existing map
                        onRemoteUpdateRef.current({ ...currentMap, ...remoteData, id: snapshot.id } as MindMapData);
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

                if (remoteUpdatedAt > localUpdatedAt && onRemoteUpdateRef.current && currentMap) {
                    onRemoteUpdateRef.current({ ...currentMap, ...contentData, id: mapId });
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

        const isCompare = (mapToSave as any).mode === 'compare';

        if (!isCompare && (!mapToSave.subTopics || mapToSave.subTopics.length === 0)) {
            console.warn('Refused to save empty mind map');
            return;
        }

        if (isCompare && !(mapToSave as any).compareData) {
            console.warn('Refused to save empty comparison map');
            return;
        }

        const targetId = existingId || mapToSave.id;
        isSavingRef.current = true;

        try {
            const summary = mapToSave.summary || `A detailed mind map exploration of ${mapToSave.topic}.`;
            const thumbnailPrompt = `High-end commercial photography of ${mapToSave.topic}. Literal subject representation, authentic brand identity, sharp focus, professional lighting, 8k resolution, cinematic atmosphere.`;

            // Generate thumbnail using internal API (which enhances prompts)
            let thumbnailUrl = mapToSave.thumbnailUrl || '';

            // Only generate thumbnail if it doesn't exist
            if (!thumbnailUrl) {
                try {
                    const response = await fetch('/api/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: thumbnailPrompt,
                            style: 'Cinematic', // Use a high-quality style
                            provider: 'pollinations', // Use high-quality provider
                            size: '512x288'   // Fixed small size to prevent Firestore 1MB limit
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.images && data.images[0]) {
                            thumbnailUrl = data.images[0];
                            console.log('✅ AI Thumbnail generated via API');
                        }
                    }
                    if (thumbnailUrl && thumbnailUrl.length > 800000) {
                        console.warn('⚠️ Thumbnail too large for Firestore (>800KB), dropping base64 data to prevent save failure.');
                        thumbnailUrl = '';
                    }
                } catch (imageError) {
                    console.warn('⚠️ Thumbnail generation failed:', imageError);
                }

                // Fallback for thumbnailUrl if generation failed OR if it was too large
                if (!thumbnailUrl) {
                    thumbnailUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(thumbnailPrompt)}?width=512&height=288&nologo=true&model=turbo`;
                }
            }

            // SPLIT SCHEMA: Metadata vs Content
            const { subTopics, compareData, nodes, edges, id, ...metadata } = mapToSave as any;

            const metadataToSave: any = {
                ...metadata,
                summary,
                updatedAt: serverTimestamp(),
                thumbnailUrl,
                thumbnailPrompt,
                userId: user.uid,
                isSubMap: mapToSave.isSubMap || false,
                hasSplitContent: true, // Flag for migration/loading logic
            };

            // Only include parentMapId if it exists (Firestore doesn't allow undefined)
            if (mapToSave.parentMapId) {
                metadataToSave.parentMapId = mapToSave.parentMapId;
            }

            const contentToSave = {
                subTopics: subTopics || [],
                compareData: compareData || null,
                nodes: nodes || [],
                edges: edges || [],
                updatedAt: serverTimestamp(),
            };

            // HELPER: Firestore doesn't allow 'undefined' fields anywhere in the document structure.
            // We recursively strip them while keeping Firestore FieldValues (like serverTimestamp) intact.
            const clean = (obj: any): any => {
                if (obj === null || typeof obj !== 'object') return obj;

                // Don't recurse into Firestore FieldValues or Timestamps
                // These are special objects used by the Firebase SDK
                if (obj.constructor?.name === 'FieldValue' || obj.constructor?.name === 'Timestamp' || obj._methodName === 'serverTimestamp') {
                    return obj;
                }

                if (Array.isArray(obj)) {
                    return obj.map(item => clean(item));
                }

                const newObj: any = {};
                Object.keys(obj).forEach(key => {
                    if (obj[key] !== undefined) {
                        newObj[key] = clean(obj[key]);
                    }
                });
                return newObj;
            };

            const metadataFinal = clean(metadataToSave);
            const contentFinal = clean(contentToSave);

            let finalId = targetId;
            if (targetId) {
                const metadataRef = doc(firestore, 'users', user.uid, 'mindmaps', targetId);
                const contentRef = doc(firestore, 'users', user.uid, 'mindmaps', targetId, 'content', 'tree');

                await setDoc(metadataRef, metadataFinal, { merge: true });
                await setDoc(contentRef, contentFinal);
            } else {
                const mindMapsCollection = collection(firestore, 'users', user.uid, 'mindmaps');
                const docRef = await addDoc(mindMapsCollection, { ...metadataFinal, createdAt: serverTimestamp() });
                finalId = docRef.id;

                const contentRef = doc(firestore, 'users', user.uid, 'mindmaps', finalId, 'content', 'tree');
                await setDoc(contentRef, contentFinal);

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
    const setupAutoSave = useCallback((mindMap: MindMapData | undefined, hasUnsavedChanges: boolean, isSelfReference: boolean, persistFn: (silent: boolean) => void) => {
        if (!user || !mindMap || isSelfReference || !hasUnsavedChanges) return () => { };

        const timer = setTimeout(() => {
            persistFn(true);
        }, 60000); // 1 minute auto-save threshold

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
