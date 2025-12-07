'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsCardProps {
    title: string;
    value: string | number;
    icon: string;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'purple' | 'blue' | 'green' | 'orange' | 'pink';
}

const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400 ring-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
    green: 'bg-green-500/20 text-green-400 ring-green-500/30',
    orange: 'bg-orange-500/20 text-orange-400 ring-orange-500/30',
    pink: 'bg-pink-500/20 text-pink-400 ring-pink-500/30',
};

export function StatisticsCard({
    title,
    value,
    icon,
    subtitle,
    trend,
    color = 'purple',
}: StatisticsCardProps) {
    const Icon = (LucideIcons as any)[icon] || LucideIcons.Activity;

    return (
        <Card className="group relative overflow-hidden bg-zinc-900/50 border-border/50 hover:border-border transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">{title}</p>
                        <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
                        )}
                        {trend && (
                            <div
                                className={cn(
                                    'flex items-center gap-1 text-xs mt-2',
                                    trend.isPositive ? 'text-green-400' : 'text-red-400'
                                )}
                            >
                                {trend.isPositive ? (
                                    <LucideIcons.TrendingUp className="h-3 w-3" />
                                ) : (
                                    <LucideIcons.TrendingDown className="h-3 w-3" />
                                )}
                                <span>{Math.abs(trend.value)}% from last week</span>
                            </div>
                        )}
                    </div>
                    <div
                        className={cn(
                            'p-3 rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110',
                            colorClasses[color]
                        )}
                    >
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
