
'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, User, Bot, BrainCircuit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatText } from '@/lib/utils';
import { conversationalMindMapAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { GenerationLoading } from '@/components/generation-loading';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function MindGptPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial message from the assistant
    const sendInitialMessage = async () => {
      setIsLoading(true);
      const { response, error } = await conversationalMindMapAction({
        history: [],
        message: 'Hello', // A dummy message to trigger the initial prompt
      });
      setIsLoading(false);

      if (response) {
        setMessages([{ role: 'assistant', content: response.response }]);
        if (response.suggestions) {
          setSuggestions(response.suggestions);
        }
      } else if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error,
        });
      }
    };
    sendInitialMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (messageToSend?: string) => {
    const content = (messageToSend || input).trim();
    if (!content) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    if (!messageToSend) {
      setInput('');
    }
    setIsLoading(true);
    setSuggestions([]);

    const { response, error } = await conversationalMindMapAction({
      history: newMessages,
      message: content,
    });

    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm sorry, I encountered an error: ${error}`,
        },
      ]);
      return;
    }

    if (response) {
      if (response.isFinal && response.mindMap) {
        toast({
          title: 'Mind Map Finalized!',
          description: 'Redirecting you to the mind map viewer...',
        });
        try {
          const timestamp = Date.now();
          const sessionId = `mindgpt-${timestamp}`;
          // For MindGPT, the 'file' is the JSON mind map, and 'text' is empty
          const contentToStore = JSON.stringify({
            file: JSON.stringify(response.mindMap),
            text: '',
          });
          sessionStorage.setItem(`session-content-${sessionId}`, contentToStore);
          sessionStorage.setItem(`session-type-${sessionId}`, 'mindgpt');
          
          router.push(`/mindmap?sessionId=${sessionId}`);

        } catch (e) {
          console.error('Failed to process MindGPT result', e);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not prepare the mind map result. Please try again.',
          });
        }
        return; // Stop processing further
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.response },
      ]);

      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    }
  };

  const handleFinalize = () => {
    handleSend('FINALIZE_MIND_MAP');
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[85vh] flex flex-col glassmorphism overflow-hidden">
        {/* Fixed Header */}
        <div className="p-6 pb-4 border-b">
          <div className="text-center">
            <h2 className="text-2xl font-bold">MindGPT</h2>
            <p className="text-muted-foreground">
              Build your mind map, one idea at a time.
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-grow p-6">
          <div className="flex flex-col gap-4">
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
                      ? 'bg-blue-600 text-primary-foreground rounded-br-none'
                      : 'bg-secondary/80 rounded-bl-none'
                  )}
                >
                  <div
                    className="text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formatText(message.content),
                    }}
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
            <div ref={messagesEndRef} />
          </div>
          {suggestions.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 border-t">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex-grow flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
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
              <Button
                onClick={handleFinalize}
                disabled={isLoading || messages.length < 2}
                variant="default"
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                Generate Mind Map
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function MindGptPage() {
  return (
    <Suspense fallback={<GenerationLoading />}>
      <MindGptPageContent />
    </Suspense>
  );
}
