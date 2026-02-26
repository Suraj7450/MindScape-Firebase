'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Calendar,
    FileText,
    Presentation,
    GraduationCap,
    ShieldAlert,
    Share2,
    Code2,
    Sparkles,
    Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MindMapData } from '@/types/mind-map';
import { BrainstormOutputType } from '@/ai/schemas/brainstorm-wizard-schema';
import { transformMindMapAction } from '@/app/actions';
import { useAIConfig } from '@/contexts/ai-config-context';

interface TransformStudioDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sourceMap: MindMapData | null;
    onTransformComplete: (data: any, type: BrainstormOutputType) => void;
}

const outputFormats = [
    { id: 'dossier', name: 'Dossier', description: 'Deep-dive research.', icon: FileText, color: 'from-emerald-500 to-teal-500' },
    { id: 'pitch', name: 'Executive Pitch', description: 'Professional summary.', icon: Presentation, color: 'from-orange-500 to-red-500' },
    { id: 'quiz', name: 'Learning Suite', description: 'Flashcards & Quizzes.', icon: GraduationCap, color: 'from-pink-500 to-rose-500' },
    { id: 'premortem', name: 'Pre-Mortem', description: 'Analyze failure risks.', icon: ShieldAlert, color: 'from-amber-500 to-orange-500' },
    { id: 'social', name: 'Social Media', description: 'Viral threads & posts.', icon: Share2, color: 'from-sky-500 to-blue-500' },
] as const;

export function TransformStudioDialog({ isOpen, onClose, sourceMap, onTransformComplete }: TransformStudioDialogProps) {
    const { toast } = useToast();
    const { config } = useAIConfig();
    const [selectedFormat, setSelectedFormat] = useState<BrainstormOutputType>('dossier');
    const [useSearch, setUseSearch] = useState(false);
    const [isTransforming, setIsTransforming] = useState(false);

    const handleTransform = async () => {
        if (!sourceMap) {
            toast({
                variant: 'destructive',
                title: 'No Source Map',
                description: 'Cannot transform without a source mind map.',
            });
            return;
        }

        setIsTransforming(true);

        // Sanitize the sourceMap to remove Firebase Timestamp objects
        // Server actions can't serialize objects with toJSON methods
        const sanitizedMap = JSON.parse(JSON.stringify(sourceMap));

        const providerOptions = {
            apiKey: config.apiKey,
            provider: config.provider,
        };

        const { response, error } = await transformMindMapAction(
            sanitizedMap,
            selectedFormat,
            useSearch, // Pass the search toggle state
            providerOptions
        );

        if (error || !response) {
            toast({
                variant: 'destructive',
                title: 'Transformation Failed',
                description: error || 'Failed to transform mind map.',
            });
            setIsTransforming(false);
            return;
        }

        toast({
            title: 'Transformation Complete',
            description: `Your ${selectedFormat} is ready!`,
        });

        onTransformComplete(response, selectedFormat);
        setIsTransforming(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-black/95 border-white/10">
                <div className="relative flex flex-col max-h-[90vh]">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

                    <div className="relative z-10 p-6 flex flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            {isTransforming ? (
                                <motion.div
                                    key="transforming"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center"
                                >
                                    {/* Animated Icon Container */}
                                    <div className="relative w-24 h-24">
                                        {/* Outer rotating glow */}
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 blur-2xl"
                                        />

                                        {/* Middle pulsing glow */}
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute inset-2 rounded-3xl bg-primary/40 blur-xl"
                                        />

                                        {/* Icon container */}
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="relative w-full h-full rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 backdrop-blur-sm"
                                        >
                                            {/* Rotating sparkles */}
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Sparkles className="w-8 h-8 text-primary" />
                                            </motion.div>
                                        </motion.div>

                                        {/* Orbiting particles */}
                                        {[0, 120, 240].map((angle, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    rotate: 360,
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                    delay: i * 0.4,
                                                }}
                                                className="absolute inset-0"
                                            >
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.5, 1],
                                                        opacity: [0.6, 1, 0.6],
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                        delay: i * 0.2,
                                                    }}
                                                    className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2"
                                                />
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Animated Text */}
                                    <div className="space-y-2">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <DialogTitle className="text-3xl font-black text-white">
                                                Knowledge Studio
                                            </DialogTitle>
                                        </motion.div>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="text-zinc-400 max-w-[300px] mx-auto italic"
                                        >
                                            Synthesizing your mind map into a {selectedFormat}...
                                        </motion.p>

                                        {/* Loading dots */}
                                        <motion.div className="flex justify-center gap-1 pt-2">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{
                                                        scale: [1, 1.5, 1],
                                                        opacity: [0.3, 1, 0.3],
                                                    }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                        delay: i * 0.2,
                                                    }}
                                                    className="w-2 h-2 bg-primary rounded-full"
                                                />
                                            ))}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="selection"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col"
                                >
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                            Knowledge Studio
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-500 text-xs">
                                            Convert "{sourceMap?.topic || 'this map'}" into a different format.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="overflow-y-auto max-h-[50vh] pr-2 mb-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            {outputFormats.map((format) => (
                                                <button
                                                    key={format.id}
                                                    type="button"
                                                    onClick={() => setSelectedFormat(format.id as BrainstormOutputType)}
                                                    className={cn(
                                                        "group flex flex-col items-start p-3 rounded-xl border transition-all relative overflow-hidden text-left",
                                                        selectedFormat === format.id
                                                            ? "bg-white/10 border-white/20 ring-1 ring-white/10"
                                                            : "bg-white/5 border-white/5 hover:bg-white/[0.07] hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
                                                        "bg-gradient-to-br shadow-lg",
                                                        format.color
                                                    )}>
                                                        <format.icon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <h3 className="font-bold text-white text-sm">{format.name}</h3>
                                                        <p className="text-zinc-500 text-[10px] leading-tight">{format.description}</p>
                                                    </div>
                                                    {selectedFormat === format.id && (
                                                        <div className="absolute top-2 right-2 bg-white text-black rounded-full p-0.5">
                                                            <Sparkles className="w-2.5 h-2.5" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 items-center">
                                        {/* Search Toggle */}
                                        <div
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors"
                                            onClick={() => setUseSearch(!useSearch)}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded flex items-center justify-center transition-colors",
                                                useSearch ? "bg-blue-500 text-white" : "bg-zinc-700 text-zinc-400"
                                            )}>
                                                {useSearch && <Sparkles className="w-3 h-3" />}
                                            </div>
                                            <span className="text-sm font-medium text-zinc-300 select-none">Web Search</span>
                                        </div>

                                        <Button
                                            onClick={onClose}
                                            variant="ghost"
                                            className="h-12 text-zinc-500 hover:text-white rounded-xl"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleTransform}
                                            className="flex-1 h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-base transition-all shadow-xl shadow-white/5"
                                        >
                                            {useSearch ? (
                                                <span className="flex items-center">
                                                    Research & Transform <Sparkles className="ml-2 w-4 h-4 fill-black" />
                                                </span>
                                            ) : (
                                                <span className="flex items-center">
                                                    Transform <Sparkles className="ml-2 w-4 h-4 fill-black" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
