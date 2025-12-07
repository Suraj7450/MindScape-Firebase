'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Download, Sparkles, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExpandFAB } from './expand-fab';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NestedExpansionOutput } from '@/ai/mind-map-schema';

interface NestedSubCategory {
    name: string;
    description: string;
    icon: string;
    tags: string[];
    nestedExpansion?: NestedExpansionData;
    isExpanded?: boolean;
}

interface NestedExpansionData {
    id: string;
    topic: string;
    icon: string;
    subCategories: NestedSubCategory[];
    createdAt?: number;
}

interface NestedExpansionProps {
    data: NestedExpansionData;
    depth: number;
    parentName: string;
    onCollapse: () => void;
    onRegenerate: () => void;
    onExpand: (nodeName: string, nodeDescription: string, nodeIndex: number) => void;
    expandingNodeIndex: number | null;
    onExplainInChat?: (message: string) => void;
    mainTopic: string;
}

const toPascalCase = (str: string) => {
    if (!str) return 'FileText';
    return str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, '').toUpperCase());
};

/**
 * Component for rendering inline nested mind map expansions.
 * Supports unlimited depth with visual indicators and glassmorphism styling.
 */
export function NestedExpansion({
    data,
    depth,
    parentName,
    onCollapse,
    onRegenerate,
    onExpand,
    expandingNodeIndex,
    onExplainInChat,
    mainTopic,
}: NestedExpansionProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const TopicIcon = (LucideIcons as any)[toPascalCase(data.icon)] || LucideIcons.Sparkles;

    // Calculate depth-based styling
    const depthGlow = Math.min(0.4, 0.15 + depth * 0.05);
    const indentation = depth * 16;

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
        if (!isCollapsed) {
            onCollapse();
        }
    };

    return (
        <div
            className={cn(
                'relative mt-4 rounded-xl overflow-hidden',
                'animate-in slide-in-from-top-4 fade-in duration-500'
            )}
            style={{
                marginLeft: `${indentation}px`,
            }}
        >
            {/* Connector line from parent */}
            <div
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{
                    background: `linear-gradient(to bottom, rgba(168, 85, 247, ${depthGlow}), transparent)`,
                    boxShadow: `0 0 8px rgba(168, 85, 247, ${depthGlow})`,
                }}
            />

            {/* Main container with glassmorphism */}
            <div
                className={cn(
                    'ml-3 rounded-xl border',
                    'bg-card/60 backdrop-blur-xl',
                    'border-purple-500/20',
                    'shadow-[inset_0_0_30px_rgba(168,85,247,0.05)]'
                )}
                style={{
                    boxShadow: `
            inset 0 0 30px rgba(168, 85, 247, ${depthGlow * 0.3}),
            0 0 20px rgba(168, 85, 247, ${depthGlow * 0.2})
          `,
                }}
            >
                {/* Header with topic and controls */}
                <div className="flex items-center justify-between p-3 border-b border-purple-500/10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/20">
                            <TopicIcon className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-foreground">
                                {data.topic}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Expanded from: {parentName} • Depth {depth}
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
                                        className="h-7 w-7 hover:bg-purple-500/10"
                                        onClick={onRegenerate}
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
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
                                        className="h-7 w-7 hover:bg-purple-500/10"
                                        onClick={handleToggleCollapse}
                                    >
                                        {isCollapsed ? (
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        ) : (
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p>{isCollapsed ? 'Expand' : 'Collapse'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Collapsible content */}
                <div
                    className={cn(
                        'overflow-hidden transition-all duration-500 ease-out',
                        isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
                    )}
                >
                    <div className="p-3 grid grid-cols-1 gap-3">
                        {data.subCategories.map((subCat, index) => {
                            const SubCatIcon = (LucideIcons as any)[toPascalCase(subCat.icon)] || LucideIcons.FileText;
                            const isExpanding = expandingNodeIndex === index;
                            const isHovered = hoveredIndex === index;

                            return (
                                <div key={index} className="relative">
                                    <Card
                                        className={cn(
                                            'group relative overflow-hidden cursor-pointer',
                                            'bg-secondary/30 border-border/50',
                                            'hover:border-purple-400/30 hover:bg-secondary/50',
                                            'transition-all duration-300'
                                        )}
                                        onMouseEnter={() => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                        onClick={() => {
                                            if (onExplainInChat) {
                                                onExplainInChat(
                                                    `Explain "${subCat.name}" in the context of ${data.topic} and ${mainTopic}.`
                                                );
                                            }
                                        }}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                                                    <SubCatIcon className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h5 className="text-sm font-medium text-foreground group-hover:text-purple-300 transition-colors">
                                                        {subCat.name}
                                                    </h5>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {subCat.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {subCat.tags.map((tag, tagIndex) => (
                                                            <span
                                                                key={tagIndex}
                                                                className="px-1.5 py-0.5 text-[10px] rounded-full bg-purple-500/10 text-purple-300"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Expand FAB */}
                                        <ExpandFAB
                                            isVisible={isHovered || isExpanding}
                                            isLoading={isExpanding}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onExpand(subCat.name, subCat.description, index);
                                            }}
                                            className="bottom-2 right-2"
                                        />
                                    </Card>

                                    {/* Render nested expansion if exists */}
                                    {subCat.nestedExpansion && subCat.isExpanded && (
                                        <NestedExpansion
                                            data={subCat.nestedExpansion}
                                            depth={depth + 1}
                                            parentName={subCat.name}
                                            onCollapse={() => { }}
                                            onRegenerate={() => { }}
                                            onExpand={onExpand}
                                            expandingNodeIndex={null}
                                            onExplainInChat={onExplainInChat}
                                            mainTopic={mainTopic}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
