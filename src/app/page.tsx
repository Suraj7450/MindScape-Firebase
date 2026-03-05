
'use client';

import { useState, useRef, createRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Paperclip,
  List,
  ArrowRight,
  Globe,
  GitBranch,
  Zap,
  Image as ImageIcon,
  Loader2,
  UserRound,
  Palette,
  Brain,
  X,
  MessageCircle,
  FastForward,
  Scale,
  BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parsePdfContent } from '@/lib/pdf-processor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { languages } from '@/lib/languages';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';
import { useAIConfig } from '@/contexts/ai-config-context';
import { OnboardingWizard, TRIGGER_ONBOARDING_EVENT } from '@/components/onboarding-wizard';

import Image from 'next/image';
import dynamic from 'next/dynamic';

const ChatPanel = dynamic(() => import('@/components/chat-panel').then(mod => mod.ChatPanel), {
  ssr: false,
  loading: () => null
});

const PERSONAS = [
  { id: 'teacher', label: 'Teacher', icon: UserRound, color: 'text-blue-400', description: 'Explains concepts with detailed examples and educational step-by-step guidance.' },
  { id: 'concise', label: 'Concise', icon: Zap, color: 'text-amber-400', description: 'Provides direct, short, and to-the-point answers without fluff.' },
  { id: 'creative', label: 'Creative', icon: Palette, color: 'text-pink-400', description: 'Uses imaginative and out-of-the-box thinking for brainstorming.' },
  { id: 'sage', label: 'Cognitive Sage', icon: Brain, color: 'text-purple-400', description: 'Deep, philosophical, and analytical thinker for complex problems.' }
];

const DEPTHS = [
  { id: 'low', label: 'Quick', icon: FastForward, color: 'text-green-400', description: 'Brief and fast overview.' },
  { id: 'medium', label: 'Balanced', icon: Scale, color: 'text-blue-400', description: 'Optimal mix of detail and brevity.' },
  { id: 'deep', label: 'Detailed', icon: BookOpen, color: 'text-purple-400', description: 'Comprehensive, in-depth exploration.' }
];

// ---------- HERO ----------
function Hero({
  onGenerate,
  onCompare,
  lang,
  setLang,
  isGenerating,
  languageSelectRef,
  fileInputRef,
  depth,
  setDepth,
  persona,
  setPersona,

}: {
  onGenerate: (
    topic: string,
    fileInfo?: { name: string; type: string; content: string }
  ) => void;
  onCompare: (topic1: string, topic2: string) => void;
  lang: string;
  setLang: (lang: string) => void;
  isGenerating: boolean;
  languageSelectRef: React.RefObject<HTMLButtonElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  depth: string;
  setDepth: (depth: string) => void;
  persona: string;
  setPersona: (persona: string) => void;

}) {
  // Web search is always enabled for real-time information
  const useSearch = true;
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [topic2, setTopic2] = useState('');
  const [activeMode, setActiveMode] = useState<'single' | 'compare'>('single');
  const isCompareMode = activeMode === 'compare';

  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: 'text' | 'pdf' | 'image';
    content: string;
  } | null>(null);

  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { user } = useUser();
  const { config } = useAIConfig();
  const isSetupComplete = !!user && !!config.pollinationsApiKey;

  // Trigger generation when a file is uploaded
  useEffect(() => {
    if (uploadedFile) {
      if (!isSetupComplete) {
        window.dispatchEvent(new CustomEvent(TRIGGER_ONBOARDING_EVENT));
        return;
      }
      onGenerate(topic, uploadedFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFile]);

  const handleInternalSubmit = () => {
    if (!isSetupComplete) {
      window.dispatchEvent(new CustomEvent(TRIGGER_ONBOARDING_EVENT));
      return;
    }

    if (isCompareMode) {
      if (!topic.trim() || !topic2.trim()) {
        toast({
          variant: 'destructive',
          title: 'Topics Required',
          description: 'Please enter both topics to generate a comparison.',
        });
        return;
      }
      onCompare(topic, topic2);
    } else {
      if (!topic && !uploadedFile) return;
      // For file uploads, generation is triggered by the useEffect
      if (!uploadedFile) {
        onGenerate(topic);
      } else {
        onGenerate(topic, {
          name: uploadedFile.name,
          type: uploadedFile.type,
          content: uploadedFile.content
        });
      }
    }
  };

  const handleFileIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let content = '';
      let type: 'text' | 'pdf' | 'image' = 'text';

      if (file.type.startsWith('image/')) {
        // Enforce 2MB limit for images to prevent memory bloat and session storage limits
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "Image Too Large",
            description: "Please upload an image smaller than 2MB.",
            variant: "destructive"
          });
          return;
        }

        type = 'image';
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        setUploadedFile({ name: file.name, type, content });
      } else if (file.type === 'application/pdf') {
        type = 'pdf';
        const arrayBuffer = await file.arrayBuffer();
        setPdfProgress({ current: 0, total: 1 });

        try {
          const { content: cleanedText } = await parsePdfContent(
            arrayBuffer,
            (progress) => setPdfProgress(progress),
            100000
          );

          setPdfProgress(null);
          setUploadedFile({
            name: file.name,
            type: 'pdf',
            content: cleanedText
          });
        } catch (err: any) {
          console.error("PDF Parsing error:", err);
          setPdfProgress(null);
          toast({
            title: "PDF Parse Failed",
            description: err.message || "Could not parse PDF.",
            variant: "destructive"
          });
        }
        return;
      } else {
        content = await file.text();
        setUploadedFile({ name: file.name, type, content });
      }

    } catch (err) {
      console.error('Error uploading file:', err);
      toast({ title: "Upload Failed", description: "Could not process file.", variant: "destructive" });
      setPdfProgress(null);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    setPdfProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-[58px] pb-24 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center text-center"
      >
        <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 bg-primary/5 text-primary-foreground animate-fade-in backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 mr-2" />
          Next-Gen AI Mind Mapping
        </Badge>

        {!isSetupComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <button
              onClick={() => window.dispatchEvent(new CustomEvent(TRIGGER_ONBOARDING_EVENT))}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/20 transition-all"
            >
              <Zap className="w-3 h-3 animate-pulse" />
              Complete Setup to Generate
            </button>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
        >
          Everything starts with <br />
          <span className="text-primary">a thought.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          MindScape transforms your unstructured ideas into clear, explorable knowledge through intelligent AI-powered visualization.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl mx-auto relative group"
        >

          <div className="relative rounded-[2.5rem] border border-white/10 bg-zinc-900/60 backdrop-blur-3xl p-2 shadow-2xl ring-1 ring-white/10 overflow-hidden group-focus-within:border-primary/30 transition-all duration-300">
            {/* Subtle top highlight */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="flex flex-col gap-2">
              {/* Toolbar Section: Modes & Settings */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-3 pt-2 pb-1">
                {/* Mode Selector */}
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-full border border-white/5 backdrop-blur-md">
                  {[
                    { id: 'single', label: 'Single' },
                    { id: 'compare', label: 'Compare' }
                  ].map((mode) => (
                    <Button
                      key={mode.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "rounded-full text-[10px] font-extrabold tracking-widest uppercase px-5 h-8 transition-all duration-500 border",
                        activeMode === mode.id
                          ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.15)] text-white scale-105"
                          : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                      )}
                      onClick={() => setActiveMode(mode.id as any)}
                    >
                      {mode.label}
                    </Button>
                  ))}
                </div>

                {/* Settings Controls */}
                <div className="flex items-center gap-2">
                  <Select value={depth} onValueChange={setDepth} open={openSelect === 'depth'} onOpenChange={(open) => {
                    if (open) setOpenSelect('depth');
                    else if (openSelect === 'depth') setOpenSelect(null);
                  }}>
                    <SelectTrigger className="w-auto h-9 border border-white/5 bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-400 rounded-full hover:bg-black/60 hover:text-primary transition-all group px-4 focus:ring-0 focus:ring-offset-0 focus:outline-none">
                      {(() => {
                        const active = DEPTHS.find(d => d.id === depth);
                        if (!active) {
                          return (
                            <>
                              <List className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" />
                              <span>Depth</span>
                            </>
                          );
                        }
                        return (
                          <>
                            <active.icon className={cn("w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform", active.color)} />
                            <span>{active.label}</span>
                          </>
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-white/10 min-w-[160px]" position="popper">
                      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 border-b border-white/5">Exploration Depth</div>
                      {DEPTHS.map((d) => (
                        <SelectItem
                          key={d.id}
                          value={d.id}
                          hideIndicator
                          className="w-full cursor-pointer py-3 px-3 mb-1 last:mb-0 rounded-xl border border-transparent focus:bg-white/5 data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary/50 data-[state=checked]:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                        >
                          <div className="flex flex-col items-start gap-1.5 w-full text-left">
                            <div className="flex items-center gap-2 w-full">
                              <d.icon className={cn("w-4 h-4", d.color)} />
                              <span className="font-bold tracking-wide uppercase text-[11px]">{d.label}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-normal leading-relaxed whitespace-normal normal-case tracking-normal">
                              {d.description}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={persona} onValueChange={setPersona} open={openSelect === 'persona'} onOpenChange={(open) => {
                    if (open) setOpenSelect('persona');
                    else if (openSelect === 'persona') setOpenSelect(null);
                  }}>
                    <SelectTrigger className="w-auto h-9 border border-white/5 bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-400 rounded-full hover:bg-black/60 hover:text-primary transition-all group px-4 focus:ring-0 focus:ring-offset-0 focus:outline-none">
                      {(() => {
                        const active = PERSONAS.find(p => p.id === persona);
                        if (!active) {
                          return (
                            <>
                              <Bot className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" />
                              <span>Persona</span>
                            </>
                          );
                        }
                        return (
                          <>
                            <active.icon className={cn("w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform", active.color)} />
                            <span>{active.label}</span>
                          </>
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-white/10 min-w-[160px]" position="popper">
                      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 border-b border-white/5">AI Persona</div>
                      {PERSONAS.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          hideIndicator
                          className="w-full cursor-pointer py-3 px-3 mb-1 last:mb-0 rounded-xl border border-transparent focus:bg-white/5 data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary/50 data-[state=checked]:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                        >
                          <div className="flex flex-col items-start gap-1.5 w-full text-left">
                            <div className="flex items-center gap-2 w-full">
                              <p.icon className={cn("w-4 h-4", p.color)} />
                              <span className="font-bold tracking-wide uppercase text-[11px]">{p.label}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-normal leading-relaxed whitespace-normal normal-case tracking-normal line-clamp-2">
                              {p.description}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={lang} onValueChange={setLang} open={openSelect === 'lang'} onOpenChange={(open) => {
                    if (open) setOpenSelect('lang');
                    else if (openSelect === 'lang') setOpenSelect(null);
                  }}>
                    <SelectTrigger
                      ref={languageSelectRef}
                      className="w-auto h-9 border border-white/5 bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-400 rounded-full hover:bg-black/60 hover:text-primary transition-all group px-4 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                    >
                      <Globe className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" />
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-white/10 max-h-[300px]" position="popper">
                      {languages.map((language) => (
                        <SelectItem
                          key={language.code}
                          value={language.code}
                          hideIndicator
                          className="w-full cursor-pointer py-2.5 px-3 mb-1 last:mb-0 rounded-xl border border-transparent focus:bg-white/5 data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary/50 text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className={cn("inline-flex w-1.5 h-1.5 rounded-full", lang === language.code ? "bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" : "bg-zinc-600")} />
                            {language.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Input Section */}
              <div className="p-2 relative">
                <div className="relative flex items-center gap-2">
                  <div className={cn(
                    "relative flex-1 group/input flex transition-all duration-500",
                    isCompareMode ? "flex-col sm:flex-row gap-3" : "flex-row"
                  )}>
                    <div className="relative flex-1">
                      <input
                        autoFocus
                        placeholder={isCompareMode ? 'First topic...' : uploadedFile ? 'Add context for the file...' : 'What sparks your curiosity today?'}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className={cn(
                          "w-full h-16 rounded-3xl bg-black/40 px-8 text-zinc-100 outline-none placeholder:text-zinc-600 border border-white/5 focus:border-primary/50 focus:bg-black/60 transition-all text-lg font-medium",
                          !isCompareMode ? "pr-40" : "pr-8" // Add space for icons if needed
                        )}
                        disabled={isGenerating}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleInternalSubmit();
                        }}
                      />

                      {/* Integrated File Upload Badge for Single Mode */}
                      {!isCompareMode && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <AnimatePresence>
                            {pdfProgress ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                              >
                                <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30 h-9 px-3 rounded-xl backdrop-blur-sm gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-[10px] font-bold uppercase">
                                    {pdfProgress.total > 1 ? `Parsing ${pdfProgress.current}/${pdfProgress.total}` : 'Parsing...'}
                                  </span>
                                </Badge>
                              </motion.div>
                            ) : uploadedFile && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                              >
                                <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30 h-9 px-3 rounded-xl backdrop-blur-sm">
                                  <span className="max-w-[80px] truncate text-[10px] font-bold uppercase">{uploadedFile.name}</span>
                                  <button onClick={handleRemoveFile} className="ml-2 hover:text-white transition p-0.5 rounded-full hover:bg-white/10">
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFileIconClick}
                            disabled={isGenerating}
                            className="rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-white/10 transition-all duration-300 h-10 w-10 flex items-center justify-center p-0"
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isCompareMode && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1"
                      >
                        <input
                          placeholder="Second topic to compare..."
                          value={topic2}
                          onChange={(e) => setTopic2(e.target.value)}
                          className="w-full h-16 rounded-3xl bg-black/40 px-8 text-zinc-100 outline-none placeholder:text-zinc-600 border border-white/5 focus:border-primary/50 focus:bg-black/60 transition-all text-lg font-medium"
                          disabled={isGenerating}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInternalSubmit();
                          }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Main Submit Button - Integrated on the Right */}
                  <Button
                    onClick={handleInternalSubmit}
                    disabled={isGenerating || (!topic && !uploadedFile)}
                    className={cn(
                      "h-16 w-16 rounded-3xl bg-primary text-white hover:brightness-110 hover:scale-105 active:scale-95 transition-all font-bold shadow-lg shadow-primary/30 flex items-center justify-center p-0",
                    )}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <ArrowRight className="w-7 h-7" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,application/pdf,.txt,.md"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Loading state is now handled by target page skeletons (canvas/loading.tsx, etc.)

// ---------- ROOT COMPONENT ----------
export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lang, setLang] = useState('en');
  const [depth, setDepth] = useState('low');
  const [persona, setPersona] = useState('teacher');
  // Web search is now always enabled for real-time, grounded responses
  const useSearch = true;
  const languageSelectRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    const welcomeFlag = sessionStorage.getItem('welcome_back');
    if (welcomeFlag) {
      toast({
        title: 'Welcome!',
        description: 'You have been successfully logged in.',
      });
      sessionStorage.removeItem('welcome_back');
    }
  }, [toast]);

  useEffect(() => {
    // Definitive scroll lock for the home page to remove the vertical scrollbar
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);



  const handleGenerate = async (
    topic: string,
    fileInfo?: { name: string; type: string; content: string }
  ) => {
    // Navigate immediately. The target page (Canvas) will show the radial skeleton.
    setIsGenerating(true);

    // Check if user is searching for "MindScape" itself
    const normalizedTopic = topic.toLowerCase().trim();
    if ((normalizedTopic === 'mindscape' || normalizedTopic === 'mindscape core architecture') && !fileInfo) {
      // Redirect to mindmap page with special flag
      router.push(`/canvas?selfReference=true&lang=${lang}`);
      return;
    }

    if (fileInfo) {
      try {
        const timestamp = Date.now();
        const sessionId = `vision-${timestamp}`;
        const finalSessionType = fileInfo.type;
        const contentToStore = JSON.stringify({
          file: fileInfo.content,
          text: topic, // User-typed context
        });

        sessionStorage.setItem(`session-content-${sessionId}`, contentToStore);
        sessionStorage.setItem(`session-type-${sessionId}`, finalSessionType);
        sessionStorage.setItem(`session-persona-${sessionId}`, persona);

        router.push(`/canvas?sessionId=${sessionId}&lang=${lang}&depth=${depth}&persona=${persona}`);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'File Processing Error',
          description: error.message || 'Could not process the uploaded file.',
        });
        setIsGenerating(false);
      }
      return;
    }

    // Handle regular text-based generation
    const query = new URLSearchParams({ topic, lang, depth, persona, useSearch: useSearch.toString() }).toString();
    router.push(`/canvas?${query}`);
  };

  const handleCompare = (topic1: string, topic2: string) => {
    setIsGenerating(true);
    const query = new URLSearchParams({ topic1, topic2, lang, depth, persona, useSearch: useSearch.toString() }).toString();
    router.push(`/canvas?${query}`);
  };


  return (
    <div className="h-[calc(100dvh-5rem)] overflow-hidden flex flex-col">

      <Hero
        onGenerate={handleGenerate}
        onCompare={handleCompare}

        lang={lang}
        setLang={setLang}
        depth={depth}
        setDepth={setDepth}
        persona={persona}
        setPersona={setPersona}
        isGenerating={isGenerating}
        languageSelectRef={languageSelectRef}
        fileInputRef={fileInputRef}
      />

      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white shadow-lg transition-transform hover:scale-110"
        aria-label="Open AI Chat Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        topic="General Conversation"
      />
    </div>
  );
}
