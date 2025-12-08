'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AchievementBadgeProps {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    unlocked: boolean;
    unlockedAt?: number;
    progress?: { current: number; target: number; label: string };
}

const tierStyles = {
    bronze: {
        gradient: 'from-orange-400 to-orange-600',
        text: 'text-orange-400',
        border: 'border-orange-500/20',
        bg: 'bg-orange-500/10',
        iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    },
    silver: {
        gradient: 'from-slate-300 to-slate-500',
        text: 'text-slate-300',
        border: 'border-slate-400/20',
        bg: 'bg-slate-500/10',
        iconBg: 'bg-gradient-to-br from-slate-300 to-slate-500',
    },
    gold: {
        gradient: 'from-yellow-400 to-yellow-600',
        text: 'text-yellow-400',
        border: 'border-yellow-500/20',
        bg: 'bg-yellow-500/10',
        iconBg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    },
    platinum: {
        gradient: 'from-cyan-400 to-blue-600',
        text: 'text-cyan-400',
        border: 'border-cyan-500/20',
        bg: 'bg-cyan-500/10',
        iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-600',
    },
};

export function AchievementBadge({
    name,
    description,
    icon,
    tier,
    unlocked,
    unlockedAt,
    progress,
}: AchievementBadgeProps) {
    const Icon = (LucideIcons as any)[
        icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-./g, (x) => x[1].toUpperCase())
    ] || LucideIcons.Award;

    const styles = tierStyles[tier];

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-xl border p-4 transition-all duration-500',
                unlocked
                    ? `bg-black/20 hover:bg-black/40 ${styles.border}`
                    : 'bg-dashed border-zinc-800 opacity-60'
            )}
        >
            {/* Ambient Background Glow for Unlocked */}
            {unlocked && (
                <div
                    className={cn(
                        'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br',
                        styles.gradient
                    )}
                />
            )}

            {/* Tier Badge (Top Right) */}
            <div
                className={cn(
                    'absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                    unlocked
                        ? `bg-black/60 ${styles.text} ${styles.border}`
                        : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                )}
            >
                {tier}
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Icon Container */}
                <div className="mb-4">
                    <div
                        className={cn(
                            'inline-flex p-2.5 rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-110',
                            unlocked
                                ? `${styles.iconBg} text-white`
                                : 'bg-zinc-800 text-zinc-600'
                        )}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                </div>

                {/* Title */}
                <h3
                    className={cn(
                        'font-bold text-sm mb-1.5 leading-tight tracking-tight',
                        unlocked ? 'text-zinc-100' : 'text-zinc-500'
                    )}
                >
                    {name}
                </h3>

                {/* Description */}
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-auto line-clamp-3">
                    {description}
                </p>

                {/* Footer: Progress or Date */}
                <div className="mt-4 pt-3 border-t border-white/5 w-full">
                    {unlocked ? (
                        <div className={cn('flex items-center gap-1.5 text-[10px] font-medium', styles.text)}>
                            <LucideIcons.CheckCircle2 className="w-3 h-3" />
                            <span>
                                Unlocked {unlockedAt ? new Date(unlockedAt).toLocaleDateString() : ''}
                            </span>
                        </div>
                    ) : (
                        progress && (
                            <div className="w-full">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[10px] font-medium text-zinc-500">
                                        {progress.current} / {progress.target}
                                    </span>
                                    <span className="text-[10px] font-medium text-zinc-400">
                                        {Math.round(Math.min(100, (progress.current / progress.target) * 100))}%
                                    </span>
                                </div>
                                <Progress
                                    value={Math.min(100, (progress.current / progress.target) * 100)}
                                    className="h-1 bg-zinc-800"
                                // Custom indicator color would require deeper CSS or styled primitive, 
                                // but default white/primary is usually fine. 
                                // We can't easily style inner indicator via standard shadcn props without className on Indicator (which isn't exposed usually).
                                />
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
