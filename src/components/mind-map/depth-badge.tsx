
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepthBadgeProps {
    depth?: 'low' | 'medium' | 'deep';
    className?: string;
}

export const DepthBadge = ({ depth, className }: DepthBadgeProps) => {
    if (!depth) return null;

    const config = {
        low: {
            label: 'Low',
            class: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            nodes: 'Small'
        },
        medium: {
            label: 'Medium',
            class: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            nodes: 'Balanced'
        },
        deep: {
            label: 'Deep',
            class: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            nodes: 'Detailed'
        }
    };

    const style = config[depth] || config.low;

    return (
        <Badge
            variant="outline"
            className={cn(
                "text-[10px] uppercase font-bold tracking-tighter px-2 py-0 h-5 gap-1 border-none",
                style.class,
                className
            )}
        >
            <Layers className="h-2.5 w-2.5" />
            {style.label}
        </Badge>
    );
};
