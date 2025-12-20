
'use client';

import React, { useState, useEffect, memo } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  Pocket,
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
} from 'lucide-react';
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';
import {
  explainNodeAction,
  generateQuizAction,
  explainWithExampleAction,
  translateMindMapAction,
  summarizeMindMapAction,
  expandNodeAction,
} from '@/app/actions';
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
  onRegenerate: () => void;
  isRegenerating: boolean;
  canRegenerate: boolean;
  nestedExpansions?: NestedExpansionItem[];
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
          ) : (
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

const toPascalCase = (str: string) => {
  if (!str) return 'FileText';
  return str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, '').toUpperCase());
};

const SubCategoryCard = memo(function SubCategoryCard({
  subCategory,
  onExpandNode,
  isExpanding,
  onGenerateNewMap,
  isGeneratingMap,
  onExplainWithExample,
  onExplainInChat,
  onSubCategoryClick,
  onGenerateImage,
  mainTopic,
  nodeId,
  contextPath,
  existingExpansion,
  onOpenMap,
}: {
  subCategory: any;
  onExpandNode: (nodeName: string, nodeDescription: string, nodeId: string) => void;
  isExpanding: boolean;
  onExplainWithExample: (node: ExplainableNode) => void;
  onExplainInChat: (message: string) => void;
  onSubCategoryClick: (subCategory: SubCategoryInfo) => void;
  onGenerateImage: (subCategory: SubCategoryInfo) => void;
  onGenerateNewMap: (topic: string, nodeId: string, contextPath: string) => void;
  isGeneratingMap: boolean;
  mainTopic: string;
  nodeId: string;
  contextPath: string; // e.g., "Main Topic > SubTopic > Category"
  existingExpansion?: any;
  onOpenMap?: (mapData: any, id: string) => void;
}) {
  const SubCategoryIcon =
    (LucideIcons as any)[toPascalCase(subCategory.icon)] || FileText;

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateNewMap(subCategory.name, nodeId, contextPath);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExplainInChat(
      `Explain "${subCategory.name}" in the context of ${mainTopic}.`
    );
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateImage(subCategory);
  };

  return (
    <Card
      className="group/item relative h-full cursor-pointer rounded-2xl bg-zinc-900/50 p-5 ring-1 ring-purple-400/20 transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] hover:-translate-y-1 flex flex-col"
      onClick={() => onSubCategoryClick(subCategory)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-0">
        <div className="p-2 rounded-md bg-accent/20 text-accent">
          <SubCategoryIcon className="h-5 w-5" />
        </div>
        <CardTitle className="text-base font-semibold leading-none flex-1 pt-1">
          {subCategory.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-3 flex-1 flex flex-col">
        <p className="text-sm text-zinc-400 leading-relaxed min-h-[40px] flex-grow">
          {subCategory.description}
        </p>



        <div className="mt-auto pt-4 flex justify-between items-center border-t border-white/5">
          <div
            className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${existingExpansion && existingExpansion.status === 'completed'
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20'
                    : 'text-muted-foreground hover:text-purple-400'
                    }`}
                  onClick={(e) => {
                    if (existingExpansion && existingExpansion.status === 'completed' && existingExpansion.fullData) {
                      e.stopPropagation();
                      // Open existing map
                      if (onOpenMap) onOpenMap(existingExpansion.fullData, existingExpansion.id);
                    } else {
                      // Generate new map
                      handleExpandClick(e);
                    }
                  }}
                  disabled={isGeneratingMap || isExpanding}
                >
                  {isGeneratingMap || isExpanding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="relative">
                      <Network className="h-4 w-4" />
                      {existingExpansion && existingExpansion.status === 'completed' && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent className="bg-zinc-950 border-zinc-800 text-zinc-100 font-medium text-xs py-1 px-3">
                  <p>{existingExpansion && existingExpansion.status === 'completed' ? "Open Nested Map" : "Generate Sub-Map"}</p>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>



            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-purple-400"
                  onClick={handleImageClick}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent className="bg-zinc-950 border-zinc-800 text-zinc-100 font-medium text-xs py-1 px-3">
                  <p>Generate Image</p>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-purple-400"
                  onClick={handleChatClick}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent className="bg-zinc-950 border-zinc-800 text-zinc-100 font-medium text-xs py-1 px-3">
                  <p>Explain in Chat</p>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-purple-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(`${subCategory.name}\n${subCategory.description}`);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent className="bg-zinc-950 border-zinc-800 text-zinc-100 font-medium text-xs py-1 px-3">
                  <p>Copy Text</p>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSubCategoryClick(subCategory);
            }}
            variant="ghost"
            className="h-auto py-1 px-3 text-sm font-medium text-purple-400 hover:bg-purple-600 hover:text-white rounded-full flex items-center gap-1.5 transition-all duration-300 transform"
          >
            Read More <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
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
                        <Pocket className="h-4 w-4" />
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
  onRegenerate,
  isRegenerating,
  canRegenerate,
  nestedExpansions: propNestedExpansions,
}: MindMapProps) => {
  const mindMapRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, firestore } = useFirebase();

  // Track study time
  useStudyTimeTracker(firestore, user?.uid, true);

  const [providerOptions, setProviderOptions] = useState<{ apiKey?: string; provider?: 'pollinations' | 'gemini' } | undefined>(undefined);

  useEffect(() => {
    const fetchProvider = async () => {
      if (!user || !firestore) return;
      try {
        const snap = await getDoc(doc(firestore, 'users', user.uid));
        if (snap.exists()) {
          const p = snap.data().apiSettings?.provider;
          if (p === 'pollinations') setProviderOptions({ provider: 'pollinations' });
          else setProviderOptions({ provider: 'gemini' });
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

  const [openSubTopics, setOpenSubTopics] = useState<string[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isAiContentDialogOpen, setIsAiContentDialogOpen] = useState(false);

  const [isExampleDialogOpen, setIsExampleDialogOpen] = useState(false);
  const [exampleContent, setExampleContent] = useState('');
  const [isExampleLoading, setIsExampleLoading] = useState(false);
  const [activeExplainableNode, setActiveExplainableNode] =
    useState<ExplainableNode | null>(null);

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
    setMindMap(data);
    // Also update nestedExpansions and generatedImages from data
    if (propNestedExpansions) {
      setNestedExpansions(propNestedExpansions);
    } else if (data.nestedExpansions) {
      setNestedExpansions(prev => {
        // Preserve local generating items that aren't yet in the server data
        const localGenerating = prev.filter(item => item.status === 'generating');
        // Ensure data.nestedExpansions is treated as an array
        const serverExpansions = data.nestedExpansions || [];
        const serverIds = new Set(serverExpansions.map((e: any) => e.id));
        const uniqueGenerating = localGenerating.filter(item => !serverIds.has(item.id));
        return [...serverExpansions, ...uniqueGenerating];
      });
    }
    if (data.savedImages) {
      setGeneratedImages(data.savedImages);
    }
  }, [data, propNestedExpansions]);

  useEffect(() => {
    const checkIfPublished = async () => {
      if (!firestore || !mindMap.id || isPublic) {
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
    setIsTranslating(true);
    // Create a plain object for the server action
    const { createdAt, updatedAt, ...plainMindMapData } = mindMap as any;

    const { translation, error } = await translateMindMapAction({
      mindMapData: plainMindMapData,
      targetLang: langCode,
    }, providerOptions);
    setIsTranslating(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: error,
      });
    } else if (translation) {
      setMindMap(translation);
      onLanguageChange(langCode);
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

    // Use a simple data URI placeholder instead of external service
    const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzI3MjcyNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HZW5lcmF0aW5nLi4uPC90ZXh0Pjwvc3ZnPg==';

    const placeholderImage: GeneratedImage = {
      id: generationId,
      url: placeholderUrl,
      name: subCategory.name,
      description: subCategory.description,
      status: 'generating',
    };
    setGeneratedImages(prev => [...prev, placeholderImage]);

    const generationSteps = [
      'Enhancing prompt with AI...',
      'Connecting to image model...',
      'Generating your image...',
      'Finalizing...',
    ];
    let currentStep = 0;

    const { id: toastId, update } = toast({
      title: 'Starting Image Generation...',
      description: `Preparing to create image for "${subCategory.name}".`,
      duration: Infinity,
    });

    const updateStep = () => {
      if (currentStep < generationSteps.length) {
        update({
          id: toastId,
          title: 'Generating Image...',
          description: generationSteps[currentStep],
        });
        currentStep++;
      }
    };

    const stepInterval = setInterval(updateStep, 1500);
    updateStep();

    try {
      // Get user's image provider preference
      let imageProvider = providerOptions?.provider || 'pollinations';

      const prompt = `${subCategory.name}, ${subCategory.description}`;
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: 'Photorealistic',
          provider: imageProvider
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image.');
      }

      clearInterval(stepInterval);

      const newImage: GeneratedImage = {
        id: generationId,
        url: data.images[0],
        name: subCategory.name,
        description: subCategory.description,
        status: 'completed',
      };

      setGeneratedImages(prev => prev.map(img => img.id === generationId ? newImage : img));

      // Track activity
      // Track activity
      if (firestore && user) {
        await trackImageGenerated(firestore, user.uid);
      }

      update({
        id: toastId,
        title: 'Image Created!',
        description: `Image for "${subCategory.name}" is ready.`,
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
      clearInterval(stepInterval);
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

  const handleQuizClick = async () => {
    setIsQuizDialogOpen(true);
    setIsQuizLoading(true);

    // Create a plain object for the server action to avoid serialization errors with Firestore timestamps
    const { createdAt, updatedAt, ...plainMindMapData } = mindMap as any;

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
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to publish a mind map.',
      });
      return;
    }
    setIsPublishing(true);

    try {
      const publicMapsCollection = collection(firestore, 'publicMindmaps');
      const { id, createdAt, updatedAt, ...plainMindMapData } = mindMap as any;

      // Generate summary
      const { summary: summaryData, error: summaryError } =
        await summarizeMindMapAction({ mindMapData: plainMindMapData }, providerOptions);

      if (summaryError || !summaryData) {
        throw new Error(summaryError || 'Failed to generate mind map summary.');
      }

      await addDoc(publicMapsCollection, {
        ...plainMindMapData,
        summary: summaryData.summary,
        originalAuthorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Map Published!',
        description: `"${mindMap.topic}" is now available for the community to view.`,
      });
      setIsPublished(true);
    } catch (error: any) {
      console.error('Failed to publish mind map:', error);
      toast({
        variant: 'destructive',
        title: 'Publishing Failed',
        description: error.message || 'An error occurred while trying to publish your map.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDuplicateMap = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please log in to duplicate this mind map.',
      });
      router.push('/login');
      return;
    }
    if (!firestore) return;

    setIsDuplicating(true);
    try {
      const mindMapsCollection = collection(firestore, 'users', user.uid, 'mindmaps');
      const { id, createdAt, updatedAt, originalAuthorId, authorName, ...plainMindMapData } = mindMap as any;

      const docRef = await addDoc(mindMapsCollection, {
        ...plainMindMapData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Generate a new thumbnail for the duplicated map
        thumbnailUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(mindMap.topic)}?width=400&height=225&nologo=true`,
        thumbnailPrompt: `A cinematic 3D render of ${mindMap.topic}, in futuristic purple tones, mind-map theme, highly detailed`
      });

      toast({
        title: 'Map Duplicated!',
        description: `A copy of "${mindMap.topic}" has been added to your "My Maps".`,
      });

      // Track activity
      // Track activity
      if (firestore && user) {
        await trackMapCreated(firestore, user.uid);
      }

      // Redirect to the newly created map
      router.push(`/mindmap?mapId=${docRef.id}`);

    } catch (error) {
      console.error('Failed to duplicate mind map:', error);
      toast({
        variant: 'destructive',
        title: 'Duplication Failed',
        description: 'An error occurred while trying to duplicate this map.',
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleShare = (mapId: string) => {
    const url = `${window.location.origin}/mindmap?mapId=${mapId}&public=true`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast({
      title: 'Link Copied!',
      description: 'A shareable link has been copied to your clipboard.',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };


  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setOpenSubTopics([]);
      setOpenCategories([]);
    } else {
      const allSubTopics = mindMap.subTopics?.map(
        (_, subIndex) => `subtopic-${subIndex}`
      ) || [];
      const allCategories = mindMap.subTopics?.flatMap((subTopic, subIndex) =>
        subTopic.categories.map(
          (_, catIndex) => `subtopic-${subIndex}-category-${catIndex}`
        )
      );
      setOpenSubTopics(allSubTopics);
      setOpenCategories(allCategories);
    }
    setIsAllExpanded(!isAllExpanded);
  };

  const handleGenerateClick = (
    e: React.MouseEvent,
    topic: string,
    nodeId: string,
    contextPath: string
  ) => {
    e.stopPropagation();
    onGenerateNewMap(topic, nodeId, contextPath);
  };

  /**
   * Handle expansion of a node - generates nested sub-categories and adds to expansions list
   */
  const handleExpandNode = async (
    nodeName: string,
    nodeDescription: string,
    nodeId: string,
    depth: number = 1
  ) => {
    setExpandingNodeId(nodeId);

    // Create placeholder ID
    const expansionId = `expansion-${Date.now()}`;

    // 1. Create temporary placeholder
    const placeholderExpansion: NestedExpansionItem = {
      id: expansionId,
      parentName: nodeName,
      topic: 'Generating...',
      icon: 'Loader2',
      subCategories: [],
      createdAt: Date.now(),
      depth,
      status: 'generating'
    };

    // 2. Add placeholder and open dialog immediately
    setNestedExpansions(prev => [...prev, placeholderExpansion]);
    setIsNestedMapsDialogOpen(true);

    try {
      const { expansion, error } = await expandNodeAction({
        nodeName,
        parentTopic: mindMap.topic,
        nodeDescription,
        depth,
      }, providerOptions);

      if (error) {
        // Remove placeholder on error
        setNestedExpansions(prev => prev.filter(e => e.id !== expansionId));
        toast({
          variant: 'destructive',
          title: 'Expansion Failed',
          description: error,
        });
        setExpandingNodeId(null);
        return;
      }

      if (expansion) {
        // 3. Update placeholder with actual data
        setNestedExpansions(prev => prev.map(item => {
          if (item.id === expansionId) {
            return {
              ...item,
              topic: expansion.topic,
              icon: expansion.icon,
              subCategories: expansion.subCategories,
              status: 'completed'
            };
          }
          return item;
        }));

        toast({
          title: 'Expanded!',
          description: `Added ${expansion.subCategories.length} sub-topics to "${nodeName}"`,
        });

        // Track activity
        // Track activity
        if (firestore && user) {
          await trackNestedExpansion(firestore, user.uid);
        }
      }
    } catch (err) {
      // Remove placeholder on error
      setNestedExpansions(prev => prev.filter(e => e.id !== expansionId));
      toast({
        variant: 'destructive',
        title: 'Expansion Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setExpandingNodeId(null);
    }
  };

  /**
   * Delete an expansion from the list
   */
  const handleDeleteExpansion = async (id: string) => {
    // Update local state immediately for instant UI feedback
    setNestedExpansions(prev => prev.filter(exp => exp.id !== id));

    // Persist deletion to Firestore
    if (user && firestore && mindMap.id) {
      try {
        const mapRef = doc(firestore, 'users', user.uid, 'mindmaps', mindMap.id);
        const updatedExpansions = nestedExpansions.filter(exp => exp.id !== id);

        await updateDoc(mapRef, {
          nestedExpansions: updatedExpansions
        });
      } catch (error) {
        console.error('Error deleting nested expansion:', error);
        // Optionally show a toast notification
      }
    }
  };

  /**
   * Regenerate an expansion
   */
  const handleRegenerateExpansion = async (parentName: string, id: string) => {
    const expansion = nestedExpansions.find(exp => exp.id === id);
    if (expansion) {
      // Remove the old one and generate new
      setNestedExpansions(prev => prev.filter(exp => exp.id !== id));
      await handleExpandNode(parentName, '', id, expansion.depth);
    }
  };

  /**
   * Expand further from a nested expansion
   */
  const handleNestedExpandFurther = async (
    nodeName: string,
    nodeDescription: string,
    parentId: string
  ) => {
    const parentExpansion = nestedExpansions.find(exp => exp.id === parentId);
    const newDepth = parentExpansion ? parentExpansion.depth + 1 : 2;
    await handleExpandNode(nodeName, nodeDescription, `${parentId}-${nodeName}`, newDepth);
  };

  const handleExplainWithExample = (
    e: React.MouseEvent,
    node: ExplainableNode
  ) => {
    e.stopPropagation();
    setActiveExplainableNode(node);
    setIsExampleDialogOpen(true);
    setExampleContent('');
  };

  const handleRegenerateExample = () => {
    if (activeExplainableNode) {
      fetchExample();
    }
  };

  if (!mindMap) {
    return null;
  }

  const TopicIcon = (LucideIcons as any)[toPascalCase(mindMap.icon)] || Book;

  return (
    <TooltipProvider delayDuration={0}>
      <div ref={mindMapRef} className="w-full max-w-6xl mx-auto flex-shrink-0">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-shadow-glow text-purple-300 flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-600/30 to-indigo-700/20 ring-1 ring-purple-400/30">
              <TopicIcon className="w-8 h-8 text-purple-300" />
            </div>
            <span>{mindMap.topic}</span>
          </h2>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 flex-nowrap">
            <Select
              value={selectedLanguage}
              onValueChange={handleLanguageChange}
              disabled={isTranslating}
            >
              <SelectTrigger className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 focus:ring-purple-500 h-7 px-3">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent className="glassmorphism">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleExpandAll}
              className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 h-7"
            >
              {isAllExpanded ? 'Collapse All' : 'Expand All'}
            </Button>

            {canRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 h-7"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAiContentDialogOpen(true)}
              className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 h-7"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>View AI Content</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleQuizClick}
              className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 h-7"
            >
              <TestTube2 className="mr-2 h-4 w-4" />
              <span>Quiz Me</span>
            </Button>

            {isPublic ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicateMap}
                  disabled={isDuplicating || !user}
                  className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 h-7"
                >
                  {isDuplicating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  <span>{isDuplicating ? 'Saving...' : 'Save to My Maps'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mindMap.id && handleShare(mindMap.id)}
                  disabled={!mindMap.id}
                  className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 h-7"
                >
                  {isCopied ? <ClipboardCheck className="mr-2 h-4 w-4 text-green-400" /> : <Share2 className="mr-2 h-4 w-4" />}
                  <span>{isCopied ? 'Copied!' : 'Share'}</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveMap}
                disabled={isSaved}
                className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 h-7"
              >
                {isSaved ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                <span>{isSaved ? 'Saved' : 'Save Map'}</span>
              </Button>
            )}

            {!isPublic && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePublishMap}
                disabled={isPublishing || !user || !isSaved || isPublished}
                title={!isSaved ? "You must save the map before publishing" : isPublished ? "This map is already public" : ""}
                className="rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 h-7"
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isPublished ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Share className="mr-2 h-4 w-4" />
                )}
                <span>{isPublishing ? 'Publishing...' : isPublished ? 'Published' : 'Publish'}</span>
              </Button>
            )}
          </div>
        </div>

        <Accordion
          type="multiple"
          className="w-full space-y-4"
          value={openSubTopics}
          onValueChange={setOpenSubTopics}
        >
          {mindMap.subTopics?.map((subTopic, subIndex) => {
            const SubTopicIcon =
              (LucideIcons as any)[toPascalCase(subTopic.icon)] || Library;

            const subTopicNodeId = `subtopic-${subIndex}`;
            const isGeneratingSubTopic = generatingNode === subTopicNodeId;
            const isDifferencesSubTopic =
              subTopic.name.toLowerCase() === 'differences' && subTopic.categories.length === 2;

            return (
              <AccordionItem
                key={subIndex}
                value={`subtopic-${subIndex}`}
                className="group/sub-topic border-0 rounded-2xl bg-card/75 backdrop-blur-md border border-white/10 transition-all overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4">
                  <AccordionTrigger className="text-xl font-semibold flex-1 text-left p-0 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-accent/20 text-accent">
                        <SubTopicIcon className="h-6 w-6" />
                      </div>
                      <span>{subTopic.name}</span>
                    </div>
                  </AccordionTrigger>
                  <div
                    className="pl-4 flex items-center gap-1 opacity-0 group-hover/sub-topic:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${nestedExpansions.find(e => e.parentName === subTopic.name)?.status === 'completed'
                            ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20'
                            : 'text-muted-foreground hover:text-purple-400'
                            }`}
                          onClick={(e) => {
                            const existing = nestedExpansions.find(e => e.parentName === subTopic.name);
                            if (existing && existing.status === 'completed' && existing.fullData) {
                              e.stopPropagation();
                              if (onOpenNestedMap) onOpenNestedMap(existing.fullData, existing.id);
                            } else {
                              handleGenerateClick(e, subTopic.name, subTopicNodeId, mindMap.topic);
                            }
                          }}
                          disabled={isGeneratingSubTopic}
                        >
                          {isGeneratingSubTopic ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <div className="relative">
                              <Network className="h-4 w-4" />
                              {nestedExpansions.find(e => e.parentName === subTopic.name)?.status === 'completed' && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              )}
                            </div>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipPortal>
                        <TooltipContent className="bg-zinc-950 border-zinc-800 text-zinc-100 font-medium text-xs py-1 px-3">
                          <p>{nestedExpansions.find(e => e.parentName === subTopic.name)?.status === 'completed' ? "Open Sub-Map" : "Generate Sub-Map"}</p>
                        </TooltipContent>
                      </TooltipPortal>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) =>
                            handleExplainWithExample(e, {
                              name: subTopic.name,
                              type: 'subTopic',
                            })
                          }
                        >
                          <Pocket className="h-4 w-4" />
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
                          onClick={() =>
                            onExplainInChat(
                              `Explain the sub-topic "${subTopic.name}" in the context of ${mindMap.topic}.`
                            )
                          }
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
                <AccordionContent className="px-6 pb-6 pt-0">
                  {isDifferencesSubTopic ? (
                    <ComparisonView
                      categories={subTopic.categories}
                      onSubCategoryClick={handleSubCategoryClick}
                      onGenerateNewMap={onGenerateNewMap}
                      generatingNode={generatingNode}
                      onExplainWithExample={(node) => {
                        // Create a mock React MouseEvent
                        const mockEvent = {
                          stopPropagation: () => { },
                          preventDefault: () => { },
                        } as unknown as React.MouseEvent<Element, MouseEvent>;
                        handleExplainWithExample(mockEvent, node);
                      }}
                      onExplainInChat={onExplainInChat}
                      mainTopic={mindMap.topic}
                      contextPath={`${mindMap.topic} > ${subTopic.name}`}
                    />
                  ) : (
                    <Accordion
                      type="multiple"
                      className="w-full space-y-3"
                      value={openCategories}
                      onValueChange={setOpenCategories}
                    >
                      {subTopic.categories.map((category, catIndex) => {
                        const CategoryIcon =
                          (LucideIcons as any)[toPascalCase(category.icon)] ||
                          FolderOpen;

                        const categoryNodeId = `subtopic-${subIndex}-category-${catIndex}`;
                        const isGeneratingCategory =
                          generatingNode === categoryNodeId;

                        return (
                          <AccordionItem
                            key={catIndex}
                            value={`subtopic-${subIndex}-category-${catIndex}`}
                            className="group/category border rounded-xl bg-zinc-900/40 border-white/10"
                          >
                            <div className="flex items-center justify-between px-4 py-3">
                              <AccordionTrigger className="text-lg font-medium flex-1 text-left p-0 hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-md bg-accent/20 text-accent">
                                    <CategoryIcon className="h-5 w-5" />
                                  </div>
                                  <span>{category.name}</span>
                                </div>
                              </AccordionTrigger>
                              <div
                                className="pl-4 flex items-center gap-1 opacity-0 group-hover/category:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-8 w-8 ${nestedExpansions.find(e => e.parentName === category.name)?.status === 'completed'
                                        ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20'
                                        : 'text-muted-foreground hover:text-purple-400'
                                        }`}
                                      onClick={(e) => {
                                        const existing = nestedExpansions.find(e => e.parentName === category.name);
                                        if (existing && existing.status === 'completed' && existing.fullData) {
                                          e.stopPropagation();
                                          if (onOpenNestedMap) onOpenNestedMap(existing.fullData, existing.id);
                                        } else {
                                          handleGenerateClick(
                                            e,
                                            category.name,
                                            categoryNodeId,
                                            `${mindMap.topic} > ${subTopic.name}`
                                          );
                                        }
                                      }}
                                      disabled={isGeneratingCategory}
                                    >
                                      {isGeneratingCategory ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <div className="relative">
                                          <Network className="h-4 w-4" />
                                          {nestedExpansions.find(e => e.parentName === category.name)?.status === 'completed' && (
                                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipPortal>
                                    <TooltipContent className="bg-zinc-950 border-zinc-800 text-zinc-100 font-medium text-xs py-1 px-3">
                                      <p>{nestedExpansions.find(e => e.parentName === category.name)?.status === 'completed' ? "Open Sub-Map" : "Generate Sub-Map"}</p>
                                    </TooltipContent>
                                  </TooltipPortal>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) =>
                                        handleExplainWithExample(e, {
                                          name: category.name,
                                          type: 'category',
                                        })
                                      }
                                    >
                                      <Pocket className="h-4 w-4" />
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
                                      onClick={() =>
                                        onExplainInChat(
                                          `Explain the category "${category.name}" in the context of ${subTopic.name}.`
                                        )
                                      }
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
                            <AccordionContent className="px-4 pb-4 pt-0">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                {category.subCategories.map(
                                  (subCategory, subCatIndex) => (
                                    <SubCategoryCard
                                      key={subCatIndex}
                                      subCategory={subCategory}
                                      onExpandNode={handleExpandNode}
                                      isExpanding={expandingNodeId === `subcat-${subIndex}-${catIndex}-${subCatIndex}`}
                                      onGenerateNewMap={onGenerateNewMap}
                                      isGeneratingMap={generatingNode === `subcat-${subIndex}-${catIndex}-${subCatIndex}`}
                                      onExplainWithExample={(node) =>
                                        handleExplainWithExample(
                                          { stopPropagation: () => { } } as React.MouseEvent,
                                          node
                                        )
                                      }
                                      onExplainInChat={onExplainInChat}
                                      onSubCategoryClick={handleSubCategoryClick}
                                      onGenerateImage={handleGenerateImageClick}
                                      mainTopic={mindMap.topic}
                                      nodeId={`subcat-${subIndex}-${catIndex}-${subCatIndex}`}
                                      contextPath={`${mindMap.topic} > ${subTopic.name} > ${category.name}`}
                                      existingExpansion={nestedExpansions.find(e => e.parentName === subCategory.name)}
                                      onOpenMap={(mapData, id) => {
                                        if (onOpenNestedMap) onOpenNestedMap(mapData, id);
                                      }}
                                    />
                                  )
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>


      {/* Nested Maps FAB - only visible when there are expansions */}
      {nestedExpansions.length > 0 && (
        <div className="fixed bottom-40 right-6 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsNestedMapsDialogOpen(true)}
              >
                <Network className="h-7 w-7" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1"
                >
                  {nestedExpansions.length}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Nested Maps ({nestedExpansions.length})</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Image Gallery FAB - only visible when there are images */}
      {generatedImages.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={() => setIsGalleryOpen(true)}
              >
                <Images className="h-7 w-7" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1"
                >
                  {generatedImages.length}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Image Gallery ({generatedImages.length})</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <ExplanationDialog
        isOpen={isExplanationDialogOpen}
        onClose={() => setIsExplanationDialogOpen(false)}
        title={activeSubCategory?.name ?? ''}
        content={explanationDialogContent}
        isLoading={isExplanationLoading}
        onExplainInChat={onExplainInChat}
        explanationMode={explanationMode}
        onExplanationModeChange={setExplanationMode}
      />
      <QuizDialog
        isOpen={isQuizDialogOpen}
        onClose={() => setIsQuizDialogOpen(false)}
        topic={mindMap.topic}
        questions={quizQuestions}
        isLoading={isQuizLoading}
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
        title={activeExplainableNode?.name ?? ''}
        example={exampleContent}
        isLoading={isExampleLoading}
        explanationMode={explanationMode}
        onExplanationModeChange={setExplanationMode}
        onRegenerate={handleRegenerateExample}
      />
      <ImageGalleryDialog
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={generatedImages}
        onDownload={handleDownloadImage}
        onRegenerate={handleGenerateImageClick}
      />
      <NestedMapsDialog
        isOpen={isNestedMapsDialogOpen}
        onClose={() => setIsNestedMapsDialogOpen(false)}
        expansions={nestedExpansions.map(e => ({
          ...e,
          path: e.path || '' // Ensure path is always a string
        }))}
        onDelete={handleDeleteExpansion}
        onRegenerate={handleRegenerateExpansion}
        onExpandFurther={handleNestedExpandFurther}
        expandingId={expandingNodeId}
        onExplainInChat={onExplainInChat}
        mainTopic={mindMap.topic}
        onOpenMap={(mapData, id) => {
          if (onOpenNestedMap) {
            onOpenNestedMap(mapData, id);
          }
        }}
      />
    </TooltipProvider>
  );
};

MindMap.displayName = 'MindMap';
