'use client';

import React from 'react';
import Image from 'next/image';
import {
    Sparkles,
    TestTube2,
    Images,
    Network,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BreadcrumbNavigation } from '../breadcrumb-navigation';
import { MindMapData } from '@/types/mind-map';
import { MindMapStatus } from '@/hooks/use-mind-map-stack';

interface HeroSectionProps {
    mindMap: MindMapData;
    heroImages?: { left: string; right: string };
    mindMapStack: MindMapData[];
    activeStackIndex: number;
    onStackSelect?: (index: number) => void;
    onOpenAiContent: () => void;
    onOpenGallery: () => void;
    onOpenQuiz: () => void;
    onOpenNestedMaps: () => void;
    isQuizLoading: boolean;
    nestedExpansionsCount: number;
    status: MindMapStatus;
}

export const HeroSection = ({
    mindMap,
    heroImages,
    mindMapStack,
    activeStackIndex,
    onStackSelect,
    onOpenAiContent,
    onOpenGallery,
    onOpenQuiz,
    onOpenNestedMaps,
    isQuizLoading,
    nestedExpansionsCount,
    status,
}: HeroSectionProps) => {
    const isBusy = status !== 'idle';
    return (
        <div className="relative group perspective-2000">
            {/* Depth Shadow Layer */}
            <div className="absolute -inset-4 rounded-2xl bg-black/40 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />

            {/* Animated Glow Border */}
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 via-accent/30 to-primary/30 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000" />

            <div className="relative soft-glass-card glass-inner-glow px-8 py-8 md:px-16 md:py-12 text-center overflow-hidden">
                {/* Background Visualization Layer */}
                <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-2xl">
                    {heroImages && (
                        <div className="flex w-full h-full opacity-30 mix-blend-screen scale-110 group-hover:scale-100 transition-transform duration-[3s]">
                            <div className="w-1/2 relative">
                                <Image
                                    src={heroImages.left}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    style={{ maskImage: 'radial-gradient(circle at 10% 50%, black 0%, transparent 85%)' }}
                                />
                            </div>
                            <div className="w-1/2 relative">
                                <Image
                                    src={heroImages.right}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    style={{ maskImage: 'radial-gradient(circle at 90% 50%, black 0%, transparent 85%)' }}
                                />
                            </div>
                        </div>
                    )}
                    {/* Complex Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.1),transparent_70%)]" />
                </div>

                <div className="flex flex-col items-center relative z-10 w-full max-w-4xl mx-auto">
                    {mindMapStack.length > 1 && onStackSelect && (
                        <div className="mb-4 animate-in slide-in-from-top-4 duration-700">
                            <BreadcrumbNavigation
                                maps={mindMapStack}
                                activeIndex={activeStackIndex}
                                onSelect={onStackSelect}
                                isBusy={isBusy}
                                className="bg-white/5 backdrop-blur-3xl rounded-xl px-6 py-2 border border-white/10 shadow-2xl"
                            />
                        </div>
                    )}

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 leading-[0.95] filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        {mindMap.shortTitle || mindMap.topic}
                    </h1>

                    <p className="mt-6 text-zinc-400 font-medium text-lg max-w-2xl">
                        Explore the intricate layers of {mindMap.topic.toLowerCase()} through our AI-powered visual taxonomy.
                    </p>
                </div>
            </div>
        </div>
    );
};
