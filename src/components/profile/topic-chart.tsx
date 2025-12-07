'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TopicChartProps {
    data: Array<{ topic: string; count: number }>;
}

const COLORS = [
    '#a855f7', // purple-500
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#14b8a6', // teal-500
    '#6366f1', // indigo-500
];

export function TopicChart({ data }: TopicChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No topics explored yet</p>
            </div>
        );
    }

    const chartData = data.map((item) => ({
        name: item.topic.charAt(0).toUpperCase() + item.topic.slice(1),
        value: item.count,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#fafafa',
                    }}
                />
                <Legend
                    wrapperStyle={{
                        paddingTop: '20px',
                    }}
                    iconType="circle"
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
