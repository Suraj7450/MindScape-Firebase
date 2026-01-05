'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Send,
  User,
  Bot,
  X,
  Wand2,
  HelpCircle,
  FileQuestion,
  TestTube2,
  GitCompareArrows,
  Save,
  Plus,
  History,
  ArrowLeft,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  GraduationCap,
  Zap,
  Palette,
  Mic,
  MicOff,
  Download,
  Eraser,
  Github,
  ChevronRight
} from 'lucide-react';
import { chatAction, summarizeChatAction, generateRelatedQuestionsAction } from '@/app/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatText } from '@/lib/utils';
import { Separator } from './ui/separator';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { QuizComponent } from '@/components/quiz/quiz-component';
import { Quiz } from '@/ai/schemas/quiz-schema';
import { MindMapData } from '@/types/mind-map';

import { doc, getDoc, collection, getDocs, query, where, limit, serverTimestamp, setDoc } from 'firebase/firestore';
import { generateQuizAction } from '@/app/actions';
import { toPlainObject } from '@/lib/serialize';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Global type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
  type?: 'chat' | 'quiz';
  quiz?: Quiz;
}

type Persona = 'Standard' | 'Teacher' | 'Concise' | 'Creative';

const personas: { id: Persona; label: string; icon: any; color: string }[] = [
  { id: 'Standard', label: 'Standard', icon: Sparkles, color: 'text-blue-400' },
  { id: 'Teacher', label: 'Teacher', icon: GraduationCap, color: 'text-yellow-400' },
  { id: 'Concise', label: 'Concise', icon: Zap, color: 'text-orange-400' },
  { id: 'Creative', label: 'Creative', icon: Palette, color: 'text-pink-400' },
];

/**
 * Props for the ChatPanel component.
 */
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  initialMessage?: string;
  mindMapData?: MindMapData;
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
  mindMapData
}: ChatPanelProps) {
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chat-sessions', []);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizTopic, setQuizTopic] = useState<string | undefined>(undefined);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [persona, setPersona] = useState<Persona>('Standard');
  const [isListening, setIsListening] = useState(false);
  const [displayedPrompts, setDisplayedPrompts] = useState(allSuggestionPrompts.slice(0, 4));
  const [providerOptions, setProviderOptions] = useState<{ apiKey?: string; provider?: 'pollinations' | 'gemini' }>({ provider: 'gemini' });
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [isGeneratingRelated, setIsGeneratingRelated] = useState(false);
  const [showRelatedQuestions, setShowRelatedQuestions] = useState(true);

  const { toast } = useToast();
  const { user, firestore } = useFirebase();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitialMessage = useRef(false);

  /**
   * Starts a new chat session.
   */
  const startNewChat = useCallback((newTopic: string = 'General Conversation', type: 'chat' | 'quiz' = 'chat', quiz?: Quiz) => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      topic: newTopic,
      messages: [],
      timestamp: Date.now(),
      type: type,
      quiz: quiz
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setRelatedQuestions([]);
    setView('chat');
  }, [setSessions]);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  /**
   * Sends a message to the AI assistant and updates the current session.
   */
  const handleSend = useCallback(async (messageToSend?: string) => {
    const content = (messageToSend || input).trim();
    if (!content || !activeSessionId) return;

    const newMessage: Message = { role: 'user', content };
    setRelatedQuestions([]); // Clear previous questions when a new one is sent

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
    }, providerOptions);
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

    // After a successful response, generate related questions if we have mindMapData
    if (!error && response) {
      setIsGeneratingRelated(true);
      const { data: relatedData } = await generateRelatedQuestionsAction({
        topic,
        mindMapData: mindMapData,
        history: [...updatedMessages, assistantMessage]
      }, providerOptions);

      if (relatedData?.questions) {
        setRelatedQuestions(relatedData.questions);
      }
      setIsGeneratingRelated(false);
    }
  }, [input, activeSessionId, activeSession?.messages, setSessions, topic, persona, providerOptions, mindMapData]);

  const handleStartInteractiveQuiz = useCallback(async (quizTopicOverride?: string) => {
    const quizTitle = quizTopicOverride || topic;
    const normalizedTopic = quizTitle.trim();

    setIsLoading(true);
    const { id: toastId, update } = toast({
      title: 'Preparing Your Quiz...',
      description: 'Checking for existing knowledge checks...',
      duration: Infinity,
    });

    try {
      // 1. Check Firestore
      if (user && firestore) {
        const quizzesRef = collection(firestore, 'users', user.uid, 'quizzes');
        const q = query(quizzesRef, where('topic', '==', normalizedTopic), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const existingQuiz = querySnapshot.docs[0].data() as Quiz;
          startNewChat(`Quiz: ${normalizedTopic}`, 'quiz', existingQuiz);
          update({ id: toastId, title: 'Quiz Loaded!', description: 'Resuming your existing knowledge check.', duration: 3000 });
          return;
        }
      }

      // 2. Generate New
      update({ id: toastId, title: 'Generating New Quiz...', description: `AI is hand-crafting questions for "${normalizedTopic}".` });
      const { data: quizData, error } = await generateQuizAction({
        topic: normalizedTopic,
        mindMapData: mindMapData ? (toPlainObject(mindMapData) as any) : undefined,
      }, providerOptions);

      if (error) throw new Error(error);
      if (!quizData) throw new Error("Failed to generate quiz data.");

      // 3. Save to database
      if (user && firestore) {
        const quizRef = doc(collection(firestore, 'users', user.uid, 'quizzes'));
        await setDoc(quizRef, {
          ...quizData,
          topic: normalizedTopic,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      startNewChat(`Quiz: ${normalizedTopic}`, 'quiz', quizData);
      update({ id: toastId, title: 'Quiz Ready!', description: 'Time to test your knowledge.', duration: 3000 });
    } catch (err: any) {
      update({ id: toastId, title: 'Quiz Generation Failed', description: err.message, variant: 'destructive', duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  }, [topic, user, firestore, mindMapData, providerOptions, startNewChat, toast]);

  const handleRegenerateQuiz = useCallback(async (topicToRegen: string, wrongConcepts?: string[]) => {
    if (isQuizLoading) return;

    setIsQuizLoading(true);
    const normalizedTopic = topicToRegen.trim();
    setQuizTopic(normalizedTopic);

    try {
      const { data: quizData, error } = await generateQuizAction({
        topic: normalizedTopic,
        mindMapData: mindMapData ? (toPlainObject(mindMapData) as any) : undefined,
        wrongConcepts: wrongConcepts
      }, providerOptions);

      if (error) throw new Error(error);
      if (!quizData) throw new Error("Failed to generate quiz data.");

      // Replace in database for next time
      if (user && firestore) {
        const quizzesRef = collection(firestore, 'users', user.uid, 'quizzes');
        const q = query(quizzesRef, where('topic', '==', normalizedTopic), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const existingDocId = querySnapshot.docs[0].id;
          const quizRef = doc(firestore, 'users', user.uid, 'quizzes', existingDocId);
          await setDoc(quizRef, {
            ...quizData,
            topic: normalizedTopic,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      // Add as a new session card as per usual flow
      startNewChat(`Quiz: ${normalizedTopic}`, 'quiz', quizData);
    } catch (err: any) {
      toast({
        title: 'Regeneration Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsQuizLoading(false);
    }
  }, [mindMapData, providerOptions, isQuizLoading, toast, user, firestore, startNewChat]);

  // Load persona and provider preference from user profile
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user || !firestore) return;

      try {
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const prefs = data.preferences;
          const savedPersona = prefs?.defaultAIPersona as Persona;
          if (savedPersona && ['Standard', 'Teacher', 'Concise', 'Creative'].includes(savedPersona)) {
            setPersona(savedPersona);
          }

          // Provider settings
          if (data.apiSettings?.provider === 'pollinations') {
            setProviderOptions({ provider: 'pollinations' });
          } else {
            // Default to Gemini (Genkit)
            setProviderOptions({ provider: 'gemini' });
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen, user, firestore]);

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
    if (isOpen && view === 'chat') {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, view, messages, isGeneratingRelated, relatedQuestions]);

  // Summarize chat to generate a topic title
  useEffect(() => {
    if (
      activeSession &&
      activeSession.topic === 'General Conversation' &&
      activeSession.messages.length >= 2 &&
      !isLoading
    ) {
      const sessionIdToUpdate = activeSession.id;
      // Pass providerOptions if available
      summarizeChatAction({ history: activeSession.messages.slice(0, 4) }, providerOptions)
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
      // Find matching session, checking both plain topic and Quiz prefix
      const existingSession = sessions.find(s =>
        s.topic === topic || s.topic === `Quiz: ${topic}`
      );

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
   * Resets the flag if the message changes (e.g. clicking different nodes)
   */
  useEffect(() => {
    if (initialMessage) {
      hasSentInitialMessage.current = false;
    }
  }, [initialMessage]);

  useEffect(() => {
    if (isOpen && initialMessage && !hasSentInitialMessage.current && activeSession) {
      handleSend(initialMessage);
      hasSentInitialMessage.current = true;
    }
  }, [isOpen, initialMessage, activeSession]);




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

      let yPosition = 55;
      const margin = 20;

      // Add Quiz Summary if it's a quiz session
      if (activeSession.type === 'quiz' && activeSession.quiz) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Quiz Summary', margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Simple heuristic: count occurrences of assistant messages in history to see if quiz was "taken", 
        // but it's better to just show the quiz metadata we have.
        doc.text(`Total Questions: ${activeSession.quiz.questions.length}`, margin, yPosition);
        yPosition += 6;

        // Add a note about adaptive learning
        doc.setFont('helvetica', 'italic');
        doc.text('This quiz was generated using MindScape Adaptive Learning Intelligence.', margin, yPosition);
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
      }

      // Messages
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
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
    setRelatedQuestions([]); // Clear when regenerating

    const { response, error } = await chatAction({
      question: userMessage,
      topic,
      persona
    }, providerOptions);
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

    // Also regenerate related questions
    if (!error && response) {
      setIsGeneratingRelated(true);
      const { data: relatedData } = await generateRelatedQuestionsAction({
        topic,
        mindMapData: mindMapData,
        history: [...updatedMessages, newAssistantMessage]
      }, providerOptions);

      if (relatedData?.questions) {
        setRelatedQuestions(relatedData.questions);
      }
      setIsGeneratingRelated(false);
    }
  };

  /**
   * Selects a session from the history view.
   */
  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setRelatedQuestions([]);
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
          {messages.length === 0 && (
            <div className="text-center p-6 relative min-h-[400px] flex flex-col items-center justify-center">
              {/* Dynamic Persona Indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-0 right-0"
              >
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/5 bg-white/5 transition-all shadow-sm",
                  personas.find(p => p.id === persona)?.color
                )}>
                  <Sparkles className="w-3 h-3" />
                  <span>{persona} Mode</span>
                </div>
              </motion.div>

              {/* Enhanced Animated Gradient Background Layer */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="w-64 h-64 rounded-full bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 blur-[80px] animate-pulse-glow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
              </div>

              {/* Central Hero Section */}
              <div className="relative z-10 mb-10 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <Avatar className="h-20 w-20 border-2 border-primary/50 mx-auto shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-500">
                      <AvatarFallback className="bg-zinc-950 text-primary">
                        <Bot className="h-10 w-10 animate-float" />
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                    {topic === 'General Conversation' ? "How can I help you?" : `Explore ${topic}`}
                  </h2>
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.2em] animate-pulse">
                    AI Knowledge Assistant Active
                  </p>
                </motion.div>
              </div>

              {/* Bento Grid Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg relative z-10">
                {[
                  {
                    title: "Deep Dive",
                    icon: Wand2,
                    prompt: `Give me a comprehensive deep dive into ${topic === 'General Conversation' ? 'a random interesting topic' : topic}`,
                    color: "bg-purple-500/10 hover:bg-purple-500/20",
                    border: "border-purple-500/20",
                    iconColor: "text-purple-400"
                  },
                  {
                    title: "Quick Quiz",
                    icon: TestTube2,
                    prompt: `Challenge me with a quick quiz about ${topic === 'General Conversation' ? 'General Knowledge' : topic}`,
                    color: "bg-emerald-500/10 hover:bg-emerald-500/20",
                    border: "border-emerald-500/20",
                    iconColor: "text-emerald-400"
                  },
                  {
                    title: "Key Concepts",
                    icon: GraduationCap,
                    prompt: `What are the most important concepts to master in ${topic === 'General Conversation' ? 'Learning' : topic}?`,
                    color: "bg-blue-500/10 hover:bg-blue-500/20",
                    border: "border-blue-500/20",
                    iconColor: "text-blue-400"
                  },
                  {
                    title: "Fact Check",
                    icon: History,
                    prompt: `Surprise me with some incredible facts about ${topic === 'General Conversation' ? 'the universe' : topic}`,
                    color: "bg-orange-500/10 hover:bg-orange-500/20",
                    border: "border-orange-500/20",
                    iconColor: "text-orange-400"
                  }
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    onClick={() => {
                      if (item.title === "Quick Quiz") {
                        handleStartInteractiveQuiz();
                      } else {
                        handleSend(item.prompt);
                      }
                    }}
                    className={cn(
                      "group flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-lg active:scale-95",
                      item.color,
                      item.border
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-950 border border-white/5 shadow-inner transition-transform group-hover:rotate-12",
                      item.iconColor
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</h4>
                      <p className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors line-clamp-1">
                        Get started instantly
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Quick Resume Link - Subtly placed at bottom */}
              {sessions.filter(s => s.id !== activeSessionId && s.messages.length > 0).length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 flex items-center gap-2 text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors"
                  onClick={() => setView('history')}
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none">View Recent Sessions</span>
                </motion.div>
              )}
            </div>
          )}

          {/* Messages and Suggestions List */}
          <div className="flex flex-col gap-6">
            {messages.map((message, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="order-2">
                      <Avatar className="h-8 w-8 border shadow-sm">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg max-w-[80%]',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none order-1'
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
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => handleCopy(message.content, index)}
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => handleRegenerate(index)}
                              >
                                <RefreshCw className={cn("h-3 w-3", isLoading && index === messages.length - 1 && "animate-spin")} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Questions Section */}
                {message.role === 'assistant' && index === messages.length - 1 && (
                  <div className="ml-11 flex flex-col gap-3">
                    {/* Toggle Header */}
                    {(isGeneratingRelated || relatedQuestions.length > 0) && (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setShowRelatedQuestions(!showRelatedQuestions)}
                          className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest hover:text-primary transition-colors group"
                        >
                          <Sparkles className={cn("h-3 w-3", isGeneratingRelated ? "animate-spin text-primary" : "text-primary/50 group-hover:text-primary")} />
                          <span>Related Questions</span>
                          <motion.div
                            animate={{ rotate: showRelatedQuestions ? 0 : -90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </motion.div>
                        </button>

                        {relatedQuestions.length > 0 && !isGeneratingRelated && (
                          <div className="h-[1px] flex-grow bg-border/30 ml-3" />
                        )}
                      </div>
                    )}

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                      {isGeneratingRelated ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse py-1"
                        >
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span>Finding relevant insights...</span>
                        </motion.div>
                      ) : showRelatedQuestions && relatedQuestions.length > 0 && (
                        <motion.div
                          key="questions"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-2.5 pt-1">
                            {relatedQuestions.map((q, qIndex) => (
                              <motion.button
                                key={qIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: qIndex * 0.05 }}
                                onClick={() => handleSend(q)}
                                className="text-[11px] bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-primary border border-border/50 py-2.5 px-4 rounded-2xl transition-all flex items-start gap-3 group text-left w-full sm:w-auto sm:max-w-md shadow-sm hover:shadow-md hover:border-primary/30"
                              >
                                <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100 text-primary/70" />
                                <span className="flex-grow leading-relaxed font-medium">{q}</span>
                                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all mt-0.5" />
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ))}
          </div>

          {isQuizLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="relative w-24 h-24 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-8 w-8 text-primary shadow-glow" />
                  </motion.div>
                </motion.div>
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white tracking-tight">Generating Quiz</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                  {quizTopic || topic}
                </p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 bg-primary rounded-full"
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {activeSession?.type === 'quiz' && activeSession.quiz && (
            <div className="mt-4 px-1 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <QuizComponent
                quiz={activeSession.quiz}
                onClose={() => {
                  toast({ title: "Quiz Finished", description: "You've completed the knowledge check." });
                }}
                onRestart={(wrongConcepts) => {
                  if (activeSession.topic) {
                    handleRegenerateQuiz(activeSession.topic.replace('Quiz: ', ''), wrongConcepts);
                  }
                }}
              />
            </div>
          )}
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
              {view === 'history'
                ? 'Chat History'
                : isQuizLoading
                  ? `Quiz: ${quizTopic || topic}`
                  : activeSession?.type === 'quiz'
                    ? `Quiz: ${activeSession.topic.replace('Quiz: ', '')}`
                    : activeSession?.topic ?? 'AI Chat'}
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
                            setRelatedQuestions([]);
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

                {activeSession?.type === 'quiz' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const cleanTopic = activeSession.topic.replace('Quiz: ', '').trim();
                            handleRegenerateQuiz(cleanTopic);
                          }}
                          disabled={isQuizLoading}
                        >
                          <RefreshCw className={cn("h-5 w-5", isQuizLoading && "animate-spin")} />
                          <span className="sr-only">Regenerate Quiz</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Regenerate Quiz</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

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
