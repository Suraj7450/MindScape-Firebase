'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import {
    CheckCircle2,
    ExternalLink,
    Target,
    Layers,
    Sparkles,
    ArrowRight,
    Copy,
    MessageCircle,
    Network,
    Loader2,
    CheckIcon,
    Image as ImageIcon,
    ChevronDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    CompareMindMapData,
    CompareNode,
    MindMapData,
    NestedExpansionItem,
    SubCategory
} from '@/types/mind-map';
import { toPascalCase } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TopicHeader } from './topic-header';

interface CompareViewProps {
    data: CompareMindMapData;
    onExplainNode?: (node: CompareNode) => void;
    onGenerateNewMap?: (topic: string, nodeId: string, contextPath: string, mode?: 'foreground' | 'background') => void;
    onExplainInChat?: (message: string) => void;
    onSubCategoryClick?: (node: CompareNode) => void;
    onOpenMap?: (mapData: MindMapData, id: string) => void;
    onGenerateImage?: (node: SubCategory) => void;
    generatingNode?: string | null;
    nestedExpansions?: NestedExpansionItem[];
    isGlobalBusy?: boolean;
    openNodes?: string[];
    onOpenNodesChange?: (nodes: string[]) => void;
}

export const CompareView = ({
    data,
    onExplainNode,
    onGenerateNewMap,
    onExplainInChat,
    onSubCategoryClick,
    onOpenMap,
    onGenerateImage,
    generatingNode,
    nestedExpansions = [],
    isGlobalBusy = false,
    openNodes = [],
    onOpenNodesChange
}: CompareViewProps) => {
    const { compareData } = data;

    const commonProps = {
        onGenerateNewMap,
        onExplainInChat,
        onSubCategoryClick,
        onOpenMap,
        onGenerateImage,
        generatingNode,
        nestedExpansions,
        isGlobalBusy,
        mainTopic: data.topic,
        openNodes,
        onOpenNodesChange
    };

    return (
        <div className="space-y-12 max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-1000">
            {/* Header */}
            <TopicHeader
                mindMap={data}
                mindMapStack={[]} // Breadcrumbs not yet fully implemented for compare in terms of persistent stack, but component handles it
                activeStackIndex={0}
                description={compareData.root.description}
                showBadge={true}
                badgeText="Comparative Intelligence"
            />

            {/* Similarities Section */}
            <Accordion type="multiple" value={openNodes} onValueChange={onOpenNodesChange}>
                <AccordionItem value="section-commonalities" className="border-none">
                    <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
                        <AccordionTrigger
                            className="flex hover:no-underline px-8 py-6 border-b border-zinc-800/50 bg-white/[0.02] [&>svg]:hidden"
                        >
                            <CardTitle className="flex items-center justify-between w-full text-2xl font-bold text-zinc-100 uppercase tracking-tight">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                    Core Commonalities
                                </div>
                                <ChevronDown className={cn("h-6 w-6 text-zinc-600 transition-transform duration-500", openNodes.includes('section-commonalities') ? "rotate-180 text-primary" : "")} />
                            </CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {compareData.similarities.filter(n => !!n).map((node, i) => (
                                        <CompareNodeItem key={i} node={node} {...commonProps} />
                                    ))}
                                </div>
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            </Accordion>

            {/* Differences Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Topic A Differences */}
                <Accordion type="multiple" value={openNodes} onValueChange={onOpenNodesChange}>
                    <AccordionItem value="section-diff-a" className="border-none">
                        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 h-full">
                            <AccordionTrigger
                                className="flex hover:no-underline px-8 py-6 border-b border-zinc-800/50 bg-red-400/5 [&>svg]:hidden"
                            >
                                <CardTitle className="text-xl font-bold text-red-100 uppercase tracking-tight flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <span>{compareData.root.title.split(' vs ')[0] || 'Topic A'}</span>
                                        <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/5 uppercase font-bold text-[10px]">Unique Perspective</Badge>
                                    </div>
                                    <ChevronDown className={cn("h-5 w-5 text-zinc-600 transition-transform duration-500", openNodes.includes('section-diff-a') ? "rotate-180 text-primary" : "")} />
                                </CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <CardContent className="p-8 space-y-6">
                                    {compareData.differences.topicA.filter(n => !!n).map((node, i) => (
                                        <CompareNodeItem key={i} node={node} layout="horizontal" {...commonProps} />
                                    ))}
                                </CardContent>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                </Accordion>

                {/* Topic B Differences */}
                <Accordion type="multiple" value={openNodes} onValueChange={onOpenNodesChange}>
                    <AccordionItem value="section-diff-b" className="border-none">
                        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 h-full">
                            <AccordionTrigger
                                className="flex hover:no-underline px-8 py-6 border-b border-zinc-800/50 bg-blue-400/5 [&>svg]:hidden"
                            >
                                <CardTitle className="text-xl font-bold text-blue-100 uppercase tracking-tight flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <span>{compareData.root.title.split(' vs ')[1] || 'Topic B'}</span>
                                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 uppercase font-bold text-[10px]">Unique Perspective</Badge>
                                    </div>
                                    <ChevronDown className={cn("h-5 w-5 text-zinc-600 transition-transform duration-500", openNodes.includes('section-diff-b') ? "rotate-180 text-primary" : "")} />
                                </CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <CardContent className="p-8 space-y-6">
                                    {compareData.differences.topicB.filter(n => !!n).map((node, i) => (
                                        <CompareNodeItem key={i} node={node} layout="horizontal" {...commonProps} />
                                    ))}
                                </CardContent>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* Deep Dive Section */}
            <Accordion type="multiple" value={openNodes} onValueChange={onOpenNodesChange}>
                <AccordionItem value="section-deep-dive" className="border-none">
                    <div className="space-y-8">
                        <AccordionTrigger
                            className="flex hover:no-underline px-2 py-4 [&>svg]:hidden"
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                        <Layers className="h-6 w-6 text-primary" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-zinc-100 uppercase tracking-tight">Structured Deep Dives</h2>
                                </div>
                                <ChevronDown className={cn("h-8 w-8 text-zinc-600 transition-transform duration-500", openNodes.includes('section-deep-dive') ? "rotate-180 text-primary" : "")} />
                            </div>
                        </AccordionTrigger>

                        <AccordionContent className="pb-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                                {/* Topic A Deep Dive */}
                                <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 h-full">
                                    <CardHeader className="border-b border-zinc-800/50 bg-white/[0.01] px-8 py-5">
                                        <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                            {compareData.root.title.split(' vs ')[0] || 'Topic A'} Deep Dive
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-4">
                                        {compareData.topicADeepDive.filter(n => !!n).length > 0 ? (
                                            compareData.topicADeepDive.filter(n => !!n).map((node, i) => (
                                                <CompareNodeItem key={i} node={node} collapsible {...commonProps} />
                                            ))
                                        ) : (
                                            <p className="text-sm text-zinc-500 italic text-center py-4">No deep dive data available for this topic.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Topic B Deep Dive */}
                                <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 h-full">
                                    <CardHeader className="border-b border-zinc-800/50 bg-white/[0.01] px-8 py-5">
                                        <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            {compareData.root.title.split(' vs ')[1] || 'Topic B'} Deep Dive
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-4">
                                        {compareData.topicBDeepDive.filter(n => !!n).length > 0 ? (
                                            compareData.topicBDeepDive.filter(n => !!n).map((node, i) => (
                                                <CompareNodeItem key={i} node={node} collapsible {...commonProps} />
                                            ))
                                        ) : (
                                            <p className="text-sm text-zinc-500 italic text-center py-4">No deep dive data available for this topic.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </AccordionContent>
                    </div>
                </AccordionItem>
            </Accordion>

            {/* Relevant Links */}
            {compareData.relevantLinks && compareData.relevantLinks.length > 0 && (
                <Accordion type="multiple" value={openNodes} onValueChange={onOpenNodesChange}>
                    <AccordionItem value="section-resources" className="border-none">
                        <div className="space-y-6">
                            <AccordionTrigger
                                className="flex hover:no-underline px-2 py-2 [&>svg]:hidden"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <ExternalLink className="h-6 w-6 text-amber-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-zinc-100 uppercase tracking-tight">Intelligence Resources</h2>
                                    </div>
                                    <ChevronDown className={cn("h-6 w-6 text-zinc-600 transition-transform duration-500", openNodes.includes('section-resources') ? "rotate-180 text-primary" : "")} />
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className="pb-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {compareData.relevantLinks.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-500 p-6 flex flex-col h-full shadow-lg ring-1 ring-white/5"
                                        >
                                            <div className="absolute top-0 right-0 p-3 text-zinc-600 group-hover:text-primary transition-colors">
                                                <ExternalLink className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-base font-bold text-zinc-100 mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
                                                {link.title || 'Educational Resource'}
                                            </h4>
                                            <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors line-clamp-2 leading-relaxed">
                                                {link.description || 'Deep dive into specialized research and official documentation for this topic.'}
                                            </p>
                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 group-hover:text-zinc-400">
                                                    Visit Resource
                                                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </AccordionContent>
                        </div>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
};

const CompareNodeItem = ({
    node,
    layout = 'vertical',
    collapsible = false,
    onGenerateNewMap,
    onExplainInChat,
    onSubCategoryClick,
    onOpenMap,
    onGenerateImage,
    generatingNode,
    nestedExpansions = [],
    isGlobalBusy = false,
    mainTopic,
    openNodes = [],
    onOpenNodesChange
}: {
    node: CompareNode,
    layout?: 'vertical' | 'horizontal',
    collapsible?: boolean,
    onGenerateNewMap?: (topic: string, nodeId: string, contextPath: string, mode?: 'foreground' | 'background') => void,
    onExplainInChat?: (message: string) => void,
    onSubCategoryClick?: (node: CompareNode) => void,
    onOpenMap?: (mapData: MindMapData, id: string) => void,
    onGenerateImage?: (node: SubCategory) => void,
    generatingNode?: string | null,
    nestedExpansions?: NestedExpansionItem[],
    isGlobalBusy?: boolean,
    mainTopic: string,
    openNodes?: string[],
    onOpenNodesChange?: (nodes: string[]) => void
}) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = React.useState(false);
    const Icon = (LucideIcons as any)[toPascalCase(node.icon || 'circle')] || Target;
    const nodeId = node.id || node.title;
    const isGenerating = generatingNode === nodeId;
    const existingExpansion = nestedExpansions.find(e => e.topic === node.title);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = `${node.title}${node.description ? ': ' + node.description : ''}`;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast({ title: "Copied", description: "Node content copied to clipboard." });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onGenerateNewMap) {
            onGenerateNewMap(node.title, nodeId, `Comparison > ${mainTopic} > ${node.title}`, 'background');
        }
    };

    const handleExplain = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onExplainInChat) {
            onExplainInChat(`Explain "${node.title}" within the context of ${mainTopic}.`);
        }
    };

    const handleImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onGenerateImage) {
            onGenerateImage({
                name: node.title,
                description: node.description || '',
                icon: node.icon || 'circle',
                tags: node.tags || [],
                isExpanded: false
            });
        }
    };

    const content = (
        <Card
            className="group/item relative h-full cursor-pointer rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-primary/40 hover:shadow-[0_0_40_rgba(139,92,246,0.1)] transition-all duration-500 overflow-hidden flex flex-col"
            onClick={() => onSubCategoryClick?.(node)}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 p-5 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover/item:scale-110 group-hover/item:bg-primary group-hover/item:text-white transition-all duration-500">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-zinc-100 leading-snug group-hover/item:text-white transition-colors">
                            {node.title}
                        </h4>
                        <div className="flex items-center mt-1 gap-2">
                            {existingExpansion && <Badge variant="outline" className="text-[10px] h-4 py-0 px-1.5 border-emerald-500/30 text-emerald-400 font-medium bg-emerald-500/5">Expanded</Badge>}
                        </div>
                    </div>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed mb-6 flex-grow group-hover/item:text-zinc-300 transition-colors">
                    {node.description || "Detailed analysis for this comparison point."}
                </p>

                <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-white/5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8 rounded-lg transition-all",
                                            existingExpansion ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-primary hover:bg-primary/10'
                                        )}
                                        onClick={(e) => {
                                            if (existingExpansion?.fullData && onOpenMap) {
                                                onOpenMap(existingExpansion.fullData, existingExpansion.id);
                                            } else {
                                                handleExpand(e);
                                            }
                                        }}
                                        disabled={isGenerating || isGlobalBusy}
                                    >
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="glassmorphism"><p>Generate Sub-Map</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-pink-400 hover:bg-pink-400/10 transition-all" onClick={handleImage}>
                                        <ImageIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="glassmorphism"><p>Visual Insight</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all" onClick={handleExplain}>
                                        <MessageCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="glassmorphism"><p>Ask AI Assistant</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all" onClick={handleCopy}>
                                        {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="glassmorphism"><p>{isCopied ? 'Copied!' : 'Copy Context'}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSubCategoryClick?.(node);
                        }}
                        variant="ghost"
                        className="h-8 py-0 px-3 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-full group-hover/item:bg-primary/20 group-hover/item:text-primary transition-all flex items-center gap-1"
                    >
                        Details <ArrowRight className="w-3 h-3 group-hover/item:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </Card >
    );

    if (collapsible && node.children && node.children.length > 0) {
        return (
            <Accordion
                type="multiple"
                value={openNodes}
                onValueChange={onOpenNodesChange}
                className="w-full"
            >
                <AccordionItem value={node.id || node.title} className="border-none">
                    <AccordionTrigger className="p-0 hover:no-underline rounded-2xl [&>svg]:hidden mb-1">
                        <div className="w-full text-left">{content}</div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pl-6 space-y-3 border-l border-white/5 ml-6 animate-in slide-in-from-left-2 duration-500">
                        {node.children.map((child, i) => (
                            <CompareNodeItem
                                key={i}
                                node={child}
                                collapsible
                                onGenerateNewMap={onGenerateNewMap}
                                onExplainInChat={onExplainInChat}
                                onSubCategoryClick={onSubCategoryClick}
                                onOpenMap={onOpenMap}
                                onGenerateImage={onGenerateImage}
                                generatingNode={generatingNode}
                                nestedExpansions={nestedExpansions}
                                isGlobalBusy={isGlobalBusy}
                                mainTopic={mainTopic}
                                openNodes={openNodes}
                                onOpenNodesChange={onOpenNodesChange}
                            />
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        );
    }

    return content;
};
