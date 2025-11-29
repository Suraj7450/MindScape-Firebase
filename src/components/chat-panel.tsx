
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
import { Loader2, Send, User, Bot, X, Wand2, HelpCircle, FileQuestion, TestTube2, GitCompareArrows, Save, Plus, History, ArrowLeft, MessageSquare, Trash2 } from 'lucide-react';
import { chatAction, summarizeChatAction } from '@/app/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatText } from '@/lib/utils';
import { Separator } from './ui/separator';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { formatDistanceToNow } from 'date-fns';

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

    const { response, error } = await chatAction({ question: content, topic });
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
                <p className="text-lg font-semibold mb-2">How can I help you?</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {suggestionPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="h-auto justify-start p-3 text-left text-muted-foreground"
                      onClick={() => handleSend(prompt.text)}
                    >
                      <prompt.icon className="h-4 w-4 mr-2 flex-shrink-0" />
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
                  'p-3 rounded-lg max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary/80 rounded-bl-none'
                )}
              >
                <div
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatText(message.content) }}
                />
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
        <Separator className="mb-4" />
          <form
          onSubmit={(e) => {
              e.preventDefault();
              handleSend();
          }}
          className="flex gap-2"
          >
          <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="glassmorphism"
          />
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
          <div className='flex items-center'>
            {view === 'chat' && (
              <>
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
