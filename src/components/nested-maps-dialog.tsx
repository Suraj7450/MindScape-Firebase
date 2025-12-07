'use client';

import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Trash2,
    Loader2,
    FileText,
    Network,
    GitBranch,
    MessageCircle,
    Pocket,
    Image as ImageIcon,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface NestedSubCategory {
    name: string;
    description: string;
    icon: string;
    tags: string[];
}

interface NestedExpansionData {
    id: string;
    parentName: string;
    topic: string;
    icon: string;
    subCategories: NestedSubCategory[];
    createdAt: number;
    depth: number;
}

interface NestedMapsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    expansions: NestedExpansionData[];
    onDelete: (id: string) => void;
    onRegenerate: (parentName: string, id: string) => void;
    onExpandFurther: (nodeName: string, nodeDescription: string, parentId: string) => void;
    expandingId: string | null;
    onExplainInChat?: (message: string) => void;
    mainTopic: string;
}

const toPascalCase = (str: string) => {
    if (!str) return 'FileText';
    return str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, '').toUpperCase());
};

/**
 * Dialog for viewing and managing nested mindmap expansions.
 * Similar to Image Gallery but for expanded mindmap content.
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
}: NestedMapsDialogProps) {
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

    const toggleCollapse = (id: string) => {
        setCollapsedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] glassmorphism p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Network className="h-6 w-6 text-purple-400" />
                        </div>
                        Nested Maps
                        {expansions.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {expansions.length}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[75vh] p-6 pt-4">
                    {expansions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Network className="h-10 w-10 text-purple-400/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                No Nested Maps Yet
                            </h3>
                            <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
                                Click the <GitBranch className="inline h-4 w-4 mx-1" /> "Expand Further" button on any sub-category card to generate deeper insights.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {expansions.map((expansion) => {
                                const TopicIcon = (LucideIcons as any)[toPascalCase(expansion.icon)] || Network;
                                const isCollapsed = collapsedIds.has(expansion.id);
                                const isExpanding = expandingId === expansion.id;

                                return (
                                    <div
                                        key={expansion.id}
                                        className={cn(
                                            'rounded-2xl border overflow-hidden',
                                            'bg-zinc-900/50 backdrop-blur-xl',
                                            'ring-1 ring-purple-400/20',
                                            'transition-all duration-300',
                                            'animate-fade-in'
                                        )}
                                        style={{
                                            marginLeft: `${(expansion.depth - 1) * 20}px`,
                                        }}
                                    >
                                        {/* Expansion Header */}
                                        <div className="flex items-center justify-between p-4 border-b border-purple-500/10 bg-secondary/20">
                                            <div className="flex items-center gap-3">
                                                {expansion.depth > 1 && (
                                                    <div
                                                        className="w-1 h-10 bg-gradient-to-b from-purple-500 to-purple-500/20 rounded-full"
                                                        style={{
                                                            boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
                                                        }}
                                                    />
                                                )}
                                                <div className="p-2 rounded-lg bg-purple-500/20">
                                                    <TopicIcon className="h-5 w-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-semibold text-foreground">
                                                        {expansion.topic}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        From: {expansion.parentName} • {expansion.subCategories.length} sub-topics • Depth {expansion.depth}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1">
                                                <TooltipProvider delayDuration={300}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-purple-500/10"
                                                                onClick={() => onRegenerate(expansion.parentName, expansion.id)}
                                                                disabled={isExpanding}
                                                            >
                                                                {isExpanding ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>Regenerate</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider delayDuration={300}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-destructive/10"
                                                                onClick={() => onDelete(expansion.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>Delete</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => toggleCollapse(expansion.id)}
                                                >
                                                    {isCollapsed ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUp className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Expansion Content */}
                                        <div
                                            className={cn(
                                                'overflow-hidden transition-all duration-500 ease-out',
                                                isCollapsed ? 'max-h-0' : 'max-h-[2000px]'
                                            )}
                                        >
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {expansion.subCategories.map((subCat, index) => {
                                                    const SubCatIcon = (LucideIcons as any)[toPascalCase(subCat.icon)] || FileText;

                                                    return (
                                                        <Card
                                                            key={index}
                                                            className={cn(
                                                                'group/item relative overflow-hidden',
                                                                'bg-zinc-900/50 border-border/50 rounded-xl',
                                                                'ring-1 ring-purple-400/10',
                                                                'hover:ring-purple-400/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
                                                                'transition-all duration-300'
                                                            )}
                                                        >
                                                            <CardHeader className="p-4 pb-2 flex flex-row items-start gap-3 space-y-0">
                                                                <div className="p-2 rounded-lg bg-accent/20 text-accent flex-shrink-0">
                                                                    <SubCatIcon className="h-4 w-4" />
                                                                </div>
                                                                <CardTitle className="text-sm font-semibold leading-tight flex-1">
                                                                    {subCat.name}
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="p-4 pt-0">
                                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                                                                    {subCat.description}
                                                                </p>

                                                                {/* Tags */}
                                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                                    {subCat.tags.slice(0, 3).map((tag, tagIndex) => (
                                                                        <span
                                                                            key={tagIndex}
                                                                            className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20"
                                                                        >
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                {/* Action Buttons - Like MindMap Page */}
                                                                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                        <TooltipProvider delayDuration={300}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-7 w-7"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onExpandFurther(subCat.name, subCat.description, expansion.id);
                                                                                        }}
                                                                                    >
                                                                                        <GitBranch className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="top">
                                                                                    <p>Expand further</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>

                                                                        <TooltipProvider delayDuration={300}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-7 w-7"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (onExplainInChat) {
                                                                                                onExplainInChat(`Give me examples of "${subCat.name}" in the context of ${expansion.topic}.`);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <Pocket className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="top">
                                                                                    <p>Give me examples</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>

                                                                        <TooltipProvider delayDuration={300}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-7 w-7"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (onExplainInChat) {
                                                                                                onExplainInChat(`Explain "${subCat.name}" in the context of ${expansion.topic} and ${mainTopic}.`);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="top">
                                                                                    <p>Explain in Chat</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-auto py-1 px-2 text-xs text-purple-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                                        onClick={() => {
                                                                            if (onExplainInChat) {
                                                                                onExplainInChat(`Tell me everything about "${subCat.name}" related to ${expansion.topic}.`);
                                                                            }
                                                                        }}
                                                                    >
                                                                        Explore <ArrowRight className="h-3 w-3 ml-1" />
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
