
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, User, Bot, X, Wand2, HelpCircle, FileQuestion, TestTube2, GitCompareArrows, Save, Plus, History, ArrowLeft, MessageSquare, Trash2, Copy, Check, RefreshCw, Sparkles, GraduationCap, Zap, Palette, Mic, MicOff, Download, Eraser, Github } from 'lucide-react';
import { chatAction, summarizeChatAction } from '@/app/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatText } from '@/lib/utils';
import { Separator } from './ui/separator';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Represents a single message in the chat.
 */
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Represents a full chat session.
 */
interface ChatSession {
  id: string;
  topic: string;
  messages: Message[];
  timestamp: number;
}

type Persona = 'standard' | 'teacher' | 'concise' | 'creative';

const personas: { id: Persona; label: string; icon: any; color: string }[] = [
  { id: 'standard', label: 'Standard', icon: Sparkles, color: 'text-blue-400' },
  { id: 'teacher', label: 'Teacher', icon: GraduationCap, color: 'text-yellow-400' },
  { id: 'concise', label: 'Concise', icon: Zap, color: 'text-orange-400' },
  { id: 'creative', label: 'Creative', icon: Palette, color: 'text-pink-400' },
];

/**
 * Props for the ChatPanel component.
 */
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  initialMessage?: string;
}

const allSuggestionPrompts = [
  // Science & Tech
  { icon: Wand2, text: 'Generate a mind map about space exploration', color: 'text-purple-400' },
  { icon: GitCompareArrows, text: 'Compare AI vs Machine Learning', color: 'text-blue-400' },
  { icon: TestTube2, text: 'Quiz me on world history', color: 'text-green-400' },
  { icon: HelpCircle, text: 'Explain quantum computing simply', color: 'text-yellow-400' },
  { icon: Zap, text: 'Explain the theory of relativity', color: 'text-orange-400' },
  { icon: TestTube2, text: 'How does photosynthesis work?', color: 'text-green-500' },
  { icon: Github, text: 'Explain Blockchain technology', color: 'text-gray-400' }, // Assuming Github icon available or use generic

  // Creative & Ideas
  { icon: Palette, text: 'Brainstorm marketing ideas for a coffee shop', color: 'text-pink-400' },
  { icon: Sparkles, text: 'Write a short story about a time traveler', color: 'text-purple-300' },
  { icon: Wand2, text: 'Design a workout routine for beginners', color: 'text-blue-300' },
  { icon: GraduationCap, text: 'Give me 5 study tips for exams', color: 'text-yellow-500' },

  // Philosophy & Soft Skills
  { icon: HelpCircle, text: 'What is the philosophy of Stoicism?', color: 'text-orange-300' },
  { icon: GitCompareArrows, text: 'Analyze the pros and cons of remote work', color: 'text-blue-500' },
  { icon: Zap, text: 'How to improve public speaking skills?', color: 'text-yellow-300' },

  // Fun & Random
  { icon: Wand2, text: 'Suggest a creative hobby to start', color: 'text-pink-500' },
  { icon: Sparkles, text: 'Plan a 3-day trip to Japan', color: 'text-red-400' },
  { icon: TestTube2, text: 'Fun facts about the deep ocean', color: 'text-cyan-400' },
];

/**
 * A slide-out chat panel for interacting with an AI assistant with session management.
 */
export function ChatPanel({
  isOpen,
  onClose,
  topic,
  initialMessage,
}: ChatPanelProps) {
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chat-sessions', []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [persona, setPersona] = useState<Persona>('standard');
  const [isListening, setIsListening] = useState(false);
  const [displayedPrompts, setDisplayedPrompts] = useState(allSuggestionPrompts.slice(0, 4));

  const { toast } = useToast();
  const { user, firestore } = useFirebase();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitialMessage = useRef(false);

  // Load persona preference from user profile
  useEffect(() => {
    const loadPersonaPreference = async () => {
      if (!user || !firestore) return;

      try {
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const prefs = docSnap.data().preferences;
          const savedPersona = prefs?.defaultAIPersona?.toLowerCase() as Persona;
          if (savedPersona && ['standard', 'teacher', 'concise', 'creative'].includes(savedPersona)) {
            setPersona(savedPersona);
          }
        }
      } catch (error) {
        console.error('Error loading persona preference:', error);
      }
    };

    if (isOpen) {
      loadPersonaPreference();
    }
  }, [isOpen, user, firestore]);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const messages = activeSession?.messages ?? [];

  // Shuffle prompts when starting a fresh 'General Conversation' chat
  useEffect(() => {
    if (activeSessionId && activeSession?.topic === 'General Conversation' && activeSession.messages.length === 0) {
      const shuffled = [...allSuggestionPrompts].sort(() => 0.5 - Math.random());
      setDisplayedPrompts(shuffled.slice(0, 4));
    }
  }, [activeSessionId, activeSession?.topic, activeSession?.messages.length]);

  /**
   * Scrolls the chat view to the bottom.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Summarize chat to generate a topic title
  useEffect(() => {
    if (
      activeSession &&
      activeSession.topic === 'General Conversation' &&
      activeSession.messages.length >= 2 &&
      !isLoading
    ) {
      const sessionIdToUpdate = activeSession.id;
      summarizeChatAction({ history: activeSession.messages.slice(0, 4) })
        .then(({ summary, error }) => {
          if (summary && !error) {
            setSessions(prev => prev.map(s =>
              s.id === sessionIdToUpdate ? { ...s, topic: summary.topic } : s
            ));
          }
        });
    }
  }, [activeSession?.messages.length, isLoading, activeSession?.topic, activeSession?.id, setSessions]);


  /**
   * Finds or creates a session for the current topic.
   */
  useEffect(() => {
    if (isOpen) {
      const existingSession = sessions.find(s => s.topic === topic);
      if (existingSession) {
        setActiveSessionId(existingSession.id);
      } else {
        startNewChat(topic);
      }
      setView('chat'); // Always default to chat view on open
    } else {
      // Reset flags when closed
      hasSentInitialMessage.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, topic]);

  /**
   * Handles sending an initial message if one is provided.
   */
  useEffect(() => {
    if (isOpen && initialMessage && !hasSentInitialMessage.current && activeSession) {
      handleSend(initialMessage);
      hasSentInitialMessage.current = true;
    }
  }, [isOpen, initialMessage, activeSession]);


  /**
   * Starts a new chat session.
   */
  const startNewChat = (newTopic: string = 'General Conversation') => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      topic: newTopic,
      messages: [],
      timestamp: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setView('chat');
  };

  /**
   * Exports the current chat session to a PDF file.
   */
  const exportChatToPDF = async () => {
    if (!activeSession) return;

    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Helper function to clean markdown and emojis from text
      const cleanText = (text: string): string => {
        return text
          // Remove emojis and special unicode characters
          .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
          // Remove markdown bold
          .replace(/\*\*(.+?)\*\*/g, '$1')
          // Remove markdown italic
          .replace(/\*(.+?)\*/g, '$1')
          // Remove markdown code
          .replace(/`(.+?)`/g, '$1')
          // Remove markdown headers
          .replace(/^#{1,6}\s+/gm, '')
          // Clean up bullet points
          .replace(/^[\*\-]\s+/gm, '• ')
          // Clean up numbered lists
          .replace(/^\d+\.\s+/gm, '')
          // Remove extra whitespace
          .replace(/\s+/g, ' ')
          .trim();
      };

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('MindScape Chat Export', 105, 20, { align: 'center' });

      // Metadata box
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, 28, 180, 16);
      doc.text(`Topic: ${activeSession.topic}`, 20, 34);
      doc.text(`Date: ${new Date(activeSession.timestamp).toLocaleString()}`, 20, 40);

      // Messages
      let yPosition = 55;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      activeSession.messages.forEach((msg, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Role label with background
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const roleLabel = msg.role === 'user' ? 'You' : 'MindScape AI';
        const roleColor = msg.role === 'user' ? [59, 130, 246] : [168, 85, 247]; // blue or purple

        // Draw role badge
        doc.setFillColor(roleColor[0], roleColor[1], roleColor[2]);
        doc.roundedRect(margin, yPosition - 4, 35, 7, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(roleLabel, margin + 2, yPosition);
        doc.setTextColor(0, 0, 0);

        yPosition += 10;

        // Message content - clean and format
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Clean the message content
        const cleanedContent = cleanText(msg.content);

        // Split into paragraphs
        const paragraphs = cleanedContent.split('\n').filter(p => p.trim());

        paragraphs.forEach((paragraph) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          // Handle bullet points
          const isBullet = paragraph.trim().startsWith('•');
          const indent = isBullet ? margin + 5 : margin;
          const textWidth = isBullet ? maxWidth - 5 : maxWidth;

          const lines = doc.splitTextToSize(paragraph, textWidth);

          lines.forEach((line: string, lineIndex: number) => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }

            doc.text(line, indent, yPosition);
            yPosition += 5;
          });

          yPosition += 2; // Small gap between paragraphs
        });

        // Add separator between messages
        yPosition += 3;
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
      });

      // Footer on last page
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${totalPages} • Generated by MindScape`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      doc.save(`mindscape-chat-${activeSession.topic.replace(/\s+/g, '-').toLowerCase()}.pdf`);

      toast({ title: 'Exported', description: 'Chat history downloaded as PDF.' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Could not generate PDF. Please try again.'
      });
    }
  };

  /**
   * Sends a message to the AI assistant and updates the current session.
   */
  const handleSend = async (messageToSend?: string) => {
    const content = (messageToSend || input).trim();
    if (!content || !activeSessionId) return;

    const newMessage: Message = { role: 'user', content };

    // Update the state optimistically
    const currentMessages = activeSession?.messages ?? [];
    const updatedMessages = [...currentMessages, newMessage];

    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, messages: updatedMessages, timestamp: Date.now() }
        : s
    ));

    if (!messageToSend) {
      setInput('');
    }
    setIsLoading(true);

    // Prepare history (last 10 messages)
    const history = updatedMessages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const { response, error } = await chatAction({
      question: content,
      topic,
      history,
      persona
    });
    setIsLoading(false);

    const assistantMessage: Message = {
      role: 'assistant',
      content: error ? `Sorry, I ran into an error: ${error}` : response!.answer,
    };

    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, messages: [...updatedMessages, assistantMessage] }
        : s
    ));
  };

  /**
   * Copies a message to clipboard.
   */
  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast({
        title: 'Copied!',
        description: 'Response copied to clipboard.',
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
      });
    }
  };

  /**
   * Regenerates the last assistant response.
   */
  const handleRegenerate = async (index: number) => {
    if (!activeSessionId || !activeSession) return;

    // Find the user message that prompted this response
    const userMessageIndex = index - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') return;

    const userMessage = messages[userMessageIndex].content;

    // Remove the assistant message we're regenerating
    const updatedMessages = messages.slice(0, index);
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, messages: updatedMessages }
        : s
    ));

    setIsLoading(true);
    const { response, error } = await chatAction({
      question: userMessage,
      topic,
      persona
    });
    setIsLoading(false);

    const newAssistantMessage: Message = {
      role: 'assistant',
      content: error ? `Sorry, I ran into an error: ${error}` : response!.answer,
    };

    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, messages: [...updatedMessages, newAssistantMessage] }
        : s
    ));
  };

  /**
   * Selects a session from the history view.
   */
  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setView('chat');
  }

  /**
   * Deletes a chat session from history.
   */
  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();

    // Use callback form to ensure we have the latest state
    setSessions(prevSessions => {
      const remainingSessions = prevSessions.filter(s => s.id !== sessionId);

      // If we deleted the active session, switch to another one
      if (activeSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          // Switch to the most recent remaining session
          setActiveSessionId(remainingSessions[0].id);
        } else {
          // No sessions left, create a new one
          setActiveSessionId(null);
          // Use setTimeout to ensure state update completes first
          setTimeout(() => startNewChat(), 0);
        }
      }

      return remainingSessions;
    });
  }

  /**
   * Handles voice input using Web Speech API.
   */
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        variant: 'destructive',
        title: 'Not supported',
        description: 'Voice input is not supported in this browser.',
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: 'Listening...',
        description: 'Speak now.',
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not recognize speech.',
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };


  const renderChatView = () => (
    <>
      <ScrollArea className="flex-grow px-4">
        <div className="flex flex-col gap-4 py-4">
          {messages.length === 0 && topic === 'General Conversation' && (
            <div className="text-center p-4 relative">
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 rounded-full bg-gradient-to-r from-purple-500/15 via-blue-500/15 to-pink-500/15 blur-3xl animate-pulse-glow" />
              </div>

              {/* Floating Bot Avatar */}
              <div className="relative z-10">
                <Avatar className="h-16 w-16 border-2 border-primary mx-auto mb-4 shadow-lg shadow-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-9 w-9" />
                  </AvatarFallback>
                </Avatar>

                {/* Greeting with fade-in animation */}
                <h2 className="text-2xl font-bold mb-6 animate-fade-in bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                  How can I help you?
                </h2>
              </div>

              {/* Quick Resume Cards */}
              {sessions.filter(s => s.topic !== 'General Conversation' && s.messages.length > 0).length > 0 && (
                <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium text-left">Jump back in</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sessions
                      .filter(s => s.id !== activeSessionId && s.messages.length > 0 && s.topic !== 'General Conversation')
                      .slice(0, 2)
                      .map(session => (
                        <button
                          key={session.id}
                          onClick={() => selectSession(session.id)}
                          className="text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all group hover:scale-[1.02] hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <History className="h-3 w-3 text-primary" />
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(session.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {session.topic}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Enhanced Suggestion Cards */}
              <p className="text-sm text-muted-foreground/80 uppercase tracking-wider mb-4 font-semibold text-left animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>Try asking...</p>
              <div className="grid grid-cols-1 gap-4 text-sm">
                {displayedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(prompt.text)}
                    className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 bg-gradient-to-br from-secondary/30 to-secondary/10 border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.03] hover:-translate-y-1 animate-fade-in"
                    style={{ animationDelay: `${0.3 + index * 0.1}s`, animationFillMode: 'both' }}
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    {/* Content */}
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/25 to-primary/10 group-hover:scale-110 transition-transform shadow-lg ring-1 ring-white/5",
                        prompt.color
                      )}>
                        <prompt.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-relaxed">
                          {prompt.text}
                        </p>
                      </div>
                      <Send className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'rounded-lg max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary/80 rounded-bl-none'
                )}
              >
                <div className="p-3">
                  <div
                    className="text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatText(message.content) }}
                  />

                </div>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 px-3 pb-2 pt-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-secondary"
                            onClick={() => handleCopy(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{copiedIndex === index ? 'Copied!' : 'Copy'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-secondary"
                            onClick={() => handleRegenerate(index)}
                            disabled={isLoading}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Regenerate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
          {isLoading && (
            <div className="flex items-center gap-3 justify-start">
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="p-3 rounded-lg bg-secondary/80 rounded-bl-none">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="px-4 pb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-grow">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask a question..."}
              disabled={isLoading}
              className={cn("glassmorphism pr-10", isListening && "border-primary ring-1 ring-primary")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent",
                isListening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={handleVoiceInput}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </>
  );

  const renderHistoryView = () => {
    const filteredSessions = sessions.filter(s => s.topic !== 'General Conversation');

    return (
      <ScrollArea className="flex-grow p-4">
        <div className="flex flex-col gap-3">
          {filteredSessions.length > 0 ? (
            filteredSessions.map(session => (
              <div
                key={session.id}
                onClick={() => selectSession(session.id)}
                className="relative group p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-lg hover:border-purple-400/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <p className="font-semibold text-white truncate">
                      {session.topic}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(session.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={(e) => deleteSession(e, session.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <p>No chat history yet.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };


  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 glassmorphism [&>button]:hidden">
        <div className="flex justify-between items-center p-2 border-b">
          <div className="flex items-center gap-1">
            {view === 'history' && activeSession && (
              <Button variant="ghost" size="icon" onClick={() => setView('chat')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <SheetTitle className="text-lg font-semibold pl-2">
              {view === 'history' ? 'Chat History' : activeSession?.topic ?? 'AI Chat'}
            </SheetTitle>
          </div>
          <div className='flex items-center gap-1'>
            {view === 'chat' && (
              <>
                {/* Persona Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={personas.find(p => p.id === persona)?.color}>
                      {(() => {
                        const p = personas.find(p => p.id === persona);
                        const Icon = p?.icon || Sparkles;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {personas.map((p) => (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => setPersona(p.id)}
                        className="gap-2"
                      >
                        <p.icon className={cn("h-4 w-4", p.color)} />
                        <span>{p.label}</span>
                        {persona === p.id && <Check className="h-3 w-3 ml-auto" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* PDF Export Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={exportChatToPDF}
                        disabled={!activeSession || messages.length === 0}
                      >
                        <Download className="h-5 w-5" />
                        <span className="sr-only">Export to PDF</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Export to PDF</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Clear Chat Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (activeSessionId) {
                            setSessions(prev => prev.map(s =>
                              s.id === activeSessionId ? { ...s, messages: [] } : s
                            ));
                            toast({ title: 'Chat cleared', description: 'Messages have been cleared.' });
                          }
                        }}
                        disabled={!activeSession || messages.length === 0}
                      >
                        <Eraser className="h-5 w-5" />
                        <span className="sr-only">Clear Chat</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Clear Chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button variant="ghost" size="icon" onClick={() => setView('history')}>
                  <History className="h-5 w-5" />
                  <span className="sr-only">Chat History</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startNewChat(topic)}>
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">New Chat</span>
                </Button>
              </>
            )}
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </div>

        {view === 'chat' ? renderChatView() : renderHistoryView()}

      </SheetContent>
    </Sheet>
  );
}
