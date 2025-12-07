'use client';

import React from 'react';
import { format, startOfYear, eachDayOfInterval, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface CalendarHeatmapProps {
    data: Array<{ date: string; count: number }>;
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
    const today = new Date();
    const yearStart = startOfYear(today);
    const days = eachDayOfInterval({ start: yearStart, end: endOfDay(today) });

    // Create a map for quick lookup
    const dataMap = new Map(data.map((d) => [d.date, d.count]));

    // Group days by week
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach((day, index) => {
        if (index > 0 && day.getDay() === 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    // Get color based on activity count
    const getColor = (count: number) => {
        if (count === 0) return 'bg-zinc-800/50';
        if (count < 5) return 'bg-purple-500/20';
        if (count < 10) return 'bg-purple-500/40';
        if (count < 20) return 'bg-purple-500/60';
        return 'bg-purple-500/80';
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="inline-flex flex-col gap-1 p-4">
                {/* Month labels */}
                <div className="flex gap-1 mb-2 ml-8">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                        (month, i) => (
                            <div
                                key={month}
                                className="text-[10px] text-muted-foreground"
                                style={{ width: `${100 / 12}%`, textAlign: 'left' }}
                            >
                                {month}
                            </div>
                        )
                    )}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-1">
                    {/* Day labels */}
                    <div className="flex flex-col gap-1 justify-around text-[10px] text-muted-foreground pr-2">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>

                    {/* Weeks */}
                    <div className="flex gap-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                                    const day = week.find((d) => d.getDay() === dayOfWeek);
                                    if (!day) {
                                        return <div key={dayOfWeek} className="w-3 h-3" />;
                                    }

                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const count = dataMap.get(dateStr) || 0;

                                    return (
                                        <TooltipProvider key={dateStr} delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            'w-3 h-3 rounded-sm transition-all duration-200 hover:ring-2 hover:ring-purple-400 cursor-pointer',
                                                            getColor(count)
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <div className="text-xs">
                                                        <p className="font-semibold">
                                                            {format(day, 'MMM d, yyyy')}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {count === 0
                                                                ? 'No activity'
                                                                : `${count} activity point${count !== 1 ? 's' : ''}`}
                                                        </p>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-zinc-800/50" />
                        <div className="w-3 h-3 rounded-sm bg-purple-500/20" />
                        <div className="w-3 h-3 rounded-sm bg-purple-500/40" />
                        <div className="w-3 h-3 rounded-sm bg-purple-500/60" />
                        <div className="w-3 h-3 rounded-sm bg-purple-500/80" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
