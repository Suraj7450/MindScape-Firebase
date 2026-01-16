import React from 'react';
import {
    ChevronRight,
    BrainCircuit,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MindMapData } from '@/types/mind-map';
import Image from 'next/image';

interface TopicHeaderProps {
    mindMap: MindMapData;
    mindMapStack: MindMapData[];
    activeStackIndex: number;
    onStackSelect?: (index: number) => void;
    description?: string;
    showBadge?: boolean;
    badgeText?: string;
}

export const TopicHeader = ({
    mindMap,
    mindMapStack,
    activeStackIndex,
    onStackSelect,
    description,
    showBadge,
    badgeText
}: TopicHeaderProps) => {
    return (
        <div className="relative mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* Premium Container - Full background image with overlay */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090b] shadow-2xl min-h-[220px] group transition-all duration-500 hover:border-primary/30">

                {/* Full-width Background Image */}
                {mindMap.thumbnailUrl && (
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        {/* The Blend Mask: Stronger dark overlay on the left for text legibility, fading to transparent */}
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 via-40% to-transparent" />
                        <Image
                            src={mindMap.thumbnailUrl}
                            alt={mindMap.topic}
                            fill
                            className="object-cover opacity-60 transition-all [transition-duration:3000ms] ease-out group-hover:scale-110"
                            priority
                        />
                    </div>
                )}

                {/* Content Layer - Positioned over the full background */}
                <div className="relative z-10 flex flex-col justify-center h-full p-8 md:px-14 md:py-12 max-w-full min-h-[220px]">

                    {/* Badge Integration */}
                    {showBadge && (
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black tracking-[0.2em] uppercase backdrop-blur-md">
                                <Sparkles className="h-3.5 w-3.5" />
                                {badgeText || 'Mind Map'}
                            </div>
                        </div>
                    )}

                    {/* Breadcrumbs / Navigation Stack */}
                    {mindMapStack.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            {mindMapStack.slice(0, activeStackIndex + 1).map((stackItem, idx) => (
                                <React.Fragment key={idx}>
                                    <button
                                        onClick={() => onStackSelect?.(idx)}
                                        className={cn(
                                            "text-[10px] font-black uppercase tracking-widest transition-all",
                                            idx === activeStackIndex
                                                ? "text-primary/90"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        {stackItem.shortTitle || stackItem.topic}
                                    </button>
                                    {idx < activeStackIndex && (
                                        <ChevronRight className="w-3 h-3 text-zinc-700" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4 max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] transition-transform duration-500 group-hover:-translate-x-1">
                            {mindMap.topic}
                        </h1>
                        {description && (
                            <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed max-w-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Animated Background Glow */}
                <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-[120px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse" />

                {/* Decorative Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />
            </div>
        </div>
    );
};
