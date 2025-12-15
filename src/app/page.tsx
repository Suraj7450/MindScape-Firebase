
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
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';
import { ChatPanel } from '@/components/chat-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;



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
    <section className="relative mx-auto max-w-6xl px-4 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mt-12 grid grid-cols-1 md:grid-cols-10 items-center gap-8">
          <div className="md:col-span-6">
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl text-center whitespace-nowrap mb-4">
              Visualize Smarter.
              <br />
              <span className="text-purple-400">Think Faster.</span>
            </h1>

            <p className="text-zinc-400 text-lg md:text-xl text-center mb-10 max-w-lg mx-auto">
              Turn curiosity into structured knowledge using AI-powered mind maps.
            </p>

            <div className="w-full max-w-2xl mx-auto rounded-2xl border border-white/5 bg-zinc-900/60 backdrop-blur-xl p-4 shadow-xl">
              <div className="flex justify-center">
                <ToggleTabs mode={mode} setMode={setMode} />
              </div>

              <div className="mt-4">
                {mode === 'single' ? (
                  <div className="rounded-xl bg-zinc-950/50 p-2 ring-1 ring-white/5 flex items-center gap-2 pr-2 shadow-[inset_0_0_8px_rgba(168,85,247,0.2)]">
                    <input
                      placeholder={
                        uploadedFile
                          ? 'Add context for your document...'
                          : 'What sparks your curiosity?'
                      }
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full rounded-lg bg-transparent px-4 py-3 text-zinc-200 outline-none placeholder:text-zinc-500 focus:ring-0"
                      disabled={isGenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInternalSubmit();
                        }
                      }}
                    />
                    {uploadedFile && (
                      <Badge variant="secondary" className="flex-shrink-0">
                        {uploadedFile.name}
                        <button
                          onClick={handleRemoveFile}
                          className="ml-2 rounded-full hover:bg-white/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}


                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleFileIconClick}
                      disabled={isGenerating}
                      className="flex-shrink-0 text-zinc-400 hover:text-zinc-200"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf,.txt,.md"
                      disabled={isGenerating}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl bg-zinc-950/50 p-2 ring-1 ring-white/5 shadow-[inset_0_0_8px_rgba(168,85,247,0.2)]">
                      <input
                        placeholder="First concept"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full rounded-lg bg-transparent px-4 py-3 text-zinc-200 outline-none placeholder:text-zinc-500 focus:ring-0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInternalSubmit();
                          }
                        }}
                      />
                    </div>
                    <span className="font-semibold text-zinc-400">VS</span>
                    <div className="flex-1 rounded-xl bg-zinc-950/50 p-2 ring-1 ring-white/5 shadow-[inset_0_0_8px_rgba(168,85,247,0.2)]">
                      <input
                        placeholder="Second concept"
                        value={topic2}
                        onChange={(e) => setTopic2(e.target.value)}
                        className="w-full rounded-lg bg-transparent px-4 py-3 text-zinc-200 outline-none placeholder:text-zinc-500 focus:ring-0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInternalSubmit();
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>



              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={handleInternalSubmit}
                  disabled={isGenerating || !!uploadedFile}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  {isGenerating
                    ? 'Generating...'
                    : uploadedFile
                      ? 'Processing File...'
                      : mode === 'compare'
                        ? 'Generate Comparison'
                        : 'Generate Mind Map'}
                </Button>
                <div>
                  <Select value={lang} onValueChange={setLang}>
                    <SelectTrigger
                      ref={languageSelectRef}
                      className="w-[180px] rounded-xl bg-zinc-800/60 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 focus:ring-purple-500"
                    >
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism">
                      {languages.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center md:col-span-4 relative">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15),transparent_60%)] blur-3xl animate-heartbeat-pulse-grow" />
            <div className="relative w-full max-w-sm aspect-square">
              <Image
                src="/MindScape-Logo.png"
                alt="MindScape Logo"
                fill={true}
                priority={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="drop-shadow-[0_0_70px_hsl(var(--primary)/0.5)]"
              />
            </div>
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
    <section className="mt-24 text-center max-w-3xl mx-auto px-6">
      <h2 className="text-3xl font-semibold text-white">
        Everything starts with a <span className="text-purple-400">thought.</span>
      </h2>

      <p className="mt-4 text-zinc-400 leading-relaxed text-lg">
        MindScape helps you turn unstructured ideas into clear,
        explorable knowledge through intelligent visualization.
      </p>
    </section>
  );
}

// ---------- CAPABILITY STRIP ----------
function CapabilityStrip() {
  const capabilities = [
    {
      icon: Sparkles,
      title: "AI Generation",
      desc: "Instant structured maps"
    },
    {
      icon: GitBranch,
      title: "Nested Exploration",
      desc: "Unlimited depth"
    },
    {
      icon: ImageIcon,
      title: "Visual Learning",
      desc: "AI-generated imagery"
    },
    {
      icon: Scan,
      title: "Vision Mode",
      desc: "Docs → maps instantly"
    },
  ];

  return (
    <div className="mt-16 mb-24 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {capabilities.map((cap, i) => (
        <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-white/5 transition-colors">
          <div className="p-3 rounded-full bg-zinc-900 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.15)] mb-3">
            <cap.icon className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">{cap.title}</h3>
          <p className="text-sm text-zinc-500">{cap.desc}</p>
        </div>
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
