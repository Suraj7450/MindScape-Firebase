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
      className="group/item relative h-full cursor-pointer rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-primary/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)] transition-all duration-500 overflow-hidden flex flex-col"
      onClick={() => onSubCategoryClick(node)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 p-5 flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover/item:scale-110 group-hover/item:bg-primary group-hover/item:text-white transition-all duration-500">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-zinc-100 leading-snug truncate group-hover/item:text-white transition-colors">
              {node.name}
            </h4>
            <div className="flex items-center mt-1 gap-2">
              <Badge variant="outline" className="text-[10px] h-4 py-0 px-1.5 border-white/10 text-zinc-500 font-medium bg-white/5">Concept</Badge>
              {existingExpansion && <Badge variant="outline" className="text-[10px] h-4 py-0 px-1.5 border-emerald-500/30 text-emerald-400 font-medium bg-emerald-500/5">Expanded</Badge>}
            </div>
          </div>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-6 flex-grow group-hover/item:text-zinc-300 transition-colors">
          {node.description}
        </p>

        <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      existingExpansion ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-primary hover:bg-primary/10'
                    )}
                    onClick={(e) => {
                      if (existingExpansion?.fullData && onOpenMap) {
                        onOpenMap(existingExpansion.fullData, existingExpansion.id);
                      } else {
                        handleExpandClick(e);
                      }
                    }}
                    disabled={isGeneratingMap}
                  >
                    {isGeneratingMap ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="glassmorphism"><p>{existingExpansion ? "Open Detailed Map" : "Generate Sub-Map"}</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-pink-400 hover:bg-pink-400/10 transition-all" onClick={handleImageClick}>
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="glassmorphism"><p>Visual Insight</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all" onClick={handleChatClick}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="glassmorphism"><p>Ask AI Assistant</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSubCategoryClick(node);
            }}
            variant="ghost"
            className="h-8 py-0 px-3 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-full group-hover/item:bg-primary/20 group-hover/item:text-primary transition-all flex items-center gap-1"
          >
            Details <ArrowRight className="w-3 h-3 group-hover/item:translate-x-1 transition-transform" />
          </Button>
        </div>
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
    const combinedDescription = `**${topic1}**:\n${row.topic1Content}\n\n---\n\n**${topic2}**:\n${row.topic2Content}`;
    onSubCategoryClick({
      name: row.name,
      description: combinedDescription,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {comparisonRows?.map((row: any, index: number) => {
        const RowIcon = (LucideIcons as any)[toPascalCase(row.icon)] || FolderOpen;
        const isGenerating = generatingNode === row.nodeId;

        return (
          <Card
            key={index}
            className="relative group overflow-hidden bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
            onClick={() => handleCardClick(row)}
          >
            <CardHeader className="p-6 md:p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-800 border border-white/10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <RowIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-zinc-100 tracking-tight group-hover:translate-x-1 transition-all duration-300">
                    {row.name}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0" onClick={e => e.stopPropagation()}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => onGenerateNewMap(row.name, row.nodeId, contextPath)}>
                          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Explore Concept</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl" onClick={() => onExplainWithExample({ name: row.name, type: 'category' })}>
                          <Lightbulb className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Get Examples</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl" onClick={() => onExplainInChat(`Compare and contrast "${row.name}" for ${topic1} vs ${topic2}.`)}>
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Contrast with AI</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5 hidden md:block" />

                <div className="space-y-4">
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary-foreground text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                    {topic1}
                  </Badge>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                    {row.topic1Content}
                  </p>
                </div>

                <div className="space-y-4">
                  <Badge variant="outline" className="border-accent/20 bg-accent/5 text-accent-foreground text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                    {topic2}
                  </Badge>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                    {row.topic2Content}
                  </p>
                </div>
              </div>
            </CardContent>

            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
    <div className="min-h-screen pb-20 relative bg-background" ref={mindMapRef}>
      {/* Floating Toolbar */}
      <div className="sticky top-6 z-50 px-4 mb-10 w-full flex justify-center pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/40 backdrop-blur-3xl border border-white/10 shadow-3xl pointer-events-auto ring-1 ring-white/5">
          {/* Main Controls Group */}
          <div className="flex items-center gap-1.5 px-2 pr-4 border-r border-white/10">
            <Select value={languageUI} onValueChange={handleLanguageChangeInternal} disabled={isTranslating}>
              <SelectTrigger className="h-9 w-[110px] bg-white/5 border-none text-xs rounded-xl hover:bg-white/10 transition">
                <Languages className="w-3.5 h-3.5 mr-2 text-primary" />
                <SelectValue placeholder="Lang" />
              </SelectTrigger>
              <SelectContent className="glassmorphism max-h-[300px]">
                {languages.map(l => (
                  <SelectItem key={l.code} value={l.code} className="text-xs">{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={personaUI} onValueChange={handlePersonaChangeInternal}>
              <SelectTrigger className="h-9 w-[110px] bg-white/5 border-none text-xs rounded-xl hover:bg-white/10 transition">
                <Zap className="w-3.5 h-3.5 mr-2 text-amber-400" />
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent className="glassmorphism">
                <SelectItem value="Standard" className="text-xs">Standard</SelectItem>
                <SelectItem value="Teacher" className="text-xs">Teacher</SelectItem>
                <SelectItem value="Concise" className="text-xs">Concise</SelectItem>
                <SelectItem value="Creative" className="text-xs">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Group */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isAllExpanded ? collapseAll : expandAll}
                    className="h-9 w-9 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition"
                  >
                    {isAllExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="glassmorphism"><p>{isAllExpanded ? 'Collapse' : 'Expand'} All</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    className="h-9 w-9 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition"
                  >
                    {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="glassmorphism"><p>Share Map</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 bg-white/10 mx-1" />

            <Button
              onClick={onSaveMap}
              disabled={isSaved}
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 gap-2 text-xs font-bold px-4 rounded-xl transition-all",
                isSaved
                  ? "text-emerald-400 bg-emerald-500/10 cursor-default"
                  : "text-zinc-200 hover:text-white hover:bg-white/5"
              )}
            >
              <Save className="w-4 h-4" />
              {isSaved ? 'Saved' : 'Save'}
            </Button>

            {!isPublic && (
              <Button
                onClick={handlePublishMap}
                disabled={isPublishing || isPublished}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 gap-2 text-xs font-bold px-4 rounded-xl transition-all",
                  isPublished
                    ? "text-blue-400 bg-blue-500/10 cursor-default"
                    : "text-zinc-200 hover:text-white hover:bg-white/5"
                )}
              >
                <UploadCloud className="w-4 h-4" />
                {isPublished ? 'Live' : 'Publish'}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={!canRegenerate || isRegenerating}
              className="h-9 gap-2 text-xs font-bold px-4 rounded-xl text-primary hover:bg-primary/10 transition"
            >
              {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Re-Sync
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 space-y-16">
        {/* Main Topic Hero */}
        <div className="relative group perspective-1000">
          <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition duration-1000" />

          <div className="relative rounded-[3rem] border border-white/5 bg-zinc-950/40 backdrop-blur-3xl p-12 md:p-20 text-center overflow-hidden shadow-2xl">
            {/* Background Visualization Layer */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
              {heroImages && (
                <div className="flex w-full h-full opacity-40 mix-blend-screen">
                  <div className="w-1/2 relative">
                    <Image src={heroImages.left} alt="" fill className="object-cover" style={{ maskImage: 'radial-gradient(circle at 0% 50%, black 0%, transparent 80%)' }} />
                  </div>
                  <div className="w-1/2 relative">
                    <Image src={heroImages.right} alt="" fill className="object-cover" style={{ maskImage: 'radial-gradient(circle at 100% 50%, black 0%, transparent 80%)' }} />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" />
            </div>

            <div className="flex flex-col items-center relative z-10 w-full">
              {mindMapStack.length > 1 && onStackSelect && (
                <div className="mb-10">
                  <BreadcrumbNavigation
                    maps={mindMapStack}
                    activeIndex={activeStackIndex}
                    onSelect={onStackSelect}
                    className="bg-zinc-900/50 backdrop-blur-xl rounded-full px-5 py-2 border border-white/5"
                  />
                </div>
              )}

              <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/30 bg-primary/10 text-primary-foreground font-bold tracking-widest text-[10px] uppercase animate-in fade-in zoom-in duration-1000">
                Knowledge Sphere
              </Badge>

              <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-[1.1] drop-shadow-2xl">
                {(mindMap as any).shortTitle || mindMap.topic}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  onClick={() => setIsAiContentDialogOpen(true)}
                  className="rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/20 text-white h-12 px-8 transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-5 h-5 mr-3 text-primary" />
                  AI Insights
                </Button>
                <Button
                  onClick={handleQuizClick}
                  disabled={isQuizLoading}
                  className="rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 text-white h-12 px-8 transition-all hover:scale-105 active:scale-95"
                >
                  {isQuizLoading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <TestTube2 className="w-5 h-5 mr-3 text-blue-400" />}
                  Test Skills
                </Button>
                <Button
                  onClick={() => setIsGalleryOpen(true)}
                  className="rounded-full bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/20 text-white h-12 px-8 transition-all hover:scale-105 active:scale-95"
                >
                  <Images className="w-5 h-5 mr-3 text-pink-400" />
                  Visuals
                </Button>
                {nestedExpansions.length > 0 && (
                  <Button
                    onClick={() => setIsNestedMapsDialogOpen(true)}
                    className="rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/20 text-white h-12 px-8 transition-all hover:scale-105 active:scale-95"
                  >
                    <Network className="w-5 h-5 mr-3 text-emerald-400" />
                    Depth Layer ({nestedExpansions.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Layers (Accordions) */}
        <Accordion
          type="multiple"
          value={openSubTopics}
          onValueChange={setOpenSubTopics}
          className="space-y-10"
        >
          {mindMap.subTopics?.map((subTopic: any, index: number) => {
            const SubTopicIcon = (LucideIcons as any)[toPascalCase(subTopic.icon)] || Library;
            const subTopicId = `topic-${index}`;

            return (
              <AccordionItem
                key={index}
                value={subTopicId}
                className="border-none rounded-[2.5rem] bg-zinc-900/20 backdrop-blur-3xl shadow-3xl ring-1 ring-white/5 overflow-hidden data-[state=open]:ring-primary/30 transition-all duration-700"
              >
                <div
                  className="group/subtopic px-8 py-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => {
                    setOpenSubTopics(prev => prev.includes(subTopicId) ? prev.filter(x => x !== subTopicId) : [...prev, subTopicId]);
                  }}
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] ring-1 ring-white/20 group-hover/subtopic:scale-110 transition-all duration-500">
                      <SubTopicIcon className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-zinc-100 tracking-tight group-hover/subtopic:translate-x-1 transition-transform duration-300">{subTopic.name}</h3>
                      <p className="text-zinc-500 text-sm font-medium">Major Knowledge Node</p>
                    </div>
                    <ChevronDown className={`w-6 h-6 text-zinc-600 transition-transform duration-500 ${openSubTopics.includes(subTopicId) ? 'rotate-180' : ''}`} />
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => onGenerateNewMap(subTopic.name, subTopicId, mindMap.topic)}>
                            <Network className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Exapnd Layer</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl" onClick={() => onExplainInChat(`Explain "${subTopic.name}" in the context of ${mindMap.topic}.`)}>
                            <MessageCircle className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Chat with AI</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <AccordionContent className="px-8 pb-10 pt-4">
                  <div className="space-y-8">
                    {subTopic.categories.map((category: any, catIndex: number) => {
                      const CategoryIcon = (LucideIcons as any)[toPascalCase(category.icon)] || FolderOpen;
                      const catId = `cat-${index}-${catIndex}`;

                      return (
                        <div key={catIndex} className="rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden shadow-inner">
                          <div
                            className="group/cat px-6 py-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer"
                            onClick={() => setOpenCategories(prev => prev.includes(catId) ? prev.filter(x => x !== catId) : [...prev, catId])}
                          >
                            <div className="flex items-center gap-5 flex-1">
                              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-white/10 group-hover/cat:bg-primary group-hover/cat:text-white transition-all duration-500">
                                <CategoryIcon className="h-5 w-5" />
                              </div>
                              <h4 className="text-lg font-bold text-zinc-200 group-hover/cat:translate-x-1 transition-transform duration-300">{category.name}</h4>
                              <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-300 ${openCategories.includes(catId) ? 'rotate-180' : ''}`} />
                            </div>

                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-primary transition-all" onClick={() => onGenerateNewMap(category.name, catId, `${mindMap.topic} > ${subTopic.name}`)}>
                                <Network className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-blue-400 transition-all" onClick={() => onExplainInChat(`Detail the category "${category.name}" within ${subTopic.name}.`)}>
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {openCategories.includes(catId) && (
                            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-4 duration-500">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
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
        mainTopic={mindMap.topic}
        onOpenMap={(mapData, id) => {
          setIsNestedMapsDialogOpen(false);
          if (onOpenNestedMap) onOpenNestedMap(mapData, id);
        }}
      />
    </div>
  );
};
