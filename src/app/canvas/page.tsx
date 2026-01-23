
'use client';

import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MindMap } from '@/components/mind-map';
import { MindMapData, NestedExpansionItem } from '@/types/mind-map';
import { GenerationLoading } from '@/components/generation-loading';
import dynamic from 'next/dynamic';

const ChatPanel = dynamic(() => import('@/components/chat-panel').then(mod => mod.ChatPanel), {
  ssr: false,
  loading: () => null
});

import { SearchReferencesPanel } from '@/components/canvas/SearchReferencesPanel';

import { Button } from '@/components/ui/button';
import {
  RefreshCw, Sparkles, Loader2, ZapOff, List, Bot, UserRound, Zap as ZapIcon, Palette, Brain
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [chatMode, setChatMode] = useState<'chat' | 'quiz'>('chat');
  const [chatTopic, setChatTopic] = useState<string | undefined>(undefined);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRegenDialogOpen, setIsRegenDialogOpen] = useState(false);
  const [tempPersona, setTempPersona] = useState<string>('Standard');
  const [tempDepth, setTempDepth] = useState<'low' | 'medium' | 'deep'>('low');

  const aiHealth = useAIHealth();
  const handleUpdateRef = useRef<(data: Partial<MindMapData>) => void>(() => { });

  const persistenceOptions = useMemo(() => ({
    onRemoteUpdate: (data: MindMapData) => handleUpdateRef.current(data)
  }), []);

  const { aiPersona, updatePersona: handlePersonaChange, subscribeToMap, saveMap: handleSaveMap, setupAutoSave } = useMindMapPersistence(persistenceOptions);

  // Sync URL persona with persistence on mount
  useEffect(() => {
    if (params.persona && params.persona.toLowerCase() !== aiPersona.toLowerCase()) {
      handlePersonaChange(params.persona);
    }
  }, [params.persona, handlePersonaChange, aiPersona]);

  // 1. ADAPTERS
  const expansionAdapter = useMemo(() => ({
    generate: async (topic: string, parentTopic?: string) => {
      const aiOptions = {
        provider: config.provider,
        apiKey: config.provider === 'pollinations' ? config.pollinationsApiKey : config.apiKey,
        model: config.pollinationsModel,
      };
      const result = await generateMindMapAction({
        topic,
        parentTopic,
        targetLang: params.lang,
        persona: aiPersona,
        depth: params.depth,
        useSearch: params.useSearch === 'true',
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
            apiKey: config.provider === 'pollinations' ? config.pollinationsApiKey : config.apiKey,
            model: config.pollinationsModel,
            strict: true
          };
          result = await generateMindMapAction({
            topic: topicToRegen,
            parentTopic: params.parent || undefined,
            targetLang: params.lang,
            persona: aiPersona,
            depth: params.depth,
            useSearch: params.useSearch === 'true',
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

              // Load nested expansions (sub-maps) for this parent map
              if (result.data && user) {
                try {
                  const subMapsQuery = query(
                    collection(firestore, 'users', user.uid, 'mindmaps'),
                    where('parentMapId', '==', params.mapId)
                  );
                  const subMapsSnap = await getDocs(subMapsQuery);

                  if (!subMapsSnap.empty) {
                    const nestedExpansions: NestedExpansionItem[] = subMapsSnap.docs.map(doc => {
                      const subMapData = { ...doc.data(), id: doc.id } as MindMapWithId;
                      return {
                        id: doc.id,
                        topic: subMapData.topic,
                        parentName: result.data!.topic,
                        icon: subMapData.icon || 'network',
                        status: 'completed' as const,
                        timestamp: subMapData.createdAt ? (typeof subMapData.createdAt === 'number' ? subMapData.createdAt : subMapData.createdAt.toMillis()) : Date.now(),
                        fullData: subMapData,
                        createdAt: subMapData.createdAt ? (typeof subMapData.createdAt === 'number' ? subMapData.createdAt : subMapData.createdAt.toMillis()) : Date.now(),
                        depth: (subMapData as any).depth || 1,
                        subCategories: []
                      };
                    });

                    // Add nested expansions to the loaded map data
                    result.data = {
                      ...result.data,
                      nestedExpansions: [...(result.data.nestedExpansions || []), ...nestedExpansions]
                    };
                  }
                } catch (err) {
                  console.error('Failed to load nested expansions:', err);
                  // Don't fail the whole load if nested expansions fail
                }
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
            apiKey: config.provider === 'pollinations' ? config.pollinationsApiKey : config.apiKey,
            model: config.pollinationsModel,
            strict: false
          };
          result = await generateComparisonMapAction({
            topic1: params.topic1,
            topic2: params.topic2,
            targetLang: params.lang,
            persona: aiPersona,
            depth: params.depth,
            useSearch: params.useSearch === 'true',
          }, aiOptions);
        } else if (params.topic) {
          currentMode = 'standard';
          const aiOptions = {
            provider: config.provider,
            apiKey: config.provider === 'pollinations' ? config.pollinationsApiKey : config.apiKey,
            model: config.pollinationsModel,
            strict: false
          };
          result = await generateMindMapAction({
            topic: params.topic,
            parentTopic: params.parent || undefined,
            targetLang: params.lang,
            persona: aiPersona,
            depth: params.depth,
            useSearch: params.useSearch === 'true',
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

            if (sessionType === 'image' || sessionType === 'pdf') {
              currentMode = sessionType === 'image' ? 'vision-image' : 'vision-pdf';
              const aiOptions = {
                provider: config.provider,
                apiKey: config.provider === 'pollinations' ? config.pollinationsApiKey : config.apiKey,
                model: config.pollinationsModel,
                strict: false
              };
              result = await generateMindMapFromImageAction({
                imageDataUri: fileContent,
                targetLang: params.lang,
                persona: aiPersona,
                depth: params.depth,
              }, aiOptions);
            }
            else if (sessionType === 'text') {
              currentMode = 'vision-text';
              const aiOptions = {
                provider: config.provider,
                apiKey: config.provider === 'pollinations' ? config.pollinationsApiKey : config.apiKey,
                model: config.pollinationsModel,
                strict: false
              };
              result = await generateMindMapFromTextAction({
                text: fileContent,
                context: additionalText,
                targetLang: params.lang,
                persona: aiPersona,
                depth: params.depth,
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

          // SPEED OPTIMIZATION: Hide loading screen as soon as we have data!
          setIsLoading(false);

          const isNewlyGenerated = !['saved', 'self-reference'].includes(currentMode);
          if (isNewlyGenerated && user && result.data) {
            const existingMapWithId = mindMapsRef.current.find(m => m.topic?.toLowerCase() === result.data!.topic?.toLowerCase() && m.id);

            // Perform save in background to not block UI/navigation
            handleSaveMap(result.data, existingMapWithId?.id).then((savedId) => {
              // CRITICAL: Update the map in stack with the returned ID to prevent re-saves
              if (savedId && !existingMapWithId?.id) {
                setMindMaps(prev => prev.map(m =>
                  m.topic === result.data!.topic ? { ...m, id: savedId } : m
                ));

                // Also update the current map directly to ensure isSaved shows immediately
                handleUpdateCurrentMap({ id: savedId });

                navigateToMap(savedId);
              }
            });
          }
        }
      } catch (e: any) {
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(errorMessage);
        setIsLoading(false); // Ensure loading stops on error
      } finally {
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
    setChatMode('chat');
    setIsChatOpen(true);
  }, []);

  const handleStartQuizForTopic = useCallback((topic: string) => {
    console.log('🎯 handleStartQuizForTopic called with topic:', topic);
    setChatTopic(topic);
    setChatMode('quiz');
    setIsChatOpen(true);
    console.log('✅ Chat state updated: mode=quiz, isOpen=true, topic=', topic);
  }, []);

  const handleRegenerateClick = useCallback(() => {
    // Ensure we match the Title Case values in our SelectItems
    const currentPersona = aiPersona || 'Standard';
    const normalizedPersona = currentPersona.charAt(0).toUpperCase() + currentPersona.slice(1).toLowerCase();
    setTempPersona(normalizedPersona);
    setTempDepth(params.depth || 'low');
    setIsRegenDialogOpen(true);
  }, [aiPersona, params.depth]);

  const handleConfirmRegeneration = useCallback(() => {
    setIsRegenDialogOpen(false);

    const newParams = new URLSearchParams(window.location.search);
    newParams.set('persona', tempPersona);
    newParams.set('depth', tempDepth);
    newParams.set('_r', Date.now().toString());

    router.replace(`/canvas?${newParams.toString()}`);
  }, [router, tempPersona, tempDepth]);





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
            onStartQuiz={handleStartQuizForTopic}
            generatingNode={activeGeneratingNodeId}
            selectedLanguage={params.lang}
            onLanguageChange={changeLanguage}
            onAIPersonaChange={handlePersonaChange}
            aiPersona={aiPersona}
            onRegenerate={handleRegenerateClick}
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

          {/* Search References Panel */}
          {mindMap.searchSources && mindMap.searchSources.length > 0 && (
            <SearchReferencesPanel
              sources={mindMap.searchSources}
              timestamp={mindMap.searchTimestamp}
            />
          )}
        </div>
      </div>

      {/* Regeneration Configuration Dialog */}
      <Dialog open={isRegenDialogOpen} onOpenChange={setIsRegenDialogOpen}>
        <DialogContent className="glassmorphism border-white/10 sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3 font-orbitron uppercase tracking-tighter">
              <RefreshCw className="h-6 w-6 text-purple-400" />
              Regenerate Mind Map
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium tracking-tight">
              Customize how you want the AI to rethink this topic.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 font-orbitron">AI Persona</label>
              <Select value={tempPersona} onValueChange={setTempPersona}>
                <SelectTrigger className="w-full h-12 border border-white/10 bg-black/60 text-[11px] font-bold uppercase tracking-widest text-zinc-100 rounded-2xl hover:bg-black/80 transition px-4 font-orbitron shadow-inner flex items-center justify-between group">
                  <SelectValue placeholder="Select Persona" />
                </SelectTrigger>
                <SelectContent className="glassmorphism border-white/10 z-[1000] !pointer-events-auto">
                  <SelectItem value="Standard" className="text-[11px] font-bold uppercase font-orbitron py-3 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-zinc-400" />
                      <span>Standard (Balanced)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Teacher" className="text-[11px] font-bold uppercase font-orbitron py-3 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <UserRound className="w-4 h-4 text-blue-400" />
                      <span>Teacher (Educational)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Concise" className="text-[11px] font-bold uppercase font-orbitron py-3 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ZapIcon className="w-4 h-4 text-amber-400" />
                      <span>Concise (Brief)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Creative" className="text-[11px] font-bold uppercase font-orbitron py-3 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-pink-400" />
                      <span>Creative (Imaginative)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Sage" className="text-[11px] font-bold uppercase font-orbitron py-3 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>Cognitive Sage (Philosophical)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 font-orbitron">Structural Depth</label>
              <Select value={tempDepth} onValueChange={(val: any) => setTempDepth(val)}>
                <SelectTrigger className="w-full h-12 border border-white/10 bg-black/60 text-[11px] font-bold uppercase tracking-widest text-zinc-100 rounded-2xl hover:bg-black/80 transition px-4 font-orbitron shadow-inner flex items-center justify-between group">
                  <SelectValue placeholder="Select Depth" />
                </SelectTrigger>
                <SelectContent className="glassmorphism border-white/10 z-[1000] !pointer-events-auto">
                  <SelectItem value="low" className="text-[11px] font-bold uppercase font-orbitron py-3 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 opacity-40 shrink-0" />
                      <span>Quick Overview (24-40 items)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" className="text-[11px] font-bold uppercase font-orbitron py-3 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 opacity-40 shrink-0" />
                      <span>Balanced Exploration (75 items)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deep" className="text-[11px] font-bold uppercase font-orbitron py-3 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Deep Knowledge Dive (120 items)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsRegenDialogOpen(false)} className="rounded-2xl border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 font-black font-orbitron uppercase tracking-widest px-6 h-12">
              Cancel
            </Button>
            <Button onClick={handleConfirmRegeneration} className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black font-orbitron uppercase tracking-widest px-8 h-12 shadow-[0_0_25px_rgba(139,92,246,0.2)] hover:shadow-[0_0_35px_rgba(139,92,246,0.4)] transition-all">
              Regenerate Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          setChatTopic(undefined);
          setChatMode('chat');
        }}
        topic={chatTopic || mindMap?.shortTitle || mindMap?.topic || 'Mind Map Details'}
        mindMapData={mindMap ? toPlainObject(mindMap) : undefined}
        initialMessage={chatInitialMessage}
        initialMode={chatMode}
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
