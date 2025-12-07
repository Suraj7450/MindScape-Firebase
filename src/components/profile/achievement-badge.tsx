'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AchievementBadgeProps {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    unlocked: boolean;
    unlockedAt?: number;
}

const tierColors = {
    bronze: {
        bg: 'bg-orange-900/30',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]',
    },
    silver: {
        bg: 'bg-gray-700/30',
        border: 'border-gray-400/30',
        text: 'text-gray-300',
        glow: 'shadow-[0_0_20px_rgba(209,213,219,0.3)]',
    },
    gold: {
        bg: 'bg-yellow-900/30',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
    },
    platinum: {
        bg: 'bg-cyan-900/30',
        border: 'border-cyan-400/30',
        text: 'text-cyan-300',
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
    },
};

export function AchievementBadge({
    name,
    description,
    icon,
    tier,
    unlocked,
    unlockedAt,
}: AchievementBadgeProps) {
    const Icon = (LucideIcons as any)[
        icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-./g, (x) => x[1].toUpperCase())
    ] || LucideIcons.Award;

    const colors = tierColors[tier];

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            'relative p-4 rounded-2xl border transition-all duration-300',
                            'bg-zinc-900/50 backdrop-blur-sm',
                            unlocked
                                ? `${colors.border} ${colors.glow} hover:scale-105 cursor-pointer`
                                : 'border-border/30 opacity-40 grayscale'
                        )}
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div
                                className={cn(
                                    'p-4 rounded-xl',
                                    unlocked ? colors.bg : 'bg-zinc-800/50'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-8 w-8',
                                        unlocked ? colors.text : 'text-muted-foreground'
                                    )}
                                />
                            </div>
                            <div className="text-center">
                                <h4
                                    className={cn(
                                        'text-sm font-semibold mb-1',
                                        unlocked ? 'text-foreground' : 'text-muted-foreground'
                                    )}
                                >
                                    {name}
                                </h4>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        'text-[10px] px-2 py-0.5',
                                        unlocked && colors.text
                                    )}
                                >
                                    {tier.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        {unlocked && (
                            <div className="absolute -top-2 -right-2">
                                <div className="p-1 rounded-full bg-green-500 ring-2 ring-background">
                                    <LucideIcons.Check className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    <div>
                        <p className="font-semibold mb-1">{name}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                        {unlocked && unlockedAt && (
                            <p className="text-xs text-green-400 mt-2">
                                Unlocked {new Date(unlockedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
