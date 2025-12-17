'use client';

import * as React from 'react';
import { Send, Paperclip, Mic, Image as ImageIcon, Map, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InputAreaProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    onFinalizeMap: () => void;
    canFinalize: boolean;
}

export function InputArea({ onSend, isLoading, onFinalizeMap, canFinalize }: InputAreaProps) {
    const [input, setInput] = React.useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        adjustHeight();
    };

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Limit max height
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSend(input);
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    return (
        <div className="mx-auto max-w-3xl w-full p-4 pb-6">
            <div className="relative flex flex-col gap-2 bg-secondary/30 border border-input rounded-xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="min-h-[50px] w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 px-3 py-2 text-base scrollbar-hide"
                    rows={1}
                    disabled={isLoading}
                />

                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <Paperclip className="h-4 w-4" />
                                        <span className="sr-only">Attach file</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Attach file</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Reuse existing Finalize Button logic style */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", canFinalize && "text-primary")}
                                        onClick={onFinalizeMap}
                                        disabled={!canFinalize || isLoading}
                                    >
                                        <Map className="h-4 w-4" />
                                        <span className="sr-only">Generate Mind Map</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Generate Mind Map</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                    </div>
                    <div>
                        <Button
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-lg transition-all",
                                input.trim() ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed"
                            )}
                            disabled={!input.trim() || isLoading}
                            onClick={handleSend}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">MindScape can make mistakes. Check important info.</p>
            </div>
        </div>
    );
}
