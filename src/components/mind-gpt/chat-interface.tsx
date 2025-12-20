'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { conversationalMindMapAction } from '@/app/actions';
import { MessageList } from './message-list';
import { InputArea } from './input-area';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [providerOptions, setProviderOptions] = useState<{ apiKey?: string; provider?: 'pollinations' | 'gemini' } | undefined>(undefined);
    const router = useRouter();
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const firestore = useFirestore();

    // Fetch user provider settings
    useEffect(() => {
        const loadSettings = async () => {
            if (!user || !firestore) return;
            try {
                const userRef = doc(firestore, 'users', user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.apiSettings?.provider === 'pollinations') {
                        setProviderOptions({ provider: 'pollinations' });
                    } else {
                        setProviderOptions({ provider: 'gemini' });
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadSettings();
    }, [user, firestore]);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, suggestions]);

    const initialSent = useRef(false);

    useEffect(() => {
        if (initialSent.current) return;
        initialSent.current = true;

        // Initial message from the assistant
        const sendInitialMessage = async () => {
            setIsLoading(true);
            // Default to Pollinations (undefined keys) for initial greeting to be fast
            const { response, error } = await conversationalMindMapAction({
                history: [],
                message: 'Hello',
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
                setMessages([{ role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
            }
        };
        sendInitialMessage();
    }, []);


    const handleSend = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setIsLoading(true);
        setSuggestions([]);

        const { response, error } = await conversationalMindMapAction({
            history: newMessages,
            message: content,
        }, providerOptions);

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
                handleMindMapFinalized(response.mindMap);
                return;
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

    const handleMindMapFinalized = (mindMap: any) => {
        toast({
            title: 'Mind Map Finalized!',
            description: 'Redirecting you to the mind map viewer...',
        });
        try {
            const timestamp = Date.now();
            const sessionId = `mindgpt-${timestamp}`;
            const contentToStore = JSON.stringify({
                file: JSON.stringify(mindMap),
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
    };

    const handleFinalize = () => {
        handleSend('FINALIZE_MIND_MAP');
    };

    return (
        <div className="flex flex-col h-full w-full relative">
            <ScrollArea className="flex-1 w-full" ref={scrollAreaRef}>
                <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    suggestions={suggestions}
                    onSuggestionClick={handleSend}
                />
            </ScrollArea>
            <div className="w-full">
                <InputArea
                    onSend={handleSend}
                    isLoading={isLoading}
                    onFinalizeMap={handleFinalize}
                    canFinalize={messages.length >= 2}
                />
            </div>
        </div>
    );
}
