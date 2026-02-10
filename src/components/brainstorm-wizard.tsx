'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Sparkles,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    Check,
    X,
    Info,
    Calendar,
    FileText,
    Presentation,
    GraduationCap,
    ShieldAlert,
    Share2,
    Code2,
    GitBranch,
    CheckCircle2,
    Loader2,
    Plus,
    Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { brainstormWizardAction } from '@/app/actions';
import { BrainstormAspectSchema, BrainstormCategorySchema, BrainstormOutputTypeSchema, BrainstormOutputType } from '@/ai/schemas/brainstorm-wizard-schema';
import { z } from 'zod';
import { useAIConfig } from '@/contexts/ai-config-context';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

type Aspect = z.infer<typeof BrainstormAspectSchema>;
type Category = z.infer<typeof BrainstormCategorySchema>;

interface BrainstormWizardProps {
    isOpen: boolean;
    onClose: () => void;
    topic: string;
    language?: string;
    depth?: string;
    persona?: string;
    onLoadingComplete?: () => void;
}

type WizardStep = 'INIT' | 'SELECT_ASPECTS' | 'SELECT_CATEGORIES' | 'MATERIALIZE_SELECTION' | 'FINALIZING';

export function BrainstormWizard({ isOpen, onClose, topic, language = 'en', depth = 'low', persona = 'Standard', onLoadingComplete }: BrainstormWizardProps) {
    const { config } = useAIConfig();
    const { toast } = useToast();

    const [step, setStep] = useState<WizardStep>('INIT');
    const [aspects, setAspects] = useState<Aspect[]>([]);
    const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
    const [currentAspectIndex, setCurrentAspectIndex] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoriesMap, setSelectedCategoriesMap] = useState<Record<string, string[]>>({});
    const [selectedOutputType, setSelectedOutputType] = useState<BrainstormOutputType>('mindmap');
    const [isLoading, setIsLoading] = useState(false);

    const providerOptions = {
        provider: config.provider,
        apiKey: config.provider === 'pollinations' ? config.pollinationsApiKey : config.apiKey,
    };

    // Reset state when opening to avoid stale data from previous topics
    useEffect(() => {
        if (isOpen) {
            setStep('INIT');
            setAspects([]);
            setSelectedAspects([]);
            setCurrentAspectIndex(0);
            setCategories([]);
            setSelectedCategoriesMap({});
            setSelectedOutputType('mindmap');
            // Start loading immediately if we have a topic to fetch
            setIsLoading(!!topic);
        }
    }, [isOpen, topic]);

    const fetchAspects = useCallback(async () => {
        if (!topic) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        console.log('BrainstormWizard: Fetching aspects for topic:', topic);
        const { response, error } = await brainstormWizardAction({
            step: 'GET_ASPECTS',
            topic,
            language,
            outputType: selectedOutputType
        }, providerOptions);

        if (error || !response || response.step !== 'GET_ASPECTS') {
            console.error('BrainstormWizard: Aspect fetch error:', error, 'Response:', response);
            toast({ variant: 'destructive', title: 'Architect Discovery Failed', description: error || 'Failed to get aspects' });
            onClose();
        } else {
            console.log('BrainstormWizard: Aspects received:', response.aspects.length);
            setAspects(response.aspects);
            setStep('SELECT_ASPECTS');
            onLoadingComplete?.();
        }
        setIsLoading(false);
    }, [topic, language, providerOptions, toast, onClose, onLoadingComplete]);

    useEffect(() => {
        if (isOpen && step === 'INIT' && topic) {
            fetchAspects();
        }
    }, [isOpen, step, topic, fetchAspects]);

    const handleToggleAspect = (name: string) => {
        setSelectedAspects(prev =>
            prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
        );
    };

    const handleNextFromAspects = async () => {
        if (selectedAspects.length === 0) {
            toast({ title: 'Selection Required', description: 'Please select at least one aspect.' });
            return;
        }
        setCurrentAspectIndex(0);
        fetchCategoriesForAspect(selectedAspects[0]);
    };

    const fetchCategoriesForAspect = async (aspectName: string) => {
        setIsLoading(true);
        const { response, error } = await brainstormWizardAction({
            step: 'GET_CATEGORIES',
            topic,
            currentAspect: aspectName,
            language,
            outputType: selectedOutputType
        }, providerOptions);

        if (error || !response || response.step !== 'GET_CATEGORIES') {
            toast({ variant: 'destructive', title: 'Error', description: error || 'Failed to get categories' });
        } else {
            setCategories(response.categories);
            setStep('SELECT_CATEGORIES');
        }
        setIsLoading(false);
    };

    const handleToggleCategory = (catName: string) => {
        const currentAspect = selectedAspects[currentAspectIndex];
        setSelectedCategoriesMap(prev => {
            const current = prev[currentAspect] || [];
            const updated = current.includes(catName)
                ? current.filter(c => c !== catName)
                : [...current, catName];
            return { ...prev, [currentAspect]: updated };
        });
    };

    const handleNextCategoryStep = () => {
        const nextIndex = currentAspectIndex + 1;
        if (nextIndex < selectedAspects.length) {
            setCurrentAspectIndex(nextIndex);
            fetchCategoriesForAspect(selectedAspects[nextIndex]);
        } else {
            setStep('MATERIALIZE_SELECTION');
        }
    };

    const finalizeStudioOutput = async () => {
        setStep('FINALIZING');
        setIsLoading(true);

        console.log(`BrainstormWizard: Finalizing ${selectedOutputType} for topic: `, topic);

        const selections = selectedAspects.reduce<Record<string, string[]>>(
            (acc, aspect) => {
                acc[aspect] = selectedCategoriesMap[aspect] || [];
                return acc;
            },
            {}
        );

        const { response, error } = await brainstormWizardAction(
            {
                step: 'FINALIZE',
                topic,
                language,
                selections,
                depth: depth as any,
                outputType: selectedOutputType
            },
            providerOptions
        );

        if (error) {
            console.error('BrainstormWizard: Finalize error:', error);
            toast({
                variant: 'destructive',
                title: 'Materialization Failed',
                description: error,
            });
            setStep('MATERIALIZE_SELECTION');
            setIsLoading(false);
            return;
        }

        if (!response || response.step !== 'FINALIZE') {
            console.error('BrainstormWizard: Invalid FINALIZE response:', response);
            toast({
                variant: 'destructive',
                title: 'Incomplete AI Output',
                description: 'The AI did not return a valid result. Please try again.',
            });
            setStep('MATERIALIZE_SELECTION');
            setIsLoading(false);
            return;
        }

        console.log('BrainstormWizard: Studio output generated successfully.');

        const studioId = `studio-${Date.now()}`;
        const outputData = {
            type: selectedOutputType,
            topic: topic,
            timestamp: Date.now(),
            // Extract the correct field based on outputType
            data: response.mindMap || response.content || response.quiz || response.social || response.scaffold
        };

        if (!outputData.data) {
            toast({
                variant: 'destructive',
                title: 'Data Extraction Failed',
                description: 'The AI returned a success code but no data was found in the expected fields.',
            });
            setStep('MATERIALIZE_SELECTION');
            setIsLoading(false);
            return;
        }

        // Helper to safely stringify with cycle detection
        const safeStringify = (obj: any) => {
            const seen = new WeakSet();
            return JSON.stringify(obj, (key, value) => {
                if (typeof value === "object" && value !== null) {
                    if (seen.has(value)) {
                        return; // Remove circular reference
                    }
                    seen.add(value);
                }
                return value;
            });
        };

        try {
            sessionStorage.setItem(`studio-data-${studioId}`, safeStringify(outputData));
        } catch (storageError) {
            console.error("Storage failed:", storageError);
            toast({
                variant: 'destructive',
                title: 'Storage Error',
                description: 'Failed to save generated content to session storage.'
            });
            setStep('MATERIALIZE_SELECTION');
            setIsLoading(false);
            return;
        }

        // For now, redirect to canvas with a special flag
        window.location.href = `/canvas?studioId=${studioId}&fromStudio=true&persona=${persona}&lang=${language}`;
    };

    const getMaterializingMessage = () => {
        switch (selectedOutputType) {
            case 'roadmap': return "Calculating your success milestones...";
            case 'dossier': return "Synthesizing deep-dive documentation...";
            case 'pitch': return "Drafting your executive summary...";
            case 'quiz': return "Compiling your study suite...";
            case 'premortem': return "Analyzing potential failure vectors...";
            case 'social': return "Crafting viral content threads...";
            case 'scaffold': return "Engineering your technical boilerplate...";
            default: return "Assembling the neural pathways of your discovery...";
        }
    };

    const getMaterializingTitle = () => {
        switch (selectedOutputType) {
            case 'roadmap': return "Phase Materialization";
            case 'dossier': return "Knowledge Synthesis";
            case 'pitch': return "Executive Alignment";
            case 'quiz': return "Intellectual Compression";
            case 'premortem': return "Predictive Debugging";
            case 'social': return "Viral Manifestation";
            case 'scaffold': return "Molecular Construction";
            default: return "Quantum Materialization";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-zinc-950 border-white/5 rounded-[2.5rem] shadow-2xl ring-1 ring-white/10 h-[80vh] flex flex-col">
                <div className="relative flex-grow flex flex-col overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-20">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{
                                width: step === 'SELECT_ASPECTS' ? '25%' :
                                    step === 'SELECT_CATEGORIES' ? `${25 + (currentAspectIndex / selectedAspects.length) * 25}%` :
                                        step === 'MATERIALIZE_SELECTION' ? '75%' :
                                            '100%'
                            }}
                            className="h-full bg-gradient-to-r from-primary via-purple-500 to-accent shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                        />
                    </div>

                    <div className="relative z-10 p-8 md:p-10 flex-grow flex flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            {isLoading && step !== 'FINALIZING' ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-full space-y-4"
                                >
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                    <DialogTitle className="text-xl font-bold text-white">Initializing Architect</DialogTitle>
                                    <p className="text-zinc-400 font-medium italic">Consulting the Architect...</p>
                                </motion.div>
                            ) : step === 'SELECT_ASPECTS' ? (
                                <motion.div
                                    key="aspects"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 flex flex-col h-full overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <DialogTitle className="text-3xl font-black text-white tracking-tight">Explore the Terrain</DialogTitle>
                                        <DialogDescription className="text-zinc-400">
                                            Pick the core aspects you want to investigate for <span className="text-primary font-bold">"{topic}"</span>.
                                        </DialogDescription>
                                    </div>

                                    <ScrollArea className="flex-grow pr-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                            {aspects.map((aspect) => (
                                                <button
                                                    key={aspect.name}
                                                    onClick={() => handleToggleAspect(aspect.name)}
                                                    className={cn(
                                                        "flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 group",
                                                        selectedAspects.includes(aspect.name)
                                                            ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                                                            : "bg-white/[0.03] border-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-bold text-zinc-100">{aspect.name}</span>
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                            selectedAspects.includes(aspect.name) ? "bg-primary border-primary" : "border-white/20"
                                                        )}>
                                                            {selectedAspects.includes(aspect.name) && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 leading-relaxed italic">{aspect.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <Button
                                        onClick={handleNextFromAspects}
                                        disabled={selectedAspects.length === 0}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl group font-black text-lg shadow-2xl transition-all"
                                    >
                                        Continue to Categories <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </motion.div>
                            ) : step === 'SELECT_CATEGORIES' ? (
                                <motion.div
                                    key="categories"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 flex flex-col h-full overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-bold text-primary uppercase">
                                                Step {currentAspectIndex + 1} of {selectedAspects.length}
                                            </div>
                                        </div>
                                        <DialogTitle className="text-3xl font-black text-white tracking-tight">
                                            Defining: {selectedAspects[currentAspectIndex]}
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-400">
                                            Select the specific sub-categories you want to include in this section.
                                        </DialogDescription>
                                    </div>

                                    <ScrollArea className="flex-grow pr-4">
                                        <div className="grid grid-cols-1 gap-3 pb-4">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.name}
                                                    onClick={() => handleToggleCategory(cat.name)}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group text-left",
                                                        (selectedCategoriesMap[selectedAspects[currentAspectIndex]] || []).includes(cat.name)
                                                            ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                                            : "bg-white/[0.03] border-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                                                        (selectedCategoriesMap[selectedAspects[currentAspectIndex]] || []).includes(cat.name)
                                                            ? "bg-emerald-500/20 border-emerald-500/30"
                                                            : "bg-white/5 border-white/10"
                                                    )}>
                                                        <Sparkles className={cn(
                                                            "w-5 h-5",
                                                            (selectedCategoriesMap[selectedAspects[currentAspectIndex]] || []).includes(cat.name) ? "text-emerald-400" : "text-zinc-500"
                                                        )} />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <span className="text-sm font-bold text-zinc-100 block">{cat.name}</span>
                                                        <p className="text-[10px] text-zinc-500 leading-relaxed italic truncate max-w-[350px]">{cat.description}</p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                        (selectedCategoriesMap[selectedAspects[currentAspectIndex]] || []).includes(cat.name) ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                                                    )}>
                                                        {(selectedCategoriesMap[selectedAspects[currentAspectIndex]] || []).includes(cat.name) && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <div className="flex gap-4">
                                        <Button
                                            onClick={() => setStep('SELECT_ASPECTS')}
                                            variant="ghost"
                                            className="flex-1 h-14 text-zinc-500 hover:text-white rounded-2xl"
                                        >
                                            <ArrowLeft className="mr-2 w-4 h-4" /> Back
                                        </Button>
                                        <Button
                                            onClick={handleNextCategoryStep}
                                            disabled={(selectedCategoriesMap[selectedAspects[currentAspectIndex]] || []).length === 0}
                                            className="flex-[2] h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-lg transition-all"
                                        >
                                            {currentAspectIndex === selectedAspects.length - 1 ? 'Materialize Selection' : 'Next Aspect'} <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : step === 'MATERIALIZE_SELECTION' ? (
                                <motion.div
                                    key="materialize"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col h-full"
                                >
                                    <div className="mb-6">
                                        <h2 className="text-3xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Materialize Your Idea</h2>
                                        <p className="text-zinc-500">How should we bring your brainstorm to life?</p>
                                    </div>

                                    <ScrollArea className="flex-grow pr-4 -mr-4 mb-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { id: 'mindmap', name: 'Mind Map', description: 'Spatial exploration.', icon: Brain, color: 'from-blue-500 to-cyan-500' },
                                                { id: 'roadmap', name: 'Roadmap', description: 'Timed action plan.', icon: Calendar, color: 'from-purple-500 to-indigo-500' },
                                                { id: 'dossier', name: 'Dossier', description: 'Deep-dive research.', icon: FileText, color: 'from-emerald-500 to-teal-500' },
                                                { id: 'pitch', name: 'Executive Pitch', description: 'Professional summary.', icon: Presentation, color: 'from-orange-500 to-red-500' },
                                                { id: 'quiz', name: 'Learning Suite', description: 'Flashcards & Quizzes.', icon: GraduationCap, color: 'from-pink-500 to-rose-500' },
                                                { id: 'premortem', name: 'Pre-Mortem', description: 'Analyze failure risks.', icon: ShieldAlert, color: 'from-amber-500 to-orange-500' },
                                                { id: 'social', name: 'Social Media', description: 'Viral threads & posts.', icon: Share2, color: 'from-sky-500 to-blue-500' },
                                            ].map((format) => (
                                                <button
                                                    key={format.id}
                                                    onClick={() => setSelectedOutputType(format.id as any)}
                                                    className={cn(
                                                        "group flex flex-col items-start p-5 rounded-3xl border transition-all relative overflow-hidden text-left",
                                                        selectedOutputType === format.id
                                                            ? "bg-white/10 border-white/20 ring-1 ring-white/20"
                                                            : "bg-white/5 border-white/5 hover:bg-white/[0.07] hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                                        "bg-gradient-to-br shadow-lg",
                                                        format.color
                                                    )}>
                                                        <format.icon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="font-bold text-white text-lg">{format.name}</h3>
                                                        <p className="text-zinc-500 text-sm leading-tight">{format.description}</p>
                                                    </div>
                                                    {selectedOutputType === format.id && (
                                                        <div className="absolute top-4 right-4 bg-white text-black rounded-full p-1">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <div className="flex gap-4">
                                        <Button
                                            onClick={() => setStep('SELECT_CATEGORIES')}
                                            variant="ghost"
                                            className="flex-1 h-16 text-zinc-500 hover:text-white rounded-2xl"
                                        >
                                            <ArrowLeft className="mr-2 w-4 h-4" /> Back
                                        </Button>
                                        <Button
                                            onClick={finalizeStudioOutput}
                                            className="flex-[2] h-16 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-xl transition-all shadow-xl shadow-white/5"
                                        >
                                            Materialize <Sparkles className="ml-2 w-5 h-5 fill-black" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : step === 'FINALIZING' && (
                                <motion.div
                                    key="finalizing"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center h-full space-y-6 text-center"
                                >
                                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 relative">
                                        <Brain className="w-10 h-10 text-primary animate-pulse" />
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1.2, opacity: 1 }}
                                            transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                                            className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl -z-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <DialogTitle className="text-3xl font-black text-white">{getMaterializingTitle()}</DialogTitle>
                                        <p className="text-zinc-500 max-w-[300px] mx-auto italic">
                                            {getMaterializingMessage()}
                                        </p>
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
