
'use client';

import { useState, useRef, createRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Zap as ZapIcon,
  Palette,
  Brain,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { languages } from '@/lib/languages';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';
import { useAIConfig } from '@/contexts/ai-config-context';
import { TRIGGER_ONBOARDING_EVENT } from '@/components/onboarding-wizard';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const ChatPanel = dynamic(() => import('@/components/chat-panel').then(mod => mod.ChatPanel), {
  ssr: false,
  loading: () => null
});



// ---------- HERO ----------
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
    fileInfo?: { name: string; type: string }
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
  const [topic, setTopic] = useState('');
  const [topic2, setTopic2] = useState('');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: string;
  } | null>(null);

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

    // Set file info to state and let useEffect trigger generation
    setUploadedFile({ name: file.name, type: file.type });
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-[58px] pb-0 overflow-hidden">
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

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Everything starts with <br />
          <span className="text-primary">a thought.</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          MindScape transforms your unstructured ideas into clear, explorable knowledge through intelligent AI-powered visualization.
        </p>

        <div className="w-full max-w-3xl mx-auto relative group">
          {/* Input Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />

          <div className="relative rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-3xl p-3 shadow-2xl ring-1 ring-white/10">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-4 pt-1">
                <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-full border border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-full text-[10px] font-bold tracking-widest uppercase px-4 h-7 transition-all duration-300",
                      !isCompareMode ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    onClick={() => setIsCompareMode(false)}
                  >
                    Single
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-full text-[10px] font-bold tracking-widest uppercase px-4 h-7 transition-all duration-300",
                      isCompareMode ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    onClick={() => setIsCompareMode(true)}
                  >
                    Compare
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={depth} onValueChange={setDepth}>
                    <SelectTrigger className="w-auto h-8 border border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-widest text-zinc-400 rounded-full hover:bg-black/60 transition group px-3">
                      <List className="w-3 h-3 mr-2 group-hover:text-primary transition-colors" />
                      <SelectValue placeholder="Depth" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-white/10">
                      <SelectItem value="low" className="text-xs">Quick</SelectItem>
                      <SelectItem value="medium" className="text-xs">Balanced</SelectItem>
                      <SelectItem value="deep" className="text-xs">Detailed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={persona} onValueChange={setPersona}>
                    <SelectTrigger className="w-auto h-8 border border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-widest text-zinc-400 rounded-full hover:bg-black/60 transition group px-3">
                      <Bot className="w-3 h-3 mr-2 group-hover:text-primary transition-colors" />
                      <SelectValue placeholder="Persona" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-white/10">
                      <SelectItem value="teacher" className="text-xs">
                        <div className="flex items-center gap-2">
                          <UserRound className="w-3 h-3 text-blue-400" />
                          <span>Teacher</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="concise" className="text-xs">
                        <div className="flex items-center gap-2">
                          <ZapIcon className="w-3 h-3 text-amber-400" />
                          <span>Concise</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="creative" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Palette className="w-3 h-3 text-pink-400" />
                          <span>Creative</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sage" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Brain className="w-3 h-3 text-purple-400" />
                          <span>Cognitive Sage</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={lang} onValueChange={setLang}>
                    <SelectTrigger
                      ref={languageSelectRef}
                      className="w-auto h-8 border border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-widest text-zinc-400 rounded-full hover:bg-black/60 transition group px-3"
                    >
                      <Globe className="w-3 h-3 mr-2 group-hover:text-primary transition-colors" />
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-white/10 max-h-[300px]">
                      {languages.map((language) => (
                        <SelectItem key={language.code} value={language.code} className="text-xs">
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-1">
                <div className="relative group/input flex gap-3">
                  <div className={cn("flex flex-1 gap-3", isCompareMode ? "flex-col sm:flex-row" : "flex-row")}>
                    <div className="flex-1 relative">
                      <input
                        placeholder={isCompareMode ? 'First topic...' : uploadedFile ? 'Add context...' : 'What sparks your curiosity?'}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full h-14 rounded-2xl bg-black/40 px-6 text-zinc-100 outline-none placeholder:text-zinc-600 border border-white/5 focus:border-primary/40 focus:bg-black/60 transition-all text-base font-medium pr-12"
                        disabled={isGenerating}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleInternalSubmit();
                        }}
                      />
                      {!isCompareMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleFileIconClick}
                          disabled={isGenerating}
                          className="absolute right-2 top-1/2 -translate-y-1/2 hover:-translate-y-1/2 rounded-xl text-zinc-500 hover:text-primary hover:bg-primary/10 transition-all duration-200 h-10 w-10 flex items-center justify-center shadow-none"
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      )}
                    </div>

                    {isCompareMode && (
                      <input
                        placeholder="Second topic to compare..."
                        value={topic2}
                        onChange={(e) => setTopic2(e.target.value)}
                        className="flex-1 h-14 rounded-2xl bg-black/40 px-6 text-zinc-100 outline-none placeholder:text-zinc-600 border border-white/5 focus:border-primary/40 focus:bg-black/60 transition-all text-base font-medium animate-in fade-in slide-in-from-left-2 duration-300"
                        disabled={isGenerating}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleInternalSubmit();
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadedFile && (
                      <Badge variant="secondary" className="hidden lg:flex bg-primary/20 text-primary-foreground border-primary/30 h-10 px-4 rounded-xl">
                        <span className="max-w-[100px] truncate">{uploadedFile.name}</span>
                        <button onClick={handleRemoveFile} className="ml-2 hover:text-white transition">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    <Button
                      onClick={handleInternalSubmit}
                      disabled={isGenerating || (!!uploadedFile && !topic)}
                      className="h-14 w-14 rounded-2xl bg-primary text-white hover:brightness-110 hover:scale-105 active:scale-95 transition-all font-bold shadow-lg shadow-primary/30 flex items-center justify-center p-0"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <ArrowRight className="w-6 h-6" />
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
          </div>
        </div>
      </motion.div>
    </section>
  );
}






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
  const languageSelectRef = createRef<HTMLButtonElement>();
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
    fileInfo?: { name: string; type: string }
  ) => {
    setIsGenerating(true);

    // Check if user is searching for "MindScape" itself
    if (topic.toLowerCase().trim() === 'mindscape' && !fileInfo) {
      // Redirect to mindmap page with special flag
      router.push(`/canvas?selfReference=true&lang=${lang}`);
      return;
    }

    if (fileInfo) {
      const file = fileInputRef.current?.files?.[0];

      if (!file) {
        toast({
          variant: 'destructive',
          title: 'File Error',
          description: 'Could not find the uploaded file. Please try again.',
        });
        setIsGenerating(false);
        return;
      }

      try {
        let sessionType: 'image' | 'text' | 'pdf';
        let sessionContent: string;

        if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name)) {
          sessionType = 'image';
          sessionContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
          sessionContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
        } else if (file.type.startsWith('text/') || /\.(txt|md|js|ts|json)$/i.test(file.name)) {
          sessionType = 'text';
          sessionContent = await file.text();
        } else {
          throw new Error(
            'Unsupported file type. Please upload an image, PDF, or text file.'
          );
        }

        const timestamp = Date.now();
        const sessionId = `vision-${timestamp}`;
        const finalSessionType = sessionType; // Keep 'pdf'
        const contentToStore = JSON.stringify({
          file: sessionContent,
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
