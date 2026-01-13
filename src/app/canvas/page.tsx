
'use client';

import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MindMap } from '@/components/mind-map';
import { MindMapData } from '@/types/mind-map';
import { GenerationLoading } from '@/components/generation-loading';
import dynamic from 'next/dynamic';

const ChatPanel = dynamic(() => import('@/components/chat-panel').then(mod => mod.ChatPanel), {
  ssr: false,
  loading: () => null
});
import { Quiz } from '@/ai/schemas/quiz-schema';
import { Button } from '@/components/ui/button';
import {
  RefreshCw, Sparkles, Loader2, ZapOff
} from 'lucide-react';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';
import {
  useUser,
  useFirestore,
} from '@/firebase';
import { collection, getDocs, query, where, doc, getDoc, limit, increment, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  generateMindMapAction,
  generateMindMapFromImageAction,
  generateMindMapFromTextAction,
  generateQuizAction,
  generateComparisonMapAction,
} from '@/app/actions';
import { toPlainObject } from '@/lib/serialize';
import { mindscapeMap } from '@/lib/mindscape-data';
import { useMindMapStack } from '@/hooks/use-mind-map-stack';
import { useAIConfig } from '@/contexts/ai-config-context';
import { useMindMapRouter } from '@/hooks/use-mind-map-router';
import { useMindMapPersistence } from '@/hooks/use-mind-map-persistence';
import { useAIHealth } from '@/hooks/use-ai-health';

type MindMapWithId = MindMapData;

const EMPTY_ARRAY: any[] = [];

/**
 * The core content component for the mind map page.
 * It handles fetching and displaying mind map data for all modes.
 */
function MindMapPageContent() {
  const { params, navigateToMap, changeLanguage, regenerate, clearRegenFlag, getParamKey, router } = useMindMapRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { config } = useAIConfig();

  const [mode, setMode] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const aiHealth = useAIHealth();
  const handleUpdateRef = useRef<(data: Partial<MindMapData>) => void>(() => { });

  const persistenceOptions = useMemo(() => ({
    onRemoteUpdate: (data: MindMapData) => handleUpdateRef.current(data)
  }), []);

  const { aiPersona, updatePersona: handlePersonaChange, subscribeToMap, saveMap: handleSaveMap, setupAutoSave } = useMindMapPersistence(persistenceOptions);

  // 1. ADAPTERS
  const expansionAdapter = useMemo(() => ({
    generate: async (topic: string, parentTopic?: string) => {
      const aiOptions = {
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.pollinationsModel,
        strict: false
      };
      const result = await generateMindMapAction({
        topic,
        parentTopic,
        targetLang: params.lang,
        persona: aiPersona,
      }, aiOptions);
      return result;
    }
  }), [aiPersona, params.lang, config.provider, config.apiKey, config.pollinationsModel]);

  // 2. HOOK INITIALIZATION
  const {
    stack: mindMaps,
    activeIndex: activeMindMapIndex,
    currentMap: mindMap,
    status: hookStatus,
    error: hookError,
    generatingNodeId,
    push: expandNode,
    navigate: setActiveMindMapIndex,
    update: handleUpdateCurrentMap,
    sync: handleSaveMapFromHook,
    setStack: setMindMaps,
    setActiveIndex: setActiveMindMapIndexState,
    replace: handleReplaceCurrentMap,
    generationScope
  } = useMindMapStack({
    expansionAdapter,
    persistenceAdapter: {
      persist: async (map, id, silent) => {
        const finalId = await handleSaveMap(map, id, silent);
        return finalId;
      }
    }
  });

  // Sync ref with actual function
  useEffect(() => {
    handleUpdateRef.current = handleUpdateCurrentMap;
  }, [handleUpdateCurrentMap]);

  // Local state for initial fetch/regenerate only
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [localGeneratingNodeId, setLocalGeneratingNodeId] = useState<string | null>(null);

  const isLoading = (hookStatus === 'generating' && generationScope === 'foreground') || isInitialLoading;
  const error = hookError || initialError;
  const activeGeneratingNodeId = generatingNodeId || localGeneratingNodeId;

  const setIsLoading = setIsInitialLoading;
  const setError = setInitialError;
  const setGeneratingNodeId = setLocalGeneratingNodeId;

  const isSaved = !!(mindMap && (mindMap as any).id);

  // Real-time sync listener (Phase 3.3)
  useEffect(() => {
    if (!mindMap?.id || hookStatus !== 'idle') return;
    const unsubscribe = subscribeToMap(mindMap.id, mindMap, hookStatus === 'idle');
    return () => unsubscribe();
  }, [mindMap?.id, hookStatus, subscribeToMap, mindMap]);

  // No manual persona change needed here - handled by hook

  /* Safe auto-save with race condition lock */
  const lastFetchedParamsRef = useRef<string>('');

  // Refs to avoid effect dependencies
  const mindMapsRef = useRef(mindMaps);
  useEffect(() => { mindMapsRef.current = mindMaps; }, [mindMaps]);

  useEffect(() => {
    const fetchMindMapData = async () => {
      if (isUserLoading) return;

      const currentParamsKey = getParamKey();

      // If we already have this map in our state, just switch to it
      // BUT bypass this if we are specifically asked to regenerate (_r param)
      const existingMapIndex = mindMaps.findIndex(m => {
        if (params.mapId && (m as any).id === params.mapId) return true;
        if (params.topic && m.topic?.toLowerCase() === params.topic.toLowerCase()) return true;
        if (params.isSelfReference && m.topic?.toLowerCase() === 'mindscape') return true;
        return false;
      });

      if (existingMapIndex !== -1 && !params.isRegenerating) {
        if (activeMindMapIndex !== existingMapIndex) {
          setActiveMindMapIndexState(existingMapIndex);
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
        if (params.isSelfReference) {
          currentMode = 'self-reference';
          result.data = mindscapeMap as GenerateMindMapOutput;
        } else if (params.mapId && params.isRegenerating) {
          currentMode = 'saved';
          // 1. Get topic from state or fetch it
          let topicToRegen = params.topic || (mindMapsRef.current.find(m => (m as any).id === params.mapId)?.topic);
          if (!topicToRegen) {
            // Fallback to fetching it if not in stack
            if (user) {
              const docRef = doc(firestore, 'users', user.uid, 'mindmaps', params.mapId);
              const snap = await getDoc(docRef);
              topicToRegen = snap.data()?.topic;
            }
          }

          if (!topicToRegen) throw new Error("Could not determine topic for regeneration.");

          const aiOptions = {
            provider: config.provider,
            apiKey: config.apiKey,
            model: config.pollinationsModel,
            strict: true
          };
          result = await generateMindMapAction({
            topic: topicToRegen,
            parentTopic: params.parent || undefined,
            targetLang: params.lang,
            persona: aiPersona,
          }, aiOptions);

          // Overwrite existing!
          if (result.data) {
            await handleSaveMap(result.data, params.mapId);
          }
        } else if (params.mapId) {
          currentMode = 'saved';
          if (user) {
            // Fetch from user's collection (Metadata + Conditional Content)
            const docRef = doc(firestore, 'users', user.uid, 'mindmaps', params.mapId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const meta = docSnap.data();
              if (meta.hasSplitContent) {
                // Load the heavy tree from sub-collection
                const contentRef = doc(firestore, 'users', user.uid, 'mindmaps', params.mapId, 'content', 'tree');
                const contentSnap = await getDoc(contentRef);
                if (contentSnap.exists()) {
                  const content = contentSnap.data();
                  result.data = { ...meta, ...content, id: docSnap.id } as any;
                } else {
                  result.data = { ...meta, id: docSnap.id } as any;
                }
              } else {
                // Legacy: all data is in the main document
                result.data = { ...(meta as any), id: docSnap.id };
              }

              // Backfill summary if missing
              if (result.data && !result.data.summary) {
                handleSaveMap(result.data, params.mapId, true);
              }
            } else {
              // Not found in user's collection, check public collection
              const publicDocRef = doc(firestore, 'publicMindmaps', params.mapId);
              const publicSnap = await getDoc(publicDocRef);
              if (publicSnap.exists()) {
                result.data = { ...publicSnap.data(), id: publicSnap.id } as any;
              }
            }
          } else {
            // Not logged in but has mapId, check public collection
            const publicDocRef = doc(firestore, 'publicMindmaps', params.mapId);
            const publicSnap = await getDoc(publicDocRef);
            if (publicSnap.exists()) {
              result.data = { ...publicSnap.data(), id: publicSnap.id } as any;
            }
          }

          // CRITICAL: Throw error if map was requested but not found in any collection
          if (!result.data && !result.error) {
            result.error = "Mind map not found or you don't have permission to view it.";
          }
        } else if (params.topic1 && params.topic2) {
          if (params.topic1.trim().toLowerCase() === params.topic2.trim().toLowerCase()) {
            throw new Error('Comparison requires two different topics.');
          }
          currentMode = 'compare';
          const aiOptions = {
            provider: config.provider,
            apiKey: config.apiKey,
            model: config.pollinationsModel,
            strict: false
          };
          result = await generateComparisonMapAction({
            topic1: params.topic1,
            topic2: params.topic2,
            targetLang: params.lang,
            persona: aiPersona,
          }, aiOptions);
        } else if (params.topic) {
          currentMode = 'standard';
          const aiOptions = {
            provider: config.provider,
            apiKey: config.apiKey,
            model: config.pollinationsModel,
            strict: false
          };
          result = await generateMindMapAction({
            topic: params.topic,
            parentTopic: params.parent || undefined,
            targetLang: params.lang,
            persona: aiPersona,
          }, aiOptions);
        } else if (params.sessionId) {
          const sessionType = sessionStorage.getItem(`session-type-${params.sessionId}`);
          const sessionContent = sessionStorage.getItem(`session-content-${params.sessionId}`);

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
              const aiOptions = {
                provider: config.provider,
                apiKey: config.apiKey,
                model: config.pollinationsModel,
                strict: false
              };
              result = await generateMindMapFromImageAction({
                imageDataUri: fileContent,
                targetLang: params.lang,
                persona: aiPersona,
              }, aiOptions);
            } else if (sessionType === 'text') {
              currentMode = 'vision-text';
              const aiOptions = {
                provider: config.provider,
                apiKey: config.apiKey,
                model: config.pollinationsModel,
                strict: false
              };
              result = await generateMindMapFromTextAction({
                text: fileContent,
                context: additionalText,
                targetLang: params.lang,
                persona: aiPersona,
              }, aiOptions);
            }
            sessionStorage.removeItem(`session-type-${params.sessionId}`);
            sessionStorage.removeItem(`session-content-${params.sessionId}`);
          } else {
            result.error = 'Could not retrieve session data. Please try again.';
          }
        } else {
          setIsLoading(false);
          return;
        }

        setMode(currentMode);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.data) {
          // Add to stack if not already there and set active index
          setMindMaps(prevMaps => {
            const exists = prevMaps.some(m => m.topic?.toLowerCase() === result.data!.topic?.toLowerCase());
            if (exists) {
              const newIndex = prevMaps.findIndex(m => m.topic?.toLowerCase() === result.data!.topic?.toLowerCase());
              if (newIndex !== -1) setActiveMindMapIndex(newIndex);
              return prevMaps;
            }
            const newMaps = [...prevMaps, result.data!];
            setActiveMindMapIndexState(newMaps.length - 1);
            return newMaps;
          });

          const isNewlyGenerated = !['saved', 'self-reference'].includes(currentMode);
          if (isNewlyGenerated && user && result.data) {
            const existingMapWithId = mindMapsRef.current.find(m => m.topic?.toLowerCase() === result.data!.topic?.toLowerCase() && m.id);
            const savedId = await handleSaveMap(result.data, existingMapWithId?.id);

            // CRITICAL: Update the map in stack with the returned ID to prevent re-saves
            if (savedId && !existingMapWithId?.id) {
              setMindMaps(prev => prev.map(m =>
                m.topic === result.data!.topic ? { ...m, id: savedId } : m
              ));

              // Also update the current map directly to ensure isSaved shows immediately
              handleUpdateCurrentMap({ id: savedId });

              navigateToMap(savedId);
            }
          }
        }
      } catch (e: any) {
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setGeneratingNodeId(null);
        clearRegenFlag();
      }
    };

    fetchMindMapData();
  }, [getParamKey, user, isUserLoading, handleSaveMap, toast, firestore, params, setIsLoading, setError, setGeneratingNodeId, clearRegenFlag, config, aiPersona, setMindMaps, setActiveMindMapIndexState]);

  // Track views for community maps
  useEffect(() => {
    if (mindMap?.id && (mindMap as any).isPublic && firestore) {
      const publicDocRef = doc(firestore, 'publicMindmaps', mindMap.id);
      updateDoc(publicDocRef, {
        views: increment(1)
      }).catch(err => console.warn("Failed to increment views:", err));
    }
  }, [mindMap?.id, (mindMap as any)?.isPublic, firestore]);


  // 4. Auto-Save Effect

  useEffect(() => {
    const persistFn = async (silent: boolean) => {
      await handleSaveMapFromHook(silent);
      setHasUnsavedChanges(false);
    };
    return setupAutoSave(mindMap, hasUnsavedChanges, params.isSelfReference, persistFn);
  }, [mindMap, hasUnsavedChanges, params.isSelfReference, handleSaveMapFromHook, setupAutoSave]);

  // Ref to track mindMap for stable callbacks
  const mindMapRef = useRef(mindMap);
  useEffect(() => { mindMapRef.current = mindMap; }, [mindMap]);

  const onMapUpdate = useCallback((updatedData: Partial<MindMapData>) => {
    const currentMap = mindMapRef.current;
    if (!currentMap) return;

    // Deep-ish check to see if anything actually changed
    let hasActualChanges = false;
    for (const key in updatedData) {
      if (JSON.stringify((updatedData as any)[key]) !== JSON.stringify((currentMap as any)[key])) {
        hasActualChanges = true;
        break;
      }
    }

    if (hasActualChanges) {
      handleUpdateCurrentMap(updatedData);
      setHasUnsavedChanges(true);
    }
  }, [handleUpdateCurrentMap]);

  const onManualSave = useCallback(async () => {
    await handleSaveMapFromHook();
    setHasUnsavedChanges(false);
  }, [handleSaveMapFromHook]);

  const handleExplainInChat = useCallback((message: string) => {
    setChatInitialMessage(message);
    setIsChatOpen(true);
  }, []);



  const handleGenerateAndOpenSubMap = useCallback(async (subTopic: string, nodeId: string, contextPath: string, mode: 'foreground' | 'background' = 'background') => {
    try {
      if (user) {
        const subMapsQuery = query(
          collection(firestore, 'users', user.uid, 'mindmaps'),
          where('isSubMap', '==', true),
          where('topic', '==', subTopic),
          limit(1)
        );
        const subMapSnap = await getDocs(subMapsQuery);
        if (!subMapSnap.empty) {
          const existing = { ...subMapSnap.docs[0].data(), id: subMapSnap.docs[0].id } as MindMapWithId;
          setMindMaps(prev => [...prev.filter(m => m.topic !== subTopic), existing]);
          if (mode === 'foreground') {
            setActiveMindMapIndex(mindMaps.length);
            toast({ title: "Sub-Map Linked", description: `Linked existing map for "${subTopic}".` });
          } else {
            toast({ title: "Sub-Map Available", description: `An existing map for "${subTopic}" has been linked to your Nested Maps.` });
          }
          return;
        }
      }

      await expandNode(subTopic, nodeId, { mode });
      if (mode === 'foreground') {
        toast({ title: "Sub-Map Generated", description: `Created detailed map for "${subTopic}".` });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Generation Failed", description: error.message });
    }
  }, [user, firestore, expandNode, mindMaps.length, setMindMaps, setActiveMindMapIndex, toast]);

  const handleBreadcrumbSelect = useCallback((index: number) => {
    setActiveMindMapIndex(index);
    const activeMap = mindMaps[index];
    if (activeMap) {
      navigateToMap(activeMap.id || '', activeMap.topic);
    }
  }, [mindMaps, navigateToMap, setActiveMindMapIndex]);

  const handleOpenNestedMap = useCallback(async (mapData: any, expansionId: string) => {
    if (!mapData) {
      toast({ variant: "destructive", title: "Cannot Open Map", description: "This map data is not available." });
      return;
    }

    let finalMapData = mapData;
    const mapIdToFetch = mapData.id || expansionId;
    if (mapIdToFetch && user && firestore) {
      try {
        const snap = await getDoc(doc(firestore, 'users', user.uid, 'mindmaps', mapIdToFetch));
        if (snap.exists()) finalMapData = { ...snap.data(), id: snap.id };
      } catch (e) {
        console.warn("Using cached sub-map data.", e);
      }
    }

    const existingIndex = mindMaps.findIndex(m => m.topic === finalMapData.topic);
    if (existingIndex !== -1) {
      setActiveMindMapIndex(existingIndex);
    } else {
      setMindMaps(prev => [...prev.filter(m => m.topic !== finalMapData.topic), finalMapData]);
      setMindMaps(prev => {
        const idx = prev.findIndex(m => m.topic === finalMapData.topic);
        if (idx !== -1) setActiveMindMapIndex(idx);
        return prev;
      });
    }

    navigateToMap(finalMapData.id || '', finalMapData.topic);
  }, [mindMaps, navigateToMap, toast, setMindMaps, setActiveMindMapIndex, user, firestore]);

  if (isLoading) return <GenerationLoading />;

  if (error) {
    const isAuthError = error.toLowerCase().includes('api key') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('401');
    const isRateLimit = error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('429');

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-zinc-400 p-8 max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2 shadow-2xl shadow-red-500/10">
          <ZapOff className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white tracking-tight">Something went wrong</h2>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-mono text-zinc-300 break-words max-w-md mx-auto">
            {error.includes('StructuredOutputError') ? 'AI Coordination Error: Structure Mismatch' : error}
          </div>
          <p className="text-zinc-400 leading-relaxed max-w-lg mx-auto">
            {error.includes('StructuredOutputError') ? "The AI generated a response, but it didn't fit the structure." : isAuthError ? "Verify your API key in settings." : isRateLimit ? "AI is busy, please wait." : "Unexpected error during generation."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button onClick={() => window.location.reload()} size="lg" className="rounded-2xl bg-white text-black hover:bg-zinc-200 gap-2 font-bold px-8">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')} size="lg" className="rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 gap-2 font-bold px-8">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-zinc-400 animate-in fade-in zoom-in duration-700">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Preparing your knowledge universe...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center px-4 sm:px-8 pb-8">
        <div className="w-full max-w-6xl mx-auto">
          <MindMap
            key={activeMindMapIndex}
            data={mindMap}
            isSaved={isSaved}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveMap={onManualSave}
            onExplainInChat={handleExplainInChat}
            onGenerateNewMap={handleGenerateAndOpenSubMap}
            onOpenNestedMap={handleOpenNestedMap}
            generatingNode={activeGeneratingNodeId}
            selectedLanguage={params.lang}
            onLanguageChange={changeLanguage}
            onAIPersonaChange={handlePersonaChange}
            aiPersona={aiPersona}
            onRegenerate={regenerate}
            isRegenerating={isLoading}
            canRegenerate={mode !== 'self-reference'}
            nestedExpansions={mindMap?.nestedExpansions || []}
            mindMapStack={mindMaps}
            activeStackIndex={activeMindMapIndex}
            onStackSelect={handleBreadcrumbSelect}
            onUpdate={onMapUpdate}
            status={hookStatus}
            aiHealth={aiHealth}
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
        mindMapData={mindMap}
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
