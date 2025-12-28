'use client';

import React from 'react';
import {
    Sparkles,
    ChevronDown,
    Loader2,
    Lightbulb,
    MessageCircle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipPortal,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatText } from '@/lib/utils';
import { ExplanationMode } from '@/types/mind-map';

interface ExplanationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string[];
    isLoading: boolean;
    onExplainInChat: (message: string) => void;
    explanationMode: ExplanationMode;
    onExplanationModeChange: (mode: ExplanationMode) => void;
    isGlobalBusy?: boolean;
}

export function ExplanationDialog({
    isOpen,
    onClose,
    title,
    content,
    isLoading,
    onExplainInChat,
    explanationMode,
    onExplanationModeChange,
    isGlobalBusy = false,
}: ExplanationDialogProps) {
    const isBusy = isLoading || isGlobalBusy;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl glassmorphism">
                <DialogHeader className="flex-row justify-between items-center">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Sparkles className="h-6 w-6 text-primary" />
                        {title}
                    </DialogTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto mr-4" disabled={isBusy}>
                                {explanationMode}
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onSelect={() => onExplanationModeChange('Beginner')}
                            >
                                Beginner
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => onExplanationModeChange('Intermediate')}
                            >
                                Intermediate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => onExplanationModeChange('Expert')}
                            >
                                Expert
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : Array.isArray(content) && content.length > 0 ? (
                        <div className="space-y-3">
                            {content.map((point, index) => (
                                <Card key={index} className="bg-secondary/30 group relative">
                                    <CardContent className="p-4 pr-10 flex items-start gap-3">
                                        <Lightbulb className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                                        <div
                                            className="prose prose-sm max-w-none flex-1"
                                            dangerouslySetInnerHTML={{ __html: formatText(point) }}
                                        />
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={isBusy}
                                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 disabled:opacity-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onExplainInChat(
                                                                `Can you elaborate on this point: "${point}" in the context of ${title}?`
                                                            );
                                                        }}
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipPortal>
                                                    <TooltipContent side="top" align="center">
                                                        <p>Explain in Chat</p>
                                                    </TooltipContent>
                                                </TooltipPortal>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No explanation available yet.
                        </p>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
