
'use client';

import { useState, useRef, createRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Paperclip,
  X,
  List,
  ArrowRight,
  Globe,
  GitBranch,
  Scan,
  Zap,
  Image as ImageIcon,
  Loader2,
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
import Image from 'next/image';
import dynamic from 'next/dynamic';

const ChatPanel = dynamic(() => import('@/components/chat-panel').then(mod => mod.ChatPanel), {
  ssr: false,
  loading: () => null
});
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';



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
}) {
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

  // Trigger generation when a file is uploaded
  useEffect(() => {
    if (uploadedFile) {
      onGenerate(topic, uploadedFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFile]);

  const handleInternalSubmit = () => {
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
    <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 overflow-hidden">
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
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-full border border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-full text-[10px] font-bold tracking-widest uppercase px-5 h-8 transition-all duration-300",
                      !isCompareMode ? "bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    onClick={() => setIsCompareMode(false)}
                  >
                    Single Topic
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-full text-[10px] font-bold tracking-widest uppercase px-5 h-8 transition-all duration-300",
                      isCompareMode ? "bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    onClick={() => setIsCompareMode(true)}
                  >
                    Compare Mode
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={depth} onValueChange={setDepth}>
                    <SelectTrigger className="w-auto min-w-[100px] h-8 border border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-widest text-zinc-400 rounded-full hover:bg-black/60 transition group">
                      <List className="w-3 h-3 mr-2 group-hover:text-primary transition-colors" />
                      <SelectValue placeholder="Depth" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-white/10">
                      <SelectItem value="low" className="text-xs">Quick</SelectItem>
                      <SelectItem value="medium" className="text-xs">Balanced</SelectItem>
                      <SelectItem value="deep" className="text-xs">Detailed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={lang} onValueChange={setLang}>
                    <SelectTrigger
                      ref={languageSelectRef}
                      className="w-auto min-w-[110px] h-8 border border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-widest text-zinc-400 rounded-full hover:bg-black/60 transition group"
                    >
                      <Globe className="w-3 h-3 mr-2 group-hover:text-primary transition-colors" />
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-white/10">
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



// ---------- FEATURES ----------
function Features({ onDocMapClick }: { onDocMapClick: () => void }) {
  const router = useRouter();

  const items = [
    {
      icon: List,
      title: 'Library',
      desc: 'Access, manage, and revisit all of your saved mind maps in one place.',
      href: '/library',
    },
    {
      icon: Globe,
      title: 'Community Maps',
      desc: 'Explore a gallery of mind maps created and shared by the community.',
      href: '/community',
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 pb-24">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative h-full"
          >
            <div
              className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg hover:border-purple-400/30 hover:shadow-[0_0_35px_rgba(168,85,247,0.2)] transition-all duration-300 ease-out h-full flex flex-col hover:-translate-y-1"
              onClick={() => {
                if (card.href) {
                  router.push(card.href);
                }
              }}
              style={{ cursor: (card.href) ? 'pointer' : 'default' }}
            >
              <div className="flex items-center gap-3">
                <div className={'cursor-default'}>
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-b from-purple-600/30 to-purple-900/20 border border-purple-500/30 group-hover:scale-110 transition duration-300">
                    <card.icon className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-white">
                  {card.title}
                </h4>
              </div>

              <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                {card.desc}
              </p>

              <div className="self-end mt-auto pt-4">
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}


// ---------- TRANSITION SECTION ----------
function TransitionSection() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Unleash the Power of <br />
          <span className="text-primary">Visual Thinking</span>
        </h2>
        <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          Break through cognitive barriers. Our AI-driven engine maps out complex topics in seconds,
          allowing you to see the big picture and the smallest details simultaneously.
        </p>
      </div>
    </section>
  );
}

// ---------- CAPABILITY STRIP ----------
function CapabilityStrip() {
  const capabilities = [
    {
      icon: Sparkles,
      title: "AI Generation",
      desc: "Deep-layered maps from simple prompts"
    },
    {
      icon: GitBranch,
      title: "Nested Exploration",
      desc: "Infinite depth for complex subjects"
    },
    {
      icon: ImageIcon,
      title: "Visual Assets",
      desc: "AI-curated imagery for context"
    },
    {
      icon: Scan,
      title: "Vision Mode",
      desc: "Convert papers & images to maps"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
      {capabilities.map((cap, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="group relative flex flex-col items-center text-center p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
          <div className="relative z-10 w-16 h-16 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 mb-6 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300 shadow-xl">
            <cap.icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="relative z-10 text-lg font-bold text-white mb-2">{cap.title}</h3>
          <p className="relative z-10 text-sm text-zinc-500 leading-relaxed">{cap.desc}</p>
        </motion.div>
      ))}
    </div>
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

        router.push(`/canvas?sessionId=${sessionId}&lang=${lang}&depth=${depth}`);
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
    const query = new URLSearchParams({ topic, lang, depth }).toString();
    router.push(`/canvas?${query}`);
  };

  const handleCompare = (topic1: string, topic2: string) => {
    setIsGenerating(true);
    const query = new URLSearchParams({ topic1, topic2, lang, depth }).toString();
    router.push(`/canvas?${query}`);
  };

  const handleDocMapClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Hero
        onGenerate={handleGenerate}
        onCompare={handleCompare}
        lang={lang}
        setLang={setLang}
        depth={depth}
        setDepth={setDepth}
        isGenerating={isGenerating}
        languageSelectRef={languageSelectRef}
        fileInputRef={fileInputRef}
      />

      <TransitionSection />
      <CapabilityStrip />

      <Features onDocMapClick={handleDocMapClick} />

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
    </>
  );
}
