
import React from 'react';
import { MindMapData, SubTopic, Category, SubCategory } from '@/types/mind-map';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Flag, CheckCircle2, Circle, ArrowRight, Clock, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RoadmapViewProps {
    data: MindMapData;
    onNodeClick?: (node: any) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ data, onNodeClick }) => {
    // Type narrowing: Roadmap view only supports SingleMindMapData
    if (data.mode === 'compare') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                <Map className="h-12 w-12 text-zinc-700" />
                <h3 className="text-xl font-bold text-zinc-400">Roadmap View Unavailable</h3>
                <p className="text-sm text-zinc-600 max-w-xs">
                    Roadmap view is not available for Comparison maps. Switch back to split view.
                </p>
            </div>
        );
    }

    const phases: SubTopic[] = data.subTopics || [];

    return (
        <div className="w-full h-screen bg-slate-950/50 p-8 pt-24 overflow-hidden flex flex-col">
            <div className="mb-8 space-y-2 shrink-0">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 font-orbitron tracking-tight">
                    {data.topic}
                </h1>
                <p className="text-zinc-400 max-w-2xl text-lg font-light tracking-wide">
                    Strategic Timeline & Execution Plan
                </p>
            </div>

            <ScrollArea className="w-full h-full rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="flex gap-8 p-8 min-w-max">
                    {phases.length === 0 ? (
                        <div className="text-zinc-500 italic">No roadmap phases defined.</div>
                    ) : (
                        phases.map((phase: SubTopic, index: number) => (
                            <PhaseColumn key={index} phase={phase} index={index} onNodeClick={onNodeClick} />
                        ))
                    )}
                </div>
                <ScrollBar orientation="horizontal" className="bg-white/5 p-1" />
            </ScrollArea>
        </div>
    );
};

const PhaseColumn = ({ phase, index, onNodeClick }: { phase: SubTopic; index: number; onNodeClick?: (node: any) => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-[380px] shrink-0 flex flex-col gap-4"
        >
            {/* Phase Header */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 uppercase tracking-widest text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Phase {index + 1}
                    </Badge>
                    <Clock className="w-4 h-4 text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-white font-orbitron tracking-wide mb-1 flex items-center gap-2">
                    {phase.name}
                </h3>
                {phase.thought && (
                    <p className="text-xs text-zinc-400 line-clamp-2">{phase.thought}</p>
                )}
            </div>

            {/* Milestones */}
            <div className="space-y-4">
                {phase.categories.map((milestone: Category, mIndex: number) => (
                    <MilestoneCard key={mIndex} milestone={milestone} index={mIndex} onNodeClick={onNodeClick} />
                ))}
            </div>
        </motion.div>
    );
};

const MilestoneCard = ({ milestone, index, onNodeClick }: { milestone: Category; index: number; onNodeClick?: (node: any) => void }) => {
    return (
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 transition-all duration-300 group cursor-pointer overflow-hidden" onClick={() => onNodeClick && onNodeClick(milestone)}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-50 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold text-zinc-100 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                        <Flag className="w-4 h-4" />
                    </div>
                    <span className="leading-tight group-hover:text-blue-300 transition-colors">{milestone.name}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                {milestone.subCategories && milestone.subCategories.length > 0 && (
                    <div className="space-y-2">
                        <Separator className="bg-white/5" />
                        {milestone.subCategories.map((task: SubCategory, tIndex: number) => (
                            <div key={tIndex} className="flex items-start gap-2.5 text-sm group/task">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover/task:bg-green-400 transition-colors shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-zinc-300 font-medium leading-snug">{task.name}</span>
                                    {task.description && (
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">{task.description}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
