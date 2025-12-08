
'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MindMap } from '@/components/mind-map';
import { ChatPanel } from '@/components/chat-panel';
import { GenerationLoading } from '@/components/generation-loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Cloud, Brain, Eye, Sparkles } from 'lucide-react';
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
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  generateComparisonMapAction,
  generateMindMapAction,
  generateMindMapFromImageAction,
  generateMindMapFromTextAction,
  summarizeMindMapAction,
} from '@/app/actions';
import { BreadcrumbNavigation } from '@/components/breadcrumb-navigation';
import Image from 'next/image';
import { mindscapeMap } from '@/lib/mindscape-data';
import { trackMapCreated } from '@/lib/activity-tracker';

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

  const [mindMaps, setMindMaps] = useState<GenerateMindMapOutput[]>([]);
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

  const hasFetchedRef = useRef(false);

  const mindMap = mindMaps[activeMindMapIndex] as (GenerateMindMapOutput & { id?: string; thumbnailUrl?: string; thumbnailPrompt?: string, summary?: string });
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

  const { data: savedMindMap, isLoading: isFetchingSavedMap } = useDoc<GenerateMindMapOutput>(docPath);

  const handleSaveMap = useCallback(async (mapToSave: GenerateMindMapOutput) => {
    if (!mapToSave || !user || (mapToSave as any).id) {
      return;
    }
    setIsSaving(true);
    try {
      const mindMapsCollection = collection(firestore, 'users', user.uid, 'mindmaps');

      const { summary: summaryData, error: summaryError } = await summarizeMindMapAction({ mindMapData: mapToSave });
      if (summaryError || !summaryData) {
        throw new Error(summaryError || 'Failed to generate mind map summary.');
      }

      const { ...cleanMapData } = mapToSave;

      const thumbnailPrompt = `A cinematic 3D render of ${mapToSave.topic}, in futuristic purple tones, mind-map theme, highly detailed`;
      const thumbnailUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(thumbnailPrompt)}?width=400&height=225&nologo=true`;

      const newMindMapData = {
        ...cleanMapData,
        summary: summaryData.summary,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        thumbnailUrl,
        thumbnailPrompt,
      };

      const docRef = await addDoc(mindMapsCollection, newMindMapData);

      const updatedMindMap = { ...newMindMapData, id: docRef.id } as any;

      setMindMaps(prevMaps => {
        const newMaps = [...prevMaps];
        const mapIndex = newMaps.findIndex(m => m.topic === mapToSave.topic);
        if (mapIndex !== -1) {
          newMaps[mapIndex] = updatedMindMap;
        }
        return newMaps;
      });

      toast({
        title: 'Map Auto-Saved!',
        description: `Mind map "${mapToSave.topic}" has been saved.`,
      });

      // Track activity
      await trackMapCreated(firestore, user.uid);
    } catch (err: any) {
      const permissionError = new FirestorePermissionError({
        path: `users/${user.uid}/mindmaps`,
        operation: 'create',
        requestResourceData: { ...mapToSave },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: 'destructive',
        title: 'Auto-Save Failed',
        description: permissionError.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    const fetchMindMapData = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      setIsLoading(true);
      setError(null);

      const singleTopic = searchParams.get('topic');
      const topic1 = searchParams.get('topic1');
      const topic2 = searchParams.get('topic2');
      const sessionId = searchParams.get('sessionId');
      const mapId = searchParams.get('mapId');
      const lang = searchParams.get('lang');
      const parentTopic = searchParams.get('parent');
      const isPublic = searchParams.get('public') === 'true';
      const isSelfReference = searchParams.get('selfReference') === 'true';

      let result: { data: GenerateMindMapOutput | null; error: string | null } = { data: null, error: null };
      let currentMode = 'standard';

      try {
        if (isSelfReference) {
          currentMode = 'self-reference';
          result.data = mindscapeMap as GenerateMindMapOutput;
        } else if (mapId) {
          currentMode = isPublic ? 'public-saved' : 'saved';
          if (isPublic) {
            // Public maps are fetched with a direct getDoc call because they are read-only
            const publicDocRef = doc(firestore, 'publicMindmaps', mapId);
            const docSnap = await getDoc(publicDocRef);
            if (docSnap.exists()) {
              result.data = { ...(docSnap.data() as GenerateMindMapOutput), id: docSnap.id };
            } else {
              result.error = 'Could not find the public mind map.';
            }
          } else {
            if (isFetchingSavedMap) {
              hasFetchedRef.current = false;
              return;
            }
            if (savedMindMap) {
              result.data = { ...savedMindMap, id: mapId };
            } else if (!isFetchingSavedMap && !savedMindMap) {
              result.error = 'Could not find the saved mind map or you do not have permission to view it.';
            }
          }
        } else if (singleTopic) {
          currentMode = 'standard';
          result = await generateMindMapAction({
            topic: singleTopic,
            parentTopic: parentTopic || undefined,
            targetLang: lang || undefined,
          });
        } else if (topic1 && topic2) {
          currentMode = 'compare';
          result = await generateComparisonMapAction({
            topic1,
            topic2,
            targetLang: lang || undefined,
          });
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
              result = await generateMindMapFromImageAction({
                imageDataUri: fileContent,
                targetLang: lang || undefined,
              });
            } else if (sessionType === 'text') {
              currentMode = 'vision-text';
              result = await generateMindMapFromTextAction({
                text: fileContent,
                context: additionalText,
                targetLang: lang || undefined,
              });
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
          result.error = 'Invalid parameters for mind map generation.';
        }

        setMode(currentMode);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.data) {
          const isBranching = !!parentTopic;
          if (isBranching) {
            setMindMaps(prevMaps => [...prevMaps, result.data!]);
            setActiveMindMapIndex(prevIndex => prevIndex + 1);
          } else {
            setMindMaps([result.data]);
            setActiveMindMapIndex(0);
          }

          const isNewlyGenerated = !['saved', 'public-saved', 'self-reference'].includes(currentMode);
          if (isNewlyGenerated && user) {
            await handleSaveMap(result.data);
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
      }
    };

    fetchMindMapData();
  }, [mapId, searchParams, user, savedMindMap, isFetchingSavedMap, handleSaveMap, toast, firestore]);


  const handleManualSaveMap = () => {
    if (mindMap) {
      handleSaveMap(mindMap);
    }
  };

  const handleExplainInChat = (message: string) => {
    setChatInitialMessage(message);
    setIsChatOpen(true);
  };

  const handleGenerateNewMap = (topic: string, nodeId: string) => {
    setGeneratingNodeId(nodeId);
    const lang = searchParams.get('lang');
    const query = new URLSearchParams({
      topic: topic,
      parent: mindMap?.topic || '',
      lang: lang || 'en',
    }).toString();
    router.push(`/mindmap?${query}`);
  };

  const handleLanguageChange = (langCode: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('lang', langCode);
    router.push(`/mindmap?${newParams.toString()}`);
  };

  const handleRegenerate = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('_r', Date.now().toString()); // Add a random param to force re-fetch
    router.push(`/mindmap?${newParams.toString()}`);
  };

  const handleBreadcrumbSelect = (index: number) => {
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
  };


  const ModeBadge = () => {
    let badgeContent;
    if (mode === 'self-reference') {
      badgeContent = {
        icon: Brain,
        text: 'About MindScape',
        tooltip: 'This is a pre-defined mind map about the MindScape app itself.',
      };
    } else if (mode === 'compare') {
      badgeContent = {
        icon: Zap,
        text: 'Comparison Mode',
        tooltip: 'This is a dynamically generated comparison map.',
      };
    } else if (mode === 'vision-image' || mode === 'vision-text') {
      badgeContent = {
        icon: Eye,
        text: 'Vision Mode',
        tooltip: 'This map was generated from an uploaded file.',
      };
    } else if (mode === 'mindgpt') {
      badgeContent = {
        icon: Brain,
        text: 'MindGPT',
        tooltip: 'This map was built conversationally.',
      };
    } else if (mode === 'saved') {
      badgeContent = {
        icon: Cloud,
        text: 'Loaded from Saved',
        tooltip: 'You are viewing a saved mind map.',
      };
    } else if (mode === 'public-saved') {
      badgeContent = {
        icon: Cloud,
        text: 'Viewing Public Map',
        tooltip: 'You are viewing a mind map from the community.',
      };
    } else {
      return null;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <badgeContent.icon className="h-3 w-3" />
              {badgeContent.text}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{badgeContent.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return <GenerationLoading />;
  }

  if (error) {
    return <div className="text-center p-8 text-destructive">{error}</div>;
  }

  if (!mindMap) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Could not load or generate a mind map. Please check the topic and try
        again.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center px-4 sm:px-8 pt-4 sm:pt-6 pb-8">
        <div className="w-full max-w-6xl mx-auto -mt-[60px]">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {mindMaps.length > 1 && (
              <BreadcrumbNavigation
                maps={mindMaps}
                activeIndex={activeMindMapIndex}
                onSelect={handleBreadcrumbSelect}
              />
            )}
            <ModeBadge />
          </div>
          <MindMap
            key={activeMindMapIndex} // Force re-mount to reset internal state
            data={mindMap}
            isSaved={isSaved}
            isPublic={isPublic}
            onSaveMap={handleManualSaveMap}
            onExplainInChat={handleExplainInChat}
            onGenerateNewMap={handleGenerateNewMap}
            generatingNode={generatingNodeId}
            selectedLanguage={searchParams.get('lang') || 'en'}
            onLanguageChange={handleLanguageChange}
            onRegenerate={handleRegenerate}
            isRegenerating={isLoading}
            canRegenerate={!isPublic && mode !== 'self-reference'}
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
        onClose={() => setIsChatOpen(false)}
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
    <Suspense fallback={<GenerationLoading />}>
      <MindMapPageContent />
    </Suspense>
  );
}
