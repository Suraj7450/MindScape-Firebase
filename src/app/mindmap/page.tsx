
'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MindMap, NestedExpansionItem } from '@/components/mind-map';
import { GenerationLoading } from '@/components/generation-loading';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const ChatPanel = dynamic(() => import('@/components/chat-panel').then(mod => mod.ChatPanel), {
  ssr: false,
  loading: () => null
});
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Cloud, Brain, Eye, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';
import {
  useUser,
  useFirestore,
  useDoc,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy, addDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  generateComparisonMapAction,
  generateMindMapAction,
  generateMindMapFromImageAction,
  generateMindMapFromTextAction,
} from '@/app/actions';
import Image from 'next/image';
import { mindscapeMap } from '@/lib/mindscape-data';
import { trackMapCreated, trackStudyTime } from '@/lib/activity-tracker';
import { toPlainObject } from '@/lib/serialize';

type MindMapWithId = GenerateMindMapOutput & { id?: string; thumbnailUrl?: string; thumbnailPrompt?: string, summary?: string };

const EMPTY_ARRAY: any[] = [];

/**
 * The core content component for the mind map page.
 * It handles fetching and displaying mind map data for all modes.
 */
function MindMapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [mindMaps, setMindMaps] = useState<MindMapWithId[]>([]);
  const [activeMindMapIndex, setActiveMindMapIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<
    string | undefined
  >(undefined);
  const [generatingNodeId, setGeneratingNodeId] = useState<string | null>(null);
  const [aiPersona, setAiPersona] = useState<string>('Standard');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load user's persona preference
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

  const handlePersonaChange = useCallback(async (newPersona: string) => {
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

  const hasFetchedRef = useRef(false);

  const mindMap = mindMaps[activeMindMapIndex];
  const isSaved = !!(mindMap && (mindMap as any).id);

  const mapId = searchParams.get('mapId');
  const isPublic = searchParams.get('public') === 'true';

  const docPath = useMemoFirebase(() => {
    if (!mapId) return null;
    if (isPublic) {
      return doc(firestore, 'publicMindmaps', mapId);
    }
    if (user) {
      return doc(firestore, 'users', user.uid, 'mindmaps', mapId);
    }
    return null;
  }, [firestore, user, mapId, isPublic]);

  const {
    data: savedMindMap,
    isLoading: isFetchingSavedMap,
    error: savedMapError
  } = useDoc<MindMapWithId>(docPath);

  /* Safe auto-save with race condition lock */
  const isSavingRef = useRef(false);

  const handleSaveMap = useCallback(async (mapToSave: MindMapWithId, existingId?: string, isSilent: boolean = false) => {
    // Prevent double-writes
    if (!mapToSave || !user || isSavingRef.current) {
      return;
    }

    const targetId = existingId || mapToSave.id;

    // FIX #3: Refuse to save empty maps (User request)
    if (!mapToSave.subTopics || mapToSave.subTopics.length === 0) {
      console.error('❌ Refusing to save empty mind map to Firestore', mapToSave);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      let summary = mapToSave.summary || `A detailed mind map exploration of ${mapToSave.topic}.`;

      const { ...cleanMapData } = mapToSave;

      const thumbnailPrompt = `A cinematic 3D render of ${mapToSave.topic}, in futuristic purple tones, mind-map theme, highly detailed`;
      const thumbnailUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(thumbnailPrompt)}?width=400&height=225&nologo=true`;

      const mapData = {
        ...cleanMapData,
        summary: summary,
        updatedAt: serverTimestamp(),
        thumbnailUrl,
        thumbnailPrompt,
        uid: user.uid,
        isSubMap: mapToSave.isSubMap || false,
        parentMapId: mapToSave.parentMapId || null,
      };

      console.log('💾 Saving map to Firestore:', {
        topic: mapData.topic,
        isSubMap: mapData.isSubMap,
        parentMapId: mapData.parentMapId,
        id: targetId || 'new'
      });

      let finalId = targetId;
      if (targetId) {
        // Resilient update: use setDoc with merge to avoid 'No document to update' error
        const docRef = doc(firestore, 'users', user.uid, 'mindmaps', targetId);
        await setDoc(docRef, mapData, { merge: true });
        console.log('✅ Map synced with ID:', targetId);
      } else {
        // Create new document
        const mindMapsCollection = collection(firestore, 'users', user.uid, 'mindmaps');
        const newMapWithTimestamp = {
          ...mapData,
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(mindMapsCollection, newMapWithTimestamp);
        finalId = docRef.id;
        console.log('✅ New map created:', finalId);

        // Update URL to use mapId and remove all variety of topic params
        const params = new URLSearchParams(window.location.search);
        params.set('mapId', finalId);
        params.delete('topic');
        params.delete('topic1');
        params.delete('topic2');
        params.delete('sessionId');
        params.delete('_r');
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });

        // Track activity ONLY for new maps
        await trackMapCreated(firestore, user.uid);
      }

      const updatedMindMap = { ...mapData, id: finalId } as any;

      setMindMaps(prevMaps => {
        const newMaps = [...prevMaps];
        // If we have an ID, update the match by ID. Otherwise match by topic.
        const mapIndex = newMaps.findIndex(m => (finalId && m.id === finalId) || m.topic === mapToSave.topic);
        if (mapIndex !== -1) {
          newMaps[mapIndex] = updatedMindMap;
        } else {
          newMaps.push(updatedMindMap);
        }
        return newMaps;
      });


      if (!isSilent) {
        toast({
          title: targetId ? 'Map Updated!' : 'Map Auto-Saved!',
          description: `Mind map "${mapToSave.topic}" has been ${targetId ? 'updated' : 'saved'}.`,
        });
      }
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('🔥 Firestore save failed:', err);

      // Check for actual permission error before emitting
      if (err.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}/mindmaps`,
          operation: 'create',
          requestResourceData: { ...mapToSave },
        });
        errorEmitter.emit('permission-error', permissionError);
      }

      toast({
        variant: 'destructive',
        title: 'Auto-Save Failed',
        description: err.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [user, firestore, toast]);

  const lastFetchedParamsRef = useRef<string>('');

  /**
   * Check which AI provider the user has selected
   * Returns options object for the action
   */
  const getProviderKey = async () => {
    if (!user) return undefined;
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const apiSettings = userData.apiSettings;
        if (apiSettings?.provider === 'pollinations') {
          return { provider: 'pollinations' as const, strict: true };
        } else if (apiSettings?.provider === 'bytez') {
          // Bytez can use the user's custom key or our default
          return { provider: 'bytez' as const, apiKey: apiSettings.apiKey, strict: true };
        }
      }

      // Default: use server-side Gemini API key (represented as 'gemini' provider without custom key, allowing fallthrough to genkit)
      return { provider: 'gemini' as const, strict: true };
    } catch (e) {
      console.error("Error checking provider settings", e);
      return undefined;
    }
  };

  useEffect(() => {
    const fetchMindMapData = async () => {
      const singleTopic = searchParams.get('topic');
      const topic1 = searchParams.get('topic1');
      const topic2 = searchParams.get('topic2');
      const sessionId = searchParams.get('sessionId');
      const mapId = searchParams.get('mapId');
      const lang = searchParams.get('lang');
      const parentTopic = searchParams.get('parent');
      const isPublic = searchParams.get('public') === 'true';
      const isSelfReference = searchParams.get('selfReference') === 'true';
      const isRegenerating = !!searchParams.get('_r');

      const currentParamsKey = JSON.stringify({
        singleTopic,
        topic1,
        topic2,
        sessionId,
        mapId,
        lang,
        parentTopic,
        isPublic,
        isSelfReference,
        isRegenerating
      });

      // If we already have this map in our state, just switch to it
      // BUT bypass this if we are specifically asked to regenerate (_r param)
      const existingMapIndex = mindMaps.findIndex(m => {
        if (mapId && (m as any).id === mapId) return true;
        if (singleTopic && m.topic === singleTopic) return true;
        if (isSelfReference && m.topic === 'MindScape') return true;
        return false;
      });

      if (existingMapIndex !== -1 && !isRegenerating) {
        if (activeMindMapIndex !== existingMapIndex) {
          setActiveMindMapIndex(existingMapIndex);
        }
        setIsLoading(false);
        return;
      }

      // Guard for params equality - only skip if we are already loading something for these exact params
      if (lastFetchedParamsRef.current === currentParamsKey && isLoading) return;
      lastFetchedParamsRef.current = currentParamsKey;

      setIsLoading(true);
      setError(null);

      let result: { data: MindMapWithId | null; error: string | null } = { data: null, error: null };
      let currentMode = 'standard';

      try {
        if (isSelfReference) {
          currentMode = 'self-reference';
          result.data = mindscapeMap as GenerateMindMapOutput;
        } else if (mapId && isRegenerating && !isPublic) {
          currentMode = 'saved';
          // 1. Get topic from state or fetch it
          let topicToRegen = singleTopic || savedMindMap?.topic;
          if (!topicToRegen && docPath) {
            const snap = await getDoc(docPath);
            topicToRegen = snap.data()?.topic;
          }

          if (!topicToRegen) throw new Error("Could not determine topic for regeneration.");

          const aiOptions = await getProviderKey();
          result = await generateMindMapAction({
            topic: topicToRegen,
            parentTopic: parentTopic || undefined,
            targetLang: lang || undefined,
            persona: aiPersona,
          }, aiOptions);

          if (result.data && user) {
            // Overwrite existing!
            await handleSaveMap(result.data, mapId);
          }
        } else if (mapId) {
          currentMode = isPublic ? 'public-saved' : 'saved';
          if (isPublic) {
            const publicDocRef = doc(firestore, 'publicMindmaps', mapId);
            const docSnap = await getDoc(publicDocRef);
            if (docSnap.exists()) {
              result.data = { ...(docSnap.data() as GenerateMindMapOutput), id: docSnap.id };
            } else {
              result.error = 'Could not find the public mind map.';
            }
          } else {
            // Handle actual hook errors (e.g. permission denied)
            if (savedMapError) {
              result.error = savedMapError.message;
            } else if (isFetchingSavedMap) {
              // Wait for saved map hook to finish
              return;
            } else if (savedMindMap) {
              // Successfully retrieved from hook
              result.data = {
                ...savedMindMap,
                id: mapId,
                subTopics: savedMindMap.subTopics || [],
                icon: savedMindMap.icon || 'brain-circuit'
              };

              // Backfill summary if missing for owned private maps
              if (!savedMindMap.summary && !isPublic && user) {
                handleSaveMap(result.data, mapId);
              }
            } else if (docPath) {
              // At this point: !isLoading AND !data AND !error AND we have a docPath.
              // This is a race-condition danger zone. 
              // React sets isLoading=false briefly when docPath changes before effect starts.
              // We'll wait one more cycle to be safe.
              return;
            } else {
              // No user or docPath available for this private mapId
              return;
            }
          }
        } else if (singleTopic) {
          currentMode = 'standard';
          const aiOptions = await getProviderKey();
          result = await generateMindMapAction({
            topic: singleTopic,
            parentTopic: parentTopic || undefined,
            targetLang: lang || undefined,
            persona: aiPersona,
          }, aiOptions);
        } else if (topic1 && topic2) {
          currentMode = 'compare';
          const aiOptions = await getProviderKey();
          result = await generateComparisonMapAction({
            topic1,
            topic2,
            targetLang: lang || undefined,
            persona: aiPersona,
          }, aiOptions);
        } else if (sessionId) {
          const sessionType = sessionStorage.getItem(`session-type-${sessionId}`);
          const sessionContent = sessionStorage.getItem(`session-content-${sessionId}`);

          if (sessionContent) {
            let fileContent, additionalText;
            try {
              const parsed = JSON.parse(sessionContent);
              fileContent = parsed.file;
              additionalText = parsed.text;
            } catch {
              fileContent = sessionContent;
              additionalText = '';
            }

            if (sessionType === 'image') {
              currentMode = 'vision-image';
              const aiOptions = await getProviderKey();
              // fileContent is the data URI for the image
              result = await generateMindMapFromImageAction({
                imageDataUri: fileContent,
                targetLang: lang || undefined,
                persona: aiPersona,
              }, aiOptions);
            } else if (sessionType === 'text') {
              currentMode = 'vision-text';
              const aiOptions = await getProviderKey();
              result = await generateMindMapFromTextAction({
                text: fileContent,
                context: additionalText,
                targetLang: lang || undefined,
                persona: aiPersona,
              }, aiOptions);
            } else if (sessionType === 'mindgpt') {
              currentMode = 'mindgpt';
              try {
                result.data = JSON.parse(fileContent);
              } catch (e) {
                result.error = 'Could not process the MindGPT result. It might be corrupted.';
              }
            }
            sessionStorage.removeItem(`session-type-${sessionId}`);
            sessionStorage.removeItem(`session-content-${sessionId}`);
          } else {
            result.error = 'Could not retrieve session data. Please try again.';
          }
        } else {
          // No valid params, waits
          setIsLoading(false);
          return;
        }

        setMode(currentMode);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.data) {
          setMindMaps(prevMaps => {
            // Check duplication again before adding
            const exists = prevMaps.some(m => m.topic === result.data!.topic);
            if (exists) return prevMaps;
            return [...prevMaps, result.data!];
          });

          // Set active index to the new last element
          setMindMaps(prev => {
            const newIndex = prev.findIndex(m => m.topic === result.data!.topic);
            if (newIndex !== -1) setActiveMindMapIndex(newIndex);
            return prev;
          });

          const isNewlyGenerated = !['saved', 'public-saved', 'self-reference'].includes(currentMode);
          if (isNewlyGenerated && user) {
            // If we are regenerating, find if we already have an ID for this map in our state
            const existingMapWithId = mindMaps.find(m => m.topic === result.data!.topic && m.id);
            await handleSaveMap(result.data, existingMapWithId?.id);
          }
        }
      } catch (e: any) {
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error Generating Mind Map',
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
        setGeneratingNodeId(null);

        // CLEANUP: If we were regenerating, remove the flag from URL to prevent loops on re-renders
        const params = new URLSearchParams(window.location.search);
        if (params.has('_r')) {
          params.delete('_r');
          const newSearch = params.toString();
          router.replace(`${window.location.pathname}${newSearch ? '?' + newSearch : ''}`, { scroll: false });
        }
      }
    };

    fetchMindMapData();
  }, [mapId, searchParams, user, savedMindMap, isFetchingSavedMap, savedMapError, handleSaveMap, toast, firestore]);

  // Track study time every 5 minutes
  useEffect(() => {
    if (!user || !firestore) return;

    const TRACK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
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

  const handleUpdateCurrentMap = useCallback((updatedData: Partial<MindMapWithId>) => {
    setMindMaps(prev => {
      const newMaps = [...prev];
      if (newMaps[activeMindMapIndex]) {
        // Only update if there's an actual change in stringified content to avoid infinite loops
        const current = JSON.stringify(newMaps[activeMindMapIndex]);
        const next = JSON.stringify({ ...newMaps[activeMindMapIndex], ...updatedData });
        if (current === next) return prev;

        newMaps[activeMindMapIndex] = {
          ...newMaps[activeMindMapIndex],
          ...updatedData
        };
        setHasUnsavedChanges(true);
      }
      return newMaps;
    });
  }, [activeMindMapIndex]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!user || !mindMap || isPublic || mode === 'self-reference' || !hasUnsavedChanges) return;

    const debounceTimer = setTimeout(() => {
      handleSaveMap(mindMap, (mindMap as any).id, true);
    }, 15000); // 15 seconds debounce

    return () => clearTimeout(debounceTimer);
  }, [mindMap, user, isPublic, mode, hasUnsavedChanges, handleSaveMap]);



  const handleManualSaveMap = useCallback(() => {
    if (mindMap) {
      handleSaveMap(mindMap);
    }
  }, [mindMap, handleSaveMap]);

  const handleExplainInChat = useCallback((message: string) => {
    setChatInitialMessage(message);
    setIsChatOpen(true);
  }, [setChatInitialMessage, setIsChatOpen]);

  const handleGenerateAndOpenSubMap = useCallback(async (subTopic: string, nodeId: string, contextPath: string) => {
    if (!mindMap) return;

    // Create a temporary ID and item for optimistic UI
    const tempId = crypto.randomUUID();
    const tempContextPath = contextPath;

    const tempNestedItem: NestedExpansionItem = {
      id: tempId,
      parentName: subTopic,
      topic: subTopic,
      icon: 'Loader2', // Temporary icon until generated
      subCategories: [],
      path: tempContextPath,
      createdAt: Date.now(),
      depth: (mindMaps.length > 0 ? (mindMaps[0] as any).nestedExpansions?.length || 0 : 0) + 1,
      status: 'generating'
    };

    setGeneratingNodeId(nodeId);

    // OPTIMISTIC UPDATE: Add "Generating..." item to root map immediately
    setMindMaps(prev => {
      const newMaps = [...prev];
      const rootMap = newMaps[0];
      const currentExpansions = (rootMap as any).nestedExpansions || [];

      newMaps[0] = {
        ...rootMap,
        nestedExpansions: [...currentExpansions, tempNestedItem]
      } as any;

      return newMaps;
    });

    toast({
      title: "Generating Sub-Map...",
      description: `Creating a detailed map for "${subTopic}".`,
    });

    const rootMap = mindMaps[0];
    const rootMapId = (rootMap as any).id;

    // 0. CHECK IF SUB-MAP ALREADY EXISTS for this topic (Global lookup for this user)
    if (user) {
      try {
        const subMapsQuery = query(
          collection(firestore, 'users', user.uid, 'mindmaps'),
          where('isSubMap', '==', true),
          where('topic', '==', subTopic),
          limit(1)
        );
        const subMapSnap = await getDocs(subMapsQuery);

        if (!subMapSnap.empty) {
          const existingSubMapDoc = subMapSnap.docs[0];
          const existingSubMapData = { ...existingSubMapDoc.data(), id: existingSubMapDoc.id } as any;

          // Create a lightweight reference (no fullData)
          const completedNestedItem: NestedExpansionItem = {
            id: existingSubMapDoc.id,
            parentName: subTopic,
            topic: subTopic,
            icon: existingSubMapData.icon || 'Network',
            subCategories: existingSubMapData.subTopics.flatMap((st: any) => st.categories.flatMap((c: any) => c.subCategories)).slice(0, 4),
            path: tempContextPath,
            createdAt: existingSubMapData.createdAt?.toMillis() || Date.now(),
            depth: mindMaps.length,
            status: 'completed'
            // Note: NO fullData - will be loaded on-demand when opening
          };

          setMindMaps(prev => {
            const newMaps = [...prev];
            const currentExpansions = (newMaps[0] as any).nestedExpansions || [];
            // Remove any old placeholders for this topic and add the completed one
            newMaps[0] = {
              ...newMaps[0],
              nestedExpansions: [...currentExpansions.filter((i: any) => i.topic !== subTopic), completedNestedItem]
            } as any;

            // Add to stack if not already there
            if (!newMaps.some(m => m.topic === subTopic)) {
              newMaps.push(existingSubMapData);
            }
            return newMaps;
          });

          setMindMaps(prev => {
            const idx = prev.findIndex(m => m.topic === subTopic);
            if (idx !== -1) setActiveMindMapIndex(idx);
            return prev;
          });

          setGeneratingNodeId(null);

          toast({
            title: "Sub-Map Linked",
            description: `Linked existing map for "${subTopic}".`,
          });
          return;
        }
      } catch (e) {
        console.error("Error checking for existing sub-map:", e);
      }
    }

    try {
      const lang = searchParams.get('lang') || 'en';
      const aiOptions = await getProviderKey();

      const result = await generateMindMapAction({
        topic: subTopic,
        parentTopic: mindMap.topic,
        targetLang: lang,
        persona: aiPersona,
      }, aiOptions);

      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error("No data returned");

      const newSubMap = {
        ...result.data,
        isSubMap: true,
        parentMapId: rootMapId || null
      };

      console.log('🗺️ Creating sub-map:', {
        topic: newSubMap.topic,
        isSubMap: newSubMap.isSubMap,
        parentMapId: newSubMap.parentMapId
      });

      // Create the final completed item
      const completedNestedItem: NestedExpansionItem = {
        id: tempId,
        parentName: subTopic,
        topic: subTopic,
        icon: 'Network',
        subCategories: newSubMap.subTopics.flatMap((st: any) => st.categories.flatMap((c: any) => c.subCategories)).slice(0, 4),
        path: tempContextPath,
        createdAt: Date.now(),
        depth: mindMaps.length,
        status: 'completed',
        fullData: newSubMap
      };

      // 1. Open the new map immediately (Update Local View State)
      setMindMaps(prev => {
        const newMaps = [...prev];
        const rootMap = newMaps[0];
        const currentExpansions = (rootMap as any).nestedExpansions || [];

        newMaps[0] = {
          ...rootMap,
          nestedExpansions: currentExpansions.map((i: any) => i.topic === subTopic ? completedNestedItem : i)
        } as any;

        // Append full map data to breadcrumb list (the stack)
        const exists = newMaps.some(m => m.topic === newSubMap.topic);
        if (!exists) {
          newMaps.push({ ...newSubMap, id: tempId });
        }

        // Set active index to the new map
        const newIndex = newMaps.findIndex(m => m.topic === newSubMap.topic);
        if (newIndex !== -1) setActiveMindMapIndex(newIndex);

        return newMaps;
      });

      // 2. Save to Ecosystem
      if (rootMapId && user) {
        // First, save the sub-map as a standalone document
        await handleSaveMap(newSubMap, tempId, true);

        // Then, update the parent map with a REFERENCE (not fullData)
        const mapRef = doc(firestore, 'users', user.uid, 'mindmaps', rootMapId);
        const currentRootNestedExpansions = (mindMaps[0] as any).nestedExpansions || [];

        // Create a lightweight reference without fullData
        const referenceItem = {
          id: tempId,
          parentName: subTopic,
          topic: subTopic,
          icon: 'Network',
          subCategories: newSubMap.subTopics.flatMap((st: any) => st.categories.flatMap((c: any) => c.subCategories)).slice(0, 4),
          path: tempContextPath,
          createdAt: Date.now(),
          depth: mindMaps.length,
          status: 'completed'
          // Note: NO fullData here - it will be loaded on-demand
        };

        const updatedRootNestedExpansions = [...currentRootNestedExpansions, referenceItem];

        await updateDoc(mapRef, {
          nestedExpansions: updatedRootNestedExpansions
        });
      }

      toast({
        title: "Sub-Map Generated",
        description: "Sub-map generated and saved to the nested map panel.",
      });

    } catch (error: any) {
      // ROLLBACK: Remove the temporary item
      setMindMaps(prev => {
        const newMaps = [...prev];
        const currentExpansions = (newMaps[0] as any).nestedExpansions || [];
        newMaps[0] = {
          ...newMaps[0],
          nestedExpansions: currentExpansions.filter((i: any) => i.topic !== subTopic)
        } as any;
        return newMaps;
      });

      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message
      });
    } finally {
      setGeneratingNodeId(null);
    }
  }, [mindMap, mindMaps, user, firestore, aiPersona, searchParams, toast, setGeneratingNodeId, setMindMaps, setActiveMindMapIndex, getProviderKey, generateMindMapAction, handleSaveMap]);

  const handleLanguageChange = useCallback((langCode: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('lang', langCode);
    router.push(`/mindmap?${newParams.toString()}`);
  }, [searchParams, router]);

  const handleRegenerate = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('_r', Date.now().toString()); // Add a random param to force re-fetch
    router.replace(`/mindmap?${newParams.toString()}`);
  }, [searchParams, router]);

  const handleBreadcrumbSelect = useCallback((index: number) => {
    setActiveMindMapIndex(index);
    const activeMap = mindMaps[index];
    const lang = searchParams.get('lang');
    const newParams = new URLSearchParams();

    if (activeMap.topic.toLowerCase() === 'mindscape') {
      newParams.set('selfReference', 'true');
    } else {
      newParams.set('topic', activeMap.topic);
    }

    if (lang) newParams.set('lang', lang);
    if (index > 0) {
      newParams.set('parent', mindMaps[index - 1].topic);
    }
    router.replace(`/mindmap?${newParams.toString()}`);
  }, [mindMaps, searchParams, router, setActiveMindMapIndex]);

  // Handler for opening a nested map from the ecosystem dialog
  const handleOpenNestedMap = useCallback(async (mapData: any, expansionId: string) => {
    if (!mapData) {
      toast({
        variant: "destructive",
        title: "Cannot Open Map",
        description: "This map data is not available.",
      });
      return;
    }

    let finalMapData = mapData;

    // RESILIENT LOAD: Fetch latest version from Firestore if it has an ID
    const mapIdToFetch = mapData.id || expansionId;
    if (mapIdToFetch && user && firestore) {
      try {
        const mapRef = doc(firestore, 'users', user.uid, 'mindmaps', mapIdToFetch);
        const snap = await getDoc(mapRef);
        if (snap.exists()) {
          finalMapData = { ...snap.data(), id: snap.id };
        }
      } catch (e) {
        console.warn("Could not fetch latest sub-map data, using cached version.", e);
      }
    }

    // Check if map already exists in the stack
    const existingIndex = mindMaps.findIndex(m => m.topic === finalMapData.topic);
    if (existingIndex !== -1) {
      setActiveMindMapIndex(existingIndex);
    } else {
      // Add to stack and switch to it
      setMindMaps(prev => [...prev, finalMapData]);
      setMindMaps(prev => {
        const idx = prev.findIndex(m => m.topic === finalMapData.topic);
        if (idx !== -1) setActiveMindMapIndex(idx);
        return prev;
      });
    }

    const lang = searchParams.get('lang');
    const newParams = new URLSearchParams();
    newParams.set('topic', finalMapData.topic);
    if (lang) newParams.set('lang', lang);
    newParams.set('parent', mindMap?.topic || '');
    router.replace(`/mindmap?${newParams.toString()}`);
  }, [mindMap, mindMaps, searchParams, router, toast, setMindMaps, setActiveMindMapIndex, user, firestore]);

  if (isLoading) {
    return <GenerationLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-2xl font-bold text-white">Generation Failed</h2>
          <p className="text-zinc-400">{error}</p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            window.location.reload();
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-zinc-400 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="h-10 w-10 animate-spin text-purple-500 relative z-10" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Preparing your knowledge universe...</p>
          <p className="text-sm text-zinc-500">Sit tight while we sync your ideas</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center px-4 sm:px-8 pb-8">
        <div className="w-full max-w-6xl mx-auto">
          <MindMap
            key={activeMindMapIndex} // Force re-mount to reset internal state
            data={mindMap}
            isSaved={isSaved && !hasUnsavedChanges}
            isPublic={isPublic}
            onSaveMap={handleManualSaveMap}
            onExplainInChat={handleExplainInChat}
            onGenerateNewMap={handleGenerateAndOpenSubMap}
            onOpenNestedMap={handleOpenNestedMap}
            generatingNode={generatingNodeId}
            selectedLanguage={searchParams.get('lang') || 'en'}
            onLanguageChange={handleLanguageChange}
            onAIPersonaChange={handlePersonaChange}
            aiPersona={aiPersona}
            onRegenerate={handleRegenerate}
            isRegenerating={isLoading}
            canRegenerate={!isPublic && mode !== 'self-reference'}
            nestedExpansions={mindMaps.length > 0 ? (mindMaps[0] as any).nestedExpansions : EMPTY_ARRAY}
            mindMapStack={mindMaps}
            activeStackIndex={activeMindMapIndex}
            onStackSelect={handleBreadcrumbSelect}
            onUpdate={handleUpdateCurrentMap}
          />
        </div>
      </div>
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white shadow-lg transition-transform hover:scale-110 z-50"
        aria-label="Open AI Chat Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialMessage(undefined);
        }}
        topic={mindMap?.topic || 'Mind Map Details'}
        initialMessage={chatInitialMessage}
      />
    </>
  );
}

/**
 * The main wrapper for the mind map page.
 * It uses Suspense to show a loading fallback while the page content is being prepared.
 */
export default function MindMapPage() {
  return (
    <TooltipProvider delayDuration={300}>
      <Suspense fallback={<GenerationLoading />}>
        <MindMapPageContent />
      </Suspense>
    </TooltipProvider>
  );
}
