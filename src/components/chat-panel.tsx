
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
import { Loader2, Send, User, Bot, X, Wand2, HelpCircle, FileQuestion, TestTube2, GitCompareArrows, Save, Plus, History, ArrowLeft, MessageSquare, Trash2, Copy, Check, RefreshCw, Sparkles, GraduationCap, Zap, Palette, Mic, MicOff, Download, Eraser } from 'lucide-react';
import { chatAction, summarizeChatAction } from '@/app/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatText } from '@/lib/utils';
import { Separator } from './ui/separator';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
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

const suggestionPrompts = [
  { icon: Wand2, text: 'Suggest a creative topic' },
  { icon: GitCompareArrows, text: 'How do I compare two topics?' },
  { icon: FileQuestion, text: 'How do I use Vision Mode?' },
  { icon: TestTube2, text: 'Can you quiz me on a topic?' },
  { icon: Save, text: 'How do I save my mind maps?' },
  { icon: HelpCircle, text: 'What is mind mapping?' },
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

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitialMessage = useRef(false);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const messages = activeSession?.messages ?? [];

  /**
   * Scrolls the chat view to the bottom.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Summarize chat when closing or switching if it's a general conversation
  useEffect(() => {
    let summarizedSessionId: string | null = null;
    let summarizedSession: ChatSession | null = null;

    if (activeSession && activeSession.topic === 'General Conversation' && activeSession.messages.length > 0) {
      summarizedSessionId = activeSession.id;
      summarizedSession = activeSession;
    }

    return () => {
      if (summarizedSession && summarizedSessionId) {
        summarizeChatAction({ history: summarizedSession.messages.slice(0, 4) })
          .then(({ summary, error }) => {
            if (summary && !error) {
              setSessions(prev => prev.map(s =>
                s.id === summarizedSessionId ? { ...s, topic: summary.topic } : s
              ));
            }
          });
      }
    };
  }, [activeSessionId, activeSession, setSessions]);


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

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MindScape Chat Export', 20, 20);

      // Topic
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Topic: ${activeSession.topic}`, 20, 30);
      doc.text(`Date: ${new Date(activeSession.timestamp).toLocaleString()}`, 20, 37);

      // Messages
      let yPosition = 50;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      activeSession.messages.forEach((msg, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        // Role label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const roleLabel = msg.role === 'user' ? 'You:' : 'MindScape AI:';
        doc.text(roleLabel, margin, yPosition);

        // Message content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(msg.content, maxWidth);
        yPosition += 7;

        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += 5;
        });

        yPosition += 5; // Space between messages
      });

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
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      // Optional: switch to the most recent session or a new one
      if (sessions.length > 1) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setActiveSessionId(remainingSessions[0].id);
        } else {
          startNewChat();
        }
      } else {
        startNewChat();
      }
    }
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
            <div className="text-center p-4">
              <Avatar className="h-12 w-12 border-2 border-primary mx-auto mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-7 w-7" />
                </AvatarFallback>
              </Avatar>
              <p className="text-lg font-semibold mb-6">How can I help you?</p>

              {/* Quick Resume Cards */}
              {sessions.length > 1 && (
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium text-left">Jump back in</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sessions
                      .filter(s => s.id !== activeSessionId && s.messages.length > 0)
                      .slice(0, 2)
                      .map(session => (
                        <button
                          key={session.id}
                          onClick={() => selectSession(session.id)}
                          className="text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all group"
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

              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium text-left">Suggestions</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {suggestionPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-auto justify-start p-3 text-left text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    onClick={() => handleSend(prompt.text)}
                  >
                    <prompt.icon className="h-4 w-4 mr-2 flex-shrink-0 text-primary/70" />
                    {prompt.text}
                  </Button>
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
        {/* Context Awareness Pills */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-full border border-border/50">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Context: {topic.length > 20 ? topic.substring(0, 20) + '...' : topic}
            </span>
          </div>

          {/* Persona Pill */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/50 bg-secondary/50",
            personas.find(p => p.id === persona)?.color
          )}>
            {(() => {
              const p = personas.find(p => p.id === persona);
              const Icon = p?.icon || Sparkles;
              return <Icon className="w-3 h-3" />;
            })()}
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {personas.find(p => p.id === persona)?.label}
            </span>
          </div>
        </div>

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

  const renderHistoryView = () => (
    <ScrollArea className="flex-grow p-4">
      <div className="flex flex-col gap-3">
        {sessions.length > 0 ? (
          sessions.map(session => (
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
