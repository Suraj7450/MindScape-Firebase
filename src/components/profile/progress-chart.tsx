'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface ProgressChartProps {
    activityData: Record<string, { mapsCreated: number }>;
    days?: number;
}

export function ProgressChart({ activityData, days = 30 }: ProgressChartProps) {
    const today = new Date();
    const chartData = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const activity = activityData[dateStr];

        chartData.push({
            date: format(date, 'MMM d'),
            maps: activity?.mapsCreated || 0,
        });
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#a1a1aa' }}
                />
                <YAxis
                    stroke="#71717a"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#a1a1aa' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#fafafa',
                    }}
                    labelStyle={{ color: '#a1a1aa' }}
                />
                <Line
                    type="monotone"
                    dataKey="maps"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
