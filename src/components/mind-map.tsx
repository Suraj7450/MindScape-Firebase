'use client';

import React, { useState, useEffect, memo, useRef } from 'react';

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
  Zap,
  Palette,
  Link2,
  UploadCloud,
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
};
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';
import {
  explainNodeAction,
  generateQuizAction,
  explainWithExampleAction,
  translateMindMapAction,
  expandNodeAction,
  enhanceImagePromptAction,
} from '@/app/actions';
import { BreadcrumbNavigation } from './breadcrumb-navigation';
import { NestedMapsDialog } from './nested-maps-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { QuizDialog } from './quiz-dialog';
import type { QuizQuestion } from '@/ai/flows/generate-quiz';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipPortal,
  TooltipTrigger,
} from './ui/tooltip';
import { formatText } from '@/lib/utils';
import { cn } from '@/lib/utils';
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

import { addDoc, collection, getDocs, query, where, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { trackNestedExpansion, trackImageGenerated, trackMapCreated } from '@/lib/activity-tracker';
import { useStudyTimeTracker } from '@/hooks/use-study-time-tracker';


/**
 * Defines the possible levels of detail for an explanation.
 */
export type ExplanationMode = 'Beginner' | 'Intermediate' | 'Expert';

/**
 * Represents a generated image with its associated metadata.
 */
export interface GeneratedImage {
  id: string;
  url: string;
  name: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
}

export interface NestedExpansionItem {
  id: string;
  parentName: string;
  topic: string;
  icon: string;
  subCategories: Array<{ name: string; description: string; icon: string; tags: string[] }>;
  createdAt: number;
  depth: number;
  path?: string;
  status?: 'generating' | 'completed' | 'failed';
  fullData?: any; // The full mind map data for opening this nested map
}

type MindMapData = GenerateMindMapOutput & {
  thumbnailUrl?: string;
  id?: string;
  nestedExpansions?: NestedExpansionItem[];
  savedImages?: GeneratedImage[];
};


/**
 * Props for the main MindMap component.
 */
interface MindMapProps {
  data: MindMapData;
  isSaved: boolean;
  isPublic: boolean;
  onSaveMap: () => void;
  onExplainInChat: (message: string) => void;
  onGenerateNewMap: (topic: string, nodeId: string, contextPath: string) => void;
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
  mindMapStack?: GenerateMindMapOutput[];
  activeStackIndex?: number;
  onStackSelect?: (index: number) => void;
  onUpdate?: (updatedData: Partial<MindMapData>) => void;
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
 * A dialog component that displays a detailed, AI-generated explanation for a mind map node.
 */
function ExplanationDialog({
  isOpen,
  onClose,
  title,
  content,
  isLoading,
  onExplainInChat,
  explanationMode,
  onExplanationModeChange,
}: ExplanationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl glassmorphism">
        <DialogHeader className="flex-row justify-between items-center">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto mr-4">
                {explanationMode}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => onExplanationModeChange('Beginner')}
              >
                Beginner
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onExplanationModeChange('Intermediate')}
              >
                Intermediate
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onExplanationModeChange('Expert')}
              >
                Expert
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : Array.isArray(content) && content.length > 0 ? (
            <div className="space-y-3">
              {content.map((point, index) => (
                <Card key={index} className="bg-secondary/30 group relative">
                  <CardContent className="p-4 pr-10 flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div
                      className="prose prose-sm max-w-none flex-1"
                      dangerouslySetInnerHTML={{ __html: formatText(point) }}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExplainInChat(
                                `Can you elaborate on this point: "${point}" in the context of ${title}?`
                              );
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipPortal>
                          <TooltipContent side="top" align="center">
                            <p>Explain in Chat</p>
                          </TooltipContent>
                        </TooltipPortal>
                      </Tooltip>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No explanation available yet.
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

type SubCategoryInfo = {
  name: string;
  description: string;
};

type ExplainableNode = {
  name: string;
  type: 'subTopic' | 'category';
};



const LeafNodeCard = memo(function LeafNodeCard({
  node,
  onSubCategoryClick,
  onGenerateImage,
  onExplainInChat,
  onGenerateNewMap,
  isGeneratingMap,
  mainTopic,
  nodeId,
  contextPath,
  existingExpansion,
  onOpenMap,
}: {
  node: any;
  onSubCategoryClick: (subCategory: any) => void;
  onGenerateImage: (subCategory: any) => void;
  onExplainInChat: (message: string) => void;
  onGenerateNewMap: (topic: string, nodeId: string, contextPath: string) => void;
  isGeneratingMap: boolean;
  mainTopic: string;
  nodeId: string;
  contextPath: string;
  existingExpansion?: any;
  onOpenMap?: (mapData: any, id: string) => void;
}) {
  const Icon = (LucideIcons as any)[toPascalCase(node.icon)] || FileText;

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateNewMap(node.name, nodeId, contextPath);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExplainInChat(`Explain "${node.name}" in the context of ${mainTopic}.`);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateImage(node);
  };

  return (
    <Card
      className="group/item relative h-full cursor-pointer rounded-2xl bg-[#1C1C1E]/50 p-5 border border-white/5 transition-all hover:bg-[#1C1C1E]/80 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col"
      onClick={() => onSubCategoryClick(node)}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-xl bg-purple-600 text-white ring-1 ring-white/10 group-hover/item:bg-purple-500 transition-all duration-300">
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-base font-bold text-zinc-100 leading-tight flex-1 pt-1 group-hover/item:translate-x-1 transition-transform duration-300">
          {node.name}
        </h4>
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed min-h-[48px] flex-grow">
        {node.description}
      </p>

      <div className="mt-4 pt-4 flex justify-between items-center border-t border-white/5">
        <div
          className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${existingExpansion ? 'text-emerald-400' : 'text-zinc-500 hover:text-purple-400'}`}
                onClick={(e) => {
                  if (existingExpansion?.fullData && onOpenMap) {
                    onOpenMap(existingExpansion.fullData, existingExpansion.id);
                  } else {
                    handleExpandClick(e);
                  }
                }}
                disabled={isGeneratingMap}
              >
                {isGeneratingMap ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{existingExpansion ? "Open Map" : "Expand"}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-purple-400" onClick={handleImageClick}>
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Visual</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-purple-400" onClick={handleChatClick}>
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Explain</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-500 hover:text-purple-400"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${node.name}\n${node.description}`);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Copy</p></TooltipContent>
          </Tooltip>
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSubCategoryClick(node);
          }}
          className="h-8 py-1.5 px-4 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all shadow-sm flex items-center gap-1.5 border-none"
        >
          Read More <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
});


// New Component for Side-by-Side Comparison
const ComparisonView = ({
  categories,
  onSubCategoryClick,
  onGenerateNewMap,
  generatingNode,
  onExplainWithExample,
  onExplainInChat,
  mainTopic,
  contextPath,
}: {
  categories: any[];
  onSubCategoryClick: (subCategory: SubCategoryInfo) => void;
  onGenerateNewMap: (topic: string, nodeId: string, contextPath: string) => void;
  generatingNode: string | null;
  onExplainWithExample: (node: ExplainableNode) => void;
  onExplainInChat: (message: string) => void;
  mainTopic: string;
  contextPath: string;
}) => {
  if (!categories || categories.length !== 2) {
    return null; // or some fallback UI
  }

  const topic1 = categories[0]?.name;
  const topic2 = categories[1]?.name;

  const comparisonRows = categories[0]?.subCategories.map(
    (sc: any, index: number) => ({
      name: sc.name,
      icon: sc.icon,
      topic1Content: sc.description,
      topic2Content: categories[1]?.subCategories[index]?.description,
      nodeId: `diff-${index}`
    })
  );

  const handleCardClick = (row: (typeof comparisonRows)[0]) => {
    const combinedDescription = `For ${topic1}: ${row.topic1Content}\n\nFor ${topic2}: ${row.topic2Content}`;
    onSubCategoryClick({
      name: row.name,
      description: combinedDescription,
    });
  };

  return (
    <div className="space-y-4">
      {comparisonRows?.map((row: any, index: number) => {
        const RowIcon =
          (LucideIcons as any)[toPascalCase(row.icon)] || FolderOpen;
        const isGenerating = generatingNode === row.nodeId;

        const handleGenerateClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onGenerateNewMap(row.name, row.nodeId, contextPath);
        };

        const handleExampleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onExplainWithExample({ name: row.name, type: 'category' });
        };

        const handleChatClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onExplainInChat(
            `Compare and contrast "${row.name}" for ${topic1} vs ${topic2}.`
          );
        };

        return (
          <Card
            key={index}
            className="bg-card/50 overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] hover:-translate-y-1 cursor-pointer group"
            onClick={() => handleCardClick(row)}
          >
            <CardHeader className="p-4 pt-5 border-b border-white/10">
              <div className="flex items-center justify-start gap-3">
                <div className="p-2 rounded-full bg-accent/10 text-accent ring-1 ring-accent/30 shadow-glow">
                  <RowIcon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg flex-1">{row.name}</CardTitle>
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <GitBranch className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent>
                        <p>Expand further</p>
                      </TooltipContent>
                    </TooltipPortal>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleExampleClick}
                      >
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent>
                        <p>Give me examples</p>
                      </TooltipContent>
                    </TooltipPortal>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleChatClick}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent>
                        <p>Explain in Chat</p>
                      </TooltipContent>
                    </TooltipPortal>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-4 border-b md:border-r md:border-b-0 border-white/10">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full">
                      {topic1}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {row.topic1Content}
                  </p>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 bg-pink-900/50 px-2 py-0.5 rounded-full">
                      {topic2}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {row.topic2Content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
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
}: MindMapProps) => {
  const mindMapRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, firestore } = useFirebase();

  // Track study time
  useStudyTimeTracker(firestore, user?.uid, true);

  const [providerOptions, setProviderOptions] = useState<{ apiKey?: string; provider?: 'pollinations' | 'gemini' | 'bytez'; strict?: boolean } | undefined>(undefined);
  const [imageProviderOptions, setImageProviderOptions] = useState<{ apiKey?: string; provider?: 'pollinations' | 'bytez' } | undefined>(undefined);

  useEffect(() => {
    const fetchProvider = async () => {
      if (!user || !firestore) return;
      try {
        const snap = await getDoc(doc(firestore, 'users', user.uid));
        if (snap.exists()) {
          const p = snap.data().apiSettings?.provider;
          const ip = snap.data().apiSettings?.imageProvider || 'pollinations';

          if (p === 'pollinations') setProviderOptions({ provider: 'pollinations', strict: true });
          else if (p === 'bytez') setProviderOptions({ provider: 'bytez', apiKey: snap.data().apiSettings?.apiKey, strict: true });
          else setProviderOptions({ provider: 'gemini', strict: true });

          setImageProviderOptions({ provider: ip, apiKey: snap.data().apiSettings?.apiKey });
        }
      } catch (e) { console.error(e); }
    };
    fetchProvider();
  }, [user, firestore]);






  const [mindMap, setMindMap] = useState(data);
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

  const [heroImages, setHeroImages] = useState<{ left: string; right: string } | null>(data.heroImages || null);
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
    const fetchEnhancedHeroImages = async () => {
      // If we already have heroImages (from data or generated), don't refetch
      if (!mounted || !mindMap?.topic || heroImages) return;

      try {
        const result = await enhanceImagePromptAction({
          prompt: `A cinematic, high-quality artistic conceptual representation of the topic: ${mindMap.topic}. futuristic, abstract, high resolution, soft lighting.`
        }, providerOptions);

        // Robust extraction of the enhanced prompt
        const enhancedPart = result.enhancedPrompt?.enhancedPrompt || mindMap.topic;
        const seedLeft = Math.floor(Math.random() * 10000);
        const seedRight = Math.floor(Math.random() * 10000);

        setHeroImages({
          left: `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPart + ", left artistic composition")}?width=1000&height=600&nologo=true&seed=${seedLeft}`,
          right: `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPart + ", right artistic composition")}?width=1000&height=600&nologo=true&seed=${seedRight}`
        });
      } catch (e) {
        console.error("Hero image enhancement failed:", e);
        // Fallback to basic topic
        setHeroImages({
          left: `https://image.pollinations.ai/prompt/${encodeURIComponent(mindMap.topic + ", cinematic background")}?width=1000&height=600&nologo=true&seed=42`,
          right: `https://image.pollinations.ai/prompt/${encodeURIComponent(mindMap.topic + ", cinematic background")}?width=1000&height=600&nologo=true&seed=1337`
        });
      }
    };
    // Stagger the fetch slightly to avoid hitting concurrency limits with the main mind map generation
    const timer = setTimeout(() => {
      fetchEnhancedHeroImages();
    }, 1500); // 1.5s delay

    return () => clearTimeout(timer);
  }, [mindMap.topic, mounted, heroImages, providerOptions]);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Nested expansion state - load from saved data if available
  const [isNestedMapsDialogOpen, setIsNestedMapsDialogOpen] = useState(false);
  const [nestedExpansions, setNestedExpansions] = useState<NestedExpansionItem[]>(
    propNestedExpansions || data.nestedExpansions || []
  );
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);


  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(mindMap)) {
      setMindMap(data);
    }

    // Also update nestedExpansions and generatedImages from data
    if (propNestedExpansions) {
      if (JSON.stringify(propNestedExpansions) !== JSON.stringify(nestedExpansions)) {
        setNestedExpansions(propNestedExpansions);
      }
    } else if (data.nestedExpansions) {
      setNestedExpansions(prev => {
        // Preserve local generating items that aren't yet in the server data
        const localGenerating = prev.filter(item => item.status === 'generating');
        // Ensure data.nestedExpansions is treated as an array
        const serverExpansions = data.nestedExpansions || [];
        const serverIds = new Set(serverExpansions.map((e: any) => e.id));
        const uniqueGenerating = localGenerating.filter(item => !serverIds.has(item.id));
        const nextExpansions = [...serverExpansions, ...uniqueGenerating];

        if (JSON.stringify(nextExpansions) === JSON.stringify(prev)) return prev;
        return nextExpansions;
      });
    }

    if (data.savedImages && JSON.stringify(data.savedImages) !== JSON.stringify(generatedImages)) {
      setGeneratedImages(data.savedImages);
    }

    if (data.heroImages && JSON.stringify(data.heroImages) !== JSON.stringify(heroImages)) {
      setHeroImages(data.heroImages);
    }
  }, [data, propNestedExpansions]);

  // Notify parent of local state changes - wrapped in a ref check to prevent loops
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
      if (!firestore || !mindMap.id || isPublic || !user?.uid) {
        setIsPublished(isPublic);
        return;
      }
      try {
        const publicMapsCollection = collection(firestore, 'publicMindmaps');
        const q = query(publicMapsCollection, where('originalAuthorId', '==', user?.uid), where('topic', '==', mindMap.topic));
        const querySnapshot = await getDocs(q);

        // This is a simplification. A more robust check might involve a unique ID from the original map.
        setIsPublished(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking if map is published:", error);
        setIsPublished(false);
      }
    };

    checkIfPublished();
  }, [mindMap, firestore, isPublic, user?.uid]);

  // Auto-save nestedExpansions to Firestore when they change
  useEffect(() => {
    const saveNestedExpansions = async () => {
      if (!firestore || !user || !mindMap.id || isPublic) return;

      try {
        const mapDocRef = doc(firestore, 'users', user.uid, 'mindmaps', mindMap.id);

        // Filter out generating items - they are ephemeral and shouldn't be persisted until complete
        const expansionsToSave = nestedExpansions.filter(e => e.status !== 'generating');

        await updateDoc(mapDocRef, {
          nestedExpansions: expansionsToSave,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error saving nested expansions:', error);
      }
    };

    // Only save if there's an actual map ID (saved map)
    if (mindMap.id && nestedExpansions.length >= 0) {
      saveNestedExpansions();
    }
  }, [nestedExpansions, firestore, user, mindMap.id, isPublic]);

  // Auto-save generatedImages to Firestore when they change
  useEffect(() => {
    const saveGeneratedImages = async () => {
      if (!firestore || !user || !mindMap.id || isPublic) return;

      // Only save completed images
      const completedImages = generatedImages.filter(img => img.status === 'completed');
      if (completedImages.length === 0) return;

      try {
        const mapDocRef = doc(firestore, 'users', user.uid, 'mindmaps', mindMap.id);
        await updateDoc(mapDocRef, {
          savedImages: completedImages,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error saving generated images:', error);
      }
    };

    if (mindMap.id) {
      saveGeneratedImages();
    }
  }, [generatedImages, firestore, user, mindMap.id, isPublic]);


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
      const plainMindMapData = toPlainObject(mindMap);

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
        setMindMap(translation);
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
      mainTopic: mindMap.topic,
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
      mainTopic: mindMap.topic,
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
      const promptToEnhance = `${subCategory.name} in the context of "${mindMap.topic}": ${subCategory.description}`;

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

      const data = await response.json();
      if (!data.images?.[0]) throw new Error('No image returned from server.');

      const imageUrl = data.images[0];

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
    const plainMindMapData = toPlainObject(mindMap);

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
    if (!mindMap.id) return;
    setIsPublishing(true);

    try {
      // 0. Ensure we have an ID before publishing
      if (!mindMap.id) {
        toast({ title: "Saving first...", description: "We need to save your map before it can be published." });
        onSaveMap();
        // Wait a bit for Firestore ID to propagate? 
        // Actually handleSaveMap in page.tsx is async but we don't await onSaveMap() here because it's a prop.
        // It's better if we tell the user to try again or we wait.
        // For simplicity, let's just return and let the auto-save (or manual save) finish.
        // But better: tell them it's saving.
        return;
      }

      // 1. Use a default description
      const summary = `A detailed mind map exploration of ${mindMap.topic}.`;

      // 2. Publish to Firestore
      const publicMapData = {
        ...mindMap,
        originalAuthorId: user?.uid,
        publishedAt: serverTimestamp(),
        authorName: user?.displayName || 'Anonymous',
        likes: 0,
        views: 0,
        summary: summary, // Add summary if available
      };

      await addDoc(collection(firestore!, 'publicMindmaps'), publicMapData);

      setIsPublished(true);
      toast({
        title: 'Mind Map Published!',
        description: summary ? 'Your mind map is now public and has been summarized.' : 'Your mind map is public (summary generation failed).',
      });

      // Track activity
      if (firestore && user) {
        // We'd track this if we had a specific function for it, or just generic 'created_map'
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Publishing Failed',
        description: error.message,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDuplicate = async () => {
    if (!mindMap || isDuplicating) return;
    setIsDuplicating(true);

    try {
      if (!user) {
        throw new Error("You must be logged in to duplicate a mind map.");
      }

      // Create a new map object
      const newMapData = {
        ...mindMap,
        id: undefined, // Let Firestore generate a new ID
        userId: user.uid,
        createdAt: Date.now(),
        nestedExpansions: [], // Start fresh or copy? Let's copy but reset status
        savedImages: [], // Copy images? Maybe not deep copy to save space/bandwidth
      };

      // We essentially just "create new map" flow
      // But simpler: just tell parent we want to save this as a new map?
      // Actually, since this is "Duplicate", we should probably just save it directly to the user's collection

      const docRef = await addDoc(collection(firestore!, 'users', user.uid, 'mindmaps'), {
        ...newMapData,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Mind Map Duplicated",
        description: "A copy has been saved to your dashboard.",
      });

      // Redirect to the new map?
      router.push(`/mindmap?id=${docRef.id}`);

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
    // Aggressively hunt for an ID: 1. data.id, 2. mindMap.id, 3. URL search params
    const sParams = new URLSearchParams(window.location.search);
    const effectiveId = data.id || mindMap.id || sParams.get('mapId');

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
    const allTopicIds = mindMap.subTopics.map((_, i) => `topic-${i}`);
    const allCategoryIds = mindMap.subTopics.flatMap((t, i) =>
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
      {/* Header / Toolbar */}
      <div className="sticky top-[58px] z-30 w-full mb-8 pointer-events-none">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 flex flex-col md:flex-row justify-between items-center gap-4 pointer-events-auto ring-1 ring-white/5">
            {/* Left Side: Navigation & Utilities */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Language Selector */}
              <div className="flex items-center bg-zinc-900/50 rounded-xl px-2 py-1 border border-white/5 ring-1 ring-white/5">
                <Select value={languageUI} onValueChange={handleLanguageChangeInternal} disabled={isTranslating}>
                  <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0 w-[120px] text-xs font-medium">
                    <LucideIcons.Languages className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="text-xs">
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isTranslating && <Loader2 className="w-3 h-3 animate-spin ml-2 text-purple-400" />}
              </div>

              {/* AI Persona Selector */}
              <div className="flex items-center bg-zinc-900/50 rounded-xl px-2 py-1 border border-white/5 ring-1 ring-white/5">
                <Select value={personaUI} onValueChange={handlePersonaChangeInternal} disabled={isRegenerating}>
                  <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0 w-[110px] text-xs font-medium">
                    {aiPersona === 'Teacher' && <LucideIcons.GraduationCap className="w-3.5 h-3.5 mr-2 text-yellow-500" />}
                    {aiPersona === 'Concise' && <LucideIcons.Zap className="w-3.5 h-3.5 mr-2 text-orange-500" />}
                    {aiPersona === 'Creative' && <LucideIcons.Palette className="w-3.5 h-3.5 mr-2 text-pink-500" />}
                    {(aiPersona === 'Standard' || !aiPersona) && <LucideIcons.Sparkles className="w-3.5 h-3.5 mr-2 text-blue-500" />}
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                    <SelectItem value="Standard" className="text-xs focus:bg-white/5 rounded-lg my-0.5">
                      <div className="flex items-center gap-2">
                        <LucideIcons.Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        <span>Standard</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Teacher" className="text-xs focus:bg-white/5 rounded-lg my-0.5">
                      <div className="flex items-center gap-2">
                        <LucideIcons.GraduationCap className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Teacher</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Concise" className="text-xs focus:bg-white/5 rounded-lg my-0.5">
                      <div className="flex items-center gap-2">
                        <LucideIcons.Zap className="w-3.5 h-3.5 text-orange-500" />
                        <span>Concise</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Creative" className="text-xs focus:bg-white/5 rounded-lg my-0.5">
                      <div className="flex items-center gap-2">
                        <LucideIcons.Palette className="w-3.5 h-3.5 text-pink-500" />
                        <span>Creative</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-6 bg-white/10 mx-1 hidden md:block" />

              {/* Expand/Collapse with Text */}
              <Button
                variant="ghost"
                size="sm"
                onClick={isAllExpanded ? collapseAll : expandAll}
                className="h-9 px-3 gap-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all rounded-xl"
              >
                {isAllExpanded ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span>Collapse All</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span>Expand All</span>
                  </>
                )}
              </Button>
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {/* Share/Link Icon */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      className="h-9 w-9 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all ring-1 ring-white/5"
                    >
                      {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Link2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy Map Link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-6 bg-white/10 mx-1" />

              {/* Save Button (Always visible, status-aware) */}
              <Button
                onClick={onSaveMap}
                disabled={isSaved}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 gap-2 text-xs font-semibold px-4 rounded-xl transition-all ring-1 focus:ring-purple-500/50",
                  isSaved
                    ? "text-emerald-400 ring-emerald-500/20 bg-emerald-500/5 cursor-default"
                    : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 ring-purple-500/20"
                )}
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isSaved ? 'Saved' : 'Save Map'}
              </Button>

              {/* Publish Button */}
              {!isPublic && (
                <Button
                  onClick={handlePublishMap}
                  disabled={isPublishing || isPublished}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 gap-2 text-xs font-semibold px-4 rounded-xl transition-all ring-1 focus:ring-purple-500/50",
                    isPublished
                      ? "text-emerald-400 ring-emerald-500/20 bg-emerald-500/5 cursor-default"
                      : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 ring-blue-500/20"
                  )}
                >
                  {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : isPublished ? <Check className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                  {isPublished ? 'Published' : 'Publish'}
                </Button>
              )}

              {/* Regenerate Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                disabled={!canRegenerate || isRegenerating}
                className={cn(
                  "h-9 gap-2 text-xs font-semibold px-4 rounded-xl transition-all ring-1 ring-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10",
                  (!canRegenerate || isRegenerating) && "opacity-50"
                )}
              >
                {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Topic Hero */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl p-8 md:p-12 text-center overflow-hidden">
            {/* Topic-related background images (Seamless Faded Edges) */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
              {heroImages && (
                <>
                  {/* Left Image */}
                  <div className="absolute inset-y-0 left-0 w-1/2 opacity-50">
                    <img
                      src={heroImages.left}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ maskImage: 'linear-gradient(to right, black 20%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to right, black 20%, transparent 80%)' }}
                    />
                  </div>
                  {/* Right Image */}
                  <div className="absolute inset-y-0 right-0 w-1/2 opacity-50">
                    <img
                      src={heroImages.right}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ maskImage: 'linear-gradient(to left, black 20%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 80%)' }}
                    />
                  </div>
                </>
              )}
              {/* Global Overlays for seamless blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950"></div>
            </div>



            <div className="absolute inset-x-0 top-6 flex justify-center z-20">
              {mindMapStack.length > 1 && onStackSelect && (
                <BreadcrumbNavigation
                  maps={mindMapStack}
                  activeIndex={activeStackIndex}
                  onSelect={onStackSelect}
                  className="scale-90 opacity-80 hover:opacity-100 hover:scale-100 transition-all duration-500"
                />
              )}
            </div>

            <h1 className="text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 drop-shadow-sm">
              {(mindMap as any).shortTitle || mindMap.topic}
            </h1>


            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all"
                onClick={() => setIsAiContentDialogOpen(true)}
              >
                <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                AI Insights
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all"
                onClick={handleQuizClick}
                disabled={isQuizLoading}
              >
                {isQuizLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube2 className="w-4 h-4 mr-2 text-blue-400" />}
                Take Quiz
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-pink-500/50 transition-all"
                onClick={() => setIsGalleryOpen(true)}
              >
                <Images className="w-4 h-4 mr-2 text-pink-400" />
                Image Gallery
                {generatedImages.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                    {generatedImages.length}
                  </Badge>
                )}
              </Button>
              {nestedExpansions.length > 0 && (
                <Button
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all"
                  onClick={() => setIsNestedMapsDialogOpen(true)}
                >
                  <Network className="w-4 h-4 mr-2 text-emerald-400" />
                  Related Maps
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                    {nestedExpansions.length}
                  </Badge>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* SubTopics Accordion */}
        <Accordion
          type="multiple"
          value={openSubTopics}
          onValueChange={setOpenSubTopics}
          className="space-y-6"
        >
          {mindMap.subTopics?.map((subTopic: any, index: number) => {
            const SubTopicIcon = (LucideIcons as any)[toPascalCase(subTopic.icon)] || Library;
            const subTopicId = `topic-${index}`;

            const handleToolAction = (e: React.MouseEvent, type: string) => {
              e.stopPropagation();
              if (type === 'expand') onGenerateNewMap(subTopic.name, subTopicId, mindMap.topic);
              if (type === 'chat') onExplainInChat(`Explain "${subTopic.name}" in the context of ${mindMap.topic}.`);
            };

            return (
              <AccordionItem
                key={index}
                value={subTopicId}
                className="border-none rounded-2xl bg-[#09090B]/40 backdrop-blur-md shadow-2xl ring-1 ring-white/5 overflow-hidden data-[state=open]:ring-purple-500/20 transition-all duration-500"
              >
                <div
                  className="group/subtopic px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => {
                    setOpenSubTopics(prev => prev.includes(subTopicId) ? prev.filter(x => x !== subTopicId) : [...prev, subTopicId]);
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-900/20 ring-1 ring-white/10 group-hover/subtopic:bg-purple-500 transition-all duration-300">
                      <SubTopicIcon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100 tracking-tight group-hover/subtopic:translate-x-1 transition-transform duration-300">{subTopic.name}</h3>
                    <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-500 ${openSubTopics.includes(subTopicId) ? 'rotate-180' : ''}`} />
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100" onClick={e => handleToolAction(e, 'expand')}>
                      <Network className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100" onClick={e => handleToolAction(e, 'chat')}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="px-6 pb-6 pt-2">
                  <Accordion
                    type="multiple"
                    value={openCategories}
                    onValueChange={setOpenCategories}
                    className="space-y-4"
                  >
                    {subTopic.categories.map((category: any, catIndex: number) => {
                      const CategoryIcon = (LucideIcons as any)[toPascalCase(category.icon)] || FolderOpen;
                      const catId = `cat-${index}-${catIndex}`;

                      const handleCatTool = (e: React.MouseEvent, type: string) => {
                        e.stopPropagation();
                        if (type === 'expand') onGenerateNewMap(category.name, catId, `${mindMap.topic} > ${subTopic.name}`);
                        if (type === 'chat') onExplainInChat(`Detail the category "${category.name}" within ${subTopic.name}.`);
                      };

                      return (
                        <div key={catIndex} className="rounded-xl bg-[#1C1C1E]/40 border border-white/5 overflow-hidden">
                          <div
                            className="group/cat px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => setOpenCategories(prev => prev.includes(catId) ? prev.filter(x => x !== catId) : [...prev, catId])}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 rounded-xl bg-purple-600 text-white ring-1 ring-white/10 group-hover/cat:bg-purple-500 transition-all duration-300">
                                <CategoryIcon className="h-4 w-4" />
                              </div>
                              <h4 className="text-lg font-bold text-zinc-200 group-hover/cat:translate-x-1 transition-transform duration-300">{category.name}</h4>
                              <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-300 ${openCategories.includes(catId) ? 'rotate-180' : ''}`} />
                            </div>

                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-zinc-200" onClick={e => handleCatTool(e, 'expand')}>
                                <Network className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-zinc-200" onClick={e => handleCatTool(e, 'chat')}>
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {openCategories.includes(catId) && (
                            <div className="px-5 pb-5 pt-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {category.subCategories.map((sub: any, subIndex: number) => (
                                  <LeafNodeCard
                                    key={subIndex}
                                    node={sub}
                                    onSubCategoryClick={handleSubCategoryClick}
                                    onGenerateImage={handleGenerateImageClick}
                                    onExplainInChat={onExplainInChat}
                                    onGenerateNewMap={onGenerateNewMap}
                                    isGeneratingMap={generatingNode === `node-${index}-${catIndex}-${subIndex}`}
                                    mainTopic={mindMap.topic}
                                    nodeId={`node-${index}-${catIndex}-${subIndex}`}
                                    contextPath={`${mindMap.topic} > ${subTopic.name} > ${category.name} > ${sub.name}`}
                                    existingExpansion={nestedExpansions.find(e => e.topic === sub.name)}
                                    onOpenMap={onOpenNestedMap}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Comparison Section (Example of using ComparisonView if data allows - Logic to detect comparable items would go here) */}
        {/* For now, we don't auto-detect comparisons, but we could add a manual "Compare" mode in future */}

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
      />

      <QuizDialog
        isOpen={isQuizDialogOpen}
        onClose={() => setIsQuizDialogOpen(false)}
        questions={quizQuestions}
        isLoading={isQuizLoading}
        topic={mindMap.topic}
        onRestart={handleQuizClick}
      />

      <AiContentDialog
        isOpen={isAiContentDialogOpen}
        onClose={() => setIsAiContentDialogOpen(false)}
        mindMap={mindMap}
      />

      <ExampleDialog
        isOpen={isExampleDialogOpen}
        onClose={() => setIsExampleDialogOpen(false)}
        title={activeExplainableNode?.name || 'Example'}
        example={exampleContent}
        isLoading={isExampleLoading}
        explanationMode={explanationMode}
        onExplanationModeChange={setExplanationMode}
        onRegenerate={() => {
          if (activeExplainableNode) {
            setIsExampleLoading(true);
            setExampleContent('');
            // Trigger re-fetch via useEffect
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
          // Handle deletion of nested map
          toast({ description: "Nested map deleted" });
        }}
        onRegenerate={(parentName, id) => {
          // Handle regeneration
          toast({ description: `Regenerating ${parentName}...` });
        }}
        onExpandFurther={(nodeName, nodeDescription, parentId) => {
          // Handle further expansion
        }}
        expandingId={null}
        onExplainInChat={onExplainInChat}
        mainTopic={mindMap.topic}
        onOpenMap={(mapData, id) => {
          setIsNestedMapsDialogOpen(false);
          if (onOpenNestedMap) onOpenNestedMap(mapData, id);
        }}
      />

    </div >
  );
};
