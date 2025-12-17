'use client';

import { cn, formatText } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    suggestions?: string[];
    onSuggestionClick?: (suggestion: string) => void;
}

export function MessageList({ messages, isLoading, suggestions = [], onSuggestionClick }: MessageListProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const { toast } = useToast();

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
            console.error("Failed to copy", error);
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                    <Bot className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-md">
                    I can help you brainstorm ideas, learn new concepts, or create extensive mind maps.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 py-6 max-w-3xl mx-auto w-full">
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={cn(
                        'flex gap-4 w-full',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                >
                    {/* Assistant Avatar */}
                    {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8 border shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}

                    <div className={cn(
                        "flex flex-col gap-2 max-w-[85%] md:max-w-[75%]",
                        message.role === 'user' ? "items-end" : "items-start"
                    )}>
                        {/* Name */}
                        <span className="text-xs text-muted-foreground font-medium ml-1">
                            {message.role === 'user' ? 'You' : 'MindScape'}
                        </span>

                        {/* Message Bubble */}
                        <div
                            className={cn(
                                'rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm',
                                message.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-secondary/50 border border-border/50 rounded-bl-none prose prose-sm dark:prose-invert max-w-none'
                            )}
                            dangerouslySetInnerHTML={{
                                __html: message.role === 'user' ? message.content : formatText(message.content),
                            }}
                        />

                        {/* Actions for Assistant */}
                        {message.role === 'assistant' && (
                            <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleCopy(message.content, index)}
                                >
                                    {copiedIndex === index ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* User Avatar */}
                    {message.role === 'user' && (
                        <Avatar className="h-8 w-8 border shrink-0">
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                                <User className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            ))}
            {isLoading && (
                <div className="flex gap-4 w-full justify-start">
                    <Avatar className="h-8 w-8 border shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2 max-w-[75%] items-start">
                        <span className="text-xs text-muted-foreground font-medium ml-1">MindScape</span>
                        <div className="bg-secondary/50 border border-border/50 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm">
                            <div className="flex space-x-2 h-5 items-center">
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {suggestions.length > 0 && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 px-4 pb-4 max-w-3xl mx-auto w-full">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            className="text-left p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/50 transition-all text-sm text-foreground/80 hover:text-foreground"
                            onClick={() => onSuggestionClick?.(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
