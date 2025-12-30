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
  explainNodeAction,
  generateQuizAction,
  explainWithExampleAction,
  translateMindMapAction,
  expandNodeAction,
  enhanceImagePromptAction,
} from '@/app/actions';
import {
  MindMapData,
  NestedExpansionItem,
  GeneratedImage,
  MindMapWithId,
  SubCategoryInfo,
  ExplainableNode,
  ExplanationMode
} from '@/types/mind-map';
import { MindMapStatus } from '@/hooks/use-mind-map-stack';
import { LeafNodeCard } from './mind-map/leaf-node-card';
import { ExplanationDialog } from './mind-map/explanation-dialog';
import { MindMapToolbar } from './mind-map/mind-map-toolbar';
import { HeroSection } from './mind-map/hero-section';
import { MindMapRadialView } from './mind-map/mind-map-radial-view';
import { cn } from '@/lib/utils';
import { MindMapAccordion } from './mind-map/mind-map-accordion';
import { BreadcrumbNavigation } from './breadcrumb-navigation';
import { NestedMapsDialog } from './nested-maps-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { QuizDialog } from './quiz-dialog';
import type { QuizQuestion } from '@/ai/flows/generate-quiz';
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

import { addDoc, collection, getDocs, query, where, serverTimestamp, doc, updateDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
  isPublic: boolean;
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
  isPublic,
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
  hasUnsavedChanges
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
    strict: true
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

  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

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

  const [heroImages, setHeroImages] = useState<{ left: string; right: string } | undefined>(data.heroImages || undefined);
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

  useEffect(() => {
    const fetchHeroImages = async () => {
      // If we already have heroImages, don't refetch
      if (!mounted || !data?.topic || heroImages) return;

      try {
        const leftPrompt = `A cinematic, ultra-detailed conceptual 3D render: "${data.topic}", left-balanced composition, abstract futuristic lighting, purple and indigo tones, 8k resolution.`;
        const rightPrompt = `A cinematic, ultra-detailed conceptual 3D render: "${data.topic}", right-balanced composition, abstract futuristic lighting, purple and indigo tones, 8k resolution.`;

        // Attempt to generate via API which uses authenticated providers/rotation
        const [leftRes, rightRes] = await Promise.all([
          fetch('/api/generate-image', {
            method: 'POST',
            body: JSON.stringify({ prompt: leftPrompt, size: '1024x640' })
          }),
          fetch('/api/generate-image', {
            method: 'POST',
            body: JSON.stringify({ prompt: rightPrompt, size: '1024x640' })
          })
        ]);

        let leftUrl = '';
        let rightUrl = '';

        if (leftRes.ok) {
          const lData = await leftRes.json();
          leftUrl = lData.images?.[0];
        }
        if (rightRes.ok) {
          const rData = await rightRes.json();
          rightUrl = rData.images?.[0];
        }

        // Final fallback to direct URL with a cache-busting seed if API failed
        const seed = Math.floor(Math.random() * 1000000);
        setHeroImages({
          left: leftUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(leftPrompt)}?width=1024&height=640&nologo=true&model=flux&seed=${seed}`,
          right: rightUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(rightPrompt)}?width=1024&height=640&nologo=true&model=turbo&seed=${seed + 1}`
        });

      } catch (err) {
        console.error("Hero image fetch failed:", err);
      }
    };

    fetchHeroImages();
  }, [data.topic, mounted, heroImages]);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(!!data?.isPublic);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Nested expansion state - load from saved data if available
  const [isNestedMapsDialogOpen, setIsNestedMapsDialogOpen] = useState(false);
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);


  // State for images and expansions is initialized from data prop
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(data.savedImages || []);
  const [nestedExpansions, setNestedExpansions] = useState<NestedExpansionItem[]>(propNestedExpansions || data.nestedExpansions || []);

  // Sync published status, images and expansions
  useEffect(() => {
    if (data) {
      if (data.isPublic !== undefined && data.isPublic !== isPublished) {
        setIsPublished(data.isPublic);
      }
      if (data.savedImages) setGeneratedImages(data.savedImages);
      if (data.nestedExpansions) setNestedExpansions(data.nestedExpansions);
    }
  }, [data.isPublic, data.savedImages, data.nestedExpansions]);

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
        heroImages: heroImages
      };
      const stringified = JSON.stringify(dataToNotify);
      if (stringified !== lastNotifiedRef.current) {
        lastNotifiedRef.current = stringified;
        onUpdate(dataToNotify);
      }
    }
  }, [generatedImages, nestedExpansions, heroImages, onUpdate]);

  useEffect(() => {
    const checkIfPublished = async () => {
      if (!firestore || !data.id || isPublic || !user?.uid) {
        setIsPublished(isPublic);
        return;
      }
      try {
        const publicMapsCollection = collection(firestore, 'publicMindmaps');
        const q = query(publicMapsCollection, where('originalAuthorId', '==', user?.uid), where('topic', '==', data.topic));
        const querySnapshot = await getDocs(q);

        // This is a simplification. A more robust check might involve a unique ID from the original map.
        setIsPublished(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking if map is published:", error);
        setIsPublished(false);
      }
    };

    checkIfPublished();
  }, [data.topic, firestore, isPublic, user?.uid]);

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

  const handleQuizClick = async () => {
    setIsQuizDialogOpen(true);
    setIsQuizLoading(true);

    // Create a plain object for the server action to avoid serialization errors with Firestore timestamps
    const plainMindMapData = toPlainObject(data);

    const { quiz, error } = await generateQuizAction({
      mindMapData: plainMindMapData,
    }, providerOptions);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Quiz Generation Failed',
        description: error,
      });
      setIsQuizDialogOpen(false);
    } else if (quiz) {
      setQuizQuestions(quiz.questions);
    }
    setIsQuizLoading(false);
  };


  const handlePublishMap = async () => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Auth Error', description: 'You must be signed in to publish.' });
      return;
    }

    if (!data.id) {
      toast({
        title: 'Save Required',
        description: 'Please save your mind map manually before publishing so it has a permanent reference id.'
      });
      return;
    }

    setIsPublishing(true);
    console.log(`🚀 Starting publish for topic: "${data.topic}" (ID: ${data.id})`);

    try {
      // 1. PRE-FLIGHT CHECK: Verify private document existence
      // This is the CRITICAL fix for the "Missing or insufficient permissions" error.
      // batch.update() or set(..., {merge:true}) will fail on non-existent docs 
      // if the rules require a 'userId' field for the 'create' path.
      const privateRef = doc(firestore, 'users', user.uid, 'mindmaps', data.id);
      const privateSnap = await getDoc(privateRef);

      if (!privateSnap.exists()) {
        throw new Error('This map has not been saved to the database yet. Please click "Save Map" or wait for autosave, then try publishing again.');
      }

      // 2. Prepare data and batch
      const batch = writeBatch(firestore);
      const summary = `A detailed mind map exploration of ${data.topic}.`;

      // Recursive cleaner to remove 'undefined' fields which Firestore rejects
      const clean = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj.constructor?.name === 'FieldValue' ||
          obj.constructor?.name === 'Timestamp' ||
          obj._methodName === 'serverTimestamp') {
          return obj;
        }
        if (Array.isArray(obj)) return obj.map(item => clean(item));
        const newObj: any = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined) newObj[key] = clean(obj[key]);
        });
        return newObj;
      };

      const { id: _, ...dataToPublishRaw } = data;
      const dataToPublish = clean(dataToPublishRaw);

      // Defensively check for large base64 images in savedImages
      if (dataToPublish.savedImages) {
        dataToPublish.savedImages = dataToPublish.savedImages.map((img: any) => {
          if (img.url && img.url.startsWith('data:image') && img.url.length > 400000) {
            console.warn(`Skipping large public image (${img.name}) to stay under 1MB limit`);
            return { ...img, url: `https://image.pollinations.ai/prompt/${encodeURIComponent(img.name)}?width=400&height=400&nologo=true` };
          }
          return img;
        });
      }

      const publicRef = doc(collection(firestore, 'publicMindmaps'));
      const auditLogRef = doc(collection(firestore, 'activityLogs'));

      console.log('📦 Staging batch: publicRef, privateRef, auditLogRef');

      // 3. Staging changes in the batch
      batch.set(publicRef, {
        ...dataToPublish,
        mindmapId: data.id,
        originalAuthorId: user.uid,
        publishedAt: serverTimestamp(),
        authorName: user.displayName || 'Anonymous',
        likes: 0,
        views: 0,
        summary,
      });

      // Existing document verified above, so update is safe and satisfies isOwner(userId)
      batch.update(privateRef, {
        isPublic: true,
        lastPublishedAt: serverTimestamp()
      });

      batch.set(auditLogRef, {
        type: "PUBLISH",
        mindmapId: data.id,
        publicId: publicRef.id,
        userId: user.uid,
        timestamp: serverTimestamp(),
        client: "web"
      });

      // 4. Atomic Commit
      console.log('⌛ Committing batch...');
      await batch.commit();
      console.log('✅ Batch committed successfully.');

      setIsPublished(true);
      toast({
        title: 'Mind Map Published!',
        description: 'Your mind map is now public and has been recorded in the community gallery.',
      });

    } catch (error: any) {
      console.error("Atomic publish failed:", error);
      toast({
        variant: 'destructive',
        title: 'Publishing Failed',
        description: error.message || 'An error occurred while publishing.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishMap = async () => {
    if (!data.id || !firestore || !user) {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'You must be logged in to manage your public maps.' });
      return;
    }

    setIsPublishing(true); // Re-use isPublishing for loading state

    try {
      const batch = writeBatch(firestore);
      const publicMapsCollection = collection(firestore, 'publicMindmaps');
      // We search by originalAuthorId and topic to find the specific public entry
      const q = query(
        publicMapsCollection,
        where('originalAuthorId', '==', user.uid),
        where('mindmapId', '==', data.id)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Could not find this map in the public gallery. It may already be removed.");
      }

      // 1. Delete public entries in the batch
      querySnapshot.docs.forEach(docSnap => {
        console.log('Auth UID:', user.uid);
        console.log('Deleting path:', `publicMindmaps/${docSnap.id}`);
        batch.delete(doc(firestore, 'publicMindmaps', docSnap.id));
      });

      // 2. Mark private map as unpublished in the batch
      const privateRef = doc(firestore, 'users', user.uid, 'mindmaps', data.id);
      // Include userId in case merge:true triggers a create path (satisfies rules)
      batch.set(privateRef, {
        userId: user.uid,
        isPublic: false,
        unpublishedAt: serverTimestamp()
      }, { merge: true });

      // 3. Record in audit log
      const auditLogRef = doc(collection(firestore, 'activityLogs'));
      batch.set(auditLogRef, {
        type: "UNPUBLISH",
        mindmapId: data.id,
        userId: user.uid,
        timestamp: serverTimestamp(),
        client: "web"
      });

      // 4. Atomic Commit
      await batch.commit();

      setIsPublished(false);
      toast({
        title: 'Mind Map Removed',
        description: 'Your mind map has been successfully removed from the public gallery.',
      });

    } catch (error: any) {
      console.error("Unpublishing error:", error);
      toast({
        variant: 'destructive',
        title: 'Removal Failed',
        description: error.message || 'An error occurred while unpublishing.',
      });
    } finally {
      setIsPublishing(false);
    }
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
      if (isPublic) params.set('public', 'true');
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
        isPublished={isPublished}
        isPublishing={isPublishing}
        onPublish={handlePublishMap}
        onUnpublish={handleUnpublishMap}
        onOpenAiContent={() => setIsAiContentDialogOpen(true)}
        onOpenNestedMaps={() => setIsNestedMapsDialogOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenQuiz={handleQuizClick}
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
      />

      <div className="container max-w-6xl mx-auto px-4 space-y-12 pt-20">
        {viewMode === 'accordion' ? (
          <>
            <HeroSection
              mindMap={data}
              heroImages={heroImages}
              mindMapStack={mindMapStack}
              activeStackIndex={activeStackIndex}
              onStackSelect={onStackSelect}
              onOpenAiContent={() => setIsAiContentDialogOpen(true)}
              onOpenGallery={() => setIsGalleryOpen(true)}
              onOpenQuiz={handleQuizClick}
              onOpenNestedMaps={() => setIsNestedMapsDialogOpen(true)}
              isQuizLoading={isQuizLoading}
              nestedExpansionsCount={nestedExpansions.length}
              status={status}
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

      <QuizDialog
        isOpen={isQuizDialogOpen}
        onClose={() => setIsQuizDialogOpen(false)}
        questions={quizQuestions}
        isLoading={isQuizLoading}
        topic={data.topic}
        onRestart={handleQuizClick}
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
