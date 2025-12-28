'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import {
    FolderOpen,
    Loader2,
    Network,
    Lightbulb,
    MessageCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toPascalCase } from '@/lib/utils';
import { SubCategoryInfo, ExplainableNode, Category } from '@/types/mind-map';

interface ComparisonViewProps {
    categories: Category[];
    onSubCategoryClick: (subCategory: SubCategoryInfo) => void;
    onGenerateNewMap: (topic: string, nodeId: string, contextPath: string) => void;
    generatingNode: string | null;
    onExplainWithExample: (node: ExplainableNode) => void;
    onExplainInChat: (message: string) => void;
    mainTopic: string;
    contextPath: string;
    isGlobalBusy?: boolean;
}

export const ComparisonView = ({
    categories,
    onSubCategoryClick,
    onGenerateNewMap,
    generatingNode,
    onExplainWithExample,
    onExplainInChat,
    mainTopic,
    contextPath,
    isGlobalBusy = false,
}: ComparisonViewProps) => {
    if (!categories || categories.length !== 2) {
        return null;
    }

    const topic1 = categories[0]?.name;
    const topic2 = categories[1]?.name;

    const comparisonRows = categories[0]?.subCategories.map(
        (sc: any, index: number) => ({
            name: sc.name,
            icon: sc.icon,
            topic1Content: sc.description,
            topic2Content: categories[1]?.subCategories[index]?.description,
            nodeId: `diff-${index}`
        })
    );

    const handleCardClick = (row: any) => {
        const combinedDescription = `**${topic1}**:\n${row.topic1Content}\n\n---\n\n**${topic2}**:\n${row.topic2Content}`;
        onSubCategoryClick({
            name: row.name,
            description: combinedDescription,
        });
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            {comparisonRows?.map((row: any, index: number) => {
                const RowIcon = (LucideIcons as any)[toPascalCase(row.icon)] || FolderOpen;
                const isGenerating = generatingNode === row.nodeId;

                return (
                    <Card
                        key={index}
                        className="relative group overflow-hidden bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
                        onClick={() => handleCardClick(row)}
                    >
                        <CardHeader className="p-6 md:p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-800 border border-white/10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        <RowIcon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-zinc-100 tracking-tight group-hover:translate-x-1 transition-all duration-300">
                                        {row.name}
                                    </CardTitle>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0" onClick={e => e.stopPropagation()}>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => onGenerateNewMap(row.name, row.nodeId, contextPath)} disabled={isGenerating || isGlobalBusy}>
                                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-5 w-5" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Explore Concept</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl" onClick={() => onExplainWithExample({ name: row.name, type: 'category' })}>
                                                    <Lightbulb className="h-5 w-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Get Examples</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl" onClick={() => onExplainInChat(`Compare and contrast "${row.name}" for ${topic1} vs ${topic2}.`)}>
                                                    <MessageCircle className="h-5 w-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Contrast with AI</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5 hidden md:block" />

                                <div className="space-y-4">
                                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary-foreground text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                                        {topic1}
                                    </Badge>
                                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                                        {row.topic1Content}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <Badge variant="outline" className="border-accent/20 bg-accent/5 text-accent-foreground text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                                        {topic2}
                                    </Badge>
                                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                                        {row.topic2Content}
                                    </p>
                                </div>
                            </div>
                        </CardContent>

                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                );
            })}
        </div>
    );
};
