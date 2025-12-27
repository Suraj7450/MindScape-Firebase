
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  lang,
  setLang,
  isGenerating,
  languageSelectRef,
  fileInputRef,
}: {
  onGenerate: (
    mode: string,
    topic1: string,
    topic2?: string,
    fileInfo?: { name: string; type: string }
  ) => void;
  lang: string;
  setLang: (lang: string) => void;
  isGenerating: boolean;
  languageSelectRef: React.RefObject<HTMLButtonElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  const [mode, setMode] = useState('single');
  const [topic, setTopic] = useState('');
  const [topic2, setTopic2] = useState('');
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
      onGenerate(mode, topic, undefined, uploadedFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFile]);

  const handleInternalSubmit = () => {
    if (mode === 'compare') {
      if (!topic || !topic2) return;
      onGenerate(mode, topic, topic2);
    } else {
      if (!topic && !uploadedFile) return;
      // For file uploads, generation is triggered by the useEffect
      if (!uploadedFile) {
        onGenerate(mode, topic, undefined, undefined);
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
    <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-heartbeat-pulse-grow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-heartbeat-pulse-grow" />
      </div>

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
          <span className="text-primary text-shadow-glow">a thought.</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          MindScape transforms your unstructured ideas into clear, explorable knowledge through intelligent AI-powered visualization.
        </p>

        <div className="w-full max-w-3xl mx-auto relative group">
          {/* Input Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

          <div className="relative rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-2xl p-2 shadow-2xl">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-4 pt-2">
                <ToggleTabs mode={mode} setMode={setMode} />
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger
                    ref={languageSelectRef}
                    className="w-[140px] h-9 border-none bg-white/5 text-xs text-zinc-300 rounded-full hover:bg-white/10 transition"
                  >
                    <Globe className="w-3.5 h-3.5 mr-2" />
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

              <div className="p-2">
                {mode === 'single' ? (
                  <div className="relative group/input">
                    <input
                      placeholder={uploadedFile ? 'Add context for your document...' : 'What sparks your curiosity?'}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full h-14 rounded-2xl bg-white/5 px-6 text-zinc-100 outline-none placeholder:text-zinc-500 border border-white/5 focus:border-primary/50 transition-all text-lg"
                      disabled={isGenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInternalSubmit();
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {uploadedFile && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30">
                          {uploadedFile.name}
                          <button onClick={handleRemoveFile} className="ml-2 hover:text-white transition">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleFileIconClick}
                        disabled={isGenerating}
                        className="rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/10 transition"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={handleInternalSubmit}
                        disabled={isGenerating || !!uploadedFile}
                        className="h-10 px-6 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all font-semibold shadow-lg shadow-primary/20"
                      >
                        {isGenerating ? '...' : <ArrowRight className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      placeholder="First concept"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="flex-1 h-14 rounded-2xl bg-white/5 px-6 text-zinc-100 outline-none placeholder:text-zinc-500 border border-white/5 focus:border-primary/50 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInternalSubmit();
                        }
                      }}
                    />
                    <div className="text-zinc-500 font-bold italic">VS</div>
                    <input
                      placeholder="Second concept"
                      value={topic2}
                      onChange={(e) => setTopic2(e.target.value)}
                      className="flex-1 h-14 rounded-2xl bg-white/5 px-6 text-zinc-100 outline-none placeholder:text-zinc-500 border border-white/5 focus:border-primary/50 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInternalSubmit();
                        }
                      }}
                    />
                    <Button
                      onClick={handleInternalSubmit}
                      disabled={isGenerating}
                      className="h-14 px-6 rounded-2xl bg-primary text-primary-foreground hover:brightness-110 transition-all font-semibold"
                    >
                      Compare
                    </Button>
                  </div>
                )}
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

function ToggleTabs({
  mode,
  setMode,
}: {
  mode: string;
  setMode: (m: string) => void;
}) {
  return (
    <div className="relative inline-flex rounded-2xl bg-zinc-900/70 p-1 ring-1 ring-white/10">
      <button
        onClick={() => setMode('single')}
        className={`relative z-10 rounded-xl px-4 py-2 text-sm transition ${mode === 'single' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
      >
        {mode === 'single' && (
          <motion.span
            layoutId="toggle-pill"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute inset-0 z-0 rounded-xl bg-zinc-800/80"
          />
        )}
        <span className="relative z-10">Single Topic</span>
      </button>
      <button
        onClick={() => setMode('compare')}
        className={`relative z-10 rounded-xl px-4 py-2 text-sm transition ${mode === 'compare' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
      >
        {mode === 'compare' && (
          <motion.span
            layoutId="toggle-pill"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute inset-0 z-0 rounded-xl bg-zinc-800/80"
          />
        )}
        <span className="relative z-10">Compare Concepts</span>
      </button>
    </div>
  );
}

// ---------- FEATURES ----------
function Features({ onDocMapClick }: { onDocMapClick: () => void }) {
  const router = useRouter();

  const items = [
    {
      icon: List,
      title: 'My Maps',
      desc: 'Access, manage, and revisit all of your saved mind maps in one place.',
      href: '/dashboard',
    },
    {
      icon: Bot,
      title: 'MindGPT',
      desc: 'A brainstorming copilot that expands, refines, and organizes your thoughts.',
      href: '/mind-gpt',
    },
    {
      icon: Globe,
      title: 'Public Maps',
      desc: 'Explore a gallery of mind maps created and shared by the community.',
      href: '/public-maps',
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
    mode: string,
    topic1: string,
    topic2?: string,
    fileInfo?: { name: string; type: string }
  ) => {
    setIsGenerating(true);

    // Check if user is searching for "MindScape" itself
    if (topic1.toLowerCase().trim() === 'mindscape' && !topic2 && !fileInfo) {
      // Redirect to mindmap page with special flag
      router.push(`/mindmap?selfReference=true&lang=${lang}`);
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

        if (file.type.startsWith('image/')) {
          sessionType = 'image';
          sessionContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
        } else if (file.type === 'application/pdf') {
          sessionType = 'pdf';
          const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument(arrayBuffer).promise;
          let textContent = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((s: any) => s.str).join(' ');
          }
          sessionContent = textContent;
        } else if (file.type.startsWith('text/')) {
          sessionType = 'text';
          sessionContent = await file.text();
        } else {
          throw new Error(
            'Unsupported file type. Please upload an image, PDF, or text file.'
          );
        }

        const timestamp = Date.now();
        const sessionId = `vision-${timestamp}`;
        const finalSessionType = sessionType === 'pdf' ? 'text' : sessionType;
        const contentToStore = JSON.stringify({
          file: sessionContent,
          text: topic1, // User-typed context
        });

        sessionStorage.setItem(`session-content-${sessionId}`, contentToStore);
        sessionStorage.setItem(`session-type-${sessionId}`, finalSessionType);



        router.push(`/mindmap?sessionId=${sessionId}&lang=${lang}`);
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
    let query;
    if (mode === 'compare' && topic2) {
      query = new URLSearchParams({ topic1, topic2, lang }).toString();
    } else {
      query = new URLSearchParams({ topic: topic1, lang }).toString();
    }
    router.push(`/mindmap?${query}`);
  };



  const handleDocMapClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Hero
        onGenerate={handleGenerate}
        lang={lang}
        setLang={setLang}
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
