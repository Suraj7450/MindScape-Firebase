
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
  Copy,
  ClipboardCheck,
} from 'lucide-react';
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';
import {
  explainNodeAction,
  generateQuizAction,
  explainWithExampleAction,
  translateMindMapAction,
  summarizeMindMapAction
} from '@/app/actions';
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
import { addDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';


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

type MindMapData = GenerateMindMapOutput & { thumbnailUrl?: string; id?: string };


/**
 * Props for the main MindMap component.
 */
interface MindMapProps {
  data: MindMapData;
  isSaved: boolean;
  isPublic: boolean;
  onSaveMap: () => void;
  onExplainInChat: (message: string) => void;
  onGenerateNewMap: (topic: string, nodeId: string) => void;
  generatingNode: string | null;
  selectedLanguage: string;
  onLanguageChange: (langCode: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  canRegenerate: boolean;
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
  onGenerateNewMap,
  generatingNode,
  onExplainWithExample,
  onExplainInChat,
  onSubCategoryClick,
  onGenerateImage,
  mainTopic,
  nodeId,
}: {
  subCategory: any;
  onGenerateNewMap: (topic: string, nodeId: string) => void;
  generatingNode: string | null;
  onExplainWithExample: (node: ExplainableNode) => void;
  onExplainInChat: (message: string) => void;
  onSubCategoryClick: (subCategory: SubCategoryInfo) => void;
  onGenerateImage: (subCategory: SubCategoryInfo) => void;
  mainTopic: string;
  nodeId: string;
}) {
  const SubCategoryIcon =
    (LucideIcons as any)[toPascalCase(subCategory.icon)] || FileText;

  const isGenerating = generatingNode === nodeId;

  const handleGenerateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateNewMap(subCategory.name, nodeId);
  };

  const handleExampleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExplainWithExample({ name: subCategory.name, type: 'category' });
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExplainInChat(
      `Explain what ${subCategory.name} is in the context of ${mainTopic}.`
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

        {subCategory.tags && subCategory.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
            {subCategory.tags.map((tag: string, i: number) => (
                <span
                key={i}
                className="rounded-full px-3 py-1 text-xs font-medium text-purple-200 bg-white/5 ring-1 ring-white/10"
                style={{ backdropFilter: 'blur(6px)' }}
                >
                {tag}
                </span>
            ))}
            </div>
        )}

        <div
          className="mt-4 flex justify-between items-center"
        >
          <div
            className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
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
                    className="h-7 w-7"
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
                    className="h-7 w-7"
                    onClick={handleImageClick}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent>
                    <p>Generate Image</p>
                  </TooltipContent>
                </TooltipPortal>
              </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
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
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSubCategoryClick(subCategory);
            }}
            variant="ghost"
            className="h-auto p-1 text-sm text-purple-400 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
          >
            Explore <ArrowRight className="w-4 h-4" />
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
}: {
  categories: any[];
  onSubCategoryClick: (subCategory: SubCategoryInfo) => void;
  onGenerateNewMap: (topic: string, nodeId: string) => void;
  generatingNode: string | null;
  onExplainWithExample: (node: ExplainableNode) => void;
  onExplainInChat: (message: string) => void;
  mainTopic: string;
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
      {comparisonRows?.map((row, index) => {
        const RowIcon =
          (LucideIcons as any)[toPascalCase(row.icon)] || FolderOpen;
        const isGenerating = generatingNode === row.nodeId;

        const handleGenerateClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onGenerateNewMap(row.name, row.nodeId);
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
  generatingNode,
  selectedLanguage,
  onLanguageChange,
  onRegenerate,
  isRegenerating,
  canRegenerate,
}: MindMapProps) => {
  const mindMapRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, firestore } = useFirebase();


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


  useEffect(() => {
    setMindMap(data);
  }, [data]);
  
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
    });
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
    });

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
    });
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
    const placeholderUrl = `https://picsum.photos/seed/${generationId}/512/512`;

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
      const prompt = `${subCategory.name}, ${subCategory.description}`;
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: 'Photorealistic' }),
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

    const { quiz, error } = await generateQuizAction({
      mindMapData: mindMap,
    });

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
        await summarizeMindMapAction({ mindMapData: plainMindMapData });
  
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
      const allSubTopics = mindMap.subTopics.map(
        (_, subIndex) => `subtopic-${subIndex}`
      );
      const allCategories = mindMap.subTopics.flatMap((subTopic, subIndex) =>
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
    nodeId: string
  ) => {
    e.stopPropagation();
    onGenerateNewMap(topic, nodeId);
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
                <span>{isDuplicating ? 'Saving...': 'Save to My Maps'}</span>
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
          {mindMap.subTopics.map((subTopic, subIndex) => {
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
                          className="h-8 w-8"
                          onClick={(e) =>
                            handleGenerateClick(e, subTopic.name, subTopicNodeId)
                          }
                          disabled={isGeneratingSubTopic}
                        >
                          {isGeneratingSubTopic ? (
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
                        onExplainWithExample={(node) => handleExplainWithExample(new MouseEvent('click'), node)}
                        onExplainInChat={onExplainInChat}
                        mainTopic={mindMap.topic}
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
                                    className="h-8 w-8"
                                    onClick={(e) =>
                                      handleGenerateClick(
                                        e,
                                        category.name,
                                        categoryNodeId
                                      )
                                    }
                                    disabled={isGeneratingCategory}
                                  >
                                    {isGeneratingCategory ? (
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
                              {category.subCategories.map(
                                (subCategory, subCatIndex) => (
                                  <SubCategoryCard
                                    key={subCatIndex}
                                    subCategory={subCategory}
                                    onGenerateNewMap={onGenerateNewMap}
                                    generatingNode={generatingNode}
                                    onExplainWithExample={(node) =>
                                      handleExplainWithExample(
                                        new MouseEvent('click'),
                                        node
                                      )
                                    }
                                    onExplainInChat={onExplainInChat}
                                    onSubCategoryClick={handleSubCategoryClick}
                                    onGenerateImage={handleGenerateImageClick}
                                    mainTopic={mindMap.topic}
                                    nodeId={`subcat-${subIndex}-${catIndex}-${subCatIndex}`}
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

      {generatedImages.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
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
              <p>View Image Gallery</p>
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
    </TooltipProvider>
  );
};

MindMap.displayName = 'MindMap';
