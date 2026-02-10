'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import {
    ChevronRight,
    RefreshCw,
    Trash2,
    Loader2,
    Network,
    ArrowRight
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn, cleanCitations } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

import { NestedExpansionItem } from '@/types/mind-map';

interface NestedMapsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    expansions: NestedExpansionItem[];
    onDelete: (id: string) => void;
    onRegenerate: (parentName: string, id: string) => void;
    onExpandFurther: (nodeName: string, nodeDescription: string, parentId: string) => void;
    expandingId: string | null;
    onExplainInChat?: (message: string) => void;
    mainTopic: string;
    onOpenMap: (mapData: any, id: string) => void;
    isGlobalBusy?: boolean;
}

const toPascalCase = (str: string) => {
    if (!str) return 'FileText';
    return str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, '').toUpperCase());
};

/**
 * Dialog for viewing and managing nested mindmap expansions.
 * Displays a simplified list of sub-maps that can be opened.
 */
export function NestedMapsDialog({
    isOpen,
    onClose,
    expansions,
    onDelete,
    onRegenerate,
    onExpandFurther,
    expandingId,
    onExplainInChat,
    mainTopic,
    onOpenMap,
    isGlobalBusy = false,
}: NestedMapsDialogProps) {

    // Deduplicate expansions based on ID to prevent React key errors
    const uniqueExpansions = React.useMemo(() => {
        const seen = new Set();
        return expansions.filter(e => {
            const duplicate = seen.has(e.id);
            seen.add(e.id);
            return !duplicate;
        });
    }, [expansions]);

    const handleOpenMap = (expansion: NestedExpansionItem) => {
        if (!isGlobalBusy && (expansion.fullData || expansion.id)) {
            onOpenMap(expansion.fullData, expansion.id);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] glassmorphism p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Network className="h-6 w-6 text-purple-400" />
                        </div>
                        Nested Maps
                        {uniqueExpansions.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {uniqueExpansions.length}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] p-6 pt-4">
                    {uniqueExpansions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Network className="h-8 w-8 text-purple-400/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                No Nested Maps Yet
                            </h3>
                            <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
                                Click the <Network className="inline h-4 w-4 mx-1" /> "Generate Sub-Map" button on any node to generate deeper insights.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {uniqueExpansions.map((expansion) => {
                                const TopicIcon = (LucideIcons as any)[toPascalCase(expansion.icon)] || Network;
                                const isExpanding = expandingId === expansion.id;
                                const isGenerating = expansion.status === 'generating';

                                return (
                                    <div
                                        key={expansion.id}
                                        className={cn(
                                            'group relative overflow-hidden rounded-xl border border-white/5',
                                            'bg-zinc-900/50 backdrop-blur-xl',
                                            'ring-1 ring-purple-400/20',
                                            'transition-all duration-300',
                                            'transition-all duration-300',
                                            (expansion.fullData || expansion.id) ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                                        )}
                                        onClick={() => handleOpenMap(expansion)}
                                    >
                                        {/* Expansion Header */}
                                        <div className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                                                    {isGenerating ? (
                                                        <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                                                    ) : (
                                                        <TopicIcon className="h-5 w-5 text-purple-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-semibold text-foreground group-hover:text-purple-300 transition-colors">
                                                        {expansion.topic}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {isGenerating
                                                            ? `Generating sub-map for ${expansion.parentName}...`
                                                            : `(${expansion.path ? `${expansion.path} > ` : ''}${expansion.parentName})`
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1">
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                    {!isGenerating && (
                                                        <TooltipProvider delayDuration={300}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 hover:bg-purple-500/10"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onRegenerate(expansion.topic, expansion.id);
                                                                        }}
                                                                        disabled={isExpanding || isGlobalBusy}
                                                                    >
                                                                        {isExpanding ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <RefreshCw className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                                                    <p>Regenerate</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}

                                                    <TooltipProvider delayDuration={300}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-destructive/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDelete(expansion.id);
                                                                    }}
                                                                    disabled={isGlobalBusy}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                                                <p>Delete</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity hover:bg-purple-500/10 text-purple-400"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-4 border-t border-white/5 bg-zinc-900/50">
                    <Button variant="outline" className="w-full" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
