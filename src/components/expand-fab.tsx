'use client';

import React from 'react';
import { Sparkles, Loader2, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExpandFABProps {
    isVisible: boolean;
    isLoading: boolean;
    onClick: (e: React.MouseEvent) => void;
    className?: string;
}

/**
 * Floating Action Button for expanding mind map nodes inline.
 * Features glassmorphism styling with glow effects and smooth animations.
 */
export function ExpandFAB({
    isVisible,
    isLoading,
    onClick,
    className,
}: ExpandFABProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onClick}
                        disabled={isLoading}
                        className={cn(
                            // Base styles
                            'absolute z-20 flex items-center justify-center',
                            'w-8 h-8 rounded-full',
                            // Glassmorphism
                            'bg-purple-500/20 backdrop-blur-xl',
                            'border border-purple-400/40',
                            // Glow effect
                            'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
                            // Transitions
                            'transition-all duration-300 ease-out',
                            // Visibility animation
                            isVisible
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-75 translate-y-2 pointer-events-none',
                            // Hover states
                            'hover:bg-purple-500/40 hover:border-purple-400/60',
                            'hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]',
                            'hover:scale-110',
                            // Active state
                            'active:scale-95',
                            // Disabled state
                            isLoading && 'cursor-wait',
                            className
                        )}
                        aria-label="Expand node"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 text-purple-300 animate-spin" />
                        ) : (
                            <Network className="h-4 w-4 text-purple-300" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="bg-secondary/90 backdrop-blur-sm border-purple-500/20"
                >
                    <p className="text-xs">
                        {isLoading ? 'Expanding...' : 'Expand deeper'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
