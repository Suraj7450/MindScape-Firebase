'use client';

import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Library,
  FolderOpen,
  FileText,
  Book,
  Loader2,
  Sparkles,
  MessageCircle,
  Lightbulb,
  GitBranch,
  Save,
  Check,
  MoreVertical,
  TestTube2,
  ChevronDown,
  BookOpen,
  ArrowRight,
  File,
  Image as ImageIcon,
  RefreshCw,
  Images,
  Share,
  Share2,
  Copy,
  ClipboardCheck,
  Network,
  Minimize2,
  Maximize2,
  Fingerprint,
  BrainCircuit,
  Languages,
  Download,
  X,
  Info,
  GraduationCap,
  Palette,
  Link2,
  UploadCloud,
  Cloud,
  ZapOff,
  Search,
  Target,
  Brain,
  Eye,
  Settings,
  Shield,
  Zap,
  Circle,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
const LucideIcons = {
  Library,
  FolderOpen,
  FileText,
  Book,
  Loader2,
  Sparkles,
  MessageCircle,
  Lightbulb,
  GitBranch,
  Save,
  Check,
  MoreVertical,
  TestTube2,
  ChevronDown,
  BookOpen,
  ArrowRight,
  File,
  Image: ImageIcon,
  RefreshCw,
  Images,
  Share,
  Share2,
  Copy,
  ClipboardCheck,
  Network,
  Minimize2,
  Maximize2,
  Fingerprint,
  BrainCircuit,
  Languages,
  Download,
  X,
  Info,
  GraduationCap,
  Zap,
  Palette,
  Link2,
  UploadCloud,
  Cloud,
  ZapOff,
  Search,
  Target,
  Brain,
  Eye,
  Settings,
  Shield,
  Circle,
  HelpCircle,
  Clock,
  ExternalLink,
};
import {
  enhanceImagePromptAction,
  generateQuizAction,
} from '@/app/actions';
import { QuizComponent } from './quiz/quiz-component';
import { Quiz } from '@/ai/schemas/quiz-schema';
import {
  MindMapData,
  NestedExpansionItem,
  GeneratedImage,
  MindMapWithId,
  SubCategoryInfo,
  ExplainableNode,
  ExplanationMode
} from '@/types/mind-map';
import { categorizeMindMapAction } from '@/app/actions/community';
import { MindMapStatus } from '@/hooks/use-mind-map-stack';
import { LeafNodeCard } from './mind-map/leaf-node-card';
import { ExplanationDialog } from './mind-map/explanation-dialog';
import { MindMapToolbar } from './mind-map/mind-map-toolbar';
import { Quiz } from '@/ai/schemas/quiz-schema';
import { QuizComponent } from './quiz/quiz-component';
import { TopicHeader } from './mind-map/topic-header';
import { MindMapRadialView } from './mind-map/mind-map-radial-view';
import { cn } from '@/lib/utils';
import { MindMapAccordion } from './mind-map/mind-map-accordion';
import { BreadcrumbNavigation } from './breadcrumb-navigation';
import { NestedMapsDialog } from './nested-maps-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useAIConfig } from '@/contexts/ai-config-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipPortal,
  TooltipTrigger,
} from './ui/tooltip';
import { formatText } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { languages } from '@/lib/languages';
import { AiContentDialog } from './ai-content-dialog';
import { ExampleDialog } from './example-dialog';
import { Icons } from './icons';
import { ImageGalleryDialog } from './image-gallery-dialog';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { toPascalCase } from '@/lib/utils';
import { toPlainObject } from '@/lib/serialize';

import { addDoc, collection, getDocs, query, where, serverTimestamp, doc, updateDoc, getDoc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { trackNestedExpansion, trackImageGenerated, trackMapCreated } from '@/lib/activity-tracker';
import { useStudyTimeTracker } from '@/hooks/use-study-time-tracker';




/**
 * Props for the main data component.
 */
interface MindMapProps {
  data: MindMapData;
  isSaved: boolean;
  onSaveMap: () => void;
  onExplainInChat: (message: string) => void;
  onGenerateNewMap: (topic: string, nodeId: string, contextPath: string, mode?: 'foreground' | 'background') => void;
  onOpenNestedMap?: (mapData: any, expansionId: string) => void;
  generatingNode: string | null;
  selectedLanguage: string;
  onLanguageChange: (langCode: string) => void;
  onAIPersonaChange: (persona: string) => void;
  aiPersona: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
  canRegenerate: boolean;
  nestedExpansions?: NestedExpansionItem[];
  mindMapStack?: MindMapData[];
  activeStackIndex?: number;
  onStackSelect?: (index: number) => void;
  onUpdate?: (updatedData: Partial<MindMapData>) => void;
  status: MindMapStatus;
  aiHealth?: { name: string, status: string }[];
  hasUnsavedChanges?: boolean;
  onQuizReady?: (quiz: Quiz) => void;
}

/**
 * Props for the ExplanationDialog component.
 */
interface ExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string[];
  isLoading: boolean;
  onExplainInChat: (message: string) => void;
  explanationMode: ExplanationMode;
  onExplanationModeChange: (mode: ExplanationMode) => void;
}


/**
 * The main component for displaying and interacting with a mind map.
 */
export const MindMap = ({
  data,
  isSaved,
  onSaveMap,
  onExplainInChat,
  onGenerateNewMap,
  onOpenNestedMap,
  generatingNode,
  selectedLanguage,
  onLanguageChange,
  onAIPersonaChange,
  aiPersona,
  onRegenerate,
  isRegenerating,
  canRegenerate,
  nestedExpansions: propNestedExpansions,
  mindMapStack = [],
  activeStackIndex = 0,
  onStackSelect,
  onUpdate,
  status,
  aiHealth,
  hasUnsavedChanges,
  onQuizReady,
}: MindMapProps) => {
  const [viewMode, setViewMode] = useState<'accordion' | 'map'>('accordion');
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMountNode(document.body);
  }, []);

  const mindMapRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, firestore } = useFirebase();

  // Track study time
  useStudyTimeTracker(firestore, user?.uid, true);

  const { config } = useAIConfig();
  const providerOptions = useMemo(() => ({
    provider: config.provider,
    apiKey: config.apiKey,
    strict: false
  }), [config.provider, config.apiKey]);

  const imageProviderOptions = useMemo(() => ({
    provider: config.provider === 'gemini' ? 'pollinations' : config.provider as 'pollinations' | 'bytez',
    apiKey: config.apiKey
  }), [config.provider, config.apiKey]);






  // localMindMap state is removed. We use 'data' prop directly.
  const [isTranslating, setIsTranslating] = useState(false);

  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  const [explanationDialogContent, setExplanationDialogContent] = useState<
    string[]
  >([]);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [activeSubCategory, setActiveSubCategory] =
    useState<SubCategoryInfo | null>(null);

  const [explanationMode, setExplanationMode] =
    useLocalStorage<ExplanationMode>('explanationMode', 'Intermediate');

  const [openSubTopics, setOpenSubTopics] = useState<string[]>(
    data.subTopics && data.subTopics.length > 0 ? ['topic-0'] : []
  );
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isAiContentDialogOpen, setIsAiContentDialogOpen] = useState(false);

  const [isExampleDialogOpen, setIsExampleDialogOpen] = useState(false);
  const [exampleContent, setExampleContent] = useState('');
  const [isExampleLoading, setIsExampleLoading] = useState(false);
  const [activeExplainableNode, setActiveExplainableNode] = useState<any>(null);

  const [mounted, setMounted] = useState(false);
  const [languageUI, setLanguageUI] = useState(selectedLanguage);
  const [personaUI, setPersonaUI] = useState(aiPersona);

  // Sync UI state with props ONLY on mount or when props change externally
  useEffect(() => {
    setLanguageUI(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    setPersonaUI(aiPersona);
  }, [aiPersona]);

  // Handle user-initiated changes (only trigger parent callback, don't create loop)
  const handleLanguageChangeInternal = (newLang: string) => {
    setLanguageUI(newLang);
    if (mounted) {
      handleLanguageChange(newLang);
    }
  };

  const handlePersonaChangeInternal = (newPersona: string) => {
    setPersonaUI(newPersona);
    if (mounted) {
      onAIPersonaChange(newPersona);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);


  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Nested expansion state - load from saved data if available
  const [isNestedMapsDialogOpen, setIsNestedMapsDialogOpen] = useState(false);
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);


  // State for images and expansions is initialized from data prop
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(data.savedImages || []);
  const [nestedExpansions, setNestedExpansions] = useState<NestedExpansionItem[]>(propNestedExpansions || data.nestedExpansions || []);
  const [explanations, setExplanations] = useState<Record<string, string[]>>(data.explanations || {});

  // Quiz State
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Sync images and expansions
  useEffect(() => {
    if (data) {
      if (data.savedImages) setGeneratedImages(data.savedImages);
      if (data.nestedExpansions) setNestedExpansions(data.nestedExpansions);
      if (data.explanations) setExplanations(data.explanations);
    }
  }, [data.savedImages, data.nestedExpansions, data.explanations]);

  // Use refs to track previous prop values to avoid infinite loops
  const prevPropNestedExpansionsRef = useRef<string>('');
  const prevDataNestedExpansionsRef = useRef<string>('');
  const prevDataSavedImagesRef = useRef<string>('');

  useEffect(() => {
    // Only sync if props change externally and differ from local state
    const propNestedExpansionsStr = JSON.stringify(propNestedExpansions);
    const dataNestedExpansionsStr = JSON.stringify(data.nestedExpansions);
    const dataSavedImagesStr = JSON.stringify(data.savedImages);

    // Update nested expansions only if the prop actually changed
    if (propNestedExpansions && propNestedExpansionsStr !== prevPropNestedExpansionsRef.current) {
      prevPropNestedExpansionsRef.current = propNestedExpansionsStr;
      setNestedExpansions(propNestedExpansions);
    } else if (data.nestedExpansions && dataNestedExpansionsStr !== prevDataNestedExpansionsRef.current && !propNestedExpansions) {
      prevDataNestedExpansionsRef.current = dataNestedExpansionsStr;
      setNestedExpansions(data.nestedExpansions);
    }

    // Update saved images only if the data actually changed
    if (data.savedImages && dataSavedImagesStr !== prevDataSavedImagesRef.current) {
      prevDataSavedImagesRef.current = dataSavedImagesStr;
      setGeneratedImages(data.savedImages);
    }
  }, [data.nestedExpansions, data.savedImages, propNestedExpansions]);

  // Notify parent of updates
  const lastNotifiedRef = useRef<string>('');
  useEffect(() => {
    if (onUpdate) {
      const dataToNotify = {
        nestedExpansions: nestedExpansions,
        savedImages: generatedImages,
        explanations: explanations
      };
      const stringified = JSON.stringify(dataToNotify);
      if (stringified !== lastNotifiedRef.current) {
        lastNotifiedRef.current = stringified;
        onUpdate(dataToNotify);
      }
    }
  }, [generatedImages, nestedExpansions, explanations, onUpdate]);



  // Internal auto-saves removed. 
  // All persistence is now handled by the parent component via onUpdate and its debounced auto-save.


  const handleDownloadImage = (url: string, name: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      const mimeType = url.substring(url.indexOf(':') + 1, url.indexOf(';'));
      const extension = mimeType.split('/')[1] || 'png';
      link.download = `${name.replace(/ /g, '_')}_${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not download the image. Please try saving it directly.',
      });
    }
  };


  const handleLanguageChange = async (langCode: string) => {
    if (isTranslating) return;
    setIsTranslating(true);

    try {
      // Use toPlainObject to sanitize Firestore data
      const plainMindMapData = toPlainObject(data);

      const { translation, error } = await translateMindMapAction({
        mindMapData: plainMindMapData,
        targetLang: langCode,
      }, providerOptions);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Translation Failed',
          description: error,
        });
        // Revert UI if failed
        setLanguageUI(selectedLanguage);
      } else if (translation) {
        if (onUpdate) onUpdate(translation);
        onLanguageChange(langCode);
      }
    } catch (err: any) {
      console.error("Translation error:", err);
      setLanguageUI(selectedLanguage);
    } finally {
      setIsTranslating(false);
    }
  };

  const fetchExplanation = async () => {
    if (!activeSubCategory) return;

    // Cache Key: unique combo of category name and persona/mode
    // We append explanationMode to keys to differentiate 'Simple' vs 'Expert' explanations for the same node
    const cacheKey = `${activeSubCategory.name}-${explanationMode}`;

    // 1. Check Cache
    if (explanations[cacheKey]) {
      console.log(`⚡ Using cached explanation for ${cacheKey}`);
      setExplanationDialogContent(explanations[cacheKey]);
      return;
    }

    setIsExplanationLoading(true);
    const { explanation, error } = await explainNodeAction({
      mainTopic: data.topic,
      subCategoryName: activeSubCategory.name,
      subCategoryDescription: activeSubCategory.description,
      explanationMode: explanationMode,
    }, providerOptions);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Explanation Failed',
        description: error,
      });
    } else if (explanation) {
      setExplanationDialogContent(explanation.explanationPoints);

      // 2. Save to State (triggers auto-save)
      setExplanations(prev => ({
        ...prev,
        [cacheKey]: explanation.explanationPoints
      }));
    }
    setIsExplanationLoading(false);
  };

  useEffect(() => {
    if (activeSubCategory && isExplanationDialogOpen) {
      fetchExplanation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubCategory, explanationMode, isExplanationDialogOpen]);


  const fetchExample = async () => {
    if (!activeExplainableNode) return;
    setIsExampleLoading(true);
    const { example, error } = await explainWithExampleAction({
      mainTopic: data.topic,
      topicName: activeExplainableNode.name,
      explanationMode,
    }, providerOptions);
    setIsExampleLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to get example',
        description: error,
      });
      setIsExampleDialogOpen(false);
    } else if (example) {
      setExampleContent(example.example);
    }
  };

  useEffect(() => {
    if (activeExplainableNode && isExampleDialogOpen) {
      fetchExample();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExplainableNode, explanationMode, isExampleDialogOpen]);


  const handleSubCategoryClick = (subCategory: SubCategoryInfo) => {
    setActiveSubCategory(subCategory);
    setIsExplanationDialogOpen(true);
    setExplanationDialogContent([]);
  };

  const handleExplainWithExample = (node: ExplainableNode) => {
    setExampleContent('');
    setActiveExplainableNode(node);
    setIsExampleDialogOpen(true);
  };

  const handleGenerateImageClick = async (subCategory: SubCategoryInfo) => {
    const generationId = `img-${Date.now()}`;

    const placeholderImage: GeneratedImage = {
      id: generationId,
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzI3MjcyNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HZW5lcmF0aW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
      name: subCategory.name,
      description: subCategory.description,
      status: 'generating',
    };
    setGeneratedImages(prev => [...prev, placeholderImage]);

    const { id: toastId, update } = toast({
      title: 'Starting Image Generation...',
      description: `Preparing to create image for "${subCategory.name}".`,
      duration: Infinity,
    });

    try {
      // 1. Enhance the prompt using main topic context
      update({ id: toastId, title: 'Enhancing Prompt...', description: 'AI is analyzing your topic for perfect visuals.' });
      const promptToEnhance = `${subCategory.name} in the context of "${data.topic}": ${subCategory.description}`;

      const { enhancedPrompt, error: enhanceError } = await enhanceImagePromptAction(
        { prompt: promptToEnhance, style: 'Photorealistic' },
        providerOptions
      );

      if (enhanceError || !enhancedPrompt) throw new Error(enhanceError || 'Prompt enhancement failed');

      // 2. Call Image Generation API
      update({ id: toastId, title: 'Generating Image...', description: `Connecting to ${imageProviderOptions?.provider === 'bytez' ? 'Bytez' : 'Pollinations'} model...` });

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: subCategory.name,
          description: subCategory.description,
          style: 'Photorealistic',
          provider: imageProviderOptions?.provider
        })
      });

      if (!response.ok) throw new Error('Image generation failed at the server.');

      const imageData = await response.json();
      if (!imageData.images?.[0]) throw new Error('No image returned from server.');

      const imageUrl = imageData.images[0];

      // 3. Update Gallery State
      const newImage: GeneratedImage = {
        id: generationId,
        url: imageUrl,
        name: subCategory.name,
        description: subCategory.description,
        status: 'completed',
      };

      setGeneratedImages(prev => prev.map(img => img.id === generationId ? newImage : img));

      if (firestore && user) {
        await trackImageGenerated(firestore, user.uid);
      }

      update({
        id: toastId,
        title: 'Image Created!',
        description: `Visual for "${subCategory.name}" is ready in high quality.`,
        duration: 5000,
        action: (
          <div className="flex items-center gap-2">
            <Image
              src={newImage.url}
              alt={newImage.name}
              width={40}
              height={40}
              className="rounded-md"
            />
            <Button size="sm" onClick={() => setIsGalleryOpen(true)}>
              View Gallery
            </Button>
          </div>
        ),
      });

    } catch (err: any) {
      setGeneratedImages(prev => prev.map(img => img.id === generationId ? { ...img, status: 'failed' } : img));
      update({
        id: toastId,
        title: 'Image Generation Failed',
        description: err.message,
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleDeleteImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
    toast({
      description: "Image removed from gallery.",
    });
  };





  const handleDuplicate = async () => {
    if (!data || isDuplicating) return;
    setIsDuplicating(true);

    try {
      if (!user) {
        throw new Error("You must be logged in to duplicate a mind map.");
      }

      // Create a new map object, excluding fields that shouldn't be copied
      const { id, parentMapId, isSubMap, createdAt: oldCreatedAt, updatedAt: oldUpdatedAt, ...cleanData } = data as any;

      const newMapData = {
        ...cleanData,
        userId: user.uid,
        nestedExpansions: [], // Start fresh
        savedImages: [], // Start fresh
      };

      // We essentially just "create new map" flow
      // But simpler: just tell parent we want to save this as a new map?
      // Actually, since this is "Duplicate", we should probably just save it directly to the user's collection

      const docRef = await addDoc(collection(firestore!, 'users', user.uid, 'mindmaps'), {
        ...newMapData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Mind Map Duplicated",
        description: "A copy has been saved to your dashboard.",
      });

      // Redirect to the new map?
      router.push(`/data?id=${docRef.id}`);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Duplicate Failed",
        description: error.message || "Could not duplicate mind map.",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const copyToClipboard = () => {
    // Aggressively hunt for an ID: 1. data.id, 2. data.id, 3. URL search params
    const sParams = new URLSearchParams(window.location.search);
    const effectiveId = data.id || data.id || sParams.get('mapId');

    let url = window.location.href;

    // If we have any form of map ID, construct a stable ID-based link
    if (effectiveId) {
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const params = new URLSearchParams();
      params.set('mapId', effectiveId);

      // Transfer relevant status flags but drop 'topic'
      if (selectedLanguage && selectedLanguage !== 'en') {
        params.set('lang', selectedLanguage);
      }
      url = `${baseUrl}?${params.toString()}`;
    }

    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: effectiveId ? "Map ID-Link Copied" : "Link Copied",
      description: effectiveId
        ? "Stable link with map ID is now in your clipboard."
        : "Direct link copied. Note: ID not yet available.",
    });
  };

  const expandAll = () => {
    const allTopicIds = data.subTopics.map((_, i) => `topic-${i}`);
    const allCategoryIds = data.subTopics.flatMap((t, i) =>
      t.categories.map((_, j) => `cat-${i}-${j}`)
    );
    setOpenSubTopics(allTopicIds);
    setOpenCategories(allCategoryIds);
    setIsAllExpanded(true);
  };

  const handlePublish = async () => {
    if (!user || !firestore || isPublishing) return;

    // 1. Check if it's already public
    if (data.isPublic) {
      toast({ title: "Already Public", description: "This mind map is already in the community dashboard." });
      return;
    }

    setIsPublishing(true);
    const { id: toastId, update } = toast({
      title: 'Publishing to Community...',
      description: 'AI is categorizing your mind map for the community.',
      duration: Infinity,
    });

    try {
      // 2. AI Categorization
      const { categories, error: catError } = await categorizeMindMapAction({
        topic: data.topic,
        summary: data.summary,
      }, providerOptions);

      if (catError) throw new Error(catError);

      update({ id: toastId, title: 'Uploading Data...', description: 'Saving your mind map to the community repository.' });

      // 3. Prepare Community Data
      const publicData: any = {
        ...toPlainObject(data),
        isPublic: true,
        publicCategories: categories,
        originalMapId: data.id,
        originalAuthorId: user.uid,
        authorName: user.displayName || 'Explorer',
        authorAvatar: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0,
      };

      // 4. Save to publicMindmaps (use document ID from private map for consistency)
      const publicDocRef = doc(firestore, 'publicMindmaps', data.id!);
      await setDoc(publicDocRef, publicData);

      // 5. Update Local Status
      if (onUpdate) {
        onUpdate({ isPublic: true, publicCategories: categories });
      }

      // 6. Update Private Document Status
      const privateDocRef = doc(firestore, 'users', user.uid, 'mindmaps', data.id!);
      await updateDoc(privateDocRef, { isPublic: true, publicCategories: categories });

      update({
        id: toastId,
        title: 'Mind Map Published!',
        description: 'Your mind map is now live on the Community Dashboard.',
        duration: 5000,
        action: (
          <Button size="sm" onClick={() => router.push('/community')}>
            Browse Community
          </Button>
        )
      });

    } catch (err: any) {
      console.error('Publish error:', err);
      update({
        id: toastId,
        title: 'Publishing Failed',
        description: err.message || 'An unknown error occurred.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStartQuiz = async () => {
    if (isGeneratingQuiz) return;

    setIsGeneratingQuiz(true);
    const { id: toastId, update } = toast({
      title: 'Preparing Your Quiz...',
      description: 'AI is hand-crafting questions based on this map.',
      duration: Infinity,
    });

    try {
      const { data: quizData, error } = await generateQuizAction({
        topic: data.topic,
        mindMapData: toPlainObject(data),
        targetLang: selectedLanguage
      }, providerOptions);

      if (error) throw new Error(error);
      if (!quizData) throw new Error("Failed to generate quiz data.");

      if (onQuizReady) {
        onQuizReady(quizData);
      } else {
        // Fallback or legacy
        toast({ title: "Quiz Ready", description: "You can find it in the chat panel." });
      }

      update({
        id: toastId,
        title: 'Quiz Ready!',
        description: 'Time to test your knowledge.',
        duration: 3000,
      });
    } catch (err: any) {
      update({
        id: toastId,
        title: 'Quiz Generation Failed',
        description: err.message || 'An unknown error occurred.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const collapseAll = () => {
    setOpenSubTopics([]);
    setOpenCategories([]);
    setIsAllExpanded(false);
  };

  return (
    <div className="min-h-screen pb-20 relative" ref={mindMapRef}>
      <MindMapToolbar
        languageUI={languageUI}
        onLanguageChange={handleLanguageChangeInternal}
        isTranslating={isTranslating}
        personaUI={personaUI}
        onPersonaChange={handlePersonaChangeInternal}
        isAllExpanded={isAllExpanded}
        onToggleExpandAll={isAllExpanded ? collapseAll : expandAll}
        isCopied={isCopied}
        onCopyPath={copyToClipboard}
        isSaved={isSaved}
        onSave={onSaveMap}
        onOpenAiContent={() => setIsAiContentDialogOpen(true)}
        onOpenNestedMaps={() => setIsNestedMapsDialogOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onDuplicate={handleDuplicate}
        isDuplicating={isDuplicating}
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
        canRegenerate={canRegenerate}
        nestedExpansionsCount={nestedExpansions.length}
        imagesCount={generatedImages.length}
        status={status}
        aiHealth={aiHealth}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        isPublic={!!data.isPublic}
      />

      <div className="container max-w-6xl mx-auto px-4 space-y-12 pt-20">
        {viewMode === 'accordion' ? (
          <>
            <TopicHeader
              mindMap={data}
              mindMapStack={mindMapStack}
              activeStackIndex={activeStackIndex}
              onStackSelect={onStackSelect as any}
              onStartQuiz={handleStartQuiz}
            />

            <MindMapAccordion
              mindMap={data}
              openSubTopics={openSubTopics}
              setOpenSubTopics={setOpenSubTopics}
              openCategories={openCategories}
              setOpenCategories={setOpenCategories}
              onGenerateNewMap={onGenerateNewMap}
              handleSubCategoryClick={handleSubCategoryClick}
              handleGenerateImageClick={handleGenerateImageClick}
              onExplainInChat={onExplainInChat}
              nestedExpansions={nestedExpansions}
              onOpenNestedMap={onOpenNestedMap}
              generatingNode={generatingNode}
              mainTopic={data.topic}
              onExplainWithExample={handleExplainWithExample}
              status={status}
            />
          </>
        ) : (
          // Map Mode - Full Screen Portal (NO CONTAINER)
          mountNode && createPortal(
            <div className="fixed inset-0 top-[72px] z-40 bg-black animate-in fade-in duration-300">
              <MindMapRadialView
                data={data}
                onNodeClick={(node) => {
                  if (node.type === 'subcategory') handleSubCategoryClick(node);
                }}
                onGenerateNewMap={(topic, id) => {
                  onGenerateNewMap(topic, id || '', `${data.topic} > ${topic}`, 'background');
                }}
                generatingNode={generatingNode}
              />
            </div>,
            mountNode
          )
        )}
      </div>

      {/* Dialogs */}
      <ExplanationDialog
        isOpen={isExplanationDialogOpen}
        onClose={() => setIsExplanationDialogOpen(false)}
        title={activeSubCategory?.name || 'Explanation'}
        content={explanationDialogContent}
        isLoading={isExplanationLoading}
        onExplainInChat={onExplainInChat}
        explanationMode={explanationMode}
        onExplanationModeChange={setExplanationMode}
        isGlobalBusy={status !== 'idle'}
      />


      <AiContentDialog
        isOpen={isAiContentDialogOpen}
        onClose={() => setIsAiContentDialogOpen(false)}
        mindMap={data}
        isGlobalBusy={status !== 'idle'}
      />

      <ExampleDialog
        isOpen={isExampleDialogOpen}
        onClose={() => setIsExampleDialogOpen(false)}
        title={activeExplainableNode?.name || 'Example'}
        example={exampleContent}
        isLoading={isExampleLoading}
        explanationMode={explanationMode}
        onExplanationModeChange={setExplanationMode}
        isGlobalBusy={status !== 'idle'}
        onRegenerate={() => {
          if (activeExplainableNode) {
            setIsExampleLoading(true);
            setExampleContent('');
            setActiveExplainableNode({ ...activeExplainableNode });
          }
        }}
      />

      <ImageGalleryDialog
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={generatedImages}
        onDownload={handleDownloadImage}
        onRegenerate={(subCategory) => {
          handleGenerateImageClick({ name: subCategory.name, description: subCategory.description } as any);
        }}
        onDelete={handleDeleteImage}
      />

      <NestedMapsDialog
        isOpen={isNestedMapsDialogOpen}
        onClose={() => setIsNestedMapsDialogOpen(false)}
        expansions={nestedExpansions.map(item => ({
          ...item,
          path: item.path || ''
        }))}
        onDelete={(id) => {
          toast({ description: "Nested map deleted" });
        }}
        onRegenerate={(parentName, id) => {
          toast({ description: `Regenerating ${parentName}...` });
        }}
        expandingId={null}
        onExplainInChat={onExplainInChat}
        mainTopic={data.topic}
        onOpenMap={(mapData, id) => {
          setIsNestedMapsDialogOpen(false);
          if (onOpenNestedMap) onOpenNestedMap(mapData, id);
        }}
        onExpandFurther={(name, desc, parentId) => {
          setIsNestedMapsDialogOpen(false);
          onGenerateNewMap(name, desc, parentId);
        }}
        isGlobalBusy={status !== 'idle'}
      />
    </div>
  );
};
