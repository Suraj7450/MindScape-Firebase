'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import {
    Library,
    ChevronDown,
    Network,
    MessageCircle,
    FolderOpen
} from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toPascalCase } from '@/lib/utils';
import { LeafNodeCard } from './leaf-node-card';
import { ComparisonView } from './comparison-view';
import {
    MindMapData,
    SubCategory,
    NestedExpansionItem,
    MindMapWithId,
    ExplainableNode,
    SubCategoryInfo,
} from '@/types/mind-map';
import { MindMapStatus } from '@/hooks/use-mind-map-stack';

interface MindMapAccordionProps {
    mindMap: MindMapData;
    openSubTopics: string[];
    setOpenSubTopics: (value: string[]) => void;
    openCategories: string[];
    setOpenCategories: (value: string[] | ((prev: string[]) => string[])) => void;
    onGenerateNewMap: (topic: string, nodeId: string, contextPath: string, mode?: 'foreground' | 'background') => void;
    handleSubCategoryClick: (subCategory: SubCategoryInfo) => void;
    handleGenerateImageClick: (subCategory: SubCategory) => void;
    onExplainInChat: (message: string) => void;
    nestedExpansions: NestedExpansionItem[];
    onOpenNestedMap?: (mapData: MindMapData, expansionId: string) => void;
    generatingNode: string | null;
    mainTopic: string;
    onExplainWithExample: (node: ExplainableNode) => void;
    status: MindMapStatus;
}

export const MindMapAccordion = ({
    mindMap,
    openSubTopics,
    setOpenSubTopics,
    openCategories,
    setOpenCategories,
    onGenerateNewMap,
    handleSubCategoryClick,
    handleGenerateImageClick,
    onExplainInChat,
    nestedExpansions,
    onOpenNestedMap,
    generatingNode,
    mainTopic,
    onExplainWithExample,
    status
}: MindMapAccordionProps) => {
    const isGlobalBusy = status !== 'idle';
    return (
        <Accordion
            type="multiple"
            value={openSubTopics}
            onValueChange={setOpenSubTopics}
            className="space-y-4"
        >
            {mindMap.subTopics?.map((subTopic: any, index: number) => {
                const SubTopicIcon = (LucideIcons as any)[toPascalCase(subTopic.icon)] || Library;
                const subTopicId = `topic-${index}`;

                return (
                    <AccordionItem
                        key={index}
                        value={subTopicId}
                        className="border-none rounded-2xl bg-zinc-900/20 backdrop-blur-3xl shadow-3xl ring-1 ring-white/5 overflow-hidden data-[state=open]:ring-primary/30 transition-all duration-700"
                    >
                        <div
                            className="group/subtopic px-8 py-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => {
                                setOpenSubTopics(openSubTopics.includes(subTopicId) ? openSubTopics.filter(x => x !== subTopicId) : [...openSubTopics, subTopicId]);
                            }}
                        >
                            <div className="flex items-center gap-6 flex-1">
                                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] ring-1 ring-white/20 group-hover/subtopic:scale-110 transition-all duration-500">
                                    <SubTopicIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-zinc-100 tracking-tight group-hover/subtopic:translate-x-1 transition-transform duration-300">
                                        {subTopic.name}
                                    </h3>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            {subTopic.categories.length} Concept Categories
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown className={`w-6 h-6 text-zinc-600 transition-transform duration-500 ${openSubTopics.includes(subTopicId) ? 'rotate-180' : ''}`} />
                            </div>

                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => onGenerateNewMap(subTopic.name, subTopicId, mindMap.topic, 'background')} disabled={isGlobalBusy}>
                                                <Network className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Generate Sub-Map</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl" onClick={() => onExplainInChat(`Explain "${subTopic.name}" in the context of ${mindMap.topic}.`)}>
                                                <MessageCircle className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>AI Chat Assistant</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        <AccordionContent className="px-8 pb-8 pt-2">
                            <div className="space-y-3">
                                {subTopic.name === "Differences" && subTopic.categories.length === 2 ? (
                                    <ComparisonView
                                        categories={subTopic.categories}
                                        onSubCategoryClick={handleSubCategoryClick}
                                        onGenerateNewMap={onGenerateNewMap}
                                        generatingNode={generatingNode}
                                        onExplainWithExample={onExplainWithExample}
                                        onExplainInChat={onExplainInChat}
                                        mainTopic={mainTopic}
                                        contextPath={`${mindMap.topic} > ${subTopic.name}`}
                                        isGlobalBusy={isGlobalBusy}
                                    />
                                ) : (
                                    subTopic.categories.map((category: any, catIndex: number) => {
                                        const CategoryIcon = (LucideIcons as any)[toPascalCase(category.icon)] || FolderOpen;
                                        const catId = `cat-${index}-${catIndex}`;

                                        return (
                                            <div key={catIndex} className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden shadow-inner">
                                                <div
                                                    className="group/cat px-6 py-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer"
                                                    onClick={() => setOpenCategories(prev => prev.includes(catId) ? prev.filter(x => x !== catId) : [...prev, catId])}
                                                >
                                                    <div className="flex items-center gap-5 flex-1">
                                                        <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300 border border-white/10 group-hover/cat:bg-primary group-hover/cat:text-white transition-all duration-500">
                                                            <CategoryIcon className="h-5 w-5" />
                                                        </div>
                                                        <h4 className="text-lg font-semibold text-zinc-200 group-hover/cat:translate-x-1 transition-transform duration-300">{category.name}</h4>
                                                        <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-300 ${openCategories.includes(catId) ? 'rotate-180' : ''}`} />
                                                    </div>

                                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-primary transition-all rounded-lg" onClick={() => onGenerateNewMap(category.name, catId, `${mindMap.topic} > ${subTopic.name}`, 'background')} disabled={isGlobalBusy}>
                                                                        <Network className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Generate Sub-Map</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-blue-400 transition-all rounded-lg" onClick={() => onExplainInChat(`Detail the category "${category.name}" within ${subTopic.name}.`)}>
                                                                        <MessageCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>AI Chat Assistant</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>

                                                {openCategories.includes(catId) && (
                                                    <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-4 duration-500">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            {category.subCategories.map((sub: any, subIndex: number) => (
                                                                <LeafNodeCard
                                                                    key={subIndex}
                                                                    node={sub}
                                                                    onSubCategoryClick={handleSubCategoryClick}
                                                                    onGenerateImage={handleGenerateImageClick}
                                                                    onExplainInChat={onExplainInChat}
                                                                    onGenerateNewMap={onGenerateNewMap}
                                                                    isGeneratingMap={generatingNode === `node-${index}-${catIndex}-${subIndex}`}
                                                                    mainTopic={mindMap.topic}
                                                                    nodeId={`node-${index}-${catIndex}-${subIndex}`}
                                                                    contextPath={`${mindMap.topic} > ${subTopic.name} > ${category.name} > ${sub.name}`}
                                                                    existingExpansion={nestedExpansions.find(e => e.topic === sub.name)}
                                                                    onOpenMap={onOpenNestedMap}
                                                                    isGlobalBusy={isGlobalBusy}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
};
